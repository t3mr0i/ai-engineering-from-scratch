# First-order optimizers written from the update equations in the lesson docs.
# Each step validates parameter/gradient shapes and keeps state per optimizer.
# AdamW applies decoupled weight decay after the Adam direction is computed.
# The demo minimizes a one-dimensional quadratic and prints reproducible values.
# See phases/03-deep-learning-core/06-optimizers/docs/en.md.

from __future__ import annotations

import math
from typing import Sequence


def _step_inputs(params: Sequence[float], grads: Sequence[float]) -> tuple[list[float], list[float]]:
    try:
        parameter_count, gradient_count = len(params), len(grads)
    except TypeError as exc:
        raise ValueError("params and grads must be sequences") from exc
    if parameter_count == 0 or parameter_count != gradient_count:
        raise ValueError("params and grads must be nonempty and equally long")
    values, gradients = [float(value) for value in params], [float(value) for value in grads]
    if not all(math.isfinite(value) for value in (*values, *gradients)):
        raise ValueError("params and grads must be finite")
    return values, gradients


def _positive_finite(value: float, name: str) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be a positive finite number") from exc
    if not math.isfinite(numeric) or numeric <= 0:
        raise ValueError(f"{name} must be a positive finite number")
    return numeric


def _unit_interval(value: float, name: str) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be finite and in [0,1)") from exc
    if not math.isfinite(numeric) or not 0 <= numeric < 1:
        raise ValueError(f"{name} must be finite and in [0,1)")
    return numeric


class SGD:
    def __init__(self, lr: float = 0.01) -> None:
        self.lr = _positive_finite(lr, "lr")

    def reset_state(self) -> None:
        return None

    def step(self, params: list[float], grads: Sequence[float]) -> None:
        _, gradients = _step_inputs(params, grads)
        for index, gradient in enumerate(gradients):
            params[index] -= self.lr * gradient


class SGDMomentum:
    def __init__(self, lr: float = 0.01, beta: float = 0.9) -> None:
        self.lr = _positive_finite(lr, "lr")
        self.beta = _unit_interval(beta, "beta")
        self.velocity: list[float] | None = None

    def reset_state(self) -> None:
        self.velocity = None

    def step(self, params: list[float], grads: Sequence[float]) -> None:
        _, gradients = _step_inputs(params, grads)
        if self.velocity is None:
            self.velocity = [0.0] * len(params)
        if len(self.velocity) != len(params):
            raise ValueError("parameter width changed; call reset_state first")
        for index, gradient in enumerate(gradients):
            self.velocity[index] = self.beta * self.velocity[index] + gradient
            params[index] -= self.lr * self.velocity[index]


class Adam:
    def __init__(self, lr: float = 0.001, beta1: float = 0.9, beta2: float = 0.999, epsilon: float = 1e-8) -> None:
        self.lr = _positive_finite(lr, "lr")
        self.beta1 = _unit_interval(beta1, "beta1")
        self.beta2 = _unit_interval(beta2, "beta2")
        self.epsilon = _positive_finite(epsilon, "epsilon")
        self.reset_state()

    def reset_state(self) -> None:
        self.m: list[float] | None = None
        self.v: list[float] | None = None
        self.t = 0

    def step(self, params: list[float], grads: Sequence[float]) -> None:
        directions = self._directions(params, grads)
        for index, direction in enumerate(directions):
            params[index] -= self.lr * direction

    def _directions(self, params: list[float], grads: Sequence[float]) -> list[float]:
        """Update moments and return Adam directions without changing params."""
        _, gradients = _step_inputs(params, grads)
        if self.m is None:
            self.m, self.v = [0.0] * len(params), [0.0] * len(params)
        if self.v is None or len(self.m) != len(params):
            raise ValueError("parameter width changed; call reset_state first")
        self.t += 1
        directions = []
        for index, gradient in enumerate(gradients):
            self.m[index] = self.beta1 * self.m[index] + (1 - self.beta1) * gradient
            self.v[index] = self.beta2 * self.v[index] + (1 - self.beta2) * gradient * gradient
            m_hat = self.m[index] / (1 - self.beta1 ** self.t)
            v_hat = self.v[index] / (1 - self.beta2 ** self.t)
            directions.append(m_hat / (math.sqrt(v_hat) + self.epsilon))
        return directions


class AdamW(Adam):
    def __init__(self, lr: float = 0.001, beta1: float = 0.9, beta2: float = 0.999, epsilon: float = 1e-8, weight_decay: float = 0.01) -> None:
        try:
            weight_decay = float(weight_decay)
        except (TypeError, ValueError) as exc:
            raise ValueError("weight_decay must be finite and nonnegative") from exc
        if not math.isfinite(weight_decay) or weight_decay < 0:
            raise ValueError("weight_decay must be finite and nonnegative")
        super().__init__(lr, beta1, beta2, epsilon)
        self.weight_decay = weight_decay

    def step(self, params: list[float], grads: Sequence[float]) -> None:
        old_params, _ = _step_inputs(params, grads)
        directions = self._directions(params, grads)
        for index, direction in enumerate(directions):
            params[index] = old_params[index] - self.lr * direction - self.lr * self.weight_decay * old_params[index]


def sigmoid(x: float) -> float:
    if x >= 0:
        e = math.exp(-x)
        return 1 / (1 + e)
    e = math.exp(x)
    return e / (1 + e)


def make_circle_data(n: int = 100, seed: int = 42) -> list[tuple[list[float], int]]:
    import random
    if n <= 0:
        raise ValueError("n must be positive")
    rng = random.Random(seed)
    return [
        ([x, y], int(x * x + y * y < 1.0))
        for x, y in ((rng.uniform(-1.5, 1.5), rng.uniform(-1.5, 1.5)) for _ in range(n))
    ]


class OptimizerTestNetwork:
    """A two-parameter quadratic wrapper used by tests and the demo."""

    def __init__(self, optimizer: SGD | SGDMomentum | Adam | AdamW) -> None:
        self.optimizer = optimizer
        self.params = [10.0]

    def train(self, steps: int = 20) -> list[float]:
        if steps <= 0:
            raise ValueError("steps must be positive")
        history = []
        for _ in range(steps):
            gradient = [2.0 * (self.params[0] - 3.0)]
            self.optimizer.step(self.params, gradient)
            history.append((self.params[0] - 3.0) ** 2)
        return history


def bias_correction_demo() -> tuple[float, float]:
    optimizer = Adam(lr=0.1)
    params = [1.0]
    optimizer.step(params, [1.0])
    assert optimizer.m is not None and optimizer.v is not None
    return optimizer.m[0], optimizer.v[0]


def main() -> None:
    for optimizer in (SGD(0.1), SGDMomentum(0.1), Adam(0.1), AdamW(0.1, weight_decay=0.05)):
        model = OptimizerTestNetwork(optimizer)
        history = model.train(100)
        print(f"{type(optimizer).__name__:12s}: x={model.params[0]:.6f}, loss={history[-1]:.6f}")
    raw_m, raw_v = bias_correction_demo()
    print(f"Adam first raw moments: m={raw_m:.4f}, v={raw_v:.4f}; bias-corrected values are 1.0 and 1.0")


if __name__ == "__main__":
    main()
