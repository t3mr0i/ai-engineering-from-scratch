# Entry point for phases/02-ml-fundamentals/11-ensemble-methods/docs/en.md.
# Delegates to the original ensembles.py lesson implementation.
# Keeps the historical source filename importable while providing the canonical main.py.
# Uses only Python standard-library loading; dependencies remain owned by the lesson source.
# Run from this directory with: python3 main.py

from pathlib import Path
import runpy


lesson = runpy.run_path(str(Path(__file__).with_name("ensembles.py")), run_name="lesson_ensembles")
X, y = lesson["make_classification_data"](n_samples=160, n_features=5)
X_train, X_test, y_train, y_test = lesson["train_test_split"](X, y)
model = lesson["AdaBoostScratch"](n_estimators=12)
model.fit(X_train, y_train)
print("AdaBoost quick demo")
print(f"  train accuracy: {model.accuracy(X_train, y_train):.3f}")
print(f"  test accuracy:  {model.accuracy(X_test, y_test):.3f}")
