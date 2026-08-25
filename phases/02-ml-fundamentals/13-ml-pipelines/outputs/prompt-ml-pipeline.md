# NumPy pipeline handoff

Input dictionaries must contain `age`, `income`, `score`, `city`, `plan`, and `target`. Fit a `FullPipeline` on the training dictionary with numeric columns [`age`, `income`, `score`] and categorical columns [`city`, `plan`]; call `predict` or `score` on later dictionaries without fitting again.

Acceptance checks: missing numeric values are finite after `MedianImputer`, repeated seeded cross-validation returns the same fold scores, and an unseen category produces a fixed-width all-zero one-hot block. Keep the fitted medians, scales, and category lists with the model. This artifact specifies the local array contract and does not claim dataframe/framework compatibility.
