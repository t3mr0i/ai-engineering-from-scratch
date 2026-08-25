# Weight initializers and a small variance-propagation experiment, stdlib only.
# Xavier and Kaiming use local RNGs so experiments do not alter caller state.
# The forward probe reports this lesson's finite, seeded fixture rather than a benchmark.
# See phases/03-deep-learning-core/08-weight-initialization/docs/en.md.

from __future__ import annotations

import math
import random
from typing import Callable, Sequence


Initializer = Callable[[int, int, random.Random | None], list[list[float]]]


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def _finite_positive(value: float, name: str) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be positive and finite") from exc
    if not math.isfinite(numeric) or numeric <= 0:
        raise ValueError(f"{name} must be positive and finite")
    return numeric


def _source(rng: random.Random | None) -> random.Random:
    return rng if rng is not None else random.Random(0)


def _matrix(fan_in: int, fan_out: int, draw: Callable[[random.Random], float], rng: random.Random | None = None) -> list[list[float]]:
    fan_in = _positive_int(fan_in, "fan_in")
    fan_out = _positive_int(fan_out, "fan_out")
    source = _source(rng)
    return [[float(draw(source)) for _ in range(fan_in)] for _ in range(fan_out)]


def zero_init(fan_in: int, fan_out: int, rng: random.Random | None = None) -> list[list[float]]:
    """Return a fan_out by fan_in matrix of zeros."""
    return _matrix(fan_in, fan_out, lambda _: 0.0, rng)


def random_init(fan_in: int, fan_out: int, scale: float = 1.0, rng: random.Random | None = None) -> list[list[float]]:
    scale = _finite_positive(scale, "scale")
    return _matrix(fan_in, fan_out, lambda source: source.gauss(0.0, scale), rng)


def xavier_init(fan_in: int, fan_out: int, rng: random.Random | None = None) -> list[list[float]]:
    fan_in = _positive_int(fan_in, "fan_in")
    fan_out = _positive_int(fan_out, "fan_out")
    std = math.sqrt(2.0 / (fan_in + fan_out))
    return _matrix(fan_in, fan_out, lambda source: source.gauss(0.0, std), rng)


def kaiming_init(fan_in: int, fan_out: int, rng: random.Random | None = None) -> list[list[float]]:
    fan_in = _positive_int(fan_in, "fan_in")
    _positive_int(fan_out, "fan_out")
    std = math.sqrt(2.0 / fan_in)
    return _matrix(fan_in, fan_out, lambda source: source.gauss(0.0, std), rng)


def _finite_scalar(value: float, name: str = "value") -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be finite") from exc
    if not math.isfinite(numeric):
        raise ValueError(f"{name} must be finite")
    return numeric


def sigmoid(x: float) -> float:
    x = _finite_scalar(x, "x")
    if x >= 0.0:
        e = math.exp(-x)
        return 1.0 / (1.0 + e)
    e = math.exp(x)
    return e / (1.0 + e)


def tanh_act(x: float) -> float:
    return math.tanh(_finite_scalar(x, "x"))


def relu(x: float) -> float:
    return max(0.0, _finite_scalar(x, "x"))


def matrix_variance(weights: Sequence[Sequence[float]]) -> float:
    """Population variance of a non-empty rectangular weight matrix."""
    try:
        rows = [list(row) for row in weights]
    except TypeError as exc:
        raise ValueError("weights must be a nonempty rectangular matrix") from exc
    if not rows or not rows[0] or any(len(row) != len(rows[0]) for row in rows):
        raise ValueError("weights must be a nonempty rectangular matrix")
    values = [_finite_scalar(value, "weight") for row in rows for value in row]
    mean = sum(values) / len(values)
    return sum((value - mean) ** 2 for value in values) / len(values)


def forward_deep(
    init_fn: Initializer,
    activation_fn: Callable[[float], float],
    n_layers: int = 20,
    width: int = 16,
    n_samples: int = 32,
    seed: int = 42,
) -> list[float]:
    """Return mean absolute activation per layer for one deterministic fixture."""
    n_layers = _positive_int(n_layers, "n_layers")
    width = _positive_int(width, "width")
    n_samples = _positive_int(n_samples, "n_samples")
    rng = random.Random(seed)
    inputs = [[rng.gauss(0.0, 1.0) for _ in range(width)] for _ in range(n_samples)]
    magnitudes: list[float] = []
    for _ in range(n_layers):
        weights = init_fn(width, width, rng)
        next_inputs = []
        for sample in inputs:
            next_inputs.append([
                activation_fn(sum(weight * value for weight, value in zip(row, sample)))
                for row in weights
            ])
        inputs = next_inputs
        magnitudes.append(sum(abs(value) for sample in inputs for value in sample) / (n_samples * width))
    return magnitudes


def variance_report(fan_in: int = 16, trials: int = 256, seed: int = 7) -> dict[str, tuple[float, float]]:
    fan_in = _positive_int(fan_in, "fan_in")
    trials = _positive_int(trials, "trials")
    rng = random.Random(seed)
    configs = {
        "random_scale_1": 1.0,
        "xavier": math.sqrt(2.0 / (2 * fan_in)),
        "kaiming": math.sqrt(2.0 / fan_in),
    }
    report: dict[str, tuple[float, float]] = {}
    for name, std in configs.items():
        outputs = []
        for _ in range(trials):
            inputs = [rng.gauss(0.0, 1.0) for _ in range(fan_in)]
            weights = [rng.gauss(0.0, std) for _ in range(fan_in)]
            outputs.append(sum(weight * value for weight, value in zip(weights, inputs)))
        mean = sum(outputs) / len(outputs)
        output_variance = sum((value - mean) ** 2 for value in outputs) / len(outputs)
        report[name] = (std * std, output_variance)
    return report


def symmetry_signature() -> dict[str, object]:
    weights = zero_init(2, 4)
    outputs = [sigmoid(sum(weight * value for weight, value in zip(row, (0.5, -0.3)))) for row in weights]
    return {"outputs": outputs, "all_equal": len(set(outputs)) == 1, "unique_rows": len({tuple(row) for row in weights})}


def main() -> None:
    print(f"zero symmetry={symmetry_signature()}")
    print("variance report (weight variance, observed pre-activation variance):")
    for name, values in variance_report().items():
        print(f"  {name}: ({values[0]:.4f}, {values[1]:.4f})")
    configs = (("xavier+sigmoid", xavier_init, sigmoid), ("kaiming+relu", kaiming_init, relu))
    for name, initializer, activation in configs:
        magnitudes = forward_deep(initializer, activation)
        print(f"{name}: layer1={magnitudes[0]:.4f}, layer10={magnitudes[9]:.4f}, layer20={magnitudes[-1]:.4f}")


if __name__ == "__main__":
    main()
