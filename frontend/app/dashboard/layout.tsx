"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/app-store";
import LLMProviderBadge from "@/components/LLMProviderBadge";

const NAV = [{ href: "/dashboard", label: "My Courses", icon: "⬡" }];

const COURSE_NAV = [
  { href: "setup", label: "Course Setup", icon: "◈" },
  { href: "", label: "Profile", icon: "◉" },
  { href: "resources", label: "Tools & Resources", icon: "◎" },
  { href: "grades", label: "Grades", icon: "◐" },
  { href: "goals", label: "Goal Simulator", icon: "◑" },
  { href: "study", label: "Study Buddy", icon: "◒" },
  { href: "actions", label: "Action Board", icon: "◓" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const courseMatch = pathname.match(/\/dashboard\/course\/([^/]+)/);
  const courseId = courseMatch?.[1];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sidebar = (
    <aside className="w-60 shrink-0 bg-honeydew-950 flex flex-col border-r border-honeydew-900 h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-honeydew-900">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="w-8 h-8 rounded-lg bg-honeydew-500 flex items-center justify-center shadow-glow-green group-hover:bg-honeydew-400 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5V11L8 14L2 11V5L8 2Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          <span className="font-display font-bold text-honeydew-50 text-base tracking-tight">
            CourseIntel
          </span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="px-3 pt-4 flex-1 overflow-y-auto space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                ${active ? "bg-honeydew-800 text-honeydew-100" : "text-honeydew-400 hover:bg-honeydew-900 hover:text-honeydew-200"}`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}

        {/* Course sub-nav */}
        {courseId && courseId !== "new" && (
          <div className="mt-4">
            <p className="section-label text-honeydew-700 px-3 mb-2">Current Course</p>
            <div className="space-y-0.5">
              {COURSE_NAV.map(({ href, label, icon }) => {
                const fullPath = `/dashboard/course/${courseId}${href ? `/${href}` : ""}`;
                const active = pathname === fullPath;
                return (
                  <Link
                    key={fullPath}
                    href={fullPath}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                      ${active ? "bg-honeydew-500 text-white shadow-glow-green" : "text-honeydew-500 hover:bg-honeydew-900 hover:text-honeydew-200"}`}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-honeydew-900 space-y-2">
        {user && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-honeydew-400 truncate max-w-[140px]">{user.email}</p>
            <button
              onClick={handleSignOut}
              className="text-xs text-honeydew-600 hover:text-honeydew-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
        <LLMProviderBadge />
        <p className="text-xs text-honeydew-700">CourseIntel MVP v0.1</p>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-honeydew-50 overflow-hidden">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-4 bg-honeydew-950 border-b border-honeydew-900 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-honeydew-300 hover:text-white p-1"
          aria-label="Open sidebar"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 font-display font-bold text-honeydew-50 text-sm">
          CourseIntel
        </span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-60 animate-slide-in">{sidebar}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
