import asyncio
import logging
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from api.deps import get_user_id
from agents import (
    discovery,
    syllabus_acquisition,
    syllabus_intelligence,
    public_resources,
    reputation,
    tool_discovery,
    judgment,
)
from db import queries
from services.pdf_parser import extract_text_from_pdf_bytes
from config.settings import settings
from agents.grade_intelligence import compute_current_grade, GradeEntry

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/courses", tags=["courses"])

ALLOWED_MIME_TYPES = {"application/pdf"}
MAX_FIELD_LEN = 256


def _sanitize_str(value: str, field: str) -> str:
    value = value.strip()
    if len(value) > MAX_FIELD_LEN:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field} exceeds maximum length.",
        )
    return value


# ── Bootstrap ────────────────────────────────────────────────────────────────

@router.post("/bootstrap")
async def bootstrap_course(
    request: Request,
    university: str = Form(...),
    course: str = Form(...),
    professor: str = Form(""),
    syllabus: UploadFile | None = File(None),
    user_id: str = Depends(get_user_id),
):
    university = _sanitize_str(university, "university")
    course = _sanitize_str(course, "course")
    professor = _sanitize_str(professor, "professor") if professor else ""

    syllabus_text: str | None = None
    syllabus_result: dict = {}

    if syllabus:
        content_type = syllabus.content_type or ""
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF files are accepted.",
            )

        pdf_bytes = await syllabus.read(settings.max_upload_bytes + 1)
        if len(pdf_bytes) > settings.max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds {settings.max_upload_bytes // (1024*1024)} MB limit.",
            )

        if not pdf_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="File does not appear to be a valid PDF.",
            )

        try:
            syllabus_text = await extract_text_from_pdf_bytes(pdf_bytes)
        except Exception:
            logger.warning("PDF extraction failed for user %s", user_id)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract text from the uploaded PDF.",
            )
        syllabus_result = {"found": True, "confidence": 1.0, "source": "upload"}
    else:
        syllabus_result = await syllabus_acquisition.run(course, university, professor)
        syllabus_text = syllabus_result.get("syllabus_text")

    course_profile: dict = {}
    if syllabus_text:
        course_profile = await syllabus_intelligence.run(syllabus_text)

    topics = [c.get("name", "") for c in course_profile.get("grading_categories", [])]

    course_identity, resources_result, reputation_result, tools_result = await asyncio.gather(
        discovery.run(university, course, professor),
        public_resources.run(course, university, topics),
        reputation.run(course, professor or "unknown", university),
        tool_discovery.run(syllabus_text or "", ""),
    )

    bootstrap_data = {
        "course_identity": course_identity,
        "syllabus_status": syllabus_result,
        "course_profile": course_profile,
        "resources": resources_result.get("resources", []),
        "detected_tools": tools_result.get("tools", []),
        "student_signal": reputation_result,
    }

    # Persist to database
    try:
        saved = queries.create_course(user_id, {
            "university": university,
            "course_name": course,
            "course_code": course_identity.get("course_code"),
            "professor": professor,
            **bootstrap_data,
        })
        bootstrap_data["id"] = saved["id"]
    except Exception as exc:
        logger.error("Failed to persist course for user %s: %s", user_id, exc)
        # Return data even if DB write fails — local-first approach
        bootstrap_data["id"] = None

    logger.info("Bootstrap complete for user %s — course: %s @ %s", user_id, course, university)
    return bootstrap_data


# ── List courses ─────────────────────────────────────────────────────────────

@router.get("/")
async def list_courses(user_id: str = Depends(get_user_id)):
    try:
        courses = queries.list_courses(user_id)
    except Exception as exc:
        logger.error("Failed to list courses: %s", exc)
        raise HTTPException(status_code=500, detail="Could not fetch courses.")
    return {"courses": courses}


# ── Get single course ────────────────────────────────────────────────────────

@router.get("/{course_id}")
async def get_course(course_id: str, user_id: str = Depends(get_user_id)):
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")
    return course


# ── Delete course ────────────────────────────────────────────────────────────

@router.delete("/{course_id}")
async def delete_course(course_id: str, user_id: str = Depends(get_user_id)):
    deleted = queries.delete_course(course_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Course not found.")
    return {"deleted": True}


# ── Action Plan (Judgment Agent) ─────────────────────────────────────────────

@router.get("/{course_id}/action-plan")
async def get_action_plan(
    course_id: str,
    user_id: str = Depends(get_user_id),
):
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    course_profile = course.get("course_profile", {})
    student_signal = course.get("student_signal", {})

    # Build grade standing from stored entries
    entries_raw = queries.list_grade_entries(course_id, user_id)
    categories = {
        c["name"]: c["weight"]
        for c in course_profile.get("grading_categories", [])
    }

    grade_standing = {"current_grade_pct": 0, "letter_grade": "N/A", "weight_graded": 0}
    if entries_raw and categories:
        grade_entries = [
            GradeEntry(
                score_earned=e["score_earned"],
                score_possible=e["score_possible"],
                category=e["category"],
                weight=categories.get(e["category"], 0),
            )
            for e in entries_raw
        ]
        grade_standing = compute_current_grade(grade_entries, categories)

    # Collect obligations from course profile deadlines
    obligations = course_profile.get("key_deadlines", [])

    # Missing data flags
    missing_flags = []
    detected_tools = course.get("detected_tools", [])
    if not course_profile.get("grading_categories"):
        missing_flags.append("No grading categories found — upload syllabus")
    if not entries_raw:
        missing_flags.append("No grades entered yet")
    for tool in detected_tools:
        missing_flags.append(f"Tool not connected: {tool.get('tool_name', 'unknown')}")

    # Fetch study context if available
    materials = queries.list_study_materials(course_id, user_id)
    study_context = None
    if materials:
        study_context = {
            "summary": f"{len(materials)} study materials uploaded",
            "key_topics": [m.get("title", "") for m in materials[:5]],
        }

    result = await judgment.run(
        course_profile=course_profile,
        grade_standing=grade_standing,
        obligations=obligations,
        study_context=study_context,
        student_signal=student_signal,
        missing_flags=missing_flags,
    )

    return result
