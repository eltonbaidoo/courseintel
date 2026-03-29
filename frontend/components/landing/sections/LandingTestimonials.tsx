"use client";

import { ScrollReveal } from "../ScrollReveal";
import { glassPanelInteractive, sectionAnchor } from "../landing-ui";

const QUOTES = [
  {
    quote:
      "I was manually tracking my grade in a spreadsheet every week. CourseIntel replaced that entirely — and it tells me things I didn't even think to calculate.",
    name: "Sarah K.",
    meta: "Junior, computer science · Georgia Tech",
    avatar: "S",
    avatarClass: "bg-burnt-peach-500",
  },
  {
    quote:
      "The risk alert literally saved my semester. I didn't realize my lab average was dragging me below a B until CourseIntel flagged it with two weeks left to fix it.",
    name: "Marcus T.",
    meta: "Senior, mechanical engineering · UC Berkeley",
    avatar: "M",
    avatarClass: "bg-espresso-800",
  },
  {
    quote:
      "I upload my syllabus and within minutes I have a complete model of how the course works. The weekly action plan alone is worth it.",
    name: "Priya M.",
    meta: "Sophomore, biology · Cornell",
    avatar: "P",
    avatarClass: "bg-almond-cream-500",
  },
  {
    quote:
      "My professors don't make grading transparent. CourseIntel does. I finally know exactly what I need on the final to keep my GPA.",
    name: "Jordan W.",
    meta: "Junior, economics · Stanford",
    avatar: "J",
    avatarClass: "bg-espresso-900",
  },
] as const;

export function LandingTestimonials() {
  return (
    <section
      id="testimonials"
      className={`mx-auto max-w-6xl border-t border-espresso-900/50 px-6 py-24 md:py-28 ${sectionAnchor}`}
    >
      <ScrollReveal>
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-mono uppercase tracking-widest text-burnt-peach-500">Testimonials</p>
          <h2 className="font-serif-display text-4xl font-semibold tracking-tight text-almond-cream-50 md:text-5xl">
            Students don&apos;t guess
            <br />
            anymore.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {QUOTES.map(({ quote, name, meta, avatar, avatarClass }) => (
            <div
              key={name}
              className={`flex flex-col justify-between p-8 ${glassPanelInteractive} feature-card`}
            >
              <p className="mb-8 text-lg leading-relaxed text-almond-cream-400">&quot;{quote}&quot;</p>
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-almond-cream-50 ${avatarClass}`}
                >
                  {avatar}
                </div>
                <div>
                  <div className="font-bold text-almond-cream-200">{name}</div>
                  <div className="text-sm text-espresso-600">{meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
