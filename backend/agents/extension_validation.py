"""
Extension Validation Agent
Judges whether a scrape payload is actually useful.
"""
import json
from agents.base import call_llm as call_claude, HAIKU

SYSTEM = """
You are the Extension Validation Agent.
Evaluate whether a browser scrape payload contains useful academic data.
Useful = assignment titles + due dates, homework names, event schedules.
Not useful = login pages, navigation menus, empty dashboards.
Return JSON with:
- status: accepted|warn|rejected
- usefulness_score: 0.0 to 1.0
- extracted_items: [{title, due_date, type, link}]
- reason: brief explanation
- retry_guidance: what to try if rejected
Return only valid JSON.
"""


async def run(raw_text: str, platform: str, items: list[dict] | None = None) -> dict:
    prompt = f"""
Platform: {platform}
Pre-parsed items from extension: {json.dumps(items or [])}

Raw page text (first 3000 chars):
{raw_text[:3000]}

Validate this scrape payload.
"""
    raw = await call_claude(SYSTEM, prompt, model=HAIKU, max_tokens=2048)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"status": "rejected", "usefulness_score": 0.0, "extracted_items": [], "reason": raw[:500]}
