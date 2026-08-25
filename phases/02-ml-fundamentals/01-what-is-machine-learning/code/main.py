"""Canonical entry point for the introductory ML fixture."""

# Lesson: phases/02-ml-fundamentals/01-what-is-machine-learning/docs/en.md
# It delegates to the NumPy-only nearest-centroid demo.
# Run from this directory with: python3 main.py
# The output is deterministic for the documented seed.

from ml_intro import run_demo


if __name__ == "__main__":
    run_demo()
