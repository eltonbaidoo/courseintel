from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GradeEntryCreate(BaseModel):
    course_id: str
    assignment_title: str
    category: str
    score_earned: float
    score_possible: float
    due_date: Optional[datetime] = None
    source: str = "manual"  # manual | scraped | syllabus


class GoalRequest(BaseModel):
    course_id: str
    target_letter: str  # A, B+, B, etc.
