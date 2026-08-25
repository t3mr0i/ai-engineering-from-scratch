# Open-Vocabulary Vision — CLIP.
# Canonical PyTorch two-tower fixture for phases/04-computer-vision/18-open-vocab-clip/docs/en.md.
# It trains only on seeded synthetic feature pairs; no checkpoint, tokenizer, or network is implied.
# The public API makes normalization, batch shape, and class-prompt contracts explicit.

from __future__ import annotations

import math
from numbers import Integral

import numpy as np
try:
    import torch
    from torch import nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ModuleNotFoundError:  # Keep the canonical command finite when no optional torch wheel is installed.
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


def _no_grad(function):
    return torch.no_grad()(function) if TORCH_AVAILABLE else function


def _positive_int(name: str, value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) < 1:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _matrix(name: str, value: object, *, rows: int | None = None, cols: int | None = None) -> torch.Tensor:
    if not isinstance(value, torch.Tensor) or value.ndim != 2 or value.shape[0] < 1 or value.shape[1] < 1:
        raise ValueError(f"{name} must be a non-empty 2-D tensor")
    if rows is not None and value.shape[0] != rows:
        raise ValueError(f"{name} has an unexpected row count")
    if cols is not None and value.shape[1] != cols:
        raise ValueError(f"{name} has an unexpected feature width")
    if not torch.isfinite(value).all() or torch.any(torch.linalg.vector_norm(value, dim=1) == 0):
        raise ValueError(f"{name} must contain finite non-zero rows")
    return value


def numpy_row_normalize(matrix: np.ndarray) -> np.ndarray:
    """Normalize non-zero feature rows for the executable NumPy Build-It path."""
    if not isinstance(matrix, np.ndarray) or matrix.ndim != 2 or matrix.shape[0] < 1 or matrix.shape[1] < 1:
        raise ValueError("matrix must be a non-empty 2-D array")
    if not np.isfinite(matrix).all():
        raise ValueError("matrix must contain finite values")
    values = matrix.astype(np.float64, copy=False)
    scale = np.max(np.abs(values), axis=1, keepdims=True)
    if np.any(scale == 0):
        raise ValueError("matrix rows must be non-zero")
    scaled = values / scale
    unit_norm = np.sqrt(np.sum(scaled * scaled, axis=1, keepdims=True))
    if not np.isfinite(unit_norm).all() or np.any(unit_norm == 0):
        raise ValueError("matrix rows must normalize to finite unit vectors")
    normalized = scaled / unit_norm
    if not np.isfinite(normalized).all():
        raise ValueError("normalized matrix must remain finite")
    return normalized


def numpy_similarity(image_embeddings: np.ndarray, text_embeddings: np.ndarray) -> np.ndarray:
    """Return cosine similarities between image and text rows."""
    image = numpy_row_normalize(image_embeddings)
    text = numpy_row_normalize(text_embeddings)
    if image.shape[1] != text.shape[1]:
        raise ValueError("image and text embedding widths must match")
    return image @ text.T


def _numpy_cross_entropy(logits: np.ndarray, targets: np.ndarray) -> float:
    with np.errstate(over="ignore", invalid="ignore", divide="ignore", under="ignore"):
        shifted = logits - logits.max(axis=1, keepdims=True)
        log_normalizer = np.log(np.exp(shifted).sum(axis=1)) + logits.max(axis=1)
    if np.isnan(shifted).any() or not np.isfinite(log_normalizer).all():
        raise ValueError("cross-entropy logits must remain numerically representable")
    with np.errstate(over="ignore", invalid="ignore", divide="ignore", under="ignore"):
        loss = np.mean(log_normalizer - logits[np.arange(len(targets)), targets])
    if not np.isfinite(loss):
        raise ValueError("cross-entropy loss must remain finite")
    return float(loss)


