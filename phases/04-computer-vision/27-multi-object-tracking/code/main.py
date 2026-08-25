"""NumPy/stdlib IoU tracking with a deterministic bounded assignment solver."""

# Build-It implementation for phases/04-computer-vision/27-multi-object-tracking.
# It makes association, track ageing, and MOT metrics executable without SciPy.
# A production Kalman/filter tracker is an optional Use-It replacement for this seam.
# Run from this directory with: python3 main.py

from __future__ import annotations

from functools import lru_cache
import itertools

import numpy as np


def _boxes(value: object, *, name: str) -> np.ndarray:
    raw = np.asarray(value)
    if raw.dtype.kind == "b" or any(isinstance(item, (bool, np.bool_)) for item in np.asarray(value, dtype=object).reshape(-1)):
        raise ValueError(f"{name} must be numeric, not boolean")
    array = np.asarray(value, dtype=np.float64)
    if array.ndim != 2 or array.shape[1:] != (4,):
        raise ValueError(f"{name} must have shape (N, 4)")
    if not np.all(np.isfinite(array)):
        raise ValueError(f"{name} must be finite")
    if np.any(array[:, 2] <= array[:, 0]) or np.any(array[:, 3] <= array[:, 1]):
        raise ValueError(f"{name} boxes must have positive width and height")
    return array


def bbox_iou(left: object, right: object) -> np.ndarray:
    """Return pairwise intersection-over-union for ``xyxy`` boxes."""
    first, second = _boxes(left, name="left"), _boxes(right, name="right")
    if len(first) == 0 or len(second) == 0:
        return np.zeros((len(first), len(second)), dtype=np.float64)
    inter_left = np.maximum(first[:, None, 0], second[None, :, 0])
    inter_top = np.maximum(first[:, None, 1], second[None, :, 1])
    inter_right = np.minimum(first[:, None, 2], second[None, :, 2])
    inter_bottom = np.minimum(first[:, None, 3], second[None, :, 3])
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        intersection = np.maximum(inter_right - inter_left, 0.0) * np.maximum(inter_bottom - inter_top, 0.0)
        first_area = (first[:, 2] - first[:, 0]) * (first[:, 3] - first[:, 1])
        second_area = (second[:, 2] - second[:, 0]) * (second[:, 3] - second[:, 1])
        union = first_area[:, None] + second_area[None, :] - intersection
        result = intersection / union
    if not np.all(np.isfinite(result)):
        raise ValueError("IoU calculation was not finite")
    return result


def _assignment(iou: np.ndarray, threshold: float) -> list[tuple[int, int]]:
    """Maximize total IoU, allowing unmatched rows; use a bounded exact DP for small sets."""
    rows, columns = iou.shape
    if isinstance(threshold, bool) or not isinstance(threshold, (int, float, np.number)) or not np.isfinite(threshold) or not 0.0 <= threshold <= 1.0:
        raise ValueError("assignment threshold must be finite and in [0, 1]")
    valid = iou >= threshold
    if rows == 0 or columns == 0:
        return []
    if rows > 10 or columns > 10:
        candidates = sorted(((float(iou[r, c]), r, c) for r in range(rows) for c in range(columns) if valid[r, c]), reverse=True)
        used_rows: set[int] = set()
        used_columns: set[int] = set()
        result: list[tuple[int, int]] = []
        for _score, row, column in candidates:
            if row not in used_rows and column not in used_columns:
                result.append((row, column))
                used_rows.add(row)
                used_columns.add(column)
        return sorted(result)

    @lru_cache(maxsize=None)
    def solve(row: int, used: int) -> tuple[float, tuple[tuple[int, int], ...]]:
        if row == rows:
            return 0.0, ()
        best_score, best_pairs = solve(row + 1, used)
        for column in range(columns):
            if used & (1 << column) or not valid[row, column]:
                continue
            score, pairs = solve(row + 1, used | (1 << column))
            score += float(iou[row, column])
            candidate = ((row, column),) + pairs
            if score > best_score + 1e-12 or (abs(score - best_score) <= 1e-12 and candidate < best_pairs):
                best_score, best_pairs = score, candidate
        return best_score, best_pairs

    return list(solve(0, 0)[1])


