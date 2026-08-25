# Image Retrieval & Metric Learning.
# Canonical PyTorch fixture for phases/04-computer-vision/20-image-retrieval-metric/docs/en.md.
# It implements triplet loss, semi-hard mining, and exact in-memory recall@K without FAISS or sklearn.
# The vectors are synthetic; their scores are regression fixtures, not benchmark claims.

from __future__ import annotations

import math
from numbers import Integral, Real

import numpy as np

try:
    import torch
    from torch import nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ModuleNotFoundError:  # The bounded canonical command still explains the dependency state.
    torch = None  # type: ignore[assignment]
    F = None  # type: ignore[assignment]
    TORCH_AVAILABLE = False

    class _UnavailableModule:
        pass

    class _UnavailableNN:
        Module = _UnavailableModule

    nn = _UnavailableNN()  # type: ignore[assignment]


def _require_torch() -> None:
    if not TORCH_AVAILABLE:
        raise RuntimeError("PyTorch is unavailable; install the allowlisted optional dependency to run this fixture")


def _finite_nonnegative(name: str, value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, Real) or not math.isfinite(float(value)) or float(value) < 0:
        raise ValueError(f"{name} must be a finite non-negative real")
    return float(value)


def _embedding_matrix(name: str, value: object) -> torch.Tensor:
    if not isinstance(value, torch.Tensor) or value.ndim != 2 or value.shape[0] < 1 or value.shape[1] < 1:
        raise ValueError(f"{name} must be a non-empty 2-D tensor")
    if not torch.isfinite(value).all():
        raise ValueError(f"{name} must contain finite values")
    return value


def _labels(name: str, value: object, length: int) -> torch.Tensor:
    if not isinstance(value, torch.Tensor) or value.ndim != 1 or value.shape[0] != length:
        raise ValueError(f"{name} must be a one-dimensional tensor matching the batch")
    if value.dtype not in (torch.int32, torch.int64, torch.uint8):
        raise ValueError(f"{name} must contain integer class IDs")
    return value


def _numpy_embeddings(name: str, value: object) -> np.ndarray:
    if not isinstance(value, np.ndarray) or value.ndim != 2 or value.shape[0] < 1 or value.shape[1] < 1:
        raise ValueError(f"{name} must be a non-empty 2-D array")
    if not np.isfinite(value).all():
        raise ValueError(f"{name} must contain finite values")
    return value.astype(np.float64, copy=False)


def _numpy_labels(name: str, value: object, length: int) -> np.ndarray:
    labels = np.asarray(value)
    if labels.ndim != 1 or labels.shape[0] != length or labels.dtype.kind not in "iu":
        raise ValueError(f"{name} must be an integer vector matching the rows")
    return labels


def _numpy_normalize(value: np.ndarray, name: str) -> np.ndarray:
    value = _numpy_embeddings(name, value)
    scale = np.max(np.abs(value), axis=1, keepdims=True)
    if np.any(scale == 0):
        raise ValueError(f"{name} cannot contain zero rows")
    scaled = value / scale
    unit_norm = np.sqrt(np.sum(scaled * scaled, axis=1, keepdims=True))
    if not np.isfinite(unit_norm).all() or np.any(unit_norm == 0):
        raise ValueError(f"{name} cannot be normalized to finite unit rows")
    normalized = scaled / unit_norm
    if not np.isfinite(normalized).all():
        raise ValueError(f"normalized {name} must remain finite")
    return normalized


def _numpy_euclidean(left: np.ndarray, right: np.ndarray) -> np.ndarray:
    """Compute Euclidean distances with scaling, rejecting unrepresentable results."""
    if left.ndim < 1 or right.ndim < 1 or left.shape[-1] != right.shape[-1]:
        raise ValueError("distance operands must have the same feature width")
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        try:
            delta = left - right
        except ValueError as exc:
            raise ValueError("distance operands have incompatible batch shapes") from exc
    if not np.isfinite(delta).all():
        raise ValueError("pairwise distance exceeds the finite numeric range")
    scale = np.max(np.abs(delta), axis=-1, keepdims=True)
    scaled = np.divide(delta, scale, out=np.zeros_like(delta), where=scale > 0)
    unit_norm = np.sqrt(np.sum(scaled * scaled, axis=-1, keepdims=True))
    with np.errstate(over="ignore", invalid="ignore"):
        distance = np.squeeze(scale * unit_norm, axis=-1)
    if not np.isfinite(distance).all():
        raise ValueError("pairwise distance exceeds the finite numeric range")
    return distance


def numpy_triplet_loss(anchor: np.ndarray, positive: np.ndarray, negative: np.ndarray, margin: float = 0.2) -> float:
    """Compute the triplet hinge with NumPy before using the Torch module."""
    anchor = _numpy_embeddings("anchor", anchor)
    positive = _numpy_embeddings("positive", positive)
    negative = _numpy_embeddings("negative", negative)
    if anchor.shape != positive.shape or anchor.shape != negative.shape:
        raise ValueError("anchor, positive, and negative must have identical shapes")
    if isinstance(margin, bool) or not isinstance(margin, Real) or not math.isfinite(float(margin)) or float(margin) < 0:
        raise ValueError("margin must be finite and non-negative")
    d_ap = _numpy_euclidean(anchor, positive)
    d_an = _numpy_euclidean(anchor, negative)
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        hinge = np.maximum(d_ap - d_an + float(margin), 0)
        loss = hinge.mean()
    if not np.isfinite(loss):
        raise ValueError("triplet hinge must remain finite")
    return float(loss)


