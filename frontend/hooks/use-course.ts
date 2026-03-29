import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api";
import type { BootstrapResponse, Course } from "@/types/course";
import { useCallback } from "react";

export function useCourse(id: string): Course | undefined {
  return useAppStore((s) => s.courses.find((c) => c.id === id));
}

export function useCourses() {
  return useAppStore((s) => s.courses);
}

export function useBootstrap() {
  const addCourse = useAppStore((s) => s.addCourse);

  const bootstrap = useCallback(
    async (
      formData: FormData,
      meta: { university: string; course: string; professor: string },
    ): Promise<Course> => {
      const res: BootstrapResponse = await api.bootstrapCourse(formData);
      const id = res.id ?? crypto.randomUUID();
      const course: Course = {
        id,
        university: meta.university,
        courseName: meta.course,
        courseCode: res.course_identity?.course_code ?? meta.course,
        professor: meta.professor,
        createdAt: new Date().toISOString(),
        bootstrap: res,
      };
      addCourse(course);
      return course;
    },
    [addCourse],
  );

  return { bootstrap };
}
