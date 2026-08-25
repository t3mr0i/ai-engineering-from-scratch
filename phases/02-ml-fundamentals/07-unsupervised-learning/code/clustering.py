"""Small, inspectable clustering algorithms implemented with the Python stdlib."""

# Lesson: phases/02-ml-fundamentals/07-unsupervised-learning/docs/en.md
# The module implements K-Means, DBSCAN, a spherical GMM, and agglomerative linkage.
# Inputs are rectangular non-empty numeric rows; validation makes edge cases visible.
# The demo compares compact blobs with density-based labels and reports local metrics.

from __future__ import annotations

import math
import random


def _data(data):
    rows = [list(map(float, row)) for row in data]
    if not rows or not rows[0] or any(len(row) != len(rows[0]) for row in rows):
        raise ValueError("data must be a non-empty rectangular matrix")
    return rows


def euclidean_distance(a, b):
    left, right = list(a), list(b)
    if not left or len(left) != len(right):
        raise ValueError("vectors must be non-empty and have equal length")
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(left, right)))


def kmeans(data, k, max_iterations=100, seed=42):
    rows = _data(data)
    if not 1 <= k <= len(rows) or max_iterations < 1:
        raise ValueError("k must be between 1 and the number of rows")
    rng = random.Random(seed)
    centroids = [list(row) for row in rng.sample(rows, k)]
    assignments = [-1] * len(rows)
    for _ in range(max_iterations):
        new_assignments = [min(range(k), key=lambda j: euclidean_distance(row, centroids[j])) for row in rows]
        clusters = [[row for row, label in zip(rows, new_assignments) if label == j] for j in range(k)]
        new_centroids = [
            [sum(row[d] for row in cluster) / len(cluster) for d in range(len(rows[0]))] if cluster else list(centroids[j])
            for j, cluster in enumerate(clusters)
        ]
        assignments = new_assignments
        if all(euclidean_distance(old, new) < 1e-8 for old, new in zip(centroids, new_centroids)):
            centroids = new_centroids
            break
        centroids = new_centroids
    return assignments, centroids


def compute_inertia(data, assignments, centroids):
    rows = _data(data)
    if len(rows) != len(assignments) or not centroids:
        raise ValueError("assignments must match data and centroids cannot be empty")
    if any(not 0 <= label < len(centroids) for label in assignments):
        raise ValueError("assignment index is out of range")
    return sum(euclidean_distance(row, centroids[label]) ** 2 for row, label in zip(rows, assignments))


def silhouette_score(data, assignments):
    rows = _data(data)
    if len(rows) != len(assignments):
        raise ValueError("assignments must match data")
    clusters = {}
    for index, label in enumerate(assignments):
        clusters.setdefault(label, []).append(index)
    if len(clusters) < 2:
        return 0.0
    scores = []
    for index, own_label in enumerate(assignments):
        own = [j for j in clusters[own_label] if j != index]
        if not own:
            scores.append(0.0)
            continue
        within = sum(euclidean_distance(rows[index], rows[j]) for j in own) / len(own)
        between = min(sum(euclidean_distance(rows[index], rows[j]) for j in members) / len(members) for label, members in clusters.items() if label != own_label)
        scores.append((between - within) / max(within, between) if max(within, between) else 0.0)
    return sum(scores) / len(scores)


def find_best_k(data, max_k=10):
    rows = _data(data)
    if not 1 <= max_k <= len(rows):
        raise ValueError("max_k must be between 1 and the number of rows")
    return [compute_inertia(rows, *kmeans(rows, k)) for k in range(1, max_k + 1)]


def dbscan(data, eps, min_samples):
    rows = _data(data)
    if eps <= 0 or min_samples < 1:
        raise ValueError("eps must be positive and min_samples at least one")
    labels = [-1] * len(rows)
    visited = [False] * len(rows)
    cluster_id = 0

    def neighbors(index):
        return [j for j, row in enumerate(rows) if euclidean_distance(rows[index], row) <= eps]

    for index in range(len(rows)):
        if visited[index]:
            continue
        visited[index] = True
        nearby = neighbors(index)
        if len(nearby) < min_samples:
            continue
        labels[index] = cluster_id
        queue = list(nearby)
        cursor = 0
        while cursor < len(queue):
            current = queue[cursor]
            cursor += 1
            if not visited[current]:
                visited[current] = True
                current_neighbors = neighbors(current)
                if len(current_neighbors) >= min_samples:
                    queue.extend(item for item in current_neighbors if item not in queue)
            if labels[current] == -1:
                labels[current] = cluster_id
        cluster_id += 1
    return labels