def numpy_semi_hard_negatives(emb: np.ndarray, labels: np.ndarray, margin: float = 0.2) -> tuple[np.ndarray, np.ndarray]:
    """Select same-label positives and semi-hard/fallback negatives deterministically."""
    emb = _numpy_embeddings("emb", emb)
    labels = _numpy_labels("labels", labels, emb.shape[0])
    if emb.shape[0] < 3 or np.unique(labels).size < 2:
        raise ValueError("mining needs at least three rows from at least two classes")
    if isinstance(margin, bool) or not isinstance(margin, Real) or not math.isfinite(float(margin)) or float(margin) < 0:
        raise ValueError("margin must be finite and non-negative")
    for label in np.unique(labels):
        if int(np.sum(labels == label)) < 2:
            raise ValueError("every class must have at least two examples for a positive pair")
    distances = _numpy_euclidean(emb[:, None, :], emb[None, :, :])
    positives = np.empty(emb.shape[0], dtype=np.int64)
    negatives = np.empty(emb.shape[0], dtype=np.int64)
    for index in range(emb.shape[0]):
        same = np.flatnonzero(labels == labels[index])
        same = same[same != index]
        positives[index] = int(same[np.argmin(distances[index, same])])
        different = np.flatnonzero(labels != labels[index])
        d_ap = distances[index, positives[index]]
        with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
            distance_gap = distances[index, different] - d_ap
        semi = different[(distance_gap > 0) & (distance_gap < float(margin))]
        candidates = semi if semi.size else different
        negatives[index] = int(candidates[np.argmin(distances[index, candidates])])
    return positives, negatives


def numpy_recall_at_k(
    query_emb: np.ndarray,
    gallery_emb: np.ndarray,
    query_labels: np.ndarray,
    gallery_labels: np.ndarray,
    k: int = 1,
) -> float:
    """Compute exact cosine Recall@K over a NumPy gallery."""
    query = _numpy_normalize(query_emb, "query_emb")
    gallery = _numpy_normalize(gallery_emb, "gallery_emb")
    if query.shape[1] != gallery.shape[1]:
        raise ValueError("query and gallery widths must match")
    if isinstance(k, bool) or not isinstance(k, Integral) or not 1 <= int(k) <= gallery.shape[0]:
        raise ValueError("k must satisfy 1 <= k <= number of gallery rows")
    query_labels = _numpy_labels("query_labels", query_labels, query.shape[0])
    gallery_labels = _numpy_labels("gallery_labels", gallery_labels, gallery.shape[0])
    ranking = np.argsort(-(query @ gallery.T), axis=1, kind="stable")[:, : int(k)]
    return float(np.mean(np.any(gallery_labels[ranking] == query_labels[:, None], axis=1)))


def triplet_loss(anchor: torch.Tensor, positive: torch.Tensor, negative: torch.Tensor, margin: float = 0.2) -> torch.Tensor:
    _require_torch()
    anchor = _embedding_matrix("anchor", anchor)
    positive = _embedding_matrix("positive", positive)
    negative = _embedding_matrix("negative", negative)
    if anchor.shape != positive.shape or anchor.shape != negative.shape:
        raise ValueError("anchor, positive, and negative must have identical shapes")
    margin = _finite_nonnegative("margin", margin)
    d_ap = torch.linalg.vector_norm(anchor - positive, dim=1)
    d_an = torch.linalg.vector_norm(anchor - negative, dim=1)
    if not torch.isfinite(torch.cat((d_ap, d_an))).all():
        raise ValueError("pairwise distance must remain finite")
    return F.relu(d_ap - d_an + margin).mean()


def semi_hard_negatives(emb: torch.Tensor, labels: torch.Tensor, margin: float = 0.2) -> tuple[torch.Tensor, torch.Tensor]:
    _require_torch()
    emb = _embedding_matrix("emb", emb)
    labels = _labels("labels", labels, emb.shape[0])
    margin = _finite_nonnegative("margin", margin)
    if emb.shape[0] < 3 or torch.unique(labels).numel() < 2:
        raise ValueError("mining needs at least three rows from at least two classes")
    for label in torch.unique(labels):
        if int((labels == label).sum()) < 2:
            raise ValueError("every class must have at least two examples for a positive pair")
    distances = torch.cdist(emb, emb)
    if not torch.isfinite(distances).all():
        raise ValueError("pairwise distances must remain finite")
    same_class = labels[:, None] == labels[None, :]
    positives = distances.masked_fill(~same_class, float("inf"))
    positives.fill_diagonal_(float("inf"))
    positive_indices = positives.argmin(dim=1)
    positive_distances = distances[torch.arange(emb.shape[0]), positive_indices].unsqueeze(1)
    candidates = distances.masked_fill(same_class, float("inf"))
    distance_gap = distances - positive_distances
    candidates = candidates.masked_fill(distance_gap <= 0, float("inf"))
    candidates = candidates.masked_fill(distance_gap >= margin, float("inf"))
    negative_indices = candidates.argmin(dim=1)
    missing = torch.isinf(candidates[torch.arange(emb.shape[0]), negative_indices])
    if missing.any():
        hardest = distances.masked_fill(same_class, float("inf"))
        negative_indices = torch.where(missing, hardest.argmin(dim=1), negative_indices)
    if torch.isinf(distances[torch.arange(emb.shape[0]), negative_indices]).any():
        raise ValueError("each anchor needs a negative-class example")
    return positive_indices, negative_indices


