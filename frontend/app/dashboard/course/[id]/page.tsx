"use client";

import Link from "next/link";
import { use } from "react";
import { useCourse } from "@/hooks/use-course";
import { EMPTY_GRADE_ENTRIES, useAppStore } from "@/stores/app-store";
import { GradeBar } from "@/components/ui/GradeBar";
import { EmptyState } from "@/components/ui/EmptyState";

const WORKLOAD_BADGE: Record<string, string> = {
  high: "badge-coral",
  medium: "badge-yellow",
  low: "badge-green",
};

const QUICK_LINKS = [
  { href: "resources", label: "Tools & Resources", desc: "Detected platforms + public materials", color: "bg-burnt-peach-50 border-burnt-peach-200 text-burnt-peach-700" },
  { href: "grades", label: "Grades", desc: "Track and compute your standing", color: "bg-almond-cream-50 border-almond-cream-200 text-espresso-900" },
  { href: "goals", label: "Goal Simulator", desc: "What do I need to get a B+?", color: "bg-almond-cream-50 border-almond-cream-200 text-almond-cream-700" },
  { href: "study", label: "Study Buddy", desc: "Upload notes → get priorities", color: "bg-almond-cream-50 border-almond-cream-200 text-almond-cream-700" },
  { href: "actions", label: "Action Board", desc: "Weekly plan from Judgment Agent", color: "bg-espresso-50 border-espresso-200 text-espresso-800" },
];

