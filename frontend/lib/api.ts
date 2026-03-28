const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  bootstrapCourse: (formData: FormData) =>
    fetch(`${API_URL}/courses/bootstrap`, { method: "POST", body: formData }).then((r) => r.json()),

  computeGrades: (entries: unknown[], categories: Record<string, number>) =>
    request("/grades/compute", {
      method: "POST",
      body: JSON.stringify({ entries, categories }),
    }),

  simulateGoal: (courseId: string, targetLetter: string, currentGrade: number, remainingWeight: number) =>
    request(`/grades/goal-simulator?current_grade=${currentGrade}&remaining_weight=${remainingWeight}`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, target_letter: targetLetter }),
    }),

  submitScrape: (payload: unknown) =>
    request("/extension/scrape", { method: "POST", body: JSON.stringify(payload) }),

  getOrchestration: (platform: string, courseContext = "") =>
    request(`/extension/orchestrate/${platform}?course_context=${encodeURIComponent(courseContext)}`),

  getPlatformHelp: (platform: string) =>
    request(`/extension/help/${platform}`),
};
