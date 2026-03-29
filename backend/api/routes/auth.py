"""
Auth routes: thin stubs only.
All real authentication is handled client-side via Supabase Auth SDK.
Supabase issues JWTs; the backend validates them on protected routes.
Passwords NEVER touch this server.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/status")
async def auth_status():
    """Used by the frontend to confirm the API is reachable before auth flow."""
    return {"status": "ok"}
