from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CourseCreate(BaseModel):
    university_name: str
    course_name: str
    course_code: Optional[str] = None
    professor_name: Optional[str] = None


class GradingCategory(BaseModel):
    name: str
    weight: float  # 0.0 to 1.0
    notes: Optional[str] = None


class DetectedTool(BaseModel):
    tool_name: str
    evidence: str
    purpose: str
    confidence: float
    integration_type: str  # api | extension_scrape | manual


class PublicResource(BaseModel):
    title: str
    url: str
    type: str  # github_repo | notes | slides | assignments | other
    relevance_score: float
    reason: str


class StudentSignal(BaseModel):
    workload: Optional[str] = None  # low | medium | high
    difficulty: Optional[str] = None
    grading_style: Optional[str] = None
    key_warnings: list[str] = []
    positive_signals: list[str] = []
    summary: str = ""
    confidence: float = 0.0


# ── Response models ──────────────────────────────────────────────────────────

class WeeklyAction(BaseModel):
    title: str
    rationale: str
    priority: int
    due_date: Optional[str] = None


class ActionPlanResponse(BaseModel):
    risk_level: str
    risk_explanation: str = ""
    weekly_actions: list[WeeklyAction] = []
    missing_data_flags: list[str] = []
    focus_note: str = ""


class BootstrapResponse(BaseModel):
    id: Optional[str] = None
    course_identity: dict = {}
    syllabus_status: dict = {}
    course_profile: dict = {}
    resources: list = []
    detected_tools: list = []
    student_signal: dict = {}
    obligations: list = []
