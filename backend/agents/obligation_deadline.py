"""
Obligation & Deadline Agent
Normalizes, deduplicates, and ranks all obligations from all sources.
"""
import json
from typing import TypedDict
from agents.base import call_llm as call_claude, HAIKU


class _ObligationItem(TypedDict):
    title: str
    due_date: str | None
    source: str
    type: str
    urgency: str
    conflict_note: str | None


class ObligationResult(TypedDict):
    obligations: list[_ObligationItem]


SYSTEM = """
You are the Obligation & Deadline Agent.
Given a combined list of obligations from multiple sources (syllabus, LMS scrapes, manual entry),
normalize them, remove duplicates, and rank by urgency.
Return JSON with key "obligations", each having:
- title, due_date (ISO 8601 or null), source, type (assignment|exam|project|reading|other),
  urgency (high|medium|low), conflict_note (if due dates cluster)
Return only valid JSON.
"""


async def run(obligations: list[dict]) -> ObligationResult:
    prompt = f"Obligations from all sources:\n{json.dumps(obligations, indent=2)}"
    raw = await call_claude(SYSTEM, prompt, model=HAIKU, max_tokens=4096)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"obligations": obligations}
