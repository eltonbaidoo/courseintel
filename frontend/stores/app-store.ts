import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Course } from "@/types/course";
import type { GradeEntry } from "@/types/grades";

/** Stable empty list for selectors — do not use inline `?? []` in useAppStore (breaks getSnapshot). */
export const EMPTY_GRADE_ENTRIES: GradeEntry[] = [];

interface User {
  id: string;
  email: string;
}

interface AppState {
  /* ── Auth ── */
  user: User | null;
  setUser: (user: User | null) => void;

  /* ── Courses ── */
  courses: Course[];
  addCourse: (course: Course) => void;
  removeCourse: (id: string) => void;
  getCourse: (id: string) => Course | undefined;

  /* ── Grade Entries (keyed by courseId) ── */
  gradeEntries: Record<string, GradeEntry[]>;
  getGradeEntries: (courseId: string) => GradeEntry[];
  addGradeEntry: (courseId: string, entry: GradeEntry) => void;
  removeGradeEntry: (courseId: string, entryId: string) => void;
  clearGradeEntries: (courseId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      /* ── Auth ── */
      user: null,
      setUser: (user) => set({ user }),

      /* ── Courses ── */
      courses: [],
      addCourse: (course) =>
        set((s) => ({ courses: [...s.courses, course] })),
      removeCourse: (id) =>
        set((s) => ({
          courses: s.courses.filter((c) => c.id !== id),
          gradeEntries: Object.fromEntries(
            Object.entries(s.gradeEntries).filter(([k]) => k !== id),
          ),
        })),
      getCourse: (id) => get().courses.find((c) => c.id === id),

      /* ── Grade Entries ── */
      gradeEntries: {},
      getGradeEntries: (courseId) =>
        get().gradeEntries[courseId] ?? EMPTY_GRADE_ENTRIES,
      addGradeEntry: (courseId, entry) =>
        set((s) => ({
          gradeEntries: {
            ...s.gradeEntries,
            [courseId]: [...(s.gradeEntries[courseId] ?? []), entry],
          },
        })),
      removeGradeEntry: (courseId, entryId) =>
        set((s) => ({
          gradeEntries: {
            ...s.gradeEntries,
            [courseId]: (s.gradeEntries[courseId] ?? []).filter(
              (e) => e.id !== entryId,
            ),
          },
        })),
      clearGradeEntries: (courseId) =>
        set((s) => ({
          gradeEntries: { ...s.gradeEntries, [courseId]: [] },
        })),
    }),
    {
      name: "courseintel-store",
      // Don't persist user; Supabase session handles that
      partialize: (state) => ({
        courses: state.courses,
        gradeEntries: state.gradeEntries,
      }),
    },
  ),
);
