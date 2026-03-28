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
)
from services.pdf_parser import extract_text_from_pdf_bytes
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/courses", tags=["courses"])

ALLOWED_MIME_TYPES = {"application/pdf"}
MAX_FIELD_LEN = 256  # for university / course / professor strings


def _sanitize_str(value: str, field: str) -> str:
    value = value.strip()
    if len(value) > MAX_FIELD_LEN:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field} exceeds maximum length.",
        )
    return value


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
        # Validate content type header
        content_type = syllabus.content_type or ""
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF files are accepted.",
            )

        # Read with size cap — reject oversized uploads before parsing
        pdf_bytes = await syllabus.read(settings.max_upload_bytes + 1)
        if len(pdf_bytes) > settings.max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds {settings.max_upload_bytes // (1024*1024)} MB limit.",
            )

        # Validate actual magic bytes (not just the header claim)
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

    logger.info("Bootstrap complete for user %s — course: %s @ %s", user_id, course, university)

    return {
        "course_identity": course_identity,
        "syllabus_status": syllabus_result,
        "course_profile": course_profile,
        "resources": resources_result.get("resources", []),
        "detected_tools": tools_result.get("tools", []),
        "student_signal": reputation_result,
    }


@router.get("/{course_id}/action-plan")
async def get_action_plan(
    course_id: str,
    user_id: str = Depends(get_user_id),
):
    # TODO: fetch course data from DB, verify course belongs to user_id, run judgment agent
    return {"message": "Action plan generation — connect DB first"}
