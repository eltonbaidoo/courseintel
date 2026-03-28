import uuid
from fastapi import APIRouter
from models.scraping import ScrapePayload, ScrapeValidationResponse
from agents import extension_validation, obligation_deadline, extension_orchestration, documentation_help

router = APIRouter(prefix="/extension", tags=["extension"])


@router.post("/scrape", response_model=ScrapeValidationResponse)
async def receive_scrape(payload: ScrapePayload):
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
async def orchestrate(platform: str, course_context: str = ""):
    return await extension_orchestration.run(platform, course_context)


@router.get("/help/{platform}")
async def get_help(platform: str, course_context: str = ""):
    return await documentation_help.run(platform, course_context)
