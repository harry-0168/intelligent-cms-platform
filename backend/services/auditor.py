"""
Audit service – stale content detection + SEO scoring.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from services import wordpress_client


_STALE_DAYS = 90   # flag content not updated in 90+ days
_MIN_WORDS  = 300  # flag thin content


# ── Scoring ────────────────────────────────────────────────────────────────

def _days_since(date_str: str) -> int:
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).days
    except Exception:
        return 0


def _seo_score(item: dict) -> dict:
    title = item.get("title", "")
    meta  = item.get("meta_description", "")
    wc    = item.get("word_count", 0)
    issues: list[dict] = []
    score = 100

    # Title length
    if len(title) > 70:
        issues.append({"field": "title", "severity": "fail",
                        "msg": f"Title too long ({len(title)} chars, ideal ≤60)"})
        score -= 20
    elif len(title) > 60:
        issues.append({"field": "title", "severity": "warn",
                        "msg": f"Title slightly long ({len(title)} chars)"})
        score -= 8

    # Meta description
    if not meta:
        issues.append({"field": "meta", "severity": "fail", "msg": "No meta description"})
        score -= 30
    elif len(meta) < 50:
        issues.append({"field": "meta", "severity": "warn",
                        "msg": f"Meta too short ({len(meta)} chars, aim 50–160)"})
        score -= 15
    elif len(meta) > 160:
        issues.append({"field": "meta", "severity": "warn",
                        "msg": f"Meta too long ({len(meta)} chars, max 160)"})
        score -= 10

    # Word count
    if wc < 100:
        issues.append({"field": "content", "severity": "fail",
                        "msg": f"Thin content ({wc} words, aim 300+)"})
        score -= 25
    elif wc < _MIN_WORDS:
        issues.append({"field": "content", "severity": "warn",
                        "msg": f"Content could be longer ({wc} words)"})
        score -= 10

    score = max(0, score)
    grade = "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 50 else "F"
    return {"score": score, "grade": grade, "issues": issues}


# ── Public API ─────────────────────────────────────────────────────────────

def audit_all() -> dict:
    """
    Fetch every page + post, score them for SEO, flag stale ones.
    Returns  { items: [...], summary: { total, stale, failing, passing } }
    """
    raw_items = wordpress_client.get_all_content()
    enriched  = []

    for item in raw_items:
        days = _days_since(item.get("modified", ""))
        # Fetch word count (requires extra call with body)
        try:
            detail = wordpress_client.get_content_with_body(
                item["content_type"], item["id"]
            )
            wc = detail.get("word_count", 0)
        except Exception:
            wc = 0

        score_data = _seo_score({**item, "word_count": wc})
        enriched.append({
            **item,
            "word_count":  wc,
            "days_since":  days,
            "is_stale":    days >= _STALE_DAYS,
            "seo_score":   score_data["score"],
            "seo_grade":   score_data["grade"],
            "seo_issues":  score_data["issues"],
        })

    total   = len(enriched)
    stale   = sum(1 for i in enriched if i["is_stale"])
    failing = sum(1 for i in enriched if i["seo_grade"] == "F")
    passing = sum(1 for i in enriched if i["seo_grade"] in ("A", "B"))

    return {
        "items":   enriched,
        "summary": {"total": total, "stale": stale, "failing": failing, "passing": passing},
    }
