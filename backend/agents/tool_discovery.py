"""
Third-Party Tool Discovery Agent
Identifies platforms and apps required by the course.
"""
import json
import logging
from typing import TypedDict
from agents.base import call_llm as call_claude, HAIKU

logger = logging.getLogger(__name__)


class ToolItem(TypedDict):
    tool_name: str
    evidence: str
    purpose: str
    confidence: float
    integration_type: str


class ToolDiscoveryResult(TypedDict):
    tools: list[ToolItem]


KNOWN_PLATFORMS = [
    "Gradescope", "Canvas", "Brightspace", "Blackboard", "Moodle",
    "Edfinity", "Piazza", "Ed Discussion", "Notion", "Google Classroom",
    "GitHub", "Google Calendar", "Zoom", "Slack", "Discord",
    "Overleaf", "Desmos", "WeBWorK", "MyLab", "Cengage", "McGraw-Hill Connect",
]

SYSTEM = """
You are the Third-Party Tool Discovery Agent.
Identify all third-party platforms and tools required or likely used by students in this course.
Return JSON with a list of tools, each having:
- tool_name: string
- evidence: the exact text that implies this tool
- purpose: what students use it for
- confidence: 0.0 to 1.0
- integration_type: api|extension_scrape|manual
Return only valid JSON with key "tools".
"""


async def run(syllabus_text: str, course_page_text: str = "") -> ToolDiscoveryResult:
    known = ", ".join(KNOWN_PLATFORMS)
    prompt = f"""
Known platforms to watch for: {known}

Syllabus:
{syllabus_text[:15000]}

Course page context:
{course_page_text[:5000]}
"""
    try:
        raw = await call_claude(SYSTEM, prompt, model=HAIKU)
        return json.loads(raw)
    except Exception as exc:
        logger.warning("ToolDiscoveryAgent failed: %s", exc)
        return {"tools": []}