class Track:
    def __init__(self, track_id: int, bbox: object, frame: int):
        if isinstance(track_id, bool) or not isinstance(track_id, (int, np.integer)) or track_id <= 0:
            raise ValueError("track_id must be positive")
        if isinstance(frame, bool) or not isinstance(frame, (int, np.integer)) or frame < 0:
            raise ValueError("frame must be a non-negative integer")
        self.id = int(track_id)
        self.bbox = _boxes(np.asarray(bbox, dtype=np.float64).reshape(1, 4), name="bbox")[0]
        self.last_frame = int(frame)
        self.hits = 1

    def update(self, bbox: object, frame: int) -> None:
        if frame < self.last_frame:
            raise ValueError("frames must be non-decreasing")
        self.bbox = _boxes(np.asarray(bbox, dtype=np.float64).reshape(1, 4), name="bbox")[0]
        self.last_frame = int(frame)
        self.hits += 1


class SimpleTracker:
    def __init__(self, iou_threshold: float = 0.3, max_age: int = 5):
        if isinstance(iou_threshold, bool) or not isinstance(iou_threshold, (int, float, np.number)) or not np.isfinite(iou_threshold) or not 0.0 <= iou_threshold <= 1.0:
            raise ValueError("iou_threshold must be in [0, 1]")
        if isinstance(max_age, bool) or not isinstance(max_age, (int, np.integer)) or max_age < 0:
            raise ValueError("max_age must be a non-negative integer")
        self.tracks: list[Track] = []
        self.next_id = 1
        self.iou_threshold = float(iou_threshold)
        self.max_age = int(max_age)
        self._last_frame = -1

    def step(self, detections: object, frame: int) -> list[tuple[int, list[float]]]:
        if isinstance(frame, bool) or not isinstance(frame, (int, np.integer)) or frame < 0 or frame < self._last_frame:
            raise ValueError("frame must be a non-decreasing non-negative integer")
        raw_detections = np.asarray(detections)
        if raw_detections.dtype.kind == "b" or any(isinstance(item, (bool, np.bool_)) for item in np.asarray(detections, dtype=object).reshape(-1)):
            raise ValueError("detections must be numeric, not boolean")
        det_array = np.asarray(detections, dtype=np.float64)
        if det_array.size == 0:
            det_array = np.empty((0, 4), dtype=np.float64)
        det_array = _boxes(det_array, name="detections")
        self._last_frame = int(frame)
        matched_tracks: set[int] = set()
        matched_detections: set[int] = set()
        if self.tracks and len(det_array):
            track_array = np.asarray([track.bbox for track in self.tracks])
            pairs = _assignment(bbox_iou(track_array, det_array), self.iou_threshold)
            for track_index, detection_index in pairs:
                self.tracks[track_index].update(det_array[detection_index], int(frame))
                matched_tracks.add(track_index)
                matched_detections.add(detection_index)
        for index, detection in enumerate(det_array):
            if index not in matched_detections:
                self.tracks.append(Track(self.next_id, detection, int(frame)))
                self.next_id += 1
        self.tracks = [track for index, track in enumerate(self.tracks) if index in matched_tracks or frame - track.last_frame <= self.max_age]
        self.tracks.sort(key=lambda track: track.id)
        return [(track.id, track.bbox.tolist()) for track in self.tracks]


def synthetic_frames(num_frames: int = 12, num_objects: int = 3, seed: int = 0, drop_prob: float = 0.0) -> tuple[list[list[list[float]]], list[list[tuple[int, list[float]]]]]:
    if any(isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value <= 0 for value in (num_frames, num_objects)):
        raise ValueError("num_frames and num_objects must be positive integers")
    if isinstance(drop_prob, bool) or not np.isfinite(drop_prob) or not 0.0 <= drop_prob <= 1.0:
        raise ValueError("drop_prob must be in [0, 1]")
    rng = np.random.default_rng(seed)
    starts = rng.uniform((20.0, 20.0), (180.0, 120.0), size=(num_objects, 2))
    velocities = rng.uniform(-2.0, 2.0, size=(num_objects, 2))
    detections: list[list[list[float]]] = []
    ground_truth: list[list[tuple[int, list[float]]]] = []
    for frame in range(num_frames):
        frame_detections, frame_truth = [], []
        for object_id in range(num_objects):
            cx, cy = starts[object_id] + frame * velocities[object_id]
            box = [float(cx - 8.0), float(cy - 8.0), float(cx + 8.0), float(cy + 8.0)]
            frame_truth.append((object_id, box))
            if rng.random() >= drop_prob:
                frame_detections.append(box)
        detections.append(frame_detections)
        ground_truth.append(frame_truth)
    return detections, ground_truth


