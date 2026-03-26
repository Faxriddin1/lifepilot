"""
Redis caching for AI responses (SHA-256 key hashing).
"""

import hashlib
import json

from django.core.cache import cache


def make_cache_key(method: str, *args: object) -> str:
    """Create a deterministic cache key from method name and arguments."""
    raw = json.dumps([method, *args], sort_keys=True, default=str)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"ai:{method}:{digest}"


def get_cached(key: str) -> object | None:
    """Get a cached value by key."""
    return cache.get(key)


def set_cached(key: str, value: object, ttl: int) -> None:
    """Set a cached value if TTL > 0."""
    if ttl > 0:
        cache.set(key, value, ttl)
