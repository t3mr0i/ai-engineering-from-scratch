# Real-Time Vision — Edge Deployment.
# Canonical Python implementation for phases/04-computer-vision/15-real-time-edge/docs/en.md.
# The benchmark uses two local PyTorch backbones; its numbers are fixture measurements, not device claims.
# A stdlib-only Rust companion lives in code/main.rs and reports the same measurement ideas.

from __future__ import annotations

import math
import time
from numbers import Integral

try:
    import torch
    from torch import nn
    TORCH_AVAILABLE = True
except ModuleNotFoundError:  # The lesson remains runnable as a bounded environment probe.
    torch = None  # type: ignore[assignment]
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


def _positive_int(name: str, value: object, *, allow_zero: bool = False) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral):
        raise ValueError(f"{name} must be an integer")
    value = int(value)
    if value < (0 if allow_zero else 1):
        bound = "non-negative" if allow_zero else "positive"
        raise ValueError(f"{name} must be {bound}")
    return value


def _input_shape(input_shape: object) -> tuple[int, int, int, int]:
    if not isinstance(input_shape, (tuple, list)) or len(input_shape) != 4:
        raise ValueError("input_shape must be a four-dimensional (N,C,H,W) shape")
    values = tuple(_positive_int("input dimension", value) for value in input_shape)
    return values  # type: ignore[return-value]


def _device_name(device: object) -> str:
    _require_torch()
    if not isinstance(device, str) or device not in {"cpu", "cuda", "mps"}:
        raise ValueError("device must be 'cpu', 'cuda', or 'mps'")
    if device == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA was requested but is unavailable")
    mps_backend = getattr(torch.backends, "mps", None)
    if device == "mps" and (mps_backend is None or not mps_backend.is_available()):
        raise RuntimeError("MPS was requested but is unavailable")
    return device


def _sync(device: str) -> None:
    if device == "cuda":
        torch.cuda.synchronize()
    elif device == "mps":
        torch.mps.synchronize()


def _percentile(sorted_times: list[float], fraction: float) -> float:
    index = min(len(sorted_times) - 1, max(0, math.ceil(fraction * len(sorted_times)) - 1))
    return sorted_times[index]


@_no_grad
def measure_latency(
    model: nn.Module,
    input_shape: tuple[int, int, int, int],
    device: str = "cpu",
    warmup: int = 5,
    iters: int = 20,
) -> dict[str, float]:
    """Measure steady-state forward latency after a bounded warmup."""
    _require_torch()
    if not isinstance(model, nn.Module):
        raise TypeError("model must be a torch.nn.Module")
    shape = _input_shape(input_shape)
    device = _device_name(device)
    warmup = _positive_int("warmup", warmup, allow_zero=True)
    iters = _positive_int("iters", iters)
    model = model.to(device).eval()
    x = torch.randn(shape, device=device)
    for _ in range(warmup):
        model(x)
    _sync(device)
    times: list[float] = []
    for _ in range(iters):
        _sync(device)
        start = time.perf_counter()
        model(x)
        _sync(device)
        times.append((time.perf_counter() - start) * 1000.0)
    times.sort()
    return {
        "p50_ms": _percentile(times, 0.50),
        "p95_ms": _percentile(times, 0.95),
        "p99_ms": _percentile(times, 0.99),
        "mean_ms": sum(times) / len(times),
    }


def parameter_count(model: nn.Module) -> int:
    _require_torch()
    if not isinstance(model, nn.Module):
        raise TypeError("model must be a torch.nn.Module")
    return sum(parameter.numel() for parameter in model.parameters())


