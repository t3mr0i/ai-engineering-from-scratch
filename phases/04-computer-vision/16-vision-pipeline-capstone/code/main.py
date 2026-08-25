# Build a Complete Vision Pipeline — Capstone.
# Canonical stdlib/NumPy/PyTorch implementation for phases/04-computer-vision/16-vision-pipeline-capstone/docs/en.md.
# Dataclasses provide the response contract; the detector and classifier are deterministic local stand-ins.
# No web server, image decoder, model download, or non-allowlisted package is required for the demo.

from __future__ import annotations

from dataclasses import dataclass
import json
import math
from numbers import Integral, Real
import time
from typing import Any, Sequence

import numpy as np
try:
    import torch
    from torch import nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ModuleNotFoundError:  # The canonical command reports this optional dependency cleanly.
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


def _finite_float(name: str, value: object, *, low: float | None = None, high: float | None = None) -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a finite real number")
    value = float(value)
    if not math.isfinite(value) or (low is not None and value < low) or (high is not None and value > high):
        raise ValueError(f"{name} is outside its finite range")
    return value


def _nonnegative_int(name: str, value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) < 0:
        raise ValueError(f"{name} must be a non-negative integer")
    return int(value)


@dataclass(frozen=True)
class Detection:
    box: tuple[float, float, float, float]
    score: float
    class_id: int

    def __post_init__(self) -> None:
        if len(self.box) != 4:
            raise ValueError("box must contain x1, y1, x2, y2")
        box = tuple(_finite_float("box coordinate", coordinate, low=0.0) for coordinate in self.box)
        if box[2] <= box[0] or box[3] <= box[1]:
            raise ValueError("box must have positive width and height")
        object.__setattr__(self, "box", box)
        object.__setattr__(self, "score", _finite_float("score", self.score, low=0.0, high=1.0))
        object.__setattr__(self, "class_id", _nonnegative_int("class_id", self.class_id))

    def to_dict(self) -> dict[str, Any]:
        return {"box": list(self.box), "score": self.score, "class_id": self.class_id}


@dataclass(frozen=True)
class Classification:
    detection_index: int
    class_id: int
    class_name: str
    score: float

    def __post_init__(self) -> None:
        object.__setattr__(self, "detection_index", _nonnegative_int("detection_index", self.detection_index))
        object.__setattr__(self, "class_id", _nonnegative_int("class_id", self.class_id))
        if not isinstance(self.class_name, str) or not self.class_name:
            raise ValueError("class_name must be a non-empty string")
        object.__setattr__(self, "score", _finite_float("score", self.score, low=0.0, high=1.0))

    def to_dict(self) -> dict[str, Any]:
        return {
            "detection_index": self.detection_index,
            "class_id": self.class_id,
            "class_name": self.class_name,
            "score": self.score,
        }


@dataclass(frozen=True)
class PipelineResult:
    image_id: str
    detections: list[Detection]
    classifications: list[Classification]
    inference_ms: float

    def __post_init__(self) -> None:
        if not isinstance(self.image_id, str) or not self.image_id:
            raise ValueError("image_id must be a non-empty string")
        if not isinstance(self.detections, list) or not all(isinstance(item, Detection) for item in self.detections):
            raise ValueError("detections must be a list of Detection records")
        if not isinstance(self.classifications, list) or not all(isinstance(item, Classification) for item in self.classifications):
            raise ValueError("classifications must be a list of Classification records")
        object.__setattr__(self, "inference_ms", _finite_float("inference_ms", self.inference_ms, low=0.0))

    def to_dict(self) -> dict[str, Any]:
        return {
            "image_id": self.image_id,
            "detections": [item.to_dict() for item in self.detections],
            "classifications": [item.to_dict() for item in self.classifications],
            "inference_ms": self.inference_ms,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, sort_keys=True)


def numpy_preprocess(image: np.ndarray) -> np.ndarray:
    """Build-It preprocessing: convert an HWC image into finite CHW floats."""
    if not isinstance(image, np.ndarray) or image.ndim != 3 or image.shape[2] != 3 or min(image.shape[:2]) <= 0:
        raise ValueError("image must be a non-empty HxWx3 NumPy array")
    if image.dtype == np.uint8:
        return image.astype(np.float32).transpose(2, 0, 1) / 255.0
    if np.issubdtype(image.dtype, np.floating) and np.isfinite(image).all() and np.all((0 <= image) & (image <= 1)):
        return image.astype(np.float32, copy=False).transpose(2, 0, 1)
    raise ValueError("image must be uint8 or finite floating-point data in [0,1]")


