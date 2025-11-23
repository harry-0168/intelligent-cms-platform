from typing import Literal, Optional

from pydantic import BaseModel


class PageBrief(BaseModel):
    title: str
    topic: str
    target_audience: str
    additional_notes: Optional[str] = None
    status: Literal["draft", "pending", "private", "publish"] = "draft"
    tone: Literal["warm", "formal", "casual", "playful", "luxurious"] = "warm"
    mode: Literal["create", "update", "add_section"] = "create"
    content_type: Literal["page", "post"] = "page"
    page_id: Optional[int] = None       # for update / add_section
    categories: Optional[str] = None   # comma-separated names, posts only
    tags: Optional[str] = None         # comma-separated names, posts only


class GeneratedPage(BaseModel):
    seo_title: str
    meta_description: str
    slug: str
    body_html: str
    image_prompt: str
    s3_image_url: str
    wordpress_post_url: str
    wordpress_post_id: int
    wp_status: str
    content_type: str = "page"
    wp_preview_url: Optional[str] = None


class CampaignRequest(BaseModel):
    campaign_name: str
    theme: str
    count: int = 5
    tone: Literal["warm", "formal", "casual", "playful", "luxurious"] = "warm"
    status: Literal["draft", "pending", "private", "publish"] = "draft"
