"""
Reputation & Student Signal Agent
Synthesizes public student sentiment about a course and professor.
"""
import json
from agents.base import call_llm as call_claude, SONNET
from services.search import search_for_reputation

SYSTEM = """
You are the Reputation & Student Signal Agent.
Synthesize what students publicly say about this course and professor.
Do not over-trust any single source. Look for recurring themes.
Return JSON with:
- workload: low|medium|high
- difficulty: low|medium|high
- grading_style: lenient|moderate|strict
- key_warnings: [string]  (up to 3 recurring student concerns)
- positive_signals: [string]  (up to 3 recurring positives)
- summary: 2-sentence synthesis
- confidence: 0.0 to 1.0
- source_count: int
Return only valid JSON.
"""


async def run(course: str, professor: str, university: str) -> dict:
    results = await search_for_reputation(course, professor, university)
    if not results:
        return {"summary": "No public signal found.", "confidence": 0.0}
    context = "\n".join(f"- {r['title']}\n  {r.get('content','')[:400]}" for r in results)
    prompt = f"Course: {course}\nProfessor: {professor}\nUniversity: {university}\n\nSources:\n{context}"
    raw = await call_claude(SYSTEM, prompt, model=SONNET)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"summary": raw[:500], "confidence": 0.3}
