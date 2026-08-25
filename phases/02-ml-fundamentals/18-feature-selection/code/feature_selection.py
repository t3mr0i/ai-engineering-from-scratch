# Feature-selection methods for phases/02-ml-fundamentals/18-feature-selection/docs/en.md.
# Implements filters, RFE, L1 sparsity, and tree impurity importance from scratch.
# Selection is fit on training rows; held-out rows are used only for evaluation.
# NumPy is the only non-stdlib dependency for the canonical demo.

"""Filter, wrapper, embedded, and tree-based feature selection from scratch."""

import numpy as np


def _matrix(X, name="X"):
    array = np.asarray(X, dtype=float)
    if array.ndim != 2 or array.shape[0] == 0 or array.shape[1] == 0:
        raise ValueError(f"{name} must be a non-empty 2D array")
    if not np.isfinite(array).all():
        raise ValueError(f"{name} must contain only finite values")
    return array


def _classification_data(X, y):
    features = _matrix(X)
    labels = _binary_labels(y)
    if len(labels) != len(features):
        raise ValueError("y must be a non-empty vector matching X rows")
    if len(np.unique(labels)) < 2:
        raise ValueError("y must contain both binary classes 0 and 1")
    return features, labels


def _binary_labels(y):
    labels = np.asarray(y)
    if labels.ndim != 1 or labels.size == 0 or labels.dtype.kind not in "iuf":
        raise ValueError("y must be a non-empty numeric vector with labels exactly 0 or 1")
    numeric = labels.astype(float)
    if not np.isfinite(numeric).all() or not np.isin(numeric, (0.0, 1.0)).all():
        raise ValueError("y must contain only numeric labels 0 and 1")
    return numeric.astype(int)


def make_feature_selection_data(n_samples=500, seed=42):
    if not isinstance(n_samples, (int, np.integer)) or n_samples < 2:
        raise ValueError("n_samples must be an integer at least 2")
    rng = np.random.RandomState(seed)

    x1 = rng.randn(n_samples)
    x2 = rng.randn(n_samples)
    x3 = rng.randn(n_samples)
    x4 = x1 + 0.1 * rng.randn(n_samples)
    x5 = x2 + 0.1 * rng.randn(n_samples)

    informative = np.column_stack([x1, x2, x3, x4, x5])

    correlated = np.column_stack([
        x1 * 0.9 + 0.1 * rng.randn(n_samples),
        x2 * 0.8 + 0.2 * rng.randn(n_samples),
        x3 * 0.7 + 0.3 * rng.randn(n_samples),
        x1 * 0.5 + x2 * 0.5 + 0.1 * rng.randn(n_samples),
        x2 * 0.6 + x3 * 0.4 + 0.1 * rng.randn(n_samples),
    ])

    noise = rng.randn(n_samples, 10) * 0.5

    X = np.hstack([informative, correlated, noise])
    y = (2 * x1 - 1.5 * x2 + x3 + 0.5 * rng.randn(n_samples) > 0).astype(int)

    feature_names = (
        [f"info_{i}" for i in range(5)]
        + [f"corr_{i}" for i in range(5)]
        + [f"noise_{i}" for i in range(10)]
    )

    return X, y, feature_names


def variance_threshold(X, threshold=0.01):
    X = _matrix(X)
    if not np.isfinite(threshold) or threshold < 0:
        raise ValueError("threshold must be finite and non-negative")
    variances = np.var(X, axis=0)
    mask = variances > threshold
    return mask, variances


def discretize(x, n_bins=10):
    x = np.asarray(x, dtype=float)
    if x.ndim != 1 or x.size == 0 or not np.isfinite(x).all():
        raise ValueError("x must be a non-empty finite vector")
    if not isinstance(n_bins, (int, np.integer)) or n_bins < 1:
        raise ValueError("n_bins must be a positive integer")
    min_val, max_val = x.min(), x.max()
    if max_val == min_val:
        return np.zeros_like(x, dtype=int)
    bin_edges = np.linspace(min_val, max_val, n_bins + 1)
    binned = np.digitize(x, bin_edges[1:-1])
    return binned


