"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TrendingUp, AlertCircle, BarChart2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/app-store";
import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";
import {
  devCredentialsMatch,
  devSessionEmail,
  DEV_USER_ID,
  setDevSessionClient,
} from "@/lib/dev-auth";

// ─── Left panel ───────────────────────────────────────────────────────────────

function FloatingCards() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-espresso-950">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 60%, rgba(190,100,65,0.13) 0%, transparent 70%)" }}
      />
      <div className="absolute left-8 top-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <CourseIntelLogo className="h-8 w-auto" priority />
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

// ─── Center yin-yang tab switcher ────────────────────────────────────────────
// The boundary between Sign In and Sign Up is an S-curve (yin-yang wave).
// The active fill animates via clip-path: path() transition.

const YY_W = 130;
const YY_H = 164;
const YY_MID = YY_H / 2;   // 82
const YY_AMP = 20;          // wave amplitude

// Active fill sweeps top half + S-curve bulging down into bottom
const signInPath = `M 0,0 L ${YY_W},0 L ${YY_W},${YY_MID} C ${YY_W / 2},${YY_MID + YY_AMP} ${YY_W / 2},${YY_MID - YY_AMP} 0,${YY_MID} Z`;
// Active fill sweeps bottom half + S-curve bulging up into top
const signUpPath = `M ${YY_W},${YY_H} L 0,${YY_H} L 0,${YY_MID} C ${YY_W / 2},${YY_MID - YY_AMP} ${YY_W / 2},${YY_MID + YY_AMP} ${YY_W},${YY_MID} Z`;

function TabSwitcher({ mode, onSwitch }: { mode: "login" | "signup"; onSwitch: (m: "login" | "signup") => void }) {
  const activePath = mode === "login" ? signInPath : signUpPath;
  return (
    <div className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
      {/* Outer shell — rounded rect, dark bg, border */}
      <div
        className="relative overflow-hidden rounded-[28px] border border-espresso-700/80 shadow-2xl backdrop-blur-md"
        style={{ width: YY_W, height: YY_H, background: "#0e0c0c" }}
      >
        {/* Yin-yang animated fill */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(160deg, #be6441 0%, #a05035 100%)",
            clipPath: `path('${activePath}')`,
            transition: "clip-path 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "inset 0 0 24px rgba(0,0,0,0.25)",
          }}
        />

        {/* Sign In button — top half */}
        <button
          onClick={() => onSwitch("login")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: YY_MID,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: mode === "login" ? "#f9f2ec" : "#5a3825",
            transition: "color 0.35s ease",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          Sign In
        </button>

        {/* Sign Up button — bottom half */}
        <button
          onClick={() => onSwitch("signup")}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: YY_MID,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: mode === "signup" ? "#f9f2ec" : "#5a3825",
            transition: "color 0.35s ease",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          Sign Up
        </button>
      </div>
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
      <div className="mt-8 border-t border-espresso-900 pt-6 text-center text-sm text-almond-cream-500">
        <Link href="/demo" className="transition-colors hover:text-almond-cream-200">Try the guided demo</Link>
      </div>
    </div>
  );
}

// ─── Signup form ──────────────────────────────────────────────────────────────

function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        <div className="pt-2">
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-burnt-peach-500 px-5 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-all duration-150 hover:bg-burnt-peach-600 active:bg-burnt-peach-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <span className="flex items-center justify-center gap-2"><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating account…</span> : "Get started"}
          </button>
        </div>
      </form>
      <div className="mt-8 border-t border-espresso-900 pt-6 text-center text-sm text-almond-cream-500">
        <Link href="/demo" className="transition-colors hover:text-almond-cream-200">Try the guided demo first</Link>
      </div>
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
      <div className="flex w-full flex-col items-center justify-center bg-shadow-grey-950 px-8 py-12 lg:w-1/2 lg:px-16" style={{ animation: "panelSlideRight 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
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
      </div>

      <style>{`
        @keyframes floatA { 0%,100%{transform:rotate(1deg) translateY(0)} 50%{transform:rotate(1deg) translateY(-10px)} }
        @keyframes floatB { 0%,100%{transform:rotate(-3deg) translateY(0)} 50%{transform:rotate(-3deg) translateY(-7px)} }
        @keyframes floatC { 0%,100%{transform:rotate(4deg) translateY(8px)} 50%{transform:rotate(4deg) translateY(-2px)} }
        @keyframes panelSlideLeft { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes panelSlideRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
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
