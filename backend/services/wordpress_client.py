import os
from html.parser import HTMLParser

import requests


# ── Internal helpers ───────────────────────────────────────────────────────

def _wp_base() -> str:
    val = os.getenv("WP_BASE_URL")
    if not val:
        raise RuntimeError("WP_BASE_URL is missing from .env")
    return val.rstrip("/")


def _wp_auth() -> tuple[str, str]:
    return (os.getenv("WP_USERNAME", ""), os.getenv("WP_APP_PASSWORD", ""))


def _session() -> requests.Session:
    """
    Build a requests Session.
    WP_BASE_URL can be a bare IP (e.g. http://127.0.0.1) so Python's
    resolver doesn't need to handle .local mDNS names.  WP_HOST_HEADER
    tells nginx which virtual-host to serve (e.g. cms-platform.local).
    In production both are usually the same value (your real domain).
    """
    session = requests.Session()
    http_user = os.getenv("WP_HTTP_USER", "")
    http_pass = os.getenv("WP_HTTP_PASS", "")
    if http_user and http_pass:
        base = _wp_base()
        scheme, rest = base.split("://", 1)
        session.base_url = f"{scheme}://{http_user}:{http_pass}@{rest}"
    else:
        session.base_url = _wp_base()
    host_header = os.getenv("WP_HOST_HEADER", "")
    if host_header:
        session.headers.update({"Host": host_header})
    return session


def _endpoint(content_type: str) -> str:
    return "posts" if content_type == "post" else "pages"


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def get_text(self) -> str:
        return " ".join(self._parts)


def _word_count(html: str) -> int:
    p = _TextExtractor()
    p.feed(html)
    return len(p.get_text().split())


# ── Media ──────────────────────────────────────────────────────────────────

def upload_image_to_wp(image_bytes: bytes, filename: str) -> int:
    session = _session()
    response = session.post(
        f"{session.base_url}/wp-json/wp/v2/media",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "image/png",
        },
        data=image_bytes,
        auth=_wp_auth(),
        timeout=60,
    )
    response.raise_for_status()
    return response.json()["id"]


# ── Taxonomy helpers (posts only) ──────────────────────────────────────────

def _get_or_create_term(taxonomy: str, name: str) -> int:
    """Return the WP term id for a category/tag, creating it if absent."""
    session = _session()
    slug = name.strip().lower().replace(" ", "-")
    # Look up
    r = session.get(
        f"{session.base_url}/wp-json/wp/v2/{taxonomy}",
        params={"slug": slug},
        auth=_wp_auth(),
        timeout=15,
    )
    r.raise_for_status()
    existing = r.json()
    if existing:
        return existing[0]["id"]
    # Create
    r2 = session.post(
        f"{session.base_url}/wp-json/wp/v2/{taxonomy}",
        json={"name": name.strip(), "slug": slug},
        auth=_wp_auth(),
        timeout=15,
    )
    r2.raise_for_status()
    return r2.json()["id"]


def _resolve_terms(taxonomy: str, csv_names: str | None) -> list[int]:
    if not csv_names:
        return []
    return [_get_or_create_term(taxonomy, n) for n in csv_names.split(",") if n.strip()]


# ── Content list ───────────────────────────────────────────────────────────

def get_all_content() -> list[dict]:
    """Return pages + posts for the Library and Audit views."""
    session  = _session()
    base     = session.base_url
    auth     = _wp_auth()
    params   = {"per_page": 100, "status": "publish,draft,pending,private"}
    results  = []

    for ct in ("pages", "posts"):
        r = session.get(
            f"{base}/wp-json/wp/v2/{ct}",
            params={**params, "_fields": "id,title,link,status,modified,meta"},
            auth=auth,
            timeout=30,
        )
        r.raise_for_status()
        for item in r.json():
            results.append({
                "id":               item["id"],
                "title":            item["title"]["rendered"],
                "link":             item["link"],
                "status":           item["status"],
                "modified":         item["modified"],
                "content_type":     ct.rstrip("s"),  # "page" / "post"
                "meta_description": (item.get("meta") or {}).get("_meta_description", ""),
            })

    return results


