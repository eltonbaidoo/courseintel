"""
Grade Intelligence Agent
Deterministic grade calculation — no LLM needed.
"""
from dataclasses import dataclass


@dataclass
class GradeEntry:
    score_earned: float
    score_possible: float
    category: str
    weight: float  # category weight as fraction (e.g. 0.3 for 30%)


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
