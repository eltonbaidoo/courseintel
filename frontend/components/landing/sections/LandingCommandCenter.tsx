"use client";

import { ScrollReveal } from "../ScrollReveal";
import { glassPanelStatic, sectionAnchor } from "../landing-ui";

export function LandingCommandCenter() {
  return (
    <section
      id="command-center"
      className={`mx-auto max-w-6xl border-t border-espresso-900/50 px-6 py-24 md:py-28 ${sectionAnchor}`}
    >
      <ScrollReveal>
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs font-mono uppercase tracking-widest text-burnt-peach-500">Command center</p>
          <h2 className="mb-4 font-serif-display text-4xl font-semibold tracking-tight text-almond-cream-50 md:text-5xl">
            Your entire semester.
            <br />
            <span className="text-burnt-peach-500">One dashboard.</span>
          </h2>
        </div>

        <div
          className={`relative flex flex-col gap-6 overflow-hidden p-6 md:flex-row md:p-10 ${glassPanelStatic}`}
        >
          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-2xl border border-espresso-800/50 bg-espresso-900/50 p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="mb-1 text-xs font-mono uppercase tracking-widest text-espresso-600">
                    Current standing
                  </div>
                  <div className="text-2xl font-bold text-almond-cream-200">CS 301: Data Structures</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-almond-cream-50">B+</div>
                  <div className="font-mono text-sm text-almond-cream-500">87.3%</div>
                </div>
              </div>
              <div className="mb-2 flex justify-between text-xs font-medium text-almond-cream-500">
                <span>Progress toward target (A-)</span>
                <span className="font-mono">87.3 / 90.0</span>
              </div>
              <div className="relative mb-2 h-2 w-full overflow-hidden rounded-full bg-espresso-900">
                <div className="absolute inset-y-0 left-0 w-[87.3%] rounded-full bg-burnt-peach-500" />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-espresso-600">
                <span>C (70%)</span>
                <span>B (80%)</span>
                <span>A- (90%)</span>
                <span>A (93%)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-espresso-800/50 bg-espresso-900/50 p-6">
              <div className="mb-4 text-xs font-mono uppercase tracking-widest text-espresso-600">
                Upcoming assignments
              </div>
              <div className="space-y-4">
                {[
                  { dot: "bg-espresso-700", label: "Midterm exam", meta: ["25%", "Mar 28"] },
                  { dot: "bg-burnt-peach-400", label: "Lab 5: Binary trees", meta: ["5%", "Mar 26"] },
                  { dot: "bg-almond-cream-500", label: "Problem set 7", meta: ["3%", "Apr 2"] },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-espresso-800/50 bg-espresso-900/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} />
                      <span className="font-medium text-almond-cream-300">{row.label}</span>
                    </div>
                    <div className="flex gap-4 font-mono text-sm text-almond-cream-500">
                      {row.meta.map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-2xl border border-burnt-peach-800/50 bg-espresso-950/50 p-6 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-espresso-700" />
                <span className="text-xs font-mono uppercase tracking-widest text-burnt-peach-400">
                  Risk alert
                </span>
              </div>
              <h4 className="mb-2 text-lg font-bold text-almond-cream-200">Midterm worth 25% of grade</h4>
              <p className="text-sm leading-relaxed text-almond-cream-500">
                Scoring below 78% drops you to a B. Review chapters 5–8 first.
              </p>
            </div>

            <div className="rounded-2xl border border-espresso-800/50 bg-espresso-900/50 p-6">
              <div className="mb-4 text-xs font-mono uppercase tracking-widest text-espresso-600">
                Study recommendations
              </div>
              <ul className="space-y-3">
                {["Review BST traversals", "Practice hash table problems", "Re-read Ch. 7 graph algorithms"].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-burnt-peach-500" />
                      <span className="text-sm leading-relaxed text-almond-cream-400">{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-espresso-800/50 bg-espresso-900/50 p-6">
              <div className="mb-4 text-xs font-mono uppercase tracking-widest text-espresso-600">
                Confidence score
              </div>
              <div className="mb-2 text-4xl font-bold text-burnt-peach-400">
                92 <span className="text-xl text-espresso-600">/ 100</span>
              </div>
              <p className="font-mono text-xs text-espresso-600">
                Based on 14 data points from syllabus + 8 graded items
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
