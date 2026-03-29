"""
University & Course Discovery Agent
Matches a course to its canonical identity from public web context.
"""
import json
import logging
from typing import TypedDict
from agents.base import call_llm as call_claude, HAIKU
from services.search import search_web

logger = logging.getLogger(__name__)


class DiscoveryResult(TypedDict):
    canonical_name: str
    course_code: str
    university: str
    official_links: list[str]
    confidence: float
    notes: str


SYSTEM = """
You are the University & Course Discovery Agent.
Given a university name, course code/title, and optionally a professor name,
return a JSON object with:
- canonical_name: cleaned course name
- course_code: normalized code
- university: normalized university name
- official_links: list of likely official URLs found
- confidence: 0.0 to 1.0
- notes: any disambiguation notes
Return only valid JSON.
"""


async def run(university: str, course: str, professor: str = "") -> DiscoveryResult:
    query = f'"{university}" "{course}" course official site'
    results = await search_web(query, max_results=5)
    context = "\n".join(
        f"- {r.get('title', '')}: {r.get('url', '')}" for r in results
    )

    prompt = f"""
University: {university}
Course: {course}
Professor: {professor or 'unknown'}

Web results:
{context}

Return the canonical course identity as JSON.
"""
    try:
        raw = await call_claude(SYSTEM, prompt, model=HAIKU)
        return json.loads(raw)
    except Exception as exc:
        logger.warning("DiscoveryAgent failed: %s", exc)
        return {"canonical_name": course, "university": university, "course_code": course, "official_links": [], "confidence": 0.2, "notes": str(exc)}
