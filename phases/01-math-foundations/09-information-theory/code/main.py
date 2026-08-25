# Canonical entry point for phases/01-math-foundations/09-information-theory/docs/en.md.
# Runs the local information-theory fixtures without network access or optional packages.
# The implementation lives in information_theory.py so the primitives stay importable in tests.
# Run from this directory with: python3 main.py.
# All output is bounded and terminates after the listed demonstrations.

from pathlib import Path
import runpy


runpy.run_path(str(Path(__file__).with_name("information_theory.py")), run_name="__main__")
