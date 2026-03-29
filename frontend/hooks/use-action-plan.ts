import useSWR from "swr";
import { api } from "@/lib/api";

export function useActionPlan(courseId: string | null) {
  const isDemoCourse = Boolean(courseId?.startsWith("demo-"));
  return useSWR(
    courseId && !isDemoCourse ? ["courses/action-plan", courseId] : null,
    () => api.getActionPlan(courseId!),
    { revalidateOnFocus: false },
  );
}