def numpy_detect(image_chw: np.ndarray) -> list[Detection]:
    """Return the same three deterministic boxes as the optional Torch stub."""
    if not isinstance(image_chw, np.ndarray) or image_chw.ndim != 3 or image_chw.shape[0] != 3 or min(image_chw.shape[1:]) <= 0:
        raise ValueError("image_chw must be a non-empty (3,H,W) array")
    if not np.isfinite(image_chw).all() or np.any((image_chw < 0) | (image_chw > 1)):
        raise ValueError("image_chw must contain finite values in [0,1]")
    height, width = image_chw.shape[-2:]
    raw = (
        ((width * 0.1, height * 0.1, width * 0.4, height * 0.6), 0.92, 1),
        ((width * 0.5, height * 0.3, width * 0.9, height * 0.9), 0.85, 2),
        ((width * 0.2, height * 0.6, width * 0.45, height * 0.85), 0.71, 1),
    )
    return [Detection(tuple(box), score, class_id) for box, score, class_id in raw]


def numpy_classify_crop(crop: np.ndarray, num_classes: int = 10) -> tuple[int, float]:
    """Classify a crop by its three channel means; this is a transparent local stub."""
    if not isinstance(crop, np.ndarray) or crop.ndim != 3 or crop.shape[0] != 3 or min(crop.shape[1:]) <= 0:
        raise ValueError("crop must be a non-empty (3,H,W) array")
    if not np.isfinite(crop).all() or np.any((crop < 0) | (crop > 1)):
        raise ValueError("crop must contain finite values in [0,1]")
    if isinstance(num_classes, bool) or not isinstance(num_classes, Integral) or num_classes < 1:
        raise ValueError("num_classes must be a positive integer")
    logits = np.full(int(num_classes), -1.0, dtype=np.float64)
    logits[: min(3, int(num_classes))] = crop.mean(axis=(1, 2))
    shifted = logits - logits.max()
    probabilities = np.exp(shifted)
    probabilities /= probabilities.sum()
    class_id = int(np.argmax(probabilities))
    return class_id, float(probabilities[class_id])


def numpy_pipeline(
    image: np.ndarray,
    image_id: str = "anonymous",
    *,
    min_crop: int = 16,
    class_names: Sequence[str] | None = None,
) -> PipelineResult:
    """Run the complete offline pipeline without importing PyTorch."""
    if not isinstance(image_id, str) or not image_id:
        raise ValueError("image_id must be a non-empty string")
    if isinstance(min_crop, bool) or not isinstance(min_crop, Integral) or min_crop < 1:
        raise ValueError("min_crop must be a positive integer")
    names = tuple([f"class_{index}" for index in range(10)] if class_names is None else class_names)
    if not names or not all(isinstance(name, str) and name for name in names):
        raise ValueError("class_names must contain non-empty strings")
    image_chw = numpy_preprocess(image)
    height, width = image_chw.shape[-2:]
    detections = numpy_detect(image_chw)
    classifications: list[Classification] = []
    for index, detection in enumerate(detections):
        x1, y1, x2, y2 = detection.box
        ix1, iy1, ix2, iy2 = map(math.floor, (x1, y1, min(float(width), x2), min(float(height), y2)))
        if ix2 - ix1 < int(min_crop) or iy2 - iy1 < int(min_crop):
            continue
        crop = image_chw[:, iy1:iy2, ix1:ix2]
        class_id, score = numpy_classify_crop(crop, len(names))
        classifications.append(Classification(index, class_id, names[class_id], score))
    return PipelineResult(image_id, detections, classifications, 0.0)


class StubDetector(nn.Module):
    """Deterministic detector fixture; it exposes real box/score/label boundaries."""

    def __init__(self) -> None:
        super().__init__()
        _require_torch()
        self.dummy = nn.Parameter(torch.zeros(1))

    def forward(self, images: list[torch.Tensor]) -> list[dict[str, torch.Tensor]]:
        results = []
        for image in images:
            if image.ndim != 3 or image.shape[0] != 3 or min(image.shape[1:]) <= 0:
                raise ValueError("detector expects non-empty (3,H,W) tensors")
            height, width = image.shape[-2:]
            boxes = torch.tensor(
                [[width * 0.1, height * 0.1, width * 0.4, height * 0.6],
                 [width * 0.5, height * 0.3, width * 0.9, height * 0.9],
                 [width * 0.2, height * 0.6, width * 0.45, height * 0.85]],
                device=image.device, dtype=torch.float32,
            )
            results.append({
                "boxes": boxes,
                "scores": torch.tensor([0.92, 0.85, 0.71], device=image.device),
                "labels": torch.tensor([1, 2, 1], device=image.device, dtype=torch.long),
            })
        return results


