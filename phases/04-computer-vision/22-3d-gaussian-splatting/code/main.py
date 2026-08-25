"""NumPy-first Gaussian projection and front-to-back splat compositing."""

# Build-It implementation for phases/04-computer-vision/22-3d-gaussian-splatting.
# The equations mirror the local projection/compositing fixture, not a renderer.
# A production checkpoint or GPU rasterizer is an optional Use-It comparison.
# Run from this directory with: python3 main.py

from __future__ import annotations

import math
from pathlib import Path

import numpy as np


def _array(value: object, *, name: str, ndim: int | None = None) -> np.ndarray:
    raw = np.asarray(value)
    if raw.dtype.kind == "b" or any(isinstance(item, (bool, np.bool_)) for item in np.asarray(value, dtype=object).reshape(-1)):
        raise ValueError(f"{name} must be numeric, not boolean")
    arr = np.asarray(value, dtype=np.float64)
    if ndim is not None and arr.ndim != ndim:
        raise ValueError(f"{name} must have {ndim} dimensions")
    if arr.size == 0 or not np.all(np.isfinite(arr)):
        raise ValueError(f"{name} must contain only finite values")
    return arr


def _positive_int(value: object, *, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, np.integer)) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _spd(matrix: object, *, name: str, size: int) -> np.ndarray:
    cov = _array(matrix, name=name, ndim=2)
    if cov.shape != (size, size) or not np.allclose(cov, cov.T, atol=1e-12):
        raise ValueError(f"{name} must be a symmetric {size}x{size} matrix")
    eigenvalues = np.linalg.eigvalsh(cov)
    if np.any(eigenvalues <= 0.0):
        raise ValueError(f"{name} must be positive definite")
    return cov


def project_gaussian(mean_3d: object, covariance_3d: object, intrinsics: object) -> tuple[np.ndarray, np.ndarray]:
    """Project one 3-D Gaussian through a pinhole camera with first-order covariance propagation."""
    mean = _array(mean_3d, name="mean_3d", ndim=1)
    cov = _spd(covariance_3d, name="covariance_3d", size=3)
    camera = _array(intrinsics, name="intrinsics", ndim=1)
    if mean.shape != (3,) or camera.shape != (4,):
        raise ValueError("mean_3d must have length 3 and intrinsics must be (fx, fy, cx, cy)")
    fx, fy, cx, cy = camera
    if fx <= 0.0 or fy <= 0.0 or mean[2] <= 0.0:
        raise ValueError("focal lengths and depth must be positive")
    x, y, z = mean
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        projected = np.array([fx * x / z + cx, fy * y / z + cy], dtype=np.float64)
        jacobian = np.array(
            [[fx / z, 0.0, -fx * x / (z * z)], [0.0, fy / z, -fy * y / (z * z)]],
            dtype=np.float64,
        )
        projected_cov = jacobian @ cov @ jacobian.T
    if not np.all(np.isfinite(projected)) or not np.all(np.isfinite(projected_cov)):
        raise ValueError("projection produced a non-finite result")
    return projected, 0.5 * (projected_cov + projected_cov.T)


def eval_2d_gaussian(means: object, covariances: object, points: object) -> np.ndarray:
    """Return normalized Gaussian densities with shape ``(num_gaussians, height, width)``."""
    mean_arr = _array(means, name="means", ndim=2)
    cov_arr = _array(covariances, name="covariances", ndim=3)
    point_arr = _array(points, name="points", ndim=3)
    if mean_arr.shape[1:] != (2,) or cov_arr.shape[1:] != (2, 2):
        raise ValueError("means must be (G,2) and covariances must be (G,2,2)")
    if point_arr.shape[-1] != 2 or cov_arr.shape[0] != mean_arr.shape[0]:
        raise ValueError("Gaussian and point dimensions do not match")
    densities = np.empty((mean_arr.shape[0], point_arr.shape[0], point_arr.shape[1]), dtype=np.float64)
    flat = point_arr.reshape(-1, 2)
    for index, (mean, cov) in enumerate(zip(mean_arr, cov_arr)):
        cov = _spd(cov, name="covariance", size=2)
        inverse = np.linalg.inv(cov)
        determinant = float(np.linalg.det(cov))
        diff = flat - mean
        with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
            exponent = -0.5 * np.einsum("pi,ij,pj->p", diff, inverse, diff)
            density = np.exp(np.clip(exponent, -745.0, 0.0)) / (2.0 * math.pi * math.sqrt(determinant))
        if not np.all(np.isfinite(density)):
            raise ValueError("Gaussian density was not finite")
        densities[index] = density.reshape(point_arr.shape[:2])
    return densities


