import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api";
import type { BootstrapResponse, Course } from "@/types/course";
import { useCallback } from "react";

/** Bundled URI CSC 212 demo — same shape as `POST /courses/bootstrap`. */
export const DEMO_BOOTSTRAP_PATH = "/demo/csc212-uri-bootstrap-demo.json";
export const DEMO_COURSE_ID = "demo-csc212-uri-spring2025";

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

/**
 * Load the static CSC 212 / URI demo into Zustand (no backend / LLM).
 * Replaces any existing course with the same id so repeat clicks stay idempotent.
 */
export function useDemoCourse() {
  const addCourse = useAppStore((s) => s.addCourse);
  const removeCourse = useAppStore((s) => s.removeCourse);

  const loadDemoCourse = useCallback(async (): Promise<Course> => {
    const res = await fetch(DEMO_BOOTSTRAP_PATH);
    if (!res.ok) {
      throw new Error(`Demo bundle not found (${res.status}). Is the file under public/demo/?`);
    }
    const data = (await res.json()) as BootstrapResponse;
    const id = String(data.id ?? DEMO_COURSE_ID);
    removeCourse(id);
    const ident = data.course_identity;
    const courseName =
      ident?.canonical_name && ident?.course_code
        ? `${ident.course_code} · ${ident.canonical_name}`
        : ident?.course_code ?? "CSC 212";
    const course: Course = {
      id,
      university: ident?.university ?? "University of Rhode Island",
      courseName,
      courseCode: ident?.course_code ?? "CSC 212",
      professor: "Marco Alvarez",
      createdAt: new Date().toISOString(),
      bootstrap: { ...data, id },
    };
    addCourse(course);
    return course;
  }, [addCourse, removeCourse]);

  return { loadDemoCourse };
}