class StubClassifier(nn.Module):
    def __init__(self, num_classes: int = 10) -> None:
        super().__init__()
        _require_torch()
        if isinstance(num_classes, bool) or not isinstance(num_classes, Integral) or num_classes < 1:
            raise ValueError("num_classes must be a positive integer")
        self.num_classes = int(num_classes)
        self.head = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(3, self.num_classes))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if x.ndim != 4 or x.shape[1] != 3 or min(x.shape[2:]) <= 0:
            raise ValueError("classifier expects a non-empty (N,3,H,W) batch")
        return self.head(x)


class VisionPipeline:
    def __init__(self, detector: nn.Module, classifier: nn.Module, class_names: Sequence[str], *, device: str = "cpu", min_crop: int = 16) -> None:
        _require_torch()
        if not isinstance(detector, nn.Module) or not isinstance(classifier, nn.Module):
            raise TypeError("detector and classifier must be torch modules")
        if device not in {"cpu", "cuda"}:
            raise ValueError("device must be 'cpu' or 'cuda'")
        if device == "cuda" and not torch.cuda.is_available():
            raise RuntimeError("CUDA was requested but is unavailable")
        if not class_names or not all(isinstance(name, str) and name for name in class_names):
            raise ValueError("class_names must contain non-empty strings")
        if isinstance(min_crop, bool) or not isinstance(min_crop, Integral) or min_crop < 1:
            raise ValueError("min_crop must be a positive integer")
        self.detector = detector.to(device).eval()
        self.classifier = classifier.to(device).eval()
        self.class_names = tuple(class_names)
        self.device = device
        self.min_crop = int(min_crop)

    def preprocess(self, image: np.ndarray | torch.Tensor) -> torch.Tensor:
        if isinstance(image, np.ndarray):
            if image.ndim != 3 or image.shape[2] != 3 or min(image.shape[:2]) <= 0:
                raise ValueError("NumPy images must be non-empty HxWx3")
            if image.dtype == np.uint8:
                tensor = torch.from_numpy(image).permute(2, 0, 1).float() / 255.0
            elif np.issubdtype(image.dtype, np.floating) and np.isfinite(image).all() and np.all((0 <= image) & (image <= 1)):
                tensor = torch.from_numpy(image.astype(np.float32, copy=False)).permute(2, 0, 1)
            else:
                raise ValueError("NumPy images must be uint8 or finite floating-point values in [0,1]")
        elif isinstance(image, torch.Tensor):
            if image.ndim != 3 or image.shape[0] != 3 or min(image.shape[1:]) <= 0 or not torch.isfinite(image).all():
                raise ValueError("tensor images must be finite, non-empty (3,H,W)")
            if torch.any((image < 0) | (image > 1)):
                raise ValueError("tensor images must be in [0,1]")
            tensor = image.float()
        else:
            raise TypeError("image must be a NumPy HxWx3 array or a torch (3,H,W) tensor")
        return tensor.to(self.device)

    @_no_grad
    def detect(self, image_tensor: torch.Tensor) -> dict[str, torch.Tensor]:
        result = self.detector([image_tensor])[0]
        required = {"boxes", "scores", "labels"}
        if set(result) != required or not (len(result["boxes"]) == len(result["scores"]) == len(result["labels"])):
            raise ValueError("detector result must contain equally sized boxes, scores, and labels")
        return result

    @_no_grad
    def classify(self, crops: Sequence[torch.Tensor]) -> list[tuple[int, float]]:
        if not crops:
            return []
        if any(crop.ndim != 3 or crop.shape[0] != 3 or min(crop.shape[1:]) <= 0 for crop in crops):
            raise ValueError("every crop must be a non-empty (3,H,W) tensor")
        logits = self.classifier(torch.stack(list(crops)).to(self.device))
        probs = logits.softmax(dim=-1)
        scores, classes = probs.max(dim=-1)
        return [(int(class_id), float(score)) for class_id, score in zip(classes, scores)]

    def run(self, image: np.ndarray | torch.Tensor, image_id: str = "anonymous") -> PipelineResult:
        if not isinstance(image_id, str) or not image_id:
            raise ValueError("image_id must be a non-empty string")
        start = time.perf_counter()
        tensor = self.preprocess(image)
        detector_result = self.detect(tensor)
        height, width = tensor.shape[-2:]
        crops: list[torch.Tensor] = []
        valid_indices: list[int] = []
        detections: list[Detection] = []
        for index, (box, score, class_id) in enumerate(zip(detector_result["boxes"], detector_result["scores"], detector_result["labels"])):
            x1, y1, x2, y2 = [float(value) for value in box.tolist()]
            x1, y1 = max(0.0, x1), max(0.0, y1)
            x2, y2 = min(float(width), x2), min(float(height), y2)
            detection = Detection((x1, y1, x2, y2), float(score), int(class_id))
            detections.append(detection)
            ix1, iy1, ix2, iy2 = map(math.floor, detection.box)
            if ix2 - ix1 < self.min_crop or iy2 - iy1 < self.min_crop:
                continue
            crop = tensor[:, iy1:iy2, ix1:ix2]
            crops.append(F.interpolate(crop.unsqueeze(0), size=(32, 32), mode="bilinear", align_corners=False)[0])
            valid_indices.append(index)
        predictions = self.classify(crops)
        classifications = [
            Classification(index, class_id, self.class_names[class_id] if class_id < len(self.class_names) else f"class_{class_id}", score)
            for index, (class_id, score) in zip(valid_indices, predictions)
        ]
        return PipelineResult(image_id, detections, classifications, (time.perf_counter() - start) * 1000.0)


