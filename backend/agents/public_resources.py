"""
Public Resource Discovery Agent
Finds GitHub repos, notes, and public course materials.
"""
import json
from agents.base import call_llm as call_claude, HAIKU
from services.search import search_for_course_resources

SYSTEM = """
You are the Public Resource Discovery Agent.
Given search results, identify which are genuinely useful course resources.
Return JSON with a list of resources, each having:
- title, url, type (github_repo|notes|slides|assignments|other), relevance_score (0-1), reason
Return only valid JSON with key "resources".
"""


async def run(course: str, university: str, topics: list[str]) -> dict:
    results = await search_for_course_resources(course, university, topics)
    context = "\n".join(
        f"- {r.get('title', '')}: {r.get('url', '')}\n  {str(r.get('content', ''))[:300]}"
        for r in results
    )
    prompt = f"Course: {course} at {university}\nTopics: {', '.join(topics)}\n\nResults:\n{context}"
    raw = await call_claude(SYSTEM, prompt, model=HAIKU)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"resources": []}
