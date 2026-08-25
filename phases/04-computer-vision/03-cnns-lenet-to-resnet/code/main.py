# Entry point for phases/04-computer-vision/03-cnns-lenet-to-resnet/docs/en.md.
# Traces the spatial contracts of classic CNN families with small NumPy operations, not framework weights.
# The functions make LeNet pooling and ResNet shape-preserving residual additions directly testable.
# Run from this directory with: python3 main.py

from __future__ import annotations

from numbers import Integral

import numpy as np


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def _numeric(value: np.ndarray, name: str) -> np.ndarray:
    array = np.asarray(value)
    if not np.issubdtype(array.dtype, np.number) or not np.isfinite(array).all():
        raise ValueError(f"{name} must contain finite numeric values")
    return array


def _batch_nchw(value: np.ndarray, name: str = "x") -> np.ndarray:
    array = _numeric(value, name)
    if array.ndim != 4 or 0 in array.shape:
        raise ValueError(f"{name} must have non-empty NCHW shape")
    return array


def conv2d_nchw(
    x: np.ndarray,
    weights: np.ndarray,
    bias: np.ndarray | None = None,
    stride: int = 1,
    padding: int = 0,
) -> np.ndarray:
    """Apply cross-correlation to NCHW data and OCHW weights."""
    inputs = _batch_nchw(x)
    kernels = _numeric(weights, "weights")
    if kernels.ndim != 4 or kernels.shape[1] != inputs.shape[1] or 0 in kernels.shape:
        raise ValueError("weights must have non-empty OCHW shape with matching channels")
    stride = _positive_int(stride, "stride")
    if isinstance(padding, bool) or not isinstance(padding, Integral) or int(padding) < 0:
        raise ValueError("padding must be a non-negative integer")
    padding = int(padding)
    if bias is not None:
        bias = _numeric(bias, "bias")
        if bias.shape != (kernels.shape[0],):
            raise ValueError("bias shape must match output channels")
    kh, kw = kernels.shape[-2:]
    oh = (inputs.shape[2] + 2 * padding - kh) // stride + 1
    ow = (inputs.shape[3] + 2 * padding - kw) // stride + 1
    if oh <= 0 or ow <= 0:
        raise ValueError("kernel does not fit input")
    padded = np.pad(inputs, ((0, 0), (0, 0), (padding, padding), (padding, padding)))
    output = np.zeros((inputs.shape[0], kernels.shape[0], oh, ow), dtype=np.float32)
    for n in range(inputs.shape[0]):
        for oc in range(kernels.shape[0]):
            for oy in range(oh):
                for ox in range(ow):
                    patch = padded[n, :, oy * stride:oy * stride + kh, ox * stride:ox * stride + kw]
                    output[n, oc, oy, ox] = np.sum(patch * kernels[oc])
            if bias is not None:
                output[n, oc] += bias[oc]
    return output


def avg_pool2d(x: np.ndarray, kernel: int = 2, stride: int | None = None) -> np.ndarray:
    inputs = _batch_nchw(x)
    kernel = _positive_int(kernel, "kernel")
    stride = kernel if stride is None else _positive_int(stride, "stride")
    oh = (inputs.shape[2] - kernel) // stride + 1
    ow = (inputs.shape[3] - kernel) // stride + 1
    if oh <= 0 or ow <= 0:
        raise ValueError("pool kernel does not fit input")
    output = np.empty((inputs.shape[0], inputs.shape[1], oh, ow), dtype=np.float32)
    for oy in range(oh):
        for ox in range(ow):
            output[:, :, oy, ox] = inputs[:, :, oy * stride:oy * stride + kernel,
                                            ox * stride:ox * stride + kernel].mean(axis=(-2, -1))
    return output


def relu(x: np.ndarray) -> np.ndarray:
    return np.maximum(_numeric(x, "x"), 0).astype(np.float32)


