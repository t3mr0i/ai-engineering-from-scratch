# Activation functions and their local derivatives, implemented with stdlib math.
# The paired functions use the same convention: derivatives take the pre-activation.
# The lesson's docs explain saturation, dead ReLU units, and stable softmax.
# No framework or plotting dependency is required for the executable experiment.
# See phases/03-deep-learning-core/04-activation-functions/docs/en.md.

from __future__ import annotations

import math
import random
from typing import Callable, Sequence


def _finite(x: float) -> float:
    value = float(x)
    if not math.isfinite(value):
        raise ValueError("activation input must be finite")
    return value


def sigmoid(x: float) -> float:
    x = _finite(x)
    if x >= 0:
        e = math.exp(-x)
        return 1.0 / (1.0 + e)
    e = math.exp(x)
    return e / (1.0 + e)


def sigmoid_derivative(x: float) -> float:
    s = sigmoid(x)
    return s * (1.0 - s)


def tanh_act(x: float) -> float:
    return math.tanh(_finite(x))


def tanh_derivative(x: float) -> float:
    t = tanh_act(x)
    return 1.0 - t * t


def relu(x: float) -> float:
    return max(0.0, _finite(x))


def relu_derivative(x: float) -> float:
    return 1.0 if _finite(x) > 0.0 else 0.0


def leaky_relu(x: float, alpha: float = 0.01) -> float:
    x = _finite(x)
    if not 0.0 < alpha <= 1.0 or not math.isfinite(alpha):
        raise ValueError("alpha must be finite and in (0, 1]")
    return x if x > 0 else alpha * x


def leaky_relu_derivative(x: float, alpha: float = 0.01) -> float:
    _ = leaky_relu(x, alpha)
    return 1.0 if x > 0 else alpha


def gelu(x: float) -> float:
    x = _finite(x)
    return 0.5 * x * (1.0 + math.erf(x / math.sqrt(2.0)))


def gelu_derivative(x: float) -> float:
    x = _finite(x)
    cdf = 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))
    pdf = math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)
    return cdf + x * pdf


def swish(x: float) -> float:
    x = _finite(x)
    return x * sigmoid(x)


def swish_derivative(x: float) -> float:
    x = _finite(x)
    s = sigmoid(x)
    return s + x * s * (1.0 - s)


def softmax(xs: Sequence[float]) -> list[float]:
    if not xs:
        raise ValueError("softmax needs at least one logit")
    logits = [_finite(x) for x in xs]
    maximum = max(logits)
    exponentials = [math.exp(x - maximum) for x in logits]
    total = sum(exponentials)
    return [value / total for value in exponentials]


def gradient_scan(name: str, derivative_fn: Callable[[float], float], start: float = -5.0, end: float = 5.0, n: int = 100) -> dict[str, float | int | str]:
    if n <= 0 or end <= start:
        raise ValueError("gradient scan needs n>0 and end>start")
    near_zero = sum(abs(derivative_fn(start + i * (end - start) / n)) < 0.01 for i in range(n))
    result = {"name": name, "healthy": n - near_zero, "near_zero": near_zero, "dead_percent": near_zero / n * 100.0}
    print(f"{name:12s}: healthy={result['healthy']:3d}, near_zero={near_zero:3d}")
    return result


def vanishing_gradient_experiment(activation_fn: Callable[[float], float], derivative_fn: Callable[[float], float], n_layers: int = 10, seed: int = 42) -> list[float]:
    if n_layers <= 0:
        raise ValueError("n_layers must be positive")
    rng = random.Random(seed)
    signal = 1.0
    chain = 1.0
    values = []
    for _ in range(n_layers):
        z = rng.gauss(0.0, 1.0) * signal
        signal = activation_fn(z)
        chain *= abs(derivative_fn(z))
        values.append(chain)
    return values


