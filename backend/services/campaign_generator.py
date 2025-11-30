"""
Campaign generator — uses GPT-4o to produce a coherent set of
page + post briefs for a given campaign theme.
"""
from __future__ import annotations

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from services.theme_reader import format_for_prompt, get_theme_context
from services.content_generator import TONE_DESCRIPTIONS

_campaign_prompt = ChatPromptTemplate.from_template(
    """You are an expert digital content strategist for a specific brand.
{brand_context}

Tone for this campaign: {tone_description}

Create a complete content campaign with exactly {count} pieces of content for:
- Campaign name: {campaign_name}
- Theme / occasion: {theme}

Each brief should be distinct but linked: reference other items, share keywords,
use internal linking words in additional_notes.  Mix content types intelligently —
"page" for evergreen / core content, "post" for news, seasonal, or editorial content.

Return ONLY a valid JSON array of exactly {count} objects.  Each object must have:
- title: compelling page/post title
- topic: 2–3 sentence description of what this content covers
- content_type: "page" or "post"
- target_audience: who this is for
- additional_notes: specific content instructions, how it links to the other items in the campaign
- tags: comma-separated tag names for posts (empty string for pages)

Return ONLY the JSON array.  No markdown fences.  No explanation.
"""
)

_parser = JsonOutputParser()


async def generate_campaign_briefs(
    campaign_name: str,
    theme: str,
    count: int,
    tone: str,
) -> list[dict]:
    config       = get_theme_context()
    brand_ctx    = format_for_prompt(config)
    tone_desc    = TONE_DESCRIPTIONS.get(tone, TONE_DESCRIPTIONS["warm"])

    llm   = ChatOpenAI(model="gpt-4o", temperature=0.85)
    chain = _campaign_prompt | llm | _parser

    result = await chain.ainvoke({
        "brand_context":   brand_ctx,
        "tone_description": tone_desc,
        "campaign_name":   campaign_name,
        "theme":           theme,
        "count":           count,
    })
    # Ensure it's a list
    if isinstance(result, dict):
        result = list(result.values())
    return result[:count]
