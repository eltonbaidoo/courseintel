"""
Reputation & Student Signal Agent
Synthesizes public student sentiment about a course and professor.
"""
import json
import logging
from typing import TypedDict
from agents.base import call_llm as call_claude, SONNET
from services.search import search_for_reputation

logger = logging.getLogger(__name__)


class ReputationResult(TypedDict):
    workload: str
    difficulty: str
    grading_style: str
    key_warnings: list[str]
    positive_signals: list[str]
    summary: str
    confidence: float
    source_count: int


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


async def run(course: str, professor: str, university: str) -> ReputationResult:
    results = await search_for_reputation(course, professor, university)
    if not results:
        return {"summary": "No public signal found.", "confidence": 0.0}
    context = "\n".join(
        f"- {r.get('title', '')}\n  {str(r.get('content', ''))[:400]}" for r in results
    )
    prompt = f"Course: {course}\nProfessor: {professor}\nUniversity: {university}\n\nSources:\n{context}"
    try:
        raw = await call_claude(SYSTEM, prompt, model=SONNET)
        return json.loads(raw)
    except Exception as exc:
        logger.warning("ReputationAgent failed: %s", exc)
        return {"workload": "unknown", "difficulty": "unknown", "grading_style": "unknown", "key_warnings": [], "positive_signals": [], "summary": str(exc), "confidence": 0.2, "source_count": 0}
