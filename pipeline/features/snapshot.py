"""Write append-only feature snapshots to the features table.

The features table is NEVER updated in place — every week a new row is
appended per zone with the current snapshot_date. This is the foundation
of honest backtesting: training data can be filtered to snapshot_date <=
train_end_date, so no future information leaks into historical models.
"""

from __future__ import annotations

import logging
from datetime import date

import pandas as pd
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def write_snapshot(engine: Engine, features_df: pd.DataFrame, snapshot_date: date) -> int:
    """Append feature rows for all zones at the given snapshot date.

    Args:
        engine: SQLAlchemy engine connected to the PostgreSQL database.
        features_df: One row per zone_h3 with all 129 feature columns populated.
        snapshot_date: The date this snapshot represents.

    Returns:
        Number of rows written.
    """
    if "zone_h3" not in features_df.columns:
        raise ValueError("features_df must have a 'zone_h3' column")

    features_df = features_df.copy()
    features_df["snapshot_date"] = snapshot_date

    # Validate: no future dates allowed (prevents accidental leakage)
    if snapshot_date > date.today():
        raise ValueError(f"snapshot_date {snapshot_date} is in the future — refusing to write")

    # Check for duplicates in incoming data
    if features_df["zone_h3"].duplicated().any():
        raise ValueError("features_df contains duplicate zone_h3 values")

    rows_before = _count_rows(engine, snapshot_date)

    features_df.to_sql(
        "features",
        engine,
        if_exists="append",
        index=False,
        method="multi",
    )

    rows_written = _count_rows(engine, snapshot_date) - rows_before
    logger.info("Snapshot %s: wrote %d rows", snapshot_date, rows_written)
    return rows_written


def _count_rows(engine: Engine, snapshot_date: date) -> int:
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT COUNT(*) FROM features WHERE snapshot_date = :d"),
            {"d": snapshot_date},
        )
        return result.scalar() or 0


def load_features_as_of(engine: Engine, as_of_date: date) -> pd.DataFrame:
    """Load the most recent feature snapshot per zone up to as_of_date.

    Used during training to ensure a model trained on data up to 2018-12-31
    only sees feature values that were known at that point.
    """
    sql = text("""
        SELECT DISTINCT ON (zone_h3) *
        FROM features
        WHERE snapshot_date <= :as_of
        ORDER BY zone_h3, snapshot_date DESC
    """)
    with engine.connect() as conn:
        df = pd.read_sql(sql, conn, params={"as_of": as_of_date})
    logger.info("Loaded %d zone feature rows as of %s", len(df), as_of_date)
    return df
