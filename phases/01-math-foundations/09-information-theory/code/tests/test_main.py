# Executable numerical tests for phases/01-math-foundations/09-information-theory/docs/en.md.
# These tests exercise the same offline fixtures used by main.py rather than checking only text.
# They deliberately use unittest and the Python standard library.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.
# No network, model, or plotting dependency is required.

from __future__ import annotations

import math
from pathlib import Path
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from information_theory import (  # noqa: E402
    conditional_entropy,
    cross_entropy,
    cross_entropy_loss,
    entropy,
    information_content,
    joint_entropy,
    kl_divergence,
    mutual_information,
    perplexity,
    softmax,
)


class InformationTheoryTests(unittest.TestCase):
    def test_information_content_uses_log_base(self) -> None:
        self.assertAlmostEqual(information_content(0.5), 1.0)
        self.assertAlmostEqual(information_content(0.25, base=math.e), math.log(4))

    def test_entropy_distinguishes_fair_and_certain_distributions(self) -> None:
        self.assertAlmostEqual(entropy([0.5, 0.5]), 1.0)
        self.assertAlmostEqual(entropy([1.0, 0.0]), 0.0)

    def test_cross_entropy_decomposition(self) -> None:
        p = [0.7, 0.2, 0.1]
        q = [0.6, 0.25, 0.15]
        self.assertAlmostEqual(cross_entropy(p, q), entropy(p) + kl_divergence(p, q))

    def test_kl_is_directional_but_nonnegative_for_fixture(self) -> None:
        p, q = [0.9, 0.1], [0.5, 0.5]
        self.assertGreaterEqual(kl_divergence(p, q), 0.0)
        self.assertNotAlmostEqual(kl_divergence(p, q), kl_divergence(q, p))

    def test_mutual_information_zero_for_independence(self) -> None:
        independent = [[0.25, 0.25], [0.25, 0.25]]
        dependent = [[0.45, 0.05], [0.05, 0.45]]
        self.assertAlmostEqual(mutual_information(independent), 0.0)
        self.assertGreater(mutual_information(dependent), 0.0)

    def test_stable_softmax_and_classification_loss(self) -> None:
        probs = softmax([1000.0, 1001.0])
        self.assertTrue(all(math.isfinite(p) for p in probs))
        self.assertAlmostEqual(sum(probs), 1.0)
        logits = [2.0, 1.0, 0.1]
        self.assertLess(cross_entropy_loss(0, logits), cross_entropy_loss(1, logits))

    def test_perplexity_round_trip_and_entropy_chain_rule(self) -> None:
        self.assertAlmostEqual(perplexity(math.log(4.0)), 4.0)
        joint = [[0.45, 0.05], [0.05, 0.45]]
        marginal_x = [sum(row) for row in joint]
        self.assertAlmostEqual(joint_entropy(joint), entropy(marginal_x) + conditional_entropy(joint))


if __name__ == "__main__":
    unittest.main()