export default function CourseProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = useCourse(id);
  const entriesRaw = useAppStore((s) => s.gradeEntries[id]);
  const entries = entriesRaw ?? EMPTY_GRADE_ENTRIES;

  if (!course) {
    return (
      <EmptyState
        icon="🔍"
        title="Course not found"
        description="This course doesn't exist or has been removed."
        action={{ label: "Back to My Courses", href: "/dashboard" }}
      />
    );
  }

  const { bootstrap } = course;
  const { course_profile: profile, student_signal: signal, syllabus_status } = bootstrap;
  const categories = profile?.grading_categories ?? [];
  const keyWarnings = signal?.key_warnings ?? [];
  const positiveSignals = signal?.positive_signals ?? [];

  // Quick local grade computation
  let gradePct: number | null = null;
  if (entries.length > 0) {
    let earned = 0;
    let possible = 0;
    for (const e of entries) {
      earned += e.scoreEarned;
      possible += e.scorePossible;
    }
    if (possible > 0) gradePct = (earned / possible) * 100;
  }

  const letterGrade = gradePct != null
    ? gradePct >= 93 ? "A" : gradePct >= 90 ? "A-" : gradePct >= 87 ? "B+" : gradePct >= 83 ? "B" : gradePct >= 80 ? "B-" : gradePct >= 77 ? "C+" : gradePct >= 73 ? "C" : gradePct >= 70 ? "C-" : gradePct >= 60 ? "D" : "F"
    : null;

  return (
    <div className="space-y-6 stagger">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="section-label mb-1">
            {course.university} {course.professor ? `· ${course.professor}` : ""}
          </p>
          <h1 className="font-display text-3xl font-bold text-shadow-grey-950">
            {course.courseCode}
          </h1>
          <p className="text-espresso-800 mt-0.5">{course.courseName}</p>
        </div>
        {syllabus_status && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                syllabus_status.found
                  ? "bg-almond-cream-100 text-espresso-950 border-almond-cream-200"
                  : "bg-almond-cream-50 text-almond-cream-800 border-almond-cream-200"
              }`}
            >
              Syllabus {syllabus_status.found ? "located" : "not found"}{" "}
              <span className="font-mono font-normal opacity-70">
                · {(syllabus_status.confidence * 100).toFixed(0)}%
              </span>
            </span>
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-almond-cream-50 text-espresso-800 border border-almond-cream-100">
              {syllabus_status.source === "upload" ? "From upload" : "From discovery"}
            </span>
          </div>
        )}
      </div>

      {profile?.course_summary && (
        <div className="card p-5 border-almond-cream-100">
          <p className="section-label mb-2">Course summary</p>
          <p className="text-sm text-espresso-900 leading-relaxed whitespace-pre-wrap">
            {profile.course_summary}
          </p>
          {profile.workflow_notes && (
            <p className="text-xs text-burnt-peach-500 mt-3 pt-3 border-t border-almond-cream-50">
              <span className="font-semibold text-espresso-800">Workflow:</span>{" "}
              {profile.workflow_notes}
            </p>
          )}
        </div>
      )}

      {/* Grade + grading breakdown */}
      <div className="card p-5">
        <div className="flex items-center gap-6 mb-5">
          <div className="text-center shrink-0">
            {gradePct != null ? (
              <>
                <p className="font-mono text-5xl font-bold text-almond-cream-600">
                  {gradePct.toFixed(1)}%
                </p>
                <p className="font-display text-xl font-bold text-almond-cream-500">
                  {letterGrade}
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-3xl font-bold text-almond-cream-300">
                  --%
                </p>
                <p className="text-xs text-almond-cream-400 mt-1">No grades yet</p>
              </>
            )}
          </div>
          {categories.length > 0 && (
            <>
              <div className="divider h-16 w-px border-l" />
              <div className="flex-1 space-y-2">
                {categories.map((g) => (
                  <div key={g.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-espresso-800">
                        {g.name}{" "}
                        <span className="text-almond-cream-400">
                          ({(g.weight * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-almond-cream-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-almond-cream-400`}
                        style={{ width: `${g.weight * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {(profile?.late_policy || profile?.attendance_policy || profile?.drop_rules) && (
          <div className="pt-4 border-t border-almond-cream-50 space-y-2">
            {profile?.late_policy && (
              <p className="text-xs text-burnt-peach-500">
                <span className="font-semibold text-espresso-900">Late policy:</span>{" "}
                {profile.late_policy}
              </p>
            )}
            {profile?.attendance_policy && (
              <p className="text-xs text-burnt-peach-500">
                <span className="font-semibold text-espresso-900">Attendance:</span>{" "}
                {profile.attendance_policy}
              </p>
            )}
            {profile?.drop_rules && (
              <p className="text-xs text-burnt-peach-500">
                <span className="font-semibold text-espresso-900">Drop / withdrawal:</span>{" "}
                {profile.drop_rules}
              </p>
            )}
          </div>
        )}
      </div>

      {profile?.required_tools && profile.required_tools.length > 0 && (
        <div className="card p-5">
          <p className="section-label mb-3">Required tools (syllabus)</p>
          <div className="flex flex-wrap gap-2">
            {profile.required_tools.map((t) => (
              <span
                key={t}
                className="badge bg-burnt-peach-50 text-burnt-peach-800 border border-burnt-peach-200"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Student signal */}
      {signal &&
        (keyWarnings.length > 0 ||
          positiveSignals.length > 0 ||
          signal.workload) && (
        <div className="card p-5">
          <p className="section-label mb-3">Student Signal</p>
          <div className="flex flex-wrap gap-3 mb-3">
            {signal.workload && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-burnt-peach-500">Workload</span>
                <span className={WORKLOAD_BADGE[signal.workload] ?? "badge"}>
                  {signal.workload.charAt(0).toUpperCase() + signal.workload.slice(1)}
                </span>
              </div>
            )}
            {signal.grading_style && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-burnt-peach-500">Grading</span>
                <span className="badge-yellow">
                  {signal.grading_style.charAt(0).toUpperCase() + signal.grading_style.slice(1)}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {keyWarnings.map((w) => (
              <div
                key={w}
                className="flex items-start gap-2 text-xs text-espresso-800 bg-espresso-50 rounded-lg px-3 py-2"
              >
                <span className="text-espresso-800 mt-0.5">!</span> {w}
              </div>
            ))}
            {positiveSignals.map((p) => (
              <div
                key={p}
                className="flex items-start gap-2 text-xs text-espresso-900 bg-almond-cream-50 rounded-lg px-3 py-2"
              >
                <span className="text-burnt-peach-500 mt-0.5">+</span> {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div>
        <p className="section-label mb-3">Sections</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={`/dashboard/course/${id}/${l.href}`}
              className={`card-hover p-4 border ${l.color}`}
            >
              <p className="font-semibold font-display text-sm">{l.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
