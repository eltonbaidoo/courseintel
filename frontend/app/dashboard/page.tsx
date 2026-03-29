"use client";

import Link from "next/link";
import { useCourses } from "@/hooks/use-course";
import { useAppStore } from "@/stores/app-store";
import { GradeBar } from "@/components/ui/GradeBar";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ExtensionPromo } from "@/components/dashboard/ExtensionPromo";
import { NextStepsCard } from "@/components/dashboard/NextStepsCard";
import type { Course } from "@/types/course";

function gradeRisk(pct: number | null): "low" | "medium" | "high" {
  if (pct == null) return "low";
  if (pct >= 85) return "low";
  if (pct >= 70) return "medium";
  return "high";
}

function CourseCard({ course }: { course: Course }) {
  const entries = useAppStore((s) => s.gradeEntries[course.id] ?? []);
  let grade: number | null = null;
  if (entries.length > 0) {
    let earned = 0;
    let possible = 0;
    for (const e of entries) {
      earned += e.scoreEarned;
      possible += e.scorePossible;
    }
    if (possible > 0) grade = (earned / possible) * 100;
  }

  const tools = course.bootstrap.detected_tools ?? [];
  const risk = gradeRisk(grade);

  return (
    <Link
      href={`/dashboard/course/${course.id}`}
      className="card-hover p-5 flex flex-col gap-4 group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">{course.university}</p>
          <h2 className="font-display font-bold text-honeydew-900 text-lg leading-tight">
            {course.courseCode}
          </h2>
          <p className="text-honeydew-600 text-sm">{course.courseName}</p>
        </div>
        {grade != null && <RiskBadge risk={risk} />}
      </div>

      {/* Grade bar */}
      {grade != null ? (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-honeydew-500">Current Grade</span>
            <span className="font-mono font-semibold text-honeydew-800">
              {grade.toFixed(1)}%
            </span>
          </div>
          <GradeBar percent={grade} size="sm" />
        </div>
      ) : (
        <p className="text-xs text-honeydew-400">No grades entered yet</p>
      )}

      {/* Tools */}
      <div className="flex items-center gap-2 flex-wrap">
        {tools.slice(0, 3).map((t) => (
          <span
            key={t.tool_name}
            className="badge bg-neon-ice-50 text-neon-ice-700 border border-neon-ice-200"
          >
            {t.tool_name}
          </span>
        ))}
        {course.professor && (
          <span className="text-xs text-honeydew-400 ml-auto">
            by {course.professor}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const courses = useCourses();
  const gradeEntries = useAppStore((s) => s.gradeEntries);

  if (courses.length === 0) {
    return (
      <div className="stagger">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-honeydew-950">
            My Courses
          </h1>
        </div>
        <ExtensionPromo />
        <div className="mt-8">
          <EmptyState
            icon="📚"
            title="No courses yet"
            description="Add your first course to get started. CourseIntel will find the syllabus, detect tools, and build your intelligence model."
            action={{ label: "+ Add Course", href: "/dashboard/course/new/setup" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="stagger space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-honeydew-950">
            My Courses
          </h1>
          <p className="text-honeydew-600 text-sm mt-1">
            {courses.length} course{courses.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <Link href="/dashboard/course/new/setup" className="btn-primary shrink-0">
          + Add Course
        </Link>
      </div>

      <DashboardStats courses={courses} gradeEntries={gradeEntries} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ExtensionPromo />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}

            <Link
              href="/dashboard/course/new/setup"
              className="card border-dashed border-honeydew-200 p-5 flex flex-col items-center justify-center gap-2 text-center hover:border-honeydew-400 hover:bg-honeydew-50 transition-all duration-200 min-h-40"
            >
              <div className="w-10 h-10 rounded-xl bg-honeydew-100 flex items-center justify-center text-honeydew-500 text-xl">
                +
              </div>
              <p className="font-semibold text-honeydew-600 text-sm">
                Add another course
              </p>
              <p className="text-xs text-honeydew-400">
                CourseIntel will find the syllabus automatically
              </p>
            </Link>
          </div>
        </div>
        <div className="lg:col-span-1">
          <NextStepsCard courses={courses} gradeEntries={gradeEntries} />
        </div>
      </div>
    </div>
  );
}
