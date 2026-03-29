"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-honeydew-50 px-4">
      <div className="card border-coral-200 bg-coral-50 p-8 text-center max-w-sm">
        <h2 className="font-display text-lg font-semibold text-coral-800">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-coral-600">{error.message}</p>
        <button onClick={reset} className="btn-secondary mt-4">
          Try again
        </button>
      </div>
    </div>
  );
}
