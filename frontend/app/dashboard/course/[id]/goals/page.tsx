"use client";

import { use, useState, useEffect } from "react";
import { useCourse } from "@/hooks/use-course";
import { useGoalSimulator, useComputeGrade } from "@/hooks/use-grades";
import { useAppStore } from "@/stores/app-store";
import { EmptyState } from "@/components/ui/EmptyState";

const TARGETS: Record<string, number> = {
  A: 93, "A-": 90, "B+": 87, B: 83, "B-": 80, "C+": 77, C: 73, "C-": 70, D: 60,
};

function gradeColor(pct: number | null) {
  if (pct === null) return "";
  if (pct > 100) return "text-espresso-700";
  if (pct > 90) return "text-espresso-800";
  if (pct > 80) return "text-almond-cream-600";
  return "text-almond-cream-700";
}

export default function GoalSimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = useCourse(id);
  const categories = course?.bootstrap.course_profile?.grading_categories ?? [];
  const entries = useAppStore((s) => s.gradeEntries[id] ?? []);

  const { data: computed } = useComputeGrade(id, categories);

  // Pre-populate from computed grade if available
  const defaultGrade = computed?.current_grade_pct?.toFixed(0) ?? "82";
  const defaultRemaining = computed?.weight_graded != null
    ? (100 - computed.weight_graded).toFixed(0)
    : "40";

  const [currentGrade, setCurrentGrade] = useState(defaultGrade);
  const [remainingWeight, setRemainingWeight] = useState(defaultRemaining);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (computed?.current_grade_pct != null) {
      setCurrentGrade(computed.current_grade_pct.toFixed(0));
    }
    if (computed?.weight_graded != null) {
      setRemainingWeight((100 - computed.weight_graded).toFixed(0));
    }
  }, [computed?.current_grade_pct, computed?.weight_graded]);

  const current = parseFloat(currentGrade);
  const remaining = parseFloat(remainingWeight) / 100;

  // Use backend goal simulator if target is selected
  const { data: goalResult } = useGoalSimulator(
    id,
    target,
    current,
    remaining,
  );

  // Fallback to local calculation
  const targetPct = target ? TARGETS[target] ?? 80 : null;
  let required: number | null = null;
  if (goalResult) {
    required = goalResult.required_pct;
  } else if (targetPct !== null && !isNaN(current) && !isNaN(remaining) && remaining > 0) {
    const earned = (current / 100) * (1 - remaining);
    required = ((targetPct / 100) - earned) / remaining * 100;
  }

  const feasible = goalResult ? goalResult.feasible : (required !== null && required <= 100);

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

  return (
    <div className="max-w-lg space-y-6 stagger">
      <div>
        <p className="section-label mb-1">Grade Intelligence</p>
        <h1 className="font-display text-3xl font-bold text-shadow-grey-950">
          Goal Simulator
        </h1>
        <p className="text-burnt-peach-500 text-sm mt-1">
          See exactly what you need to hit your target grade.
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-espresso-800 mb-1.5">
            Current Grade (%)
          </label>
          <input
            type="number"
            value={currentGrade}
            onChange={(e) => setCurrentGrade(e.target.value)}
            className="input font-mono"
            placeholder="e.g. 82"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-espresso-800 mb-1.5">
            Remaining Course Weight (%)
          </label>
          <input
            type="number"
            value={remainingWeight}
            onChange={(e) => setRemainingWeight(e.target.value)}
            className="input font-mono"
            placeholder="e.g. 40"
          />
          <p className="text-xs text-almond-cream-400 mt-1">
            What % of your total grade is still to be earned
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-espresso-800 mb-1.5">
            Target Grade
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(TARGETS).map((g) => (
              <button
                key={g}
                onClick={() => setTarget(g)}
                className={`w-12 h-10 rounded-xl font-mono font-bold text-sm transition-all
                  ${target === g
                    ? "bg-burnt-peach-500 text-almond-cream-50"
                    : "bg-almond-cream-50 text-espresso-900 border border-almond-cream-200 hover:border-almond-cream-400"}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {required !== null && target && (
        <div
          className={`card p-6 text-center animate-fade-up ${feasible ? "border-almond-cream-300 bg-almond-cream-50" : "border-burnt-peach-500 bg-espresso-50"}`}
        >
          <p className={`font-mono text-6xl font-bold ${gradeColor(required)}`}>
            {required.toFixed(1)}
            <span className="text-3xl">%</span>
          </p>
          <p className="text-espresso-800 text-sm mt-2">
            {feasible
              ? `needed on the remaining ${remainingWeight}% of your grade to reach a ${target}`
              : goalResult?.message ??
                `A ${target} is no longer mathematically achievable — it would require ${required.toFixed(0)}% on remaining work.`}
          </p>

          {/* Visual path bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-almond-cream-400 mb-1.5">
              <span>Current: {current}%</span>
              <span>Target: {targetPct}%</span>
            </div>
            <div className="h-2 bg-almond-cream-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-burnt-peach-500 rounded-full"
                style={{ width: `${Math.min(current, 100)}%` }}
              />
            </div>
            {feasible && (
              <>
                <div className="h-2 bg-burnt-peach-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-burnt-peach-500 rounded-full"
                    style={{
                      width: `${Math.min(required ?? 0, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-burnt-peach-600 mt-1 text-left">
                  Required on remaining work
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
