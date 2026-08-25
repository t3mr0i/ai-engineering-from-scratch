# Naive Bayes choice card

Choose `MultinomialNB` when every feature is a non-negative count/frequency and `GaussianNB` when columns are continuous measurements. Record `alpha` for the multinomial model or `var_smoothing` for the Gaussian model, class priors, and split seed.

Before shipping, verify that `predict_proba` rows are finite and sum to one, and that a negative count is rejected rather than shifted silently. Accuracy and calibration must be reported on a held-out split; the generated text and continuous fixtures are mechanism checks only.

Boundary contract: feature matrices and labels must be non-empty with matching rows, split ratios must leave non-empty partitions, and `alpha`/`var_smoothing` must be finite and strictly positive.
