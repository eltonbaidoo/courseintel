"""
Health endpoints.
/health       — public liveness check (returns only ok/error, no internals)
/health/llm   — internal-only provider status, gated by INTERNAL_TOKEN header
"""
import logging
import anthropic as anthropic_lib
from fastapi import APIRouter, Header, HTTPException, status
from agents.base import _get_anthropic, _get_gemini
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health():
    """Public liveness probe — safe for load balancers and uptime monitors."""
    return {"status": "ok"}


@router.get("/llm")
async def llm_status(x_internal_token: str | None = Header(default=None)):
    """
    LLM provider status — internal use only.
    Requires the X-Internal-Token header matching INTERNAL_HEALTH_TOKEN env var.
    Returns safe, non-identifying status booleans only.
    """
    expected = settings.internal_health_token
    if not expected or x_internal_token != expected:
        # Return 404 instead of 401 to avoid confirming the endpoint exists
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    anthropic_ok = False
    gemini_ok = _get_gemini() is not None

    try:
        client = _get_anthropic()
        client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=8,
            messages=[{"role": "user", "content": "ping"}],
        )
        anthropic_ok = True
    except anthropic_lib.RateLimitError:
        anthropic_ok = False
    except Exception:
        anthropic_ok = False

    active_provider = "anthropic" if anthropic_ok else ("gemini" if gemini_ok else "none")

    return {
        "anthropic": anthropic_ok,
        "gemini": gemini_ok,
        "fallback_enabled": settings.llm_fallback_enabled,
        "active_provider": active_provider,
    }
