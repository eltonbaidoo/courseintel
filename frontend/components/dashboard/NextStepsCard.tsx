"use client";

import Link from "next/link";
import type { Course } from "@/types/course";
import type { GradeEntry } from "@/types/grades";

export function NextStepsCard({
  courses,
  gradeEntries,
}: {
  courses: Course[];
  gradeEntries: Record<string, GradeEntry[]>;
}) {
  const hasCourse = courses.length > 0;
  const hasGrades = courses.some((c) => (gradeEntries[c.id] ?? []).length > 0);
  const hasBootstrapData = courses.some(
    (c) =>
      (c.bootstrap.detected_tools?.length ?? 0) > 0 ||
      (c.bootstrap.resources?.length ?? 0) > 0,
  );

  const steps = [
    {
      done: hasCourse,
      title: "Bootstrap a course",
      desc: "Upload a syllabus or let agents search — identity, tools, and deadlines.",
      href: "/dashboard/course/new/setup",
      cta: "Add course",
    },
    {
      done: hasGrades,
      title: "Log assignment grades",
      desc: "Weighted category math and the Goal Simulator need real numbers.",
      href: courses[0] ? `/dashboard/course/${courses[0].id}/grades` : "/dashboard",
      cta: "Open grades",
    },
    {
      done: hasBootstrapData,
      title: "Review tools & resources",
      desc: "Confirm detected platforms and bookmark public materials.",
      href: courses[0] ? `/dashboard/course/${courses[0].id}/resources` : "/dashboard",
      cta: "View resources",
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="section-label mb-0.5">Getting started</p>
          <h2 className="font-display font-bold text-honeydew-950 text-base">
            Next steps
          </h2>
        </div>
        <span className="text-xs font-mono text-honeydew-500 tabular-nums">
          {completed}/{steps.length}
        </span>
      </div>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className={`flex gap-3 rounded-xl border p-3 transition-colors ${
              step.done
                ? "border-honeydew-200 bg-honeydew-50/50"
                : "border-honeydew-100 bg-white"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono ${
                step.done
                  ? "bg-honeydew-500 text-white"
                  : "bg-honeydew-100 text-honeydew-500"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-honeydew-900">{step.title}</p>
              <p className="text-xs text-honeydew-500 mt-0.5 leading-relaxed">
                {step.desc}
              </p>
              {!step.done && (
                <Link
                  href={step.href}
                  className="inline-block mt-2 text-xs font-semibold text-neon-ice-700 hover:text-neon-ice-900"
                >
                  {step.cta} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
