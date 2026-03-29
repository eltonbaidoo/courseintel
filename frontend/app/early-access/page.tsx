"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle, PlayCircle, GraduationCap, Mail, School, TrendingUp, AlertCircle, BarChart2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";

const SCHOOL_YEARS = [
  "Freshman (1st year)",
  "Sophomore (2nd year)",
  "Junior (3rd year)",
  "Senior (4th year)",
  "Graduate student",
  "Other",
] as const;

// ─── Left panel — identical floating cards as login ───────────────────────────

function FloatingCards() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-espresso-950">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(190,100,65,0.06) 0%, transparent 70%)" }} />

      <div className="absolute left-8 top-8">
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-almond-cream-500 transition-all duration-200 hover:bg-espresso-900/60 hover:text-almond-cream-200">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <div className="absolute bottom-8 left-8 right-8">
        <p className="font-condensed text-xs font-semibold uppercase tracking-widest text-espresso-600">Academic Intelligence</p>
        <p className="mt-1 text-sm text-almond-cream-500/60">Be among the first to experience course intelligence that actually works.</p>
      </div>

      <div className="relative h-72 w-80">
        {/* Card 3 */}
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

        {/* Card 2 */}
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

        {/* Card 1 */}
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

// ─── Success state ─────────────────────────────────────────────────────────────

function SuccessState({ email }: { email: string }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center text-center" style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-burnt-peach-500/20" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-2 rounded-full bg-burnt-peach-500/10" />
        <CheckCircle className="relative h-12 w-12 text-burnt-peach-500" />
      </div>
      <h1 className="mb-3 font-serif-display text-3xl font-semibold tracking-tight text-almond-cream-50">You&apos;re on the list!</h1>
      <p className="mb-2 text-sm text-almond-cream-500">We sent a confirmation to</p>
      <p className="mb-8 rounded-xl border border-espresso-800 bg-espresso-950 px-4 py-2 font-mono text-sm text-almond-cream-300">{email}</p>
      <p className="mb-10 text-sm leading-relaxed text-almond-cream-500">
        Check your inbox and confirm your spot. We&apos;ll notify you the moment full access opens.
      </p>
      <div className="flex w-full flex-col gap-3">
        <Link href="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-burnt-peach-500 px-5 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-all duration-150 hover:bg-burnt-peach-600">
          <PlayCircle className="h-4 w-4" />Try the demo now
        </Link>
        <Link href="/" className="flex w-full items-center justify-center gap-2 rounded-xl border border-espresso-800 px-5 py-3 text-sm font-medium text-almond-cream-400 transition-all duration-150 hover:border-espresso-700 hover:text-almond-cream-200">
          Back to home
        </Link>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EarlyAccessPage() {
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await supabase.from("early_access_requests").insert({ email, school, school_year: year });
    } catch { /* table may not exist yet */ }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/login` },
    });

    if (otpError) { setError(otpError.message); setLoading(false); return; }

    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — same floating cards as login */}
      <div className="hidden lg:block lg:w-1/2" style={{ animation: "panelSlideLeft 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
        <FloatingCards />
      </div>

      {/* Center badge — sits on the divider, replaces the tab switcher */}
      <div className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
        <div className="flex flex-col items-center gap-1 rounded-3xl border border-espresso-800 bg-shadow-grey-950/95 p-2 shadow-2xl backdrop-blur-md">
          <div
            className="rounded-2xl px-6 py-3 text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #be6441, #a05035)", color: "#f9f2ec", boxShadow: "0 4px 20px rgba(190,100,65,0.35)", minWidth: "110px", textAlign: "center" }}
          >
            Waitlist
          </div>
          <div className="h-0.5 w-8 rounded-full bg-espresso-900" />
          <Link
            href="/login"
            className="rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 hover:text-almond-cream-200"
            style={{ color: "#6b4a38", minWidth: "110px", textAlign: "center" }}
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Right — form */}
      <div
        className="flex w-full flex-col items-center justify-center bg-shadow-grey-950 px-8 py-12 lg:w-1/2 lg:px-16"
        style={{ animation: "panelSlideRight 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <Link href="/" className="flex flex-col items-center gap-2 transition-opacity hover:opacity-80">
            <CourseIntelLogo className="h-9 w-auto" priority />
          </Link>
        </div>

        {submitted ? (
          <SuccessState email={email} />
        ) : (
          <div className="w-full max-w-sm" style={{ animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both 0.2s" }}>
            <div className="mb-8">
              <h1 className="font-serif-display text-3xl font-semibold tracking-tight text-almond-cream-50">Join the waitlist</h1>
              <p className="mt-2 text-sm text-almond-cream-500">We&apos;ll notify you the moment your spot opens up.</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-burnt-peach-800/30 bg-burnt-peach-900/20 px-4 py-3 text-sm text-burnt-peach-400">
                <span className="shrink-0">⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-almond-cream-500" htmlFor="ea-email">Email</label>
                <div className="relative">
                  <input id="ea-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu"
                    className="w-full border-0 border-b border-espresso-700 bg-transparent py-2.5 pl-8 pr-3 text-sm text-almond-cream-50 placeholder:text-espresso-700 transition-all duration-200 focus:border-burnt-peach-500 focus:outline-none" />
                  <Mail className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-700 transition-colors group-focus-within:text-burnt-peach-500" />
                </div>
              </div>

              <div className="group">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-almond-cream-500" htmlFor="ea-school">School / University</label>
                <div className="relative">
                  <input id="ea-school" type="text" required value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Georgia Tech"
                    className="w-full border-0 border-b border-espresso-700 bg-transparent py-2.5 pl-8 pr-3 text-sm text-almond-cream-50 placeholder:text-espresso-700 transition-all duration-200 focus:border-burnt-peach-500 focus:outline-none" />
                  <School className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-700 transition-colors group-focus-within:text-burnt-peach-500" />
                </div>
              </div>

              <div className="group">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-almond-cream-500" htmlFor="ea-year">School year</label>
                <div className="relative">
                  <select id="ea-year" required value={year} onChange={(e) => setYear(e.target.value)}
                    className="w-full appearance-none border-0 border-b border-espresso-700 bg-transparent py-2.5 pl-8 pr-8 text-sm transition-all duration-200 focus:border-burnt-peach-500 focus:outline-none"
                    style={{ color: year ? "#f3e6d8" : "#3d2318" }}>
                    <option value="" disabled style={{ background: "#131111", color: "#3d2318" }}>Select your year</option>
                    {SCHOOL_YEARS.map((y) => (
                      <option key={y} value={y} style={{ background: "#131111", color: "#f3e6d8" }}>{y}</option>
                    ))}
                  </select>
                  <GraduationCap className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-700 transition-colors group-focus-within:text-burnt-peach-500" />
                  <svg className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-burnt-peach-500 px-5 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-all duration-150 hover:bg-burnt-peach-600 active:bg-burnt-peach-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? (
                    <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Submitting…</>
                  ) : (
                    <>Request early access <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-espresso-900 pt-6 text-center text-sm text-almond-cream-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-burnt-peach-500 transition-colors hover:text-burnt-peach-400">Sign in</Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatA { 0%,100%{transform:rotate(1deg) translateY(0)} 50%{transform:rotate(1deg) translateY(-10px)} }
        @keyframes floatB { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(-3deg) translateY(-7px)} }
        @keyframes floatC { 0%,100%{transform:rotate(4deg) translateY(8px)} 50%{transform:rotate(4deg) translateY(-2px)} }
        @keyframes panelSlideLeft { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes panelSlideRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