def benchmark(pipe: VisionPipeline, num_runs: int = 5, image_size: tuple[int, int] = (64, 96)) -> dict[str, dict[str, float]]:
    _require_torch()
    if isinstance(num_runs, bool) or not isinstance(num_runs, Integral) or num_runs < 1:
        raise ValueError("num_runs must be a positive integer")
    if len(image_size) != 2 or any(isinstance(v, bool) or not isinstance(v, Integral) or v < 1 for v in image_size):
        raise ValueError("image_size must contain two positive integers")
    rng = np.random.default_rng(0)
    image = rng.integers(0, 256, size=(*map(int, image_size), 3), dtype=np.uint8)
    pipe.run(image)
    stages = {name: [] for name in ("preprocess", "detect", "classify", "total")}
    for _ in range(int(num_runs)):
        start = time.perf_counter()
        tensor = pipe.preprocess(image)
        pre_end = time.perf_counter()
        result = pipe.detect(tensor)
        detect_end = time.perf_counter()
        crops = []
        for box in result["boxes"]:
            x1, y1, x2, y2 = [max(0, int(value)) for value in box.tolist()]
            x2, y2 = min(x2, tensor.shape[-1]), min(y2, tensor.shape[-2])
            if x2 - x1 >= pipe.min_crop and y2 - y1 >= pipe.min_crop:
                crops.append(F.interpolate(tensor[:, y1:y2, x1:x2].unsqueeze(0), size=(32, 32), mode="bilinear", align_corners=False)[0])
        pipe.classify(crops)
        end = time.perf_counter()
        stages["preprocess"].append((pre_end - start) * 1000)
        stages["detect"].append((detect_end - pre_end) * 1000)
        stages["classify"].append((end - detect_end) * 1000)
        stages["total"].append((end - start) * 1000)
    return {
        stage: {"p50_ms": sorted(values)[len(values) // 2], "p95_ms": sorted(values)[min(len(values) - 1, math.ceil(len(values) * 0.95) - 1)]}
        for stage, values in stages.items()
    }


def main() -> None:
    image = np.random.default_rng(0).integers(0, 256, size=(64, 96, 3), dtype=np.uint8)
    build_result = numpy_pipeline(image, image_id="numpy-demo")
    print(
        f"[NumPy Build-It] detections={len(build_result.detections)} "
        f"classifications={len(build_result.classifications)} "
        f"json_fields={sorted(build_result.to_dict())}"
    )
    if not TORCH_AVAILABLE:
        print("PyTorch is unavailable; optional Use-It path skipped cleanly.")
        return
    torch.manual_seed(0)
    pipe = VisionPipeline(StubDetector(), StubClassifier(), [f"class_{i}" for i in range(10)])
    result = pipe.run(image, image_id="demo")
    print(result.to_json())
    print("[benchmark]")
    for stage, values in benchmark(pipe).items():
        print(f"{stage:10s} p50={values['p50_ms']:.3f}ms p95={values['p95_ms']:.3f}ms")


if __name__ == "__main__":
    main()
