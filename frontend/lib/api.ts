import { supabase } from "@/lib/supabase";
import { DEV_AUTH_BYPASS, DEV_BEARER_TOKEN } from "@/lib/dev-auth";
import type { BootstrapResponse } from "@/types/course";
import type {
  ComputeGradeResponse,
  GoalSimulatorResponse,
  GradeEntryPayload,
} from "@/types/grades";
import type { ScrapePayload, ScrapeValidationResponse } from "@/types/extension";

export interface ActionPlanResponse {
  risk_level: "low" | "medium" | "high" | "critical" | "unknown";
  risk_explanation?: string;
  weekly_actions: {
    title: string;
    rationale: string;
    priority: number;
    due_date?: string | null;
  }[];
  missing_data_flags: string[];
  focus_note: string;
}

export interface StudyAnalysisResponse {
  summary: string;
  key_topics: string[];
  weak_coverage: string[];
  study_priorities: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ClerkTokenGetter = () => Promise<string | null>;

let clerkTokenGetter: ClerkTokenGetter | null = null;

/** Called from `ClerkTokenBridge` when Clerk auth is enabled. */
export function setClerkTokenGetter(fn: ClerkTokenGetter | null): void {
  clerkTokenGetter = fn;
}

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
  // In local dev, always use the dev bearer so any logged-in user can hit the backend
  // without needing SUPABASE_JWT_SECRET configured locally.
  if (DEV_AUTH_BYPASS) {
    return { Authorization: `Bearer ${DEV_BEARER_TOKEN}` };
  }
  if (clerkTokenGetter) {
    try {
      const token = await clerkTokenGetter();
      if (token) return { Authorization: `Bearer ${token}` };
    } catch {
      /* session not ready */
    }
  }
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
    request<ActionPlanResponse>(`/courses/${courseId}/action-plan`),

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

  addGradeEntry: (courseId: string, entry: Omit<GradeEntryPayload, "course_id">) =>
    request<{ id: string }>(`/grades/courses/${courseId}/entries`, {
      method: "POST",
      body: JSON.stringify(entry),
    }),

  deleteGradeEntry: (entryId: string) =>
    request<{ deleted: boolean }>(`/grades/entries/${entryId}`, {
      method: "DELETE",
    }),

  /* ── Study ── */
  uploadStudyMaterial: async (courseId: string, formData: FormData) => {
    const auth = await getAuthHeaders();
    const res = await fetch(`${API_URL}/study/courses/${courseId}/upload`, {
      method: "POST",
      headers: auth,
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(res.status, text);
    }
    return res.json() as Promise<{ id: string; title: string; content_length: number }>;
  },

  analyzeStudyContext: (courseId: string) =>
    request<StudyAnalysisResponse>(`/study/courses/${courseId}/analyze`, {
      method: "POST",
    }),

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
