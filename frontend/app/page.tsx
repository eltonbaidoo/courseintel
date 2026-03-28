import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">CourseIntel</h1>
      <p className="text-lg text-gray-600 max-w-xl mb-2">
        Understand your course. Discover the tools. Predict your outcome. Know what to do next.
      </p>
      <p className="text-sm text-gray-400 mb-10">
        A multi-agent academic intelligence engine
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/(auth)/login"
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
