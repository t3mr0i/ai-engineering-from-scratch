# Compatibility entry point for phases/03-deep-learning-core/12-intro-to-jax/docs/en.md.
# Re-exports the executable functional bridge; it deliberately does not import JAX.
# Keep this filename for readers comparing the conceptual lesson with its code.
# Run from this directory with: python3 jax_intro.py

from main import *  # noqa: F401,F403


if __name__ == "__main__":
    raise SystemExit(main())
