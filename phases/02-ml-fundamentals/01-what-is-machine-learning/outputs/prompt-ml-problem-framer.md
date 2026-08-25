---
name: prompt-ml-problem-framer
description: Frame a problem before choosing a learned model
phase: 2
lesson: 1
---

# ML problem-framing handoff

Use this artifact before writing a model. Record the input row shape, target definition, availability time, and the baseline that a model must beat.

1. Name the learning setup: supervised classification/regression, unsupervised structure discovery, or reward-driven interaction.
2. Write the target in one measurable sentence. For classification, list the label values; for regression, include units.
3. List each feature and whether it exists at prediction time. Mark any future or target-derived field as leakage.
4. Select a metric and a validation split. Include a majority baseline for classification or a mean-target baseline for regression.
5. State why a deterministic rule is not sufficient. If a published formula already maps inputs to outputs, ship the rule instead.

For this lesson's fixture, the nearest-centroid contract is a NumPy matrix with at least two classes and a matching one-dimensional label vector. Report the split seed, train/test shapes, centroid accuracy, random baseline, and majority baseline. A score from this fixture is a debugging signal, not a production threshold.
