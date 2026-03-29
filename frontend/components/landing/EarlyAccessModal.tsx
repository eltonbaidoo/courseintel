"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TrendingUp, AlertCircle, BarChart2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SCHOOL_YEARS = [
  "Freshman (1st year)", "Sophomore (2nd year)", "Junior (3rd year)",
  "Senior (4th year)", "Graduate student", "Other",
] as const;

const UNIVERSITIES = [
  "Massachusetts Institute of Technology","Harvard University","Stanford University","California Institute of Technology",
  "University of Chicago","Princeton University","Yale University","Columbia University","University of Pennsylvania",
  "Duke University","Johns Hopkins University","Northwestern University","Dartmouth College","Brown University",
  "Vanderbilt University","Rice University","Washington University in St. Louis","Cornell University","Notre Dame University",
  "Georgetown University","Emory University","Carnegie Mellon University","University of California, Berkeley",
  "University of California, Los Angeles","University of California, San Diego","University of California, Santa Barbara",
  "University of California, Davis","University of Michigan","University of Virginia",
  "University of North Carolina at Chapel Hill","Tufts University","Boston College","Boston University",
  "Northeastern University","New York University","Georgia Institute of Technology","University of Florida",
  "University of Texas at Austin","Texas A&M University","University of Washington","University of Toronto",
  "University of British Columbia","McGill University","Oxford University","Cambridge University",
  "Imperial College London","ETH Zurich","National University of Singapore","University of Tokyo",
  "Peking University","Tsinghua University","University of Hong Kong","Seoul National University",
  "Purdue University","Ohio State University","Penn State University",
  "University of Illinois Urbana-Champaign","University of Wisconsin-Madison","University of Maryland",
  "University of Arizona","Arizona State University","University of Colorado Boulder","University of Utah",
].sort();

// ─── Floating cards (mirrors auth page left panel) ────────────────────────────

