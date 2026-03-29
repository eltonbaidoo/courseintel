import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from api.deps import get_user_id
from agents import (
    discovery,
    obligation_deadline,
    syllabus_acquisition,
    syllabus_intelligence,
    public_resources,
    reputation,
    tool_discovery,
    judgment,
)
from db import queries
from services.pdf_parser import extract_text_from_pdf_bytes
from services import job_store
from config.settings import settings
from agents.grade_intelligence import compute_current_grade, GradeEntry
from models.course import BootstrapResponse, ActionPlanResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/courses", tags=["courses"])

ALLOWED_MIME_TYPES = {"application/pdf"}
MAX_FIELD_LEN = 256

# Urgency priority order for obligation sorting (higher = more urgent)
_URGENCY_RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1}


def _sanitize_str(value: str, field: str) -> str:
    value = value.strip()
    if len(value) > MAX_FIELD_LEN:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field} exceeds maximum length.",
        )
    return value


async def _read_pdf(syllabus: UploadFile) -> bytes:
    """Validate and read uploaded PDF bytes."""
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
            detail=f"File exceeds {settings.max_upload_bytes // (1024 * 1024)} MB limit.",
        )
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File does not appear to be a valid PDF.",
        )
    return pdf_bytes


async def _run_pipeline(
    user_id: str,
    university: str,
    course: str,
    professor: str,
    pdf_bytes: bytes | None,
) -> dict:
    """
    Core bootstrap pipeline — shared between sync and async endpoints.

    Stages:
      A. Syllabus acquisition (sequential — establishes foundation)
      B. Profile extraction (sequential — needs syllabus text)
      C. Parallel intelligence gather (asyncio.gather — 4 agents)
      D. Obligation normalization (sequential — needs profile deadlines)
      E. Persist to database
    """
    # ── Stage A: Syllabus ────────────────────────────────────────────────────
    syllabus_text: str | None = None
    syllabus_result: dict = {}

    if pdf_bytes:
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

    # ── Stage B: Profile extraction ──────────────────────────────────────────
    course_profile: dict = {}
    if syllabus_text:
        course_profile = await syllabus_intelligence.run(syllabus_text)

    topics = [c.get("name", "") for c in course_profile.get("grading_categories", [])]

    # ── Stage C: Parallel intelligence ──────────────────────────────────────
    course_identity, resources_result, reputation_result, tools_result = await asyncio.gather(
        discovery.run(university, course, professor),
        public_resources.run(course, university, topics),
        reputation.run(course, professor or "unknown", university),
        tool_discovery.run(syllabus_text or "", ""),
    )

    # ── Stage D: Obligation normalization ────────────────────────────────────
    raw_deadlines = course_profile.get("key_deadlines", [])
    normalized_obligations = await obligation_deadline.run(raw_deadlines)

    bootstrap_data = {
        "course_identity": course_identity,
        "syllabus_status": syllabus_result,
        "course_profile": course_profile,
        "resources": resources_result.get("resources", []),
        "detected_tools": tools_result.get("tools", []),
        "student_signal": reputation_result,
        "obligations": normalized_obligations.get("obligations", raw_deadlines),
    }

    # ── Stage E: Persist ─────────────────────────────────────────────────────
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
        bootstrap_data["id"] = None

    logger.info("Bootstrap complete for user %s | course: %s @ %s", user_id, course, university)
    return bootstrap_data


# ── SSE streaming pipeline ───────────────────────────────────────────────────

def _sse(payload: dict) -> str:
    """Format a dict as a single SSE data line."""
    return f"data: {json.dumps(payload)}\n\n"


