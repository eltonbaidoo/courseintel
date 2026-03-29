"""
LLM gateway for CourseIntel agents.

Supported providers (auto-selected from .env):
  OPENAI_API_KEY  → OpenAI gpt-4o / gpt-4o-mini
  GEMINI_API_KEY  → Google Gemini (1.5 Pro for gpt-4o tier, 2.0 Flash for mini tier; free tier quotas apply)
  GROQ_API_KEY    → Groq llama-3.3-70b-versatile / llama-3.1-8b-instant (free tier)

Priority if multiple keys are set: OpenAI → Gemini → Groq.

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

# ── Gemini model IDs (Google AI Studio / AI Studio free tier) ────────────────
_GEMINI_OPUS = "gemini-1.5-pro"
_GEMINI_SONNET = "gemini-1.5-pro"
_GEMINI_HAIKU = "gemini-2.0-flash"

_OPENAI_TO_GEMINI = {
    "gpt-4o": _GEMINI_OPUS,
    "gpt-4o-mini": _GEMINI_HAIKU,
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
    Priority: OpenAI → Gemini → Groq. `thinking` is unused (API compatibility).
    """
    _ = thinking

    if settings.openai_api_key:
        return await _call_provider(_get_openai(), model, system, user, max_tokens)

    if settings.gemini_api_key:
        gem_name = _OPENAI_TO_GEMINI.get(model, _GEMINI_HAIKU)
        return await _call_gemini(system, user, gem_name, max_tokens)

    if settings.groq_api_key:
        groq_model = _OPENAI_TO_GROQ.get(model, _GROQ_HAIKU)
        return await _call_provider(_get_groq(), groq_model, system, user, max_tokens)

    raise RuntimeError(
        "No LLM configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in backend/.env"
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


async def _call_gemini(system: str, user: str, model: str, max_tokens: int) -> str:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    gmodel = genai.GenerativeModel(model, system_instruction=system)
    try:
        response = await gmodel.generate_content_async(
            user,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.2,
            ),
        )
        try:
            text = (response.text or "").strip()
        except ValueError:
            text = ""
        if not text:
            raise RuntimeError("Gemini returned an empty or blocked response")
        logger.debug("LLM %s → %d chars", model, len(text))
        return text
    except Exception as exc:
        logger.error("LLM call failed (%s): %s", model, exc)
        raise


# Backwards-compatible alias used by agent modules
call_claude = call_llm
