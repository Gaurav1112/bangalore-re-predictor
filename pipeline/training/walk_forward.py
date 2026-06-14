"""Walk-forward time-series splits for real estate price prediction.

k-fold cross-validation is invalid for time-series because it allows future
data to leak into training. Walk-forward ensures each fold only trains on
data that would have been available at prediction time.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterator

import pandas as pd


@dataclass
class WalkForwardFold:
    fold_idx: int
    train_start: pd.Timestamp
    train_end: pd.Timestamp
    test_start: pd.Timestamp
    test_end: pd.Timestamp
    train_idx: pd.Index
    test_idx: pd.Index


def walk_forward_splits(
    df: pd.DataFrame,
    date_col: str,
    initial_train_months: int = 36,
    test_months: int = 6,
    gap_months: int = 1,
) -> Iterator[WalkForwardFold]:
    """Yield train/test index pairs for walk-forward validation.

    Args:
        df: DataFrame sorted by date_col (caller's responsibility).
        date_col: Name of the date column.
        initial_train_months: Minimum training window before first test fold.
        test_months: How many months each test window covers.
        gap_months: Gap between train end and test start to prevent leakage.
            Features from the final training month may not be fully settled
            (e.g., EPFO data arrives with a 6-week lag), so a 1-month buffer
            is the minimum safe gap.
    """
    df = df.sort_values(date_col).reset_index(drop=True)
    dates = pd.to_datetime(df[date_col])
    data_start = dates.min()
    data_end = dates.max()

    fold_idx = 0
    current_train_months = initial_train_months

    while True:
        train_end = data_start + pd.DateOffset(months=current_train_months)
        test_start = train_end + pd.DateOffset(months=gap_months)
        test_end = test_start + pd.DateOffset(months=test_months)

        if test_end > data_end:
            break

        train_mask = dates <= train_end
        test_mask = (dates >= test_start) & (dates < test_end)

        if train_mask.sum() < 100 or test_mask.sum() < 10:
            current_train_months += test_months
            continue

        yield WalkForwardFold(
            fold_idx=fold_idx,
            train_start=data_start,
            train_end=train_end,
            test_start=test_start,
            test_end=test_end,
            train_idx=df.index[train_mask],
            test_idx=df.index[test_mask],
        )

        fold_idx += 1
        current_train_months += test_months


def assert_no_leakage(fold: WalkForwardFold, df: pd.DataFrame, date_col: str) -> None:
    """Raise if any training date falls after test start (data leakage)."""
    train_dates = pd.to_datetime(df.loc[fold.train_idx, date_col])
    test_dates = pd.to_datetime(df.loc[fold.test_idx, date_col])
    max_train = train_dates.max()
    min_test = test_dates.min()
    if max_train >= min_test:
        raise ValueError(
            f"Fold {fold.fold_idx}: train max date {max_train} >= test min date {min_test}. "
            "Data leakage detected."
        )
