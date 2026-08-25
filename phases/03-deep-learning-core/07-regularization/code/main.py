# Regularization primitives implemented from scratch with Python's standard library.
# Dropout has explicit training/evaluation modes; normalization layers check shapes.
# L2 returns lambda/2 * sum(w**2), whose gradient is lambda*w.
# The final toy network is deliberately small so the train/eval distinction is visible.
# See phases/03-deep-learning-core/07-regularization/docs/en.md.

from __future__ import annotations

import math
import random
from typing import Sequence


def _vector(values: Sequence[float], expected: int | None = None, name: str = "values") -> list[float]:
    try:
        size = len(values)
    except TypeError as exc:
        raise ValueError(f"{name} must be a sequence") from exc
    if expected is not None and size != expected:
        raise ValueError(f"{name} must have length {expected}")
    result = [float(value) for value in values]
    if not all(math.isfinite(value) for value in result):
        raise ValueError(f"{name} must be finite")
    return result


class Dropout:
    def __init__(self, p: float = 0.5, seed: int | None = None) -> None:
        if not math.isfinite(p) or not 0.0 <= p < 1.0:
            raise ValueError("dropout p must be in [0,1)")
        self.p = p
        self.training = True
        self.mask: list[int] | None = None
        self._last_training = False
        self.rng = random.Random(seed)

    def forward(self, x: Sequence[float], training: bool | None = None) -> list[float]:
        values = _vector(x, name="dropout input")
        use_training = self.training if training is None else training
        self._last_training = bool(use_training and self.p > 0.0)
        if not use_training or self.p == 0.0:
            self.mask = [1] * len(values)
            return values
        self.mask = [0 if self.rng.random() < self.p else 1 for _ in values]
        scale = 1.0 / (1.0 - self.p)
        return [value * scale if keep else 0.0 for value, keep in zip(values, self.mask)]

    def backward(self, grad_output: Sequence[float]) -> list[float]:
        if self.mask is None:
            raise RuntimeError("forward must run before backward")
        gradients = _vector(grad_output, len(self.mask), "grad_output")
        if not self._last_training:
            return gradients
        scale = 1.0 / (1.0 - self.p)
        return [gradient * scale if keep else 0.0 for gradient, keep in zip(gradients, self.mask)]


def l2_regularization(weights: Sequence[float], lambda_reg: float) -> float:
    values = _vector(weights, name="weights")
    if lambda_reg < 0 or not math.isfinite(lambda_reg):
        raise ValueError("lambda_reg must be finite and nonnegative")
    return 0.5 * lambda_reg * sum(value * value for value in values)


def l2_gradient(weights: Sequence[float], lambda_reg: float) -> list[float]:
    values = _vector(weights, name="weights")
    if lambda_reg < 0 or not math.isfinite(lambda_reg):
        raise ValueError("lambda_reg must be finite and nonnegative")
    return [lambda_reg * value for value in values]


class BatchNorm:
    def __init__(self, num_features: int, momentum: float = 0.1, eps: float = 1e-5) -> None:
        if num_features <= 0 or not math.isfinite(float(momentum)) or not 0.0 <= momentum < 1.0 or not math.isfinite(float(eps)) or eps <= 0:
            raise ValueError("invalid BatchNorm parameters")
        self.num_features, self.momentum, self.eps = num_features, momentum, eps
        self.gamma = [1.0] * num_features
        self.beta = [0.0] * num_features
        self.running_mean = [0.0] * num_features
        self.running_var = [1.0] * num_features
        self.training = True

    def forward(self, batch: Sequence[Sequence[float]], training: bool | None = None) -> list[list[float]]:
        if not batch:
            raise ValueError("BatchNorm needs a nonempty batch")
        rows = [_vector(row, self.num_features, "batch row") for row in batch]
        use_training = self.training if training is None else training
        if use_training:
            mean = [sum(row[j] for row in rows) / len(rows) for j in range(self.num_features)]
            variance = [sum((row[j] - mean[j]) ** 2 for row in rows) / len(rows) for j in range(self.num_features)]
            self.running_mean = [(1 - self.momentum) * old + self.momentum * new for old, new in zip(self.running_mean, mean)]
            self.running_var = [(1 - self.momentum) * old + self.momentum * new for old, new in zip(self.running_var, variance)]
        else:
            mean, variance = self.running_mean, self.running_var
        return [[self.gamma[j] * (row[j] - mean[j]) / math.sqrt(variance[j] + self.eps) + self.beta[j] for j in range(self.num_features)] for row in rows]


class LayerNorm:
    def __init__(self, num_features: int, eps: float = 1e-5) -> None:
        if num_features <= 0 or not math.isfinite(float(eps)) or eps <= 0:
            raise ValueError("invalid LayerNorm parameters")
        self.num_features, self.eps = num_features, eps
        self.gamma, self.beta = [1.0] * num_features, [0.0] * num_features

    def forward(self, x: Sequence[float]) -> list[float]:
        values = _vector(x, self.num_features, "LayerNorm input")
        mean = sum(values) / self.num_features
        variance = sum((value - mean) ** 2 for value in values) / self.num_features
        return [self.gamma[j] * (values[j] - mean) / math.sqrt(variance + self.eps) + self.beta[j] for j in range(self.num_features)]


