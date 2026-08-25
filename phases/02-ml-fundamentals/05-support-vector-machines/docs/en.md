# Support Vector Machines

> Find a separating hyperplane while keeping the nearest correctly classified points at a margin.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 01 optimization and norms
**Time:** ~60 minutes

## Learning Objectives

- Evaluate hinge loss from the signed margin y*(w·x+b).
- Train the primal LinearSVM with a lambda regularizer and inspect its support vectors.
- Explain why points outside the unit margin have zero hinge loss.
- Compare linear, polynomial, and RBF kernel values on concrete vectors.
- Separate a local toy result from a claim about a production classifier.

## The margin

The scratch implementation expects labels -1 and 1. Its objective is average hinge loss plus 0.5*lambda_param*||w||². A stochastic update shrinks weights every step; points with margin below one also contribute the label-scaled feature gradient. margin_width returns 2/||w||, and find_support_vectors reports training indices whose margin is within a caller-supplied tolerance of one. The code uses lambda_param directly; it does not expose a library-style C alias.

Kernel helpers expose the comparisons used by a kernel method: linear_kernel is a dot product, polynomial_kernel(x,z)=(x·z+c)^degree, and rbf_kernel is exp(-gamma*||x-z||²). compute_kernel_matrix fills a symmetric matrix. The Julia entry point is a standard-library parallel path.

## Build It

Run python3 main.py from code/. The command prints a hinge-loss table, fits the seeded linear fixture, and shows kernel values. For the direct calculation, hinge_loss([[2]], [1], [1], 0) is zero because the signed margin is 2; hinge_loss([[0.5]], [1], [1], 0) is 0.5.

A four-row separator is X=[[-2],[-1],[1],[2]], y=[-1,-1,1,1]. Fit it for 200 epochs and inspect predictions, margin_width, and the support-vector indices.

## Use It

Use a soft margin when labels can be noisy; tune lambda_param against held-out data. A small lambda permits a wider, less-regularized fit, while a larger lambda shrinks weights more strongly. dot, kernels, and LinearSVM reject empty or mismatched vectors instead of truncating them with zip.

## Ship It

outputs/skill-svm-kernel-chooser.md records the label encoding, lambda, kernel parameters, support-vector tolerance, and validation accuracy. It should state that the local examples are low-dimensional fixtures; no test here establishes a deployment SLO.

## Exercises

1. Evaluate the two hinge-loss calls in Build It and explain the unit-margin boundary.
2. Compare rbf_kernel([0,0],[0,0]) with rbf_kernel([0,0],[1,0]); explain why the first is exactly one.
3. Fit the four-row separator and verify all predictions are correct. Then pass label 0 and capture the explicit validation error.

## Reference Solution

The first hinge loss is zero and the second is 0.5. The RBF self-similarity is one and the farther vector has a smaller positive similarity. The linear fixture reaches at least 75% accuracy in the tests, reports a positive margin width, and rejects labels outside {-1,1}.
