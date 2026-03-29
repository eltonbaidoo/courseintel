"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronDown, PlayCircle, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

import { ScrollReveal } from "../ScrollReveal";
import { glassPanelStatic } from "../landing-ui";

const CSSBook3D = dynamic(
  () => import("../3d/CSSBook3D").then((m) => ({ default: m.CSSBook3D })),
  { ssr: false, loading: () => null }
);

export function LandingHero() {
  return (
    <section className="relative px-6 pb-16 pt-28 md:pb-24 md:pt-32">
      <CSSBook3D />
      <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <div className="relative mb-6 inline-flex">
            <span
              className={cn(
                "relative z-10 inline-flex items-center gap-2 rounded-full border border-almond-cream-50/12 px-3 py-1.5 text-xs font-medium tracking-wider text-almond-cream-500",
                glassPanelStatic
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-almond-cream-500" aria-hidden />
              Early access now open
            </span>
          </div>

          <h1 className="mb-8 font-serif-display text-4xl font-semibold leading-[1.06] tracking-tight text-almond-cream-50 sm:text-5xl md:text-6xl lg:text-[3.35rem] lg:leading-[1.04] xl:text-7xl">
            <span className="block text-almond-cream-50">Understand your course.</span>
            <span className="block italic text-burnt-peach-500">Predict your outcome.</span>
            <span className="block text-almond-cream-400">Know what to do next.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-almond-cream-500 lg:mx-0 lg:max-w-lg lg:text-xl">
            CourseIntel turns scattered syllabi, grades, and deadlines into a live course intelligence
            system, so you always know where you stand and what to prioritize.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-burnt-peach-500 px-8 text-base font-semibold text-almond-cream-50 transition-all duration-200 ease-out hover:bg-burnt-peach-600 sm:w-auto"
            >
              <PlayCircle className="h-5 w-5" aria-hidden />
              Try interactive demo
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center gap-1 text-base text-almond-cream-400 transition-colors duration-200 ease-out hover:text-almond-cream-50 sm:ml-0"
            >
              See how it works
              <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
            </Link>
          </div>
        </div>

        <ScrollReveal animate className="lg:justify-self-center lg:-ml-16">
          <div className="relative mx-auto w-full max-w-lg pb-28 lg:mx-0 lg:max-w-none lg:pb-0">
            <div
              className="absolute -right-4 top-0 hidden h-40 w-[88%] rounded-2xl border border-almond-cream-50/8 bg-shadow-grey-900/40 backdrop-blur-sm lg:block"
              aria-hidden
            />
            <div
              className="absolute -right-2 top-6 hidden h-44 w-[92%] rounded-2xl border border-almond-cream-50/10 bg-espresso-950/50 backdrop-blur-sm lg:block"
              aria-hidden
            />

            <div
              className={cn(
                "absolute bottom-2 left-0 z-20 w-[min(100%,260px)] p-4",
                glassPanelStatic
              )}
            >
              <div className="flex items-center gap-2 text-sm text-almond-cream-400">
                <TrendingUp className="h-4 w-4 text-almond-cream-400" aria-hidden />
                <span className="font-semibold text-almond-cream-200">Grade trend</span>
              </div>
              <p className="mt-1 font-mono text-sm font-semibold text-almond-cream-400">+4.2% this month</p>
            </div>

            <div className={cn("relative z-10 ml-0 p-5 text-left md:p-6 lg:ml-6", glassPanelStatic)}>
              <div className="absolute right-4 top-4 md:right-5 md:top-5">
                <div className="rounded-lg bg-burnt-peach-500 px-3 py-2 font-mono text-sm font-bold text-almond-cream-50">
                  A-
                </div>
              </div>

              <div className="mb-1 text-xs font-mono uppercase tracking-widest text-espresso-600">
                Course profile
              </div>
              <div className="mb-6 pr-16 text-xl font-semibold text-almond-cream-200 md:text-2xl">
                CS 301: Data Structures
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-espresso-800/50 bg-espresso-900/90 p-4">
                  <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-espresso-600">
                    Current grade
                  </div>
                  <div className="text-2xl font-bold text-almond-cream-50 md:text-3xl">
                    87.3<span className="ml-0.5 text-base font-medium text-almond-cream-500">%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-espresso-800/50 bg-espresso-900/90 p-4">
                  <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-espresso-600">
                    Pass probability
                  </div>
                  <div className="text-2xl font-bold text-almond-cream-400 md:text-3xl">
                    94.2<span className="ml-0.5 text-base font-medium text-almond-cream-400/70">%</span>
                  </div>
                </div>
              </div>

              <div className="mb-1 mt-5 text-[10px] font-mono uppercase tracking-widest text-espresso-600">
                Grading breakdown
              </div>
              <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-espresso-900">
                <div className="h-full w-[35%] rounded-l-full bg-burnt-peach-500" />
                <div className="h-full w-[25%] bg-burnt-peach-400" />
                <div className="h-full w-[25%] bg-almond-cream-500" />
                <div className="h-full w-[15%] rounded-r-full bg-almond-cream-700" />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono text-espresso-600">
                <span>Exams 35%</span>
                <span>Labs 25%</span>
                <span>HW 25%</span>
                <span>Project 15%</span>
              </div>

              <div className="mb-3 mt-6 text-[10px] font-mono uppercase tracking-widest text-espresso-600">
                This week&apos;s priorities
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-espresso-800/45 bg-shadow-grey-900/50 p-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-espresso-700" />
                    <span className="text-sm font-medium text-almond-cream-300">Midterm exam, Thursday</span>
                  </div>
                  <span className="font-mono text-xs font-medium text-burnt-peach-400">HIGH</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-espresso-800/45 bg-shadow-grey-900/50 p-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-burnt-peach-400" />
                    <span className="text-sm font-medium text-almond-cream-300">Lab 5 due, Wednesday</span>
                  </div>
                  <span className="font-mono text-xs text-almond-cream-500">MED</span>
                </div>
              </div>

              <p className="mt-3 text-xs font-mono text-espresso-600">3 deadlines detected from syllabus</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
