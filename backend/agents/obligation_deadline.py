"""
Obligation & Deadline Agent
Normalizes, deduplicates, and ranks all obligations from all sources.
"""
import json
import logging
from typing import TypedDict

from agents.base import call_llm as call_claude, HAIKU

logger = logging.getLogger(__name__)


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


def _coerce_result(parsed: object, fallback: list[dict]) -> ObligationResult:
    if isinstance(parsed, dict):
        obs = parsed.get("obligations")
        if isinstance(obs, list):
            return {"obligations": obs}
    return {"obligations": fallback}


async def run(obligations: list[dict]) -> ObligationResult:
    if not obligations:
        return {"obligations": []}

    prompt = f"Obligations from all sources:\n{json.dumps(obligations, indent=2)}"
    try:
        raw = await call_claude(SYSTEM, prompt, model=HAIKU, max_tokens=4096)
    except Exception as exc:
        logger.warning("Obligation normalization LLM call failed: %s", exc)
        return {"obligations": obligations}

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("Obligation normalization returned non-JSON; using raw deadlines")
        return {"obligations": obligations}

    return _coerce_result(parsed, obligations)
