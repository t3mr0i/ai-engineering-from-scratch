# Entry point for phases/03-deep-learning-core/12-intro-to-jax/docs/en.md.
# Delegates to the original jax_intro.py lesson implementation.
# Keeps the historical source filename importable while providing the canonical main.py.
# Uses only Python standard-library loading; dependencies remain owned by the lesson source.
# Run from this directory with: python3 main.py

from pathlib import Path
import runpy


runpy.run_path(str(Path(__file__).with_name("jax_intro.py")), run_name="__main__")
