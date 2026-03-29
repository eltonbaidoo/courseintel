"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, AlertCircle, BarChart2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/app-store";
import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";
import {
  devCredentialsMatch,
  devSessionEmail,
  DEV_USER_ID,
  setDevSessionClient,
} from "@/lib/dev-auth";

// ─── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_YEARS = [
  "Freshman (1st year)",
  "Sophomore (2nd year)",
  "Junior (3rd year)",
  "Senior (4th year)",
  "Graduate student",
  "Other",
] as const;

const PEEK_H = 68; // visible peek height when closed

const UNIVERSITIES = [
  "Massachusetts Institute of Technology","Harvard University","Stanford University","California Institute of Technology",
  "University of Chicago","Princeton University","Yale University","Columbia University","University of Pennsylvania",
  "Duke University","Johns Hopkins University","Northwestern University","Dartmouth College","Brown University",
  "Vanderbilt University","Rice University","Washington University in St. Louis","Cornell University","Notre Dame University",
  "Georgetown University","Emory University","Carnegie Mellon University","University of California, Berkeley",
  "University of California, Los Angeles","University of California, San Diego","University of California, Santa Barbara",
  "University of California, Davis","University of California, Irvine","University of Michigan","University of Virginia",
  "University of North Carolina at Chapel Hill","Wake Forest University","Tufts University","Boston College",
  "Boston University","Northeastern University","New York University","Fordham University","Syracuse University",
  "Rensselaer Polytechnic Institute","Georgia Institute of Technology","University of Florida","University of Georgia",
  "Florida State University","University of Alabama","Auburn University","Clemson University","University of South Carolina",
  "University of Tennessee","University of Kentucky","University of Louisville","University of Texas at Austin",
  "Texas A&M University","Southern Methodist University","Texas Christian University","Baylor University","Rice University",
  "University of Arizona","Arizona State University","University of Colorado Boulder","Colorado State University",
  "University of Utah","Brigham Young University","University of Washington","Washington State University",
  "Oregon State University","University of Oregon","University of Nevada, Las Vegas","University of Nevada, Reno",
  "University of New Mexico","University of Oklahoma","Oklahoma State University","University of Kansas","Kansas State University",
  "University of Nebraska","University of Iowa","Iowa State University","University of Minnesota","University of Wisconsin-Madison",
  "Marquette University","University of Illinois Urbana-Champaign","Illinois Institute of Technology","DePaul University",
  "Loyola University Chicago","University of Indiana","Purdue University","Ohio State University","Case Western Reserve University",
  "University of Cincinnati","Miami University","University of Dayton","Michigan State University","Wayne State University",
  "University of Pittsburgh","Penn State University","Temple University","Drexel University","Villanova University",
  "Rutgers University","University of Delaware","University of Maryland","Howard University","American University",
  "George Washington University","Georgetown University","University of Miami","Florida International University",
  "University of Central Florida","University of South Florida","Tulane University","Louisiana State University",
  "University of Mississippi","Mississippi State University","University of Arkansas","University of Missouri",
  "Saint Louis University","University of Denver","University of Montana","University of Idaho","Boise State University",
  "University of Hawaii","University of Alaska","Oxford University","Cambridge University","Imperial College London",
  "University College London","London School of Economics","University of Edinburgh","University of Toronto",
  "University of British Columbia","McGill University","University of Montreal","University of Alberta",
  "University of Waterloo","Queens University","Western University","University of Melbourne","University of Sydney",
  "Australian National University","University of Queensland","ETH Zurich","University of Amsterdam",
  "National University of Singapore","University of Tokyo","Seoul National University","Peking University",
  "Tsinghua University","University of Hong Kong","KAIST","Yonsei University","Korea University",
].sort();

// ─── School autocomplete ──────────────────────────────────────────────────────

function SchoolAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]           = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [manual, setManual]       = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const matches = value.trim().length >= 2
    ? UNIVERSITIES.filter((u) => u.toLowerCase().includes(value.toLowerCase())).slice(0, 7)
    : [];

  // "Other" always appears at the bottom of the dropdown when it's open
  const totalItems = matches.length + 1; // +1 for Other

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, totalItems - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      if (activeIdx < matches.length) { onChange(matches[activeIdx]); setOpen(false); setActiveIdx(-1); }
      else { setManual(true); onChange(""); setOpen(false); setActiveIdx(-1); }
    }
    if (e.key === "Escape") setOpen(false);
  }

  function select(school: string) { onChange(school); setOpen(false); setActiveIdx(-1); inputRef.current?.blur(); }
  function selectOther() { setManual(true); onChange(""); setOpen(false); setActiveIdx(-1); setTimeout(() => inputRef.current?.focus(), 50); }
  function exitManual() { setManual(false); onChange(""); setTimeout(() => inputRef.current?.focus(), 50); }

  const showDropdown = open && (matches.length > 0 || value.trim().length >= 2);

  if (manual) {
    return (
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#be6441"; }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = "#3a2218"; }}
          placeholder="Type your school name"
          autoComplete="off"
          style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3a2218", padding: "7px 0", fontSize: 13, color: "#f0e8df", outline: "none", boxSizing: "border-box" as const }}
        />
        <button
          type="button"
          onClick={exitManual}
          style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 11, color: "#6b4a38", cursor: "pointer", padding: "2px 0", transition: "color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#be6441"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#6b4a38"; }}
        >
          Search instead
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActiveIdx(-1); }}
        onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#be6441"; setOpen(true); }}
        onBlur={(e) => { e.currentTarget.style.borderBottomColor = "#3a2218"; }}
        onKeyDown={handleKeyDown}
        placeholder="Your university"
        autoComplete="off"
        style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3a2218", padding: "7px 0", fontSize: 13, color: "#f0e8df", outline: "none", boxSizing: "border-box" as const }}
      />
      {/* Dropdown */}
      <div
        style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
          background: "#1e140e", border: "1px solid rgba(190,100,65,0.18)", borderRadius: 10,
          overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          opacity: showDropdown ? 1 : 0,
          transform: showDropdown ? "translateY(0)" : "translateY(-6px)",
          pointerEvents: showDropdown ? "auto" : "none",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        {matches.map((school, i) => (
          <div
            key={school}
            onMouseDown={(e) => { e.preventDefault(); select(school); }}
            onMouseEnter={() => setActiveIdx(i)}
            style={{
              padding: "9px 14px", fontSize: 13, cursor: "pointer",
              color: i === activeIdx ? "#f0e8df" : "#9a7055",
              background: i === activeIdx ? "rgba(190,100,65,0.12)" : "transparent",
              transition: "background 0.12s ease, color 0.12s ease",
              borderBottom: "1px solid rgba(58,34,24,0.5)",
            }}
          >
            {school}
          </div>
        ))}
        {/* Other option */}
        <div
          onMouseDown={(e) => { e.preventDefault(); selectOther(); }}
          onMouseEnter={() => setActiveIdx(matches.length)}
          style={{
            padding: "9px 14px", fontSize: 13, cursor: "pointer",
            color: activeIdx === matches.length ? "#f0e8df" : "#6b4a38",
            background: activeIdx === matches.length ? "rgba(190,100,65,0.08)" : "transparent",
            transition: "background 0.12s ease, color 0.12s ease",
            fontStyle: "italic",
          }}
        >
          Other — type manually
        </div>
      </div>
    </div>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function FloatingCards() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-espresso-950">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(190,100,65,0.06) 0%, transparent 70%)" }}
      />
      <div className="absolute left-8 top-8">
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-almond-cream-500 transition-all duration-200 hover:bg-espresso-900/60 hover:text-almond-cream-200">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <div className="absolute bottom-8 left-8 right-8">
        <p className="font-condensed text-xs font-semibold uppercase tracking-widest text-espresso-600">Academic Intelligence</p>
        <p className="mt-1 text-sm text-almond-cream-500/60">Everything you need to know about your courses — in one place.</p>
      </div>

      <div className="relative h-72 w-80">
        {/* Card 3 — grading breakdown */}
        <div className="absolute inset-x-0 top-6 mx-auto w-72 rounded-2xl border border-espresso-800/60 bg-espresso-900/80 p-4 shadow-xl backdrop-blur-sm" style={{ transform: "rotate(4deg) translateY(8px)", animation: "floatC 7s ease-in-out infinite 1.5s" }}>
          <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-espresso-600">
            <BarChart2 className="h-3.5 w-3.5" />Grade breakdown
          </div>
          <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-espresso-950">
            <div className="h-full w-[35%] rounded-l-full bg-burnt-peach-500" />
            <div className="h-full w-[25%] bg-burnt-peach-400" />
            <div className="h-full w-[25%] bg-almond-cream-500" />
            <div className="h-full w-[15%] rounded-r-full bg-almond-cream-700" />
          </div>
          <div className="mt-1.5 flex gap-3 text-[10px] font-mono text-espresso-600">
            <span>Exams 35%</span><span>Labs 25%</span><span>HW 25%</span>
          </div>
        </div>

        {/* Card 2 — deadlines */}
        <div className="absolute inset-x-0 top-12 mx-auto w-72 rounded-2xl border border-espresso-800/70 bg-shadow-grey-900/90 p-4 shadow-xl backdrop-blur-sm" style={{ transform: "rotate(-3deg)", animation: "floatB 6s ease-in-out infinite 0.8s" }}>
          <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-espresso-600">
            <AlertCircle className="h-3.5 w-3.5 text-burnt-peach-500" />This week
          </div>
          <div className="flex items-center justify-between rounded-xl border border-espresso-800/50 bg-espresso-900/60 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-burnt-peach-500" />
              <span className="text-sm font-medium text-almond-cream-300">Midterm exam, Thursday</span>
            </div>
            <span className="font-mono text-xs font-semibold text-burnt-peach-400">HIGH</span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl border border-espresso-800/50 bg-espresso-900/60 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-almond-cream-600" />
              <span className="text-sm font-medium text-almond-cream-400">Lab 5 due, Wednesday</span>
            </div>
            <span className="font-mono text-xs text-almond-cream-500">MED</span>
          </div>
        </div>

        {/* Card 1 — grade hero */}
        <div className="absolute inset-x-0 top-20 mx-auto w-72 rounded-2xl border border-espresso-700/80 bg-shadow-grey-900 p-5 shadow-2xl backdrop-blur-sm" style={{ transform: "rotate(1deg)", animation: "floatA 5s ease-in-out infinite" }}>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-espresso-600">Course profile</span>
            <span className="rounded-lg bg-burnt-peach-500 px-2.5 py-1 font-mono text-xs font-bold text-almond-cream-50">A-</span>
          </div>
          <p className="mb-4 text-base font-semibold text-almond-cream-200">CS 301: Data Structures</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-espresso-800/50 bg-espresso-900/90 p-3">
              <p className="mb-0.5 text-[9px] font-mono uppercase tracking-widest text-espresso-600">Current grade</p>
              <p className="text-xl font-bold text-almond-cream-50">87.3<span className="text-sm font-medium text-almond-cream-500">%</span></p>
            </div>
            <div className="rounded-xl border border-espresso-800/50 bg-espresso-900/90 p-3">
              <p className="mb-0.5 text-[9px] font-mono uppercase tracking-widest text-espresso-600">Pass probability</p>
              <p className="text-xl font-bold text-almond-cream-400">94.2<span className="text-sm font-medium text-almond-cream-400/70">%</span></p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-almond-cream-500">
            <TrendingUp className="h-3.5 w-3.5 text-almond-cream-400" />
            <span className="font-mono font-semibold text-almond-cream-400">+4.2%</span> this month
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Waitlist bottom drawer ───────────────────────────────────────────────────

