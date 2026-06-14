"""FastAPI router: recent news articles tagged to a zone."""

from __future__ import annotations

import logging
from datetime import date, timedelta

import pandas as pd
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.cache.redis_client import NEWS_TTL, cache_get, cache_set
from app.db.connection import get_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/news", tags=["news"])


class NewsItem(BaseModel):
    headline: str
    url: str
    published_at: str | None
    signal_type: str
    sentiment: float
    days_ago: int | None


class NewsResponse(BaseModel):
    zone_h3: str
    zone_name: str | None
    items: list[NewsItem]
    total: int


@router.get("/{zone_h3}", response_model=NewsResponse)
async def get_zone_news(
    zone_h3: str,
    days: int = Query(default=30, ge=1, le=180),
    signal_type: str | None = Query(default=None),
) -> NewsResponse:
    cache_key = f"news:{zone_h3}:{days}:{signal_type}"
    cached = cache_get(cache_key)
    if cached:
        return NewsResponse(**cached)

    engine = get_engine()
    from sqlalchemy import text

    since = date.today() - timedelta(days=days)
    params: dict = {"zone_h3": zone_h3, "since": since}
    signal_filter = "AND signal_type = :signal_type" if signal_type else ""
    if signal_type:
        params["signal_type"] = signal_type

    with engine.connect() as conn:
        rows = conn.execute(
            text(f"""
                SELECT n.headline, n.url, n.published_at, n.signal_type, n.sentiment,
                       z.name AS zone_name,
                       EXTRACT(DAY FROM NOW() - n.published_at)::int AS days_ago
                FROM news n
                LEFT JOIN zones z ON z.h3_id = n.zone_h3
                WHERE n.zone_h3 = :zone_h3
                  AND (n.published_at IS NULL OR n.published_at >= :since)
                  {signal_filter}
                ORDER BY n.published_at DESC
                LIMIT 50
            """),
            params,
        ).mappings().all()

    zone_name = rows[0]["zone_name"] if rows else None
    items = [
        NewsItem(
            headline=r["headline"],
            url=r["url"],
            published_at=str(r["published_at"]) if r["published_at"] else None,
            signal_type=r["signal_type"] or "market",
            sentiment=float(r["sentiment"] or 0),
            days_ago=r.get("days_ago"),
        )
        for r in rows
    ]

    result = NewsResponse(zone_h3=zone_h3, zone_name=zone_name, items=items, total=len(items))
    cache_set(cache_key, result.model_dump(), NEWS_TTL)
    return result