function FloatingCards() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0d0a07", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(190,100,65,0.06) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: 28, left: 24, right: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3a2218" }}>Academic Intelligence</p>
        <p style={{ marginTop: 4, fontSize: 12, color: "rgba(200,168,138,0.4)", lineHeight: 1.5 }}>Everything you need to know about your courses — in one place.</p>
      </div>

      <div style={{ position: "relative", height: 260, width: 280 }}>
        {/* Card 3 — grade breakdown */}
        <div style={{ position: "absolute", inset: "0 0 auto", margin: "0 auto", width: 264, borderRadius: 16, border: "1px solid rgba(70,39,32,0.6)", background: "rgba(30,18,12,0.8)", padding: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", transform: "rotate(4deg) translateY(8px)", animation: "eaFloatC 7s ease-in-out infinite 1.5s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3a2218", marginBottom: 8 }}>
            <BarChart2 size={12} />Grade breakdown
          </div>
          <div style={{ display: "flex", height: 6, width: "100%", gap: 2, overflow: "hidden", borderRadius: 9999, background: "#0d0a07" }}>
            <div style={{ height: "100%", width: "35%", borderRadius: "9999px 0 0 9999px", background: "#be6441" }} />
            <div style={{ height: "100%", width: "25%", background: "#c87050" }} />
            <div style={{ height: "100%", width: "25%", background: "#c8a88a" }} />
            <div style={{ height: "100%", width: "15%", borderRadius: "0 9999px 9999px 0", background: "#8a6a50" }} />
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 10, fontFamily: "monospace", color: "#3a2218" }}>
            <span>Exams 35%</span><span>Labs 25%</span><span>HW 25%</span>
          </div>
        </div>

        {/* Card 2 — deadlines */}
        <div style={{ position: "absolute", inset: "0 0 auto", margin: "20px auto 0", width: 264, borderRadius: 16, border: "1px solid rgba(70,39,32,0.7)", background: "rgba(18,12,8,0.9)", padding: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", transform: "rotate(-3deg)", animation: "eaFloatB 6s ease-in-out infinite 0.8s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3a2218", marginBottom: 10 }}>
            <AlertCircle size={12} style={{ color: "#be6441" }} />This week
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 10, border: "1px solid rgba(58,34,24,0.5)", background: "rgba(30,18,12,0.6)", padding: "8px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#be6441" }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#c8a88a" }}>Midterm exam, Thursday</span>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#be6441" }}>HIGH</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 10, border: "1px solid rgba(58,34,24,0.5)", background: "rgba(30,18,12,0.6)", padding: "8px 10px", marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6b4a38" }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#9a7055" }}>Lab 5 due, Wednesday</span>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6b4a38" }}>MED</span>
          </div>
        </div>

        {/* Card 1 — grade hero (front) */}
        <div style={{ position: "absolute", inset: "0 0 auto", margin: "44px auto 0", width: 264, borderRadius: 16, border: "1px solid rgba(90,50,36,0.8)", background: "#130e09", padding: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", transform: "rotate(1deg)", animation: "eaFloatA 5s ease-in-out infinite" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#3a2218" }}>Course profile</span>
            <span style={{ borderRadius: 8, background: "#be6441", padding: "4px 8px", fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#f9f2ec" }}>A-</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#c8a88a", marginBottom: 14 }}>CS 301: Data Structures</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ borderRadius: 10, border: "1px solid rgba(58,34,24,0.5)", background: "rgba(30,18,12,0.9)", padding: 10 }}>
              <p style={{ fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3a2218", marginBottom: 3 }}>Current grade</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#f0e8df" }}>87.3<span style={{ fontSize: 12, fontWeight: 500, color: "#9a7055" }}>%</span></p>
            </div>
            <div style={{ borderRadius: 10, border: "1px solid rgba(58,34,24,0.5)", background: "rgba(30,18,12,0.9)", padding: 10 }}>
              <p style={{ fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#3a2218", marginBottom: 3 }}>Pass probability</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#c8a88a" }}>94.2<span style={{ fontSize: 12, fontWeight: 500, color: "rgba(200,168,138,0.6)" }}>%</span></p>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9a7055" }}>
            <TrendingUp size={13} style={{ color: "#c8a88a" }} />
            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#c8a88a" }}>+4.2%</span> this month
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── School autocomplete ──────────────────────────────────────────────────────

function SchoolAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false);
  const [active, setActive] = useState(-1);
  const [manual, setManual] = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);

  const matches = value.trim().length >= 2
    ? UNIVERSITIES.filter((u) => u.toLowerCase().includes(value.toLowerCase())).slice(0, 7)
    : [];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const total = matches.length + 1;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, total - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
    if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      if (active < matches.length) { onChange(matches[active]); setOpen(false); setActive(-1); }
      else { setManual(true); onChange(""); setOpen(false); }
    }
    if (e.key === "Escape") setOpen(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(58,34,24,0.8)", padding: "10px 0 10px 28px", fontSize: 14,
    color: "#f0e8df", outline: "none", boxSizing: "border-box",
  };

  if (manual) return (
    <div style={{ position: "relative" }}>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#be6441"; }}
        onBlur={(e)  => { e.currentTarget.style.borderBottomColor = "rgba(58,34,24,0.8)"; }}
        placeholder="Type your school name" autoComplete="off" style={inputStyle}
      />
      <svg style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#3a2218" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      <button type="button" onClick={() => { setManual(false); onChange(""); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 11, color: "#6b4a38", cursor: "pointer" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#be6441"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#6b4a38"; }}
      >Search instead</button>
    </div>
  );

  const showDropdown = open && (matches.length > 0 || value.trim().length >= 2);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input ref={inputRef} type="text" value={value} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#be6441"; setOpen(true); }}
        onBlur={(e)  => { e.currentTarget.style.borderBottomColor = "rgba(58,34,24,0.8)"; }}
        onKeyDown={handleKeyDown} placeholder="Your university" style={inputStyle}
      />
      <svg style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#3a2218" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      <div style={{
        position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 60,
        background: "#130e09", border: "1px solid rgba(190,100,65,0.18)", borderRadius: 10,
        overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
        opacity: showDropdown ? 1 : 0, transform: showDropdown ? "translateY(0)" : "translateY(-6px)",
        pointerEvents: showDropdown ? "auto" : "none", transition: "opacity 0.18s ease, transform 0.18s ease",
      }}>
        {matches.map((school, i) => (
          <div key={school}
            onMouseDown={(e) => { e.preventDefault(); onChange(school); setOpen(false); setActive(-1); }}
            onMouseEnter={() => setActive(i)}
            style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer",
              color: i === active ? "#f0e8df" : "#9a7055",
              background: i === active ? "rgba(190,100,65,0.12)" : "transparent",
              transition: "background 0.12s ease, color 0.12s ease",
              borderBottom: "1px solid rgba(58,34,24,0.4)" }}
          >{school}</div>
        ))}
        <div
          onMouseDown={(e) => { e.preventDefault(); setManual(true); onChange(""); setOpen(false); setTimeout(() => inputRef.current?.focus(), 50); }}
          onMouseEnter={() => setActive(matches.length)}
          style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", fontStyle: "italic",
            color: active === matches.length ? "#f0e8df" : "#6b4a38",
            background: active === matches.length ? "rgba(190,100,65,0.08)" : "transparent",
            transition: "background 0.12s ease, color 0.12s ease" }}
        >Other — type manually</div>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function EarlyAccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail]         = useState("");
  const [school, setSchool]       = useState("");
  const [year, setYear]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      try { await (supabase as any).from("early_access_requests").insert({ email, school, school_year: year }); } catch {}
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    }
    setLoading(false);
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "#6b4a38", display: "block", marginBottom: 6,
  };

  const underlineInput: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(58,34,24,0.8)", padding: "10px 0 10px 28px",
    fontSize: 14, color: "#f0e8df", outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 90,
        background: "rgba(4,3,2,0.85)", backdropFilter: "blur(8px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.28s ease",
      }} />

      {/* Full-screen split panel */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 91,
        display: "flex",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transform: open ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.32s ease, transform 0.38s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* ── Left panel — floating cards ── */}
        <div style={{ display: "none", width: "50%", height: "100%" }} className="ea-left-panel">
          <FloatingCards />
        </div>

        {/* ── Right panel — form ── */}
        <div style={{
          width: "100%", height: "100%", background: "#0d0a07",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "40px 32px", overflowY: "auto", position: "relative",
        }}
          className="ea-right-panel"
        >
          {/* Close button */}
          <button onClick={onClose}
            style={{ position: "absolute", top: 24, right: 24, background: "rgba(58,34,24,0.3)", border: "1px solid rgba(58,34,24,0.5)", borderRadius: 10, cursor: "pointer", color: "#6b4a38", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s, background 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#be6441"; e.currentTarget.style.background = "rgba(190,100,65,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#6b4a38"; e.currentTarget.style.background = "rgba(58,34,24,0.3)"; }}
          ><X size={16} /></button>

          {submitted ? (
            /* ── Success ── */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20, maxWidth: 340 }}>
              <div style={{ position: "relative", width: 72, height: 72 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(190,100,65,0.25)", animation: "eaPing 1.8s cubic-bezier(0,0,0.2,1) 0.3s both" }} />
                <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: "rgba(190,100,65,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#be6441" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#f0e8df", marginBottom: 10 }}>You&apos;re on the list!</p>
                <p style={{ fontSize: 14, color: "#6b4a38", lineHeight: 1.7 }}>Check your email to confirm your spot.<br />We&apos;ll notify you when we launch.</p>
              </div>
              <button onClick={onClose}
                style={{ marginTop: 8, padding: "12px 36px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "transparent", border: "1px solid rgba(190,100,65,0.3)", color: "#be6441", cursor: "pointer", transition: "background 0.2s ease, border-color 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(190,100,65,0.1)"; e.currentTarget.style.borderColor = "rgba(190,100,65,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(190,100,65,0.3)"; }}
              >Back to main page</button>
            </div>
          ) : (
            /* ── Form ── */
            <div style={{ width: "100%", maxWidth: 380 }}>
              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#be6441" }}>Early access</span>
                <h2 style={{ fontSize: 30, fontWeight: 700, color: "#f0e8df", margin: "8px 0 8px", fontFamily: "inherit" }}>Join the waitlist</h2>
                <p style={{ fontSize: 14, color: "#6b4a38" }}>Get notified when CourseIntel launches.</p>
              </div>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(190,100,65,0.2)", background: "rgba(190,100,65,0.07)", fontSize: 13, color: "#be6441", marginBottom: 20 }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {/* Email */}
                <div className="group">
                  <label style={labelStyle}>Email</label>
                  <div style={{ position: "relative" }}>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu"
                      style={underlineInput}
                      onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#be6441"; }}
                      onBlur={(e)  => { e.currentTarget.style.borderBottomColor = "rgba(58,34,24,0.8)"; }}
                    />
                    <svg style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#3a2218" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  </div>
                </div>

                {/* School */}
                <div>
                  <label style={labelStyle}>School</label>
                  <SchoolAutocomplete value={school} onChange={setSchool} />
                </div>

                {/* Year */}
                <div>
                  <label style={labelStyle}>School Year</label>
                  <div style={{ position: "relative" }}>
                    <select value={year} onChange={(e) => setYear(e.target.value)}
                      style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(58,34,24,0.8)", padding: "10px 0 10px 28px", fontSize: 14, color: year ? "#f0e8df" : "#3a2218", outline: "none", appearance: "none" as const, boxSizing: "border-box" as const }}
                      onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#be6441"; }}
                      onBlur={(e)  => { e.currentTarget.style.borderBottomColor = "rgba(58,34,24,0.8)"; }}
                    >
                      <option value="" style={{ background: "#130e09", color: "#3a2218" }}>Select your year</option>
                      {SCHOOL_YEARS.map((y) => <option key={y} value={y} style={{ background: "#130e09", color: "#f0e8df" }}>{y}</option>)}
                    </select>
                    <svg style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#3a2218" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                </div>

                <div style={{ paddingTop: 8 }}>
                  <button type="submit" disabled={loading}
                    style={{ width: "100%", background: "linear-gradient(135deg, #be6441, #9e4a2e)", color: "#f9f2ec", border: "none", borderRadius: 12, padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}
                  >
                    {loading
                      ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Joining…</span>
                      : "Request early access"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .ea-left-panel  { display: flex !important; }
          .ea-right-panel { width: 50% !important; }
        }
        @keyframes eaFloatA { 0%,100%{transform:rotate(1deg) translateY(0)} 50%{transform:rotate(1deg) translateY(-10px)} }
        @keyframes eaFloatB { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(-3deg) translateY(-7px)} }
        @keyframes eaFloatC { 0%,100%{transform:rotate(4deg) translateY(8px)} 50%{transform:rotate(4deg) translateY(-2px)} }
        @keyframes eaPing   { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }
        @keyframes spin     { to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
}

// ─── Trigger button ───────────────────────────────────────────────────────────

export function EarlyAccessButton({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className} style={style}>{children}</button>
      <EarlyAccessModal open={open} onClose={close} />
    </>
  );
}
