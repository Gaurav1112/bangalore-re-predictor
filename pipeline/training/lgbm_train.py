"""LightGBM training with walk-forward validation and MLflow tracking."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import lightgbm as lgb
import mlflow
import mlflow.lightgbm
import numpy as np
import pandas as pd
import shap
from sklearn.metrics import mean_absolute_percentage_error

from pipeline.training.conformal import ConformalPredictor
from pipeline.training.locality_embeddings import LocalityEmbedder
from pipeline.training.walk_forward import WalkForwardFold, assert_no_leakage, walk_forward_splits

logger = logging.getLogger(__name__)

LGBM_PARAMS: dict = {
    "objective": "regression",
    "metric": ["rmse", "mape"],
    "num_leaves": 63,
    "learning_rate": 0.05,
    "feature_fraction": 0.8,
    "bagging_fraction": 0.8,
    "bagging_freq": 5,
    "min_child_samples": 20,
    "lambda_l1": 0.1,
    "lambda_l2": 0.1,
    "verbose": -1,
}

# Features used for training (129 columns defined in schema + 32 locality embedding cols)
FEATURE_COLS: list[str] = [
    # A. Transport
    "metro_dist_m", "metro_phase", "prr_alignment", "kride_node_dist_m",
    "airport_metro", "redbus_freq_daily", "highway_dist_m", "orr_alignment",
    "airport_dist_km", "airport_noise_contour", "nh_onramp_dist_m",
    "railway_dist_m", "walkability_score", "feeder_bus_count", "commute_9am_min",
    "road_width_m", "brts_dist_m", "proposed_infra_count", "strr_alignment",
    # B. Employment
    "it_park_dist_m", "office_absorption_sqft", "epfo_growth_pct", "startup_density",
    "zomato_density", "cbd_commute_min", "gcc_announcement",
    # C. Environment
    "lake_dist_m", "lake_bod_mgl", "elevation_m", "flood_risk_score", "ndvi",
    "pm25_annual", "noise_db", "bwssb_coverage", "lst_celsius",
    # D. Commercial & Social
    "mall_dist_m", "dmart_flag", "grocery_score", "restaurant_density",
    "microbrewery_count", "coworking_seats", "gentrification_stage", "builder_tier",
    "gated_ratio_pct", "rwa_strength", "crime_rate_index", "street_lighting_pct",
    "google_trends_velocity", "days_on_market", "social_sentiment_score",
    # E. Education
    "top_school_dist_m", "school_board_tier", "school_cluster_count",
    "ib_icse_dist_m", "coaching_density", "eng_college_dist_m",
    # F. Healthcare
    "hospital_dist_m", "hospital_cluster_count", "hospital_private_flag",
    "primary_care_density",
    # G. Policy
    "fsi_allowed", "bbmp_expansion", "rera_flag", "akrama_sakrama",
    "guidance_value_delta_pct",
    # H. Macro
    "rbi_repo_rate", "home_loan_rate", "emi_affordability_idx",
    "housing_credit_yoy_pct", "usd_inr_3m_avg", "nri_deposit_inflow_bn",
    "nifty_it_12m_return_pct", "nifty_it_pe", "pe_re_invest_blr_usd_m",
    "rental_yield_pct", "embassy_reit_yield_pct", "cpi_yoy_pct",
    # I. Supply
    "months_of_inventory", "launch_velocity", "price_cut_pct", "builder_delay_rate",
    "construction_cost_idx", "approval_pipeline", "prelaunch_resale_spread",
    "stalled_project_pct",
    # K. Utility
    "bescom_saidi_hr", "bwssb_supply_hrs", "water_tds", "telecom_tower_dist_m",
    "ev_charging_density",
    # L. Demographics & Alt
    "viirs_ntl_growth_pct", "linkedin_job_density", "gst_reg_growth_pct",
    "vahan_4w_growth_pct", "udise_enrollment_growth", "ward_pop_proxy_growth",
    "airbnb_density", "gmaps_review_velocity", "age_2535_pct", "migration_inflow_proxy",
    # Derived / structural
    "post_rera", "supply_x_rera",
]

CATEGORICAL_COLS: list[str] = ["metro_phase", "flood_risk_score", "gentrification_stage",
                                "builder_tier", "school_board_tier", "hospital_cluster_count"]


def build_feature_matrix(
    df: pd.DataFrame,
    embedder: LocalityEmbedder,
    locality_col: str = "zone_h3",
) -> pd.DataFrame:
    """Combine tabular features with locality embeddings."""
    tabular = df[FEATURE_COLS].copy()
    emb_array = embedder.transform(df[locality_col])
    emb_df = pd.DataFrame(emb_array, columns=embedder.embedding_columns(), index=df.index)
    return pd.concat([tabular, emb_df], axis=1)


def train_fold(
    df: pd.DataFrame,
    fold: WalkForwardFold,
    embedder: LocalityEmbedder,
    locality_col: str = "zone_h3",
) -> tuple[lgb.Booster, ConformalPredictor, float]:
    """Train LightGBM on one walk-forward fold and calibrate conformal predictor.

    Returns: (model, conformal_predictor, test_mape)
    """
    assert_no_leakage(fold, df, "snapshot_date")

    X = build_feature_matrix(df, embedder, locality_col)
    y = np.log(df["price_per_sqft"].values)  # log-transform target

    # Reserve last 20% of training period for conformal calibration
    n_train = len(fold.train_idx)
    cal_start = int(n_train * 0.8)
    train_pure_idx = fold.train_idx[:cal_start]
    cal_idx = fold.train_idx[cal_start:]

    X_train, y_train = X.loc[train_pure_idx], y[train_pure_idx]
    X_cal, y_cal = X.loc[cal_idx], y[cal_idx]
    X_test, y_test = X.loc[fold.test_idx], y[fold.test_idx]

    dtrain = lgb.Dataset(X_train, label=y_train, categorical_feature=CATEGORICAL_COLS)
    dval = lgb.Dataset(X_cal, label=y_cal, reference=dtrain)

    model = lgb.train(
        LGBM_PARAMS,
        dtrain,
        num_boost_round=500,
        valid_sets=[dval],
        callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(period=-1)],
    )

    # Calibrate conformal predictor on calibration set
    cp = ConformalPredictor()
    cp.calibrate(
        y_true=np.exp(y_cal),
        y_pred_log=model.predict(X_cal),
        alpha=0.10,
    )

    test_mape = mean_absolute_percentage_error(np.exp(y_test), np.exp(model.predict(X_test)))
    return model, cp, test_mape


def run_full_training(
    df: pd.DataFrame,
    mlflow_uri: str,
    experiment_name: str = "bangalore_re_predictor",
) -> str:
    """Run walk-forward training across all folds, log to MLflow, promote best model.

    Returns the MLflow run_id of the promoted model.
    """
    mlflow.set_tracking_uri(mlflow_uri)
    mlflow.set_experiment(experiment_name)

    locality_col = "zone_h3"
    embedder = LocalityEmbedder(embed_dim=32, epochs=50)
    log_prices = np.log(df["price_per_sqft"])
    embedder.fit(df[locality_col], pd.Series(log_prices, index=df.index))

    best_mape = float("inf")
    best_run_id: str | None = None

    for fold in walk_forward_splits(df, "snapshot_date"):
        with mlflow.start_run(run_name=f"fold_{fold.fold_idx}") as run:
            model, cp, mape = train_fold(df, fold, embedder, locality_col)

            mlflow.log_params(LGBM_PARAMS)
            mlflow.log_metrics({"mape": mape, "q_hat": cp.q_hat})
            mlflow.log_dict(cp.to_dict(), "conformal_params.json")
            mlflow.lightgbm.log_model(model, "model")

            logger.info("Fold %d: MAPE=%.3f", fold.fold_idx, mape)

            if mape < best_mape:
                best_mape = mape
                best_run_id = run.info.run_id

    if best_run_id:
        client = mlflow.tracking.MlflowClient()
        model_uri = f"runs:/{best_run_id}/model"
        mv = mlflow.register_model(model_uri, "bangalore_re_lgbm")
        client.set_registered_model_alias("bangalore_re_lgbm", "production", mv.version)
        logger.info("Promoted run %s (MAPE=%.3f) to production alias", best_run_id, best_mape)

    return best_run_id or ""
