"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";
import { useAppStore } from "@/stores/app-store";
import { isClerkAuthEnabled } from "@/lib/auth-config";
import {
  DEV_AUTH_BYPASS,
  DEV_USER_ID,
  setDevSessionClient,
} from "@/lib/dev-auth";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAppStore((s) => s.setUser);
  const email = searchParams.get("email") ?? "";
  const isDemo = searchParams.get("demo") === "1";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [devSkipping, setDevSkipping] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleDevSkip() {
    setDevSkipping(true);
    await supabase.auth.signOut();
    setDevSessionClient();
    setUser({ id: DEV_USER_ID, email: email.trim() || "dev@local" });
    router.push("/dashboard");
  }

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (isClerkAuthEnabled()) {
      router.replace("/login");
    }
  }, [router]);

  function handleChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (digit && index === 5 && next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);
    // Focus last filled or next empty
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    // Auto-submit if all filled
    if (next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  }

  async function handleVerify(code: string) {
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    router.push("/dashboard");
  }

  async function handleResend() {
    setResending(true);
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    }
    setResending(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === 6) {
      handleVerify(code);
    }
  }

  if (!email) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-espresso-800/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-burnt-peach-600">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold text-almond-cream-50">Missing email</h1>
        <p className="text-sm text-almond-cream-400/80">
          Please sign up first to receive a verification code.
        </p>
        <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-burnt-peach-500 text-almond-cream-50 font-semibold text-sm font-display hover:bg-espresso-800 transition-colors">
          Go to Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-espresso-800 bg-espresso-950 animate-scale-in">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-almond-cream-400">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-almond-cream-50">
          Check your email
        </h1>
        <p className="text-sm text-almond-cream-400/80">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-almond-cream-300">{email}</span>
        </p>
        {isDemo && (
          <p className="rounded-lg border border-burnt-peach-500/20 bg-burnt-peach-500/10 px-3 py-2 text-xs text-almond-cream-300/90">
            Demo onboarding: enter the code from your email to finish and open your dashboard.
          </p>
        )}
        <p className="rounded-lg border border-espresso-800/40 bg-espresso-950/50 px-3 py-2 text-left text-xs leading-relaxed text-almond-cream-500">
          <span className="font-medium text-almond-cream-400">No code?</span> Supabase may send a{" "}
          <strong className="text-almond-cream-300">confirmation link</strong> instead of digits unless your project uses an OTP
          template and SMTP. Check spam, or in the Supabase dashboard open{" "}
          <span className="font-mono text-[11px] text-almond-cream-400">Authentication → Users</span> and confirm the user.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-espresso-800/10 border border-espresso-800/20 text-burnt-peach-600 text-sm animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {resent && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-burnt-peach-500/10 border border-burnt-peach-500/20 text-almond-cream-400 text-sm animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          New code sent! Check your inbox.
        </div>
      )}

      {/* OTP Input */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="otp-input"
              disabled={loading}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.some((d) => d === "")}
          className="w-full rounded-xl bg-burnt-peach-500 px-5 py-3.5 font-display text-sm font-semibold text-almond-cream-50 transition-colors hover:bg-burnt-peach-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </span>
        </button>
      </form>

      {/* Resend */}
      <div className="text-center space-y-3">
        {DEV_AUTH_BYPASS && (
          <button
            type="button"
            onClick={handleDevSkip}
            disabled={devSkipping}
            className="mb-1 w-full rounded-xl border border-espresso-700 bg-espresso-950/80 px-4 py-3 text-sm font-medium text-almond-cream-200 transition-colors hover:border-burnt-peach-500/40 hover:bg-espresso-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {devSkipping ? "Opening dashboard…" : "Skip verification (local dev only)"}
          </button>
        )}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resent}
          className="text-sm text-burnt-peach-500 hover:text-almond-cream-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? "Sending..." : "Didn\u2019t receive the code? Resend"}
        </button>

        <div className="flex items-center justify-center gap-3 text-xs text-espresso-800/50">
          <Link href="/signup" className="hover:text-almond-cream-400 transition-colors">
            Use a different email
          </Link>
          <span className="w-1 h-1 rounded-full bg-espresso-800/30" />
          <Link href="/login" className="hover:text-almond-cream-400 transition-colors">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-10 flex flex-col items-center gap-3 text-center transition-opacity hover:opacity-90">
        <CourseIntelLogo className="h-10 w-auto md:h-12" priority />
        <p className="font-condensed text-sm font-medium tracking-wide text-almond-cream-400">Know your course. Before it knows you.</p>
      </Link>
      <div className="w-full max-w-[420px]">
        <Suspense fallback={
          <div className="glass rounded-2xl p-8 text-center">
            <div className="animate-spin h-8 w-8 mx-auto border-2 border-burnt-peach-500 border-t-transparent rounded-full" />
          </div>
        }>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}
