import useSWR from "swr";
import { api } from "@/lib/api";
import { EMPTY_GRADE_ENTRIES, useAppStore } from "@/stores/app-store";
import type { GradeEntry, GradeEntryPayload, ComputeGradeResponse } from "@/types/grades";
import type { GradingCategory } from "@/types/course";

function toPayload(entry: GradeEntry): GradeEntryPayload {
  return {
    course_id: entry.courseId,
    assignment_title: entry.assignmentTitle,
    category: entry.category,
    score_earned: entry.scoreEarned,
    score_possible: entry.scorePossible,
    due_date: entry.dueDate,
    source: entry.source,
  };
}

export function useComputeGrade(
  courseId: string,
  categories: GradingCategory[],
) {
  const entriesRaw = useAppStore((s) => s.gradeEntries[courseId]);
  const entries = entriesRaw ?? EMPTY_GRADE_ENTRIES;
  const categoryMap = Object.fromEntries(categories.map((c) => [c.name, c.weight]));

  return useSWR<ComputeGradeResponse>(
    entries.length > 0 ? ["grades/compute", courseId, entries.length] : null,
    () => api.computeGrades(entries.map(toPayload), categoryMap),
    { revalidateOnFocus: false },
  );
}

export function useGoalSimulator(
  courseId: string,
  targetLetter: string | null,
  currentGrade: number,
  remainingWeight: number,
) {
  return useSWR(
    targetLetter
      ? ["grades/goal", courseId, targetLetter, currentGrade, remainingWeight]
      : null,
    () =>
      api.simulateGoal(courseId, targetLetter!, currentGrade, remainingWeight),
    { revalidateOnFocus: false },
  );
}
