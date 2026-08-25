# A scalar reverse-mode autodiff engine implemented with Python closures.
# The chain-rule traversal and half-squared-error convention are in docs/en.md.
# Leaf parameter gradients can accumulate between calls; intermediate adjoints are per-pass.
# The canonical command trains a bounded 2-4-1 XOR fixture without a framework.
# Source: https://en.wikipedia.org/wiki/Backpropagation

from __future__ import annotations

import math
import random
from typing import Iterable, Sequence


class Value:
    """A scalar with a recorded local derivative and a reverse pass."""

    def __init__(self, data: float, children: Iterable["Value"] = (), op: str = "") -> None:
        if not math.isfinite(float(data)):
            raise ValueError("Value data must be finite")
        self.data = float(data)
        self.grad = 0.0
        self._backward = lambda: None
        self._children = tuple(children)
        self._op = op

    def __repr__(self) -> str:
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f})"

    @staticmethod
    def _coerce(other: float | "Value") -> "Value":
        return other if isinstance(other, Value) else Value(other)

    def __add__(self, other: float | "Value") -> "Value":
        other = self._coerce(other)
        out = Value(self.data + other.data, (self, other), "+")

        def backward() -> None:
            self.grad += out.grad
            other.grad += out.grad

        out._backward = backward
        return out

    __radd__ = __add__

    def __mul__(self, other: float | "Value") -> "Value":
        other = self._coerce(other)
        out = Value(self.data * other.data, (self, other), "*")

        def backward() -> None:
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad

        out._backward = backward
        return out

    __rmul__ = __mul__

    def __neg__(self) -> "Value":
        return self * -1.0

    def __sub__(self, other: float | "Value") -> "Value":
        return self + (-self._coerce(other))

    def __rsub__(self, other: float | "Value") -> "Value":
        return self._coerce(other) + (-self)

    def sigmoid(self) -> "Value":
        if self.data >= 0:
            e = math.exp(-self.data)
            value = 1.0 / (1.0 + e)
        else:
            e = math.exp(self.data)
            value = e / (1.0 + e)
        out = Value(value, (self,), "sigmoid")

        def backward() -> None:
            self.grad += value * (1.0 - value) * out.grad

        out._backward = backward
        return out

    def backward(self) -> None:
        order: list[Value] = []
        visited: set[int] = set()

        def visit(node: Value) -> None:
            if id(node) in visited:
                return
            visited.add(id(node))
            for child in node._children:
                visit(child)
            order.append(node)

        visit(self)
        # Leaves represent parameters/inputs and retain their accumulated gradient.
        # Every non-leaf adjoint is scratch space and must be recomputed for this pass.
        for node in order:
            if node._children:
                node.grad = 0.0
        self.grad += 1.0
        for node in reversed(order):
            node._backward()


def mse_loss(predicted: Value | float, target: Value | float) -> Value:
    """Return 1/2 (prediction-target)^2 so dL/dprediction is the error."""
    difference = (Value(predicted) if not isinstance(predicted, Value) else predicted) - target
    return difference * difference * 0.5


def squared_error(predicted: Value | float, target: Value | float) -> Value:
    return mse_loss(predicted, target)


class Neuron:
    def __init__(self, n_inputs: int, rng: random.Random | None = None) -> None:
        if n_inputs <= 0:
            raise ValueError("n_inputs must be positive")
        source = rng or random.Random()
        scale = math.sqrt(2.0 / n_inputs)
        self.weights = [Value(source.uniform(-scale, scale)) for _ in range(n_inputs)]
        self.bias = Value(0.0)

    def __call__(self, inputs: Sequence[Value]) -> Value:
        if len(inputs) != len(self.weights):
            raise ValueError(f"expected {len(self.weights)} inputs, got {len(inputs)}")
        activation = self.bias
        for weight, value in zip(self.weights, inputs):
            activation = activation + weight * value
        return activation.sigmoid()

    def parameters(self) -> list[Value]:
        return [*self.weights, self.bias]


class Layer:
    def __init__(self, n_inputs: int, n_outputs: int, rng: random.Random | None = None) -> None:
        if n_outputs <= 0:
            raise ValueError("n_outputs must be positive")
        self.neurons = [Neuron(n_inputs, rng) for _ in range(n_outputs)]

    def __call__(self, inputs: Sequence[Value]) -> Value | list[Value]:
        outputs = [neuron(inputs) for neuron in self.neurons]
        return outputs[0] if len(outputs) == 1 else outputs

    def parameters(self) -> list[Value]:
        return [parameter for neuron in self.neurons for parameter in neuron.parameters()]


class Network:
    def __init__(self, sizes: Sequence[int], seed: int = 42) -> None:
        if len(sizes) < 2 or any(size <= 0 for size in sizes):
            raise ValueError("sizes must contain at least two positive widths")
        rng = random.Random(seed)
        self.layers = [Layer(left, right, rng) for left, right in zip(sizes, sizes[1:])]

    def __call__(self, inputs: Sequence[Value]) -> Value | list[Value]:
        if len(inputs) != len(self.layers[0].neurons[0].weights):
            raise ValueError("input width does not match network")
        current: Value | list[Value] = list(inputs)
        for layer in self.layers:
            current = layer(current if isinstance(current, list) else [current])
        return current

    def parameters(self) -> list[Value]:
        return [parameter for layer in self.layers for parameter in layer.parameters()]

    def zero_grad(self) -> None:
        for parameter in self.parameters():
            parameter.grad = 0.0


def train_xor(epochs: int = 400, learning_rate: float = 1.0) -> Network:
    if epochs <= 0 or learning_rate <= 0:
        raise ValueError("epochs and learning_rate must be positive")
    network = Network((2, 4, 1), seed=42)
    data = (((0.0, 0.0), 0.0), ((0.0, 1.0), 1.0), ((1.0, 0.0), 1.0), ((1.0, 1.0), 0.0))
    for _ in range(epochs):
        total = Value(0.0)
        for inputs, target in data:
            prediction = network([Value(value) for value in inputs])
            total = total + squared_error(prediction, target)
        network.zero_grad()
        total.backward()
        for parameter in network.parameters():
            parameter.data -= learning_rate * parameter.grad
    return network


def main() -> None:
    network = train_xor()
    print("reverse-mode autodiff XOR")
    for inputs, target in (((0.0, 0.0), 0), ((0.0, 1.0), 1), ((1.0, 0.0), 1), ((1.0, 1.0), 0)):
        prediction = network([Value(value) for value in inputs])
        assert isinstance(prediction, Value)
        print(f"  {list(inputs)} -> {prediction.data:.4f} (class={int(prediction.data >= 0.5)}, target={target})")


if __name__ == "__main__":
    main()