def dense(x: np.ndarray, weights: np.ndarray, bias: np.ndarray | None = None) -> np.ndarray:
    inputs = _numeric(x, "x")
    kernels = _numeric(weights, "weights")
    if (inputs.ndim != 2 or kernels.ndim != 2 or 0 in inputs.shape or 0 in kernels.shape
            or inputs.shape[1] != kernels.shape[1]):
        raise ValueError("dense inputs must have non-empty (N,F) and (O,F) shapes")
    result = inputs @ kernels.T
    if bias is not None:
        bias = _numeric(bias, "bias")
        if bias.shape != (kernels.shape[0],):
            raise ValueError("bias shape must match dense outputs")
        result = result + bias
    return result.astype(np.float32)


def lenet_shape_trace(input_shape: tuple[int, int, int, int] = (1, 1, 32, 32), num_classes: int = 10) -> list[tuple[str, tuple[int, ...]]]:
    """Return LeNet-5 tensor shapes for conv5, avg-pool2, conv5, avg-pool2, and the head."""
    if len(input_shape) != 4 or any(_positive_int(v, "input dimension") <= 0 for v in input_shape):
        raise ValueError("input_shape must be a non-empty NCHW tuple")
    if input_shape[1] != 1:
        raise ValueError("the LeNet trace expects one input channel")
    num_classes = _positive_int(num_classes, "num_classes")
    n, _, h, w = input_shape
    shapes = [("input", tuple(input_shape))]
    h, w = h - 4, w - 4
    if h <= 0 or w <= 0:
        raise ValueError("input is too small for the first 5x5 convolution")
    shapes.append(("conv1+tanh", (n, 6, h, w)))
    h, w = h // 2, w // 2
    if h <= 0 or w <= 0:
        raise ValueError("input is too small for the first pool")
    shapes.append(("avgpool1", (n, 6, h, w)))
    h, w = h - 4, w - 4
    if h <= 0 or w <= 0:
        raise ValueError("input is too small for the second convolution")
    shapes.append(("conv2+tanh", (n, 16, h, w)))
    h, w = h // 2, w // 2
    if h <= 0 or w <= 0:
        raise ValueError("input is too small for the second pool")
    shapes.append(("avgpool2", (n, 16, h, w)))
    shapes.extend([
        ("flatten", (n, 16 * h * w)),
        ("fc1+tanh", (n, 120)),
        ("fc2+tanh", (n, 84)),
        ("logits", (n, num_classes)),
    ])
    return shapes


def residual_add(main: np.ndarray, shortcut: np.ndarray) -> np.ndarray:
    left, right = _numeric(main, "main"), _numeric(shortcut, "shortcut")
    if left.ndim != 4 or 0 in left.shape or left.shape != right.shape:
        raise ValueError("residual branches must have the same non-empty NCHW shape")
    return (left + right).astype(np.float32)


def model_parameter_counts(num_classes: int = 10) -> dict[str, int]:
    num_classes = _positive_int(num_classes, "num_classes")
    lenet = 5 * 5 * 1 * 6 + 6 + 5 * 5 * 6 * 16 + 16 + (16 * 5 * 5) * 120 + 120 + 120 * 84 + 84 + 84 * num_classes + num_classes
    vgg_like = (3 * 3 * 3 * 16 + 16) + (3 * 3 * 16 * 32 + 32) + (32 * num_classes + num_classes)
    resnet_like = (3 * 3 * 3 * 16) + (3 * 3 * 16 * 16 * 2) + (16 * num_classes + num_classes)
    return {"LeNet5": int(lenet), "VGG-small": int(vgg_like), "ResNet-small": int(resnet_like)}


def main() -> int:
    trace = lenet_shape_trace()
    print("LeNet-5 shape trace:")
    for name, shape in trace:
        print(f"  {name:12s} {shape}")
    print("parameter counts:", model_parameter_counts())
    branch = np.ones((1, 4, 5, 5), dtype=np.float32)
    print("residual identity check:", bool(np.array_equal(residual_add(branch, np.zeros_like(branch)), branch)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
