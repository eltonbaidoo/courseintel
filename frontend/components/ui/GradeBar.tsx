"use client";

interface GradeBarProps {
  percent: number;
  size?: "sm" | "md";
}

function barColor(pct: number): string {
  if (pct >= 90) return "bg-burnt-peach-500";
  if (pct >= 70) return "bg-almond-cream-500";
  return "bg-espresso-800";
}

export function GradeBar({ percent, size = "sm" }: GradeBarProps) {
  const h = size === "sm" ? "h-2" : "h-3";
  return (
    <div className={`w-full ${h} rounded-full bg-almond-cream-100 overflow-hidden`}>
      <div
        className={`${h} rounded-full transition-all duration-500 ${barColor(percent)}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
