export interface GradeEntry {
  id: string;
  courseId: string;
  assignmentTitle: string;
  category: string;
  scoreEarned: number;
  scorePossible: number;
  dueDate?: string | null;
  source: "manual" | "scraped" | "syllabus";
}

/** Maps to backend GradeEntryCreate for API calls */
export interface GradeEntryPayload {
  course_id: string;
  assignment_title: string;
  category: string;
  score_earned: number;
  score_possible: number;
  due_date?: string | null;
  source: string;
}

export interface ComputeGradeResponse {
  current_grade_pct: number;
  letter_grade: string;
  category_breakdown: Record<string, number>;
  weight_graded: number;
}

export interface GoalSimulatorResponse {
  required_pct: number | null;
  feasible: boolean;
  message: string;
}
