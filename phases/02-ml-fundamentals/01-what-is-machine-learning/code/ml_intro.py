"""Small supervised-learning fixtures for the introductory ML lesson."""

# Lesson: phases/02-ml-fundamentals/01-what-is-machine-learning/docs/en.md
# The implementation uses NumPy only; the classifier is deliberately transparent.
# The demo reports held-out accuracy and two simple baselines.

from __future__ import annotations

import numpy as np


def _matrix(X: np.ndarray | list[list[float]], *, name: str) -> np.ndarray:
    array = np.asarray(X, dtype=float)
    if array.ndim != 2 or array.shape[0] == 0 or array.shape[1] == 0:
        raise ValueError(f"{name} must be a non-empty 2-D array")
    return array


def _labels(y: np.ndarray | list[int], *, n: int) -> np.ndarray:
    labels = np.asarray(y)
    if labels.ndim != 1 or len(labels) != n:
        raise ValueError("y must be a one-dimensional vector matching X")
    if len(np.unique(labels)) < 2:
        raise ValueError("at least two classes are required")
    return labels


class NearestCentroid:
    """Classify a row by the closest mean vector observed during fitting."""

    def __init__(self) -> None:
        self.classes: np.ndarray | None = None
        self.centroids: np.ndarray | None = None

    def fit(self, X, y) -> "NearestCentroid":
        matrix = _matrix(X, name="X")
        labels = _labels(y, n=len(matrix))
        self.classes = np.unique(labels)
        self.centroids = np.vstack([
            matrix[labels == label].mean(axis=0) for label in self.classes
        ])
        return self

    def _check_fitted(self) -> None:
        if self.classes is None or self.centroids is None:
            raise RuntimeError("fit must be called before predict")

    def predict(self, X) -> np.ndarray:
        self._check_fitted()
        matrix = _matrix(X, name="X")
        assert self.centroids is not None and self.classes is not None
        if matrix.shape[1] != self.centroids.shape[1]:
            raise ValueError("X has a different number of features than the fit data")
        distances = ((matrix[:, None, :] - self.centroids[None, :, :]) ** 2).sum(axis=2)
        return self.classes[distances.argmin(axis=1)]

    def score(self, X, y) -> float:
        labels = np.asarray(y)
        predictions = self.predict(X)
        if labels.ndim != 1 or len(labels) != len(predictions):
            raise ValueError("y must match the number of rows in X")
        return float(np.mean(predictions == labels))


def generate_classification_data(
    n_per_class: int = 100,
    n_features: int = 2,
    separation: float = 2.0,
    seed: int = 42,
):
    if n_per_class < 1 or n_features < 1 or separation < 0:
        raise ValueError("n_per_class, n_features, and separation must be valid")
    rng = np.random.RandomState(seed)
    center_0 = np.full(n_features, separation / 2)
    center_1 = np.full(n_features, -separation / 2)
    X = np.vstack([
        rng.randn(n_per_class, n_features) + center_0,
        rng.randn(n_per_class, n_features) + center_1,
    ])
    y = np.concatenate([
        np.zeros(n_per_class, dtype=int),
        np.ones(n_per_class, dtype=int),
    ])
    order = rng.permutation(len(y))
    return X[order], y[order]


def train_test_split(X, y, test_fraction: float = 0.3, seed: int = 42):
    matrix = _matrix(X, name="X")
    labels = np.asarray(y)
    if labels.ndim != 1 or len(labels) != len(matrix):
        raise ValueError("X and y must contain the same number of rows")
    if not 0 < test_fraction < 1:
        raise ValueError("test_fraction must be between 0 and 1")
    rng = np.random.RandomState(seed)
    order = rng.permutation(len(labels))
    split = int(len(labels) * (1 - test_fraction))
    return matrix[order[:split]], matrix[order[split:]], labels[order[:split]], labels[order[split:]]


def random_baseline(y_train, y_test, seed: int = 42) -> float:
    train = np.asarray(y_train)
    test = np.asarray(y_test)
    if train.ndim != 1 or test.ndim != 1 or len(train) == 0:
        raise ValueError("baseline labels must be non-empty vectors")
    classes, counts = np.unique(train, return_counts=True)
    rng = np.random.RandomState(seed)
    predictions = rng.choice(classes, size=len(test), p=counts / counts.sum())
    return float(np.mean(predictions == test))


def majority_baseline(y_train, y_test) -> float:
    train = np.asarray(y_train)
    test = np.asarray(y_test)
    if train.ndim != 1 or len(train) == 0:
        raise ValueError("y_train must be a non-empty vector")
    values, counts = np.unique(train, return_counts=True)
    prediction = values[counts.argmax()]
    return float(np.mean(np.full(len(test), prediction) == test))


def run_demo() -> None:
    X, y = generate_classification_data(n_per_class=120, separation=2.0)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_fraction=0.25)
    model = NearestCentroid().fit(X_train, y_train)
    print("Nearest-centroid classification")
    print(f"train_shape={X_train.shape} test_shape={X_test.shape}")
    print(f"centroids={np.round(model.centroids, 3).tolist()}")
    print(f"centroid_accuracy={model.score(X_test, y_test):.3f}")
    print(f"random_baseline={random_baseline(y_train, y_test):.3f}")
    print(f"majority_baseline={majority_baseline(y_train, y_test):.3f}")


if __name__ == "__main__":
    run_demo()
