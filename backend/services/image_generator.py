import os

import httpx
from openai import AsyncOpenAI


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def generate(prompt: str, slug: str) -> tuple[bytes, str]:
    response = await _get_client().images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1792x1024",
        quality="standard",
        n=1,
    )

    image_url = response.data[0].url
    if image_url is None:
        raise RuntimeError("Image URL missing from DALL-E response")

    async with httpx.AsyncClient(timeout=60) as http:
        resp = await http.get(image_url)
        resp.raise_for_status()

    return resp.content, f"{slug}-hero.png"
