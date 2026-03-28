from tavily import TavilyClient
from config.settings import settings

_client: TavilyClient | None = None


def get_search_client() -> TavilyClient:
    global _client
    if _client is None:
        _client = TavilyClient(api_key=settings.tavily_api_key)
    return _client


async def search_web(query: str, max_results: int = 5) -> list[dict]:
    client = get_search_client()
    response = client.search(query=query, max_results=max_results, search_depth="advanced")
    return response.get("results", [])


async def search_for_syllabus(course: str, university: str, professor: str = "") -> list[dict]:
    query = f'"{course}" "{university}" syllabus filetype:pdf'
    if professor:
        query += f' "{professor}"'
    return await search_web(query, max_results=5)


async def search_for_course_resources(course: str, university: str, topics: list[str]) -> list[dict]:
    topic_str = " ".join(topics[:3])
    query = f'site:github.com OR site:reddit.com "{course}" "{university}" {topic_str} notes study'
    return await search_web(query, max_results=8)


async def search_for_reputation(course: str, professor: str, university: str) -> list[dict]:
    query = f'"{professor}" "{course}" "{university}" review difficulty grade'
    return await search_web(query, max_results=6)
