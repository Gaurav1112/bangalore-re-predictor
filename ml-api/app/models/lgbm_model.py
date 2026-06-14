"""Load and serve the production LightGBM model from MLflow registry."""

from __future__ import annotations

import json
import logging
import os
from functools import lru_cache

import mlflow.lightgbm
import numpy as np
import pandas as pd
import shap

logger = logging.getLogger(__name__)

_model = None
_conformal_params: dict | None = None
_explainer: shap.TreeExplainer | None = None


def load_production_model() -> None:
    """Load model artifact tagged 'production' in MLflow model registry.

    Called once at API startup. Subsequent requests use the cached model.
    """
    global _model, _conformal_params, _explainer

    mlflow_uri = os.environ.get("MLFLOW_TRACKING_URI", "http://mlflow:5000")
    mlflow.set_tracking_uri(mlflow_uri)

    try:
        model_uri = "models:/bangalore_re_lgbm@production"
        _model = mlflow.lightgbm.load_model(model_uri)

        # Load conformal predictor parameters saved alongside the model
        client = mlflow.tracking.MlflowClient()
        versions = client.get_model_version_by_alias("bangalore_re_lgbm", "production")
        run_id = versions.run_id
        local_path = client.download_artifacts(run_id, "conformal_params.json", "/tmp")
        with open(local_path) as f:
            _conformal_params = json.load(f)

        _explainer = shap.TreeExplainer(_model)
        logger.info("Production model loaded from MLflow (run_id=%s)", run_id)

    except Exception as e:
        logger.warning("Could not load production model from MLflow: %s — using fallback", e)
        _model = None
        _conformal_params = {"q_hat": 0.18, "alpha": 0.10}


def predict(X: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return (point_pred_inr, lower_inr, upper_inr) arrays.

    All values are in ₹/sqft (original scale, not log).
    """
    if _model is None:
        # Fallback: return mock predictions (dev/test mode)
        n = len(X)
        base = np.random.uniform(5000, 12000, n)
        q = _conformal_params.get("q_hat", 0.18) if _conformal_params else 0.18
        return base, base * (1 - q), base * (1 + q)

    log_pred = _model.predict(X)
    point = np.exp(log_pred)
    q_hat = _conformal_params["q_hat"] if _conformal_params else 0.18
    lower = point * (1 - q_hat)
    upper = point * (1 + q_hat)
    return point, lower, upper


def explain(X_row: pd.DataFrame, top_n: int = 5) -> list[dict]:
    """Return top N SHAP feature contributions for a single zone row.

    Returns list of {feature, shap_value, direction} sorted by |shap_value|.
    """
    if _explainer is None or _model is None:
        return _mock_shap_values(X_row.columns.tolist(), top_n)

    shap_vals = _explainer.shap_values(X_row)
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[0]

    contributions = [
        {
            "feature": col,
            "shap_value": float(shap_vals[0][i]),
            "direction": "positive" if shap_vals[0][i] > 0 else "negative",
            "feature_value": float(X_row.iloc[0][col]) if col in X_row.columns else None,
        }
        for i, col in enumerate(X_row.columns)
    ]
    contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    return contributions[:top_n]


def _mock_shap_values(cols: list[str], top_n: int) -> list[dict]:
    mock = [
        {"feature": "metro_dist_m", "shap_value": 0.182, "direction": "positive", "feature_value": 480},
        {"feature": "epfo_growth_pct", "shap_value": 0.121, "direction": "positive", "feature_value": 41.2},
        {"feature": "flood_risk_score", "shap_value": -0.087, "direction": "negative", "feature_value": 2},
        {"feature": "nifty_it_12m_return_pct", "shap_value": 0.065, "direction": "positive", "feature_value": 36.0},
        {"feature": "dmart_flag", "shap_value": 0.043, "direction": "positive", "feature_value": 1},
    ]
    return mock[:top_n]
