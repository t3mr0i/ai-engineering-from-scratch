# Canonical entry point for phases/01-math-foundations/01-linear-algebra-intuition/docs/en.md.
# Delegates to the from-scratch Vector and Matrix implementation in vectors.py.
# Keeping this wrapper makes the Python and Julia demos share one documented command.
# The lesson uses only the Python standard library and has no network or key inputs.
# Run from this directory with: python3 main.py

from pathlib import Path
import runpy


runpy.run_path(str(Path(__file__).with_name("vectors.py")), run_name="__main__")
