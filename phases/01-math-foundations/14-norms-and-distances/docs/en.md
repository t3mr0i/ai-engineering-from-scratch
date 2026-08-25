# Norms and Distances

> Choose a distance by the invariants your retrieval or comparison task actually needs.

**Type:** Reference
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 01 and 06 (vectors and probability tables)
**Time:** ~50 minutes

## Learning Objectives

- Compute L1, L2, Lp, and L-infinity norms and their induced distances.
- Explain why cosine similarity ignores positive magnitude while a dot product does not.
- Compare set, string, distribution, and covariance-aware distances on concrete fixtures.
- Invert a small covariance matrix and interpret a Mahalanobis score.
- Return sorted nearest-neighbor indices with an explicitly supplied metric.

## Metric contracts

`l1_norm`, `l2_norm`, `lp_norm`, and `linf_norm` operate on non-empty numeric sequences. All coordinate-wise pairs (`l1_distance`, `l2_distance`, `lp_distance`, `linf_distance`, `dot_product`, `cosine_similarity`, and `kl_divergence`) use one length guard: empty or unequal inputs raise `ValueError` instead of being silently truncated. `lp_norm` and `lp_distance` require `p > 0` or `p=math.inf`. `cosine_similarity` returns `0.0` if either vector is zero; `cosine_distance` is `1 - similarity`.

For sets, Jaccard similarity is intersection divided by union and the empty/empty case is defined as `1.0`. `edit_distance` is the dynamic-programming Levenshtein distance. `kl_divergence` compares non-empty, equal-length probability lists and returns infinity when positive mass in `p` meets zero mass in `q`. `wasserstein_1d` compares cumulative differences for non-empty, equal-length bins and raises `ValueError` for a shape mismatch.

Mahalanobis distance computes `(x-y)^T C^-1 (x-y)`, using the local Gauss-Jordan `invert_matrix`. The covariance matrix must be non-empty, square, dimension-matched, and nonsingular. `compute_covariance` additionally requires at least two non-empty, equal-width rows.

## Build It

Run the standard-library demo:

```bash
cd phases/01-math-foundations/14-norms-and-distances/code
python3 main.py
```

It prints norm ordering, a fixed pairwise comparison, cosine versus dot product, a seeded correlated covariance fixture, Jaccard and edit examples, KL/Wasserstein comparisons, and nearest-neighbor choices.

The smallest retrieval trace is:

```python
from distances import find_k_nearest

points = [[0, 0], [3, 4], [1, 1]]
squared_l2 = lambda a, b: sum((x - y) ** 2 for x, y in zip(a, b))
assert find_k_nearest([0, 0], points, squared_l2, k=2) == [(0, 0), (2, 2)]
```

## Use It

Choose cosine when direction matters more than document length; `[1,0]` and `[2,0]` are identical under cosine. Choose L2 when magnitude is meaningful. For sparse token sets use Jaccard; for short strings use edit distance; for equal-bin probability histograms use Wasserstein when movement across bins matters.

Use Mahalanobis only with a covariance estimate whose coordinates match the vectors. It discounts directions that naturally vary and scales the quadratic form by the inverse covariance; it is not a replacement for validating the covariance matrix.

`find_nearest_neighbor` returns `(index, distance)` and `find_k_nearest` returns sorted pairs. Both reject an empty dataset or a point whose length differs from the query; `find_k_nearest` requires `1 <= k <= len(dataset)`. The functions do not attach labels, normalize embeddings, or choose a metric for you.

## Ship It

The reusable artifact is [the distance chooser prompt](../../14-norms-and-distances/outputs/prompt-distance-chooser.md). It asks for vector length, scale sensitivity, sparsity, bin geometry, and covariance evidence before recommending a metric. Store the chosen metric and normalization with the index configuration.

## Exercises

1. Evaluate L1, L2, and L-infinity for `[3,-4]`, then compare cosine similarity for `[1,2,3]` and `[2,4,6]`.
2. Compute Jaccard for `{'a','b','c'}` and `{'b','c','d'}`, and edit distance for `kitten` → `sitting`.
3. Use covariance `[[2,0],[0,4]]` to compare Mahalanobis distances from `[0,0]` to `[2,0]` and `[0,4]`. Explain why equal Euclidean intuition would be misleading after scaling.

## Reference Solution

The first vector has L1 `7`, L2 `5`, and L-infinity `4`; the scaled pair has cosine similarity `1`. Jaccard is `0.5` and the edit distance is `3`. With the diagonal covariance, `[2,0]` has Mahalanobis distance `sqrt(2)`, while `[0,4]` has distance `2`; the second coordinate has larger natural variance, so its raw displacement is discounted. The retrieval acceptance check is the exact sorted index/distance list.

## Tests

```bash
python3 -m unittest discover tests -v
```

Eleven tests cover norm definitions, cosine zero/magnitude behavior, Jaccard/edit distance, Wasserstein shifts and shape errors, matrix inversion, Mahalanobis dimensions, nearest-neighbor ordering and `k` bounds, covariance input shape, and singular covariance rejection.
