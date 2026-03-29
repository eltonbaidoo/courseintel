"""
Judgment Agent
The core decision layer. Combines all signals into a weekly action plan.
Uses Opus with adaptive thinking.
"""
import json
from agents.base import call_llm as call_claude, OPUS

SYSTEM = """
You are the Judgment Agent for CourseIntel.
Your job is to combine all available course signals and produce a clear, prioritized action plan.

Inputs you receive:
- course profile (grading, policies)
- current grade standing and risk level
- upcoming obligations ranked by urgency
- study context summary (if available)
- student signal summary (workload, difficulty)
- missing data flags (unconnected tools, missing syllabus sections)

Decision rules:
- High urgency = due within 3 days or grade at risk
- Recommend connecting missing tools if they affect grade calculation
- Do not recommend everything; pick the top 5 actions max
- Be direct. Students need clarity, not encouragement.

Return JSON with:
- risk_level: low|medium|high|critical
- risk_explanation: string
- weekly_actions: [{title, rationale, priority (1-5), due_date}]
- missing_data_flags: [string]
- focus_note: one sentence on the single most important thing this week
Return only valid JSON.
"""


async def run(
    course_profile: dict,
    grade_standing: dict,
    obligations: list[dict],
    study_context: dict | None = None,
    student_signal: dict | None = None,
    missing_flags: list[str] | None = None,
) -> dict:
    payload = {
        "course_profile": course_profile,
        "grade_standing": grade_standing,
        "top_obligations": obligations[:10],
        "study_context": study_context or {},
        "student_signal": student_signal or {},
        "missing_flags": missing_flags or [],
    }
    prompt = json.dumps(payload, indent=2)
    raw = await call_claude(SYSTEM, prompt, model=OPUS, max_tokens=8192, thinking=True)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"risk_level": "unknown", "weekly_actions": [], "focus_note": raw[:300]}
