"""
Audit router — SEO scoring, staleness detection, AI meta-fix.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import auditor, content_generator, wordpress_client
from models.schemas import PageBrief

router = APIRouter(prefix="/audit")


@router.get("")
def get_audit():
    """Fetch all content with SEO scores and staleness flags."""
    try:
        return auditor.audit_all()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


class MetaFixRequest(BaseModel):
    content_type: str = "page"
    title: str
    body_snippet: str


@router.post("/fix-meta/{item_id}")
async def fix_meta(item_id: int, req: MetaFixRequest):
    """
    Ask GPT-4o to write a new meta description for an item, then save it.
    """
    try:
        # Build a minimal brief just to reuse the theme context
        brief = PageBrief(
            title=req.title,
            topic=f"Improve meta description for: {req.title}",
            target_audience="website visitors",
            additional_notes=f"Existing content snippet:\n{req.body_snippet}",
            mode="create",
        )
        content = await content_generator.generate(brief)
        new_meta = content.get("meta_description", "")
        if new_meta:
            wordpress_client.update_meta_description(req.content_type, item_id, new_meta)
        return {"item_id": item_id, "new_meta_description": new_meta}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
