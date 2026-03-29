"""
Public Resource Discovery Agent
Finds GitHub repos, notes, and public course materials.
"""
import json
import logging
from typing import TypedDict
from agents.base import call_llm as call_claude, HAIKU
from services.search import search_for_course_resources

logger = logging.getLogger(__name__)


class ResourceItem(TypedDict):
    title: str
    url: str
    type: str
    relevance_score: float
    reason: str


class PublicResourcesResult(TypedDict):
    resources: list[ResourceItem]


SYSTEM = """
You are the Public Resource Discovery Agent.
Given search results, identify which are genuinely useful course resources.
Return JSON with a list of resources, each having:
- title, url, type (github_repo|notes|slides|assignments|other), relevance_score (0-1), reason
Return only valid JSON with key "resources".
"""


async def run(course: str, university: str, topics: list[str]) -> PublicResourcesResult:
    results = await search_for_course_resources(course, university, topics)
    context = "\n".join(
        f"- {r.get('title', '')}: {r.get('url', '')}\n  {str(r.get('content', ''))[:300]}"
        for r in results
    )
    prompt = f"Course: {course} at {university}\nTopics: {', '.join(topics)}\n\nResults:\n{context}"
    try:
        raw = await call_claude(SYSTEM, prompt, model=HAIKU)
        return json.loads(raw)
    except Exception as exc:
        logger.warning("PublicResourcesAgent failed: %s", exc)
        return {"resources": []}
