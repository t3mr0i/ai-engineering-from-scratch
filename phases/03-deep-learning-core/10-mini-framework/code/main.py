# A tiny list-based neural-network framework with explicit forward/backward contracts.
# Modules own training/evaluation state; Parameter objects own data and accumulated gradients.
# The XOR fixture exercises Linear, Tanh, Sigmoid, Sequential, MSELoss, SGD, and DataLoader.
# See phases/03-deep-learning-core/10-mini-framework/docs/en.md.

from __future__ import annotations

import math
import random
from typing import Iterable, Iterator, Sequence


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def _finite(value: float, name: str = "value") -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be finite") from exc
    if not math.isfinite(numeric):
        raise ValueError(f"{name} must be finite")
    return numeric


def _vector(values: Sequence[float], expected: int | None = None, name: str = "vector") -> list[float]:
    try:
        result = [_finite(value, name) for value in values]
    except TypeError as exc:
        raise ValueError(f"{name} must be a sequence") from exc
    if not result:
        raise ValueError(f"{name} must be nonempty")
    if expected is not None and len(result) != expected:
        raise ValueError(f"{name} must have length {expected}")
    return result


class Parameter:
    def __init__(self, data: float, grad: float = 0.0, name: str = "") -> None:
        self.data = _finite(data, "parameter data")
        self.grad = _finite(grad, "parameter gradient")
        self.name = name


class Module:
    def __init__(self) -> None:
        self.training = True

    def forward(self, x: Sequence[float]) -> list[float]:
        raise NotImplementedError

    def backward(self, grad: Sequence[float]) -> list[float]:
        raise NotImplementedError

    def parameters(self) -> list[Parameter]:
        return []

    def train(self) -> "Module":
        self.training = True
        return self

    def eval(self) -> "Module":
        self.training = False
        return self


class Linear(Module):
    def __init__(self, fan_in: int, fan_out: int, seed: int = 0) -> None:
        super().__init__()
        self.fan_in = _positive_int(fan_in, "fan_in")
        self.fan_out = _positive_int(fan_out, "fan_out")
        rng = random.Random(seed)
        std = math.sqrt(2.0 / self.fan_in)
        self.weights = [[Parameter(rng.gauss(0.0, std), name=f"weight[{i},{j}]") for j in range(self.fan_in)] for i in range(self.fan_out)]
        self.biases = [Parameter(0.0, name=f"bias[{i}]") for i in range(self.fan_out)]
        self._input: list[float] | None = None

    def forward(self, x: Sequence[float]) -> list[float]:
        values = _vector(x, self.fan_in, "Linear input")
        self._input = values
        return [
            sum(self.weights[i][j].data * values[j] for j in range(self.fan_in)) + self.biases[i].data
            for i in range(self.fan_out)
        ]

    def backward(self, grad: Sequence[float]) -> list[float]:
        if self._input is None:
            raise RuntimeError("Linear.backward requires a preceding forward")
        upstream = _vector(grad, self.fan_out, "Linear gradient")
        input_grad = [0.0] * self.fan_in
        for i, value in enumerate(upstream):
            self.biases[i].grad += value
            for j, coordinate in enumerate(self._input):
                self.weights[i][j].grad += value * coordinate
                input_grad[j] += value * self.weights[i][j].data
        return input_grad

    def parameters(self) -> list[Parameter]:
        return [parameter for row in self.weights for parameter in row] + list(self.biases)


class ReLU(Module):
    def __init__(self) -> None:
        super().__init__()
        self._mask: list[float] | None = None

    def forward(self, x: Sequence[float]) -> list[float]:
        values = _vector(x, name="ReLU input")
        self._mask = [1.0 if value > 0.0 else 0.0 for value in values]
        return [value if value > 0.0 else 0.0 for value in values]

    def backward(self, grad: Sequence[float]) -> list[float]:
        if self._mask is None:
            raise RuntimeError("ReLU.backward requires a preceding forward")
        upstream = _vector(grad, len(self._mask), "ReLU gradient")
        return [value * mask for value, mask in zip(upstream, self._mask)]


