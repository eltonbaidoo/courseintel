"use client";

import Link from "next/link";
import { PlayCircle } from "lucide-react";

import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { glassNav } from "../landing-ui";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#testimonials", label: "Testimonials" },
] as const;

export function LandingNav() {
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50", glassNav)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg outline-none ring-burnt-peach-400/50 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-shadow-grey-950"
        >
          <span className="rounded-lg bg-almond-cream-50 px-2 py-1">
            <CourseIntelLogo className="h-7 w-auto md:h-8" priority />
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm font-medium text-almond-cream-500 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md outline-none transition-colors duration-200 ease-out hover:text-almond-cream-200 focus-visible:text-almond-cream-200 focus-visible:ring-2 focus-visible:ring-burnt-peach-400/40"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-full border border-espresso-800 bg-shadow-grey-900/90 px-4 py-2 text-sm font-medium text-almond-cream-300 outline-none transition-all duration-200 ease-out hover:border-espresso-700 hover:bg-espresso-950 hover:text-almond-cream-50 focus-visible:ring-2 focus-visible:ring-burnt-peach-400/45"
          >
            <PlayCircle className="h-4 w-4 text-burnt-peach-400" aria-hidden />
            Try demo
          </Link>
          <Button variant="base44" className="rounded-full px-5 py-2 text-sm font-medium" asChild>
            <Link href="/signup">Get early access</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
