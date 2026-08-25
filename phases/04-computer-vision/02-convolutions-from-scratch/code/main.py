# Entry point for phases/04-computer-vision/02-convolutions-from-scratch/docs/en.md.
# Implements NumPy cross-correlation twice so the shape and receptive-field math is inspectable.
# The public tensors are CHW inputs and OCHW kernels; zero padding, stride, and dilation are explicit.
# Run from this directory with: python3 main.py

from __future__ import annotations

from numbers import Integral

import numpy as np


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _nonnegative_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) < 0:
        raise ValueError(f"{name} must be a non-negative integer")
    return int(value)


def _numeric(array: np.ndarray, name: str) -> np.ndarray:
    value = np.asarray(array)
    if not np.issubdtype(value.dtype, np.number) or not np.isfinite(value).all():
        raise ValueError(f"{name} must contain finite numeric values")
    return value


def _chw(x: np.ndarray) -> np.ndarray:
    value = _numeric(x, "x")
    if value.ndim != 3 or 0 in value.shape:
        raise ValueError("x must have a non-empty CHW shape")
    return value


def _kernel(w: np.ndarray, channels: int) -> np.ndarray:
    value = _numeric(w, "w")
    if value.ndim != 4 or value.shape[0] == 0 or value.shape[1] != channels:
        raise ValueError("w must have non-empty OCHW shape with matching input channels")
    if value.shape[2] == 0 or value.shape[3] == 0:
        raise ValueError("kernel spatial dimensions must be non-empty")
    return value


def _parameters(stride: int, padding: int, dilation: int) -> tuple[int, int, int]:
    return (
        _positive_int(stride, "stride"),
        _nonnegative_int(padding, "padding"),
        _positive_int(dilation, "dilation"),
    )


def pad2d(x: np.ndarray, padding: int) -> np.ndarray:
    """Zero-pad the last two axes of a non-empty numeric array."""
    value = _numeric(x, "x")
    padding = _nonnegative_int(padding, "padding")
    if value.ndim < 2 or value.shape[-2] == 0 or value.shape[-1] == 0:
        raise ValueError("x must have non-empty spatial dimensions")
    if padding == 0:
        return value.copy()
    h, width = value.shape[-2:]
    out = np.zeros(value.shape[:-2] + (h + 2 * padding, width + 2 * padding), dtype=value.dtype)
    out[..., padding:padding + h, padding:padding + width] = value
    return out


def output_size(h_in: int, kernel: int, padding: int = 0, stride: int = 1, dilation: int = 1) -> int:
    """Return floor((H+2P-D(K-1)-1)/S)+1, or reject an empty output."""
    h_in = _positive_int(h_in, "h_in")
    kernel = _positive_int(kernel, "kernel")
    stride, padding, dilation = _parameters(stride, padding, dilation)
    numerator = h_in + 2 * padding - dilation * (kernel - 1) - 1
    if numerator < 0:
        raise ValueError("kernel footprint does not fit the padded input")
    return numerator // stride + 1


def _output_shape(x: np.ndarray, w: np.ndarray, stride: int, padding: int, dilation: int) -> tuple[int, int]:
    return (
        output_size(x.shape[1], w.shape[2], padding, stride, dilation),
        output_size(x.shape[2], w.shape[3], padding, stride, dilation),
    )


def _bias(bias: np.ndarray | None, channels: int) -> np.ndarray | None:
    if bias is None:
        return None
    value = _numeric(bias, "bias")
    if value.shape != (channels,):
        raise ValueError(f"bias must have shape ({channels},)")
    return value


def conv2d_naive(
    x: np.ndarray,
    w: np.ndarray,
    b: np.ndarray | None = None,
    stride: int = 1,
    padding: int = 0,
    dilation: int = 1,
) -> np.ndarray:
    """Apply cross-correlation over a single CHW sample with OCHW kernels."""
    value = _chw(x)
    weights = _kernel(w, value.shape[0])
    stride, padding, dilation = _parameters(stride, padding, dilation)
    bias = _bias(b, weights.shape[0])
    h_out, w_out = _output_shape(value, weights, stride, padding, dilation)
    padded = pad2d(value, padding)
    out = np.zeros((weights.shape[0], h_out, w_out), dtype=np.result_type(value, weights, np.float32))
    for oc in range(weights.shape[0]):
        for oy in range(h_out):
            for ox in range(w_out):
                y0, x0 = oy * stride, ox * stride
                patch = padded[:, y0:y0 + dilation * (weights.shape[2] - 1) + 1:dilation,
                                x0:x0 + dilation * (weights.shape[3] - 1) + 1:dilation]
                out[oc, oy, ox] = np.sum(patch * weights[oc])
        if bias is not None:
            out[oc] += bias[oc]
    return out.astype(np.float32, copy=False)


