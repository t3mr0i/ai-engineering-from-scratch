"""Canonical Python entry point for the linear-regression lesson."""

# Lesson: phases/02-ml-fundamentals/02-linear-regression/docs/en.md
# The local implementation is stdlib-only and mirrors the Julia entry point.
# Run from this directory with: python3 main.py
# It prints fitted parameters, R-squared, and a ridge fixture summary.

from linear_regression import run_demo


if __name__ == "__main__":
    run_demo()
