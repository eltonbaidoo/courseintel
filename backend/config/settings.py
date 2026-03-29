from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # LLM providers — at least one required
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Web search
    tavily_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str

    # CORS — comma-separated list of allowed origins
    cors_origins: str = "http://localhost:3000"

    # File upload limits
    max_upload_bytes: int = 10 * 1024 * 1024   # 10 MB

    # Rate limiting (requests per minute per IP)
    rate_limit_per_minute: int = 30

    # Internal health check token
    internal_health_token: Optional[str] = None

    @property
    def llm_provider(self) -> str:
        if self.anthropic_api_key:
            return "anthropic"
        if self.openai_api_key:
            return "openai"
        return "none"

    class Config:
        env_file = ".env"


settings = Settings()
