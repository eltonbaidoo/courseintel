"""
Grade Intelligence Agent
Deterministic grade calculation and predictive analytics; no LLM needed.

Three capabilities:
  1. compute_current_grade()  — weighted average across categories
  2. compute_required_scores() — algebraic solver: what score do I need?
  3. compute_grade_trend()    — linear regression over time-ordered entries
                                 to project final grade
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class GradeEntry:
    score_earned: float
    score_possible: float
    category: str
    weight: float  # category weight as fraction (e.g. 0.3 for 30%)
    created_at: Optional[str] = None  # ISO timestamp for trend analysis


# ── Weighted average ──────────────────────────────────────────────────────────

def compute_current_grade(entries: list[GradeEntry], categories: dict[str, float]) -> dict:
    """
    categories: {category_name: weight_fraction}
    entries: list of grade entries
    Returns current weighted grade and per-category breakdown.
    """
    category_scores: dict[str, list[float]] = {}
    for entry in entries:
        pct = entry.score_earned / entry.score_possible if entry.score_possible > 0 else 0
        category_scores.setdefault(entry.category, []).append(pct)

    category_averages: dict[str, float] = {
        cat: sum(scores) / len(scores)
        for cat, scores in category_scores.items()
    }

    weighted_total = 0.0
    earned_weight = 0.0
    for cat, avg in category_averages.items():
        w = categories.get(cat, 0)
        weighted_total += avg * w
        earned_weight += w

    current_grade = (weighted_total / earned_weight) if earned_weight > 0 else 0.0

    return {
        "current_grade_pct": round(current_grade * 100, 2),
        "letter_grade": _to_letter(current_grade),
        "category_breakdown": {cat: round(avg * 100, 2) for cat, avg in category_averages.items()},
        "weight_graded": round(earned_weight * 100, 2),
    }


# ── Required score solver ─────────────────────────────────────────────────────

def compute_required_scores(current_grade_pct: float, target_pct: float, remaining_weight: float) -> dict:
    """What score is needed on remaining work to hit the target grade?"""
    if remaining_weight <= 0:
        return {"required_pct": None, "feasible": False, "message": "No remaining work."}

    already_weighted = current_grade_pct * (1 - remaining_weight) / 100
    required = (target_pct / 100 - already_weighted) / remaining_weight

    return {
        "required_pct": round(required * 100, 2),
        "feasible": required <= 1.0,
        "message": f"Need {round(required * 100)}% on remaining {round(remaining_weight * 100)}% of the grade.",
    }


# ── Grade trend + projection ──────────────────────────────────────────────────

def compute_grade_trend(entries: list[GradeEntry], categories: dict[str, float]) -> dict:
    """
    Analyse the trajectory of a student's grade over time using simple
    linear regression on time-ordered cumulative weighted grades.

    Algorithm:
      1. Sort entries by created_at (oldest first); entries without a
         timestamp are placed last and treated as a single batch.
      2. Compute the cumulative weighted grade after each entry is added.
      3. Fit a least-squares line y = slope·x + intercept over the
         (sequence_index, cumulative_grade) pairs.
      4. Project the grade to the end of the semester assuming the
         remaining weight (1 − weight_graded) will be earned at the
         current trajectory's rate.

    Returns:
      slope_per_entry   — grade change per assignment (positive = improving)
      trend_label       — "improving" | "declining" | "stable"
      projected_final   — estimated final grade if current trajectory holds
      projected_letter  — letter grade for the projection
      data_points       — list of (entry_index, cumulative_grade_pct) for charting
      confidence        — "high" | "medium" | "low" based on sample size
    """
    if not entries:
        return {
            "slope_per_entry": 0.0,
            "trend_label": "stable",
            "projected_final": 0.0,
            "projected_letter": "F",
            "data_points": [],
            "confidence": "low",
        }

    # Sort by timestamp when available
    def _ts(e: GradeEntry) -> float:
        if e.created_at:
            try:
                return datetime.fromisoformat(e.created_at.replace("Z", "+00:00")).timestamp()
            except ValueError:
                pass
        return float("inf")

    sorted_entries = sorted(entries, key=_ts)

    # Build cumulative grade series
    running: dict[str, list[float]] = {}
    data_points: list[dict] = []

    for i, entry in enumerate(sorted_entries):
        pct = entry.score_earned / entry.score_possible if entry.score_possible > 0 else 0.0
        running.setdefault(entry.category, []).append(pct)

        # Recompute weighted grade with entries seen so far
        weighted_total = 0.0
        earned_weight = 0.0
        for cat, scores in running.items():
            w = categories.get(cat, 0.0)
            avg = sum(scores) / len(scores)
            weighted_total += avg * w
            earned_weight += w

        grade_so_far = (weighted_total / earned_weight * 100) if earned_weight > 0 else 0.0
        data_points.append({"index": i, "grade_pct": round(grade_so_far, 2)})

    n = len(data_points)

    if n < 2:
        # Not enough data to fit a line
        final_grade = data_points[-1]["grade_pct"] if data_points else 0.0
        return {
            "slope_per_entry": 0.0,
            "trend_label": "stable",
            "projected_final": final_grade,
            "projected_letter": _to_letter(final_grade / 100),
            "data_points": data_points,
            "confidence": "low",
        }

    # Least-squares linear regression: y = slope*x + intercept
    xs = [float(p["index"]) for p in data_points]
    ys = [p["grade_pct"] for p in data_points]
    x_mean = sum(xs) / n
    y_mean = sum(ys) / n

    numerator   = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys))
    denominator = sum((x - x_mean) ** 2 for x in xs)
    slope = numerator / denominator if denominator != 0 else 0.0
    intercept = y_mean - slope * x_mean

    # Project forward: estimate how many more entries remain proportional to
    # the ungraded weight vs. already-graded weight
    last_grade = ys[-1]
    graded_weight = sum(categories.get(e.category, 0) for e in sorted_entries)
    total_weight = sum(categories.values()) or 1.0
    remaining_entries_estimate = max(0, round((1 - graded_weight / total_weight) * n))
    projected_x = n - 1 + remaining_entries_estimate
    projected_final = max(0.0, min(100.0, slope * projected_x + intercept))

    # Classify trend: >0.5% per entry is meaningful movement
    if slope > 0.5:
        trend_label = "improving"
    elif slope < -0.5:
        trend_label = "declining"
    else:
        trend_label = "stable"

    # Confidence based on sample size
    if n >= 8:
        confidence = "high"
    elif n >= 4:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "slope_per_entry": round(slope, 3),
        "trend_label": trend_label,
        "projected_final": round(projected_final, 2),
        "projected_letter": _to_letter(projected_final / 100),
        "data_points": data_points,
        "confidence": confidence,
    }


# ── Letter grade thresholds ───────────────────────────────────────────────────

def _to_letter(pct: float) -> str:
    if pct >= 0.93: return "A"
    if pct >= 0.90: return "A-"
    if pct >= 0.87: return "B+"
    if pct >= 0.83: return "B"
    if pct >= 0.80: return "B-"
    if pct >= 0.77: return "C+"
    if pct >= 0.73: return "C"
    if pct >= 0.70: return "C-"
    if pct >= 0.60: return "D"
    return "F"