def flops_estimate(model: nn.Module, input_shape: tuple[int, int, int, int]) -> int:
    """Count multiply/add pairs for Conv2d and Linear modules in this fixture."""
    _require_torch()
    if not isinstance(model, nn.Module):
        raise TypeError("model must be a torch.nn.Module")
    shape = _input_shape(input_shape)
    total = 0

    def conv_hook(module: nn.Conv2d, _inputs: tuple[torch.Tensor, ...], output: torch.Tensor) -> None:
        nonlocal total
        c_out, c_in_per_group, kh, kw = module.weight.shape
        h, w = output.shape[-2:]
        total += 2 * c_in_per_group * c_out * kh * kw * h * w

    def linear_hook(module: nn.Linear, _inputs: tuple[torch.Tensor, ...], _output: torch.Tensor) -> None:
        nonlocal total
        total += 2 * module.in_features * module.out_features

    hooks = []
    for module in model.modules():
        if isinstance(module, nn.Conv2d):
            hooks.append(module.register_forward_hook(conv_hook))
        elif isinstance(module, nn.Linear):
            hooks.append(module.register_forward_hook(linear_hook))
    try:
        try:
            device = next(model.parameters()).device
        except StopIteration:
            device = torch.device("cpu")
        model = model.to(device).eval()
        with torch.no_grad():
            model(torch.randn(shape, device=device))
    finally:
        for hook in hooks:
            hook.remove()
    return total


class TinyDenseBackbone(nn.Module):
    """A dense local baseline with the same input/output contract as its peer."""

    def __init__(self, num_classes: int = 10) -> None:
        super().__init__()
        _require_torch()
        self.features = nn.Sequential(
            nn.Conv2d(3, 8, 3, padding=1), nn.ReLU(),
            nn.Conv2d(8, 16, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1), nn.Flatten(),
        )
        self.head = nn.Linear(16, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.features(x))


class TinyDepthwiseBackbone(nn.Module):
    """A depthwise-plus-pointwise local baseline for a FLOP comparison."""

    def __init__(self, num_classes: int = 10) -> None:
        super().__init__()
        _require_torch()
        self.features = nn.Sequential(
            nn.Conv2d(3, 3, 3, padding=1, groups=3), nn.ReLU(),
            nn.Conv2d(3, 16, 1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1), nn.Flatten(),
        )
        self.head = nn.Linear(16, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.features(x))


def compare_backbones(resolution: int = 64, warmup: int = 2, iters: int = 5) -> list[dict[str, float | str]]:
    _require_torch()
    resolution = _positive_int("resolution", resolution)
    warmup = _positive_int("warmup", warmup, allow_zero=True)
    iters = _positive_int("iters", iters)
    shape = (1, 3, resolution, resolution)
    candidates: list[tuple[str, nn.Module]] = [
        ("tiny_dense", TinyDenseBackbone()),
        ("tiny_depthwise", TinyDepthwiseBackbone()),
    ]
    results: list[dict[str, float | str]] = []
    for name, model in candidates:
        latency = measure_latency(model, shape, warmup=warmup, iters=iters)
        results.append({
            "model": name,
            "params": float(parameter_count(model)),
            "flops": float(flops_estimate(model, shape)),
            **latency,
        })
    return results


def main() -> None:
    if not TORCH_AVAILABLE:
        resolution = 64
        dense_flops = 2 * (3 * 8 * 3 * 3 + 8 * 16 * 3 * 3) * resolution * resolution
        depthwise_flops = 2 * (1 * 3 * 3 * 3 + 3 * 16) * resolution * resolution
        samples = sorted([1.10, 1.35, 1.60, 2.05])
        p95 = samples[min(len(samples) - 1, math.ceil(0.95 * len(samples)) - 1)]
        print(
            f"[Python Build-It fallback] shape=(1,3,{resolution},{resolution}) "
            f"dense_flops={dense_flops} depthwise_flops={depthwise_flops} fixture_p95_ms={p95:.2f}"
        )
        print("PyTorch is unavailable; optional Use-It path skipped cleanly (Rust companion remains runnable).")
        return
    torch.manual_seed(0)
    print("Local edge benchmark: two PyTorch backbones, input=(1,3,64,64)")
    print("model             params     FLOPs       p50       p95")
    for result in compare_backbones():
        print(
            f"{result['model']:17s} {int(result['params']):7d} "
            f"{int(result['flops']):9d} {result['p50_ms']:8.3f} {result['p95_ms']:8.3f}"
        )
    print("These timings are local observations; deployment decisions require the target device and task-quality gate.")


if __name__ == "__main__":
    main()
