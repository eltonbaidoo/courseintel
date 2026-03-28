"""
Extension Orchestration Agent
Tells the student exactly where to go and what the extension should capture.
"""
import json
from agents.base import call_llm as call_claude, HAIKU

PLATFORM_GUIDES: dict[str, dict] = {
    "gradescope": {
        "target_page": "Assignments list",
        "url_hint": "/courses/{id}/assignments",
        "what_to_capture": "Assignment titles, due dates, submission links",
    },
    "canvas": {
        "target_page": "Assignments or Calendar",
        "url_hint": "/courses/{id}/assignments",
        "what_to_capture": "Assignment names, due dates, point values",
    },
    "brightspace": {
        "target_page": "Assignments or Content",
        "url_hint": "/d2l/lms/dropbox/",
        "what_to_capture": "Assignment names, due dates",
    },
    "edfinity": {
        "target_page": "Homework list",
        "url_hint": "/assignments",
        "what_to_capture": "Problem set names, due dates",
    },
}

SYSTEM = """
You are the Extension Orchestration Agent.
Generate concise instructions telling the student exactly what page to open
and what the browser extension will try to capture. Be specific and brief.
Return JSON with: target_url_description, what_to_capture, step_by_step (list of 3-4 steps).
"""


async def run(platform: str, course_context: str = "") -> dict:
    guide = PLATFORM_GUIDES.get(platform.lower(), {})
    prompt = f"""
Platform: {platform}
Known guide: {json.dumps(guide)}
Course context: {course_context}

Generate scraping instructions for the student.
"""
    raw = await call_claude(SYSTEM, prompt, model=HAIKU, max_tokens=1024)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"target_url_description": guide.get("target_page", ""), "step_by_step": [raw]}
