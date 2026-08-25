"""Canonical Python entry point for the logistic-regression lesson."""

# Lesson: phases/02-ml-fundamentals/03-logistic-regression/docs/en.md
# It runs the stdlib-only binary and softmax examples without network access.
# main.jl contains the parallel Julia implementation.
# Run from this directory with: python3 main.py

from logistic_regression import run_demo


if __name__ == "__main__":
    run_demo()