def _frame_matches(tracks: list[tuple[int, list[float]]], gts: list[tuple[int, list[float]]], threshold: float = 0.5) -> list[tuple[int, int]]:
    track_boxes = _boxes([box for _id, box in tracks], name="track boxes") if tracks else np.empty((0, 4))
    gt_boxes = _boxes([box for _id, box in gts], name="ground-truth boxes") if gts else np.empty((0, 4))
    return _assignment(bbox_iou(gt_boxes, track_boxes), threshold)


def count_id_switches(tracks_per_frame: list[list[tuple[int, list[float]]]], gt_per_frame: list[list[tuple[int, list[float]]]]) -> int:
    if len(tracks_per_frame) != len(gt_per_frame):
        raise ValueError("track and ground-truth timelines must have equal length")
    previous: dict[int, int] = {}
    switches = 0
    for tracks, gts in zip(tracks_per_frame, gt_per_frame):
        for gt_index, track_index in _frame_matches(tracks, gts):
            gt_id, track_id = gts[gt_index][0], tracks[track_index][0]
            if gt_id in previous and previous[gt_id] != track_id:
                switches += 1
            previous[gt_id] = track_id
    return switches


def mota_score(tracks_per_frame: list[list[tuple[int, list[float]]]], gt_per_frame: list[list[tuple[int, list[float]]]], threshold: float = 0.5) -> float:
    if len(tracks_per_frame) != len(gt_per_frame) or not gt_per_frame:
        raise ValueError("timelines must be non-empty and equally long")
    false_positive = false_negative = 0
    total_gt = 0
    for tracks, gts in zip(tracks_per_frame, gt_per_frame):
        matches = _frame_matches(tracks, gts, threshold)
        total_gt += len(gts)
        false_negative += len(gts) - len(matches)
        false_positive += len(tracks) - len(matches)
    if total_gt == 0:
        raise ValueError("MOTA needs at least one ground-truth object")
    result = 1.0 - (false_positive + false_negative + count_id_switches(tracks_per_frame, gt_per_frame)) / total_gt
    return float(result)


def idf1_score(tracks_per_frame: list[list[tuple[int, list[float]]]], gt_per_frame: list[list[tuple[int, list[float]]]], threshold: float = 0.5) -> float:
    if len(tracks_per_frame) != len(gt_per_frame):
        raise ValueError("timelines must have equal length")
    true_positive = sum(len(_frame_matches(tracks, gts, threshold)) for tracks, gts in zip(tracks_per_frame, gt_per_frame))
    false_positive = sum(len(tracks) for tracks in tracks_per_frame) - true_positive
    false_negative = sum(len(gts) for gts in gt_per_frame) - true_positive
    denominator = 2 * true_positive + false_positive + false_negative
    return 0.0 if denominator == 0 else float(2 * true_positive / denominator)


def main() -> None:
    detections, ground_truth = synthetic_frames(num_frames=16, num_objects=3, seed=7, drop_prob=0.15)
    tracker = SimpleTracker(iou_threshold=0.3, max_age=2)
    timeline = [tracker.step(frame, index) for index, frame in enumerate(detections)]
    print("[multi-object tracking Build-It]")
    print(f"frames={len(timeline)} final_active_ids={[track.id for track in tracker.tracks]} id_switches={count_id_switches(timeline, ground_truth)}")
    print(f"MOTA={mota_score(timeline, ground_truth):.3f} IDF1={idf1_score(timeline, ground_truth):.3f} first_frame={timeline[0]}")


if __name__ == "__main__":
    main()
