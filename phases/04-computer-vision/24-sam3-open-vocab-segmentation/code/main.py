"""NumPy/stdlib open-vocabulary mask contracts with a deterministic detector stub."""

# Build-It implementation for phases/04-computer-vision/24-sam3-open-vocab-segmentation.
# It keeps prompt splitting, binary-mask RLE, boxes and detections inspectable offline.
# SAM-style checkpoints are an optional Use-It backend behind the same interface.
# Run from this directory with: python3 main.py

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
import json
from typing import Sequence

import numpy as np


def _image(image: object) -> np.ndarray:
    array = np.asarray(image)
    if array.ndim not in (2, 3) or any(size <= 0 for size in array.shape[:2]):
        raise ValueError("image must have a non-empty HxW or HxWxC shape")
    if not np.issubdtype(array.dtype, np.number) or not np.all(np.isfinite(array)):
        raise ValueError("image must contain finite numeric values")
    return array


def split_concepts(sentence: str) -> list[str]:
    """Split explicit comma/and/or/semicolon separators without splitting noun phrases."""
    if not isinstance(sentence, str) or not sentence.strip():
        raise ValueError("sentence must be a non-empty string")
    normalised = sentence.strip()
    for separator in (" and ", " or ", "&", ";"):
        normalised = normalised.replace(separator, ",")
    concepts = [part.strip() for part in normalised.split(",")]
    if any(not concept for concept in concepts):
        raise ValueError("concept separators cannot create empty concepts")
    return concepts


def _binary_mask(binary_mask: object) -> np.ndarray:
    mask = np.asarray(binary_mask)
    if mask.ndim != 2 or 0 in mask.shape:
        raise ValueError("mask must be a non-empty 2-D array")
    if mask.dtype == bool:
        return mask.astype(np.uint8)
    if not np.issubdtype(mask.dtype, np.integer) or not np.all(np.isin(mask, (0, 1))):
        raise ValueError("mask must contain only binary integer or boolean values")
    return mask.astype(np.uint8, copy=False)


def rle_encode(binary_mask: object) -> str:
    """Encode a row-major binary mask as ``value x run_length`` segments."""
    mask = _binary_mask(binary_mask).reshape(-1)
    runs: list[tuple[int, int]] = []
    value = int(mask[0])
    length = 0
    for item in mask:
        current = int(item)
        if current == value:
            length += 1
        else:
            runs.append((value, length))
            value, length = current, 1
    runs.append((value, length))
    return ";".join(f"{value}x{length}" for value, length in runs)


def rle_decode(rle_string: str, shape: tuple[int, int]) -> np.ndarray:
    """Decode an exact row-major RLE string; malformed or truncated runs are rejected."""
    if not isinstance(rle_string, str) or not isinstance(shape, tuple) or len(shape) != 2:
        raise ValueError("rle_string and a (height, width) shape are required")
    if any(isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value <= 0 for value in shape):
        raise ValueError("shape dimensions must be positive integers")
    if not rle_string:
        raise ValueError("an empty RLE is not a valid non-empty mask")
    values: list[int] = []
    for segment in rle_string.split(";"):
        pieces = segment.split("x")
        if len(pieces) != 2:
            raise ValueError("RLE segments must have the form valuexcount")
        try:
            value, count = (int(piece) for piece in pieces)
        except ValueError as error:
            raise ValueError("RLE values and counts must be integers") from error
        if value not in (0, 1) or count <= 0:
            raise ValueError("RLE values must be 0/1 and counts positive")
        values.extend([value] * count)
    expected = int(np.prod(shape))
    if len(values) != expected:
        raise ValueError(f"RLE decodes to {len(values)} cells, expected {expected}")
    return np.asarray(values, dtype=np.uint8).reshape(shape)


