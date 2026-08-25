"""Small decision-tree and random-forest implementations for tabular data."""

# Lesson: phases/02-ml-fundamentals/04-decision-trees/docs/en.md
# The code is Python stdlib-only and exposes impurity, pruning, and bootstrap APIs.
# A tree stores a JSON-like nested dictionary, which makes its decisions inspectable.
# The demo uses a seeded two-feature fixture and prints accuracy and importances.

from __future__ import annotations

import math
import random


def _rows_y(X, y):
    rows = [list(map(float, row)) for row in X]
    labels = list(y)
    if not rows or len(rows) != len(labels) or not rows[0]:
        raise ValueError("X and y must be non-empty and have matching lengths")
    width = len(rows[0])
    if any(len(row) != width for row in rows):
        raise ValueError("all rows must have the same feature width")
    return rows, labels


def gini_impurity(labels):
    if not labels:
        return 0.0
    counts = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1
    n = len(labels)
    return 1.0 - sum((count / n) ** 2 for count in counts.values())


def entropy(labels):
    if not labels:
        return 0.0
    counts = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1
    n = len(labels)
    return -sum((count / n) * math.log2(count / n) for count in counts.values())


def information_gain(parent_labels, left_labels, right_labels, criterion="gini"):
    if criterion not in {"gini", "entropy"}:
        raise ValueError("criterion must be 'gini' or 'entropy'")
    if not parent_labels or not left_labels or not right_labels:
        return 0.0
    measure = gini_impurity if criterion == "gini" else entropy
    n = len(parent_labels)
    child = (len(left_labels) * measure(left_labels) + len(right_labels) * measure(right_labels)) / n
    return measure(parent_labels) - child


def _variance(values):
    if not values:
        return 0.0
    mean = sum(values) / len(values)
    return sum((value - mean) ** 2 for value in values) / len(values)


def variance_reduction(parent_values, left_values, right_values):
    if not parent_values or not left_values or not right_values:
        return 0.0
    n = len(parent_values)
    return _variance(parent_values) - (len(left_values) * _variance(left_values) + len(right_values) * _variance(right_values)) / n


def majority_vote(labels):
    if not labels:
        raise ValueError("cannot vote on an empty node")
    counts = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1
    return max(counts, key=lambda label: (counts[label], str(label)))


class DecisionTree:
    def __init__(self, max_depth=None, min_samples_split=2, min_samples_leaf=1,
                 criterion="gini", max_features=None, task="classification", rng=None):
        if max_depth is not None and max_depth < 0:
            raise ValueError("max_depth must be non-negative or None")
        if min_samples_split < 2 or min_samples_leaf < 1:
            raise ValueError("sample controls are invalid")
        if task not in {"classification", "regression"}:
            raise ValueError("task must be classification or regression")
        if criterion not in {"gini", "entropy"}:
            raise ValueError("criterion must be gini or entropy")
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.criterion = criterion
        self.max_features = max_features
        self.task = task
        self.rng = rng if rng is not None else random.Random()
        self.tree = None
        self.feature_importances_ = None
        self.n_features = 0

    def fit(self, X, y):
        rows, labels = _rows_y(X, y)
        self.n_features = len(rows[0])
        self.feature_importances_ = [0.0] * self.n_features
        self.tree = self._build(rows, labels, 0)
        total = sum(self.feature_importances_)
        if total:
            self.feature_importances_ = [value / total for value in self.feature_importances_]
        return self

    def _make_leaf(self, labels):
        value = majority_vote(labels) if self.task == "classification" else sum(labels) / len(labels)
        return {"leaf": True, "value": value}

    def _feature_indices(self):
        if self.max_features is None:
            return list(range(self.n_features))
        if self.max_features == "sqrt":
            count = max(1, int(math.sqrt(self.n_features)))
        elif isinstance(self.max_features, int) and self.max_features > 0:
            count = min(self.n_features, self.max_features)
        else:
            raise ValueError("max_features must be None, 'sqrt', or a positive integer")
        return self.rng.sample(range(self.n_features), count)

    def _build(self, X, y, depth):
        if len(set(y)) == 1 or (self.max_depth is not None and depth >= self.max_depth) or len(y) < self.min_samples_split:
            return self._make_leaf(y)
        best_feature, best_threshold, best_gain = None, None, 0.0
        for feature in self._feature_indices():
            values = sorted(set(row[feature] for row in X))
            for left_value, right_value in zip(values, values[1:]):
                threshold = (left_value + right_value) / 2
                left_y = [label for row, label in zip(X, y) if row[feature] <= threshold]
                right_y = [label for row, label in zip(X, y) if row[feature] > threshold]
                if len(left_y) < self.min_samples_leaf or len(right_y) < self.min_samples_leaf:
                    continue
                gain = information_gain(y, left_y, right_y, self.criterion) if self.task == "classification" else variance_reduction(y, left_y, right_y)
                if gain > best_gain:
                    best_feature, best_threshold, best_gain = feature, threshold, gain
        if best_feature is None:
            return self._make_leaf(y)
        left_X = [row for row in X if row[best_feature] <= best_threshold]
        right_X = [row for row in X if row[best_feature] > best_threshold]
        left_y = [label for row, label in zip(X, y) if row[best_feature] <= best_threshold]
        right_y = [label for row, label in zip(X, y) if row[best_feature] > best_threshold]
        self.feature_importances_[best_feature] += best_gain * len(y)
        return {
            "leaf": False,
            "feature": best_feature,
            "threshold": best_threshold,
            "left": self._build(left_X, left_y, depth + 1),
            "right": self._build(right_X, right_y, depth + 1),
        }

    def _predict_one(self, row, node):
        if node["leaf"]:
            return node["value"]
        child = node["left"] if row[node["feature"]] <= node["threshold"] else node["right"]
        return self._predict_one(row, child)

    def predict(self, X):
        if self.tree is None:
            raise RuntimeError("fit must be called before predict")
        rows = [list(map(float, row)) for row in X]
        if any(len(row) != self.n_features for row in rows):
            raise ValueError("feature width does not match fitted tree")
        return [self._predict_one(row, self.tree) for row in rows]