def dead_neuron_detector(n_inputs: int = 2, hidden_size: int = 8, n_samples: int = 200, seed: int = 0) -> dict[str, int]:
    if n_inputs <= 0 or hidden_size <= 0 or n_samples <= 0:
        raise ValueError("detector dimensions must be positive")
    rng = random.Random(seed)
    weights = [[rng.gauss(0, 1) for _ in range(n_inputs)] for _ in range(hidden_size)]
    biases = [rng.gauss(0, 1) for _ in range(hidden_size)]
    fired = [0] * hidden_size
    for _ in range(n_samples):
        x = [rng.gauss(0, 1) for _ in range(n_inputs)]
        for i, row in enumerate(weights):
            if relu(sum(w * value for w, value in zip(row, x)) + biases[i]) > 0:
                fired[i] += 1
    return {"dead": sum(value == 0 for value in fired), "healthy": sum(value > 0 for value in fired), "neurons": hidden_size}


def make_circle_data(n: int = 200, seed: int = 42) -> list[tuple[list[float], float]]:
    if n <= 0:
        raise ValueError("n must be positive")
    rng = random.Random(seed)
    return [
        ([x, y], float(x * x + y * y < 1.5))
        for x, y in ((rng.uniform(-2, 2), rng.uniform(-2, 2)) for _ in range(n))
    ]


class ActivationNetwork:
    """One hidden layer used to compare activation choices on a toy circle."""

    def __init__(self, activation_fn: Callable[[float], float], activation_deriv: Callable[[float], float], hidden_size: int = 8, lr: float = 0.1, seed: int = 0) -> None:
        if hidden_size <= 0 or not math.isfinite(float(lr)) or lr <= 0:
            raise ValueError("hidden_size must be positive and lr must be finite and positive")
        self.activation, self.derivative = activation_fn, activation_deriv
        self.hidden_size, self.lr = hidden_size, lr
        rng = random.Random(seed)
        self.w1 = [[rng.gauss(0, 0.5) for _ in range(2)] for _ in range(hidden_size)]
        self.b1 = [0.0] * hidden_size
        self.w2 = [rng.gauss(0, 0.5) for _ in range(hidden_size)]
        self.b2 = 0.0

    def forward(self, x: Sequence[float]) -> float:
        if len(x) != 2 or not all(math.isfinite(float(value)) for value in x):
            raise ValueError("network inputs must be two finite numbers")
        self.x = list(map(float, x))
        self.z1 = [sum(w * value for w, value in zip(row, self.x)) + b for row, b in zip(self.w1, self.b1)]
        self.h = [self.activation(z) for z in self.z1]
        self.out = sigmoid(sum(w * h for w, h in zip(self.w2, self.h)) + self.b2)
        return self.out

    def train(self, data: Sequence[tuple[Sequence[float], float]], epochs: int = 100) -> list[float]:
        if not data or epochs <= 0:
            raise ValueError("data must be nonempty and epochs positive")
        history = []
        for _ in range(epochs):
            total = 0.0
            for x, target in data:
                if target not in (0, 1):
                    raise ValueError("targets must be 0 or 1")
                prediction = self.forward(x)
                error = prediction - target
                total += error * error
                delta_out = error * prediction * (1 - prediction)
                old_w2 = list(self.w2)
                for i in range(self.hidden_size):
                    delta_h = delta_out * old_w2[i] * self.derivative(self.z1[i])
                    self.w2[i] -= self.lr * delta_out * self.h[i]
                    for j in range(2):
                        self.w1[i][j] -= self.lr * delta_h * self.x[j]
                    self.b1[i] -= self.lr * delta_h
                self.b2 -= self.lr * delta_out
            history.append(total / len(data))
        return history


def main() -> None:
    print("activation values at x=-2, 0, 2")
    for x in (-2.0, 0.0, 2.0):
        print(f"x={x:g} sigmoid={sigmoid(x):.4f} relu={relu(x):.4f} gelu={gelu(x):.4f}")
    probs = softmax((2.0, 1.0, 0.0))
    print(f"softmax([2,1,0])={[round(value, 4) for value in probs]}, sum={sum(probs):.4f}")
    print(f"dead-neuron summary={dead_neuron_detector()}")
    data = make_circle_data(80)
    network = ActivationNetwork(relu, relu_derivative, seed=7)
    history = network.train(data, epochs=30)
    print(f"relu circle mse: {history[0]:.4f} -> {history[-1]:.4f}")


if __name__ == "__main__":
    main()
