# Evaluation report recipe

1. Run `python3 code/main.py` and record the train/validation/test sizes.
2. State the split seed and whether folds are ordinary or stratified.
3. Report confusion counts before accuracy, precision, recall, and F1.
4. Report ROC-AUC from ranked scores and MSE/RMSE/MAE/R-squared for regression.
5. Keep the test set untouched until the final selected model is fitted.

The local acceptance fixture has 120 classification rows with a 60/20/20 split. It is a reproducibility check for this lesson’s implementations, not a production performance claim.
