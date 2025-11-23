from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from models.schemas import PageBrief
from services.theme_reader import format_for_prompt, get_theme_context

TONE_DESCRIPTIONS = {
    "warm":      "Warm, inviting, and heartfelt — like a letter from a friend who loves baking.",
    "formal":    "Professional, polished, and authoritative.",
    "casual":    "Relaxed, conversational, and approachable — like chatting with a regular.",
    "playful":   "Fun, energetic, with personality and a light touch of charm.",
    "luxurious": "Premium, sophisticated, aspirational — speak to discerning tastes.",
}

page_prompt = ChatPromptTemplate.from_template(
    """
You are an expert content writer for a specific brand. You MUST follow the brand rules exactly.

{brand_context}

Tone for this page: {tone_description}

Generate a complete web page for the following brief:
- Page title: {title}
- Topic: {topic}
- Target audience: {target_audience}
- Additional notes: {additional_notes}

Return ONLY a valid JSON object with these exact keys:
- seo_title: SEO title (max {seo_title_max} chars, include brand name)
- meta_description: meta description (max {meta_desc_max} chars)
- slug: URL slug (lowercase, hyphenated, no special chars)
- body_html: complete page body as HTML, with <h2>, <p>, and at least one <a class="btn btn--primary"> CTA button. Never use bare <a class="btn"> — always include btn--primary, btn--dark, or btn--outline as the modifier.
- image_prompt: detailed DALL-E prompt for the hero image. Must match this style: {image_style}

Return ONLY the JSON. No markdown fences. No explanation.
"""
)

section_prompt = ChatPromptTemplate.from_template(
    """
You are an expert content writer for a specific brand. You MUST follow the brand rules exactly.

{brand_context}

Tone: {tone_description}

Generate a single HTML section to append to an existing page:
- Section topic: {topic}
- Target audience: {target_audience}
- Additional notes: {additional_notes}

Return ONLY a valid JSON object with these exact keys:
- section_html: a self-contained HTML snippet (one or more <section>/<div> blocks with <h2>, <p>, optionally a <a class="btn btn--primary"> CTA). No <html>, <head>, or <body> tags.
- image_prompt: detailed DALL-E prompt for a section image matching this style: {image_style}

Return ONLY the JSON. No markdown fences. No explanation.
"""
)

parser = JsonOutputParser()


async def generate(brief: PageBrief) -> dict:
    config = get_theme_context()
    brand_context = format_for_prompt(config)
    tone_desc = TONE_DESCRIPTIONS.get(brief.tone, TONE_DESCRIPTIONS["warm"])

    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

    if brief.mode == "add_section":
        chain = section_prompt | llm | parser
        result = await chain.ainvoke(
            {
                "brand_context": brand_context,
                "tone_description": tone_desc,
                "topic": brief.topic,
                "target_audience": brief.target_audience,
                "additional_notes": brief.additional_notes or "None",
                "image_style": config["image_style"]["hero_image_style"],
            }
        )
        # Normalise to the same shape as a full page result
        return {
            "seo_title": brief.title,
            "meta_description": "",
            "slug": "",
            "body_html": result["section_html"],
            "image_prompt": result.get("image_prompt", ""),
        }

    chain = page_prompt | llm | parser
    return await chain.ainvoke(
        {
            "brand_context": brand_context,
            "tone_description": tone_desc,
            "title": brief.title,
            "topic": brief.topic,
            "target_audience": brief.target_audience,
            "additional_notes": brief.additional_notes or "None",
            "seo_title_max": config["seo"]["title_max_chars"],
            "meta_desc_max": config["seo"]["meta_description_max_chars"],
            "image_style": config["image_style"]["hero_image_style"],
        }
    )
