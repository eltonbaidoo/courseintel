"use client";
import { useState } from "react";

const TARGETS: Record<string, number> = {
  "A": 93, "A-": 90, "B+": 87, "B": 83, "B-": 80, "C+": 77, "C": 73,
};

export default function GoalSimulatorPage() {
  const [currentGrade, setCurrentGrade] = useState("");
  const [remainingWeight, setRemainingWeight] = useState("");
  const [targetGrade, setTargetGrade] = useState("B");

  const current = parseFloat(currentGrade);
  const remaining = parseFloat(remainingWeight) / 100;
  const targetPct = TARGETS[targetGrade] ?? 80;

  let required: number | null = null;
  if (!isNaN(current) && !isNaN(remaining) && remaining > 0) {
    const alreadyWeighted = (current / 100) * (1 - remaining);
    required = ((targetPct / 100) - alreadyWeighted) / remaining * 100;
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Goal Simulator</h1>
      <p className="text-gray-500 text-sm">Enter your current grade and how much of the course is left to see what scores you need.</p>

      <div className="border rounded-xl p-5 bg-white space-y-4">
        <div>
          <label className="text-sm font-medium">Current Grade (%)</label>
          <input type="number" value={currentGrade} onChange={(e) => setCurrentGrade(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mt-1" placeholder="e.g. 78" />
        </div>
        <div>
          <label className="text-sm font-medium">Remaining Weight (%)</label>
          <input type="number" value={remainingWeight} onChange={(e) => setRemainingWeight(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mt-1" placeholder="e.g. 40" />
        </div>
        <div>
          <label className="text-sm font-medium">Target Grade</label>
          <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mt-1">
            {Object.keys(TARGETS).map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {required !== null && (
        <div className={`border rounded-xl p-5 text-center ${required <= 100 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-3xl font-bold">{required.toFixed(1)}%</p>
          <p className="text-sm mt-1 text-gray-600">
            {required <= 100
              ? `needed on remaining ${remainingWeight}% of the course to reach a ${targetGrade}`
              : `A ${targetGrade} is not mathematically achievable — the required score exceeds 100%.`}
          </p>
        </div>
      )}
    </div>
  );
}
