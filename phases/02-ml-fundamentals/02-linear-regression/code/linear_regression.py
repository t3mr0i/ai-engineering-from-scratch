"""From-scratch linear, polynomial, and ridge regression fixtures."""

# Lesson: phases/02-ml-fundamentals/02-linear-regression/docs/en.md
# The implementation is Python stdlib-only; main.jl provides the parallel Julia path.
# No third-party estimator is imported: every reported value comes from these classes.
# The demo uses a seeded noisy line so training and evaluation are repeatable.

from __future__ import annotations

import math
import random


def _xy(X, y):
    features = [float(x) for x in X]
    targets = [float(value) for value in y]
    if not features or len(features) != len(targets):
        raise ValueError("X and y must be non-empty vectors of equal length")
    return features, targets


def _matrix_xy(X, y):
    rows = [list(map(float, row)) for row in X]
    targets = [float(value) for value in y]
    if not rows or len(rows) != len(targets) or not rows[0]:
        raise ValueError("X and y must be a non-empty, matching matrix and vector")
    width = len(rows[0])
    if any(len(row) != width for row in rows):
        raise ValueError("all feature rows must have the same width")
    return rows, targets


class LinearRegression:
    def __init__(self, learning_rate: float = 0.01):
        if learning_rate <= 0:
            raise ValueError("learning_rate must be positive")
        self.w = 0.0
        self.b = 0.0
        self.lr = learning_rate
        self.cost_history: list[float] = []

    def predict(self, X):
        return [self.w * float(x) + self.b for x in X]

    def compute_cost(self, X, y):
        features, targets = _xy(X, y)
        errors = [prediction - actual for prediction, actual in zip(self.predict(features), targets)]
        return sum(error * error for error in errors) / len(errors)

    def compute_gradients(self, X, y):
        features, targets = _xy(X, y)
        errors = [prediction - actual for prediction, actual in zip(self.predict(features), targets)]
        n = len(errors)
        return (
            2 * sum(error * x for error, x in zip(errors, features)) / n,
            2 * sum(errors) / n,
        )

    def fit(self, X, y, epochs: int = 1000, print_every: int = 0):
        features, targets = _xy(X, y)
        if epochs < 1:
            raise ValueError("epochs must be positive")
        self.cost_history = []
        for epoch in range(epochs):
            dw, db = self.compute_gradients(features, targets)
            self.w -= self.lr * dw
            self.b -= self.lr * db
            cost = self.compute_cost(features, targets)
            self.cost_history.append(cost)
            if print_every and epoch % print_every == 0:
                print(f"epoch={epoch} mse={cost:.5f}")
        return self

    def r_squared(self, X, y):
        features, targets = _xy(X, y)
        mean = sum(targets) / len(targets)
        total = sum((value - mean) ** 2 for value in targets)
        if total == 0:
            raise ValueError("R-squared is undefined for a constant target")
        residual = sum((value - prediction) ** 2 for value, prediction in zip(targets, self.predict(features)))
        return 1 - residual / total


class LinearRegressionNormal:
    """Closed-form scalar least squares, equivalent to the normal equation."""

    def __init__(self):
        self.w = 0.0
        self.b = 0.0

    def fit(self, X, y):
        features, targets = _xy(X, y)
        x_mean = sum(features) / len(features)
        y_mean = sum(targets) / len(targets)
        denominator = sum((x - x_mean) ** 2 for x in features)
        if denominator == 0:
            raise ValueError("normal equation needs variation in X")
        self.w = sum((x - x_mean) * (value - y_mean) for x, value in zip(features, targets)) / denominator
        self.b = y_mean - self.w * x_mean
        return self

    def predict(self, X):
        return [self.w * float(x) + self.b for x in X]

    def r_squared(self, X, y):
        features, targets = _xy(X, y)
        mean = sum(targets) / len(targets)
        total = sum((value - mean) ** 2 for value in targets)
        if total == 0:
            raise ValueError("R-squared is undefined for a constant target")
        residual = sum((value - prediction) ** 2 for value, prediction in zip(targets, self.predict(features)))
        return 1 - residual / total