async def _stream_pipeline_events(
    user_id: str,
    university: str,
    course: str,
    professor: str,
    pdf_bytes: bytes | None,
) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE events as each pipeline stage completes.

    Event schema: {"step": int, "stage": str, "status": "running"|"complete"|"error", "detail": str}

    Stage order mirrors _run_pipeline:
      0  syllabus_acquisition   — sequential
      1  syllabus_intelligence  — sequential
      2  course_discovery       — parallel
      3  resource_discovery     — parallel
      4  reputation_analysis    — parallel
      5  tool_detection         — parallel
      6  obligation_normalization — sequential
      7  persist                — save + final result
    """
    # heartbeat so client knows the connection is alive before first stage
    yield _sse({"type": "heartbeat"})

    # ── Stage 0: Syllabus Acquisition ────────────────────────────────────────
    yield _sse({"step": 0, "stage": "syllabus_acquisition", "status": "running"})
    syllabus_text: str | None = None
    syllabus_result: dict = {}

    try:
        if pdf_bytes:
            syllabus_text = await extract_text_from_pdf_bytes(pdf_bytes)
            syllabus_result = {"found": True, "confidence": 1.0, "source": "upload"}
            detail = "Uploaded PDF · confidence 100%"
        else:
            syllabus_result = await syllabus_acquisition.run(course, university, professor)
            syllabus_text = syllabus_result.get("syllabus_text")
            if syllabus_result.get("found"):
                pct = round((syllabus_result.get("confidence") or 0) * 100)
                detail = f"Found via web · {pct}% confidence"
            else:
                detail = "Not found — using partial data"
        yield _sse({"step": 0, "stage": "syllabus_acquisition", "status": "complete", "detail": detail})
    except Exception as exc:
        logger.warning("SSE stream — syllabus acquisition failed: %s", exc)
        yield _sse({"step": 0, "stage": "syllabus_acquisition", "status": "error", "detail": str(exc)})

    # ── Stage 1: Syllabus Intelligence ───────────────────────────────────────
    yield _sse({"step": 1, "stage": "syllabus_intelligence", "status": "running"})
    course_profile: dict = {}
    try:
        if syllabus_text:
            course_profile = await syllabus_intelligence.run(syllabus_text)
        categories = course_profile.get("grading_categories", [])
        deadlines = course_profile.get("key_deadlines", [])
        detail = (
            f"{len(categories)} categor{'y' if len(categories) == 1 else 'ies'} · {len(deadlines)} deadline{'s' if len(deadlines) != 1 else ''}"
            if categories
            else "No grading schema extracted"
        )
        yield _sse({"step": 1, "stage": "syllabus_intelligence", "status": "complete", "detail": detail})
    except Exception as exc:
        logger.warning("SSE stream — syllabus intelligence failed: %s", exc)
        yield _sse({"step": 1, "stage": "syllabus_intelligence", "status": "error", "detail": str(exc)})

    # ── Stages 2–5: Parallel intelligence ────────────────────────────────────
    for step, stage in [(2, "course_discovery"), (3, "resource_discovery"),
                        (4, "reputation_analysis"), (5, "tool_detection")]:
        yield _sse({"step": step, "stage": stage, "status": "running"})

    topics = [c.get("name", "") for c in course_profile.get("grading_categories", [])]
    course_identity: dict = {}
    resources_result: dict = {}
    reputation_result: dict = {}
    tools_result: dict = {}
    try:
        course_identity, resources_result, reputation_result, tools_result = await asyncio.gather(
            discovery.run(university, course, professor),
            public_resources.run(course, university, topics),
            reputation.run(course, professor or "unknown", university),
            tool_discovery.run(syllabus_text or "", ""),
        )

        identity_detail = (
            course_identity.get("canonical_name") or course_identity.get("course_code") or "Identity resolved"
        )
        resource_count = len(resources_result.get("resources", []))
        resource_detail = f"{resource_count} resource{'s' if resource_count != 1 else ''} found" if resource_count else "No public resources found"

        workload = reputation_result.get("workload_hours")
        difficulty = reputation_result.get("difficulty")
        rep_parts = [f"~{workload}h/week" if workload else None, difficulty]
        rep_detail = " · ".join(p for p in rep_parts if p) or "Signal acquired"

        tool_list = tools_result.get("tools", [])
        tool_detail = ", ".join(t.get("tool_name", "") for t in tool_list[:3]) if tool_list else "No platforms detected"

        yield _sse({"step": 2, "stage": "course_discovery", "status": "complete", "detail": identity_detail})
        yield _sse({"step": 3, "stage": "resource_discovery", "status": "complete", "detail": resource_detail})
        yield _sse({"step": 4, "stage": "reputation_analysis", "status": "complete", "detail": rep_detail})
        yield _sse({"step": 5, "stage": "tool_detection", "status": "complete", "detail": tool_detail})
    except Exception as exc:
        logger.warning("SSE stream — parallel intelligence failed: %s", exc)
        for step, stage in [(2, "course_discovery"), (3, "resource_discovery"),
                            (4, "reputation_analysis"), (5, "tool_detection")]:
            yield _sse({"step": step, "stage": stage, "status": "error", "detail": str(exc)})

    # ── Stage 6: Obligation normalization ─────────────────────────────────────
    yield _sse({"step": 6, "stage": "obligation_normalization", "status": "running"})
    raw_deadlines = course_profile.get("key_deadlines", [])
    normalized_obligations: dict = {}
    try:
        normalized_obligations = await obligation_deadline.run(raw_deadlines)
        obligations = normalized_obligations.get("obligations", raw_deadlines)
        ob_count = len(obligations)
        ob_detail = (
            f"{ob_count} obligation{'s' if ob_count != 1 else ''} ranked"
            if ob_count
            else "No obligations found"
        )
        yield _sse({"step": 6, "stage": "obligation_normalization", "status": "complete", "detail": ob_detail})
    except Exception as exc:
        logger.warning("SSE stream — obligation normalization failed: %s", exc)
        yield _sse({"step": 6, "stage": "obligation_normalization", "status": "error", "detail": str(exc)})
        obligations = raw_deadlines

    # ── Stage 7: Persist ──────────────────────────────────────────────────────
    yield _sse({"step": 7, "stage": "persist", "status": "running"})
    bootstrap_data = {
        "course_identity": course_identity,
        "syllabus_status": syllabus_result,
        "course_profile": course_profile,
        "resources": resources_result.get("resources", []),
        "detected_tools": tools_result.get("tools", []),
        "student_signal": reputation_result,
        "obligations": normalized_obligations.get("obligations", raw_deadlines),
    }
    try:
        saved = queries.create_course(user_id, {
            "university": university,
            "course_name": course,
            "course_code": course_identity.get("course_code"),
            "professor": professor,
            **bootstrap_data,
        })
        bootstrap_data["id"] = saved["id"]
        logger.info("SSE bootstrap complete for user %s | course: %s @ %s", user_id, course, university)
        yield _sse({"step": 7, "stage": "persist", "status": "complete", "detail": "Course saved"})
    except Exception as exc:
        logger.error("SSE stream — persist failed: %s", exc)
        bootstrap_data["id"] = None
        yield _sse({"step": 7, "stage": "persist", "status": "error", "detail": str(exc)})

    # Final event carries the full result so the client can navigate immediately
    yield _sse({"type": "result", "data": bootstrap_data})


# ── Bootstrap — streaming SSE ────────────────────────────────────────────────

@router.post("/bootstrap/stream")
async def bootstrap_course_stream(
    request: Request,
    university: str = Form(...),
    course: str = Form(...),
    professor: str = Form(""),
    syllabus: UploadFile | None = File(None),
    user_id: str = Depends(get_user_id),
):
    """
    Streaming bootstrap — returns a text/event-stream response.

    Each agent stage emits an SSE event as it completes so the client can
    update its progress UI in real time rather than waiting 35–45 s for the
    full response.

    Event types:
      heartbeat              — sent immediately to confirm the stream is open
      {step, stage, status}  — running / complete / error for each of 8 stages
      {type: "result", data} — final BootstrapResponse payload

    Consume with fetch + ReadableStream (EventSource doesn't support POST).
    """
    university = _sanitize_str(university, "university")
    course = _sanitize_str(course, "course")
    professor = _sanitize_str(professor, "professor") if professor else ""

    pdf_bytes: bytes | None = None
    if syllabus:
        pdf_bytes = await _read_pdf(syllabus)

    return StreamingResponse(
        _stream_pipeline_events(user_id, university, course, professor, pdf_bytes),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx proxy buffering
        },
    )


# ── Background job runner ────────────────────────────────────────────────────

async def _run_bootstrap_job(
    job_id: str,
    user_id: str,
    university: str,
    course: str,
    professor: str,
    pdf_bytes: bytes | None,
) -> None:
    """Background task: run pipeline, write result back to job store."""
    await job_store.update_job(job_id, status="running")
    try:
        result = await _run_pipeline(user_id, university, course, professor, pdf_bytes)
        await job_store.update_job(job_id, status="completed", result=result)
    except Exception as exc:
        logger.error("Bootstrap job %s failed: %s", job_id, exc)
        await job_store.update_job(job_id, status="failed", error=str(exc))


# ── Bootstrap — synchronous (blocks until complete) ─────────────────────────

@router.post("/bootstrap", response_model=BootstrapResponse)
async def bootstrap_course(
    request: Request,
    university: str = Form(...),
    course: str = Form(...),
    professor: str = Form(""),
    syllabus: UploadFile | None = File(None),
    user_id: str = Depends(get_user_id),
):
    """
    Synchronous bootstrap — awaits all 13 agents before responding (~35–45 s).
    Use /bootstrap/async for a non-blocking alternative.
    """
    university = _sanitize_str(university, "university")
    course = _sanitize_str(course, "course")
    professor = _sanitize_str(professor, "professor") if professor else ""

    pdf_bytes: bytes | None = None
    if syllabus:
        pdf_bytes = await _read_pdf(syllabus)

    return await _run_pipeline(user_id, university, course, professor, pdf_bytes)


# ── Bootstrap — async (returns immediately, poll /jobs/{id} for result) ──────

@router.post("/bootstrap/async", status_code=status.HTTP_202_ACCEPTED)
async def bootstrap_course_async(
    background_tasks: BackgroundTasks,
    request: Request,
    university: str = Form(...),
    course: str = Form(...),
    professor: str = Form(""),
    syllabus: UploadFile | None = File(None),
    user_id: str = Depends(get_user_id),
):
    """
    Non-blocking bootstrap — returns a job_id immediately (HTTP 202).
    Poll GET /courses/jobs/{job_id} to check status and retrieve the result.

    Job lifecycle: pending → running → completed | failed | timed_out
    """
    university = _sanitize_str(university, "university")
    course = _sanitize_str(course, "course")
    professor = _sanitize_str(professor, "professor") if professor else ""

    # Read file bytes eagerly — UploadFile cannot be read inside a background task
    pdf_bytes: bytes | None = None
    if syllabus:
        pdf_bytes = await _read_pdf(syllabus)

    job_id = await job_store.create_job(
        meta={"university": university, "course": course, "user_id": user_id}
    )
    background_tasks.add_task(
        _run_bootstrap_job, job_id, user_id, university, course, professor, pdf_bytes
    )

    return {
        "job_id": job_id,
        "status": "pending",
        "poll_url": f"/courses/jobs/{job_id}",
    }


# ── Job status ────────────────────────────────────────────────────────────────

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, user_id: str = Depends(get_user_id)):
    """
    Poll a bootstrap job by ID.

    Returns:
      - status: pending | running | completed | failed | timed_out
      - result: full BootstrapResponse payload (only when status == completed)
      - error: error message (only when status == failed)
    """
    job = await job_store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or expired.")

    response: dict = {
        "job_id": job["job_id"],
        "status": job["status"],
        "created_at": job["created_at"],
    }
    if job["status"] == "completed":
        response["result"] = job["result"]
    elif job["status"] in ("failed", "timed_out"):
        response["error"] = job.get("error") or "Job did not complete in time."

    return response


# ── Prioritized obligations ───────────────────────────────────────────────────

@router.get("/{course_id}/obligations/prioritized")
async def get_prioritized_obligations(
    course_id: str,
    user_id: str = Depends(get_user_id),
):
    """
    Return this course's obligations sorted by urgency (critical → high → medium → low).

    Each obligation carries an urgency level assigned by ObligationDeadlineAgent.
    The priority scheduler ranks them so the frontend Action Board always surfaces
    the most time-sensitive item first.
    """
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    obligations: list[dict] = (
        course.get("obligations")
        or course.get("course_profile", {}).get("key_deadlines", [])
        or []
    )

    def _priority(ob: dict) -> int:
        urgency = (ob.get("urgency") or ob.get("urgency_level") or "low").lower()
        return _URGENCY_RANK.get(urgency, 0)

    sorted_obligations = sorted(obligations, key=_priority, reverse=True)

    return {
        "course_id": course_id,
        "count": len(sorted_obligations),
        "obligations": sorted_obligations,
    }


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

@router.get("/{course_id}/action-plan", response_model=ActionPlanResponse)
async def get_action_plan(
    course_id: str,
    user_id: str = Depends(get_user_id),
):
    course = queries.get_course(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    course_profile = course.get("course_profile", {})
    student_signal = course.get("student_signal", {})

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

    obligations = course.get("obligations") or course_profile.get("key_deadlines", [])

    missing_flags = []
    detected_tools = course.get("detected_tools", [])
    if not course_profile.get("grading_categories"):
        missing_flags.append("No grading categories found. Upload syllabus.")
    if not entries_raw:
        missing_flags.append("No grades entered yet")
    for tool in detected_tools:
        missing_flags.append(f"Tool not connected: {tool.get('tool_name', 'unknown')}")

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
