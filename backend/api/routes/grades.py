from fastapi import APIRouter
from models.grades import GradeEntryCreate, GoalRequest
from agents.grade_intelligence import (
    compute_current_grade,
    compute_required_scores,
    GradeEntry,
)

router = APIRouter(prefix="/grades", tags=["grades"])

GRADE_TARGETS = {
    "A": 93, "A-": 90, "B+": 87, "B": 83, "B-": 80,
    "C+": 77, "C": 73, "C-": 70, "D": 60,
}


@router.post("/compute")
async def compute_grades(entries: list[GradeEntryCreate], categories: dict[str, float]):
    grade_entries = [
        GradeEntry(
            score_earned=e.score_earned,
            score_possible=e.score_possible,
            category=e.category,
            weight=categories.get(e.category, 0),
        )
        for e in entries
    ]
    return compute_current_grade(grade_entries, categories)


@router.post("/goal-simulator")
async def simulate_goal(req: GoalRequest, current_grade: float, remaining_weight: float):
    target_pct = GRADE_TARGETS.get(req.target_letter, 80)
    return compute_required_scores(current_grade, target_pct, remaining_weight)