function WaitlistDrawer() {
  const [open, setOpen]         = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [email, setEmail]       = useState("");
  const [school, setSchool]     = useState("");
  const [year, setYear]         = useState("");

  const drawerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ y: number; wasOpen: boolean; closedY: number } | null>(null);
  const lastDelta = useRef(0);

  function getClosedY() {
    return drawerRef.current ? drawerRef.current.offsetHeight - PEEK_H : 0;
  }

  // Sync DOM transform whenever `open` changes (outside drag)
  useEffect(() => {
    const el = drawerRef.current;
    if (!el || dragStart.current) return;
    el.style.transition = "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)";
    el.style.transform  = open ? "translateY(0)" : `translateY(${getClosedY()}px)`;
  }, [open]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = drawerRef.current;
    if (!el) return;
    el.style.transition = "none";
    const closedY = getClosedY();
    dragStart.current = { y: e.clientY, wasOpen: open, closedY };
    lastDelta.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current || !drawerRef.current) return;
    const delta       = e.clientY - dragStart.current.y;
    lastDelta.current = delta;
    const { wasOpen, closedY } = dragStart.current;
    const base        = wasOpen ? 0 : closedY;
    const y           = Math.max(0, Math.min(closedY, base + delta));
    drawerRef.current.style.transform = `translateY(${y}px)`;
  }

  function onPointerUp() {
    if (!dragStart.current) return;
    const { wasOpen } = dragStart.current;
    const delta       = lastDelta.current;
    const shouldOpen  = !wasOpen && delta < -40 ? true : wasOpen && delta > 40 ? false : wasOpen;
    dragStart.current = null;
    lastDelta.current = 0;
    setOpen(shouldOpen);
  }

  function handleToggle() {
    if (Math.abs(lastDelta.current) < 5) setOpen((o) => !o);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDrawerError(null);
    setLoading(true);
    try {
      await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      try { await (supabase as any).from("early_access_requests").insert({ email, school, school_year: year }); } catch {}
      setSubmitted(true);
    } catch (err: any) {
      setDrawerError(err?.message ?? "Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <div
      ref={drawerRef}
      className="absolute inset-0 flex flex-col"
      style={{ transform: `translateY(calc(100% - ${PEEK_H}px))`, zIndex: 10 }}
    >
      {/* ── Drag handle ── */}
      <div
        className="select-none cursor-grab active:cursor-grabbing"
        style={{
          height: PEEK_H,
          background: "linear-gradient(180deg, rgba(10,7,5,0) 0%, rgba(23,16,9,0.95) 40%, #171009 100%)",
          borderTop: "1px solid rgba(190,100,65,0.18)",
          backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleToggle}
      >
        <div style={{ width: 32, height: 3, borderRadius: 2, background: "#3a2218" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#be6441" }}>
            Join the waitlist
          </span>
          <svg
            style={{ width: 11, height: 11, color: "#be6441", transition: "transform 0.4s ease", transform: open ? "rotate(180deg)" : "none" }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </div>
      </div>

      {/* ── Drawer content ── */}
      <div style={{ flex: 1, background: "#171009", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
        {submitted ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 20, padding: "0 16px" }}>
            {/* Check ring */}
            <div style={{ position: "relative", width: 72, height: 72 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(190,100,65,0.25)", animation: "ping 1.8s cubic-bezier(0,0,0.2,1) 0.3s both" }} />
              <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: "rgba(190,100,65,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#be6441" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#f0e8df", marginBottom: 8 }}>You&apos;re on the list!</p>
              <p style={{ fontSize: 13, color: "#6b4a38", lineHeight: 1.7 }}>Check your email to confirm your spot.<br />We&apos;ll notify you when we launch.</p>
            </div>
            <Link
              href="/"
              style={{
                marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
                padding: "11px 28px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: "transparent", border: "1px solid rgba(190,100,65,0.3)",
                color: "#be6441", textDecoration: "none",
                transition: "background 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(190,100,65,0.1)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(190,100,65,0.5)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(190,100,65,0.3)"; }}
            >
              Back to main page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: "#9a7055", marginBottom: 2 }}>Get early access before public launch.</p>
            {drawerError && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(190,100,65,0.2)", background: "rgba(190,100,65,0.07)", fontSize: 12, color: "#be6441" }}>
                <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />{drawerError}
              </div>
            )}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b4a38", display: "block", marginBottom: 5 }}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu"
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #3a2218", padding: "7px 0", fontSize: 13, color: "#f0e8df", outline: "none", boxSizing: "border-box" as const }}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#be6441"; }}
                onBlur={(e)  => { e.currentTarget.style.borderBottomColor = "#3a2218"; }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b4a38", display: "block", marginBottom: 5 }}>School</label>
              <SchoolAutocomplete value={school} onChange={setSchool} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b4a38", display: "block", marginBottom: 5 }}>School Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}
                style={{ width: "100%", background: "#171009", border: "none", borderBottom: "1px solid #3a2218", padding: "7px 0", fontSize: 13, color: year ? "#f0e8df" : "#6b4a38", outline: "none", appearance: "none" as const, boxSizing: "border-box" as const }}>
                <option value="" style={{ color: "#6b4a38" }}>Select your year</option>
                {SCHOOL_YEARS.map((y) => <option key={y} value={y} style={{ background: "#171009", color: "#f0e8df" }}>{y}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              style={{ background: "linear-gradient(135deg, #be6441, #9e4a2e)", color: "#f9f2ec", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, marginTop: 4, transition: "opacity 0.2s" }}>
              {loading ? "Joining…" : "Request early access"}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

// ─── Puzzle-piece sliding tab switcher ───────────────────────────────────────
// The pill straddles the left/right panel divider (centered on left: 50%).
// It slides between two vertical slots — Sign In (upper) and Sign Up (lower).
// The inactive label waits in the empty slot like a puzzle opening.

const PILL_W  = 148;   // pill width — spans both panels
const PILL_H  = 52;    // pill height
const SLOT_GAP = 56;   // gap between pill centre and inactive label centre

function TabSwitcher({ mode, onSwitch }: { mode: "login" | "signup"; onSwitch: (m: "login" | "signup") => void }) {
  const inactiveLabel = mode === "login" ? "Sign Up" : "Sign In";
  const inactiveMode  = mode === "login" ? "signup"  : "login";

  return (
    // Anchored at the divider, vertically centred
    <div
      className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
      style={{ width: PILL_W, userSelect: "none" }}
    >
      {/* ── Active pill ── slides between positions via translateY */}
      <button
        onClick={() => { /* already active — no-op */ }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: PILL_W,
          height: PILL_H,
          borderRadius: 16,
          background: "linear-gradient(135deg, #be6441, #9e4a2e)",
          color: "#f9f2ec",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.02em",
          border: "none",
          cursor: "default",
          boxShadow: "0 4px 18px rgba(190,100,65,0.22), inset 0 1px 0 rgba(255,255,255,0.08)",
          transform: mode === "login" ? `translateY(-${SLOT_GAP / 2 + PILL_H / 2 - 2}px)` : `translateY(${SLOT_GAP / 2 + PILL_H / 2 - 2}px)`,
          transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
          position: "relative",
          zIndex: 2,
        }}
      >
        {mode === "login" ? "Sign In" : "Sign Up"}
      </button>

      {/* ── Inactive label — sits in the empty slot, click to switch ── */}
      <button
        onClick={() => onSwitch(inactiveMode)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: PILL_W,
          height: PILL_H,
          borderRadius: 16,
          background: "transparent",
          color: "#7a4e38",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.02em",
          border: "none",
          cursor: "pointer",
          transform: mode === "login" ? `translateY(${SLOT_GAP / 2 - PILL_H / 2 + 2}px)` : `translateY(-${SLOT_GAP / 2 - PILL_H / 2 + 2}px)`,
          transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s ease",
          position: "relative",
          zIndex: 1,
          marginTop: -PILL_H, // stack on top of pill in DOM flow
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#c07050"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7a4e38"; }}
      >
        {inactiveLabel}
      </button>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ nextPath, fromDemo }: { nextPath: string; fromDemo: boolean }) {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (devCredentialsMatch(email, password)) {
      await supabase.auth.signOut();
      setDevSessionClient();
      setUser({ id: DEV_USER_ID, email: devSessionEmail() });
      router.push(nextPath);
      setLoading(false);
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push(nextPath);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-serif-display text-3xl font-semibold tracking-tight text-almond-cream-50">Welcome back</h1>
        <p className="mt-2 text-sm text-almond-cream-500">
          {fromDemo ? "Sign in to continue your demo." : "Sign in to access your course intelligence."}
        </p>
      </div>
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-burnt-peach-800/30 bg-burnt-peach-900/20 px-4 py-3 text-sm text-burnt-peach-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="group">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-almond-cream-500" htmlFor="login-email">Email</label>
          <div className="relative">
            <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu"
              className="w-full border-0 border-b border-espresso-700 bg-transparent py-2.5 pl-8 pr-3 text-sm text-almond-cream-50 placeholder:text-espresso-700 transition-all duration-200 focus:border-burnt-peach-500 focus:outline-none" />
            <svg className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-700 transition-colors group-focus-within:text-burnt-peach-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>
        <div className="group">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-almond-cream-500" htmlFor="login-password">Password</label>
          <div className="relative">
            <input id="login-password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
              className="w-full border-0 border-b border-espresso-700 bg-transparent py-2.5 pl-8 pr-10 text-sm text-almond-cream-50 placeholder:text-espresso-700 transition-all duration-200 focus:border-burnt-peach-500 focus:outline-none" />
            <svg className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-700 transition-colors group-focus-within:text-burnt-peach-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-espresso-700 transition-colors hover:text-almond-cream-400">
              {showPassword
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
            </button>
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-burnt-peach-500 px-5 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-all duration-150 hover:bg-burnt-peach-600 active:bg-burnt-peach-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <span className="flex items-center justify-center gap-2"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Signing in…</span> : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Signup form ──────────────────────────────────────────────────────────────

function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: undefined } });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-serif-display text-3xl font-semibold tracking-tight text-almond-cream-50">Create account</h1>
        <p className="mt-2 text-sm text-almond-cream-500">Join students making smarter course decisions.</p>
      </div>
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-burnt-peach-800/30 bg-burnt-peach-900/20 px-4 py-3 text-sm text-burnt-peach-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="group">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-almond-cream-500" htmlFor="signup-email">Email</label>
          <div className="relative">
            <input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu"
              className="w-full border-0 border-b border-espresso-700 bg-transparent py-2.5 pl-8 pr-3 text-sm text-almond-cream-50 placeholder:text-espresso-700 transition-all duration-200 focus:border-burnt-peach-500 focus:outline-none" />
            <svg className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-700 transition-colors group-focus-within:text-burnt-peach-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>
        <div className="group">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-almond-cream-500" htmlFor="signup-password">Password</label>
          <div className="relative">
            <input id="signup-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
              className="w-full border-0 border-b border-espresso-700 bg-transparent py-2.5 pl-8 pr-3 text-sm text-almond-cream-50 placeholder:text-espresso-700 transition-all duration-200 focus:border-burnt-peach-500 focus:outline-none" />
            <svg className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-700 transition-colors group-focus-within:text-burnt-peach-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
        <div className="group">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-almond-cream-500" htmlFor="signup-confirm-password">Confirm Password</label>
          <div className="relative">
            <input id="signup-confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password"
              className={`w-full border-0 border-b bg-transparent py-2.5 pl-8 pr-3 text-sm text-almond-cream-50 placeholder:text-espresso-700 transition-all duration-200 focus:outline-none ${passwordMismatch ? "border-burnt-peach-500 focus:border-burnt-peach-400" : "border-espresso-700 focus:border-burnt-peach-500"}`} />
            <svg className={`absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors group-focus-within:text-burnt-peach-500 ${passwordMismatch ? "text-burnt-peach-500" : "text-espresso-700"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          {passwordMismatch && (
            <p className="mt-1.5 text-xs text-burnt-peach-400">Passwords do not match</p>
          )}
        </div>
        <div className="pt-2">
          <button type="submit" disabled={loading || passwordMismatch} className="w-full rounded-xl bg-burnt-peach-500 px-5 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-all duration-150 hover:bg-burnt-peach-600 active:bg-burnt-peach-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <span className="flex items-center justify-center gap-2"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating account…</span> : "Get started"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Inner page (needs useSearchParams) ──────────────────────────────────────

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function AuthPage() {
  const searchParams = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));
  const fromDemo = searchParams.get("from") === "demo";
  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [animating, setAnimating] = useState(false);

  function switchMode(next: "login" | "signup") {
    if (next === mode || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setMode(next);
      setAnimating(false);
    }, 200);
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:block lg:w-1/2" style={{ animation: "panelSlideLeft 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
        <FloatingCards />
      </div>

      {/* Center tab switcher — sits on the divider */}
      <TabSwitcher mode={mode} onSwitch={switchMode} />

      {/* Right panel */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-shadow-grey-950 px-8 pb-24 pt-12 lg:w-1/2 lg:px-16" style={{ animation: "panelSlideRight 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <Link href="/" className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80">
            <CourseIntelLogo className="h-9 w-auto" priority />
          </Link>
        </div>

        {/* Mobile tab toggle */}
        <div className="mb-8 flex gap-1 rounded-xl border border-espresso-800 bg-espresso-950 p-1 lg:hidden">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              className="rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200"
              style={{ background: mode === m ? "#be6441" : "transparent", color: mode === m ? "#f9f2ec" : "#6b4a38" }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Animated form container */}
        <div
          style={{
            width: "100%",
            maxWidth: "24rem",
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(10px)" : "translateY(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {mode === "login"
            ? <LoginForm nextPath={nextPath} fromDemo={fromDemo} />
            : <SignupForm />}
        </div>

        <WaitlistDrawer />
      </div>

      <style>{`
        @keyframes floatA { 0%,100%{transform:rotate(1deg) translateY(0)} 50%{transform:rotate(1deg) translateY(-10px)} }
        @keyframes floatB { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(-3deg) translateY(-7px)} }
        @keyframes floatC { 0%,100%{transform:rotate(4deg) translateY(8px)} 50%{transform:rotate(4deg) translateY(-2px)} }
        @keyframes panelSlideLeft { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes panelSlideRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2);opacity:0} }
      `}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-shadow-grey-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-burnt-peach-500 border-t-transparent" />
      </div>
    }>
      <AuthPage />
    </Suspense>
  );
}