def numpy_clip_loss(image_embeddings: np.ndarray, text_embeddings: np.ndarray, logit_scale: float) -> float:
    """Compute symmetric paired cross-entropy from normalized NumPy rows."""
    image = numpy_row_normalize(image_embeddings)
    text = numpy_row_normalize(text_embeddings)
    if image.shape != text.shape or image.shape[0] < 2:
        raise ValueError("paired image/text matrices must have the same shape and at least two rows")
    if isinstance(logit_scale, bool) or not isinstance(logit_scale, (int, float)) or not math.isfinite(float(logit_scale)) or float(logit_scale) <= 0:
        raise ValueError("logit_scale must be finite and positive")
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        logits = float(logit_scale) * (image @ text.T)
    if not np.isfinite(logits).all():
        raise ValueError("scaled CLIP logits must remain finite")
    targets = np.arange(image.shape[0])
    return (_numpy_cross_entropy(logits, targets) + _numpy_cross_entropy(logits.T, targets)) / 2.0


def numpy_zero_shot_classify(image_features: np.ndarray, class_text_features: np.ndarray, class_names: list[str]) -> list[str]:
    """Route each image to the highest cosine-similarity class text row."""
    if not isinstance(class_names, list) or not class_names or not all(isinstance(name, str) and name for name in class_names):
        raise ValueError("class_names must be a non-empty list of strings")
    similarities = numpy_similarity(image_features, class_text_features)
    if similarities.shape[1] != len(class_names):
        raise ValueError("class_names must match the class-text row count")
    return [class_names[int(index)] for index in similarities.argmax(axis=1)]


