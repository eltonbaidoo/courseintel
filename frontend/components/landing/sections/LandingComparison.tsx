"use client";

import { Check, Minus, X } from "lucide-react";

import { ScrollReveal } from "../ScrollReveal";
import { glassPanelStatic, sectionAnchor } from "../landing-ui";

const ROWS = [
  ["Syllabus parsing & structure extraction", "x", "x", "x", "x"],
  ["Weighted grade calculation & forecast", "x", "m", "x", "m"],
  ["Academic risk detection", "x", "x", "x", "x"],
  ["Weekly action plans by grade impact", "x", "x", "x", "x"],
  ["Deadline discovery from documents", "x", "m", "x", "m"],
  ["Study context summarization", "x", "x", "m", "m"],
  ["Pass/fail probability modeling", "x", "x", "x", "m"],
] as const;

export function LandingComparison() {
  return (
    <section
      className={`mx-auto max-w-5xl border-t border-espresso-900/50 px-6 py-24 md:py-28 ${sectionAnchor}`}
    >
      <ScrollReveal>
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-mono uppercase tracking-widest text-burnt-peach-500">
            Why it&apos;s different
          </p>
          <h2 className="font-serif-display text-4xl font-semibold tracking-tight text-almond-cream-50 md:text-5xl">
            Not another planner.
            <br />
            <span className="text-espresso-500">An intelligence system.</span>
          </h2>
          <p className="mt-6 text-lg text-almond-cream-500">
            Planners organize dates. LMS platforms host content. CourseIntel understands your course.
          </p>
        </div>

        <div className={`overflow-x-auto ${glassPanelStatic}`}>
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-espresso-900">
                <th className="w-[28%] px-6 py-6 font-medium text-almond-cream-500">Capability</th>
                <th className="px-4 py-6 text-center font-bold text-burnt-peach-500">CourseIntel</th>
                <th className="px-4 py-6 text-center font-medium text-espresso-600">Calendar tools</th>
                <th className="px-4 py-6 text-center font-medium text-espresso-600">LMS platforms</th>
                <th className="px-4 py-6 text-center font-medium text-espresso-600">Note apps</th>
                <th className="px-4 py-6 text-center font-medium text-espresso-600">AI chatbots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-900">
              {ROWS.map(([label, cal, lms, note, ai]) => (
                <tr key={label}>
                  <td className="px-6 py-5 text-almond-cream-400">{label}</td>
                  <td className="px-4 py-5 text-center text-burnt-peach-500">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-burnt-peach-500/15">
                      <Check className="h-5 w-5" aria-label="Yes" />
                    </span>
                  </td>
                  {[cal, lms, note, ai].map((cell, i) => (
                    <td key={i} className="px-4 py-5 text-center text-espresso-700">
                      {cell === "x" ? (
                        <X className="mx-auto h-4 w-4" aria-label="No" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 opacity-70" aria-label="Partial" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollReveal>
    </section>
  );
}
