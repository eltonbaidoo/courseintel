"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card border-coral-200 bg-coral-50 p-6 text-center">
      <h2 className="font-display text-lg font-semibold text-coral-800">
        Dashboard error
      </h2>
      <p className="mt-1 text-sm text-coral-600">{error.message}</p>
      <div className="flex gap-2 justify-center mt-4">
        <button onClick={reset} className="btn-secondary">
          Try again
        </button>
        <Link href="/dashboard" className="btn-ghost">
          Back to courses
        </Link>
      </div>
    </div>
  );
}