def mutual_information(X, y, n_bins=10):
    X, y = _classification_data(X, y)
    if not isinstance(n_bins, (int, np.integer)) or n_bins < 1:
        raise ValueError("n_bins must be a positive integer")
    n_samples, n_features = X.shape
    mi_scores = np.zeros(n_features)

    y_vals, y_counts = np.unique(y, return_counts=True)
    p_y = y_counts / n_samples

    for f in range(n_features):
        x_binned = discretize(X[:, f], n_bins)
        x_vals, x_counts = np.unique(x_binned, return_counts=True)
        p_x = dict(zip(x_vals, x_counts / n_samples))

        mi = 0.0
        for xv in x_vals:
            for yi, yv in enumerate(y_vals):
                joint_mask = (x_binned == xv) & (y == yv)
                p_xy = np.sum(joint_mask) / n_samples
                if p_xy > 0:
                    mi += p_xy * np.log(p_xy / (p_x[xv] * p_y[yi]))
        mi_scores[f] = mi

    return mi_scores


def simple_logistic_importance(X, y, lr=0.1, epochs=100):
    X, y = _classification_data(X, y)
    if not np.isfinite(lr) or lr <= 0 or not isinstance(epochs, (int, np.integer)) or epochs <= 0:
        raise ValueError("lr must be positive and epochs must be a positive integer")
    n_samples, n_features = X.shape
    w = np.zeros(n_features)
    b = 0.0

    for _ in range(epochs):
        z = X @ w + b
        pred = 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))
        error = pred - y
        w -= lr * (X.T @ error) / n_samples
        b -= lr * np.mean(error)

    return w, b


def rfe(X, y, n_features_to_select=5, lr=0.1, epochs=100):
    X, y = _classification_data(X, y)
    if not isinstance(n_features_to_select, (int, np.integer)) or not 1 <= n_features_to_select <= X.shape[1]:
        raise ValueError("n_features_to_select must be between 1 and the number of columns")
    n_total = X.shape[1]
    remaining = list(range(n_total))
    rankings = np.ones(n_total, dtype=int)
    rank = n_total

    while len(remaining) > n_features_to_select:
        X_subset = X[:, remaining]
        w, _ = simple_logistic_importance(X_subset, y, lr, epochs)
        importances = np.abs(w)

        least_idx = np.argmin(importances)
        original_idx = remaining[least_idx]
        rankings[original_idx] = rank
        rank -= 1
        remaining.pop(least_idx)

    for idx in remaining:
        rankings[idx] = 1

    selected_mask = rankings == 1
    return selected_mask, rankings


def soft_threshold(w, alpha):
    w = np.asarray(w, dtype=float)
    if w.ndim != 1 or not np.isfinite(w).all() or not np.isfinite(alpha) or alpha < 0:
        raise ValueError("w must be finite 1D and alpha must be non-negative")
    return np.sign(w) * np.maximum(np.abs(w) - alpha, 0)


def l1_feature_selection(X, y, alpha=0.1, lr=0.01, epochs=500):
    X, y = _classification_data(X, y)
    if not np.isfinite(alpha) or alpha < 0 or not np.isfinite(lr) or lr <= 0 or not isinstance(epochs, (int, np.integer)) or epochs <= 0:
        raise ValueError("alpha must be non-negative; lr and epochs must be positive")
    n_samples, n_features = X.shape
    w = np.zeros(n_features)
    b = 0.0

    for _ in range(epochs):
        z = X @ w + b
        pred = 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))
        error = pred - y

        gradient_w = (X.T @ error) / n_samples
        gradient_b = np.mean(error)

        w -= lr * gradient_w
        w = soft_threshold(w, lr * alpha)
        b -= lr * gradient_b

    selected_mask = np.abs(w) > 1e-6
    return selected_mask, w


def gini_impurity(y):
    y = _binary_labels(y)
    classes, counts = np.unique(y, return_counts=True)
    probs = counts / len(y)
    return 1.0 - np.sum(probs ** 2)


