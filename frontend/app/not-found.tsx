import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-almond-cream-50 px-4">
      <div className="card p-8 text-center max-w-sm">
        <p className="font-mono text-5xl font-bold text-almond-cream-300">404</p>
        <h2 className="font-display text-lg font-semibold text-espresso-950 mt-2">
          Page not found
        </h2>
        <p className="mt-1 text-sm text-burnt-peach-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn-primary inline-block mt-4">
          Go home
        </Link>
      </div>
    </div>
  );
}
