"""From-scratch binary and multiclass logistic-regression fixtures."""

# Lesson: phases/02-ml-fundamentals/03-logistic-regression/docs/en.md
# The implementation is Python stdlib-only; main.jl is the parallel Julia path.
# Sigmoid clipping and log clamping keep the small numerical demo finite.
# No external estimator is imported or needed to run the canonical command.

from __future__ import annotations

import math
import random


def _matrix_xy(X, y):
    rows = [list(map(float, row)) for row in X]
    labels = list(y)
    if not rows or len(rows) != len(labels) or not rows[0]:
        raise ValueError("X and y must be non-empty and have matching lengths")
    width = len(rows[0])
    if any(len(row) != width for row in rows):
        raise ValueError("all feature rows must have the same width")
    if any(type(value) is not int for value in labels):
        raise ValueError("labels must be integer values; no coercion is performed")
    return rows, labels


def sigmoid(z: float) -> float:
    clipped = max(-500.0, min(500.0, float(z)))
    return 1.0 / (1.0 + math.exp(-clipped))


class LogisticRegression:
    def __init__(self, n_features: int, learning_rate: float = 0.01):
        if n_features < 1 or learning_rate <= 0:
            raise ValueError("n_features and learning_rate must be positive")
        self.weights = [0.0] * n_features
        self.bias = 0.0
        self.lr = learning_rate
        self.loss_history: list[float] = []

    def predict_proba(self, x):
        row = list(map(float, x))
        if len(row) != len(self.weights):
            raise ValueError("feature width does not match n_features")
        return sigmoid(sum(w * value for w, value in zip(self.weights, row)) + self.bias)

    def predict(self, x, threshold: float = 0.5):
        if not 0 <= threshold <= 1:
            raise ValueError("threshold must be between 0 and 1")
        return 1 if self.predict_proba(x) >= threshold else 0

    def compute_loss(self, X, y):
        rows, labels = _matrix_xy(X, y)
        if any(label not in (0, 1) for label in labels):
            raise ValueError("binary labels must be 0 or 1")
        total = 0.0
        for row, label in zip(rows, labels):
            probability = min(1 - 1e-15, max(1e-15, self.predict_proba(row)))
            total -= label * math.log(probability) + (1 - label) * math.log(1 - probability)
        return total / len(labels)

    def fit(self, X, y, epochs: int = 1000, print_every: int = 0):
        rows, labels = _matrix_xy(X, y)
        if any(label not in (0, 1) for label in labels) or epochs < 1:
            raise ValueError("labels must be binary and epochs positive")
        if len(rows[0]) != len(self.weights):
            raise ValueError("feature width does not match n_features")
        self.loss_history = []
        for epoch in range(epochs):
            grad_w = [0.0] * len(self.weights)
            grad_b = 0.0
            for row, label in zip(rows, labels):
                error = self.predict_proba(row) - label
                for j, value in enumerate(row):
                    grad_w[j] += error * value
                grad_b += error
            n = len(rows)
            for j in range(len(self.weights)):
                self.weights[j] -= self.lr * grad_w[j] / n
            self.bias -= self.lr * grad_b / n
            loss = self.compute_loss(rows, labels)
            self.loss_history.append(loss)
            if print_every and epoch % print_every == 0:
                print(f"epoch={epoch} bce={loss:.5f}")
        return self

    def accuracy(self, X, y, threshold: float = 0.5):
        rows, labels = _matrix_xy(X, y)
        return sum(self.predict(row, threshold) == label for row, label in zip(rows, labels)) / len(labels)


class ClassificationMetrics:
    def __init__(self, y_true, y_pred):
        actual = list(y_true)
        predicted = list(y_pred)
        if not actual or len(actual) != len(predicted):
            raise ValueError("y_true and y_pred must be non-empty and equal length")
        if any(type(value) is not int or value not in (0, 1) for value in actual + predicted):
            raise ValueError("classification metrics require binary integer labels 0 or 1")
        self.tp = sum(t == 1 and p == 1 for t, p in zip(actual, predicted))
        self.tn = sum(t == 0 and p == 0 for t, p in zip(actual, predicted))
        self.fp = sum(t == 0 and p == 1 for t, p in zip(actual, predicted))
        self.fn = sum(t == 1 and p == 0 for t, p in zip(actual, predicted))

    def accuracy(self):
        total = self.tp + self.tn + self.fp + self.fn
        return (self.tp + self.tn) / total

    def precision(self):
        return self.tp / (self.tp + self.fp) if self.tp + self.fp else 0.0

    def recall(self):
        return self.tp / (self.tp + self.fn) if self.tp + self.fn else 0.0

    def f1(self):
        precision, recall = self.precision(), self.recall()
        return 2 * precision * recall / (precision + recall) if precision + recall else 0.0

    def as_dict(self):
        return {"accuracy": self.accuracy(), "precision": self.precision(), "recall": self.recall(), "f1": self.f1()}


