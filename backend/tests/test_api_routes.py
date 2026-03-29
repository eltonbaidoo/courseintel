"""
API route tests for CourseIntel FastAPI backend.

Uses FastAPI's TestClient (synchronous httpx wrapper) to test HTTP endpoints
without a running server. The dev-auth bypass is enabled via environment
variables so no real Supabase JWT is required.

Coverage:
  GET  /health                              — liveness check
  GET  /health/llm                          — LLM status (token gated)
  POST /courses/bootstrap/async             — non-blocking bootstrap (job queue)
  GET  /courses/jobs/{id}                   — job status polling
  GET  /courses/{id}/obligations/prioritized — priority-sorted obligations
  POST /grades/compute                      — weighted grade calculation (stateless)
  POST /grades/goal-simulator               — required score solver (stateless)
  POST /grades/courses/{id}/entries         — grade CRUD (auth required)
  GET  /grades/courses/{id}/entries         — list grade entries (auth required)
  POST /extension/scrape                    — extension scrape validation (auth required)
"""
import os
import pytest

# Enable dev auth bypass BEFORE importing the app so settings picks it up
os.environ.setdefault("DEV_AUTH_BYPASS", "true")
os.environ.setdefault("DEV_BEARER_TOKEN", "test-bearer-token")
os.environ.setdefault("SUPABASE_URL", "https://placeholder.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "placeholder")
os.environ.setdefault("SUPABASE_JWT_SECRET", "placeholder-secret-32-chars-xxxx")
os.environ.setdefault("INTERNAL_HEALTH_TOKEN", "test-health-token")

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app

client = TestClient(app)
AUTH = {"Authorization": "Bearer test-bearer-token"}


# ── Health endpoints ─────────────────────────────────────────────────────────

def test_health_liveness():
    """GET /health returns 200 with status ok."""
    res = client.get("/health/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_health_liveness_no_trailing_slash():
    res = client.get("/health")
    assert res.status_code in (200, 307)  # redirect or direct


def test_health_llm_requires_token():
    """GET /health/llm returns 404 without the internal token."""
    res = client.get("/health/llm")
    assert res.status_code == 404


def test_health_llm_with_token_returns_provider_info():
    """GET /health/llm with valid token returns provider reachability dict."""
    with patch("api.routes.health.settings") as mock_settings:
        mock_settings.internal_health_token = "test-health-token"
        mock_settings.llm_provider = "none"
        mock_settings.openai_api_key = None
        mock_settings.gemini_api_key = None
        mock_settings.groq_api_key = None

        res = client.get("/health/llm", headers={"X-Internal-Token": "test-health-token"})

    assert res.status_code == 200
    data = res.json()
    assert "active_provider" in data
    assert "openai" in data
    assert "gemini" in data
    assert "groq" in data


# ── Grades — stateless computation ──────────────────────────────────────────

def test_compute_grades_single_category():
    """POST /grades/compute returns correct weighted grade."""
    # GradeEntryCreate requires course_id
    payload = {
        "entries": [
            {"course_id": "c1", "assignment_title": "HW1", "category": "Homework",
             "score_earned": 90, "score_possible": 100},
            {"course_id": "c1", "assignment_title": "HW2", "category": "Homework",
             "score_earned": 80, "score_possible": 100},
        ],
        "categories": {"Homework": 1.0},
    }
    res = client.post("/grades/compute", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "current_grade_pct" in data
    assert abs(data["current_grade_pct"] - 85.0) < 0.1
    assert data["letter_grade"] == "B"


def test_compute_grades_weighted_two_categories():
    """Weighted grade across two categories is correctly calculated."""
    payload = {
        "entries": [
            {"course_id": "c1", "assignment_title": "HW1", "category": "Homework",
             "score_earned": 100, "score_possible": 100},
            {"course_id": "c1", "assignment_title": "Midterm", "category": "Exams",
             "score_earned": 70, "score_possible": 100},
        ],
        "categories": {"Homework": 0.35, "Exams": 0.65},
    }
    res = client.post("/grades/compute", json=payload)
    assert res.status_code == 200
    data = res.json()
    # Expected: (1.0 * 0.35 + 0.7 * 0.65) / 1.0 = 0.805 → 80.5%
    assert abs(data["current_grade_pct"] - 80.5) < 0.5
    assert data["letter_grade"] in ("B-", "B")


def test_compute_grades_empty_entries():
    """Empty entries list returns zero grade, not an error."""
    payload = {"entries": [], "categories": {"Homework": 1.0}}
    res = client.post("/grades/compute", json=payload)
    assert res.status_code == 200
    assert res.json()["current_grade_pct"] == 0.0


def test_compute_grades_unknown_category_weight():
    """Entry for unknown category defaults to weight 0 (doesn't crash)."""
    payload = {
        "entries": [
            {"course_id": "c1", "assignment_title": "Mystery", "category": "Unknown",
             "score_earned": 50, "score_possible": 100},
        ],
        "categories": {"Homework": 1.0},
    }
    res = client.post("/grades/compute", json=payload)
    # Unknown category has 0 weight → returns 0 grade, not an error
    assert res.status_code == 200


# ── Grades — goal simulator ──────────────────────────────────────────────────

def test_goal_simulator_feasible():
    """Goal simulator returns feasible=True when target is achievable."""
    res = client.post(
        "/grades/goal-simulator",
        json={"target_letter": "B", "course_id": "c1"},
        params={"current_grade": 75.0, "remaining_weight": 0.4},
    )
    assert res.status_code == 200
    data = res.json()
    assert "required_pct" in data
    assert "feasible" in data
    assert data["feasible"] is True


def test_goal_simulator_infeasible():
    """Goal simulator returns feasible=False when target requires >100%."""
    res = client.post(
        "/grades/goal-simulator",
        json={"target_letter": "A", "course_id": "c1"},
        params={"current_grade": 40.0, "remaining_weight": 0.2},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["feasible"] is False
    assert data["required_pct"] > 100


def test_goal_simulator_no_remaining_weight():
    """Goal simulator handles remaining_weight=0 without division error."""
    res = client.post(
        "/grades/goal-simulator",
        json={"target_letter": "B", "course_id": "c1"},
        params={"current_grade": 85.0, "remaining_weight": 0.0},
    )
    assert res.status_code == 200


# ── Grades — CRUD (requires auth) ────────────────────────────────────────────

def test_add_grade_entry_requires_auth():
    """POST /grades/courses/{id}/entries returns 401/403 without auth."""
    res = client.post(
        "/grades/courses/fake-course-id/entries",
        json={"assignment_title": "HW1", "category": "Homework",
              "score_earned": 90, "score_possible": 100},
    )
    assert res.status_code in (401, 403, 422)


def test_add_grade_entry_with_auth_course_not_found():
    """POST with valid auth but nonexistent course returns 404."""
    with patch("api.routes.grades.queries.get_course", return_value=None):
        res = client.post(
            "/grades/courses/nonexistent-id/entries",
            headers=AUTH,
            json={"assignment_title": "HW1", "category": "Homework",
                  "score_earned": 90, "score_possible": 100},
        )
    assert res.status_code == 404


def test_add_grade_entry_success():
    """POST with valid auth and existing course creates entry."""
    mock_course = {"id": "course-123", "user_id": "courseintel-dev-local"}
    mock_entry = {
        "id": "entry-456", "course_id": "course-123",
        "assignment_title": "HW1", "category": "Homework",
        "score_earned": 90.0, "score_possible": 100.0,
        "source": "manual", "due_date": None, "created_at": "2025-01-01T00:00:00",
    }
    with patch("api.routes.grades.queries.get_course", return_value=mock_course):
        with patch("api.routes.grades.queries.create_grade_entry", return_value=mock_entry):
            res = client.post(
                "/grades/courses/course-123/entries",
                headers=AUTH,
                json={"assignment_title": "HW1", "category": "Homework",
                      "score_earned": 90, "score_possible": 100},
            )
    assert res.status_code == 200
    data = res.json()
    assert data["assignment_title"] == "HW1"
    assert data["score_earned"] == 90.0


def test_list_grade_entries_success():
    """GET entries returns list for existing course."""
    mock_course = {"id": "course-123", "user_id": "courseintel-dev-local"}
    mock_entries = [
        {"id": "e1", "assignment_title": "HW1", "category": "Homework",
         "score_earned": 90.0, "score_possible": 100.0},
    ]
    with patch("api.routes.grades.queries.get_course", return_value=mock_course):
        with patch("api.routes.grades.queries.list_grade_entries", return_value=mock_entries):
            res = client.get("/grades/courses/course-123/entries", headers=AUTH)
    assert res.status_code == 200
    assert len(res.json()["entries"]) == 1


def test_delete_grade_entry_not_found():
    """DELETE nonexistent entry returns 404."""
    with patch("api.routes.grades.queries.delete_grade_entry", return_value=None):
        res = client.delete("/grades/entries/nonexistent", headers=AUTH)
    assert res.status_code == 404


def test_delete_grade_entry_success():
    """DELETE existing entry returns deleted=True."""
    with patch("api.routes.grades.queries.delete_grade_entry", return_value={"id": "e1"}):
        res = client.delete("/grades/entries/e1", headers=AUTH)
    assert res.status_code == 200
    assert res.json()["deleted"] is True


# ── Extension scrape (requires auth) ────────────────────────────────────────

def test_extension_scrape_requires_auth():
    """POST /extension/scrape without auth returns 401/403."""
    res = client.post("/extension/scrape", json={
        "course_id": "c1", "platform": "gradescope",
        "url": "https://gradescope.com", "raw_text": "", "items": [],
    })
    assert res.status_code in (401, 403, 422)


def test_extension_scrape_with_auth_empty_items():
    """Extension scrape with no items returns rejected status."""
    with patch(
        "api.routes.extension.extension_validation.run",
        return_value={"status": "rejected", "usefulness_score": 0.0,
                      "reason": "No items", "extracted_items": []},
    ):
        res = client.post(
            "/extension/scrape",
            headers=AUTH,
            json={
                "course_id": "c1", "platform": "gradescope",
                "url": "https://gradescope.com/courses/1/assignments",
                "raw_text": "page content",
                "items": [],
            },
        )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "rejected"
    assert data["accepted_items"] == 0


def test_extension_scrape_with_valid_items():
    """Extension scrape with valid items returns accepted status."""
    items = [
        {"title": "HW1", "due_date": "Feb 7", "link": "/hw1", "type": "assignment"},
        {"title": "Midterm", "due_date": "Mar 6", "link": "/mt", "type": "assignment"},
    ]
    extracted = [
        {"title": "HW1", "category": "Homework", "score_earned": None, "score_possible": 100},
        {"title": "Midterm", "category": "Exams", "score_earned": None, "score_possible": 100},
    ]
    with patch(
        "api.routes.extension.extension_validation.run",
        return_value={"status": "accepted", "usefulness_score": 0.9,
                      "reason": "2 items extracted", "extracted_items": extracted},
    ):
        res = client.post(
            "/extension/scrape",
            headers=AUTH,
            json={
                "course_id": "c1", "platform": "gradescope",
                "url": "https://gradescope.com/courses/1/assignments",
                "raw_text": "assignments page",
                "items": items,
            },
        )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "accepted"
    assert data["accepted_items"] == 2
    assert data["usefulness_score"] == 0.9
    assert "scrape_job_id" in data


# ── Async bootstrap job queue ────────────────────────────────────────────────

def test_async_bootstrap_requires_auth():
    """POST /courses/bootstrap/async without auth returns 401/403."""
    res = client.post(
        "/courses/bootstrap/async",
        data={"university": "URI", "course": "CSC 212"},
    )
    assert res.status_code in (401, 403, 422)


def test_async_bootstrap_returns_job_id():
    """POST /courses/bootstrap/async with auth returns 202 + job_id."""
    # Patch the background task runner so no real LLM calls are made
    with patch("api.routes.courses._run_bootstrap_job"):
        res = client.post(
            "/courses/bootstrap/async",
            headers=AUTH,
            data={"university": "URI", "course": "CSC 212"},
        )
    assert res.status_code == 202
    data = res.json()
    assert "job_id" in data
    assert data["status"] == "pending"
    assert "poll_url" in data


def test_job_status_not_found():
    """GET /courses/jobs/{id} returns 404 for unknown job."""
    res = client.get("/courses/jobs/nonexistent-job-id", headers=AUTH)
    assert res.status_code == 404


def test_job_status_pending():
    """A freshly created job starts with status pending."""
    import asyncio
    from services import job_store as js

    # Create a job directly in the store and check the status endpoint
    job_id = asyncio.get_event_loop().run_until_complete(
        js.create_job({"university": "URI", "course": "CSC 212"})
    )
    res = client.get(f"/courses/jobs/{job_id}", headers=AUTH)
    assert res.status_code == 200
    assert res.json()["status"] == "pending"


def test_job_status_completed_includes_result():
    """A completed job exposes its result in the response."""
    import asyncio
    from services import job_store as js

    job_id = asyncio.get_event_loop().run_until_complete(js.create_job())
    asyncio.get_event_loop().run_until_complete(
        js.update_job(job_id, status="completed", result={"id": "course-1"})
    )
    res = client.get(f"/courses/jobs/{job_id}", headers=AUTH)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["result"]["id"] == "course-1"


def test_job_status_failed_includes_error():
    """A failed job exposes its error message."""
    import asyncio
    from services import job_store as js

    job_id = asyncio.get_event_loop().run_until_complete(js.create_job())
    asyncio.get_event_loop().run_until_complete(
        js.update_job(job_id, status="failed", error="LLM unavailable")
    )
    res = client.get(f"/courses/jobs/{job_id}", headers=AUTH)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "failed"
    assert "LLM unavailable" in data["error"]


# ── Priority-sorted obligations ──────────────────────────────────────────────

def test_prioritized_obligations_not_found():
    """GET /courses/{id}/obligations/prioritized returns 404 for unknown course."""
    with patch("api.routes.courses.queries.get_course", return_value=None):
        res = client.get("/courses/fake-id/obligations/prioritized", headers=AUTH)
    assert res.status_code == 404


def test_prioritized_obligations_sorted():
    """Obligations are returned sorted critical → high → medium → low."""
    mock_course = {
        "id": "course-1",
        "user_id": "courseintel-dev-local",
        "obligations": [
            {"title": "HW3", "urgency": "low"},
            {"title": "Final Exam", "urgency": "critical"},
            {"title": "Project Milestone", "urgency": "high"},
            {"title": "Quiz", "urgency": "medium"},
        ],
        "course_profile": {},
    }
    with patch("api.routes.courses.queries.get_course", return_value=mock_course):
        res = client.get("/courses/course-1/obligations/prioritized", headers=AUTH)
    assert res.status_code == 200
    data = res.json()
    titles = [ob["title"] for ob in data["obligations"]]
    assert titles[0] == "Final Exam"       # critical first
    assert titles[-1] == "HW3"            # low last
    assert data["count"] == 4


def test_prioritized_obligations_empty():
    """Course with no obligations returns empty list, not error."""
    mock_course = {
        "id": "course-1",
        "user_id": "courseintel-dev-local",
        "obligations": [],
        "course_profile": {},
    }
    with patch("api.routes.courses.queries.get_course", return_value=mock_course):
        res = client.get("/courses/course-1/obligations/prioritized", headers=AUTH)
    assert res.status_code == 200
    assert res.json()["obligations"] == []


# ── Stale job reaper unit test ────────────────────────────────────────────────

def test_reap_stale_jobs():
    """Jobs running longer than STALE_THRESHOLD are marked timed_out."""
    import asyncio
    import time
    from services import job_store as js
    from services.job_store import STALE_THRESHOLD_SECONDS

    async def _run():
        job_id = await js.create_job()
        # Manually set status to running and backdate updated_at
        await js.update_job(job_id, status="running")
        job = await js.get_job(job_id)
        # Simulate a hung job by backdating updated_at
        from services import job_store as _js
        _js._store[job_id]["updated_at"] = time.time() - (STALE_THRESHOLD_SECONDS + 10)
        reaped = await js.reap_stale_jobs()
        assert reaped >= 1
        updated = await js.get_job(job_id)
        assert updated["status"] == "timed_out"

    asyncio.get_event_loop().run_until_complete(_run())


# ── SSE streaming bootstrap ──────────────────────────────────────────────────

def test_bootstrap_stream_returns_event_stream():
    """POST /courses/bootstrap/stream returns text/event-stream content-type."""
    MOCKED_PIPELINE_EVENTS = [
        {"type": "heartbeat"},
        {"step": 0, "stage": "syllabus_acquisition", "status": "complete", "detail": "Found via web"},
        {"step": 1, "stage": "syllabus_intelligence", "status": "complete", "detail": "3 categories"},
        {"step": 2, "stage": "course_discovery", "status": "complete", "detail": "CS 301"},
        {"step": 3, "stage": "resource_discovery", "status": "complete", "detail": "5 resources found"},
        {"step": 4, "stage": "reputation_analysis", "status": "complete", "detail": "~12h/week"},
        {"step": 5, "stage": "tool_detection", "status": "complete", "detail": "Gradescope"},
        {"step": 6, "stage": "obligation_normalization", "status": "complete", "detail": "4 obligations ranked"},
        {"step": 7, "stage": "persist", "status": "complete", "detail": "Course saved"},
        {"type": "result", "data": {"id": "course-123", "course_profile": {}, "resources": []}},
    ]

    import json as _json

    async def _fake_stream(*args, **kwargs):
        for event in MOCKED_PIPELINE_EVENTS:
            yield f"data: {_json.dumps(event)}\n\n"

    with patch("api.routes.courses._stream_pipeline_events", side_effect=_fake_stream):
        res = client.post(
            "/courses/bootstrap/stream",
            headers=AUTH,
            data={"university": "URI", "course": "CSC 212", "professor": "Alvarez"},
        )

    assert res.status_code == 200
    assert "text/event-stream" in res.headers.get("content-type", "")


def test_bootstrap_stream_emits_stage_events():
    """SSE stream contains running and complete events for each pipeline stage."""
    import json as _json

    STAGE_NAMES = [
        "syllabus_acquisition", "syllabus_intelligence", "course_discovery",
        "resource_discovery", "reputation_analysis", "tool_detection",
        "obligation_normalization", "persist",
    ]

    async def _fake_stream(*args, **kwargs):
        yield f"data: {_json.dumps({'type': 'heartbeat'})}\n\n"
        for i, stage in enumerate(STAGE_NAMES):
            yield f"data: {_json.dumps({'step': i, 'stage': stage, 'status': 'running'})}\n\n"
            yield f"data: {_json.dumps({'step': i, 'stage': stage, 'status': 'complete', 'detail': 'ok'})}\n\n"
        yield f"data: {_json.dumps({'type': 'result', 'data': {'id': 'c-999', 'course_profile': {}, 'resources': []}})}\n\n"

    with patch("api.routes.courses._stream_pipeline_events", side_effect=_fake_stream):
        res = client.post(
            "/courses/bootstrap/stream",
            headers=AUTH,
            data={"university": "MIT", "course": "6.006"},
        )

    assert res.status_code == 200
    body = res.text
    # Verify all 8 stages and the final result appear in the stream
    for stage in STAGE_NAMES:
        assert stage in body, f"Stage {stage!r} not found in SSE stream"
    assert '"type": "result"' in body or '"type":"result"' in body