class MultipleLinearRegression:
    def __init__(self, n_features: int, learning_rate: float = 0.01):
        if n_features < 1 or learning_rate <= 0:
            raise ValueError("n_features and learning_rate must be positive")
        self.weights = [0.0] * n_features
        self.bias = 0.0
        self.lr = learning_rate
        self.cost_history: list[float] = []

    def predict(self, X):
        rows = [list(map(float, row)) for row in X]
        if any(len(row) != len(self.weights) for row in rows):
            raise ValueError("feature width does not match n_features")
        return [sum(w * value for w, value in zip(self.weights, row)) + self.bias for row in rows]

    def compute_cost(self, X, y):
        rows, targets = _matrix_xy(X, y)
        errors = [prediction - actual for prediction, actual in zip(self.predict(rows), targets)]
        return sum(error * error for error in errors) / len(errors)

    def fit(self, X, y, epochs: int = 1000, print_every: int = 0):
        rows, targets = _matrix_xy(X, y)
        if len(rows[0]) != len(self.weights) or epochs < 1:
            raise ValueError("feature width or epochs is invalid")
        self.cost_history = []
        for epoch in range(epochs):
            predictions = self.predict(rows)
            errors = [prediction - actual for prediction, actual in zip(predictions, targets)]
            n = len(rows)
            for j in range(len(self.weights)):
                self.weights[j] -= self.lr * 2 * sum(error * row[j] for error, row in zip(errors, rows)) / n
            self.bias -= self.lr * 2 * sum(errors) / n
            cost = self.compute_cost(rows, targets)
            self.cost_history.append(cost)
            if print_every and epoch % print_every == 0:
                print(f"epoch={epoch} mse={cost:.5f}")
        return self

    def r_squared(self, X, y):
        rows, targets = _matrix_xy(X, y)
        mean = sum(targets) / len(targets)
        total = sum((value - mean) ** 2 for value in targets)
        if total == 0:
            raise ValueError("R-squared is undefined for a constant target")
        residual = sum((value - prediction) ** 2 for value, prediction in zip(targets, self.predict(rows)))
        return 1 - residual / total


def standardize(X):
    rows = [list(map(float, row)) for row in X]
    if not rows or not rows[0] or any(len(row) != len(rows[0]) for row in rows):
        raise ValueError("X must be a non-empty rectangular matrix")
    means = [sum(row[j] for row in rows) / len(rows) for j in range(len(rows[0]))]
    stds = [math.sqrt(sum((row[j] - means[j]) ** 2 for row in rows) / len(rows)) for j in range(len(rows[0]))]
    scaled = [[(row[j] - means[j]) / stds[j] if stds[j] else 0.0 for j in range(len(row))] for row in rows]
    return scaled, means, stds


class PolynomialRegression:
    def __init__(self, degree: int, learning_rate: float = 0.01):
        if degree < 1 or learning_rate <= 0:
            raise ValueError("degree and learning_rate must be positive")
        self.degree = degree
        self.weights = [0.0] * degree
        self.bias = 0.0
        self.lr = learning_rate

    def make_features(self, X):
        return [[float(x) ** power for power in range(1, self.degree + 1)] for x in X]

    def predict(self, X):
        return [sum(w * value for w, value in zip(self.weights, row)) + self.bias for row in self.make_features(X)]

    def fit(self, X, y, epochs: int = 1000):
        features, targets = _xy(X, y)
        expanded = self.make_features(features)
        if epochs < 1:
            raise ValueError("epochs must be positive")
        for _ in range(epochs):
            errors = [prediction - actual for prediction, actual in zip(self.predict(features), targets)]
            for j in range(self.degree):
                self.weights[j] -= self.lr * 2 * sum(error * row[j] for error, row in zip(errors, expanded)) / len(errors)
            self.bias -= self.lr * 2 * sum(errors) / len(errors)
        return self


class RidgeRegression(MultipleLinearRegression):
    def __init__(self, n_features: int, learning_rate: float = 0.01, alpha: float = 1.0):
        super().__init__(n_features, learning_rate)
        if alpha < 0:
            raise ValueError("alpha must be non-negative")
        self.alpha = alpha

    def fit(self, X, y, epochs: int = 1000, print_every: int = 0):
        rows, targets = _matrix_xy(X, y)
        if len(rows[0]) != len(self.weights) or epochs < 1:
            raise ValueError("feature width or epochs is invalid")
        self.cost_history = []
        for epoch in range(epochs):
            errors = [prediction - actual for prediction, actual in zip(self.predict(rows), targets)]
            n = len(rows)
            for j in range(len(self.weights)):
                gradient = 2 * sum(error * row[j] for error, row in zip(errors, rows)) / n
                self.weights[j] -= self.lr * (gradient + 2 * self.alpha * self.weights[j])
            self.bias -= self.lr * 2 * sum(errors) / n
            cost = self.compute_cost(rows, targets) + self.alpha * sum(weight * weight for weight in self.weights)
            self.cost_history.append(cost)
            if print_every and epoch % print_every == 0:
                print(f"epoch={epoch} ridge_cost={cost:.5f}")
        return self


def run_demo() -> None:
    rng = random.Random(42)
    X = [rng.uniform(0, 10) for _ in range(80)]
    y = [3 * x + 7 + rng.gauss(0, 1.0) for x in X]
    gradient = LinearRegression(learning_rate=0.005).fit(X, y, epochs=1200)
    closed = LinearRegressionNormal().fit(X, y)
    print("Linear regression")
    print(f"samples={len(X)} gradient_w={gradient.w:.3f} gradient_b={gradient.b:.3f}")
    print(f"normal_w={closed.w:.3f} normal_b={closed.b:.3f} r2={closed.r_squared(X, y):.3f}")
    rows = [[x, 1.0 if x > 5 else 0.0] for x in X]
    scaled, means, stds = standardize(rows)
    ridge = RidgeRegression(2, learning_rate=0.01, alpha=0.1).fit(scaled, y, epochs=500)
    print(f"standardized_means={[round(value, 3) for value in means]} ridge_weights={[round(value, 3) for value in ridge.weights]}")


if __name__ == "__main__":
    run_demo()