class SoftmaxRegression:
    def __init__(self, n_features: int, n_classes: int, learning_rate: float = 0.01):
        if n_features < 1 or n_classes < 2 or learning_rate <= 0:
            raise ValueError("n_features, n_classes, and learning_rate are invalid")
        self.n_features = n_features
        self.n_classes = n_classes
        self.lr = learning_rate
        self.weights = [[0.0] * n_features for _ in range(n_classes)]
        self.biases = [0.0] * n_classes

    @staticmethod
    def softmax(scores):
        if not scores:
            raise ValueError("scores must not be empty")
        maximum = max(scores)
        exponentials = [math.exp(score - maximum) for score in scores]
        total = sum(exponentials)
        return [value / total for value in exponentials]

    def predict_proba(self, x):
        row = list(map(float, x))
        if len(row) != self.n_features:
            raise ValueError("feature width does not match n_features")
        scores = [sum(self.weights[k][j] * row[j] for j in range(self.n_features)) + self.biases[k] for k in range(self.n_classes)]
        return self.softmax(scores)

    def predict(self, x):
        probabilities = self.predict_proba(x)
        return max(range(len(probabilities)), key=probabilities.__getitem__)

    def fit(self, X, y, epochs: int = 1000, print_every: int = 0):
        rows, labels = _matrix_xy(X, y)
        if len(rows[0]) != self.n_features or epochs < 1 or any(not 0 <= label < self.n_classes for label in labels):
            raise ValueError("feature width, epochs, or class labels are invalid")
        for epoch in range(epochs):
            grad_w = [[0.0] * self.n_features for _ in range(self.n_classes)]
            grad_b = [0.0] * self.n_classes
            loss = 0.0
            for row, label in zip(rows, labels):
                probabilities = self.predict_proba(row)
                loss -= math.log(max(probabilities[label], 1e-15))
                for k, probability in enumerate(probabilities):
                    error = probability - (1.0 if k == label else 0.0)
                    grad_b[k] += error
                    for j, value in enumerate(row):
                        grad_w[k][j] += error * value
            for k in range(self.n_classes):
                for j in range(self.n_features):
                    self.weights[k][j] -= self.lr * grad_w[k][j] / len(rows)
                self.biases[k] -= self.lr * grad_b[k] / len(rows)
            if print_every and epoch % print_every == 0:
                print(f"epoch={epoch} cross_entropy={loss / len(rows):.5f}")
        return self

    def accuracy(self, X, y):
        rows, labels = _matrix_xy(X, y)
        return sum(self.predict(row) == label for row, label in zip(rows, labels)) / len(labels)


def run_demo() -> None:
    rng = random.Random(42)
    X = [[rng.gauss(2, 0.8), rng.gauss(2, 0.8)] for _ in range(60)]
    y = [0] * len(X)
    X += [[rng.gauss(5, 0.8), rng.gauss(5, 0.8)] for _ in range(60)]
    y += [1] * 60
    model = LogisticRegression(2, learning_rate=0.1).fit(X, y, epochs=800)
    predictions = [model.predict(row) for row in X]
    print("Logistic regression")
    print(f"samples={len(X)} bce_start={model.loss_history[0]:.3f} bce_end={model.loss_history[-1]:.3f}")
    print(f"accuracy={model.accuracy(X, y):.3f} metrics={ClassificationMetrics(y, predictions).as_dict()}")
    multi = SoftmaxRegression(2, 3, learning_rate=0.1)
    multi.fit([[0, 0], [3, 0], [0, 3], [0.1, 0], [3.1, 0], [0, 3.1]], [0, 1, 2, 0, 1, 2], epochs=500)
    print(f"softmax=[{', '.join(f'{p:.3f}' for p in multi.predict_proba([3, 0]))}]")


if __name__ == "__main__":
    run_demo()
