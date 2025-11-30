"""
Campaign Kit router — AI generates a coherent set of briefs.
"""
from fastapi import APIRouter, HTTPException

from models.schemas import CampaignRequest
from services.campaign_generator import generate_campaign_briefs

router = APIRouter(prefix="/campaign")


@router.post("/generate-briefs")
async def generate_briefs(req: CampaignRequest):
    """
    Ask GPT-4o to produce {count} linked content briefs for a campaign.
    Returns a list of PageBrief-compatible dicts ready for bulk execution.
    """
    try:
        briefs = await generate_campaign_briefs(
            campaign_name=req.campaign_name,
            theme=req.theme,
            count=req.count,
            tone=req.tone,
        )
        # Inject the status chosen by the user
        for b in briefs:
            b.setdefault("status", req.status)
            b.setdefault("mode", "create")
            b.setdefault("tone", req.tone)
        return {"briefs": briefs}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
