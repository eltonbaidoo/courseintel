"""
LLM gateway for CourseIntel agents — OpenAI only.

Model tiers (passed by agents; these are OpenAI model IDs):
  OPUS   → gpt-4o   (deep reasoning — Judgment, Syllabus Intelligence)
  SONNET → gpt-4o   (balanced — Reputation, Study Context)
  HAIKU  → gpt-4o-mini  (fast — other agents)
"""
import logging
from config.settings import settings

logger = logging.getLogger(__name__)

OPUS = "gpt-4o"
SONNET = "gpt-4o"
HAIKU = "gpt-4o-mini"

_openai_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


async def call_llm(
    system: str,
    user: str,
    model: str = HAIKU,
    max_tokens: int = 4096,
    thinking: bool = False,
) -> str:
    """
    Call OpenAI Chat Completions.
    `thinking` is accepted for API compatibility with older agent code; it is not used on OpenAI.
    """
    if not settings.openai_api_key:
        raise RuntimeError(
            "No LLM configured. Set OPENAI_API_KEY in backend/.env"
        )
    _ = thinking  # reserved for future reasoning models
    return await _call_openai(system, user, model, max_tokens)


async def _call_openai(
    system: str, user: str, model: str, max_tokens: int
) -> str:
    client = _get_openai()

    try:
        response = client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
        )
        text = response.choices[0].message.content or ""
        logger.debug("OpenAI %s → %d chars", model, len(text))
        return text
    except Exception as exc:
        logger.error("OpenAI call failed (%s): %s", model, exc)
        raise


# Backwards-compatible alias used by agent modules
call_claude = call_llm
