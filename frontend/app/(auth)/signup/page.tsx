"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Request OTP email instead of confirmation link
        emailRedirectTo: undefined,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Redirect to verify page with email so user can enter the OTP code
    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="glass rounded-2xl p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-white">
          Create your account
        </h1>
        <p className="text-sm text-honeydew-400/80">
          Join thousands of students making smarter course decisions
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-coral-500/10 border border-coral-500/20 text-coral-400 text-sm">
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
          <label className="text-xs font-semibold font-display uppercase tracking-widest text-honeydew-400" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-honeydew-900/50 border border-honeydew-700/50 text-white text-sm placeholder:text-honeydew-600 focus:border-honeydew-400 focus:ring-2 focus:ring-honeydew-400/20 focus:outline-none transition-all duration-200"
            placeholder="you@university.edu"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold font-display uppercase tracking-widest text-honeydew-400" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-honeydew-900/50 border border-honeydew-700/50 text-white text-sm placeholder:text-honeydew-600 focus:border-honeydew-400 focus:ring-2 focus:ring-honeydew-400/20 focus:outline-none transition-all duration-200"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full relative group px-5 py-3.5 rounded-xl bg-gradient-to-r from-honeydew-500 to-neon-ice-500 text-white font-semibold text-sm font-display shadow-glow-green hover:shadow-glow-ice transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </>
            ) : (
              "Get Started"
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-neon-ice-500 to-honeydew-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-honeydew-800/50" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-transparent text-honeydew-600">
            Already have an account?
          </span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-honeydew-400 hover:text-white transition-colors duration-200"
        >
          Sign in to your account
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