def rasterise_2d(
    means: object,
    covariances: object,
    colours: object,
    opacities: object,
    depths: object,
    image_size: tuple[int, int],
) -> tuple[np.ndarray, np.ndarray]:
    """Composite depth-sorted splats and return ``(image, residual_transmittance)``."""
    if not isinstance(image_size, tuple) or len(image_size) != 2:
        raise ValueError("image_size must be a (height, width) tuple")
    height, width = (_positive_int(value, name="image dimension") for value in image_size)
    mean_arr = _array(means, name="means", ndim=2)
    cov_arr = _array(covariances, name="covariances", ndim=3)
    colour_arr = _array(colours, name="colours", ndim=2)
    opacity_arr = _array(opacities, name="opacities", ndim=1)
    depth_arr = _array(depths, name="depths", ndim=1)
    count = mean_arr.shape[0]
    if mean_arr.shape[1:] != (2,) or cov_arr.shape != (count, 2, 2) or colour_arr.shape != (count, 3):
        raise ValueError("means, covariances and colours have incompatible shapes")
    if opacity_arr.shape != (count,) or depth_arr.shape != (count,):
        raise ValueError("one opacity and depth are required per splat")
    if np.any((opacity_arr < 0.0) | (opacity_arr > 1.0)) or np.any((colour_arr < 0.0) | (colour_arr > 1.0)):
        raise ValueError("opacities and colours must be in [0, 1]")
    densities = eval_2d_gaussian(mean_arr, cov_arr, np.stack(np.meshgrid(
        np.arange(width, dtype=np.float64), np.arange(height, dtype=np.float64), indexing="xy"), axis=-1))
    alphas = np.minimum(opacity_arr[:, None, None] * densities, 1.0 - 1e-12)
    order = np.argsort(depth_arr, kind="stable")
    transmittance = np.ones((height, width), dtype=np.float64)
    image = np.zeros((height, width, 3), dtype=np.float64)
    for index in order:
        contribution = transmittance * alphas[index]
        with np.errstate(over="ignore", invalid="ignore"):
            image += contribution[..., None] * colour_arr[index]
            transmittance *= 1.0 - alphas[index]
    if not np.all(np.isfinite(image)) or not np.all(np.isfinite(transmittance)):
        raise ValueError("splat compositing produced a non-finite result")
    return image, transmittance


def make_target(size: int = 32) -> np.ndarray:
    """Create a deterministic two-shape RGB fixture used by the demo and notebook."""
    size = _positive_int(size, name="size")
    yy, xx = np.meshgrid(np.arange(size), np.arange(size), indexing="ij")
    image = np.ones((size, size, 3), dtype=np.float64)
    circle = (xx - 0.32 * size) ** 2 + (yy - 0.32 * size) ** 2 < (0.18 * size) ** 2
    square = (np.abs(xx - 0.70 * size) < 0.13 * size) & (np.abs(yy - 0.68 * size) < 0.13 * size)
    image[circle] = (0.95, 0.2, 0.15)
    image[square] = (0.2, 0.35, 0.95)
    return image


def sh_degree_3_basis(directions: object) -> np.ndarray:
    """Evaluate the 16 real spherical-harmonic basis functions through degree three."""
    dirs = _array(directions, name="directions", ndim=2)
    if dirs.shape[1:] != (3,):
        raise ValueError("directions must have shape (N, 3)")
    norms = np.linalg.norm(dirs, axis=1)
    if np.any(norms <= 0.0):
        raise ValueError("directions must be nonzero")
    x, y, z = (dirs / norms[:, None]).T
    x2, y2, z2 = x * x, y * y, z * z
    xy, yz, xz = x * y, y * z, x * z
    c0, c1 = 0.282094791773878, 0.488602511902920
    c2 = (1.092548430592079, 1.092548430592079, 0.315391565252520, 1.092548430592079, 0.546274215296039)
    c3 = (0.590043589926644, 2.890611442640554, 0.457045799464465, 0.373176332590115, 0.457045799464465, 1.445305721320277, 0.590043589926644)
    return np.stack([
        np.full_like(x, c0), -c1 * y, c1 * z, -c1 * x,
        c2[0] * xy, c2[1] * yz, c2[2] * (2 * z2 - x2 - y2), c2[3] * xz, c2[4] * (x2 - y2),
        -c3[0] * y * (3 * x2 - y2), c3[1] * xy * z, -c3[2] * y * (4 * z2 - x2 - y2),
        c3[3] * z * (2 * z2 - 3 * x2 - 3 * y2), -c3[4] * x * (4 * z2 - x2 - y2),
        c3[5] * z * (x2 - y2), -c3[6] * x * (x2 - 3 * y2),
    ], axis=-1)


def eval_sh_degree_3(sh_coefficients: object, directions: object) -> np.ndarray:
    basis = sh_degree_3_basis(directions)
    coeffs = _array(sh_coefficients, name="sh_coefficients", ndim=3)
    if coeffs.shape != (basis.shape[0], 16, 3):
        raise ValueError("sh_coefficients must have shape (N, 16, 3)")
    return np.einsum("nb,nbc->nc", basis, coeffs)


def main() -> None:
    size = 32
    intrinsics = (24.0, 24.0, size / 2.0, size / 2.0)
    mean_2d, cov_2d = project_gaussian((0.0, 0.0, 4.0), np.diag((0.15, 0.15, 0.25)), intrinsics)
    image, residual = rasterise_2d(
        np.array([mean_2d, (22.0, 21.0)]),
        np.array([cov_2d, np.diag((5.0, 5.0))]),
        np.array([(0.95, 0.2, 0.15), (0.2, 0.35, 0.95)]),
        np.array([0.85, 0.70]),
        np.array([1.0, 2.0]),
        (size, size),
    )
    directions = np.array(((1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)))
    rgb = eval_sh_degree_3(np.zeros((3, 16, 3)), directions)
    print("[3D Gaussian splat Build-It]")
    print(f"projected mean={np.round(mean_2d, 3).tolist()} covariance_trace={np.trace(cov_2d):.4f}")
    print(f"image shape={image.shape} mean_rgb={np.round(image.mean(axis=(0, 1)), 4).tolist()} residual_range=({residual.min():.4f},{residual.max():.4f})")
    print(f"SH basis/evaluation: basis=(3, 16), rgb={rgb.shape}")
    print(f"target fixture mean={make_target(size).mean():.4f}")


if __name__ == "__main__":
    main()
