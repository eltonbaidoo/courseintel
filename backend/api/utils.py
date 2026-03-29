"""
Shared route utilities — small helpers used across multiple routers.
"""
import logging
from fastapi import HTTPException

from db import queries

logger = logging.getLogger(__name__)


def get_course_or_404(course_id: str, user_id: str) -> dict:
    """
    Fetch a course by ID and verify ownership in one call.
    Raises HTTP 404 if the course doesn't exist or belongs to another user.
    Replaces the repeated queries.get_course + if-not-course pattern across routes.
    """
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    return course


def require_categories(course: dict) -> dict[str, float]:
    """
    Extract the grading category weight map from a course record.
    Raises HTTP 422 if the course has no grading categories (e.g. bootstrap
    not yet run or syllabus not uploaded).
    """
    categories = {
        c["name"]: c["weight"]
        for c in course.get("course_profile", {}).get("grading_categories", [])
    }
    if not categories:
        raise HTTPException(
            status_code=422,
            detail="Course has no grading categories. Run bootstrap or upload a syllabus first.",
        )
    return categories
