"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

import { ScrollReveal } from "../ScrollReveal";
import { glassPanelStatic } from "../landing-ui";
import { EarlyAccessButton } from "../EarlyAccessModal";

export function LandingCta() {
  return (
    <section className="px-6 py-28 md:py-32">
      <ScrollReveal>
        <div className={`mx-auto max-w-4xl p-12 text-center md:p-24 ${glassPanelStatic}`}>
          <h2 className="mb-6 font-serif-display text-5xl font-semibold tracking-tight text-almond-cream-50 md:text-6xl">
            Stop guessing.
            <br />
            <span className="text-burnt-peach-500">Start knowing.</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-almond-cream-500 md:text-xl">
            Join thousands of students using CourseIntel to take control of their academic outcomes. Early access
            is open now.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <EarlyAccessButton className="inline-flex h-14 items-center gap-2 rounded-full bg-burnt-peach-500 px-10 text-lg font-semibold text-almond-cream-50 transition-all duration-200 ease-out hover:bg-burnt-peach-600">
              Join the waitlist
              <ArrowRight className="h-5 w-5" aria-hidden />
            </EarlyAccessButton>
            <Link
              href="/login"
              className="inline-flex h-14 items-center gap-2 rounded-full border border-espresso-700 px-8 text-base font-medium text-almond-cream-300 transition-all duration-200 ease-out hover:border-burnt-peach-500/40 hover:text-almond-cream-50"
            >
              <PlayCircle className="h-5 w-5 text-burnt-peach-400" aria-hidden />
              Try guided demo
            </Link>
          </div>
          <p className="mt-6 font-mono text-sm text-espresso-600">Free during early access. No credit card required.</p>
        </div>
      </ScrollReveal>
    </section>
  );
}
