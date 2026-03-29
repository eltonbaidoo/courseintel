"""
Health endpoints.
GET /health        — public liveness check
GET /health/llm    — internal provider status, gated by X-Internal-Token header
"""
import logging
from fastapi import APIRouter, Header, HTTPException, status
from config.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health():
    return {"status": "ok"}


@router.get("/llm")
async def llm_status(x_internal_token: str | None = Header(default=None)):
    """Internal-only: returns live LLM reachability status."""
    expected = settings.internal_health_token
    if not expected or x_internal_token != expected:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    provider = settings.llm_provider
    anthropic_ok = False
    openai_ok = False

    if provider == "anthropic" and settings.anthropic_api_key:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=settings.anthropic_api_key)
            # Light-weight call to verify the key works
            client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
            )
            anthropic_ok = True
        except Exception:
            anthropic_ok = False

    elif provider == "openai" and settings.openai_api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            client.models.list()
            openai_ok = True
        except Exception:
            openai_ok = False

    active = "none"
    if anthropic_ok:
        active = "anthropic"
    elif openai_ok:
        active = "openai"

    return {
        "anthropic": anthropic_ok,
        "openai": openai_ok,
        "active_provider": active,
    }
