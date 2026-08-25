# Tuning experiment brief

Declare the model, parameter space, validation split, seed, and evaluation budget before running a search. Use `grid_search` for a small explicit Cartesian product, `random_search` for broad ranges, or `SimpleBayesianOptimizer` when each local objective evaluation is costly.

Record `history` length, best parameter dictionary, negative-MSE score, and the corresponding positive MSE. Do not use the test rows to choose a configuration. The scratch Bayesian optimizer’s surrogate and expected-improvement loop are educational and should be reported as such.
