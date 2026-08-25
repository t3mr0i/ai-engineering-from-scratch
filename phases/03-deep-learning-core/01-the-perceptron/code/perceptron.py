# Compatibility import for callers that used the former support filename.
# The canonical implementation lives in main.py and is documented in docs/en.md.
# This module intentionally adds no top-level training or random side effects.
# It keeps the four public names available to older lesson snippets.

from main import Perceptron, TwoLayerNetwork, xor_network, xor_predict

__all__ = ["Perceptron", "TwoLayerNetwork", "xor_network", "xor_predict"]
