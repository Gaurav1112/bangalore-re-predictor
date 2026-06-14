"""Redis client for prediction and heatmap caching."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import redis

logger = logging.getLogger(__name__)

_client: redis.Redis | None = None

HEATMAP_TTL = 1800       # 30 minutes
PREDICTION_TTL = 21600   # 6 hours
NEWS_TTL = 3600          # 1 hour


def get_client() -> redis.Redis:
    global _client
    if _client is None:
        url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        _client = redis.from_url(url, decode_responses=True)
    return _client


def cache_get(key: str) -> Any | None:
    try:
        raw = get_client().get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        logger.warning("Redis GET failed for %s: %s", key, e)
        return None


def cache_set(key: str, value: Any, ttl: int) -> None:
    try:
        get_client().setex(key, ttl, json.dumps(value))
    except Exception as e:
        logger.warning("Redis SET failed for %s: %s", key, e)


def check_redis_health() -> bool:
    try:
        return get_client().ping()
    except Exception:
        return False
