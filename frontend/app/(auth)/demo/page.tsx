"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  DEMO_DISPLAY_NAME_KEY,
  DEMO_FLOW_KEY,
} from "@/lib/demo-onboarding";
import { ArrowRight, Sparkles, User, KeyRound } from "lucide-react";

type Step = "welcome" | "name" | "auth";

export default function DemoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function goName() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DEMO_FLOW_KEY, "1");
    }
    setStep("name");
  }

  function goAuth() {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setError("Please enter at least 2 characters for your name.");
      return;
    }
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DEMO_DISPLAY_NAME_KEY, trimmed);
    }
    setStep("auth");
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const name =
      typeof window !== "undefined"
        ? sessionStorage.getItem(DEMO_DISPLAY_NAME_KEY) ?? displayName.trim()
        : displayName.trim();

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, display_name: name },
        emailRedirectTo: undefined,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(
      `/verify?email=${encodeURIComponent(email)}&demo=1`,
    );
  }

  return (
    <div className="glass space-y-6 rounded-2xl p-8">
      {/* Progress */}
      <div className="flex justify-center gap-2">
        {(["welcome", "name", "auth"] as const).map((s, i) => {
          const idx = (["welcome", "name", "auth"] as const).indexOf(step);
          const done = i < idx;
          const active = i === idx;
          return (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                active ? "w-8 bg-almond-cream-400" : done ? "w-1.5 bg-espresso-800" : "w-1.5 bg-espresso-950"
              }`}
            />
          );
        })}
      </div>

      {step === "welcome" && (
        <>
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-espresso-800 bg-espresso-950">
              <Sparkles className="h-7 w-7 text-almond-cream-300" />
            </div>
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-burnt-peach-500">
              Interactive demo
            </p>
            <h1 className="font-display text-2xl font-bold text-almond-cream-50">
              Try CourseIntel in a few steps
            </h1>
            <p className="text-sm leading-relaxed text-almond-cream-400/90">
              We&apos;ll ask for your name, then you can sign in or create a free account. After that,
              you&apos;ll land on your dashboard to add a course and explore the product.
            </p>
          </div>
          <button
            type="button"
            onClick={goName}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-burnt-peach-500 px-5 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-colors hover:bg-burnt-peach-600"
          >
            Start onboarding
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-espresso-800">
            Already finished signup?{" "}
            <Link href="/login?next=/dashboard" className="text-almond-cream-400 hover:text-almond-cream-50">
              Sign in
            </Link>
          </p>
        </>
      )}

      {step === "name" && (
        <>
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-burnt-peach-500/15">
              <User className="h-6 w-6 text-almond-cream-400" />
            </div>
            <h1 className="font-display text-xl font-bold text-almond-cream-50">
              What should we call you?
            </h1>
            <p className="text-sm text-almond-cream-400/80">
              This appears in your welcome message on the dashboard.
            </p>
          </div>
          {error && (
            <div className="rounded-xl border border-espresso-800/20 bg-espresso-800/10 px-4 py-3 text-sm text-burnt-peach-600">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label
              className="text-xs font-display font-semibold uppercase tracking-widest text-almond-cream-400"
              htmlFor="demo-name"
            >
              Display name
            </label>
            <input
              id="demo-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-espresso-600/60 bg-shadow-grey-800/40 px-4 py-3 text-sm text-almond-cream-50 placeholder:text-shadow-grey-400 focus:border-almond-cream-400 focus:outline-none focus:ring-2 focus:ring-almond-cream-400/20"
              placeholder="e.g. Alex"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("welcome");
              }}
              className="flex-1 rounded-xl border border-espresso-900/60 py-3 text-sm font-medium text-almond-cream-300 transition-colors hover:bg-shadow-grey-900/50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goAuth}
              className="flex-1 rounded-xl bg-burnt-peach-500 py-3 text-sm font-semibold text-almond-cream-50 transition-colors hover:bg-burnt-peach-600"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {step === "auth" && (
        <>
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-burnt-peach-500/15">
              <KeyRound className="h-6 w-6 text-almond-cream-400" />
            </div>
            <h1 className="font-display text-xl font-bold text-almond-cream-50">
              Sign in or create an account
            </h1>
            <p className="text-sm text-almond-cream-400/80">
              Use your university email. New accounts verify with a one-time code.
            </p>
          </div>

          <Link
            href="/login?next=/dashboard&from=demo"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-espresso-800/50 bg-shadow-grey-900/30 py-3 text-sm font-medium text-almond-cream-200 transition-colors hover:border-burnt-peach-500 hover:bg-shadow-grey-900/50"
          >
            I already have an account: sign in
            <ArrowRight className="h-4 w-4 opacity-70" />
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-espresso-950/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-transparent px-3 text-espresso-800">or create account</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-espresso-800/20 bg-espresso-800/10 px-4 py-3 text-sm text-burnt-peach-600">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-xs font-display font-semibold uppercase tracking-widest text-almond-cream-400"
                htmlFor="demo-email"
              >
                Email
              </label>
              <input
                id="demo-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-espresso-600/60 bg-shadow-grey-800/40 px-4 py-3 text-sm text-almond-cream-50 placeholder:text-shadow-grey-400 focus:border-almond-cream-400 focus:outline-none focus:ring-2 focus:ring-almond-cream-400/20"
                placeholder="you@university.edu"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-display font-semibold uppercase tracking-widest text-almond-cream-400"
                htmlFor="demo-password"
              >
                Password
              </label>
              <input
                id="demo-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-espresso-600/60 bg-shadow-grey-800/40 px-4 py-3 text-sm text-almond-cream-50 placeholder:text-shadow-grey-400 focus:border-almond-cream-400 focus:outline-none focus:ring-2 focus:ring-almond-cream-400/20"
                placeholder="At least 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-burnt-peach-500 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-colors hover:bg-burnt-peach-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account & verify email"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("name");
            }}
            className="w-full text-center text-xs text-espresso-800 hover:text-almond-cream-400"
          >
            ← Back to name
          </button>
        </>
      )}
    </div>
  );
}