class Tanh(Module):
    def __init__(self) -> None:
        super().__init__()
        self._output: list[float] | None = None

    def forward(self, x: Sequence[float]) -> list[float]:
        values = _vector(x, name="Tanh input")
        self._output = [math.tanh(value) for value in values]
        return list(self._output)

    def backward(self, grad: Sequence[float]) -> list[float]:
        if self._output is None:
            raise RuntimeError("Tanh.backward requires a preceding forward")
        upstream = _vector(grad, len(self._output), "Tanh gradient")
        return [value * (1.0 - output * output) for value, output in zip(upstream, self._output)]


class Sigmoid(Module):
    def __init__(self) -> None:
        super().__init__()
        self._output: list[float] | None = None

    def forward(self, x: Sequence[float]) -> list[float]:
        values = _vector(x, name="Sigmoid input")
        output = []
        for value in values:
            e = math.exp(-value) if value >= 0.0 else math.exp(value)
            output.append(1.0 / (1.0 + e) if value >= 0.0 else e / (1.0 + e))
        self._output = output
        return list(output)

    def backward(self, grad: Sequence[float]) -> list[float]:
        if self._output is None:
            raise RuntimeError("Sigmoid.backward requires a preceding forward")
        upstream = _vector(grad, len(self._output), "Sigmoid gradient")
        return [value * output * (1.0 - output) for value, output in zip(upstream, self._output)]


class Dropout(Module):
    def __init__(self, p: float = 0.5, seed: int = 0) -> None:
        super().__init__()
        p = _finite(p, "dropout probability")
        if not 0.0 <= p < 1.0:
            raise ValueError("dropout probability must be in [0,1)")
        self.p = p
        self._rng = random.Random(seed)
        self._mask: list[float] | None = None

    def forward(self, x: Sequence[float]) -> list[float]:
        values = _vector(x, name="Dropout input")
        if not self.training or self.p == 0.0:
            self._mask = [1.0] * len(values)
            return values
        scale = 1.0 / (1.0 - self.p)
        self._mask = [0.0 if self._rng.random() < self.p else scale for _ in values]
        return [value * mask for value, mask in zip(values, self._mask)]

    def backward(self, grad: Sequence[float]) -> list[float]:
        if self._mask is None:
            raise RuntimeError("Dropout.backward requires a preceding forward")
        upstream = _vector(grad, len(self._mask), "Dropout gradient")
        return [value * mask for value, mask in zip(upstream, self._mask)]


class Sequential(Module):
    def __init__(self, *modules: Module) -> None:
        super().__init__()
        if not modules:
            raise ValueError("Sequential needs at least one module")
        self.modules = list(modules)

    def forward(self, x: Sequence[float]) -> list[float]:
        current = list(x)
        for module in self.modules:
            current = module.forward(current)
        return current

    def backward(self, grad: Sequence[float]) -> list[float]:
        current = list(grad)
        for module in reversed(self.modules):
            current = module.backward(current)
        return current

    def parameters(self) -> list[Parameter]:
        return [parameter for module in self.modules for parameter in module.parameters()]

    def train(self) -> "Sequential":
        self.training = True
        for module in self.modules:
            module.train()
        return self

    def eval(self) -> "Sequential":
        self.training = False
        for module in self.modules:
            module.eval()
        return self


class MSELoss:
    def __init__(self) -> None:
        self._predicted: list[float] | None = None
        self._target: list[float] | None = None

    def __call__(self, predicted: Sequence[float], target: Sequence[float]) -> float:
        values = _vector(predicted, name="predicted")
        targets = _vector(target, len(values), "target")
        self._predicted, self._target = values, targets
        return sum((value - goal) ** 2 for value, goal in zip(values, targets)) / len(values)

    def backward(self) -> list[float]:
        if self._predicted is None or self._target is None:
            raise RuntimeError("MSELoss.backward requires a preceding loss call")
        return [2.0 * (value - goal) / len(self._predicted) for value, goal in zip(self._predicted, self._target)]


