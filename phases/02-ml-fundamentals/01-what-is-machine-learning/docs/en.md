# What Is Machine Learning

> Turn a small, labeled table into a prediction, then measure what the model did not see.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 01 math foundations
**Time:** ~55 minutes

## Learning Objectives

- Distinguish supervised, unsupervised, and reinforcement-learning problem statements.
- Explain why a held-out split is evidence about generalization rather than memorization.
- Implement and inspect a nearest-centroid classifier with NumPy.
- Compare a learned classifier with random and majority baselines.
- Decide when a stable deterministic rule is preferable to a learned model.

## The idea

Traditional software receives rules and data and emits an answer. In supervised learning, examples contain both features and a target; fitting turns those examples into parameters that can be applied to a new row. A house-price target is continuous (regression), while a spam label is categorical (classification). Unsupervised methods receive features without a target and expose structure such as groups. Reinforcement learning receives rewards after actions.

The local implementation uses a deliberately small model. NearestCentroid.fit computes one mean feature vector per class. predict compares a new row with those means using squared Euclidean distance, and score counts correct labels. It is useful because every learned number can be printed and checked; it is not a claim that centroids solve every real classification problem.

## Build It

From code/, run python3 main.py. The seeded fixture has 240 rows and two features; a 75/25 split produces train_shape=(180, 2) and test_shape=(60, 2). The output prints two centroids, held-out accuracy, and the random/majority baselines. The exact decimals are data from seed 42, not a promised production score.

To inspect one decision, fit on [[0, 0], [4, 4]] with labels [0, 1]. The query [1, 1] is closer to class 0 because its squared distances are 2 and 18.

## Use It

Import NearestCentroid, fit it on rows and labels, and call predict on rows with the same feature width. fit rejects an empty matrix or a single-class training set. predict rejects a row with the wrong feature count, and calling it before fit raises RuntimeError. Keep those checks at the boundary when this artifact is embedded in a data pipeline.

## Ship It

The reusable handoff is outputs/prompt-ml-problem-framer.md. Before using a model, record the feature rows, target definition, split seed, baseline, and an acceptance threshold. A deterministic tax table, for example, should remain a rule: a model would add an unneeded failure mode and a harder audit trail.

## Exercises

1. Run the canonical command and record all four reported metrics. Explain which two numbers are baselines.
2. Change separation from 2.0 to 0.5 in the fixture. Predict the direction of the centroid classifier's held-out accuracy and explain why overlapping class clouds make the decision less reliable.
3. Fit the two-row example above, then call predict([[1, 1, 2]]). Capture the ValueError and state which shape contract it enforces.

## Reference Solution

A correct submission shows the (180, 2)/(60, 2) split, two centroids, and three bounded accuracy values. The two-row trace assigns [1, 1] to class 0 from the 2-versus-18 distance comparison. The shape probe raises ValueError instead of silently dropping a feature, and the artifact names a deterministic rule as the baseline when no unknown mapping must be learned.
