"use client";

import { use, useState } from "react";
import { useCourse } from "@/hooks/use-course";
import { useAppStore } from "@/stores/app-store";
import { useComputeGrade } from "@/hooks/use-grades";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import type { GradeEntry } from "@/types/grades";

function letterGrade(pct: number) {
  if (pct >= 93) return "A";
  if (pct >= 90) return "A-";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B-";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C-";
  if (pct >= 60) return "D";
  return "F";
}

function gradeColor(pct: number) {
  if (pct >= 90) return "text-espresso-800";
  if (pct >= 80) return "text-almond-cream-600";
  if (pct >= 70) return "text-almond-cream-700";
  return "text-espresso-700";
}

function barColor(pct: number) {
  if (pct >= 90) return "bg-burnt-peach-500";
  if (pct >= 80) return "bg-almond-cream-500";
  if (pct >= 70) return "bg-almond-cream-500";
  return "bg-espresso-800";
}

export default function GradesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = useCourse(id);
  const entries = useAppStore((s) => s.gradeEntries[id] ?? []);
  const addGradeEntry = useAppStore((s) => s.addGradeEntry);
  const removeGradeEntry = useAppStore((s) => s.removeGradeEntry);
  const [saving, setSaving] = useState(false);

  const categories = course?.bootstrap.course_profile?.grading_categories ?? [];
  const categoryNames = categories.length > 0
    ? categories.map((c) => c.name)
    : ["Homework", "Exams", "Projects", "Quizzes", "Participation"];

  const { data: computed } = useComputeGrade(id, categories);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: categoryNames[0] ?? "Homework",
    earned: "",
    possible: "",
  });

  if (!course) {
    return (
      <EmptyState
        icon="🔍"
        title="Course not found"
        description="This course doesn't exist."
        action={{ label: "Back to courses", href: "/dashboard" }}
      />
    );
  }

  // Use API-computed grade if available, else local fallback
  const totalEarned = entries.reduce((s, e) => s + e.scoreEarned, 0);
  const totalPossible = entries.reduce((s, e) => s + e.scorePossible, 0);
  const localPct = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
  const pct = computed?.current_grade_pct ?? localPct;
  const letter = computed?.letter_grade ?? letterGrade(localPct);

  // Category breakdown
  const categoryBreakdown = computed
    ? Object.entries(computed.category_breakdown).map(([cat, avg]) => ({
        cat,
        pct: avg,
      }))
    : categoryNames
        .map((cat) => {
          const catEntries = entries.filter((e) => e.category === cat);
          if (!catEntries.length) return null;
          const e = catEntries.reduce((s, e) => s + e.scoreEarned, 0);
          const p = catEntries.reduce((s, e) => s + e.scorePossible, 0);
          return { cat, pct: p > 0 ? (e / p) * 100 : 0 };
        })
        .filter(Boolean) as { cat: string; pct: number }[];

  async function addEntry() {
    if (!form.title || !form.earned || !form.possible) return;
    setSaving(true);
    const entry: GradeEntry = {
      id: crypto.randomUUID(),
      courseId: id,
      assignmentTitle: form.title,
      category: form.category,
      scoreEarned: parseFloat(form.earned),
      scorePossible: parseFloat(form.possible),
      source: "manual",
    };
    // Save to local store immediately (optimistic)
    addGradeEntry(id, entry);
    setForm({ title: "", category: categoryNames[0] ?? "Homework", earned: "", possible: "" });
    setShowForm(false);
    setSaving(false);
    // Persist to backend (fire-and-forget; don't block UI)
    api.addGradeEntry(id, {
      assignment_title: entry.assignmentTitle,
      category: entry.category,
      score_earned: entry.scoreEarned,
      score_possible: entry.scorePossible,
      source: "manual",
    }).catch(() => {/* local store already updated */});
  }

  function deleteEntry(entryId: string) {
    removeGradeEntry(id, entryId);
    api.deleteGradeEntry(entryId).catch(() => {/* local store already updated */});
  }

  return (
    <div className="space-y-6 stagger">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1">Performance</p>
          <h1 className="font-display text-3xl font-bold text-shadow-grey-950">
            Grades
          </h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-secondary">
          + Add Grade
        </button>
      </div>

      {/* Current grade hero */}
      {entries.length > 0 ? (
        <div className="card p-6 flex items-center gap-8">
          <div className="text-center shrink-0">
            <p className={`font-mono text-6xl font-bold ${gradeColor(pct)}`}>
              {pct.toFixed(1)}
              <span className="text-2xl text-almond-cream-400">%</span>
            </p>
            <p
              className={`font-display text-2xl font-bold mt-1 ${gradeColor(pct)}`}
            >
              {letter}
            </p>
            <p className="text-xs text-almond-cream-400 mt-1">
              {totalEarned}/{totalPossible} pts
            </p>
            {computed?.weight_graded != null && (
              <p className="text-xs text-almond-cream-400">
                {computed.weight_graded}% of grade assessed
              </p>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <p className="section-label">By Category</p>
            {categoryBreakdown.map(({ cat, pct }) => (
              <div key={cat}>
                <div className="flex justify-between text-xs text-espresso-800 mb-1">
                  <span>{cat}</span>
                  <span className="font-mono font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-almond-cream-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor(pct)} transition-all`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon="📊"
          title="No grades yet"
          description="Add your first grade to see your standing."
        />
      )}

      {/* Add form */}
      {showForm && (
        <div className="card p-5 border-almond-cream-300 animate-fade-up">
          <p className="section-label mb-3">New Entry</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              className="input col-span-2"
              placeholder="Assignment title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categoryNames.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                className="input"
                type="number"
                placeholder="Earned"
                value={form.earned}
                onChange={(e) => setForm({ ...form, earned: e.target.value })}
              />
              <input
                className="input"
                type="number"
                placeholder="/ Total"
                value={form.possible}
                onChange={(e) =>
                  setForm({ ...form, possible: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addEntry} disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries table */}
      {entries.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-almond-cream-50 border-b border-almond-cream-100">
                <th className="px-5 py-3 text-left section-label">Assignment</th>
                <th className="px-5 py-3 text-left section-label">Category</th>
                <th className="px-5 py-3 text-right section-label">Score</th>
                <th className="px-5 py-3 text-right section-label">%</th>
                <th className="px-5 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const p =
                  e.scorePossible > 0
                    ? (e.scoreEarned / e.scorePossible) * 100
                    : 0;
                return (
                  <tr
                    key={e.id}
                    className="border-t border-almond-cream-50 hover:bg-almond-cream-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-shadow-grey-900">
                      {e.assignmentTitle}
                    </td>
                    <td className="px-5 py-3 text-burnt-peach-500">{e.category}</td>
                    <td className="px-5 py-3 text-right font-mono text-espresso-900">
                      {e.scoreEarned}/{e.scorePossible}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-mono font-semibold ${gradeColor(p)}`}
                    >
                      {p.toFixed(0)}%
                    </td>
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={() => deleteEntry(e.id)}
                        className="text-almond-cream-300 hover:text-espresso-800 text-xs transition-colors"
                        title="Delete"
                      >
                        x
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
