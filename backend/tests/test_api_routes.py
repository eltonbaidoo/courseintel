"""
API route tests for CourseIntel FastAPI backend.

Uses FastAPI's TestClient (synchronous httpx wrapper) to test HTTP endpoints
without a running server. The dev-auth bypass is enabled via environment
variables so no real Supabase JWT is required.

Coverage:
  GET  /health             — liveness check
  GET  /health/llm         — LLM status (token gated)
  POST /grades/compute     — weighted grade calculation (stateless)
  POST /grades/goal-simulator — required score solver (stateless)
  POST /grades/courses/{id}/entries — grade CRUD (auth required)
  GET  /grades/courses/{id}/entries — list grade entries (auth required)
  POST /extension/scrape   — extension scrape validation (auth required)
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