def best_split(X, y, feature_idx):
    X, y = _classification_data(X, y)
    if not isinstance(feature_idx, (int, np.integer)) or not 0 <= feature_idx < X.shape[1]:
        raise ValueError("feature_idx must identify a column in X")
    values = np.unique(X[:, feature_idx])
    if len(values) <= 1:
        return None, -1.0
    best_threshold, best_gain = None, -1.0
    parent_gini = gini_impurity(y)
    n = len(y)
    step = max(1, (len(values) - 1) // min(20, len(values) - 1))
    for i in range(0, len(values) - 1, step):
        threshold = (values[i] + values[i + 1]) / 2.0
        left_mask = X[:, feature_idx] <= threshold
        n_left, n_right = np.sum(left_mask), n - np.sum(left_mask)
        if n_left == 0 or n_right == 0:
            continue
        gain = parent_gini - (n_left / n) * gini_impurity(y[left_mask]) - (n_right / n) * gini_impurity(y[~left_mask])
        if gain > best_gain:
            best_gain, best_threshold = gain, threshold
    return best_threshold, best_gain


def _build_tree_importance(X, y, feature_subset, max_depth, depth=0):
    n_features = X.shape[1]
    importances = np.zeros(n_features)

    if depth >= max_depth or len(np.unique(y)) <= 1 or len(y) < 4:
        return importances

    best_feature = None
    best_threshold = None
    best_gain = -1.0

    for f in feature_subset:
        threshold, gain = best_split(X, y, f)
        if gain > best_gain:
            best_gain = gain
            best_feature = f
            best_threshold = threshold

    if best_feature is None or best_gain <= 0:
        return importances

    importances[best_feature] += best_gain * len(y)

    left_mask = X[:, best_feature] <= best_threshold
    right_mask = ~left_mask

    importances += _build_tree_importance(X[left_mask], y[left_mask], feature_subset, max_depth, depth + 1)
    importances += _build_tree_importance(X[right_mask], y[right_mask], feature_subset, max_depth, depth + 1)

    return importances


def tree_importance(X, y, n_trees=50, max_depth=5, seed=42):
    X, y = _classification_data(X, y)
    if not isinstance(n_trees, (int, np.integer)) or n_trees < 1 or not isinstance(max_depth, (int, np.integer)) or max_depth < 1:
        raise ValueError("n_trees and max_depth must be positive integers")
    rng = np.random.RandomState(seed)
    n_samples, n_features = X.shape
    importances = np.zeros(n_features)

    for _ in range(n_trees):
        sample_idx = rng.choice(n_samples, size=n_samples, replace=True)
        n_subset = max(1, int(np.sqrt(n_features)))
        feature_subset = rng.choice(n_features, size=n_subset, replace=False)

        X_boot = X[sample_idx]
        y_boot = y[sample_idx]

        tree_imp = _build_tree_importance(X_boot, y_boot, feature_subset, max_depth)
        importances += tree_imp

    total = importances.sum()
    if total > 0:
        importances /= total

    return importances


def evaluate_accuracy(X, y, selected_mask, lr=0.1, epochs=200):
    X, y = _classification_data(X, y)
    selected_mask = np.asarray(selected_mask, dtype=bool)
    if selected_mask.ndim != 1 or len(selected_mask) != X.shape[1] or not selected_mask.any():
        raise ValueError("selected_mask must select at least one column")
    if len(y) < 4:
        raise ValueError("at least four rows are required for a train/test split")
    X_selected = X[:, selected_mask]
    n = len(y)
    split = int(0.8 * n)

    X_train, X_test = X_selected[:split], X_selected[split:]
    y_train, y_test = y[:split], y[split:]

    w, b = simple_logistic_importance(X_train, y_train, lr, epochs)
    z = X_test @ w + b
    preds = (1.0 / (1.0 + np.exp(-np.clip(z, -500, 500))) >= 0.5).astype(int)
    return np.mean(preds == y_test)


def feature_group(name):
    if "noise" in name:
        return "NOISE"
    if "corr" in name:
        return "CORR"
    return "INFO"


def print_feature_scores(names, scores, label, top_k=None):
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    print(f"\n  {label}:")
    for i, (idx, s) in enumerate(ranked[:top_k or len(ranked)]):
        print(f"    {i+1:>2}. {names[idx]:<12} {s:>8.4f} [{feature_group(names[idx])}]")


if __name__ == "__main__":
    print("=" * 60)
    print("FEATURE SELECTION METHODS")
    print("=" * 60)

    X, y, feature_names = make_feature_selection_data(500, seed=42)
    print(f"\nDataset: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"Feature groups: 5 informative, 5 correlated, 10 noise")
    print(f"Target: binary classification (y=1: {np.sum(y)}, y=0: {np.sum(y==0)})")

    n = len(y)
    split = int(0.8 * n)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    mean = X_train.mean(axis=0)
    std = X_train.std(axis=0)
    std[std == 0] = 1.0
    X_scaled_train = (X_train - mean) / std
    X_scaled_test = (X_test - mean) / std
    X_scaled = np.vstack([X_scaled_train, X_scaled_test])

    print("\n" + "-" * 60)
    print("1. VARIANCE THRESHOLD")
    print("-" * 60)
    var_mask, variances = variance_threshold(X_train, threshold=0.01)
    print(f"  Threshold: 0.01, surviving: {np.sum(var_mask)} / {len(var_mask)}")
    print_feature_scores(feature_names, variances, "Variances", top_k=10)

    print("\n" + "-" * 60)
    print("2. MUTUAL INFORMATION")
    print("-" * 60)
    mi_scores = mutual_information(X_train, y_train, n_bins=10)
    print_feature_scores(feature_names, mi_scores, "MI scores (top 10)", top_k=10)
    mi_selected = np.zeros(len(feature_names), dtype=bool)
    mi_selected[np.argsort(mi_scores)[-5:]] = True

    print("\n" + "-" * 60)
    print("3. RECURSIVE FEATURE ELIMINATION (RFE)")
    print("-" * 60)
    rfe_mask, rfe_rankings = rfe(X_scaled_train, y_train, n_features_to_select=5, lr=0.1, epochs=200)
    print(f"  Selected: {[feature_names[i] for i in range(len(feature_names)) if rfe_mask[i]]}")
    for idx, rank in sorted(enumerate(rfe_rankings), key=lambda x: x[1]):
        print(f"    Rank {rank:>2}: {feature_names[idx]:<12} [{feature_group(feature_names[idx])}]")

    print("\n" + "-" * 60)
    print("4. L1 (LASSO) FEATURE SELECTION")
    print("-" * 60)
    l1_mask, l1_weights = l1_feature_selection(X_scaled_train, y_train, alpha=0.05, lr=0.01, epochs=1000)
    print(f"  Nonzero weights: {np.sum(l1_mask)}")
    print(f"  Selected: {[feature_names[i] for i in range(len(feature_names)) if l1_mask[i]]}")
    print_feature_scores(feature_names, np.abs(l1_weights), "|Weights| (top 10)", top_k=10)

    print("\n" + "-" * 60)
    print("5. TREE-BASED IMPORTANCE")
    print("-" * 60)
    tree_imp = tree_importance(X_train, y_train, n_trees=100, max_depth=6, seed=42)
    print_feature_scores(feature_names, tree_imp, "Importance (top 10)", top_k=10)
    tree_selected = np.zeros(len(feature_names), dtype=bool)
    tree_selected[np.argsort(tree_imp)[-5:]] = True

    print("\n" + "=" * 60)
    print("METHOD AGREEMENT")
    print("=" * 60)
    all_masks = {"MI": mi_selected, "RFE": rfe_mask, "L1": l1_mask, "Tree": tree_selected}
    header = f"  {'Feature':<12}" + "".join(f" {n:>6}" for n in all_masks) + f" {'Total':>6}"
    print(f"\n{header}")
    print(f"  {'-'*12}" + " ------" * (len(all_masks) + 1))
    for i, fname in enumerate(feature_names):
        row = f"  {fname:<12}"
        count = sum(1 for m in all_masks.values() if m[i])
        for mask in all_masks.values():
            row += f" {'YES':>6}" if mask[i] else f" {'---':>6}"
        print(f"{row} {count:>6}")

    print("\n" + "=" * 60)
    print("ACCURACY COMPARISON")
    print("=" * 60)

    all_features_mask = np.ones(len(feature_names), dtype=bool)
    info_only_mask = np.array([i < 5 for i in range(len(feature_names))])

    experiments = [
        ("All 20 features", all_features_mask),
        ("Info only (5)", info_only_mask),
        ("MI top-5", mi_selected),
        ("RFE top-5", rfe_mask),
        ("L1 selected", l1_mask),
        ("Tree top-5", tree_selected),
    ]

    print(f"\n  {'Method':<20} {'Features':>10} {'Accuracy':>10}")
    print(f"  {'-'*20} {'-'*10} {'-'*10}")

    for name, mask in experiments:
        if np.sum(mask) == 0:
            print(f"  {name:<20} {int(np.sum(mask)):>10} {'N/A':>10}")
            continue
        acc = evaluate_accuracy(X_scaled, y, mask, lr=0.1, epochs=300)
        print(f"  {name:<20} {int(np.sum(mask)):>10} {acc:>10.4f}")

    print("\nDone.")
