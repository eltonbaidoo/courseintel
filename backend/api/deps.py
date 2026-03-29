"""
FastAPI dependencies for authentication and authorization.
Validates Supabase HS256 JWTs and optional Clerk RS256 session tokens.
"""
import logging
from functools import lru_cache

import jwt as pyjwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from jwt import PyJWKClient
from config.settings import settings

logger = logging.getLogger(__name__)
bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def _clerk_jwks_client() -> PyJWKClient | None:
    if not settings.clerk_jwks_url:
        return None
    return PyJWKClient(settings.clerk_jwks_url)


def _try_clerk_payload(token: str) -> dict | None:
    client = _clerk_jwks_client()
    if not client:
        return None
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        return pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            options={"verify_aud": False},
        )
    except Exception:
        logger.debug("Clerk JWT verification failed")
        return None


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    """
    Validate the Supabase JWT from the Authorization: Bearer <token> header.
    Returns the decoded token claims (includes user_id, email, role).
    Raises 401 on any failure; never exposes the reason to the client.
    """
    if (
        settings.dev_auth_bypass
        and credentials is not None
        and credentials.credentials == settings.dev_bearer_token
    ):
        return {"sub": "courseintel-dev-local", "email": "Course@intel.edu"}

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase doesn't set standard aud claim
        )
        return payload
    except JWTError:
        pass

    clerk_payload = _try_clerk_payload(token)
    if clerk_payload:
        return clerk_payload

    logger.warning("Invalid JWT presented")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


def get_user_id(claims: dict = Depends(require_auth)) -> str:
    uid = claims.get("sub")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return uid
