# Distance Chooser Prompt

Before selecting a metric, request this evidence:

```text
data_type: <dense vector | sparse tokens | string | equal-bin distribution>
dimension_or_length: <value>
scale_sensitive: <yes/no>
zero_vector_or_empty_case: <contract>
candidate_metrics: <named functions>
validation_fixture: <two or three concrete points>
chosen_metric: <name and reason>
```

Decision notes:

- Use cosine when direction matters and positive magnitude should not dominate.
- Use L1/L2 when coordinate displacement has a meaningful scale.
- Use Jaccard for set overlap, edit distance for short strings, and Wasserstein for mass movement across equal bins.
- Use Mahalanobis only with a square, nonsingular covariance whose coordinates match the vectors.

Return sorted `(index, distance)` pairs for nearest-neighbor checks and store normalization with the index configuration.
