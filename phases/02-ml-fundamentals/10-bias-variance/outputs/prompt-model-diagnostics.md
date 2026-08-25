# Polynomial diagnostic handoff

Run `python3 code/main.py` with the recorded degree list, `n_bootstrap`, `n_train`, `n_test`, noise level, and ridge `lam`. Preserve the resulting `bias_sq`, `variance`, `noise`, and `total_error` columns.

Interpret a high train/test error with a small gap as a bias signal; interpret a low train error with a large test gap as a variance signal. Confirm the conclusion with a second seeded fixture. Treat `find_optimal` as a choice among the supplied local degrees, not a general law about polynomial capacity.
