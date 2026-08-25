# Entry point for phases/01-math-foundations/19-complex-numbers/docs/en.md.
# Delegates to the standard-library implementation in complex_numbers.py.
# The demo covers arithmetic, rotations, roots of unity, DFT, and encodings.
# Canonical execution is `python3 main.py` from this code directory.
# Tests import the implementation directly and check numerical identities.

from pathlib import Path
import runpy


runpy.run_path(str(Path(__file__).with_name("complex_numbers.py")), run_name="__main__")
