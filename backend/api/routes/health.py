"""
Health endpoints.
GET /health        | public liveness check
GET /health/llm    | provider reachability (gated by X-Internal-Token)
GET /health/agents | live agent ping — actually calls the LLM (gated by X-Internal-Token)
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

    if settings.openai_api_key:
        try:
            from openai import OpenAI
            OpenAI(api_key=settings.openai_api_key).models.list()
            openai_ok = True
        except Exception:
            openai_ok = False

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

    active = provider if (openai_ok or groq_ok) else "none"

    return {
        "active_provider": active,
        "openai": openai_ok,
        "groq": groq_ok,
    }


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
            "error": "No LLM key configured. Set OPENAI_API_KEY or GROQ_API_KEY in backend/.env",
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
