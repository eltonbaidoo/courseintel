import useSWR from "swr";
import { api } from "@/lib/api";

export function useActionPlan(courseId: string | null) {
  return useSWR(
    courseId ? ["courses/action-plan", courseId] : null,
    () => api.getActionPlan(courseId!),
    { revalidateOnFocus: false },
  );
}
