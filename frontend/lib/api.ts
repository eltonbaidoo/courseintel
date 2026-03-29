import { supabase } from "@/lib/supabase";
import type { BootstrapResponse } from "@/types/course";
import type {
  ComputeGradeResponse,
  GoalSimulatorResponse,
  GradeEntryPayload,
} from "@/types/grades";
import type { ScrapePayload, ScrapeValidationResponse } from "@/types/extension";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body}`);
    this.name = "ApiError";
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export const api = {
  /* ── Courses ── */
  bootstrapCourse: async (formData: FormData): Promise<BootstrapResponse> => {
    const auth = await getAuthHeaders();
    const res = await fetch(`${API_URL}/courses/bootstrap`, {
      method: "POST",
      headers: auth,
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(res.status, text);
    }
    return res.json();
  },

  getActionPlan: (courseId: string) =>
    request<{ message: string }>(`/courses/${courseId}/action-plan`),

  /* ── Grades ── */
  computeGrades: (entries: GradeEntryPayload[], categories: Record<string, number>) =>
    request<ComputeGradeResponse>("/grades/compute", {
      method: "POST",
      body: JSON.stringify({ entries, categories }),
    }),

  simulateGoal: (
    courseId: string,
    targetLetter: string,
    currentGrade: number,
    remainingWeight: number,
  ) =>
    request<GoalSimulatorResponse>(
      `/grades/goal-simulator?current_grade=${currentGrade}&remaining_weight=${remainingWeight}`,
      {
        method: "POST",
        body: JSON.stringify({ course_id: courseId, target_letter: targetLetter }),
      },
    ),

  /* ── Extension ── */
  submitScrape: (payload: ScrapePayload) =>
    request<ScrapeValidationResponse>("/extension/scrape", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getOrchestration: (platform: string, courseContext = "") =>
    request<unknown>(
      `/extension/orchestrate/${platform}?course_context=${encodeURIComponent(courseContext)}`,
    ),

  getPlatformHelp: (platform: string) =>
    request<Record<string, string>>(`/extension/help/${platform}`),
};
