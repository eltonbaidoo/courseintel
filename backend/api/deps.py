"""
FastAPI dependencies for authentication and authorization.
Validates Supabase-issued JWTs on every protected route.
"""
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config.settings import settings

logger = logging.getLogger(__name__)
bearer = HTTPBearer(auto_error=False)


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
        logger.warning("Invalid JWT presented")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


def get_user_id(claims: dict = Depends(require_auth)) -> str:
    uid = claims.get("sub")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return uid
