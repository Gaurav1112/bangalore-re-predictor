"""FastAPI router: SHAP explanation for a zone's prediction."""

from __future__ import annotations

import logging
from datetime import date

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.cache.redis_client import PREDICTION_TTL, cache_get, cache_set
from app.db.connection import get_engine
from app.models.lgbm_model import explain
from app.routers.predict import _prepare_features

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/explain", tags=["explain"])


class ShapSignal(BaseModel):
    feature: str
    label: str          # human-readable name
    shap_value: float
    direction: str      # "positive" | "negative"
    feature_value: float | None
    pts: float          # contribution in 0-100 score points


FEATURE_LABELS: dict[str, str] = {
    "metro_dist_m": "Metro walking distance",
    "epfo_growth_pct": "EPFO payroll growth",
    "flood_risk_score": "Flood risk zone",
    "nifty_it_12m_return_pct": "Nifty IT 12M return",
    "dmart_flag": "DMart nearby",
    "it_park_dist_m": "IT park distance",
    "viirs_ntl_growth_pct": "Nighttime light growth",
    "months_of_inventory": "Months of inventory",
    "ib_icse_dist_m": "IB/ICSE school distance",
    "gentrification_stage": "Gentrification stage",
    "microbrewery_count": "Microbrewery density",
    "redbus_freq_daily": "RedBus bus frequency",
    "guidance_value_delta_pct": "Guidance value revision",
    "zomato_density": "Restaurant density",
    "rental_yield_pct": "Rental yield compression",
}


class ExplainResponse(BaseModel):
    zone_h3: str
    zone_name: str | None
    top_signals: list[ShapSignal]


@router.get("/{zone_h3}", response_model=ExplainResponse)
async def get_explanation(
    zone_h3: str,
    top_n: int = Query(default=5, ge=1, le=15),
    as_of: date | None = Query(default=None),
) -> ExplainResponse:
    cache_key = f"explain:{zone_h3}:{as_of or 'latest'}:{top_n}"
    cached = cache_get(cache_key)
    if cached:
        return ExplainResponse(**cached)

    engine = get_engine()
    from sqlalchemy import text

    as_of_date = as_of or date.today()
    with engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT f.*, z.name AS zone_name
                FROM features f
                LEFT JOIN zones z ON z.h3_id = f.zone_h3
                WHERE f.zone_h3 = :zone_h3 AND f.snapshot_date <= :as_of
                ORDER BY f.snapshot_date DESC LIMIT 1
            """),
            {"zone_h3": zone_h3, "as_of": as_of_date},
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail=f"No data for zone {zone_h3}")

    zone_name = row["zone_name"]
    df = pd.DataFrame([dict(row)])
    feature_df = _prepare_features(df)

    raw_signals = explain(feature_df, top_n=top_n)

    signals = []
    for s in raw_signals:
        feat = s["feature"]
        signals.append(ShapSignal(
            feature=feat,
            label=FEATURE_LABELS.get(feat, feat.replace("_", " ").title()),
            shap_value=s["shap_value"],
            direction=s["direction"],
            feature_value=s.get("feature_value"),
            pts=round(abs(s["shap_value"]) * 100, 1),
        ))

    result = ExplainResponse(zone_h3=zone_h3, zone_name=zone_name, top_signals=signals)
    cache_set(cache_key, result.model_dump(), PREDICTION_TTL)
    return result
