"""Airflow DAG: Weekly feature snapshot + model retrain (Sunday 2AM IST)."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

logger = logging.getLogger(__name__)

default_args = {
    "owner": "bangalore-re",
    "retries": 2,
    "retry_delay": timedelta(minutes=10),
    "email_on_failure": True,
    "email": [os.getenv("ALERT_EMAIL", "gaurav.kumar@loglass.co.jp")],
}

DATABASE_URL = os.environ["DATABASE_URL"]
MLFLOW_URI = os.environ.get("MLFLOW_TRACKING_URI", "http://mlflow:5000")


def task_fetch_macro(**_: object) -> None:
    from pipeline.features.macro_features import build_macro_features
    import json, redis
    r = redis.from_url(os.environ["REDIS_URL"])
    macro = build_macro_features()
    r.setex("macro_features", 86400 * 7, json.dumps(macro))
    logger.info("Macro features cached: %s", macro)


def task_compute_spatial(**_: object) -> None:
    from sqlalchemy import create_engine
    from pipeline.features.spatial_features import build_spatial_features
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        from sqlalchemy import text
        zones = [r[0] for r in conn.execute(text("SELECT h3_id FROM zones"))]
    df = build_spatial_features(engine, zones)
    # Store intermediate result for next task
    df.to_parquet("/tmp/spatial_features.parquet", index=False)


def task_write_snapshot(**context: object) -> None:
    import json, redis
    import pandas as pd
    from sqlalchemy import create_engine
    from pipeline.features.snapshot import write_snapshot

    engine = create_engine(DATABASE_URL)
    r = redis.from_url(os.environ["REDIS_URL"])

    spatial = pd.read_parquet("/tmp/spatial_features.parquet")
    macro_raw = r.get("macro_features")
    macro = json.loads(macro_raw) if macro_raw else {}

    for col, val in macro.items():
        spatial[col] = val

    snapshot_date = context["data_interval_end"].date()
    rows = write_snapshot(engine, spatial, snapshot_date)
    logger.info("Wrote %d feature rows for %s", rows, snapshot_date)


def task_retrain(**_: object) -> None:
    import pandas as pd
    from sqlalchemy import create_engine
    from pipeline.training.lgbm_train import run_full_training
    from pipeline.features.snapshot import load_features_as_of
    from datetime import date

    engine = create_engine(DATABASE_URL)

    # Load transactions joined with feature snapshots
    from sqlalchemy import text
    with engine.connect() as conn:
        df = pd.read_sql(
            text("""
                SELECT t.zone_h3, t.price_per_sqft, t.transaction_date AS snapshot_date
                FROM transactions t
                WHERE t.price_per_sqft > 0
                ORDER BY t.transaction_date
            """),
            conn,
        )

    # Enrich with feature snapshots as-of each transaction date
    from pipeline.features.snapshot import load_features_as_of
    as_of = date.today()
    features = load_features_as_of(engine, as_of)
    df = df.merge(features.drop(columns=["snapshot_date"], errors="ignore"),
                  on="zone_h3", how="left")

    if len(df) < 500:
        logger.warning("Only %d training rows — skipping retrain", len(df))
        return

    run_id = run_full_training(df, mlflow_uri=MLFLOW_URI)
    logger.info("Retrain complete. Promoted run: %s", run_id)


def task_invalidate_cache(**_: object) -> None:
    import redis
    r = redis.from_url(os.environ["REDIS_URL"])
    for key in r.scan_iter("heatmap:*"):
        r.delete(key)
    for key in r.scan_iter("predict:*"):
        r.delete(key)
    logger.info("Cache invalidated after retrain")


with DAG(
    dag_id="weekly_retrain",
    default_args=default_args,
    schedule="0 20 * * 0",  # Sunday 20:30 UTC = Sunday 2AM IST + 30min offset
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["ml", "retrain"],
) as dag:

    fetch_macro = PythonOperator(task_id="fetch_macro", python_callable=task_fetch_macro)
    compute_spatial = PythonOperator(task_id="compute_spatial", python_callable=task_compute_spatial)
    write_snap = PythonOperator(task_id="write_snapshot", python_callable=task_write_snapshot)
    retrain = PythonOperator(task_id="retrain", python_callable=task_retrain)
    invalidate = PythonOperator(task_id="invalidate_cache", python_callable=task_invalidate_cache)

    [fetch_macro, compute_spatial] >> write_snap >> retrain >> invalidate
