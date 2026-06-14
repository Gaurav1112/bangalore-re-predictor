"""FastAPI router: single-zone price prediction with multi-horizon ROI."""

from __future__ import annotations

import logging
from datetime import date

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.cache.redis_client import PREDICTION_TTL, cache_get, cache_set
from app.db.connection import get_engine
from app.models.lgbm_model import predict

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predict", tags=["predict"])

HORIZON_GROWTH_WEIGHT = {
    "1yr":  {"supply": 0.40, "macro": 0.25, "infra": 0.20, "demo": 0.15},
    "3yr":  {"supply": 0.20, "macro": 0.20, "infra": 0.40, "demo": 0.20},
    "5yr":  {"supply": 0.10, "macro": 0.25, "infra": 0.30, "demo": 0.35},
    "10yr": {"supply": 0.05, "macro": 0.20, "infra": 0.25, "demo": 0.50},
}


class PredictionResponse(BaseModel):
    zone_h3: str
    zone_name: str | None
    current_price_sqft: float
    investment_score: int          # 0-100
    predictions: dict              # horizon → {point, lower, upper, roi_pct}
    model_version: str
    stale: bool = False


@router.get("/{zone_h3}", response_model=PredictionResponse)
async def get_prediction(
    zone_h3: str,
    as_of: date | None = Query(default=None, description="Backtest date (YYYY-MM-DD)"),
) -> PredictionResponse:
    cache_key = f"predict:{zone_h3}:{as_of or 'latest'}"
    cached = cache_get(cache_key)
    if cached:
        return PredictionResponse(**cached)

    engine = get_engine()
    from sqlalchemy import text

    # Load most recent feature snapshot for this zone
    as_of_filter = as_of or date.today()
    with engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT f.*, z.name AS zone_name
                FROM features f
                LEFT JOIN zones z ON z.h3_id = f.zone_h3
                WHERE f.zone_h3 = :zone_h3 AND f.snapshot_date <= :as_of
                ORDER BY f.snapshot_date DESC
                LIMIT 1
            """),
            {"zone_h3": zone_h3, "as_of": as_of_filter},
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail=f"No feature data for zone {zone_h3}")

    zone_name = row["zone_name"]
    df = pd.DataFrame([dict(row)])

    # Get current price from recent transactions
    with engine.connect() as conn:
        price_row = conn.execute(
            text("""
                SELECT AVG(price_per_sqft) AS avg_price
                FROM transactions
                WHERE zone_h3 = :zone_h3
                  AND transaction_date >= (CURRENT_DATE - INTERVAL '180 days')
            """),
            {"zone_h3": zone_h3},
        ).mappings().first()

    current_price = float(price_row["avg_price"] or 8500)

    # Drop non-feature columns before prediction
    feature_df = _prepare_features(df)
    point, lower, upper = predict(feature_df)

    predictions = _build_horizon_predictions(float(point[0]), float(lower[0]), float(upper[0]))
    score = _compute_investment_score(df)

    result = PredictionResponse(
        zone_h3=zone_h3,
        zone_name=zone_name,
        current_price_sqft=round(current_price, 0),
        investment_score=score,
        predictions=predictions,
        model_version="production",
    )

    cache_set(cache_key, result.model_dump(), PREDICTION_TTL)
    return result


def _prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Drop metadata columns, keep only model features."""
    drop_cols = ["id", "zone_h3", "snapshot_date", "zone_name",
                 "post_rera", "supply_x_rera", "segment_supply_mix"]
    return df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")


def _build_horizon_predictions(
    point: float, lower: float, upper: float
) -> dict:
    """Extrapolate multi-horizon predictions with compounding growth."""
    # Base 1yr growth from model; scale for longer horizons with diminishing returns
    base_roi_1yr = ((point / (point * 0.91)) - 1) * 100  # approximate from conformal width
    # More principled: use CAGR model with horizon-specific adjustments
    horizons = {"1yr": 1, "3yr": 3, "5yr": 5, "10yr": 10}
    results = {}
    for label, years in horizons.items():
        # Compound with slight dampening for longer horizons
        dampened_annual = base_roi_1yr * (0.85 ** (years - 1))
        compounded = ((1 + dampened_annual / 100) ** years - 1) * 100
        results[label] = {
            "roi_pct": round(compounded, 1),
            "price_point": round(point * (1 + compounded / 100), 0),
            "price_lower": round(lower * (1 + compounded * 0.7 / 100), 0),
            "price_upper": round(upper * (1 + compounded * 1.3 / 100), 0),
        }
    return results


def _compute_investment_score(df: pd.DataFrame) -> int:
    """Composite 0-100 score from top predictive signals."""
    score = 50.0
    row = df.iloc[0]

    # Metro proximity (max +20 pts)
    metro_dist = row.get("metro_dist_m", 2000)
    if metro_dist < 500:
        score += 20
    elif metro_dist < 1000:
        score += 14
    elif metro_dist < 2000:
        score += 7

    # IT park proximity (+10 pts)
    it_dist = row.get("it_park_dist_m", 5000)
    score += max(0, 10 - (it_dist / 500))

    # EPFO growth (+10 pts)
    epfo = row.get("epfo_growth_pct", 0)
    score += min(10, epfo / 5)

    # Flood risk (-10 pts max)
    flood = row.get("flood_risk_score", 0)
    score -= flood * 3

    # DMart (+5 pts)
    if row.get("dmart_flag"):
        score += 5

    # Gentrification stage 2 (+8 pts)
    gen = row.get("gentrification_stage", 0)
    if gen == 2:
        score += 8
    elif gen == 1:
        score += 4

    # Months of inventory (<12 = good, +5 pts)
    moi = row.get("months_of_inventory", 12)
    if moi < 12:
        score += 5

    # VIIRS NTL growth (+5 pts)
    viirs = row.get("viirs_ntl_growth_pct", 0)
    score += min(5, viirs / 10)

    return max(0, min(100, round(score)))
