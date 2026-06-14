"""Unit tests for conformal predictor — coverage guarantee must hold."""
import numpy as np
import pytest
from pipeline.training.conformal import ConformalPredictor


def test_90_percent_coverage_guarantee():
    rng = np.random.default_rng(42)
    y_cal = rng.uniform(4000, 12000, 500)
    y_pred_log = np.log(y_cal * rng.uniform(0.85, 1.15, 500))

    cp = ConformalPredictor()
    cp.calibrate(y_cal, y_pred_log, alpha=0.10)

    y_test = rng.uniform(4000, 12000, 1000)
    y_test_log = np.log(y_test * rng.uniform(0.80, 1.20, 1000))
    coverage = cp.coverage_fraction(y_test, y_test_log)

    # Allow 2% tolerance below guaranteed 90%
    assert coverage >= 0.88, f"Coverage {coverage:.3f} < 0.88 — guarantee violated"


def test_serialisation_roundtrip():
    rng = np.random.default_rng(0)
    y = rng.uniform(5000, 10000, 200)
    cp = ConformalPredictor()
    cp.calibrate(y, np.log(y * 1.05), alpha=0.10)

    d = cp.to_dict()
    cp2 = ConformalPredictor.from_dict(d)
    assert abs(cp2.q_hat - cp.q_hat) < 1e-9


def test_predict_interval_before_calibrate_raises():
    cp = ConformalPredictor()
    with pytest.raises(RuntimeError, match="calibrate"):
        cp.predict_interval(np.array([8.0]))
