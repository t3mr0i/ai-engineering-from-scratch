# Hyperparameter Tuning

> Search is an experiment budget: define the space, score on validation data, and keep the test set for the final choice.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 02 Lessons 09–11 (evaluation, bias/variance, and ensembles)
**Time:** ~85 minutes

## Learning Objectives

- Enumerate a Cartesian product with `grid_search` and relate its history length to the parameter grid.
- Sample discrete, integer, linear-float, and log-float specifications with `random_search`.
- Explain why validation score is stored as negative MSE so larger is better for selection.
- Follow `SimpleBayesianOptimizer` from random warm-up through an RBF surrogate and expected improvement.
- Report search budget and validation protocol without treating the best validation score as an unbiased test estimate.

## The local search problem

`code/tuning.py` creates a fixed NumPy regression fixture with 240 training, 80 validation, and 80 test rows for `make_data(400)`. `GBMForTuning` is the local model. `neg_mse` returns the negative of the validation mean squared error; therefore a less negative score is better. The module implements all three search strategies directly and has no tuning-service dependency.

## Build It

Run `python3 main.py` for a four-configuration grid (`n_estimators` 4/8, learning rate 0.05/0.15, depth 2). The output includes `evaluated: 4`, the selected dictionary, and the validation MSE. `grid_search` returns `(best_params, best_score, history)`, and each history item stores a copied parameter dictionary.

`sample_param` accepts a list, `("int", low, high)`, `("float", low, high)`, or `("log_float", low, high)`. `random_search` converts integer-like model fields back to `int` before fitting. `SimpleBayesianOptimizer` takes `n_initial` random suggestions, stores parameter vectors and scores, then evaluates expected improvement over 500 random candidates. It is an educational surrogate, not a claim of optimal Bayesian inference.

## Use It

Choose a small grid when a few discrete values are meaningful; use random search when a continuous range matters; use the scratch Bayesian loop when each evaluation is expensive and the score is reasonably smooth. Keep one validation protocol fixed across strategies. A higher validation score only wins inside the stated fixture and budget; after choosing parameters, refit on the permitted training data and use the held-out test split once.

## Ship It

`outputs/prompt-tuning-strategy.md` is a reusable search brief. It names the model, parameter spec, trial budget, validation metric, seed, and final test rule. The artifact intentionally points to `grid_search`, `random_search`, and `SimpleBayesianOptimizer`; no external optimizer or package installation is part of the acceptance path.

## Exercises

1. Change the grid to two estimators, three learning rates, and two depths. Predict the history length before running `grid_search`, then verify it.
2. Draw ten `("log_float", 0.01, 1.0)` values with a seeded `RandomState`. Check bounds and explain why equal spacing in log space differs from equal spacing in linear space.
3. Run `random_search(..., n_iter=5)` twice with the same seed. Compare the parameter histories and the best negative-MSE score.
4. Run `SimpleBayesianOptimizer` with a one-dimensional objective `-(x-0.25)**2`. Count warm-up versus surrogate suggestions and plot no conclusion beyond this local objective.

## Reference Solution

A correct submission gives the predicted grid count, reproduces the seeded random history, distinguishes negative MSE from MSE, and records the Bayesian warm-up count and total observations. It reports all budgets and leaves the test rows out of selection; a validation winner alone is not called a production guarantee.
