# Canonical Python entry point for phases/02-ml-fundamentals/09-model-evaluation/docs/en.md.
# It runs a bounded split/metric fixture from the same module used by the tests.
# The lesson remains stdlib-only and keeps the Julia entry point as a parallel implementation.
# Run from this directory with: python3 main.py

from evaluation import SimpleLogistic, accuracy, auc_roc, make_classification_data, train_val_test_split


X, y = make_classification_data(n=120, seed=7)
X_train, y_train, X_val, y_val, X_test, y_test = train_val_test_split(X, y, seed=7)
model = SimpleLogistic(lr=0.1, epochs=120)
model.fit(X_train, y_train)
pred = [model.predict(row) for row in X_test]
scores = [model.predict_proba(row) for row in X_test]
print("Evaluation quick demo")
print(f"  split sizes: train={len(y_train)}, val={len(y_val)}, test={len(y_test)}")
print(f"  test accuracy: {accuracy(y_test, pred):.3f}")
print(f"  test ROC-AUC: {auc_roc(y_test, scores):.3f}")
