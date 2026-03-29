"use client";

import { Building2, FileText, LineChart, TriangleAlert } from "lucide-react";

import { ScrollReveal } from "../ScrollReveal";
import { glassPanelInteractive, sectionAnchor } from "../landing-ui";

const CARDS = [
  {
    title: "Deadlines scattered everywhere",
    body: "Canvas, email, PDFs, Slack — your deadlines live in six places and none of them talk to each other.",
    icon: TriangleAlert,
    iconWrap: "bg-burnt-peach-500/15 text-burnt-peach-500",
  },
  {
    title: "Syllabi are unreadable contracts",
    body: "Dense, inconsistent, and buried in policy language. The information you need is there — just impossible to extract.",
    icon: FileText,
    iconWrap: "bg-espresso-900 text-almond-cream-400",
  },
  {
    title: "Grades are black boxes",
    body: "Weighted categories, curved scores, dropped lowest — you can't calculate your standing without a spreadsheet.",
    icon: LineChart,
    iconWrap: "bg-almond-cream-500/15 text-almond-cream-500",
  },
  {
    title: "Notes disconnected from context",
    body: "You study hard, but without knowing what's high-stakes this week, effort gets spread thin.",
    icon: Building2,
    iconWrap: "bg-almond-cream-500/15 text-almond-cream-500",
  },
] as const;

export function LandingProblem() {
  return (
    <section
      id="product"
      className={`mx-auto max-w-6xl border-t border-espresso-900/50 px-6 py-24 md:py-28 ${sectionAnchor}`}
    >
      <ScrollReveal>
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-mono uppercase tracking-widest text-burnt-peach-500">The problem</p>
          <h2 className="mb-4 font-serif-display text-4xl font-semibold tracking-tight text-almond-cream-50 md:text-5xl">
            Academic data is
            <br />
            everywhere.{" "}
            <span className="text-espresso-500 not-italic">Clarity is nowhere.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-almond-cream-500">
            Students spend more time figuring out how courses work than actually learning.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {CARDS.map(({ title, body, icon: Icon, iconWrap }) => (
            <div key={title} className={`flex flex-col p-8 ${glassPanelInteractive} feature-card`}>
              <div
                className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${iconWrap}`}
              >
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mb-3 text-xl font-bold text-almond-cream-200">{title}</h3>
              <p className="leading-relaxed text-almond-cream-500">{body}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
