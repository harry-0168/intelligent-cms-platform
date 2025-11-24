from fastapi import APIRouter, HTTPException

from models.schemas import GeneratedPage, PageBrief
from services import content_generator, image_generator, s3_uploader, wordpress_client

router = APIRouter()


@router.post("/generate", response_model=GeneratedPage)
async def generate_page(brief: PageBrief) -> GeneratedPage:
    try:
        content = await content_generator.generate(brief)

        image_bytes, filename = await image_generator.generate(
            content["image_prompt"], content.get("slug") or "section"
        )
        s3_url = s3_uploader.upload(image_bytes, filename, folder="cms-hero-images")

        if brief.mode == "update" and brief.page_id:
            wp = wordpress_client.update_page(
                brief.page_id, content, image_bytes, filename, s3_url,
                brief.status, brief.content_type, brief.categories, brief.tags,
            )
        elif brief.mode == "add_section" and brief.page_id:
            wp = wordpress_client.append_section(
                brief.page_id, content["body_html"], brief.status, brief.content_type
            )
        else:
            wp = wordpress_client.create_post(
                content, image_bytes, filename, s3_url,
                brief.status, brief.content_type, brief.categories, brief.tags,
            )

        return GeneratedPage(
            seo_title=content["seo_title"],
            meta_description=content.get("meta_description", ""),
            slug=content.get("slug", ""),
            body_html=content["body_html"],
            image_prompt=content["image_prompt"],
            s3_image_url=s3_url,
            wordpress_post_url=wp["wp_page_url"],
            wordpress_post_id=wp["wp_page_id"],
            wp_status=wp["wp_status"],
            content_type=brief.content_type,
            wp_preview_url=wp.get("wp_preview_url"),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/pages")
async def list_content():
    """Return all WP pages + posts for the library and picker."""
    try:
        return wordpress_client.get_all_content()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/pages/{page_id}/publish")
async def publish_item(page_id: int, content_type: str = "page"):
    """Publish a draft/pending/private page or post."""
    try:
        return wordpress_client.publish_page(page_id, content_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
