# Ensemble selection note

Given a signed classification fixture, first compare one tree with AdaBoost and bagging using the same `train_test_split` seed. If the single tree varies across resamples, prefer the bagging evidence; if shallow learners leave a repeatable residual pattern, inspect boosting. Use stacking only when base learners expose genuinely different predictions and the out-of-fold contract is preserved.

Include estimator counts, seed, train/test metric, and the exact class convention in the handoff. This note is a decision aid for the local scratch implementations, not a promise that one ensemble wins every dataset.
