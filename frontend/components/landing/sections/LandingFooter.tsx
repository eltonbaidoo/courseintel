"use client";

import Link from "next/link";

import { CourseIntelLogo } from "@/components/brand/CourseIntelLogo";

const PRODUCT = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#command-center", label: "Dashboard" },
  { href: "#", label: "Pricing" },
  { href: "#", label: "Changelog" },
] as const;

const COMPANY = [
  { href: "#", label: "About" },
  { href: "#", label: "Blog" },
  { href: "#", label: "Careers" },
  { href: "#", label: "Contact" },
] as const;

const LEGAL = [
  { href: "#", label: "Privacy policy" },
  { href: "#", label: "Terms of service" },
  { href: "#", label: "Cookie policy" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-espresso-900/80 bg-shadow-grey-950 px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-lg bg-almond-cream-50 px-2 py-1">
              <CourseIntelLogo className="h-7 w-auto" loading="lazy" />
            </span>
          </div>
          <p className="max-w-xs text-almond-cream-500">
            The academic intelligence engine for college students.
          </p>
        </div>

        <div>
          <h4 className="mb-6 font-bold text-almond-cream-200">Product</h4>
          <ul className="space-y-4 text-sm text-almond-cream-500">
            {PRODUCT.map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="rounded-sm outline-none transition-colors duration-200 ease-out hover:text-burnt-peach-400 focus-visible:text-burnt-peach-400 focus-visible:ring-2 focus-visible:ring-burnt-peach-400/40"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-6 font-bold text-almond-cream-200">Company</h4>
          <ul className="space-y-4 text-sm text-almond-cream-500">
            {COMPANY.map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="rounded-sm outline-none transition-colors duration-200 ease-out hover:text-burnt-peach-400 focus-visible:text-burnt-peach-400 focus-visible:ring-2 focus-visible:ring-burnt-peach-400/40"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-6 font-bold text-almond-cream-200">Legal</h4>
          <ul className="space-y-4 text-sm text-almond-cream-500">
            {LEGAL.map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="rounded-sm outline-none transition-colors duration-200 ease-out hover:text-burnt-peach-400 focus-visible:text-burnt-peach-400 focus-visible:ring-2 focus-visible:ring-burnt-peach-400/40"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
