"""
LLM gateway for CourseIntel agents.
Supports Anthropic Claude (primary) and OpenAI (fallback).

Model tiers:
  OPUS   → claude-opus-4-6 / gpt-4o          (deep reasoning — Judgment, Syllabus Intelligence)
  SONNET → claude-sonnet-4-6 / gpt-4o        (balanced — Reputation, Study Context)
  HAIKU  → claude-haiku-4-5-20251001 / gpt-4o-mini  (fast — all other agents)
"""
import logging
from config.settings import settings

logger = logging.getLogger(__name__)

# ── Model constants ──────────────────────────────────────────────────────────
# Agent code always references these; the gateway maps to the active provider.
OPUS = "claude-opus-4-6"
SONNET = "claude-sonnet-4-6"
HAIKU = "claude-haiku-4-5-20251001"

# OpenAI equivalents
_CLAUDE_TO_OPENAI = {
    OPUS: "gpt-4o",
    SONNET: "gpt-4o",
    HAIKU: "gpt-4o-mini",
}

# ── Lazy-init clients ───────────────────────────────────────────────────────
_anthropic_client = None
_openai_client = None


def _get_anthropic():
    global _anthropic_client
    if _anthropic_client is None:
        from anthropic import Anthropic
        _anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


def _get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


# ── Public API ───────────────────────────────────────────────────────────────

async def call_llm(
    system: str,
    user: str,
    model: str = HAIKU,
    max_tokens: int = 4096,
    thinking: bool = False,
) -> str:
    """
    Route to the configured LLM provider.
    `thinking=True` enables extended thinking on Anthropic Opus/Sonnet.
    """
    provider = settings.llm_provider
    if provider == "anthropic":
        return await _call_anthropic(system, user, model, max_tokens, thinking)
    elif provider == "openai":
        return await _call_openai(system, user, model, max_tokens)
    else:
        raise RuntimeError(
            "No LLM API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env"
        )


async def _call_anthropic(
    system: str, user: str, model: str, max_tokens: int, thinking: bool
) -> str:
    client = _get_anthropic()

    kwargs: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }

    if thinking:
        kwargs["max_tokens"] = max(max_tokens, 16384)
        kwargs["thinking"] = {
            "type": "enabled",
            "budget_tokens": min(10000, kwargs["max_tokens"] // 2),
        }
    else:
        kwargs["temperature"] = 0.2

    try:
        response = client.messages.create(**kwargs)
        text = ""
        for block in response.content:
            if block.type == "text":
                text = block.text
                break
        logger.debug("Anthropic %s → %d chars", model, len(text))
        return text
    except Exception as exc:
        logger.error("Anthropic call failed (%s): %s", model, exc)
        raise


async def _call_openai(
    system: str, user: str, model: str, max_tokens: int
) -> str:
    client = _get_openai()
    openai_model = _CLAUDE_TO_OPENAI.get(model, model)

    try:
        response = client.chat.completions.create(
            model=openai_model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
        )
        text = response.choices[0].message.content or ""
        logger.debug("OpenAI %s → %d chars", openai_model, len(text))
        return text
    except Exception as exc:
        logger.error("OpenAI call failed (%s): %s", openai_model, exc)
        raise


# Backwards-compatible alias used by all agent modules
call_claude = call_llm
