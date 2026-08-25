# Numerical-stability tests for phases/01-math-foundations/13-numerical-stability/docs/en.md.
# They assert finite outputs and identities at the edge cases shown by main.py.
# The suite is stdlib-only and does not require a tensor framework.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.
# Deliberately unstable helpers are tested only on inputs where they are defined.

from __future__ import annotations

import math
from pathlib import Path
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from numerical import (  # noqa: E402
    binary_cross_entropy_stable,
    clip_by_norm,
    clip_by_value,
    cross_entropy_stable,
    layer_norm,
    log_softmax_stable,
    logsumexp_stable,
    numerical_gradient,
    sigmoid_stable,
    softmax_stable,
    simulate_bfloat16,
    simulate_float16,
    welford_variance,
)


class NumericalStabilityTests(unittest.TestCase):
    def test_stable_softmax_handles_extreme_logits(self) -> None:
        probabilities = softmax_stable([1000.0, 1001.0, 1002.0])
        self.assertTrue(all(math.isfinite(p) for p in probabilities))
        self.assertAlmostEqual(sum(probabilities), 1.0)
        self.assertGreater(probabilities[-1], probabilities[0])

    def test_logsumexp_is_shift_invariant(self) -> None:
        values = [2.0, 3.0, 5.0]
        self.assertAlmostEqual(
            logsumexp_stable([v + 1000 for v in values]) - 1000,
            logsumexp_stable(values),
        )

    def test_stable_cross_entropy_matches_log_softmax(self) -> None:
        logits = [2.0, 5.0, 1.0]
        self.assertAlmostEqual(cross_entropy_stable(1, logits), -log_softmax_stable(logits)[1])
        self.assertAlmostEqual(binary_cross_entropy_stable(1.0, 800.0), 0.0, places=8)

    def test_binary_cross_entropy_stays_finite_for_both_wrong_extremes(self) -> None:
        self.assertAlmostEqual(binary_cross_entropy_stable(0, 800.0), 800.0, places=8)
        self.assertAlmostEqual(binary_cross_entropy_stable(1, -800.0), 800.0, places=8)

    def test_binary_cross_entropy_saturates_and_matches_moderate_formula(self) -> None:
        self.assertAlmostEqual(binary_cross_entropy_stable(0, -800.0), 0.0, places=8)
        self.assertAlmostEqual(binary_cross_entropy_stable(1, 800.0), 0.0, places=8)
        expected = math.log1p(math.exp(-1.25))
        self.assertAlmostEqual(binary_cross_entropy_stable(1, 1.25), expected)
        self.assertAlmostEqual(binary_cross_entropy_stable(0, -1.25), expected)

    def test_binary_cross_entropy_rejects_non_binary_targets(self) -> None:
        for target in (-1, 0.5, 2):
            with self.subTest(target=target):
                with self.assertRaises(ValueError):
                    binary_cross_entropy_stable(target, 0.0)

    def test_sigmoid_stays_finite_for_both_signs(self) -> None:
        self.assertAlmostEqual(sigmoid_stable(1000.0), 1.0)
        self.assertAlmostEqual(sigmoid_stable(-1000.0), 0.0)
        self.assertAlmostEqual(sigmoid_stable(3.0) + sigmoid_stable(-3.0), 1.0)

    def test_welford_variance_handles_large_mean(self) -> None:
        values = [1e8 + i for i in range(1, 6)]
        self.assertAlmostEqual(welford_variance(values), 2.0, places=8)

    def test_gradient_clipping_preserves_norm_or_components(self) -> None:
        gradients = [3.0, 4.0]
        clipped = clip_by_norm(gradients, 2.0)
        self.assertAlmostEqual(math.sqrt(sum(x * x for x in clipped)), 2.0)
        self.assertEqual(clip_by_value([3.0, -4.0], 2.0), [2.0, -2.0])

    def test_layer_norm_centers_values_with_epsilon(self) -> None:
        normalized = layer_norm([1.0, 2.0, 3.0])
        self.assertAlmostEqual(sum(normalized) / len(normalized), 0.0, places=8)
        self.assertTrue(all(math.isfinite(x) for x in normalized))

    def test_finite_difference_gradient_matches_quadratic(self) -> None:
        gradient = numerical_gradient(lambda xs: xs[0] ** 2 + 3.0 * xs[1], [2.0, 4.0])
        self.assertAlmostEqual(gradient[0], 4.0, places=6)
        self.assertAlmostEqual(gradient[1], 3.0, places=6)

    def test_float_formats_show_range_tradeoff(self) -> None:
        self.assertTrue(math.isinf(simulate_float16(100000.0)))
        self.assertTrue(math.isfinite(simulate_bfloat16(100000.0)))


if __name__ == "__main__":
    unittest.main()
