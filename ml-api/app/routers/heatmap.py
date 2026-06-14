"""FastAPI router: city-wide heatmap data for all H3 zones."""

from __future__ import annotations

import logging
from datetime import date

import pandas as pd
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.cache.redis_client import HEATMAP_TTL, cache_get, cache_set
from app.db.connection import get_engine
from app.models.lgbm_model import predict
from app.routers.predict import _compute_investment_score, _prepare_features

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/heatmap", tags=["heatmap"])

VALID_HORIZONS = {"1yr", "3yr", "5yr", "10yr"}
HORIZON_YEARS = {"1yr": 1, "3yr": 3, "5yr": 5, "10yr": 10}


class ZoneCell(BaseModel):
    zone_h3: str
    zone_name: str | None
    lat: float
    lng: float
    investment_score: int
    predicted_roi_pct: float
    current_price_sqft: float


class HeatmapResponse(BaseModel):
    horizon: str
    as_of: str
    cells: list[ZoneCell]
    total_zones: int


@router.get("", response_model=HeatmapResponse)
async def get_heatmap(
    horizon: str = Query(default="3yr", description="1yr|3yr|5yr|10yr"),
    as_of: date | None = Query(default=None),
) -> HeatmapResponse:
    if horizon not in VALID_HORIZONS:
        horizon = "3yr"

    as_of_date = as_of or date.today()
    cache_key = f"heatmap:{horizon}:{as_of_date}"
    cached = cache_get(cache_key)
    if cached:
        return HeatmapResponse(**cached)

    engine = get_engine()
    from sqlalchemy import text

    # Load latest feature snapshot per zone
    with engine.connect() as conn:
        df = pd.read_sql(
            text("""
                SELECT DISTINCT ON (f.zone_h3)
                    f.*,
                    z.name AS zone_name,
                    ST_Y(z.geom) AS lat,
                    ST_X(z.geom) AS lng
                FROM features f
                JOIN zones z ON z.h3_id = f.zone_h3
                WHERE f.snapshot_date <= :as_of
                ORDER BY f.zone_h3, f.snapshot_date DESC
            """),
            conn,
            params={"as_of": as_of_date},
        )

    if df.empty:
        return HeatmapResponse(horizon=horizon, as_of=str(as_of_date), cells=[], total_zones=0)

    # Batch predict all zones
    meta_cols = ["zone_h3", "zone_name", "lat", "lng", "snapshot_date",
                 "post_rera", "supply_x_rera", "segment_supply_mix"]
    meta = df[[c for c in meta_cols if c in df.columns]].copy()
    feature_df = _prepare_features(df)
    point, lower, upper = predict(feature_df)

    years = HORIZON_YEARS[horizon]
    cells = []
    for i, row in meta.iterrows():
        score = _compute_investment_score(df.iloc[[i]])
        base_roi = ((point[i] / (point[i] * 0.91)) - 1) * 100
        compounded = ((1 + base_roi * (0.85 ** (years - 1)) / 100) ** years - 1) * 100

        current_price = float(df.iloc[i].get("rental_yield_pct", 0) or 8500)

        cells.append(ZoneCell(
            zone_h3=row["zone_h3"],
            zone_name=row.get("zone_name"),
            lat=float(row.get("lat", 12.97)),
            lng=float(row.get("lng", 77.59)),
            investment_score=score,
            predicted_roi_pct=round(compounded, 1),
            current_price_sqft=round(float(point[i]), 0),
        ))

    result = HeatmapResponse(
        horizon=horizon,
        as_of=str(as_of_date),
        cells=cells,
        total_zones=len(cells),
    )
    cache_set(cache_key, result.model_dump(), HEATMAP_TTL)
    return result
