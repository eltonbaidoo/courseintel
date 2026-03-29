"""
Study Context endpoints.
Upload study materials, get AI-powered study summaries.
"""
import logging
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from api.deps import get_user_id
from db import queries
from agents import study_context
from services.pdf_parser import extract_text_from_pdf_bytes
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/study", tags=["study"])

ALLOWED_MIME_TYPES = {"application/pdf", "text/plain", "text/markdown"}


@router.post("/courses/{course_id}/upload")
async def upload_study_material(
    course_id: str,
    title: str = Form(...),
    material_type: str = Form("notes"),
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id),
):
    """Upload a study material (PDF or text) and extract its content."""
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF, plain text, and markdown files are accepted.",
        )

    file_bytes = await file.read(settings.max_upload_bytes + 1)
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_bytes // (1024*1024)} MB limit.",
        )

    # Extract text
    if content_type == "application/pdf":
        if not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="File does not appear to be a valid PDF.",
            )
        try:
            text_content = await extract_text_from_pdf_bytes(file_bytes)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract text from the uploaded PDF.",
            )
    else:
        text_content = file_bytes.decode("utf-8", errors="replace")

    saved = queries.create_study_material(user_id, course_id, {
        "title": title,
        "content": text_content[:50000],  # cap stored text
        "type": material_type,
    })

    return {
        "id": saved["id"],
        "title": saved["title"],
        "type": saved["type"],
        "content_length": len(text_content),
    }


@router.get("/courses/{course_id}/materials")
async def list_study_materials(
    course_id: str,
    user_id: str = Depends(get_user_id),
):
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    materials = queries.list_study_materials(course_id, user_id)
    # Don't return full content in list view
    return {
        "materials": [
            {
                "id": m["id"],
                "title": m["title"],
                "type": m["type"],
                "created_at": m["created_at"],
            }
            for m in materials
        ]
    }


@router.post("/courses/{course_id}/analyze")
async def analyze_study_context(
    course_id: str,
    user_id: str = Depends(get_user_id),
):
    """Run the Study Context Agent on all uploaded materials for a course."""
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    materials = queries.list_study_materials(course_id, user_id)
    if not materials:
        raise HTTPException(
            status_code=400,
            detail="No study materials uploaded yet. Upload materials first.",
        )

    # Prepare materials for the agent
    agent_input = [
        {
            "title": m["title"],
            "content": m.get("content", ""),
            "type": m.get("type", "notes"),
        }
        for m in materials
        if m.get("content")
    ]

    result = await study_context.run(agent_input)

    logger.info(
        "Study context analysis for course %s — %d materials, %d topics",
        course_id, len(agent_input), len(result.get("key_topics", [])),
    )

    return result
