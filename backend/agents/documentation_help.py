"""
Documentation Help Agent
Provides contextual platform-specific guidance in the help bar.
"""
import json
from agents.base import call_llm as call_claude, HAIKU

PLATFORM_DOCS: dict[str, str] = {
    "gradescope": "Gradescope is used for homework submission and grading. The assignments list page shows all current and past assignments with their due dates.",
    "canvas": "Canvas is a Learning Management System. Assignment due dates are on the Assignments page or the Calendar view.",
    "brightspace": "Brightspace (D2L) stores assignments under Content or Assignments. The course home shows upcoming items.",
    "edfinity": "Edfinity is used for math/science problem sets. The dashboard shows active assignments and their deadlines.",
    "piazza": "Piazza is a Q&A platform. It does not typically have assignment due dates; check Canvas or Gradescope instead.",
}

SYSTEM = """
You are the Documentation Help Agent.
Write a short, friendly help card for students explaining:
1. What this platform is used for in their course
2. Exactly what page to open
3. What the extension will try to capture
4. What a successful capture looks like
5. One troubleshooting tip if nothing is found

Be specific and brief. Plain language only.
Return JSON with: what_it_is, page_to_open, what_captures, success_looks_like, troubleshoot_tip.
"""


async def run(platform: str, course_context: str = "") -> dict:
    known_doc = PLATFORM_DOCS.get(platform.lower(), "")
    prompt = f"Platform: {platform}\nKnown info: {known_doc}\nCourse context: {course_context}"
    raw = await call_claude(SYSTEM, prompt, model=HAIKU, max_tokens=1024)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"what_it_is": known_doc, "troubleshoot_tip": raw[:200]}
