"""Unit tests for walk-forward split logic."""
import pandas as pd
import pytest
from pipeline.training.walk_forward import walk_forward_splits, assert_no_leakage, WalkForwardFold


def make_df(n_months: int = 60) -> pd.DataFrame:
    dates = pd.date_range("2012-01-01", periods=n_months, freq="MS")
    return pd.DataFrame({"snapshot_date": dates.repeat(10), "price_per_sqft": 5000.0, "zone_h3": "z1"})


def test_no_temporal_overlap():
    df = make_df(60)
    for fold in walk_forward_splits(df, "snapshot_date", initial_train_months=24, test_months=6, gap_months=1):
        train_dates = pd.to_datetime(df.loc[fold.train_idx, "snapshot_date"])
        test_dates = pd.to_datetime(df.loc[fold.test_idx, "snapshot_date"])
        assert train_dates.max() < test_dates.min(), f"Fold {fold.fold_idx}: leakage detected"


def test_gap_enforced():
    df = make_df(60)
    for fold in walk_forward_splits(df, "snapshot_date", gap_months=1):
        train_dates = pd.to_datetime(df.loc[fold.train_idx, "snapshot_date"])
        test_dates = pd.to_datetime(df.loc[fold.test_idx, "snapshot_date"])
        gap_days = (test_dates.min() - train_dates.max()).days
        assert gap_days >= 28, f"Gap too small: {gap_days} days"


def test_assert_no_leakage_raises():
    df = make_df(60)
    fold = WalkForwardFold(
        fold_idx=0,
        train_start=pd.Timestamp("2012-01-01"),
        train_end=pd.Timestamp("2015-01-01"),
        test_start=pd.Timestamp("2014-06-01"),  # overlaps train
        test_end=pd.Timestamp("2015-01-01"),
        train_idx=df.index[:30],
        test_idx=df.index[25:35],  # overlapping range
    )
    with pytest.raises(ValueError, match="leakage"):
        assert_no_leakage(fold, df, "snapshot_date")
