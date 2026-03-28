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
