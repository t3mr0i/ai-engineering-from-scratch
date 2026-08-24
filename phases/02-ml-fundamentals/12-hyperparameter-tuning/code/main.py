# Entry point for phases/02-ml-fundamentals/12-hyperparameter-tuning/docs/en.md.
# Delegates to the original tuning.py lesson implementation.
# Keeps the historical source filename importable while providing the canonical main.py.
# Uses only Python standard-library loading; dependencies remain owned by the lesson source.
# Run from this directory with: python3 main.py

from pathlib import Path
import runpy


lesson = runpy.run_path(str(Path(__file__).with_name("tuning.py")), run_name="lesson_tuning")
X_train, y_train, X_val, y_val, _, _ = lesson["make_data"](n_samples=120)
space = {
    "n_estimators": [4, 8],
    "learning_rate": [0.05, 0.15],
    "max_depth": [2],
}
best, score, history = lesson["grid_search"](space, X_train, y_train, X_val, y_val)
print("Hyperparameter search quick demo")
print(f"  evaluated: {len(history)} configurations")
print(f"  best: {best}")
print(f"  validation MSE: {-score:.4f}")