@dataclass(frozen=True)
class ConceptDetection:
    concept: str
    instance_id: int
    box: tuple[float, float, float, float]
    score: float
    mask_rle: str

    def __post_init__(self) -> None:
        if not isinstance(self.concept, str) or not self.concept.strip():
            raise ValueError("concept must be non-empty")
        if isinstance(self.instance_id, bool) or not isinstance(self.instance_id, (int, np.integer)) or self.instance_id < 0:
            raise ValueError("instance_id must be a non-negative integer")
        try:
            box = np.asarray(self.box, dtype=float)
        except (TypeError, ValueError) as error:
            raise ValueError("box must contain four finite coordinates") from error
        if box.shape != (4,) or not np.all(np.isfinite(box)):
            raise ValueError("box must contain four finite coordinates")
        x1, y1, x2, y2 = box
        if not (x2 > x1 and y2 > y1):
            raise ValueError("box must have positive width and height")
        if isinstance(self.score, bool) or not isinstance(self.score, (int, float, np.number)) or not np.isfinite(self.score) or not 0.0 <= self.score <= 1.0:
            raise ValueError("score must be finite and in [0, 1]")
        if not isinstance(self.mask_rle, str) or not self.mask_rle:
            raise ValueError("mask_rle must be a non-empty encoded mask")


class OpenVocabSeg(ABC):
    @abstractmethod
    def detect(self, image: np.ndarray, concept: str) -> list[ConceptDetection]:
        raise NotImplementedError


class StubOpenVocabSeg(OpenVocabSeg):
    """Small deterministic backend used to test a SAM-like interface without weights."""

    def detect(self, image: np.ndarray, concept: str) -> list[ConceptDetection]:
        array = _image(image)
        concepts = split_concepts(concept)
        if len(concepts) != 1:
            raise ValueError("detect expects one already-separated concept")
        concept = concepts[0]
        height, width = array.shape[:2]
        mask_a = np.zeros((height, width), dtype=np.uint8)
        mask_b = np.zeros((height, width), dtype=np.uint8)
        ax1, ay1, ax2, ay2 = int(width * 0.2), int(height * 0.3), int(width * 0.5), int(height * 0.8)
        bx1, by1, bx2, by2 = int(width * 0.55), int(height * 0.25), int(width * 0.85), int(height * 0.75)
        if ax2 <= ax1 or ay2 <= ay1 or bx2 <= bx1 or by2 <= by1:
            raise ValueError("image is too small for the stub boxes")
        mask_a[ay1:ay2, ax1:ax2] = 1
        mask_b[by1:by2, bx1:bx2] = 1
        return [
            ConceptDetection(concept, 0, (float(ax1), float(ay1), float(ax2), float(ay2)), 0.89, rle_encode(mask_a)),
            ConceptDetection(concept, 1, (float(bx1), float(by1), float(bx2), float(by2)), 0.74, rle_encode(mask_b)),
        ]


def mask_iou(left: object, right: object) -> float:
    first, second = _binary_mask(left), _binary_mask(right)
    if first.shape != second.shape:
        raise ValueError("masks must have the same shape")
    intersection = np.logical_and(first, second).sum()
    union = np.logical_or(first, second).sum()
    return 1.0 if union == 0 else float(intersection / union)


def run_multi_concept(model: OpenVocabSeg, image: np.ndarray, user_utterance: str) -> list[ConceptDetection]:
    if not isinstance(model, OpenVocabSeg):
        raise ValueError("model must implement OpenVocabSeg")
    concepts = split_concepts(user_utterance)
    detections: list[ConceptDetection] = []
    for concept in concepts:
        detections.extend(model.detect(image, concept))
    return detections


def main() -> None:
    image = np.zeros((24, 32, 3), dtype=np.uint8)
    utterance = "oranges, apples"
    detections = run_multi_concept(StubOpenVocabSeg(), image, utterance)
    first_mask = rle_decode(detections[0].mask_rle, image.shape[:2])
    print("[open-vocabulary segmentation Build-It]")
    print(f"concepts={split_concepts(utterance)} detections={len(detections)}")
    print(f"first={json.dumps(asdict(detections[0]))[:140]}... mask_area={int(first_mask.sum())}")
    print(f"mask self-IoU={mask_iou(first_mask, first_mask):.1f} rle_cells={first_mask.size}")


if __name__ == "__main__":
    main()
