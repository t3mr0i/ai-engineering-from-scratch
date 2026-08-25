# Feature-engineering handoff

Run from the lesson directory with `python3 code/main.py` (or `cd code && python3 main.py`). Fit numeric statistics and category/vocabulary maps on the training split only.

Acceptance checks:

- `min_max_scale([10, 20, 30])` is `[0.0, 0.5, 1.0]`.
- `impute_median([1.0, None, 5.0])` returns `[1.0, 3.0, 5.0]` and fill `3.0`.
- `one_hot_encode(["b", "a", "b"])` returns categories `["a", "b"]` and width two.
- A word present in every document has TF-IDF weight zero under this implementation.

Record the returned category/vocabulary maps with the model artifact. Target encoding must never use validation or test targets to create its map. These checks validate transformation contracts; they do not validate a downstream model’s accuracy.

Boundary contract: pass equal-length non-empty vectors, a positive integer `n_bins`, a non-negative finite smoothing value, and rectangular non-empty feature matrices. Empty documents are allowed and produce zero TF-IDF rows; an empty document collection is rejected.
