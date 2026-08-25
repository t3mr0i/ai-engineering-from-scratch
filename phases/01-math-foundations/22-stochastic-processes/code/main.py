# Entry point for phases/01-math-foundations/22-stochastic-processes/docs/en.md.
# Delegates to the NumPy implementation in stochastic.py.
# The demo covers walks, Markov chains, Langevin/MH sampling, and diffusion.
# Canonical execution is `python3 main.py` from this code directory.
# Tests import the implementation directly and use seeded fixtures.

from pathlib import Path
import runpy


runpy.run_path(str(Path(__file__).with_name("stochastic.py")), run_name="__main__")
