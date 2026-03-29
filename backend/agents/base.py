"""
LLM gateway for CourseIntel agents.

Supported providers (auto-selected from .env):
  OPENAI_API_KEY → OpenAI gpt-4o / gpt-4o-mini
  GROQ_API_KEY   → Groq llama-3.3-70b-versatile / llama-3.1-8b-instant (free tier)

OpenAI takes precedence if both keys are present.

Model tiers used by agents:
  OPUS   → best reasoning  (Judgment, Syllabus Intelligence)
  SONNET → balanced        (Reputation, Study Context)
  HAIKU  → fast/cheap      (all other agents)
"""
import logging
from config.settings import settings

logger = logging.getLogger(__name__)

# ── OpenAI model IDs ─────────────────────────────────────────────────────────
OPUS = "gpt-4o"
SONNET = "gpt-4o"
HAIKU = "gpt-4o-mini"

# ── Groq model IDs (OpenAI-compatible endpoint) ───────────────────────────────
_GROQ_OPUS = "llama-3.3-70b-versatile"
_GROQ_SONNET = "llama-3.3-70b-versatile"
_GROQ_HAIKU = "llama-3.1-8b-instant"

_OPENAI_TO_GROQ = {
    "gpt-4o": _GROQ_OPUS,
    "gpt-4o-mini": _GROQ_HAIKU,
}

# ── Lazy-init clients ─────────────────────────────────────────────────────────
_openai_client = None
_groq_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def _get_groq():
    global _groq_client
    if _groq_client is None:
        from openai import OpenAI
        _groq_client = OpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    return _groq_client


# ── Public gateway ────────────────────────────────────────────────────────────

async def call_llm(
    system: str,
    user: str,
    model: str = HAIKU,
    max_tokens: int = 4096,
    thinking: bool = False,
) -> str:
    """
    Call the configured LLM provider.
    OpenAI is used when OPENAI_API_KEY is set; Groq when GROQ_API_KEY is set.
    `thinking` is accepted for API compatibility; not used on either provider.
    """
    _ = thinking

    if settings.openai_api_key:
        return await _call_provider(_get_openai(), model, system, user, max_tokens)

    if settings.groq_api_key:
        groq_model = _OPENAI_TO_GROQ.get(model, _GROQ_HAIKU)
        return await _call_provider(_get_groq(), groq_model, system, user, max_tokens)

    raise RuntimeError(
        "No LLM configured. Set OPENAI_API_KEY (OpenAI) or GROQ_API_KEY (free) in backend/.env"
    )


async def _call_provider(client, model: str, system: str, user: str, max_tokens: int) -> str:
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
        logger.debug("LLM %s → %d chars", model, len(text))
        return text
    except Exception as exc:
        logger.error("LLM call failed (%s): %s", model, exc)
        raise


# Backwards-compatible alias used by agent modules
call_claude = call_llm
