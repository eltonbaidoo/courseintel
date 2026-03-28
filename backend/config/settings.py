from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # LLM providers
    anthropic_api_key: str
    google_api_key: Optional[str] = None

    # Search
    tavily_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str           # Settings > API > JWT Secret in Supabase dashboard

    # CORS — comma-separated list of allowed origins
    cors_origins: str = "http://localhost:3000"

    # LLM fallback
    llm_fallback_enabled: bool = True

    # File upload limits
    max_upload_bytes: int = 10 * 1024 * 1024   # 10 MB

    # Rate limiting (requests per minute per IP)
    rate_limit_per_minute: int = 30

    # Internal health check token — set a long random string
    internal_health_token: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
