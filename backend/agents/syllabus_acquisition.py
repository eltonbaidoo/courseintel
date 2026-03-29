"""
Syllabus Acquisition Agent
Finds a syllabus from public web sources or flags that one is needed.
"""
import json
from agents.base import call_llm as call_claude, HAIKU
from services.search import search_for_syllabus
from services.pdf_parser import extract_text_from_pdf_url

SYSTEM = """
You are the Syllabus Acquisition Agent.
Given search results for a course syllabus, evaluate each result and return:
- found: true/false
- best_url: the most likely real syllabus URL, or null
- confidence: 0.0 to 1.0
- reason: why you chose this or why none was found
Return only valid JSON.
"""


async def run(course: str, university: str, professor: str = "") -> dict:
    results = await search_for_syllabus(course, university, professor)
    context = "\n".join(f"- {r['title']}: {r['url']}\n  {r.get('content', '')[:200]}" for r in results)

    prompt = f"""
Course: {course}
University: {university}
Professor: {professor or 'unknown'}

Search results:
{context}

Evaluate which result is most likely a real course syllabus.
"""
    raw = await call_claude(SYSTEM, prompt, model=HAIKU)
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        return {"found": False, "best_url": None, "confidence": 0.0, "reason": raw}

    if result.get("found") and result.get("best_url"):
        try:
            text = await extract_text_from_pdf_url(result["best_url"])
            result["syllabus_text"] = text[:50000]
        except Exception:
            result["syllabus_text"] = None
            result["found"] = False
            result["reason"] = "PDF could not be fetched. Please upload manually."

    return result
