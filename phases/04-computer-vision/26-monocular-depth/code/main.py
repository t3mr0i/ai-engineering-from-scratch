"""NumPy-first monocular-depth metrics and pinhole point-cloud export."""

# Build-It implementation for phases/04-computer-vision/26-monocular-depth.
# It exposes scale-aware metrics and geometry without a dataset, model, or network.
# A depth checkpoint is an optional Use-It source whose output can enter these APIs.
# Run from this directory with: python3 main.py

from __future__ import annotations

import os
import tempfile

import numpy as np


def _depth_arrays(pred: object, target: object, mask: object | None = None) -> tuple[np.ndarray, np.ndarray]:
    prediction = np.asarray(pred, dtype=np.float64)
    truth = np.asarray(target, dtype=np.float64)
    if prediction.shape != truth.shape or prediction.ndim == 0 or prediction.size == 0:
        raise ValueError("pred and target must be equally shaped non-empty arrays")
    if not np.all(np.isfinite(prediction)) or not np.all(np.isfinite(truth)) or np.any(prediction <= 0.0) or np.any(truth <= 0.0):
        raise ValueError("depth values must be finite and positive")
    if mask is not None:
        mask_array = np.asarray(mask)
        if mask_array.shape != truth.shape or mask_array.dtype != bool or not np.any(mask_array):
            raise ValueError("mask must be boolean, matching, and select at least one value")
        prediction, truth = prediction[mask_array], truth[mask_array]
    return prediction, truth


def abs_rel_error(pred: object, target: object, mask: object | None = None) -> float:
    prediction, truth = _depth_arrays(pred, target, mask)
    result = float(np.mean(np.abs(prediction - truth) / truth))
    if not np.isfinite(result):
        raise ValueError("absRel was not finite")
    return result


def delta_accuracy(pred: object, target: object, threshold: float = 1.25, mask: object | None = None) -> float:
    prediction, truth = _depth_arrays(pred, target, mask)
    if not isinstance(threshold, (int, float, np.number)) or isinstance(threshold, bool) or not np.isfinite(threshold) or threshold <= 1.0:
        raise ValueError("threshold must be finite and greater than 1")
    ratio = np.maximum(prediction / truth, truth / prediction)
    return float(np.mean(ratio < threshold))


def align_scale_shift(pred: object, target: object, mask: object | None = None) -> np.ndarray:
    """Fit ``a*pred+b`` by least squares; at least two distinct predictions are required."""
    prediction, truth = _depth_arrays(pred, target, mask)
    if np.unique(prediction).size < 2:
        raise ValueError("scale/shift alignment needs at least two distinct predictions")
    design = np.column_stack((prediction.reshape(-1), np.ones(prediction.size)))
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        solution, _, _, _ = np.linalg.lstsq(design, truth.reshape(-1), rcond=None)
        aligned = solution[0] * np.asarray(pred, dtype=np.float64) + solution[1]
    if not np.all(np.isfinite(aligned)):
        raise ValueError("scale/shift alignment was not finite")
    return aligned


def depth_to_point_cloud(depth: object, intrinsics: object) -> np.ndarray:
    depth_array = np.asarray(depth, dtype=np.float64)
    camera = np.asarray(intrinsics, dtype=np.float64)
    if depth_array.ndim != 2 or depth_array.size == 0 or not np.all(np.isfinite(depth_array)) or np.any(depth_array <= 0.0):
        raise ValueError("depth must be a non-empty positive finite HxW array")
    if camera.shape != (4,) or not np.all(np.isfinite(camera)):
        raise ValueError("intrinsics must be finite (fx, fy, cx, cy)")
    fx, fy, cx, cy = camera
    if fx <= 0.0 or fy <= 0.0:
        raise ValueError("focal lengths must be positive")
    height, width = depth_array.shape
    v, u = np.meshgrid(np.arange(height), np.arange(width), indexing="ij")
    x = (u - cx) * depth_array / fx
    y = (v - cy) * depth_array / fy
    points = np.stack((x, y, depth_array), axis=-1)
    if not np.all(np.isfinite(points)):
        raise ValueError("point cloud contains non-finite coordinates")
    return points


def synthetic_depth(size: int = 32) -> np.ndarray:
    if isinstance(size, bool) or not isinstance(size, (int, np.integer)) or size < 4:
        raise ValueError("size must be an integer >= 4")
    yy, xx = np.meshgrid(np.arange(size), np.arange(size), indexing="ij")
    depth = 1.0 + 4.0 * yy / size
    foreground = (np.abs(xx - size / 2) < size / 6) & (np.abs(yy - size * 0.6) < size / 6)
    depth[foreground] = 2.0
    return depth.astype(np.float64)


def write_ply(path: str | os.PathLike[str], points: object, colours: object | None = None) -> None:
    point_array = np.asarray(points, dtype=np.float64)
    if point_array.ndim < 2 or point_array.shape[-1] != 3 or not np.all(np.isfinite(point_array)):
        raise ValueError("points must end in three finite coordinates")
    flat_points = point_array.reshape(-1, 3)
    colour_array: np.ndarray | None = None
    if colours is not None:
        colour_array = np.asarray(colours)
        if colour_array.shape != point_array.shape or colour_array.dtype.kind not in "iu" or np.any((colour_array < 0) | (colour_array > 255)):
            raise ValueError("colours must be integer RGB values matching points")
        colour_array = colour_array.reshape(-1, 3)
    header = ["ply", "format ascii 1.0", f"element vertex {len(flat_points)}", "property float x", "property float y", "property float z"]
    if colour_array is not None:
        header.extend(("property uchar red", "property uchar green", "property uchar blue"))
    header.append("end_header")
    with open(path, "w", encoding="utf-8") as stream:
        stream.write("\n".join(header) + "\n")
        for index, point in enumerate(flat_points):
            line = f"{point[0]:.6f} {point[1]:.6f} {point[2]:.6f}"
            if colour_array is not None:
                line += " " + " ".join(str(int(value)) for value in colour_array[index])
            stream.write(line + "\n")


def main() -> None:
    truth = synthetic_depth(24)
    prediction = truth * 1.15
    aligned = align_scale_shift(prediction, truth)
    cloud = depth_to_point_cloud(truth, (24.0, 24.0, 12.0, 12.0))
    output = os.path.join(tempfile.gettempdir(), "cv04_monocular_depth_demo.ply")
    write_ply(output, cloud)
    print("[monocular depth Build-It]")
    print(f"truth={truth.shape} absRel(raw)={abs_rel_error(prediction, truth):.3f} absRel(aligned)={abs_rel_error(aligned, truth):.3e}")
    print(f"delta<1.25(raw)={delta_accuracy(prediction, truth):.3f} point_cloud={cloud.shape} output={output}")


if __name__ == "__main__":
    main()
