from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re

_PLATFORM_WHITELIST = {
    "gradescope", "canvas", "brightspace", "edfinity",
    "blackboard", "moodle", "piazza", "unknown",
}


class ScrapedItemRaw(BaseModel):
    title: str = Field(..., max_length=512)
    due_date: Optional[str] = Field(default=None, max_length=64)
    link: Optional[str] = Field(default=None, max_length=2048)
    type: str = Field(default="assignment", max_length=32)

    @field_validator("link")
    @classmethod
    def link_must_be_https(cls, v: str | None) -> str | None:
        if v and not re.match(r"^https?://", v):
            return None  # drop non-URL links silently
        return v

    @field_validator("type")
    @classmethod
    def type_must_be_known(cls, v: str) -> str:
        allowed = {"assignment", "exam", "reading", "other"}
        return v if v in allowed else "other"


class ScrapePayload(BaseModel):
    course_id: str = Field(..., max_length=64)
    platform: str = Field(..., max_length=64)
    url: str = Field(..., max_length=2048)
    raw_text: str = Field(..., max_length=15_000)   # hard cap — LLM context guard
    items: list[ScrapedItemRaw] = Field(default=[], max_length=100)

    @field_validator("platform")
    @classmethod
    def platform_must_be_known(cls, v: str) -> str:
        cleaned = v.lower().strip()
        if cleaned not in _PLATFORM_WHITELIST:
            return "unknown"
        return cleaned

    @field_validator("url")
    @classmethod
    def url_must_be_https(cls, v: str) -> str:
        if not re.match(r"^https?://", v):
            raise ValueError("url must begin with http(s)://")
        return v


class ScrapeValidationResponse(BaseModel):
    scrape_job_id: str
    status: str
    usefulness_score: float
    accepted_items: int
    rejected_items: int
    merged_obligations: int
    message: str
