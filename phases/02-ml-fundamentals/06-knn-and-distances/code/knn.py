"""Distance functions, brute-force KNN, and a small KD-tree implementation."""

# Lesson: phases/02-ml-fundamentals/06-knn-and-distances/docs/en.md
# All algorithms are Python stdlib-only so the distance calculations remain visible.
# KNN stores training rows and performs exact neighbor search at prediction time.
# The demo contrasts classification, regression, scaling, and KD-tree lookup.

from __future__ import annotations

import math
import random


def _pair(a, b):
    left, right = list(a), list(b)
    if not left or len(left) != len(right):
        raise ValueError("vectors must be non-empty and have equal length")
    return left, right


def l2_distance(a, b):
    left, right = _pair(a, b)
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(left, right)))


def l1_distance(a, b):
    left, right = _pair(a, b)
    return sum(abs(x - y) for x, y in zip(left, right))


def cosine_distance(a, b):
    left, right = _pair(a, b)
    norm_left = math.sqrt(sum(value * value for value in left))
    norm_right = math.sqrt(sum(value * value for value in right))
    if norm_left == 0 or norm_right == 0:
        return 1.0
    return 1 - sum(x * y for x, y in zip(left, right)) / (norm_left * norm_right)


def minkowski_distance(a, b, p=2):
    left, right = _pair(a, b)
    if p != float("inf") and p <= 0:
        raise ValueError("p must be positive or infinity")
    if p == float("inf"):
        return max(abs(x - y) for x, y in zip(left, right))
    return sum(abs(x - y) ** p for x, y in zip(left, right)) ** (1 / p)


def standardize(X):
    rows = [list(map(float, row)) for row in X]
    if not rows or not rows[0] or any(len(row) != len(rows[0]) for row in rows):
        raise ValueError("X must be a non-empty rectangular matrix")
    means = [sum(row[j] for row in rows) / len(rows) for j in range(len(rows[0]))]
    stds = [math.sqrt(sum((row[j] - means[j]) ** 2 for row in rows) / len(rows)) for j in range(len(rows[0]))]
    scaled = [[(row[j] - means[j]) / stds[j] if stds[j] else 0.0 for j in range(len(row))] for row in rows]
    return scaled, means, stds


def apply_standardize(X, means, stds):
    rows = [list(map(float, row)) for row in X]
    if not rows or len(means) != len(stds) or any(len(row) != len(means) for row in rows):
        raise ValueError("X and scaling statistics have incompatible shapes")
    if any(std < 0 for std in stds):
        raise ValueError("standard deviations cannot be negative")
    return [[(value - means[j]) / stds[j] if stds[j] else 0.0 for j, value in enumerate(row)] for row in rows]


class KNN:
    def __init__(self, k=5, distance_fn=l2_distance, weighted=False, task="classification"):
        if k < 1 or task not in {"classification", "regression"}:
            raise ValueError("k must be positive and task must be classification or regression")
        self.k = k
        self.distance_fn = distance_fn
        self.weighted = weighted
        self.task = task
        self.X_train = None
        self.y_train = None

    def fit(self, X, y):
        rows = [list(map(float, row)) for row in X]
        labels = list(y)
        if not rows or len(rows) != len(labels) or any(len(row) != len(rows[0]) for row in rows):
            raise ValueError("X and y must be non-empty, rectangular, and equal length")
        if self.k > len(rows):
            raise ValueError("k cannot exceed the number of training rows")
        self.X_train, self.y_train = rows, labels
        return self

    def _neighbors(self, row):
        if self.X_train is None or self.y_train is None:
            raise RuntimeError("fit must be called before predict")
        query = list(map(float, row))
        if len(query) != len(self.X_train[0]):
            raise ValueError("query width does not match training rows")
        distances = [(self.distance_fn(query, train_row), index, self.y_train[index]) for index, train_row in enumerate(self.X_train)]
        distances.sort(key=lambda pair: (pair[0], pair[1]))
        return distances[: self.k]

    def _classify(self, neighbors):
        votes = {}
        for distance, label in neighbors:
            votes[label] = votes.get(label, 0.0) + (1 / (distance + 1e-12) if self.weighted else 1.0)
        return max(votes, key=lambda label: (votes[label], str(label)))

    def _regress(self, neighbors):
        if self.weighted:
            weights = [1 / (distance + 1e-12) for distance, _ in neighbors]
            return sum(weight * value for weight, (_, value) in zip(weights, neighbors)) / sum(weights)
        return sum(value for _, value in neighbors) / len(neighbors)

    def predict(self, X):
        predictions = []
        for row in X:
            neighbors = self._neighbors(row)
            pairs = [(distance, label) for distance, _, label in neighbors]
            predictions.append(self._classify(pairs) if self.task == "classification" else self._regress(pairs))
        return predictions

    def predict_with_neighbors(self, x):
        neighbors = self._neighbors(x)
        pairs = [(distance, label) for distance, _, label in neighbors]
        prediction = self._classify(pairs) if self.task == "classification" else self._regress(pairs)
        return prediction, neighbors


