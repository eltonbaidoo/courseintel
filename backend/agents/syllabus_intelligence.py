"""
Syllabus Intelligence Agent
Extracts grading structure, deadlines, tools, policies from syllabus text.
Uses Opus for highest accuracy; this is the core extraction agent.
"""
import json
import logging
from typing import TypedDict
from agents.base import call_llm as call_claude, OPUS

logger = logging.getLogger(__name__)


class GradingCategory(TypedDict):
    name: str
    weight: float
    notes: str


class KeyDeadline(TypedDict):
    title: str
    date: str
    type: str


class SyllabusProfile(TypedDict):
    grading_categories: list[GradingCategory]
    late_policy: str
    attendance_policy: str
    drop_rules: str
    required_tools: list[str]
    key_deadlines: list[KeyDeadline]
    course_summary: str
    workflow_notes: str


SYSTEM = """
You are the Syllabus Intelligence Agent.
Extract a complete course profile from the syllabus text.
Return JSON with:
- grading_categories: [{name, weight, notes}]
- late_policy: string
- attendance_policy: string
- drop_rules: string
- required_tools: [string]  (named apps/platforms)
- key_deadlines: [{title, date, type}]
- course_summary: 2-sentence description
- workflow_notes: any special expectations
Return only valid JSON.
"""


async def run(syllabus_text: str) -> SyllabusProfile:
    prompt = f"Syllabus:\n\n{syllabus_text[:40000]}"
    try:
        raw = await call_claude(SYSTEM, prompt, model=OPUS, max_tokens=8192, thinking=True)
        return json.loads(raw)
    except Exception as exc:
        logger.warning("SyllabusIntelligenceAgent failed: %s", exc)
        return {"grading_categories": [], "late_policy": "", "attendance_policy": "", "drop_rules": "", "required_tools": [], "key_deadlines": [], "course_summary": "", "workflow_notes": ""}
