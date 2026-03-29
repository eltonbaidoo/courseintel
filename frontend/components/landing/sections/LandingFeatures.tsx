"use client";

import {
  BookOpen,
  Brain,
  CalendarClock,
  LineChart,
  ListChecks,
  ShieldAlert,
} from "lucide-react";

import { ScrollReveal } from "../ScrollReveal";
import { glassPanelInteractive, sectionAnchor } from "../landing-ui";

const FEATURES = [
  {
    title: "Syllabus intelligence",
    body: "Extracts grading rules, weights, and course structure from syllabi so nothing hides in fine print.",
    icon: BookOpen,
    iconWrap: "bg-burnt-peach-500/15 text-burnt-peach-400",
  },
  {
    title: "Grade forecasting",
    body: "Models trajectories from weighted categories and what-ifs so you see outcomes before they happen.",
    icon: LineChart,
    iconWrap: "bg-almond-cream-600/25 text-almond-cream-300",
  },
  {
    title: "Risk detection",
    body: "Flags what could drag your grade and when, before the deadline window closes.",
    icon: ShieldAlert,
    iconWrap: "bg-espresso-800/80 text-almond-cream-300",
  },
  {
    title: "Study buddy",
    body: "Summarizes course context and surfaces review topics tied to what's weighted and due soon.",
    icon: Brain,
    iconWrap: "bg-almond-cream-600/25 text-almond-cream-300",
  },
  {
    title: "Deadline discovery",
    body: "Pulls due dates from documents and threads them into one timeline you can trust.",
    icon: CalendarClock,
    iconWrap: "bg-burnt-peach-500/15 text-burnt-peach-400",
  },
  {
    title: "Weekly action plan",
    body: "Ranks tasks by grade impact so effort goes where it actually moves the needle.",
    icon: ListChecks,
    iconWrap: "bg-almond-cream-600/25 text-almond-cream-300",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="features" className={`mx-auto max-w-6xl px-6 py-24 md:py-28 ${sectionAnchor}`}>
      <ScrollReveal>
        <div className="relative mb-16 text-center">
          <p className="mb-4 text-xs font-mono uppercase tracking-widest text-burnt-peach-500">
            The intelligence layer
          </p>
          <h2 className="font-serif-display text-4xl font-semibold tracking-tight text-almond-cream-50 md:text-5xl">
            Six engines.
            <br />
            <span className="text-burnt-peach-500">One clear picture.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-almond-cream-500">
            CourseIntel doesn&apos;t just organize your data. It understands your course and tells you what to
            do about it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, body, icon: Icon, iconWrap }) => (
            <div key={title} className={`flex flex-col p-8 ${glassPanelInteractive} feature-card`}>
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${iconWrap}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mb-3 text-lg font-bold text-almond-cream-200">{title}</h3>
              <p className="text-sm leading-relaxed text-almond-cream-500">{body}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