class RandomForest:
    def __init__(self, n_trees=20, max_depth=None, min_samples_split=2,
                 max_features="sqrt", criterion="gini", task="classification", seed=42):
        if n_trees < 1:
            raise ValueError("n_trees must be positive")
        self.n_trees = n_trees
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.criterion = criterion
        self.task = task
        self.seed = seed
        self.trees = []

    def fit(self, X, y):
        rows, labels = _rows_y(X, y)
        rng = random.Random(self.seed)
        self.trees = []
        for _ in range(self.n_trees):
            indices = [rng.randrange(len(rows)) for _ in rows]
            tree_rng = random.Random(rng.randrange(2**63))
            tree = DecisionTree(
                self.max_depth,
                self.min_samples_split,
                1,
                self.criterion,
                self.max_features,
                self.task,
                rng=tree_rng,
            )
            tree.fit([rows[i] for i in indices], [labels[i] for i in indices])
            self.trees.append(tree)
        return self

    def predict(self, X):
        if not self.trees:
            raise RuntimeError("fit must be called before predict")
        predictions = [tree.predict(X) for tree in self.trees]
        result = []
        for i in range(len(predictions[0])):
            values = [prediction[i] for prediction in predictions]
            result.append(majority_vote(values) if self.task == "classification" else sum(values) / len(values))
        return result

    def feature_importances(self):
        if not self.trees:
            raise RuntimeError("fit must be called before feature_importances")
        width = self.trees[0].n_features
        values = [sum(tree.feature_importances_[j] for tree in self.trees) / len(self.trees) for j in range(width)]
        total = sum(values)
        return [value / total for value in values] if total else values


def accuracy(y_true, y_pred):
    if not y_true or len(y_true) != len(y_pred):
        raise ValueError("accuracy needs equal, non-empty vectors")
    return sum(a == b for a, b in zip(y_true, y_pred)) / len(y_true)


def generate_classification_data(n_samples=120, seed=42):
    rng = random.Random(seed)
    X, y = [], []
    for _ in range(n_samples):
        x1, x2 = rng.uniform(-3, 3), rng.uniform(-3, 3)
        X.append([x1, x2])
        y.append(1 if x1 + x2 > 0 else 0)
    return X, y


def run_demo():
    X, y = generate_classification_data()
    split = 90
    tree = DecisionTree(max_depth=3).fit(X[:split], y[:split])
    forest = RandomForest(n_trees=15, max_depth=4).fit(X[:split], y[:split])
    print("Decision trees")
    print(f"tree_accuracy={accuracy(y[split:], tree.predict(X[split:])):.3f}")
    print(f"forest_accuracy={accuracy(y[split:], forest.predict(X[split:])):.3f}")
    print(f"forest_importances={[round(value, 3) for value in forest.feature_importances()]}")


if __name__ == "__main__":
    run_demo()
