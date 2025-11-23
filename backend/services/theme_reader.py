import json
from pathlib import Path


def get_theme_context() -> dict:
    config_path = Path(__file__).resolve().parents[2] / "wordpress-theme" / "theme-config.json"
    return json.loads(config_path.read_text())


def format_for_prompt(config: dict) -> str:
    brand = config["brand"]
    rules = config["content_rules"]
    seo = config["seo"]
    return f"""
BRAND CONTEXT:
- Brand name: {brand['name']}
- Brand tone: {brand['tone']}
- Target audience: {brand['audience']}

CONTENT RULES:
- Page structure: {', '.join(rules['page_structure'])}
- Target word count: {rules['word_count_target']} words
- Reading level: {rules['reading_level']}
- Always include: {', '.join(rules['always_include'])}
- Avoid: {', '.join(rules['avoid'])}

SEO RULES:
- Title max: {seo['title_max_chars']} characters
- Meta description max: {seo['meta_description_max_chars']} characters
"""