def get_content_with_body(content_type: str, item_id: int) -> dict:
    """Fetch a single item with full rendered content for audit scoring."""
    session = _session()
    ep = _endpoint(content_type)
    r = session.get(
        f"{session.base_url}/wp-json/wp/v2/{ep}/{item_id}",
        params={"context": "edit", "_fields": "id,title,content,meta,modified,link,status"},
        auth=_wp_auth(),
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    html = (data.get("content") or {}).get("rendered", "")
    return {
        "id":               data["id"],
        "title":            data["title"]["rendered"],
        "link":             data["link"],
        "status":           data["status"],
        "modified":         data["modified"],
        "content_type":     content_type,
        "meta_description": (data.get("meta") or {}).get("_meta_description", ""),
        "word_count":       _word_count(html),
        "body_snippet":     html[:600],
    }


# ── Update meta only ───────────────────────────────────────────────────────

def update_meta_description(content_type: str, item_id: int, meta_desc: str) -> None:
    session = _session()
    ep = _endpoint(content_type)
    r = session.post(
        f"{session.base_url}/wp-json/wp/v2/{ep}/{item_id}",
        json={"meta": {"_meta_description": meta_desc}},
        auth=_wp_auth(),
        timeout=30,
    )
    r.raise_for_status()


# ── Create / update helpers ────────────────────────────────────────────────

def _parse_wp_item(data: dict, content_type: str) -> dict:
    return {
        "wp_page_id":     data["id"],
        "wp_page_url":    data["link"],
        "wp_preview_url": data.get("preview_link") or f"{_wp_base()}/?p={data['id']}&preview=true",
        "wp_status":      data["status"],
        "content_type":   content_type,
        "title":          data["title"]["rendered"],
        "slug":           data.get("slug", ""),
    }


def _build_payload(content: dict, media_id: int | None, s3_url: str, status: str,
                   content_type: str, categories: str | None, tags: str | None) -> dict:
    payload: dict = {
        "status": status,
        "meta": {
            "_meta_description": content.get("meta_description", ""),
            "_s3_image_url": s3_url,
        },
    }
    if content.get("seo_title"):
        payload["title"] = content["seo_title"]
    if content.get("body_html"):
        payload["content"] = content["body_html"]
    if content.get("slug"):
        payload["slug"] = content["slug"]
    if media_id:
        payload["featured_media"] = media_id
    if content_type == "post":
        if categories:
            payload["categories"] = _resolve_terms("categories", categories)
        if tags:
            payload["tags"] = _resolve_terms("tags", tags)
    return payload


# ── Public API ─────────────────────────────────────────────────────────────

def create_post(content: dict, image_bytes: bytes, filename: str, s3_url: str,
                status: str = "draft", content_type: str = "page",
                categories: str | None = None, tags: str | None = None) -> dict:
    media_id = upload_image_to_wp(image_bytes, filename)
    session  = _session()
    ep       = _endpoint(content_type)
    payload  = _build_payload(content, media_id, s3_url, status, content_type, categories, tags)
    r = session.post(
        f"{session.base_url}/wp-json/wp/v2/{ep}",
        json=payload, auth=_wp_auth(), timeout=60,
    )
    r.raise_for_status()
    return _parse_wp_item(r.json(), content_type)


def update_page(page_id: int, content: dict, image_bytes: bytes, filename: str,
                s3_url: str, status: str = "draft", content_type: str = "page",
                categories: str | None = None, tags: str | None = None) -> dict:
    media_id = upload_image_to_wp(image_bytes, filename)
    session  = _session()
    ep       = _endpoint(content_type)
    payload  = _build_payload(content, media_id, s3_url, status, content_type, categories, tags)
    r = session.post(
        f"{session.base_url}/wp-json/wp/v2/{ep}/{page_id}",
        json=payload, auth=_wp_auth(), timeout=60,
    )
    r.raise_for_status()
    return _parse_wp_item(r.json(), content_type)


def append_section(page_id: int, section_html: str, status: str = "draft",
                   content_type: str = "page") -> dict:
    session = _session()
    ep = _endpoint(content_type)
    get_r = session.get(
        f"{session.base_url}/wp-json/wp/v2/{ep}/{page_id}",
        params={"context": "edit"},
        auth=_wp_auth(), timeout=30,
    )
    get_r.raise_for_status()
    existing_html = (get_r.json().get("content") or {}).get("raw", "")
    updated_html  = existing_html + "\n\n<!-- AI-generated section -->\n" + section_html
    patch_r = session.post(
        f"{session.base_url}/wp-json/wp/v2/{ep}/{page_id}",
        json={"content": updated_html, "status": status},
        auth=_wp_auth(), timeout=60,
    )
    patch_r.raise_for_status()
    return _parse_wp_item(patch_r.json(), content_type)


def publish_page(page_id: int, content_type: str = "page") -> dict:
    session = _session()
    ep = _endpoint(content_type)
    r = session.post(
        f"{session.base_url}/wp-json/wp/v2/{ep}/{page_id}",
        json={"status": "publish"},
        auth=_wp_auth(), timeout=30,
    )
    r.raise_for_status()
    return _parse_wp_item(r.json(), content_type)


# Legacy alias kept for backwards compat
def get_pages() -> list[dict]:
    return get_all_content()
