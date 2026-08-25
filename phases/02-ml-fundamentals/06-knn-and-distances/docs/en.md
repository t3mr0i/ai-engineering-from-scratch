# K-Nearest Neighbors and Distances

> KNN does not compress the training table: it answers a query by measuring its nearest stored rows.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 01 norms and distances
**Time:** ~60 minutes

## Learning Objectives

- Compute L1, L2, cosine, and Minkowski distances with explicit shape checks.
- Implement classification votes and regression means with optional inverse-distance weights.
- Explain why feature scaling changes a distance-based decision.
- Query the local KD-tree and compare its result with exact neighbor semantics.
- Choose k using validation data rather than training accuracy alone.

## The query

KNN.fit stores numeric rows and labels; it performs no learned parameter update. At prediction time, _neighbors sorts every training row by the configured distance. Classification counts labels, while regression averages targets. With weighted=True, each neighbor contributes 1/(distance+1e-12). standardize returns the training means and scales, and constant columns become zero rather than dividing by zero.

KDTree recursively partitions rows by alternating feature axes. The lesson implementation collects exact distances for a clear reference result; it is an inspectable baseline, not a complexity promise. KDTree.query returns (distance, original_index, point) tuples.

## Build It

Run python3 main.py. It reports KNN accuracy on a seeded three-center fixture, the distances between [1,2] and [2,4], and the original index of one KD-tree neighbor. The exact accuracy is local to that fixture. The hand calculation is l1_distance([1,2],[4,6])=7 and l2_distance([1,2],[4,6])=5.

A three-row classification fixture is [[0],[1],[10]] with labels ["near","near","far"]. KNN(k=3) predicts near for query [0.5].

## Use It

Scale features such as age and income before distance calculations: otherwise the larger numeric unit can dominate. Try candidate values of k on a validation split. k=1 has low training error but can memorize noise; a very large k washes out local structure. The API rejects k=0, k>len(training), and mismatched row widths.

## Ship It

outputs/prompt-distance-metric-advisor.md records feature units, metric, k, scaling statistics, and whether weights are enabled. It also notes that the local KD-tree result is exact but the implementation does not benchmark a faster branch-pruning strategy.

## Exercises

1. Verify the L1/L2 values above and compare cosine distance for [1,0] and [2,0] (zero distance because the direction matches).
2. Fit the three-row classification fixture with k=1, then query 0.5 and 9.5; explain why the nearest row changes from a near label to far. For an exact distance tie, use the lower original training index as the deterministic tie-break.
3. Standardize [[1,10],[2,10],[3,10]] and explain why the constant second column becomes zero.

## Reference Solution

The distance calculations are 7 and 5, cosine distance is zero for positive multiples, and k=1 returns near for query 0.5 but far for query 9.5. KDTree and predict_with_neighbors preserve original training indices, including indices 1 and 2 for query 11 on [[0],[10],[20]]. The constant feature has mean 10 and zero scale, so its transformed values are zero. A complete handoff includes units and scaling statistics and avoids claiming that this reference implementation proves KD-tree speed.
