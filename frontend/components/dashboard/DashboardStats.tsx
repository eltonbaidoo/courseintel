"use client";

import type { Course } from "@/types/course";
import type { GradeEntry } from "@/types/grades";

function courseGradePct(entries: GradeEntry[]): number | null {
  if (!entries.length) return null;
  let earned = 0;
  let possible = 0;
  for (const e of entries) {
    earned += e.scoreEarned;
    possible += e.scorePossible;
  }
  return possible > 0 ? (earned / possible) * 100 : null;
}

function aggregateStats(courses: Course[], gradeEntries: Record<string, GradeEntry[]>) {
  let deadlineCount = 0;
  const toolNames = new Set<string>();
  const grades: number[] = [];

  for (const c of courses) {
    deadlineCount += c.bootstrap.course_profile?.key_deadlines?.length ?? 0;
    for (const t of c.bootstrap.detected_tools ?? []) {
      toolNames.add(t.tool_name);
    }
    const pct = courseGradePct(gradeEntries[c.id] ?? []);
    if (pct != null) grades.push(pct);
  }

  const avgGrade =
    grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;

  return {
    courseCount: courses.length,
    avgGrade,
    gradedCourses: grades.length,
    deadlineCount,
    toolCount: toolNames.size,
  };
}

export function DashboardStats({
  courses,
  gradeEntries,
}: {
  courses: Course[];
  gradeEntries: Record<string, GradeEntry[]>;
}) {
  const s = aggregateStats(courses, gradeEntries);

  const items = [
    {
      label: "Courses",
      value: String(s.courseCount),
      hint: "tracked this term",
    },
    {
      label: "Avg. grade",
      value: s.avgGrade != null ? `${s.avgGrade.toFixed(1)}%` : "—",
      hint:
        s.gradedCourses > 0
          ? `${s.gradedCourses} course${s.gradedCourses !== 1 ? "s" : ""} with entries`
          : "add grades to see average",
    },
    {
      label: "Deadlines",
      value: String(s.deadlineCount),
      hint: "from syllabus intelligence",
    },
    {
      label: "Tools",
      value: String(s.toolCount),
      hint: "platforms detected",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="card border-almond-cream-200 bg-almond-cream-50 p-4"
        >
          <p className="section-label text-[10px] mb-1">{item.label}</p>
          <p className="font-display text-2xl font-bold text-shadow-grey-950 tabular-nums">
            {item.value}
          </p>
          <p className="text-xs text-burnt-peach-500 mt-1 leading-snug">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}
