# Entry point for phases/11-llm-engineering/10-evaluation/docs/en.md.
# Delegates to the original eval_framework.py lesson implementation.
# Keeps the historical source filename importable while providing the canonical main.py.
# Uses only Python standard-library loading; dependencies remain owned by the lesson source.
# Run from this directory with: python3 main.py

from pathlib import Path
import runpy


runpy.run_path(str(Path(__file__).with_name("eval_framework.py")), run_name="__main__")
