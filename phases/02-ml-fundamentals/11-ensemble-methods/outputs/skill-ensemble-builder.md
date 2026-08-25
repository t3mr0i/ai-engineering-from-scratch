# Scratch ensemble builder

Use labels `-1` and `1` for `AdaBoostScratch` and `DecisionStump`. Record the split seed and estimator count. For regression, compare a `SimpleRegressionTree` baseline with `GradientBoostingScratch` on the same rows. For variance diagnostics, use `BaggingClassifier` and record its bootstrap count. If using `StackingClassifier`, record the number of base factories and folds; its meta learner must see out-of-fold predictions.

Acceptance evidence is finite predictions, one stored learner per requested estimator, and a metric computed on a held-out split. Do not infer a universal ranking from the generated fixture.