def recall_at_k(query_emb: torch.Tensor, gallery_emb: torch.Tensor, query_labels: torch.Tensor, gallery_labels: torch.Tensor, k: int = 1) -> float:
    _require_torch()
    query_emb = _embedding_matrix("query_emb", query_emb)
    gallery_emb = _embedding_matrix("gallery_emb", gallery_emb)
    if query_emb.shape[1] != gallery_emb.shape[1]:
        raise ValueError("query and gallery embedding widths must match")
    if isinstance(k, bool) or not isinstance(k, Integral) or not 1 <= int(k) <= gallery_emb.shape[0]:
        raise ValueError("k must satisfy 1 <= k <= number of gallery rows")
    query_labels = _labels("query_labels", query_labels, query_emb.shape[0])
    gallery_labels = _labels("gallery_labels", gallery_labels, gallery_emb.shape[0])
    query = F.normalize(query_emb, dim=-1)
    gallery = F.normalize(gallery_emb, dim=-1)
    top_k = (query @ gallery.T).topk(int(k), dim=-1).indices
    matches = (gallery_labels[top_k] == query_labels[:, None]).any(dim=-1)
    return float(matches.float().mean())


class Encoder(nn.Module):
    def __init__(self, in_dim: int = 128, emb_dim: int = 64) -> None:
        super().__init__()
        _require_torch()
        if isinstance(in_dim, bool) or not isinstance(in_dim, Integral) or int(in_dim) < 1:
            raise ValueError("in_dim must be a positive integer")
        if isinstance(emb_dim, bool) or not isinstance(emb_dim, Integral) or int(emb_dim) < 1:
            raise ValueError("emb_dim must be a positive integer")
        self.in_dim, self.emb_dim = int(in_dim), int(emb_dim)
        self.net = nn.Sequential(nn.Linear(self.in_dim, 128), nn.ReLU(), nn.Linear(128, self.emb_dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = _embedding_matrix("encoder input", x)
        if x.shape[1] != self.in_dim:
            raise ValueError("encoder input width does not match in_dim")
        return F.normalize(self.net(x), dim=-1)


def main() -> None:
    emb = np.asarray([[0.01, 0.0], [0.1, 0.0], [1.0, 0.0], [1.1, 0.0]], dtype=np.float64)
    labels = np.asarray([0, 0, 1, 1], dtype=np.int64)
    positive, negative = numpy_semi_hard_negatives(emb, labels, margin=1.0)
    recall = numpy_recall_at_k(emb[:2] + 0.01, emb, labels[:2], labels, k=1)
    print(
        f"[NumPy Build-It] triplet={numpy_triplet_loss(emb[:1], emb[1:2], emb[2:3]):.3f} "
        f"mined_pairs={list(zip(positive.tolist(), negative.tolist()))} recall@1={recall:.3f}"
    )
    if not TORCH_AVAILABLE:
        print("PyTorch is unavailable; optional Use-It path skipped cleanly.")
        return
    torch.manual_seed(0)
    classes, dimension = 6, 128
    prototypes = F.normalize(torch.randn(classes, dimension), dim=-1)

    def sample(batch: int = 48) -> tuple[torch.Tensor, torch.Tensor]:
        labels = torch.randint(0, classes, (batch,))
        return prototypes[labels] + 0.15 * torch.randn(batch, dimension), labels

    encoder = Encoder(in_dim=dimension, emb_dim=64)
    optimizer = torch.optim.Adam(encoder.parameters(), lr=3e-3)
    for step in range(60):
        inputs, labels = sample()
        embeddings = encoder(inputs)
        positive, negative = semi_hard_negatives(embeddings, labels)
        loss = triplet_loss(embeddings, embeddings[positive], embeddings[negative])
        optimizer.zero_grad(); loss.backward(); optimizer.step()
        if step % 20 == 0:
            print(f"step {step:2d} triplet={loss.item():.4f}")
    encoder.eval()
    with torch.no_grad():
        gallery_x, gallery_y = sample(120)
        query_x, query_y = sample(24)
        gallery = encoder(gallery_x)
        query = encoder(query_x)
        for k in (1, 5, 10):
            print(f"recall@{k}: {recall_at_k(query, gallery, query_y, gallery_y, k):.3f}")


if __name__ == "__main__":
    main()
