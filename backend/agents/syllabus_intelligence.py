"""
Syllabus Intelligence Agent
Extracts grading structure, deadlines, tools, policies from syllabus text.
Uses Opus for highest accuracy — this is the core extraction agent.
"""
import json
from agents.base import call_llm as call_claude, OPUS

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


async def run(syllabus_text: str) -> dict:
    prompt = f"Syllabus:\n\n{syllabus_text[:40000]}"
    raw = await call_claude(SYSTEM, prompt, model=OPUS, max_tokens=8192, thinking=True)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "Parse failed", "raw": raw[:2000]}
