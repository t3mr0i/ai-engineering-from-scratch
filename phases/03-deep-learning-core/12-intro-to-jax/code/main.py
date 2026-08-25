# Entry point for phases/03-deep-learning-core/12-intro-to-jax/docs/en.md.
# Demonstrates functional parameter passing and transformations without importing JAX.
# The pure-Python bridge keeps the data flow executable on the repository's allowlist.
# Run from this directory with: python3 main.py

from __future__ import annotations

import math
from numbers import Real
from typing import Callable, Iterable, Mapping, Sequence


Params = Mapping[str, object]


def _finite(value: Real, name: str = "value") -> float:
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{name} must be a real number")
    result = float(value)
    if not math.isfinite(result):
        raise ValueError(f"{name} must be finite")
    return result


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def _vector(values: Sequence[Real], name: str) -> tuple[float, ...]:
    if not isinstance(values, (tuple, list)) or not values:
        raise ValueError(f"{name} must be a non-empty sequence")
    return tuple(_finite(value, f"{name}[{index}]") for index, value in enumerate(values))


def _params(params: Params) -> tuple[tuple[float, ...], float]:
    if not isinstance(params, Mapping) or set(params) != {"w", "b"}:
        raise ValueError("params must contain exactly w and b")
    weights = _vector(params["w"], "params['w']")  # type: ignore[arg-type]
    bias = _finite(params["b"], "params['b']")  # type: ignore[arg-type]
    return weights, bias


def linear(params: Params, x: Sequence[Real]) -> float:
    """Evaluate a scalar linear model without mutating its parameter mapping."""
    weights, bias = _params(params)
    features = _vector(x, "x")
    if len(features) != len(weights):
        raise ValueError("x width must match params['w']")
    return sum(weight * feature for weight, feature in zip(weights, features)) + bias


def mse(params: Params, xs: Sequence[Sequence[Real]], ys: Sequence[Real]) -> float:
    """Compute a finite mean squared error for a batch of rows."""
    if len(xs) != len(ys) or not xs:
        raise ValueError("xs and ys must be non-empty and have equal length")
    errors = [linear(params, row) - _finite(target, "y") for row, target in zip(xs, ys)]
    return sum(error * error for error in errors) / len(errors)


def finite_difference_gradient(
    function: Callable[[float], float], x: Real, epsilon: Real = 1e-6
) -> float:
    """Approximate a scalar derivative with a centered finite difference."""
    point = _finite(x, "x")
    step = _finite(epsilon, "epsilon")
    if step <= 0:
        raise ValueError("epsilon must be positive")
    left = _finite(function(point - step), "function(x-epsilon)")
    right = _finite(function(point + step), "function(x+epsilon)")
    return (right - left) / (2.0 * step)


def vmap(function: Callable[[object], object], values: Iterable[object]) -> tuple[object, ...]:
    """Explicitly map one pure function over a batch, JAX-vmap style."""
    if not callable(function):
        raise ValueError("function must be callable")
    batch = tuple(values)
    if not batch:
        raise ValueError("values must be non-empty")
    return tuple(function(value) for value in batch)


def shape_checked(function: Callable[[Sequence[Real]], object], width: int) -> Callable[[Sequence[Real]], object]:
    """Return a transformation that checks a fixed feature width before calling function."""
    expected = _positive_int(width, "width")
    if not callable(function):
        raise ValueError("function must be callable")

    def transformed(row: Sequence[Real]) -> object:
        values = _vector(row, "row")
        if len(values) != expected:
            raise ValueError(f"row must have width {expected}")
        return function(values)

    return transformed


def split_seed(seed: int) -> tuple[int, int]:
    """Split an integer seed deterministically instead of using global random state."""
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise ValueError("seed must be an integer")
    mask = 0xFFFFFFFF
    parent = seed & mask
    first = (parent * 1664525 + 1013904223) & mask
    second = (first * 1664525 + 1013904223) & mask
    return first, second


def random_vector(seed: int, size: int) -> tuple[float, ...]:
    """Generate a deterministic vector from an explicit seed."""
    count = _positive_int(size, "size")
    state = seed & 0xFFFFFFFF if isinstance(seed, int) and not isinstance(seed, bool) else None
    if state is None:
        raise ValueError("seed must be an integer")
    values: list[float] = []
    for _ in range(count):
        state = (state * 1664525 + 1013904223) & 0xFFFFFFFF
        values.append((state / 0xFFFFFFFF) * 2.0 - 1.0)
    return tuple(values)


def update_params(params: Params, gradients: Params, learning_rate: Real) -> dict[str, object]:
    """Return new parameters; the input mapping is never changed."""
    weights, bias = _params(params)
    gradient_weights, gradient_bias = _params(gradients)
    if len(weights) != len(gradient_weights):
        raise ValueError("gradient width must match parameter width")
    rate = _finite(learning_rate, "learning_rate")
    if rate <= 0:
        raise ValueError("learning_rate must be positive")
    return {
        "w": tuple(weight - rate * gradient for weight, gradient in zip(weights, gradient_weights)),
        "b": bias - rate * gradient_bias,
    }


def train_linear(steps: int = 20, learning_rate: Real = 0.1) -> tuple[dict[str, object], tuple[float, ...]]:
    """Fit y=2x+1 with explicit state and return new params plus loss trace."""
    count = _positive_int(steps, "steps")
    rate = _finite(learning_rate, "learning_rate")
    if rate <= 0:
        raise ValueError("learning_rate must be positive")
    xs = ((-1.0,), (0.0,), (1.0,), (2.0,))
    ys = (-1.0, 1.0, 3.0, 5.0)
    params: dict[str, object] = {"w": (0.0,), "b": 0.0}
    trace: list[float] = []
    for _ in range(count):
        trace.append(mse(params, xs, ys))
        weights, bias = _params(params)
        errors = [linear(params, row) - target for row, target in zip(xs, ys)]
        grad_w = 2.0 * sum(error * row[0] for error, row in zip(errors, xs)) / len(xs)
        grad_b = 2.0 * sum(errors) / len(errors)
        params = update_params(params, {"w": (grad_w,), "b": grad_b}, rate)
    trace.append(mse(params, xs, ys))
    return params, tuple(trace)


def main() -> int:
    derivative = finite_difference_gradient(lambda value: value * value, 3.0)
    mapped = vmap(lambda value: value * value, (1.0, 2.0, 3.0))
    children = split_seed(42)
    params, trace = train_linear()
    print("JAX conceptual bridge (stdlib only; JAX is not imported)")
    print(f"finite_difference_d_x2_at_3={derivative:.4f}")
    print(f"vmap_square={tuple(round(value, 3) for value in mapped)} seeds={children}")
    print(f"train_linear initial={trace[0]:.4f} final={trace[-1]:.6f} params={params}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
