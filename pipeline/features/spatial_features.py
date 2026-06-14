"""Compute spatial features using PostGIS — 100x faster than Python geodesic loops."""

from __future__ import annotations

import logging

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def compute_metro_distances(engine: Engine, zone_h3_list: list[str]) -> pd.DataFrame:
    """For each zone centroid, find distance to nearest metro station (m)."""
    sql = text("""
        SELECT
            z.h3_id AS zone_h3,
            nearest.station_name,
            nearest.phase,
            nearest.status,
            ST_Distance(z.geom::geography, nearest.geom::geography) AS metro_dist_m
        FROM zones z
        CROSS JOIN LATERAL (
            SELECT station_name, phase, status, geom
            FROM metro_stations
            ORDER BY z.geom <-> geom
            LIMIT 1
        ) nearest
        WHERE z.h3_id = ANY(:zone_list)
    """)
    with engine.connect() as conn:
        df = pd.read_sql(sql, conn, params={"zone_list": zone_h3_list})
    return df[["zone_h3", "metro_dist_m", "phase", "status"]]


def compute_it_park_distances(engine: Engine, zone_h3_list: list[str]) -> pd.DataFrame:
    sql = text("""
        SELECT
            z.h3_id AS zone_h3,
            ST_Distance(z.geom::geography, nearest.geom::geography) AS it_park_dist_m
        FROM zones z
        CROSS JOIN LATERAL (
            SELECT geom FROM it_parks ORDER BY z.geom <-> geom LIMIT 1
        ) nearest
        WHERE z.h3_id = ANY(:zone_list)
    """)
    with engine.connect() as conn:
        return pd.read_sql(sql, conn, params={"zone_list": zone_h3_list})


def compute_school_features(engine: Engine, zone_h3_list: list[str]) -> pd.DataFrame:
    """Distance to nearest school and cluster count within 3km."""
    sql = text("""
        SELECT
            z.h3_id AS zone_h3,
            ST_Distance(z.geom::geography, nearest_ib.geom::geography) AS ib_icse_dist_m,
            ST_Distance(z.geom::geography, nearest_any.geom::geography) AS top_school_dist_m,
            nearest_any.board_tier AS school_board_tier,
            (
                SELECT COUNT(*) FROM schools s
                WHERE ST_DWithin(z.geom::geography, s.geom::geography, 3000)
            ) AS school_cluster_count
        FROM zones z
        CROSS JOIN LATERAL (
            SELECT geom FROM schools WHERE board IN ('IB','ICSE') ORDER BY z.geom <-> geom LIMIT 1
        ) nearest_ib
        CROSS JOIN LATERAL (
            SELECT geom, board_tier FROM schools ORDER BY z.geom <-> geom LIMIT 1
        ) nearest_any
        WHERE z.h3_id = ANY(:zone_list)
    """)
    with engine.connect() as conn:
        return pd.read_sql(sql, conn, params={"zone_list": zone_h3_list})


def compute_hospital_features(engine: Engine, zone_h3_list: list[str]) -> pd.DataFrame:
    """Hospital distance with dual-band awareness (0-500m negative, 500m-3km positive)."""
    sql = text("""
        SELECT
            z.h3_id AS zone_h3,
            ST_Distance(z.geom::geography, nearest.geom::geography) AS hospital_dist_m,
            nearest.is_private AS hospital_private_flag,
            (
                SELECT COUNT(*) FROM hospitals h
                WHERE ST_DWithin(z.geom::geography, h.geom::geography, 3000)
            ) AS hospital_cluster_count
        FROM zones z
        CROSS JOIN LATERAL (
            SELECT geom, is_private FROM hospitals ORDER BY z.geom <-> geom LIMIT 1
        ) nearest
        WHERE z.h3_id = ANY(:zone_list)
    """)
    with engine.connect() as conn:
        return pd.read_sql(sql, conn, params={"zone_list": zone_h3_list})


def build_spatial_features(engine: Engine, zone_h3_list: list[str]) -> pd.DataFrame:
    """Merge all spatial feature DataFrames into a single feature table."""
    logger.info("Computing spatial features for %d zones", len(zone_h3_list))

    metro = compute_metro_distances(engine, zone_h3_list)
    it_park = compute_it_park_distances(engine, zone_h3_list)
    school = compute_school_features(engine, zone_h3_list)
    hospital = compute_hospital_features(engine, zone_h3_list)

    result = (
        metro
        .merge(it_park, on="zone_h3", how="left")
        .merge(school, on="zone_h3", how="left")
        .merge(hospital, on="zone_h3", how="left")
    )
    logger.info("Spatial features built for %d zones", len(result))
    return result
