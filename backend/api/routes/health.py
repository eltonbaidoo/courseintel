"""
Health endpoints.
GET /health        | public liveness check
GET /health/llm    | internal provider status, gated by X-Internal-Token header
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
    """Internal-only: returns live OpenAI reachability status."""
    expected = settings.internal_health_token
    if not expected or x_internal_token != expected:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    openai_ok = False
    if settings.openai_api_key:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=settings.openai_api_key)
            client.models.list()
            openai_ok = True
        except Exception:
            openai_ok = False

    active = "openai" if openai_ok else "none"

    return {
        "active_provider": active,
        "openai": openai_ok,
    }
