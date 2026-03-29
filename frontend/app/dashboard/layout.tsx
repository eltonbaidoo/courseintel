"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/app-store";
import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";
import LLMProviderBadge from "@/components/LLMProviderBadge";
import DemoWelcomeBanner from "@/components/dashboard/DemoWelcomeBanner";

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
    <aside className="w-60 shrink-0 bg-shadow-grey-950 flex flex-col border-r border-shadow-grey-900 h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-shadow-grey-900">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="rounded-md bg-almond-cream-50 px-1.5 py-1 transition-opacity group-hover:opacity-90">
            <CourseIntelLogo className="h-6 w-auto" />
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
                ${active ? "bg-espresso-950 text-almond-cream-100" : "text-almond-cream-400 hover:bg-shadow-grey-900 hover:text-almond-cream-200"}`}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}

        {/* Course sub-nav */}
        {courseId && courseId !== "new" && (
          <div className="mt-4">
            <p className="section-label text-espresso-900 px-3 mb-2">Current Course</p>
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
                      ${active ? "bg-burnt-peach-500 text-almond-cream-50" : "text-burnt-peach-500 hover:bg-shadow-grey-900 hover:text-almond-cream-200"}`}
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
      <div className="px-4 py-4 border-t border-shadow-grey-900 space-y-2">
        {user && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-almond-cream-400 truncate max-w-[140px]">{user.email}</p>
            <button
              onClick={handleSignOut}
              className="text-xs text-espresso-800 hover:text-almond-cream-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
        <LLMProviderBadge />
        <p className="text-xs text-espresso-900">CourseIntel MVP v0.1</p>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-almond-cream-50 overflow-hidden">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-4 bg-shadow-grey-950 border-b border-shadow-grey-900 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-almond-cream-300 hover:text-almond-cream-50 p-1"
          aria-label="Open sidebar"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 rounded bg-almond-cream-50 px-1.5 py-0.5">
          <CourseIntelLogo className="h-5 w-auto" />
        </span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-shadow-grey-950/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-60 animate-slide-in">{sidebar}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <DemoWelcomeBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
