"""
Obligation & Deadline Agent
Normalizes, deduplicates, and ranks all obligations from all sources.
"""
import json
from agents.base import call_llm as call_claude, HAIKU

SYSTEM = """
You are the Obligation & Deadline Agent.
Given a combined list of obligations from multiple sources (syllabus, LMS scrapes, manual entry),
normalize them, remove duplicates, and rank by urgency.
Return JSON with key "obligations", each having:
- title, due_date (ISO 8601 or null), source, type (assignment|exam|project|reading|other),
  urgency (high|medium|low), conflict_note (if due dates cluster)
Return only valid JSON.
"""


async def run(obligations: list[dict]) -> dict:
    prompt = f"Obligations from all sources:\n{json.dumps(obligations, indent=2)}"
    raw = await call_claude(SYSTEM, prompt, model=HAIKU, max_tokens=4096)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"obligations": obligations}
