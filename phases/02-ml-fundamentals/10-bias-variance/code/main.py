# Canonical entry point for phases/02-ml-fundamentals/10-bias-variance/docs/en.md.
# It computes a small repeated-fit decomposition using the local polynomial code.
# NumPy is the only dependency and no plotting or estimator package is required.
# Run from this directory with: python3 main.py

from bias_variance import bias_variance_decomposition, find_optimal


results = bias_variance_decomposition([1, 3, 8], n_bootstrap=24, n_train=24, n_test=40)
print("Bias-variance quick demo")
for degree, terms in results.items():
    print(f"  degree={degree}: bias2={terms['bias_sq']:.4f}, variance={terms['variance']:.4f}, total={terms['total_error']:.4f}")
print(f"  lowest local total error: degree={find_optimal(results)}")
