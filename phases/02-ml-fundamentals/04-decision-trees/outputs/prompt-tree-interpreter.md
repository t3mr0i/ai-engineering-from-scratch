---
name: prompt-tree-interpreter
description: Interpret an inspectable scratch decision tree
phase: 2
lesson: 4
---

# Tree interpretation handoff

Given a serialized tree, report the root feature and threshold, the leaf values, task type, max_depth/min_samples settings, and held-out score. Translate each root-to-leaf path into a rule using the feature order supplied with the model.

Treat feature_importances_ as normalized accumulated impurity reduction. Ask whether high-cardinality or ID-like fields had more candidate thresholds before calling a feature important. Compare a pruned tree with the random forest's vote; a forest's averaging can reduce variance but does not make leakage harmless.

The local contract rejects ragged rows and unfitted prediction. Include the seed, bootstrap count, criterion, and the exact input width in a reusable handoff. Never present a toy fixture's accuracy as an operating guarantee.
