"""Pre-train locality embeddings using a 2-layer MLP.

LightGBM treats categorical variables as ordinal integers, which is wrong for
localities (HSR Layout and Whitefield are not "adjacent" in meaning just because
their encoded integers are adjacent). Pre-training a small MLP to predict price
from locality one-hot vectors produces a 32-dimensional embedding where
semantically similar localities (both IT-corridor zones) cluster together.

These 32 vectors are then used as numeric input features to LightGBM.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from numpy.typing import NDArray


class LocalityEmbeddingMLP(nn.Module):
    def __init__(self, n_localities: int, embed_dim: int = 32) -> None:
        super().__init__()
        self.embedding = nn.Embedding(n_localities, embed_dim)
        self.head = nn.Sequential(
            nn.Linear(embed_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

    def forward(self, locality_idx: torch.Tensor) -> torch.Tensor:
        emb = self.embedding(locality_idx)
        return self.head(emb).squeeze(-1)


class LocalityEmbedder:
    """Train MLP on (locality, price) pairs; extract embedding weights."""

    def __init__(self, embed_dim: int = 32, epochs: int = 50, lr: float = 1e-3) -> None:
        self.embed_dim = embed_dim
        self.epochs = epochs
        self.lr = lr
        self.locality_to_idx: dict[str, int] = {}
        self.embeddings_: NDArray[np.float64] | None = None

    def fit(self, localities: pd.Series, log_prices: pd.Series) -> "LocalityEmbedder":
        unique = sorted(localities.unique())
        self.locality_to_idx = {loc: i for i, loc in enumerate(unique)}
        n = len(unique)

        idx_tensor = torch.tensor(
            localities.map(self.locality_to_idx).values, dtype=torch.long
        )
        price_tensor = torch.tensor(log_prices.values, dtype=torch.float32)

        model = LocalityEmbeddingMLP(n, self.embed_dim)
        optimizer = torch.optim.Adam(model.parameters(), lr=self.lr)
        loss_fn = nn.MSELoss()

        model.train()
        for _ in range(self.epochs):
            optimizer.zero_grad()
            pred = model(idx_tensor)
            loss = loss_fn(pred, price_tensor)
            loss.backward()
            optimizer.step()

        # Extract the embedding weight matrix: shape (n_localities, embed_dim)
        self.embeddings_ = model.embedding.weight.detach().numpy()
        return self

    def transform(self, localities: pd.Series) -> NDArray[np.float64]:
        """Return (N, embed_dim) array; unknown localities get zero vector."""
        result = np.zeros((len(localities), self.embed_dim))
        for i, loc in enumerate(localities):
            idx = self.locality_to_idx.get(loc)
            if idx is not None and self.embeddings_ is not None:
                result[i] = self.embeddings_[idx]
        return result

    def embedding_columns(self) -> list[str]:
        return [f"locality_emb_{i}" for i in range(self.embed_dim)]
