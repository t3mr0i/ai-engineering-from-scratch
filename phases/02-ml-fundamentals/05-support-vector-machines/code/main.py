"""Canonical Python entry point for the scratch SVM lesson."""

# Lesson: phases/02-ml-fundamentals/05-support-vector-machines/docs/en.md
# It executes the stdlib-only svm.py demo; main.jl is the parallel Julia path.
# The local convention is lambda regularization, with no hidden C/SDK dependency.
# Run from this directory with: python3 main.py

from svm import demo_hinge_loss, demo_linear_svm, demo_kernel_functions


if __name__ == "__main__":
    demo_hinge_loss()
    demo_linear_svm()
    demo_kernel_functions()
