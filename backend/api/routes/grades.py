import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from api.deps import get_user_id
from db import queries
from models.grades import GradeEntryCreate, GoalRequest
from agents.grade_intelligence import (
    compute_current_grade,
    compute_required_scores,
    GradeEntry,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/grades", tags=["grades"])

GRADE_TARGETS = {
    "A": 93, "A-": 90, "B+": 87, "B": 83, "B-": 80,
    "C+": 77, "C": 73, "C-": 70, "D": 60,
}


# ── Request models for composite body payloads ──────────────────────────────

class ComputeRequest(BaseModel):
    entries: list[GradeEntryCreate]
    categories: dict[str, float]


# ── Stateless computation endpoints ─────────────────────────────────────────

@router.post("/compute")
async def compute_grades(payload: ComputeRequest):
    grade_entries = [
        GradeEntry(
            score_earned=e.score_earned,
            score_possible=e.score_possible,
            category=e.category,
            weight=payload.categories.get(e.category, 0),
        )
        for e in payload.entries
    ]
    return compute_current_grade(grade_entries, payload.categories)


@router.post("/goal-simulator")
async def simulate_goal(req: GoalRequest, current_grade: float, remaining_weight: float):
    target_pct = GRADE_TARGETS.get(req.target_letter, 80)
    return compute_required_scores(current_grade, target_pct, remaining_weight)


# ── DB-backed grade entry CRUD ───────────────────────────────────────────────

class GradeEntryCreateRequest(BaseModel):
    assignment_title: str
    category: str
    score_earned: float
    score_possible: float
    due_date: Optional[str] = None
    source: str = "manual"


@router.post("/courses/{course_id}/entries")
async def add_grade_entry(
    course_id: str,
    entry: GradeEntryCreateRequest,
    user_id: str = Depends(get_user_id),
):
    # Verify course ownership
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    saved = queries.create_grade_entry(user_id, course_id, entry.model_dump())
    return saved


@router.get("/courses/{course_id}/entries")
async def list_grade_entries(
    course_id: str,
    user_id: str = Depends(get_user_id),
):
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    entries = queries.list_grade_entries(course_id, user_id)
    return {"entries": entries}


@router.delete("/entries/{entry_id}")
async def delete_grade_entry(
    entry_id: str,
    user_id: str = Depends(get_user_id),
):
    deleted = queries.delete_grade_entry(entry_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Grade entry not found.")
    return {"deleted": True}
