"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-almond-cream-50 px-4">
      <div className="card border-espresso-200 bg-espresso-50 p-8 text-center max-w-sm">
        <h2 className="font-display text-lg font-semibold text-espresso-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-espresso-700">{error.message}</p>
        <button onClick={reset} className="btn-secondary mt-4">
          Try again
        </button>
      </div>
    </div>
  );
}
