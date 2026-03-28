import Link from "next/link";
import LLMProviderBadge from "@/components/LLMProviderBadge";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-brand-600">
          CourseIntel
        </Link>
        <div className="flex items-center gap-4">
          <LLMProviderBadge />
          <nav className="flex gap-6 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-brand-600">My Courses</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
