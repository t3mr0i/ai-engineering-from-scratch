# A from-scratch Python perceptron and a hand-sized sigmoid XOR network.
# The update is w <- w + lr * (target - prediction) * x, with the same error on b.
# Inputs must match the declared width and labels are binary integers.
# This is the Python companion to the stdlib-only Julia entry point.
# See phases/03-deep-learning-core/01-the-perceptron/docs/en.md.

from __future__ import annotations

import math
import random
from typing import Sequence


def _inputs(values: Sequence[float], width: int) -> list[float]:
    try:
        size = len(values)
    except TypeError as exc:
        raise ValueError("inputs must be a finite sequence") from exc
    if size != width:
        raise ValueError(f"expected {width} inputs, got {len(values)}")
    result = [float(value) for value in values]
    if not all(math.isfinite(value) for value in result):
        raise ValueError("inputs must be finite")
    return result


def _label(label: int | float) -> int:
    if label not in (0, 1) or int(label) != label:
        raise ValueError("labels must be integer 0 or 1")
    return int(label)


class Perceptron:
    def __init__(self, n_inputs: int, learning_rate: float = 0.1) -> None:
        if n_inputs <= 0 or learning_rate <= 0 or not math.isfinite(learning_rate):
            raise ValueError("n_inputs and learning_rate must be positive and finite")
        self.weights = [0.0] * n_inputs
        self.bias = 0.0
        self.lr = learning_rate

    def predict(self, inputs: Sequence[float]) -> int:
        values = _inputs(inputs, len(self.weights))
        return int(sum(weight * value for weight, value in zip(self.weights, values)) + self.bias >= 0.0)

    def train(self, training_data: Sequence[tuple[Sequence[float], int]], epochs: int = 100) -> int:
        if not training_data or epochs <= 0:
            raise ValueError("training_data must be nonempty and epochs positive")
        for epoch in range(1, epochs + 1):
            errors = 0
            for inputs, target in training_data:
                values = _inputs(inputs, len(self.weights))
                expected = _label(target)
                error = expected - self.predict(values)
                if error:
                    errors += 1
                    for index, value in enumerate(values):
                        self.weights[index] += self.lr * error * value
                    self.bias += self.lr * error
            if errors == 0:
                return epoch
        return epochs


def xor_network() -> tuple[Perceptron, Perceptron, Perceptron]:
    """Return OR, NAND, AND gates wired into XOR."""
    gates = (Perceptron(2), Perceptron(2), Perceptron(2))
    gates[0].weights, gates[0].bias = [1.0, 1.0], -0.5
    gates[1].weights, gates[1].bias = [-1.0, -1.0], 1.5
    gates[2].weights, gates[2].bias = [1.0, 1.0], -1.5
    return gates


def xor_predict(inputs: Sequence[float]) -> int:
    values = _inputs(inputs, 2)
    gates = xor_network()
    hidden = [gates[0].predict(values), gates[1].predict(values)]
    return gates[2].predict(hidden)


class TwoLayerNetwork:
    """A 2-2-1 sigmoid network trained with online squared-error updates."""

    def __init__(self, learning_rate: float = 1.0, seed: int = 0) -> None:
        if not math.isfinite(float(learning_rate)) or learning_rate <= 0:
            raise ValueError("learning_rate must be positive and finite")
        rng = random.Random(seed)
        self.lr = learning_rate
        self.w_hidden = [[rng.uniform(-1, 1) for _ in range(2)] for _ in range(2)]
        self.b_hidden = [rng.uniform(-1, 1) for _ in range(2)]
        self.w_output = [rng.uniform(-1, 1) for _ in range(2)]
        self.b_output = rng.uniform(-1, 1)

    @staticmethod
    def sigmoid(x: float) -> float:
        if x >= 0:
            e = math.exp(-x)
            return 1 / (1 + e)
        e = math.exp(x)
        return e / (1 + e)

    def forward(self, inputs: Sequence[float]) -> float:
        values = _inputs(inputs, 2)
        self.inputs = values
        self.hidden = [self.sigmoid(sum(weight * value for weight, value in zip(row, values)) + bias) for row, bias in zip(self.w_hidden, self.b_hidden)]
        self.output = self.sigmoid(sum(weight * value for weight, value in zip(self.w_output, self.hidden)) + self.b_output)
        return self.output

    def train(self, data: Sequence[tuple[Sequence[float], int]], epochs: int = 5000) -> list[float]:
        if not data or epochs <= 0:
            raise ValueError("data must be nonempty and epochs positive")
        history = []
        for _ in range(epochs):
            total = 0.0
            for inputs, target in data:
                target = float(_label(target))
                output = self.forward(inputs)
                error = output - target
                total += 0.5 * error * error
                delta_out = error * output * (1 - output)
                old_output_weights = list(self.w_output)
                hidden_delta = [delta_out * old_output_weights[i] * self.hidden[i] * (1 - self.hidden[i]) for i in range(2)]
                for i in range(2):
                    self.w_output[i] -= self.lr * delta_out * self.hidden[i]
                    for j in range(2):
                        self.w_hidden[i][j] -= self.lr * hidden_delta[i] * self.inputs[j]
                    self.b_hidden[i] -= self.lr * hidden_delta[i]
                self.b_output -= self.lr * delta_out
            history.append(total / len(data))
        return history


def main() -> None:
    and_data = [((0, 0), 0), ((0, 1), 0), ((1, 0), 0), ((1, 1), 1)]
    perceptron = Perceptron(2)
    epochs = perceptron.train(and_data)
    print(f"AND converged_epoch={epochs}, predictions={[perceptron.predict(x) for x, _ in and_data]}")
    xor_data = [((0, 0), 0), ((0, 1), 1), ((1, 0), 1), ((1, 1), 0)]
    print(f"hand_wired_xor={[xor_predict(x) for x, _ in xor_data]}")
    network = TwoLayerNetwork(seed=0)
    history = network.train(xor_data, epochs=5000)
    print(f"trained_xor_loss={history[-1]:.6f}, classes={[int(network.forward(x) >= 0.5) for x, _ in xor_data]}")


if __name__ == "__main__":
    main()