class KDNode:
    def __init__(self, point, index, axis, left=None, right=None):
        self.point, self.index, self.axis = point, index, axis
        self.left, self.right = left, right


class KDTree:
    def __init__(self, X):
        rows = [list(map(float, row)) for row in X]
        if not rows or not rows[0] or any(len(row) != len(rows[0]) for row in rows):
            raise ValueError("X must be a non-empty rectangular matrix")
        self.dim = len(rows[0])
        self.root = self._build([(row, i) for i, row in enumerate(rows)], 0)

    def _build(self, points, depth):
        if not points:
            return None
        axis = depth % self.dim
        points.sort(key=lambda pair: pair[0][axis])
        middle = len(points) // 2
        return KDNode(points[middle][0], points[middle][1], axis,
                      self._build(points[:middle], depth + 1),
                      self._build(points[middle + 1:], depth + 1))

    def query(self, point, k=1):
        if k < 1:
            raise ValueError("k must be positive")
        query = list(map(float, point))
        if len(query) != self.dim:
            raise ValueError("query width does not match tree dimension")
        all_points = []
        self._collect(self.root, query, all_points)
        return sorted(all_points)[:k]

    def _collect(self, node, query, output):
        if node is None:
            return
        output.append((l2_distance(query, node.point), node.index, node.point))
        self._collect(node.left, query, output)
        self._collect(node.right, query, output)


def accuracy(y_true, y_pred):
    if not y_true or len(y_true) != len(y_pred):
        raise ValueError("accuracy needs equal, non-empty vectors")
    return sum(a == b for a, b in zip(y_true, y_pred)) / len(y_true)


def mse(y_true, y_pred):
    if not y_true or len(y_true) != len(y_pred):
        raise ValueError("mse needs equal, non-empty vectors")
    return sum((a - b) ** 2 for a, b in zip(y_true, y_pred)) / len(y_true)


def generate_classification_data(n_samples=120, seed=42):
    rng = random.Random(seed)
    centers = [(1, 1), (-1, -1), (1, -1)]
    X, y = [], []
    for _ in range(n_samples):
        label = rng.randrange(3)
        X.append([centers[label][0] + rng.gauss(0, 0.35), centers[label][1] + rng.gauss(0, 0.35)])
        y.append(label)
    return X, y


def train_test_split(X, y, test_ratio=0.2, seed=42):
    rows, labels = list(X), list(y)
    if not rows or len(rows) != len(labels) or not 0 < test_ratio < 1:
        raise ValueError("X/y and test_ratio are invalid")
    order = list(range(len(rows)))
    random.Random(seed).shuffle(order)
    split = int(len(rows) * (1 - test_ratio))
    return ([rows[i] for i in order[:split]], [labels[i] for i in order[:split]],
            [rows[i] for i in order[split:]], [labels[i] for i in order[split:]])


def run_demo():
    X, y = generate_classification_data()
    X_train, y_train, X_test, y_test = train_test_split(X, y)
    model = KNN(k=5).fit(X_train, y_train)
    tree = KDTree(X_train)
    print("K-nearest neighbors")
    print(f"train={len(X_train)} test={len(X_test)} accuracy={accuracy(y_test, model.predict(X_test)):.3f}")
    print(f"l1={l1_distance([1, 2], [2, 4]):.3f} l2={l2_distance([1, 2], [2, 4]):.3f} cosine={cosine_distance([1, 2], [2, 4]):.3f}")
    print(f"nearest_index={tree.query(X_test[0], k=1)[0][1]}")


if __name__ == "__main__":
    run_demo()
