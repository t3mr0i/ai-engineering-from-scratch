# Recommenders for phases/02-ml-fundamentals/19-recommender-systems/docs/en.md.
# Builds popularity, user-neighborhood, matrix-factorization, and ranking metrics.
# Canonical sources: https://arxiv.org/abs/1205.2618 and
# https://doi.org/10.1109/MC.2009.263.
# NumPy is the only dependency; all splits and updates are deterministic.

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np


def _interactions(values):
    matrix = np.asarray(values, dtype=float)
    if matrix.ndim != 2 or matrix.shape[0] == 0 or matrix.shape[1] == 0:
        raise ValueError("interactions must be a non-empty 2D user-item matrix")
    if not np.isfinite(matrix).all() or np.any(matrix < 0):
        raise ValueError("interactions must be finite and non-negative")
    return matrix


def _ranking_inputs(recommended, relevant, k):
    if not isinstance(k, (int, np.integer)) or k < 1:
        raise ValueError("k must be a positive integer")
    ranked = list(recommended)
    relevant_set = set(relevant)
    if len(set(ranked)) != len(ranked):
        raise ValueError("recommended item IDs must be unique and preserve rank")
    if any(not isinstance(item, (int, np.integer)) or item < 0 for item in ranked + list(relevant_set)):
        raise ValueError("item identifiers must be non-negative integers")
    return ranked[:k], relevant_set


def popularity_scores(interactions: np.ndarray) -> np.ndarray:
    matrix = _interactions(interactions)
    return (matrix > 0).sum(axis=0).astype(float)


def cosine_user_similarity(interactions: np.ndarray) -> np.ndarray:
    binary = (_interactions(interactions) > 0).astype(float)
    norms = np.linalg.norm(binary, axis=1)
    denominator = np.outer(norms, norms)
    similarities = np.divide(binary @ binary.T, denominator, out=np.zeros_like(denominator), where=denominator > 0)
    np.fill_diagonal(similarities, 0.0)
    return similarities


def neighborhood_scores(interactions: np.ndarray, user_index: int, *, min_overlap: int = 1) -> np.ndarray:
    matrix = (_interactions(interactions) > 0).astype(float)
    if not isinstance(user_index, (int, np.integer)) or not 0 <= user_index < matrix.shape[0]:
        raise IndexError("user_index out of range")
    if not isinstance(min_overlap, (int, np.integer)) or min_overlap < 1:
        raise ValueError("min_overlap must be a positive integer")
    similarity = cosine_user_similarity(matrix)[user_index]
    overlap = matrix @ matrix[user_index]
    similarity = np.where(overlap >= min_overlap, similarity, 0.0)
    denominator = np.abs(similarity).sum()
    scores = similarity @ matrix / denominator if denominator > 0 else popularity_scores(matrix)
    scores = np.asarray(scores, dtype=float)
    scores[matrix[user_index] > 0] = -np.inf
    return scores


def top_k(scores: Iterable[float] | np.ndarray, k: int) -> list[int]:
    array = np.asarray(scores, dtype=float)
    if array.ndim != 1 or array.size == 0 or np.isnan(array).any():
        raise ValueError("scores must be a non-empty one-dimensional array")
    if not isinstance(k, (int, np.integer)) or not 1 <= k <= len(array):
        raise ValueError("k must be between 1 and the number of scores")
    finite = np.flatnonzero(np.isfinite(array))
    ordered = finite[np.argsort(-array[finite], kind="stable")]
    return ordered[:k].tolist()


def precision_at_k(recommended: Iterable[int], relevant: set[int], k: int) -> float:
    ranked, relevant = _ranking_inputs(recommended, relevant, k)
    return len(set(ranked) & relevant) / k


def recall_at_k(recommended: Iterable[int], relevant: set[int], k: int) -> float:
    ranked, relevant = _ranking_inputs(recommended, relevant, k)
    if not relevant:
        return 0.0
    return len(set(ranked) & relevant) / len(relevant)


def ndcg_at_k(recommended: Iterable[int], relevant: set[int], k: int) -> float:
    ranked, relevant = _ranking_inputs(recommended, relevant, k)
    gain = sum(1.0 / np.log2(index + 2) for index, item in enumerate(ranked) if item in relevant)
    ideal = sum(1.0 / np.log2(index + 2) for index in range(min(k, len(relevant))))
    return float(gain / ideal) if ideal else 0.0