class TwoTower(nn.Module):
    def __init__(self, img_in: int = 128, txt_in: int = 64, emb: int = 64) -> None:
        super().__init__()
        _require_torch()
        self.img_in = _positive_int("img_in", img_in)
        self.txt_in = _positive_int("txt_in", txt_in)
        self.emb = _positive_int("emb", emb)
        self.image_proj = nn.Sequential(nn.Linear(self.img_in, 128), nn.ReLU(), nn.Linear(128, self.emb))
        self.text_proj = nn.Sequential(nn.Linear(self.txt_in, 128), nn.ReLU(), nn.Linear(128, self.emb))
        self.logit_scale = nn.Parameter(torch.ones([]) * 2.6592)

    def encode_image(self, x: torch.Tensor) -> torch.Tensor:
        x = _matrix("image features", x, cols=self.img_in)
        return F.normalize(self.image_proj(x), dim=-1)

    def encode_text(self, x: torch.Tensor) -> torch.Tensor:
        x = _matrix("text features", x, cols=self.txt_in)
        return F.normalize(self.text_proj(x), dim=-1)

    def forward(self, img_feats: torch.Tensor, txt_feats: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        if not isinstance(img_feats, torch.Tensor) or not isinstance(txt_feats, torch.Tensor):
            raise ValueError("image and text features must be tensors")
        if img_feats.shape[0] != txt_feats.shape[0]:
            raise ValueError("paired image and text batches must have the same number of rows")
        image = self.encode_image(img_feats)
        text = self.encode_text(txt_feats)
        scale = self.logit_scale.exp()
        if not torch.isfinite(scale) or scale <= 0:
            raise ValueError("logit scale must remain finite and positive")
        return image, text, scale


def clip_loss(image_embeddings: torch.Tensor, text_embeddings: torch.Tensor, logit_scale: torch.Tensor | float) -> torch.Tensor:
    """Compute symmetric image-to-text and text-to-image cross-entropy."""
    _require_torch()
    image_embeddings = _matrix("image_embeddings", image_embeddings)
    text_embeddings = _matrix("text_embeddings", text_embeddings, rows=image_embeddings.shape[0], cols=image_embeddings.shape[1])
    if image_embeddings.shape[0] < 2:
        raise ValueError("clip_loss needs at least two paired examples")
    if isinstance(logit_scale, bool) or not isinstance(logit_scale, (torch.Tensor, float, int)):
        raise ValueError("logit_scale must be a finite positive scalar")
    scale = logit_scale if isinstance(logit_scale, torch.Tensor) else torch.tensor(float(logit_scale), device=image_embeddings.device)
    if scale.numel() != 1 or not torch.isfinite(scale).all() or torch.any(scale <= 0):
        raise ValueError("logit_scale must be a finite positive scalar")
    image_embeddings = F.normalize(image_embeddings, dim=-1)
    text_embeddings = F.normalize(text_embeddings, dim=-1)
    similarities = scale * (image_embeddings @ text_embeddings.T)
    if not torch.isfinite(similarities).all():
        raise ValueError("scaled CLIP logits must remain finite")
    targets = torch.arange(image_embeddings.shape[0], device=similarities.device)
    return (F.cross_entropy(similarities, targets) + F.cross_entropy(similarities.T, targets)) / 2


@_no_grad
def zero_shot_classify(model: TwoTower, image_feats: torch.Tensor, class_text_feats: torch.Tensor, class_names: list[str]) -> list[str]:
    _require_torch()
    if not isinstance(model, TwoTower):
        raise TypeError("model must be a TwoTower")
    image_feats = _matrix("image_feats", image_feats, cols=model.img_in)
    class_text_feats = _matrix("class_text_feats", class_text_feats, cols=model.txt_in)
    if not isinstance(class_names, list) or len(class_names) != class_text_feats.shape[0] or not all(isinstance(name, str) and name for name in class_names):
        raise ValueError("class_names must be a non-empty list matching class_text_feats")
    image = model.encode_image(image_feats)
    text = model.encode_text(class_text_feats)
    return [class_names[index] for index in (image @ text.T).argmax(dim=-1).tolist()]


def main() -> None:
    image = np.eye(4)
    text = np.eye(4)
    predictions = numpy_zero_shot_classify(image, text, [f"class_{index}" for index in range(4)])
    print(f"[NumPy Build-It] symmetric_clip_loss={numpy_clip_loss(image, text, 2.0):.3f} zero_shot={predictions}")
    if not TORCH_AVAILABLE:
        print("PyTorch is unavailable; optional Use-It path skipped cleanly.")
        return
    torch.manual_seed(0)
    model = TwoTower()
    print("[random batch sanity]")
    image = torch.randn(8, 128)
    text = torch.randn(8, 64)
    image_emb, text_emb, scale = model(image, text)
    print(f"  image={tuple(image_emb.shape)} text={tuple(text_emb.shape)} loss={clip_loss(image_emb, text_emb, scale).item():.3f} baseline~log(8)={math.log(8):.3f}")

    rng = torch.Generator().manual_seed(42)
    dim, classes = 32, 5
    prototypes = F.normalize(torch.randn(classes, dim, generator=rng), dim=-1)

    def sample(batch: int = 32) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        labels = torch.randint(0, classes, (batch,), generator=rng)
        images = torch.randn(batch, 128, generator=rng)
        texts = torch.randn(batch, 64, generator=rng)
        images[:, :dim] = prototypes[labels] + 0.1 * torch.randn(batch, dim, generator=rng)
        texts[:, :dim] = prototypes[labels] + 0.1 * torch.randn(batch, dim, generator=rng)
        return images, texts, labels

    optimizer = torch.optim.Adam(model.parameters(), lr=3e-3)
    for step in range(40):
        images, texts, _ = sample()
        i_emb, t_emb, scale = model(images, texts)
        loss = clip_loss(i_emb, t_emb, scale)
        optimizer.zero_grad(); loss.backward(); optimizer.step()
        if step % 10 == 0:
            print(f"  step {step:2d} loss={loss.item():.3f}")

    class_text = torch.zeros(classes, 64)
    class_text[:, :dim] = prototypes
    test_images, _, labels = sample(16)
    predictions = zero_shot_classify(model, test_images, class_text, [f"class_{i}" for i in range(classes)])
    correct = sum(prediction == f"class_{label}" for prediction, label in zip(predictions, labels.tolist()))
    print(f"[synthetic zero-shot] correct={correct}/16; this is a fixture check, not a pretrained-model accuracy claim")


if __name__ == "__main__":
    main()
