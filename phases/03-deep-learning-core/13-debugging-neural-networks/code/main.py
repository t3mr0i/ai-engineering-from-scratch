# Entry point for phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md.
# Provides dependency-safe diagnostics for finite losses, activations, gradients, and derivatives.
# The optional torch path is reported, never imported or installed by the canonical demo.
# Run from this directory with: python3 main.py

from __future__ import annotations

import importlib.util
import math
from numbers import Real
from typing import Callable, Iterable, Mapping, Sequence


def _finite(value: Real, name: str = "value") -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a real number")
    number = float(value)
    if not math.isfinite(number):
        raise ValueError(f"{name} must be finite")
    return number


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def _values(values: Sequence[Real], name: str) -> tuple[float, ...]:
    if not isinstance(values, (tuple, list)) or not values:
        raise ValueError(f"{name} must be a non-empty sequence")
    return tuple(_finite(value, f"{name}[{index}]") for index, value in enumerate(values))


def finite_stats(values: Sequence[Real]) -> dict[str, float]:
    """Return descriptive statistics, rejecting NaN/Inf rather than hiding them."""
    numbers = _values(values, "values")
    mean = sum(numbers) / len(numbers)
    variance = sum((number - mean) ** 2 for number in numbers) / len(numbers)
    return {
        "count": float(len(numbers)),
        "mean": mean,
        "std": math.sqrt(variance),
        "min": min(numbers),
        "max": max(numbers),
    }


def classify_values(values: Sequence[Real]) -> str:
    """Identify non-finite input before asking for finite statistics."""
    if not isinstance(values, (tuple, list)) or not values:
        raise ValueError("values must be a non-empty sequence")
    for value in values:
        if isinstance(value, bool) or not isinstance(value, Real):
            raise ValueError("values must contain real numbers")
        if not math.isfinite(float(value)):
            return "NAN_OR_INF"
    return "FINITE"


def loss_health(history: Sequence[Real], window: int = 10, tolerance: Real = 0.99) -> str:
    """Classify a loss trace using explicit, local thresholds."""
    if not isinstance(history, (tuple, list)) or not history:
        raise ValueError("history must be a non-empty sequence")
    width = _positive_int(window, "window")
    margin = _finite(tolerance, "tolerance")
    if not 0 < margin <= 1:
        raise ValueError("tolerance must be in (0, 1]")
    if len(history) < 2:
        return "NOT_ENOUGH_DATA"
    if any(
        isinstance(value, bool)
        or not isinstance(value, Real)
        or not math.isfinite(float(value))
        for value in history
    ):
        return "NAN_OR_INF"
    recent = [float(value) for value in history[-width:]]
    if len(history) >= 2 * width:
        first = sum(float(value) for value in history[:width]) / width
        last = sum(float(value) for value in history[-width:]) / width
        if last >= first * margin:
            return "NOT_DECREASING"
    differences = [recent[index + 1] - recent[index] for index in range(len(recent) - 1)]
    sign_changes = sum(
        1
        for left, right in zip(differences, differences[1:])
        if left != 0 and right != 0 and (left > 0) != (right > 0)
    )
    if sign_changes >= max(2, len(differences) // 2):
        return "OSCILLATING"
    return "HEALTHY"


def activation_report(
    name: str, values: Sequence[Real], zero_threshold: Real = 0.5, magnitude_threshold: Real = 10.0
) -> dict[str, object]:
    """Summarize one activation vector and report interpretable local warnings."""
    stats = finite_stats(values)
    zero_limit = _finite(zero_threshold, "zero_threshold")
    magnitude_limit = _finite(magnitude_threshold, "magnitude_threshold")
    if not 0 <= zero_limit <= 1 or magnitude_limit <= 0:
        raise ValueError("activation thresholds are out of range")
    numbers = _values(values, "values")
    fraction_zero = sum(number == 0 for number in numbers) / len(numbers)
    issues: list[str] = []
    if fraction_zero > zero_limit:
        issues.append("DEAD_NEURONS")
    if abs(stats["mean"]) > magnitude_limit or stats["max"] > magnitude_limit or stats["min"] < -magnitude_limit:
        issues.append("EXPLODING_ACTIVATIONS")
    if stats["std"] < 1e-6:
        issues.append("COLLAPSED_ACTIVATIONS")
    return {
        "name": name,
        "fraction_zero": fraction_zero,
        "stats": stats,
        "issues": tuple(issues) if issues else ("HEALTHY",),
    }


def gradient_report(name: str, values: Sequence[Real], small: Real = 1e-7, large: Real = 100.0) -> dict[str, object]:
    """Report vanishing/exploding gradient magnitudes for one layer."""
    stats = finite_stats(values)
    small_limit = _finite(small, "small")
    large_limit = _finite(large, "large")
    if small_limit <= 0 or large_limit <= small_limit:
        raise ValueError("gradient thresholds are invalid")
    magnitudes = tuple(abs(value) for value in _values(values, "values"))
    abs_mean = sum(magnitudes) / len(magnitudes)
    issues: list[str] = []
    if abs_mean < small_limit:
        issues.append("VANISHING_GRADIENT")
    if abs_mean > large_limit:
        issues.append("EXPLODING_GRADIENT")
    return {
        "name": name,
        "abs_mean": abs_mean,
        "stats": stats,
        "issues": tuple(issues) if issues else ("HEALTHY",),
    }


def central_difference(function: Callable[[float], float], x: Real, epsilon: Real = 1e-6) -> float:
    """Estimate a scalar derivative using two finite forward evaluations."""
    if not callable(function):
        raise ValueError("function must be callable")
    point = _finite(x, "x")
    step = _finite(epsilon, "epsilon")
    if step <= 0:
        raise ValueError("epsilon must be positive")
    left = _finite(function(point - step), "function(x-epsilon)")
    right = _finite(function(point + step), "function(x+epsilon)")
    return (right - left) / (2.0 * step)


def diagnose(
    losses: Sequence[Real],
    activations: Mapping[str, Sequence[Real]],
    gradients: Mapping[str, Sequence[Real]],
) -> dict[str, object]:
    """Produce a serializable report from the three evidence streams."""
    if not isinstance(activations, Mapping) or not activations:
        raise ValueError("activations must be a non-empty mapping")
    if not isinstance(gradients, Mapping) or not gradients:
        raise ValueError("gradients must be a non-empty mapping")
    return {
        "loss_status": loss_health(losses),
        "activation_reports": tuple(
            activation_report(name, values) for name, values in activations.items()
        ),
        "gradient_reports": tuple(
            gradient_report(name, values) for name, values in gradients.items()
        ),
    }


def torch_available() -> bool:
    """Probe availability without importing or installing the optional framework."""
    return importlib.util.find_spec("torch") is not None


def main() -> int:
    losses = (1.0, 0.82, 0.68, 0.57, 0.49)
    report = diagnose(
        losses,
        {"hidden": (0.0, 0.5, 1.0, 1.5)},
        {"output": (0.12, 0.08, 0.1)},
    )
    derivative = central_difference(lambda value: value * value, 3.0)
    print("stdlib neural-network diagnostics")
    print(f"loss_status={report['loss_status']} finite_values={classify_values(losses)}")
    print(f"activation_issues={report['activation_reports'][0]['issues']}")
    print(f"gradient_issues={report['gradient_reports'][0]['issues']}")
    print(f"central_difference_d_x2_at_3={derivative:.4f} torch_available={torch_available()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
