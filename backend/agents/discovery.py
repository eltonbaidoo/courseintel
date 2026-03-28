"""
University & Course Discovery Agent
Matches a course to its canonical identity from public web context.
"""
import json
from agents.base import call_llm as call_claude, HAIKU
from services.search import search_web

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


async def run(university: str, course: str, professor: str = "") -> dict:
    query = f'"{university}" "{course}" course official site'
    results = await search_web(query, max_results=5)
    context = "\n".join(f"- {r['title']}: {r['url']}" for r in results)

    prompt = f"""
University: {university}
Course: {course}
Professor: {professor or 'unknown'}

Web results:
{context}

Return the canonical course identity as JSON.
"""
    raw = await call_claude(SYSTEM, prompt, model=HAIKU)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"canonical_name": course, "university": university, "confidence": 0.3, "notes": raw}