def gmm(data, k, max_iterations=100, seed=42):
    rows = _data(data)
    if not 1 <= k <= len(rows) or max_iterations < 1:
        raise ValueError("k and max_iterations are invalid")
    rng = random.Random(seed)
    dimension = len(rows[0])
    means = [list(row) for row in rng.sample(rows, k)]
    variances = [1.0] * k
    weights = [1 / k] * k
    responsibilities = [[1 / k] * k for _ in rows]

    def log_density(row, mean, variance):
        squared_distance = sum((value - center) ** 2 for value, center in zip(row, mean))
        return -0.5 * dimension * math.log(2 * math.pi * variance) - squared_distance / (2 * variance)

    def normalized_responsibilities(row):
        log_probabilities = [math.log(weights[j]) + log_density(row, means[j], variances[j]) for j in range(k)]
        maximum = max(log_probabilities)
        shifted = [math.exp(value - maximum) for value in log_probabilities]
        total = sum(shifted)
        return [value / total for value in shifted]

    for _ in range(max_iterations):
        for i, row in enumerate(rows):
            responsibilities[i] = normalized_responsibilities(row)
        old = [list(mean) for mean in means]
        for j in range(k):
            mass = sum(resp[j] for resp in responsibilities)
            if mass <= 1e-12:
                continue
            weights[j] = mass / len(rows)
            means[j] = [sum(resp[j] * row[d] for resp, row in zip(responsibilities, rows)) / mass for d in range(dimension)]
            variances[j] = max(1e-6, sum(resp[j] * sum((row[d] - means[j][d]) ** 2 for d in range(dimension)) for resp, row in zip(responsibilities, rows)) / (mass * dimension))
        if sum(euclidean_distance(before, after) for before, after in zip(old, means)) < 1e-7:
            break
    assignments = [max(range(k), key=responsibility.__getitem__) for responsibility in responsibilities]
    return assignments, means, weights, responsibilities


def agglomerative_clustering(data, n_clusters=3, linkage="ward"):
    rows = _data(data)
    if not 1 <= n_clusters <= len(rows) or linkage not in {"single", "complete", "average", "ward"}:
        raise ValueError("n_clusters or linkage is invalid")
    clusters = {i: [i] for i in range(len(rows))}
    active = list(clusters)
    history = []

    def distance(left, right):
        pairs = [euclidean_distance(rows[i], rows[j]) for i in clusters[left] for j in clusters[right]]
        if linkage == "single":
            return min(pairs)
        if linkage == "complete":
            return max(pairs)
        if linkage == "average":
            return sum(pairs) / len(pairs)
        merged = clusters[left] + clusters[right]
        mean = [sum(rows[i][d] for i in merged) / len(merged) for d in range(len(rows[0]))]
        left_mean = [sum(rows[i][d] for i in clusters[left]) / len(clusters[left]) for d in range(len(rows[0]))]
        right_mean = [sum(rows[i][d] for i in clusters[right]) / len(clusters[right]) for d in range(len(rows[0]))]
        return sum(euclidean_distance(rows[i], mean) ** 2 for i in merged) - sum(euclidean_distance(rows[i], left_mean) ** 2 for i in clusters[left]) - sum(euclidean_distance(rows[i], right_mean) ** 2 for i in clusters[right])

    next_id = len(rows)
    while len(active) > n_clusters:
        left, right = min(((a, b) for pos, a in enumerate(active) for b in active[pos + 1:]), key=lambda pair: distance(*pair))
        clusters[next_id] = clusters[left] + clusters[right]
        history.append((left, right, distance(left, right), len(clusters[next_id])))
        active.remove(left)
        active.remove(right)
        active.append(next_id)
        next_id += 1
    labels = [next(index for index, cluster in enumerate(active) if point in clusters[cluster]) for point in range(len(rows))]
    return labels, history


def make_blobs(centers, n_per_cluster=30, spread=0.5, seed=42):
    if not centers or n_per_cluster < 1 or spread < 0:
        raise ValueError("centers, n_per_cluster, and spread are invalid")
    rng = random.Random(seed)
    data, labels = [], []
    for label, center in enumerate(centers):
        for _ in range(n_per_cluster):
            data.append([value + rng.gauss(0, spread) for value in center])
            labels.append(label)
    return data, labels


def make_moons(n_samples=100, noise=0.1, seed=42):
    if n_samples < 2 or noise < 0:
        raise ValueError("n_samples and noise are invalid")
    rng = random.Random(seed)
    first_count = n_samples // 2
    second_count = n_samples - first_count
    data, labels = [], []
    for label, offset, count in ((0, (0, 0), first_count), (1, (1, -0.5), second_count)):
        for i in range(count):
            angle = math.pi * i / max(count - 1, 1)
            sign = 1 if label == 0 else -1
            data.append([offset[0] + math.cos(angle) + rng.gauss(0, noise), offset[1] + sign * math.sin(angle) + rng.gauss(0, noise)])
            labels.append(label)
    return data, labels


def run_demo():
    data, _ = make_blobs([[0, 0], [4, 0], [0, 4]], n_per_cluster=20, spread=0.2)
    assignments, centroids = kmeans(data, 3)
    density_labels = dbscan(data, eps=0.6, min_samples=3)
    _, _, weights, responsibilities = gmm(data, 3)
    print("Unsupervised learning")
    print(f"kmeans_inertia={compute_inertia(data, assignments, centroids):.3f} silhouette={silhouette_score(data, assignments):.3f}")
    print(f"dbscan_clusters={len({label for label in density_labels if label >= 0})} gmm_weights={[round(value, 3) for value in weights]}")
    print(f"responsibility_sum={sum(responsibilities[0]):.3f}")


if __name__ == "__main__":
    run_demo()