@dataclass(frozen=True)
class FactorModel:
    users: np.ndarray
    items: np.ndarray

    def scores(self, user_index: int) -> np.ndarray:
        if not isinstance(user_index, (int, np.integer)) or not 0 <= user_index < self.users.shape[0]:
            raise IndexError("user_index out of range")
        return self.users[user_index] @ self.items.T


def factorize(
    interactions: np.ndarray,
    *,
    factors: int = 3,
    epochs: int = 180,
    learning_rate: float = 0.04,
    regularization: float = 0.02,
    seed: int = 7,
) -> FactorModel:
    matrix = _interactions(interactions)
    if not isinstance(factors, (int, np.integer)) or factors <= 0 or not isinstance(epochs, (int, np.integer)) or epochs <= 0:
        raise ValueError("factors and epochs must be positive integers")
    if not np.isfinite(learning_rate) or learning_rate <= 0 or not np.isfinite(regularization) or regularization < 0:
        raise ValueError("learning_rate must be positive and regularization non-negative")
    rng = np.random.default_rng(seed)
    users = rng.normal(0.0, 0.1, size=(matrix.shape[0], factors))
    items = rng.normal(0.0, 0.1, size=(matrix.shape[1], factors))
    observed = np.argwhere(matrix > 0)
    if len(observed) == 0:
        raise ValueError("factorize requires at least one observed interaction")
    for _ in range(epochs):
        for user_index, item_index in observed[rng.permutation(len(observed))]:
            target = matrix[user_index, item_index]
            prediction = users[user_index] @ items[item_index]
            error = target - prediction
            old_user = users[user_index].copy()
            users[user_index] += learning_rate * (error * items[item_index] - regularization * users[user_index])
            items[item_index] += learning_rate * (error * old_user - regularization * items[item_index])
    return FactorModel(users, items)


def leave_one_out(interactions: np.ndarray) -> tuple[np.ndarray, dict[int, set[int]]]:
    matrix = (_interactions(interactions) > 0).astype(float)
    train = matrix.copy()
    held_out: dict[int, set[int]] = {}
    for user_index, row in enumerate(matrix):
        items = np.flatnonzero(row > 0)
        if len(items) >= 2:
            item = int(items[-1])
            train[user_index, item] = 0.0
            held_out[user_index] = {item}
    return train, held_out


def recommend(interactions: np.ndarray, user_index: int, *, method: str, k: int = 3) -> list[int]:
    matrix = _interactions(interactions)
    if not isinstance(user_index, (int, np.integer)) or not 0 <= user_index < matrix.shape[0]:
        raise IndexError("user_index out of range")
    if not isinstance(k, (int, np.integer)) or not 1 <= k <= matrix.shape[1]:
        raise ValueError("k must be between 1 and the number of items")
    if method not in {"popularity", "neighbors", "factors"}:
        raise ValueError(f"unknown method: {method}")
    if not np.any(matrix[user_index] > 0):
        scores = popularity_scores(matrix)
        return top_k(scores, k)
    if method == "popularity":
        scores = popularity_scores(matrix)
        scores[matrix[user_index] > 0] = -np.inf
    elif method == "neighbors":
        scores = neighborhood_scores(matrix, user_index)
    elif method == "factors":
        scores = factorize(matrix).scores(user_index)
        scores[matrix[user_index] > 0] = -np.inf
    return top_k(scores, k)


def main() -> None:
    interactions = np.array(
        [
            [1, 1, 0, 0, 1, 0, 0, 0],
            [1, 1, 1, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 1, 1, 0, 1, 0, 0],
            [1, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 1, 0, 1, 1, 1],
        ],
        dtype=float,
    )
    train, held_out = leave_one_out(interactions)
    print("Recommender systems demo — leave-one-out evaluation")
    for method in ("popularity", "neighbors", "factors"):
        metrics = []
        for user_index, relevant in held_out.items():
            ranked = recommend(train, user_index, method=method, k=3)
            metrics.append((recall_at_k(ranked, relevant, 3), ndcg_at_k(ranked, relevant, 3)))
        print(f"  {method:10s} recall@3={np.mean([m[0] for m in metrics]):.3f} ndcg@3={np.mean([m[1] for m in metrics]):.3f}")
    cold_start = popularity_scores(train)
    print("  cold-start fallback top-3:", top_k(cold_start, 3))


if __name__ == "__main__":
    main()
