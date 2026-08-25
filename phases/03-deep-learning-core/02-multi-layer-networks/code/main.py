# A small dense network built from Python lists and scalar sigmoid operations.
# Layer and Network shape contracts are explained in the lesson's docs/en.md.
# The hand-tuned 2-2-1 fixture exposes XOR without a framework shortcut.
# The canonical command is a bounded, deterministic forward-pass demo.
# Sources: Rosenblatt's perceptron model and the lesson's local derivation.

from __future__ import annotations

import math
import random
from typing import Iterable, Sequence


def _finite_vector(values: Sequence[float], expected: int, name: str) -> list[float]:
    try:
        size = len(values)
    except TypeError as exc:
        raise ValueError(f"{name} must be a sequence") from exc
    if size != expected:
        raise ValueError(f"{name} must contain {expected} values, got {size}")
    result = [float(value) for value in values]
    if not all(math.isfinite(value) for value in result):
        raise ValueError(f"{name} must contain finite numbers")
    return result


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def sigmoid(x: float) -> float:
    """Numerically safe logistic sigmoid for a scalar."""
    if not math.isfinite(x):
        raise ValueError("sigmoid input must be finite")
    if x >= 0:
        e = math.exp(-x)
        return 1.0 / (1.0 + e)
    e = math.exp(x)
    return e / (1.0 + e)


class Layer:
    """One fully connected sigmoid layer with shape checks."""

    def __init__(
        self,
        n_inputs: int,
        n_neurons: int,
        weights: Sequence[Sequence[float]] | None = None,
        biases: Sequence[float] | None = None,
        rng: random.Random | None = None,
    ) -> None:
        self.n_inputs = _positive_int(n_inputs, "n_inputs")
        self.n_neurons = _positive_int(n_neurons, "n_neurons")
        source = rng or random.Random()
        if weights is None:
            scale = math.sqrt(2.0 / self.n_inputs)
            self.weights = [
                [source.uniform(-scale, scale) for _ in range(self.n_inputs)]
                for _ in range(self.n_neurons)
            ]
        else:
            if len(weights) != self.n_neurons or any(len(row) != self.n_inputs for row in weights):
                raise ValueError("weights must have shape (n_neurons, n_inputs)")
            self.weights = [
                _finite_vector(row, self.n_inputs, "weight row") for row in weights
            ]
        if biases is None:
            self.biases = [0.0] * self.n_neurons
        else:
            self.biases = _finite_vector(biases, self.n_neurons, "biases")
        self.last_input: list[float] | None = None
        self.last_output: list[float] | None = None

    def forward(self, inputs: Sequence[float]) -> list[float]:
        values = _finite_vector(inputs, self.n_inputs, "inputs")
        self.last_input = values
        self.last_output = [
            sigmoid(sum(weight * value for weight, value in zip(row, values)) + bias)
            for row, bias in zip(self.weights, self.biases)
        ]
        return list(self.last_output)


class Network:
    """Sequential composition of dense sigmoid layers."""

    def __init__(self, layers: Iterable[Layer]) -> None:
        self.layers = list(layers)
        if not self.layers:
            raise ValueError("a network needs at least one layer")
        for previous, current in zip(self.layers, self.layers[1:]):
            if previous.n_neurons != current.n_inputs:
                raise ValueError("adjacent layer dimensions do not match")

    def forward(self, inputs: Sequence[float]) -> list[float]:
        current = list(inputs)
        for layer in self.layers:
            current = layer.forward(current)
        return current

    def count_parameters(self) -> int:
        return sum(
            layer.n_inputs * layer.n_neurons + layer.n_neurons
            for layer in self.layers
        )


def xor_network() -> Network:
    """Return the hand-tuned 2-2-1 sigmoid network used by the demo."""
    hidden = Layer(
        2,
        2,
        weights=((20.0, 20.0), (-20.0, -20.0)),
        biases=(-10.0, 30.0),
    )
    output = Layer(2, 1, weights=((20.0, 20.0),), biases=(-30.0,))
    return Network((hidden, output))


def xor_predictions(network: Network | None = None) -> list[int]:
    network = network or xor_network()
    return [
        int(network.forward(point)[0] >= 0.5)
        for point in ((0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0))
    ]


def parameter_count(sizes: Sequence[int]) -> int:
    if len(sizes) < 2 or any(isinstance(size, bool) or not isinstance(size, int) or size <= 0 for size in sizes):
        raise ValueError("sizes must contain at least two positive integers")
    return sum(left * right + right for left, right in zip(sizes, sizes[1:]))


def main() -> None:
    network = xor_network()
    points = ((0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0))
    print("2-2-1 sigmoid network for XOR")
    for point in points:
        probability = network.forward(point)[0]
        print(
            f"  {list(point)} -> probability={probability:.6f}, "
            f"class={int(probability >= 0.5)}"
        )
    print(f"parameters={network.count_parameters()}")
    print(f"784-256-128-10 parameters={parameter_count((784, 256, 128, 10))}")


if __name__ == "__main__":
    main()