def im2col(
    x: np.ndarray,
    kh: int,
    kw: int,
    stride: int = 1,
    padding: int = 0,
    dilation: int = 1,
) -> tuple[np.ndarray, int, int]:
    """Flatten each receptive field into a column, retaining scan order (y then x)."""
    value = _chw(x)
    kh, kw = _positive_int(kh, "kh"), _positive_int(kw, "kw")
    stride, padding, dilation = _parameters(stride, padding, dilation)
    h_out = output_size(value.shape[1], kh, padding, stride, dilation)
    w_out = output_size(value.shape[2], kw, padding, stride, dilation)
    padded = pad2d(value, padding)
    cols = np.empty((value.shape[0] * kh * kw, h_out * w_out), dtype=value.dtype)
    column = 0
    for oy in range(h_out):
        for ox in range(w_out):
            y0, x0 = oy * stride, ox * stride
            patch = padded[:, y0:y0 + dilation * (kh - 1) + 1:dilation,
                           x0:x0 + dilation * (kw - 1) + 1:dilation]
            cols[:, column] = patch.reshape(-1)
            column += 1
    return cols, h_out, w_out


def conv2d_im2col(
    x: np.ndarray,
    w: np.ndarray,
    b: np.ndarray | None = None,
    stride: int = 1,
    padding: int = 0,
    dilation: int = 1,
) -> np.ndarray:
    value = _chw(x)
    weights = _kernel(w, value.shape[0])
    stride, padding, dilation = _parameters(stride, padding, dilation)
    bias = _bias(b, weights.shape[0])
    cols, h_out, w_out = im2col(value, weights.shape[2], weights.shape[3], stride, padding, dilation)
    result = weights.reshape(weights.shape[0], -1) @ cols
    if bias is not None:
        result += bias[:, None]
    return result.reshape(weights.shape[0], h_out, w_out).astype(np.float32, copy=False)


def max_pool2d(x: np.ndarray, kernel: int = 2, stride: int | None = None, padding: int = 0) -> np.ndarray:
    value = _chw(x)
    kernel = _positive_int(kernel, "kernel")
    stride = kernel if stride is None else _positive_int(stride, "stride")
    padding = _nonnegative_int(padding, "padding")
    h_out = output_size(value.shape[1], kernel, padding, stride)
    w_out = output_size(value.shape[2], kernel, padding, stride)
    padded = pad2d(value, padding)
    out = np.empty((value.shape[0], h_out, w_out), dtype=value.dtype)
    for oy in range(h_out):
        for ox in range(w_out):
            patch = padded[:, oy * stride:oy * stride + kernel, ox * stride:ox * stride + kernel]
            out[:, oy, ox] = patch.max(axis=(-2, -1))
    return out


def receptive_field(layers: list[tuple[int, int, int]] | list[tuple[int, int]]) -> int:
    """Return the receptive-field side length for (kernel, stride[, dilation]) layers."""
    rf, jump = 1, 1
    if not layers:
        raise ValueError("layers must not be empty")
    for layer in layers:
        if len(layer) == 2:
            kernel, stride = layer
            dilation = 1
        elif len(layer) == 3:
            kernel, stride, dilation = layer
        else:
            raise ValueError("each layer must be (kernel,stride) or (kernel,stride,dilation)")
        kernel = _positive_int(kernel, "kernel")
        stride = _positive_int(stride, "stride")
        dilation = _positive_int(dilation, "dilation")
        rf += (kernel - 1) * dilation * jump
        jump *= stride
    return rf


KERNELS = {
    "identity": np.array([[0, 0, 0], [0, 1, 0], [0, 0, 0]], dtype=np.float32),
    "blur_3x3": np.ones((3, 3), dtype=np.float32) / 9.0,
    "sharpen": np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32),
    "sobel_x": np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32),
    "sobel_y": np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32),
}


def apply_kernel(img2d: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    image = _numeric(img2d, "img2d")
    if image.ndim != 2 or 0 in image.shape:
        raise ValueError("img2d must be a non-empty HW array")
    kernel = _numeric(kernel, "kernel")
    if kernel.ndim != 2 or kernel.shape[0] == 0 or kernel.shape[1] == 0:
        raise ValueError("kernel must be a non-empty 2-D array")
    return conv2d_im2col(image[None], kernel[None, None], padding=kernel.shape[0] // 2)[0]


def synthetic_step_image(size: int = 16) -> np.ndarray:
    size = _positive_int(size, "size")
    image = np.zeros((1, size, size), dtype=np.float32)
    image[:, :, size // 2:] = 1.0
    return image


def test_against_naive() -> tuple[tuple[int, int, int], float]:
    rng = np.random.default_rng(0)
    x = rng.normal(0, 1, (3, 9, 11)).astype(np.float32)
    weights = rng.normal(0, 1, (4, 3, 3, 2)).astype(np.float32)
    bias = rng.normal(0, 1, (4,)).astype(np.float32)
    naive = conv2d_naive(x, weights, bias, stride=2, padding=2, dilation=1)
    columns = conv2d_im2col(x, weights, bias, stride=2, padding=2, dilation=1)
    return naive.shape, float(np.max(np.abs(naive - columns)))


def main() -> int:
    shape, difference = test_against_naive()
    print(f"cross-correlation equivalence: shape={shape} max_abs_diff={difference:.2e}")
    edge = apply_kernel(synthetic_step_image()[0], KERNELS["sobel_x"])
    print(f"sobel step: output_shape={edge.shape} edge_column_max={float(np.abs(edge).max()):.1f}")
    print("shape formula:", {f"k{k}/p{p}/s{s}": output_size(32, k, p, s) for k, p, s in [(3, 0, 1), (3, 1, 1), (3, 1, 2)]})
    print(f"receptive_field=[3,1; 3,2; 3,1] -> {receptive_field([(3, 1), (3, 2), (3, 1)])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
