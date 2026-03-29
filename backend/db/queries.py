"""
Database CRUD operations for CourseIntel.
Uses the Supabase service-role client (bypasses RLS).
All functions enforce user_id ownership manually.
"""
import logging
from db.client import get_db

logger = logging.getLogger(__name__)


# ── Courses ──────────────────────────────────────────────────────────────────

def create_course(user_id: str, data: dict) -> dict:
    db = get_db()
    row = {
        "user_id": user_id,
        "university": data["university"],
        "course_name": data["course_name"],
        "course_code": data.get("course_code"),
        "professor": data.get("professor"),
        "course_identity": data.get("course_identity", {}),
        "syllabus_status": data.get("syllabus_status", {}),
        "course_profile": data.get("course_profile", {}),
        "resources": data.get("resources", []),
        "detected_tools": data.get("detected_tools", []),
        "student_signal": data.get("student_signal", {}),
    }
    result = db.table("courses").insert(row).execute()
    return result.data[0]


def list_courses(user_id: str) -> list[dict]:
    db = get_db()
    result = (
        db.table("courses")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_course(course_id: str, user_id: str) -> dict | None:
    db = get_db()
    result = (
        db.table("courses")
        .select("*")
        .eq("id", course_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return result.data


def update_course(course_id: str, user_id: str, updates: dict) -> dict | None:
    db = get_db()
    result = (
        db.table("courses")
        .update(updates)
        .eq("id", course_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


def delete_course(course_id: str, user_id: str) -> bool:
    db = get_db()
    result = (
        db.table("courses")
        .delete()
        .eq("id", course_id)
        .eq("user_id", user_id)
        .execute()
    )
    return len(result.data) > 0


# ── Grade Entries ────────────────────────────────────────────────────────────

def create_grade_entry(user_id: str, course_id: str, data: dict) -> dict:
    db = get_db()
    row = {
        "user_id": user_id,
        "course_id": course_id,
        "assignment_title": data["assignment_title"],
        "category": data["category"],
        "score_earned": data["score_earned"],
        "score_possible": data["score_possible"],
        "due_date": data.get("due_date"),
        "source": data.get("source", "manual"),
    }
    result = db.table("grade_entries").insert(row).execute()
    return result.data[0]


def list_grade_entries(course_id: str, user_id: str) -> list[dict]:
    db = get_db()
    result = (
        db.table("grade_entries")
        .select("*")
        .eq("course_id", course_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def delete_grade_entry(entry_id: str, user_id: str) -> bool:
    db = get_db()
    result = (
        db.table("grade_entries")
        .delete()
        .eq("id", entry_id)
        .eq("user_id", user_id)
        .execute()
    )
    return len(result.data) > 0


# ── Study Materials ──────────────────────────────────────────────────────────

def create_study_material(user_id: str, course_id: str, data: dict) -> dict:
    db = get_db()
    row = {
        "user_id": user_id,
        "course_id": course_id,
        "title": data["title"],
        "file_path": data.get("file_path"),
        "content": data.get("content"),
        "type": data.get("type", "notes"),
    }
    result = db.table("study_materials").insert(row).execute()
    return result.data[0]


def list_study_materials(course_id: str, user_id: str) -> list[dict]:
    db = get_db()
    result = (
        db.table("study_materials")
        .select("*")
        .eq("course_id", course_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
