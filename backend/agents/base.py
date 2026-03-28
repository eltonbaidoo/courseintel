"""
LLM gateway for CourseIntel agents.

Call order:  Anthropic Claude  →  Google Gemini (fallback)

Fallback is triggered on:
  - Rate limit (429)
  - Overload / server errors (5xx)
  - Connection / timeout errors
  - Any other APIError from Anthropic

All agents call call_llm() — the provider switch is fully transparent to them.
"""

import logging
import anthropic
from google import genai
from google.genai import types as genai_types
from config.settings import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model constants — used by every agent
# ---------------------------------------------------------------------------
OPUS = "claude-opus-4-6"
SONNET = "claude-sonnet-4-6"
HAIKU = "claude-haiku-4-5"

# Gemini equivalents, matched by capability tier
_GEMINI_FALLBACK: dict[str, str] = {
    OPUS: "gemini-2.5-pro",       # deepest reasoning ↔ deepest reasoning
    SONNET: "gemini-2.0-flash",   # mid-tier synthesis ↔ mid-tier speed
    HAIKU: "gemini-2.0-flash-lite",  # fast/cheap classification ↔ fast/cheap
}

# Anthropic errors that should trigger a fallback (not user errors)
_FALLBACK_ON = (
    anthropic.RateLimitError,
    anthropic.APIStatusError,       # covers 5xx overload
    anthropic.APIConnectionError,
    anthropic.APITimeoutError,
)

# ---------------------------------------------------------------------------
# Clients (lazy-initialised)
# ---------------------------------------------------------------------------
_anthropic_client: anthropic.Anthropic | None = None
_gemini_client: genai.Client | None = None


def _get_anthropic() -> anthropic.Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


def _get_gemini() -> genai.Client | None:
    global _gemini_client
    if _gemini_client is None:
        if not settings.google_api_key:
            return None
        _gemini_client = genai.Client(api_key=settings.google_api_key)
    return _gemini_client


# ---------------------------------------------------------------------------
# Anthropic call
# ---------------------------------------------------------------------------
def _call_anthropic(system: str, user: str, model: str, max_tokens: int, thinking: bool) -> str:
    client = _get_anthropic()
    kwargs: dict = {
        "model": model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }
    if thinking and model in (OPUS, SONNET):
        kwargs["thinking"] = {"type": "adaptive"}

    response = client.messages.create(**kwargs)
    # Find first text block (skip thinking blocks if present)
    for block in response.content:
        if block.type == "text":
            return block.text
    return ""


# ---------------------------------------------------------------------------
# Gemini fallback call
# ---------------------------------------------------------------------------
def _call_gemini(system: str, user: str, model: str, max_tokens: int) -> str:
    client = _get_gemini()
    if client is None:
        raise RuntimeError("Gemini fallback requested but GOOGLE_API_KEY is not set.")

    gemini_model = _GEMINI_FALLBACK.get(model, "gemini-2.0-flash")
    full_prompt = f"{system}\n\n{user}" if system else user

    response = client.models.generate_content(
        model=gemini_model,
        contents=full_prompt,
        config=genai_types.GenerateContentConfig(
            max_output_tokens=max_tokens,
            temperature=0.2,
        ),
    )
    return response.text or ""


# ---------------------------------------------------------------------------
# Public interface — used by all agents
# ---------------------------------------------------------------------------
async def call_llm(
    system: str,
    user: str,
    model: str = HAIKU,
    max_tokens: int = 4096,
    thinking: bool = False,
) -> str:
    """
    Call Anthropic Claude. On retriable errors, fall back to Gemini.
    Returns the text response from whichever provider succeeded.
    """
    # --- Primary: Anthropic ---
    try:
        text = _call_anthropic(system, user, model, max_tokens, thinking)
        logger.debug("LLM response via Anthropic %s (%d chars)", model, len(text))
        return text
    except _FALLBACK_ON as exc:
        if not settings.llm_fallback_enabled:
            raise
        logger.warning(
            "Anthropic %s failed (%s: %s) — falling back to Gemini",
            model, type(exc).__name__, exc,
        )

    # --- Fallback: Gemini ---
    try:
        text = _call_gemini(system, user, model, max_tokens)
        logger.info("LLM response via Gemini fallback (%d chars)", len(text))
        return text
    except Exception as gemini_exc:
        logger.error("Gemini fallback also failed: %s", gemini_exc)
        raise RuntimeError(
            f"Both Anthropic and Gemini failed. "
            f"Last Gemini error: {gemini_exc}"
        ) from gemini_exc


# Backwards-compatible alias used by older agent code
call_claude = call_llm