class SGD:
    def __init__(self, parameters: Iterable[Parameter], lr: float = 0.1) -> None:
        self.params = list(parameters)
        if not self.params:
            raise ValueError("SGD needs at least one parameter")
        self.lr = _finite(lr, "learning rate")
        if self.lr <= 0.0:
            raise ValueError("learning rate must be positive")

    def zero_grad(self) -> None:
        for parameter in self.params:
            parameter.grad = 0.0

    def step(self) -> None:
        for parameter in self.params:
            if not math.isfinite(parameter.grad):
                raise ValueError("parameter gradients must be finite")
            parameter.data -= self.lr * parameter.grad


class DataLoader:
    def __init__(self, data: Sequence[tuple[Sequence[float], int]], batch_size: int = 1, shuffle: bool = False, seed: int = 0) -> None:
        if not data:
            raise ValueError("DataLoader needs nonempty data")
        parsed: list[tuple[tuple[float, ...], int]] = []
        for index, row in enumerate(data):
            if not isinstance(row, (tuple, list)) or len(row) != 2:
                raise ValueError(f"data row {index} must be (features, binary_label)")
            features, label = row
            if isinstance(label, bool) or not isinstance(label, int) or label not in (0, 1):
                raise ValueError(f"data row {index} label must be integer 0 or 1")
            parsed.append((tuple(_vector(features, name=f"data row {index} features")), label))
        self.data = parsed
        self.batch_size = _positive_int(batch_size, "batch_size")
        self.shuffle = bool(shuffle)
        self.seed = seed
        self._epoch = 0

    def __iter__(self) -> Iterator[list[tuple[tuple[float, ...], int]]]:
        indices = list(range(len(self.data)))
        if self.shuffle:
            random.Random(self.seed + self._epoch).shuffle(indices)
        self._epoch += 1
        for start in range(0, len(indices), self.batch_size):
            yield [self.data[index] for index in indices[start:start + self.batch_size]]

    def __len__(self) -> int:
        return (len(self.data) + self.batch_size - 1) // self.batch_size


def build_xor_model(seed: int = 0) -> Sequential:
    return Sequential(Linear(2, 4, seed=seed), Tanh(), Linear(4, 1, seed=seed + 1), Sigmoid())


def train_xor(epochs: int = 800, lr: float = 0.5, seed: int = 0) -> tuple[Sequential, list[float], list[int]]:
    epochs = _positive_int(epochs, "epochs")
    data = [((0.0, 0.0), (0.0,)), ((0.0, 1.0), (1.0,)), ((1.0, 0.0), (1.0,)), ((1.0, 1.0), (0.0,))]
    model = build_xor_model(seed)
    loss = MSELoss()
    optimizer = SGD(model.parameters(), lr=lr)
    history = []
    model.train()
    for _ in range(epochs):
        total = 0.0
        for x, target in data:
            prediction = model.forward(x)
            total += loss(prediction, target)
            optimizer.zero_grad()
            model.backward(loss.backward())
            optimizer.step()
        history.append(total / len(data))
    model.eval()
    predictions = [int(model.forward(x)[0] >= 0.5) for x, _ in data]
    return model, history, predictions


def main() -> None:
    model, history, predictions = train_xor(epochs=800, lr=0.5, seed=3)
    loader = DataLoader([((0.0, 0.0), 0), ((1.0, 0.0), 1), ((0.0, 1.0), 1)], batch_size=2, shuffle=True, seed=11)
    print(f"parameters={len(model.parameters())} batches={len(loader)} xor={predictions} loss={history[-1]:.6f}")


if __name__ == "__main__":
    main()
