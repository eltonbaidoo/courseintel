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
    <div className="card border-espresso-200 bg-espresso-50 p-6 text-center">
      <h2 className="font-display text-lg font-semibold text-espresso-900">
        Dashboard error
      </h2>
      <p className="mt-1 text-sm text-espresso-700">{error.message}</p>
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
