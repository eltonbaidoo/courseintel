"use client";

import { use } from "react";
import { useCourse } from "@/hooks/use-course";
import { useActionPlan } from "@/hooks/use-action-plan";
import { EmptyState } from "@/components/ui/EmptyState";

const urgencyStyle: Record<string, string> = {
  high: "border-l-coral-400 bg-coral-50",
  medium: "border-l-banana-400 bg-banana-50",
  low: "border-l-honeydew-300 bg-honeydew-50",
};
const urgencyDot: Record<string, string> = {
  high: "bg-coral-500",
  medium: "bg-banana-500",
  low: "bg-honeydew-400",
};

export default function ActionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = useCourse(id);
  const { data: plan, error, isLoading, mutate } = useActionPlan(course ? id : null);

  if (!course) {
    return (
      <EmptyState
        icon="🔍"
        title="Course not found"
        description="This course doesn't exist."
        action={{ label: "Back to courses", href: "/dashboard" }}
      />
    );
  }

  const deadlines = course.bootstrap.course_profile?.key_deadlines ?? [];

  return (
    <div className="space-y-6 stagger">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">Judgment Agent</p>
          <h1 className="font-display text-3xl font-bold text-honeydew-950">
            Action Board
          </h1>
          <p className="text-honeydew-500 text-sm mt-1">
            Prioritized actions based on your course data.
          </p>
        </div>
      </div>

      {/* Live action-plan slot (backend returns placeholder until DB + Judgment) */}
      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="section-label mb-0">Server action plan</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="text-xs font-semibold text-neon-ice-700 hover:text-neon-ice-900"
          >
            Refresh
          </button>
        </div>
        {isLoading && (
          <p className="text-sm text-honeydew-500">Checking API…</p>
        )}
        {error && (
          <p className="text-sm text-coral-700">
            Could not load action plan. Is the API running at{" "}
            <span className="font-mono text-xs">NEXT_PUBLIC_API_URL</span>?
          </p>
        )}
        {plan && (
          <div className="rounded-xl border border-honeydew-100 bg-honeydew-50/80 p-4">
            <p className="text-sm text-honeydew-800 leading-relaxed">{plan.message}</p>
            <p className="text-xs text-honeydew-500 mt-2">
              When the Judgment agent is wired to your stored courses, this panel will list
              prioritized tasks for the week.
            </p>
          </div>
        )}
      </div>

      <div className="card border-banana-200 bg-banana-50 p-4 flex items-start gap-3">
        <span className="text-xl mt-0.5">📌</span>
        <div>
          <p className="font-semibold text-banana-900 text-sm font-display">
            Deadlines below are from your syllabus profile
          </p>
          <p className="text-banana-800 text-sm mt-0.5">
            Use Grades and Study Buddy to enrich context; the full Judgment pipeline will
            merge those signals into a single weekly plan.
          </p>
        </div>
      </div>

      {/* Deadlines from bootstrap */}
      {deadlines.length > 0 ? (
        <div className="space-y-3">
          <p className="section-label">Upcoming Deadlines</p>
          {deadlines.map((d, i) => {
            const urgency =
              d.type === "exam"
                ? "high"
                : d.type === "assignment"
                  ? "medium"
                  : "low";
            return (
              <div
                key={i}
                className={`card border-l-4 p-4 ${urgencyStyle[urgency]}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${urgencyDot[urgency]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs text-honeydew-400">
                        #{i + 1}
                      </span>
                      <span className="font-semibold text-honeydew-900 text-sm">
                        {d.title}
                      </span>
                      <span className="badge-ice ml-auto">{d.type}</span>
                    </div>
                  </div>
                  {d.date && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-honeydew-400">Due</p>
                      <p className="font-mono font-semibold text-sm text-honeydew-700">
                        {d.date}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="📋"
          title="No deadlines yet"
          description="Deadlines will appear here once your course profile is built and the Judgment Agent is connected."
        />
      )}
    </div>
  );
}
