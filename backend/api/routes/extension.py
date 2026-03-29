import logging
import uuid
from fastapi import APIRouter, Depends
from api.deps import get_user_id
from models.scraping import ScrapePayload, ScrapeValidationResponse
from agents import extension_validation, extension_orchestration, documentation_help

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/extension", tags=["extension"])


@router.post("/scrape", response_model=ScrapeValidationResponse)
async def receive_scrape(
    payload: ScrapePayload,
    user_id: str = Depends(get_user_id),
):
    """
    Receive scraped grade/assignment data from the Chrome extension.
    Runs ExtensionValidationAgent to check usefulness and normalize items.
    Requires a valid Supabase JWT (same session as the web app).
    """
    logger.info(
        "Extension scrape received: user=%s platform=%s items=%d",
        user_id, payload.platform, len(payload.items),
    )

    validation = await extension_validation.run(
        raw_text=payload.raw_text,
        platform=payload.platform,
        items=[i.model_dump() for i in payload.items],
    )

    accepted = [i for i in validation.get("extracted_items", []) if i]
    rejected = len(payload.items) - len(accepted)

    merged = 0
    if validation.get("status") != "rejected" and accepted:
        merged = len(accepted)

    return ScrapeValidationResponse(
        scrape_job_id=str(uuid.uuid4()),
        status=validation.get("status", "rejected"),
        usefulness_score=validation.get("usefulness_score", 0.0),
        accepted_items=len(accepted),
        rejected_items=max(0, rejected),
        merged_obligations=merged,
        message=validation.get("reason", ""),
    )


@router.get("/orchestrate/{platform}")
async def orchestrate(
    platform: str,
    course_context: str = "",
    user_id: str = Depends(get_user_id),
):
    """Generate LMS-specific scraping instructions for the extension popup."""
    return await extension_orchestration.run(platform, course_context)


@router.get("/help/{platform}")
async def get_help(
    platform: str,
    course_context: str = "",
    user_id: str = Depends(get_user_id),
):
    """Return help card content for a given LMS platform."""
    return await documentation_help.run(platform, course_context)
