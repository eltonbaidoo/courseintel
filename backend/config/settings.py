from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # LLM: OpenAI only (agents use gpt-4o / gpt-4o-mini via logical tiers in agents/base.py)
    openai_api_key: Optional[str] = None

    # Web search
    tavily_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str

    # CORS: comma-separated list of allowed origins
    cors_origins: str = "http://localhost:3000"

    # File upload limits
    max_upload_bytes: int = 10 * 1024 * 1024   # 10 MB

    # Rate limiting (requests per minute per IP)
    rate_limit_per_minute: int = 30

    # Internal health check token
    internal_health_token: Optional[str] = None

    # Local dev only: accept fixed Bearer token instead of Supabase JWT (see deps.require_auth)
    dev_auth_bypass: bool = False
    dev_bearer_token: str = "courseintel-local-dev-bearer"

    # Optional: Clerk session JWT (RS256) — JWKS URL from Clerk Dashboard → API Keys → Advanced
    # Example: https://your-app.clerk.accounts.dev/.well-known/jwks.json
    clerk_jwks_url: Optional[str] = None

    @property
    def llm_provider(self) -> str:
        return "openai" if self.openai_api_key else "none"

    class Config:
        env_file = ".env"


settings = Settings()