class RMSNorm:
    def __init__(self, num_features: int, eps: float = 1e-6) -> None:
        if num_features <= 0 or not math.isfinite(float(eps)) or eps <= 0:
            raise ValueError("invalid RMSNorm parameters")
        self.num_features, self.eps = num_features, eps
        self.gamma = [1.0] * num_features

    def forward(self, x: Sequence[float]) -> list[float]:
        values = _vector(x, self.num_features, "RMSNorm input")
        rms = math.sqrt(sum(value * value for value in values) / self.num_features + self.eps)
        return [self.gamma[j] * values[j] / rms for j in range(self.num_features)]


def sigmoid(x: float) -> float:
    if x >= 0:
        e = math.exp(-x)
        return 1 / (1 + e)
    e = math.exp(x)
    return e / (1 + e)


def make_circle_data(n: int = 200, seed: int = 42) -> list[tuple[list[float], float]]:
    if n <= 0:
        raise ValueError("n must be positive")
    rng = random.Random(seed)
    return [
        ([x, y], float(x * x + y * y < 1.5))
        for x, y in ((rng.uniform(-2, 2), rng.uniform(-2, 2)) for _ in range(n))
    ]


class RegularizedNetwork:
    def __init__(self, hidden_size: int = 8, lr: float = 0.05, dropout_p: float = 0.0, weight_decay: float = 0.0, seed: int = 0) -> None:
        if hidden_size <= 0 or not math.isfinite(float(lr)) or lr <= 0 or not math.isfinite(float(weight_decay)) or weight_decay < 0:
            raise ValueError("invalid network hyperparameters")
        self.hidden_size, self.lr, self.weight_decay = hidden_size, lr, weight_decay
        rng = random.Random(seed)
        self.dropout = Dropout(dropout_p, seed + 1)
        self.w1 = [[rng.gauss(0, 0.5) for _ in range(2)] for _ in range(hidden_size)]
        self.b1 = [0.0] * hidden_size
        self.w2 = [rng.gauss(0, 0.5) for _ in range(hidden_size)]
        self.b2 = 0.0

    def forward(self, x: Sequence[float], training: bool = False) -> float:
        self.x = _vector(x, 2, "network input")
        self.z1 = [sum(w * value for w, value in zip(row, self.x)) + bias for row, bias in zip(self.w1, self.b1)]
        self.h_raw = [max(0.0, z) for z in self.z1]
        self.h = self.dropout.forward(self.h_raw, training=training)
        self.out = sigmoid(sum(weight * value for weight, value in zip(self.w2, self.h)) + self.b2)
        return self.out

    def evaluate(self, data: Sequence[tuple[Sequence[float], int]]) -> tuple[float, float]:
        if not data:
            raise ValueError("evaluation data must be nonempty")
        losses, correct = 0.0, 0
        for x, target in data:
            if target not in (0, 1):
                raise ValueError("targets must be 0 or 1")
            prediction = self.forward(x, training=False)
            losses += -(target * math.log(max(1e-15, prediction)) + (1 - target) * math.log(max(1e-15, 1 - prediction)))
            correct += int((prediction >= 0.5) == bool(target))
        return losses / len(data), 100.0 * correct / len(data)

    def train_model(self, data: Sequence[tuple[Sequence[float], int]], epochs: int = 20) -> list[tuple[float, float]]:
        if not data or epochs <= 0:
            raise ValueError("training data must be nonempty and epochs positive")
        history: list[tuple[float, float]] = []
        for _ in range(epochs):
            total_loss, correct = 0.0, 0
            for x, target in data:
                if target not in (0, 1):
                    raise ValueError("targets must be 0 or 1")
                prediction = self.forward(x, training=True)
                total_loss += -(target * math.log(max(1e-15, prediction)) + (1 - target) * math.log(max(1e-15, 1 - prediction)))
                correct += int((prediction >= 0.5) == bool(target))
                d_out = prediction - target
                d_hidden = self.dropout.backward([d_out * weight for weight in self.w2])
                old_w2 = list(self.w2)
                for index in range(self.hidden_size):
                    d_relu = 1.0 if self.z1[index] > 0 else 0.0
                    d_z1 = d_hidden[index] * d_relu
                    self.w2[index] -= self.lr * (d_out * self.h[index] + self.weight_decay * self.w2[index])
                    for feature in range(2):
                        self.w1[index][feature] -= self.lr * (d_z1 * self.x[feature] + self.weight_decay * self.w1[index][feature])
                    self.b1[index] -= self.lr * d_z1
                self.b2 -= self.lr * d_out
            history.append((total_loss / len(data), 100.0 * correct / len(data)))
        return history


def main() -> None:
    values = [1.0, 2.0, 3.0, 4.0]
    drop = Dropout(0.5, seed=42)
    train_values = drop.forward(values, training=True)
    eval_values = drop.forward(values, training=False)
    print(f"dropout train={train_values} eval={eval_values}")
    weights = [3.0, -4.0]
    print(f"l2 penalty={l2_regularization(weights, 0.1):.3f}, gradient={l2_gradient(weights, 0.1)}")
    sample = [2.0, 4.0, 6.0, 8.0]
    print(f"layer norm={LayerNorm(4).forward(sample)}")
    print(f"rms norm={RMSNorm(4).forward(sample)}")
    network = RegularizedNetwork(seed=7, dropout_p=0.2, weight_decay=0.01)
    history = network.train_model(make_circle_data(20), epochs=5)
    loss, accuracy = network.evaluate(make_circle_data(20))
    print(f"regularized circle train_loss={history[-1][0]:.4f}, eval_loss={loss:.4f}, eval_accuracy={accuracy:.1f}%")


if __name__ == "__main__":
    main()
