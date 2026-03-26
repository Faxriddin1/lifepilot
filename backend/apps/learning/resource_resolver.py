"""
Resource Resolver — finds real URLs for AI-generated resource_query values.
Pipeline: YouTube Data API → Serper.dev → query_only fallback.
Both API keys are optional — if missing, returns query_only.
"""

import hashlib
import logging
import os

import requests
from django.core.cache import cache

logger = logging.getLogger("learning")

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
SERPER_API_KEY = os.environ.get("SERPER_API_KEY", "")

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
SERPER_SEARCH_URL = "https://google.serper.dev/search"

EMPTY_RESULT = {
    "url": "",
    "title": "",
    "source": "query_only",
    "thumbnail": None,
}


def resolve_resource(query: str, task_type: str = "video", locale: str = "en") -> dict:
    """
    Find a real resource URL for a search query.

    Returns: {"url", "title", "source": youtube|serper|query_only, "thumbnail"}
    Results are cached in Redis for 30 days.
    """
    if not query:
        return EMPTY_RESULT

    # Check cache
    cache_key = f"resource:{hashlib.sha256(f'{query}:{task_type}:{locale}'.encode()).hexdigest()[:16]}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    result = EMPTY_RESULT

    # Step 1: YouTube (for video/article/practice)
    if YOUTUBE_API_KEY and task_type in ("video", "article", "practice"):
        yt = _search_youtube(query, locale)
        if yt:
            result = yt

    # Step 2: Serper fallback
    if result["source"] == "query_only" and SERPER_API_KEY:
        serper = _search_serper(query, locale)
        if serper:
            result = serper

    # Cache successful results for 30 days
    if result["source"] != "query_only":
        cache.set(cache_key, result, 60 * 60 * 24 * 30)

    return result


def _search_youtube(query: str, locale: str = "en") -> dict | None:
    """
    YouTube Data API v3 search.
    Quota: 100 units/call, 10K units/day free = ~100 searches/day.
    """
    try:
        lang_map = {"ru": "ru", "en": "en", "uz": "en", "uz-cyr": "ru"}
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": 1,
            "relevanceLanguage": lang_map.get(locale, "en"),
            "videoEmbeddable": "true",
            "key": YOUTUBE_API_KEY,
        }
        resp = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if items:
            item = items[0]
            video_id = item["id"]["videoId"]
            snippet = item["snippet"]
            return {
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "title": snippet.get("title", ""),
                "source": "youtube",
                "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url"),
            }
    except Exception as e:
        logger.warning("YouTube search failed for '%s': %s", query, e)
    return None


def _search_serper(query: str, locale: str = "en") -> dict | None:
    """
    Serper.dev Google Search API.
    Cost: ~$0.001/search (2500 free, then $1/1000).
    """
    try:
        gl_map = {"en": "us", "ru": "ru", "uz": "uz", "uz-cyr": "uz"}
        headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
        payload = {"q": query, "num": 1, "gl": gl_map.get(locale, "us")}
        resp = requests.post(SERPER_SEARCH_URL, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        organic = resp.json().get("organic", [])
        if organic:
            return {
                "url": organic[0].get("link", ""),
                "title": organic[0].get("title", ""),
                "source": "serper",
                "thumbnail": None,
            }
    except Exception as e:
        logger.warning("Serper search failed for '%s': %s", query, e)
    return None
