# Compatibility entry point for phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md.
# Re-exports the dependency-safe diagnostics from main.py without importing torch.
# Keep this historical filename importable for notebooks and existing callers.
# Run from this directory with: python3 debug_neural_nets.py

from main import *  # noqa: F401,F403


if __name__ == "__main__":
    raise SystemExit(main())
