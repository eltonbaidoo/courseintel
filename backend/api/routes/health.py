"""
Health endpoints.
GET /health        | public liveness check
GET /health/llm    | provider reachability (gated by X-Internal-Token)
GET /health/agents | live agent ping — actually calls the LLM (gated by X-Internal-Token)
GET /health/cache  | LLM response cache metrics (public — no secrets exposed)
"""
import logging
from fastapi import APIRouter, Header, HTTPException, status
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


def _check_token(x_internal_token: str | None) -> None:
    expected = settings.internal_health_token
    if not expected or x_internal_token != expected:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


@router.get("/")
async def health():
    return {"status": "ok"}


@router.get("/llm")
async def llm_status(x_internal_token: str | None = Header(default=None)):
    """Provider reachability — checks API key and connectivity without an LLM call."""
    _check_token(x_internal_token)

    provider = settings.llm_provider
    openai_ok = False
    groq_ok = False
    gemini_ok = False

    if settings.openai_api_key:
        try:
            from openai import OpenAI
            OpenAI(api_key=settings.openai_api_key).models.list()
            openai_ok = True
        except Exception:
            openai_ok = False

    if settings.gemini_api_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            # Light check: SDK can list models without a completion
            next(genai.list_models(), None)
            gemini_ok = True
        except Exception:
            gemini_ok = False

    if settings.groq_api_key:
        try:
            from openai import OpenAI
            OpenAI(
                api_key=settings.groq_api_key,
                base_url="https://api.groq.com/openai/v1",
            ).models.list()
            groq_ok = True
        except Exception:
            groq_ok = False

    _reach = {"openai": openai_ok, "gemini": gemini_ok, "groq": groq_ok}
    active = provider if _reach.get(provider, False) else "none"

    return {
        "active_provider": active,
        "openai": openai_ok,
        "gemini": gemini_ok,
        "groq": groq_ok,
    }


@router.get("/cache")
async def cache_stats():
    """
    LLM response cache metrics.

    Returns real-time hit/miss counters, hit rate, live entry count, and
    backend type.  A hit_rate near 0 is expected on first bootstrap; repeated
    bootstraps for the same course should approach 1.0.

    No token required — these are operational metrics with no sensitive data.
    """
    from services.llm_cache import stats
    return stats()


@router.get("/agents")
async def agents_ping(x_internal_token: str | None = Header(default=None)):
    """
    Live agent test — makes a real LLM completion call with a tiny prompt.
    Returns agents_online=True if the call succeeds.
    Use this to verify agents will actually work before bootstrapping a course.
    """
    _check_token(x_internal_token)

    provider = settings.llm_provider
    if provider == "none":
        return {
            "agents_online": False,
            "provider": "none",
            "error": "No LLM key configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in backend/.env",
        }

    try:
        from agents.base import call_llm, HAIKU
        response = await call_llm(
            "You are a test agent. Reply with exactly one word.",
            "PING",
            model=HAIKU,
            max_tokens=10,
        )
        return {
            "agents_online": True,
            "provider": provider,
            "response": response.strip(),
        }
    except Exception as exc:
        logger.warning("Agent ping failed: %s", exc)
        return {
            "agents_online": False,
            "provider": provider,
            "error": str(exc),
        }
