"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNext(searchParams.get("next"));
  const fromDemo = searchParams.get("from") === "demo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(nextPath);
  }

  return (
    <div className="glass space-y-6 rounded-2xl p-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-almond-cream-50">
          Welcome back
        </h1>
        <p className="text-sm text-almond-cream-400/80">
          {fromDemo
            ? "Sign in to continue your demo and open the dashboard."
            : "Sign in to access your course intelligence"}
        </p>
      </div>

      {error && (
        <div className="flex animate-fade-in items-center gap-2 rounded-xl border border-espresso-800/20 bg-espresso-800/10 px-4 py-3 text-sm text-burnt-peach-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold font-display uppercase tracking-widest text-almond-cream-400" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-espresso-900/50 bg-shadow-grey-900/50 py-3 pl-11 pr-4 text-sm text-almond-cream-50 placeholder:text-espresso-800 transition-all duration-200 focus:border-almond-cream-400 focus:outline-none focus:ring-2 focus:ring-almond-cream-400/20"
              placeholder="you@university.edu"
            />
            <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold font-display uppercase tracking-widest text-almond-cream-400" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-espresso-900/50 bg-shadow-grey-900/50 py-3 pl-11 pr-12 text-sm text-almond-cream-50 placeholder:text-espresso-800 transition-all duration-200 focus:border-almond-cream-400 focus:outline-none focus:ring-2 focus:ring-almond-cream-400/20"
              placeholder="Enter your password"
            />
            <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-espresso-800 transition-colors hover:text-almond-cream-400"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-burnt-peach-500 px-5 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-colors hover:bg-burnt-peach-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </span>
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-espresso-950/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-transparent px-3 text-espresso-800">
            New to CourseIntel?
          </span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm font-medium text-almond-cream-400 transition-colors duration-200 hover:text-almond-cream-50"
        >
          Try the guided demo
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
        <span className="mx-2 text-espresso-900">·</span>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-sm font-medium text-almond-cream-400 transition-colors duration-200 hover:text-almond-cream-50"
        >
          Create an account
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="glass flex justify-center rounded-2xl p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-burnt-peach-500 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
