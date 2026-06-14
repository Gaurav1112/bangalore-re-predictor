"""Conformal prediction for guaranteed coverage intervals.

Unlike standard confidence intervals (which estimate coverage based on model
assumptions), conformal prediction provides a mathematical guarantee:
the true price will fall within the interval at least (1-alpha)% of the time,
regardless of whether the model is well-specified.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


class ConformalPredictor:
    """Split conformal predictor using normalized residuals.

    Calibrated on a held-out calibration set after model training.
    The quantile q_hat is computed once and reused at inference time.
    """

    q_hat: float
    alpha: float

    def calibrate(
        self,
        y_true: NDArray[np.float64],
        y_pred_log: NDArray[np.float64],
        alpha: float = 0.10,
    ) -> None:
        """Compute the quantile threshold from calibration residuals.

        Args:
            y_true: True prices in original scale (₹/sqft).
            y_pred_log: Model predictions in log scale (will be exp-transformed).
            alpha: Miscoverage rate. 0.10 → 90% coverage guarantee.
        """
        self.alpha = alpha
        y_pred = np.exp(y_pred_log)
        # Normalized absolute residuals: scale-invariant across price ranges
        scores = np.abs(y_true - y_pred) / y_pred
        n = len(scores)
        # The +1 in numerator is the finite-sample correction that guarantees coverage
        level = np.ceil((n + 1) * (1 - alpha)) / n
        level = min(level, 1.0)
        self.q_hat = float(np.quantile(scores, level))

    def predict_interval(
        self,
        y_pred_log: NDArray[np.float64],
    ) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
        """Return (lower, upper) price bounds in original ₹/sqft scale."""
        if not hasattr(self, "q_hat"):
            raise RuntimeError("Call calibrate() before predict_interval()")
        y_pred = np.exp(y_pred_log)
        lower = y_pred * (1.0 - self.q_hat)
        upper = y_pred * (1.0 + self.q_hat)
        return lower, upper

    def coverage_fraction(
        self,
        y_true: NDArray[np.float64],
        y_pred_log: NDArray[np.float64],
    ) -> float:
        """Empirical coverage on a test set. Should be >= (1 - alpha)."""
        lower, upper = self.predict_interval(y_pred_log)
        covered = (y_true >= lower) & (y_true <= upper)
        return float(covered.mean())

    def to_dict(self) -> dict:
        return {"q_hat": self.q_hat, "alpha": self.alpha}

    @classmethod
    def from_dict(cls, d: dict) -> "ConformalPredictor":
        cp = cls()
        cp.q_hat = d["q_hat"]
        cp.alpha = d["alpha"]
        return cp
