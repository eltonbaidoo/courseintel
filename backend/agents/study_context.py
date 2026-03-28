"""
Study Context Agent
Summarizes uploaded notes, PDFs, and exports into actionable study context.
"""
import json
from agents.base import call_llm as call_claude, SONNET

SYSTEM = """
You are the Study Context Agent.
Summarize uploaded study materials into a structured study context.
Return JSON with:
- summary: 3-4 sentence overview of covered material
- key_topics: [string] (up to 10 topics identified)
- weak_coverage: [string] (topics mentioned briefly or missing)
- study_priorities: [string] (what to focus on, in order)
Return only valid JSON.
"""


async def run(materials: list[dict]) -> dict:
    """
    materials: [{title, content, type}]
    """
    combined = "\n\n---\n\n".join(
        f"[{m['title']} — {m.get('type', 'notes')}]\n{m['content'][:8000]}"
        for m in materials
    )
    prompt = f"Study materials:\n\n{combined[:40000]}"
    raw = await call_claude(SYSTEM, prompt, model=SONNET, max_tokens=4096)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"summary": raw[:500], "key_topics": [], "study_priorities": []}
