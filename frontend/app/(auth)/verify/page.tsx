"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
        <div className="w-16 h-16 mx-auto rounded-2xl bg-coral-500/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-coral-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold text-white">Missing email</h1>
        <p className="text-sm text-honeydew-400/80">
          Please sign up first to receive a verification code.
        </p>
        <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-honeydew-500 text-white font-semibold text-sm font-display hover:bg-honeydew-600 transition-colors">
          Go to Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-honeydew-500/20 to-neon-ice-500/20 flex items-center justify-center animate-scale-in">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-honeydew-400">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          Check your email
        </h1>
        <p className="text-sm text-honeydew-400/80">
          We sent a 6-digit code to{" "}
          <span className="text-honeydew-300 font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-coral-500/10 border border-coral-500/20 text-coral-400 text-sm animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {resent && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-honeydew-500/10 border border-honeydew-500/20 text-honeydew-400 text-sm animate-fade-in">
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
          className="w-full relative group px-5 py-3.5 rounded-xl bg-gradient-to-r from-honeydew-500 to-neon-ice-500 text-white font-semibold text-sm font-display shadow-glow-green hover:shadow-glow-ice transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-neon-ice-500 to-honeydew-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </form>

      {/* Resend */}
      <div className="text-center space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resent}
          className="text-sm text-honeydew-500 hover:text-honeydew-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? "Sending..." : "Didn\u2019t receive the code? Resend"}
        </button>

        <div className="flex items-center justify-center gap-3 text-xs text-honeydew-600/50">
          <Link href="/signup" className="hover:text-honeydew-400 transition-colors">
            Use a different email
          </Link>
          <span className="w-1 h-1 rounded-full bg-honeydew-600/30" />
          <Link href="/login" className="hover:text-honeydew-400 transition-colors">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="glass rounded-2xl p-8 text-center">
        <div className="animate-spin h-8 w-8 mx-auto border-2 border-honeydew-500 border-t-transparent rounded-full" />
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}
