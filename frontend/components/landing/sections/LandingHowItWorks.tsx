"use client";

import { Cpu, Edit3, Sparkles, Upload } from "lucide-react";

import { ScrollReveal } from "../ScrollReveal";
import { glassPanelInteractive, sectionAnchor } from "../landing-ui";

const STEPS = [
  {
    n: "01",
    title: "Enter your course",
    body: "Add your course details and upload your syllabus. PDF, DOCX, or paste the text. CourseIntel handles it all.",
    icon: Upload,
    iconWrap: "bg-burnt-peach-500/10 text-burnt-peach-400",
  },
  {
    n: "02",
    title: "Add your data",
    body: "Input grades, study materials, and notes as they come in. The model gets smarter with every update.",
    icon: Edit3,
    iconWrap: "bg-espresso-900 text-almond-cream-400",
  },
  {
    n: "03",
    title: "Intelligence builds",
    body: "CourseIntel constructs a live model of your course: grading logic, deadlines, priorities, risk factors.",
    icon: Cpu,
    iconWrap: "bg-burnt-peach-500/10 text-burnt-peach-400",
  },
  {
    n: "04",
    title: "Get clear answers",
    body: "Receive grade predictions, action plans, risk alerts, and study context, updated as your semester evolves.",
    icon: Sparkles,
    iconWrap: "bg-almond-cream-500/10 text-almond-cream-400",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className={`mx-auto max-w-6xl px-6 py-24 md:py-28 ${sectionAnchor}`}>
      <ScrollReveal>
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-mono uppercase tracking-widest text-burnt-peach-500">How it works</p>
          <h2 className="font-serif-display text-4xl font-semibold tracking-tight text-almond-cream-50 md:text-5xl">
            From chaos to clarity
            <br />
            <span className="text-espresso-500">in four steps.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {STEPS.map(({ n, title, body, icon: Icon, iconWrap }) => (
            <div key={n} className={`relative overflow-hidden p-8 ${glassPanelInteractive} feature-card`}>
              <div className="pointer-events-none absolute right-4 top-4 text-6xl font-black text-espresso-900/30">
                {n}
              </div>
              <div className={`mb-12 flex h-10 w-10 items-center justify-center rounded-lg ${iconWrap}`}>
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
