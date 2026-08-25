# Sampling contract tests for phases/01-math-foundations/16-sampling-methods/docs/en.md.
# The tests check support, normalization, candidate-set, and gradient identities on local fixtures.
# Seeds keep Monte Carlo assertions reproducible without pretending that a random estimate is exact.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.
# No plotting or external sampling package is required.

from __future__ import annotations

import math
from pathlib import Path
import random
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from sampling import (  # noqa: E402
    gumbel_softmax_sample,
    metropolis_hastings,
    metropolis_hastings_2d,
    monte_carlo_integral,
    normal_pdf,
    reparam_gradient,
    reparam_sample,
    sample_exponential_inverse_cdf,
    stratified_sample_1d,
    temperature_sample,
    temperature_distribution,
    top_k_sample,
    top_k_distribution,
    top_p_sample,
    top_p_distribution,
    truncated_normal_demo,
)


class SamplingTests(unittest.TestCase):
    def test_inverse_cdf_exponential_has_expected_single_draw(self) -> None:
        original = random.random
        try:
            random.random = lambda: 0.5
            self.assertAlmostEqual(sample_exponential_inverse_cdf(1.0), math.log(2.0))
        finally:
            random.random = original

    def test_normal_pdf_is_symmetric_and_truncated_samples_stay_in_bounds(self) -> None:
        self.assertAlmostEqual(normal_pdf(-1.0, 0.0, 1.0), normal_pdf(1.0, 0.0, 1.0))
        random.seed(4)
        samples, acceptance = truncated_normal_demo(0.0, 1.0, -1.0, 2.0, n=80)
        self.assertEqual(len(samples), 80)
        self.assertTrue(all(-1.0 <= x <= 2.0 for x in samples))
        self.assertGreater(acceptance, 0.0)

    def test_monte_carlo_integral_converges_for_linear_fixture(self) -> None:
        random.seed(5)
        estimate = monte_carlo_integral(lambda x: x, 0.0, 1.0, 5000)
        self.assertAlmostEqual(estimate, 0.5, delta=0.03)

    def test_metropolis_hastings_returns_burned_chain(self) -> None:
        random.seed(6)
        samples, acceptance = metropolis_hastings(
            lambda x: -0.5 * x * x,
            x0=5.0,
            n_samples=100,
            burn_in=20,
            proposal_std=1.0,
        )
        self.assertEqual(len(samples), 100)
        self.assertGreater(acceptance, 0.0)
        self.assertTrue(all(math.isfinite(x) for x in samples))

    def test_temperature_distribution_is_normalized_and_sharpens(self) -> None:
        logits = [3.0, 2.0, 0.0]
        cold = temperature_distribution(logits, 0.5)
        hot = temperature_distribution(logits, 2.0)
        self.assertAlmostEqual(sum(cold), 1.0)
        self.assertAlmostEqual(sum(hot), 1.0)
        self.assertGreater(cold[0], hot[0])

    def test_top_k_keeps_exactly_k_nonzero_tokens(self) -> None:
        distribution = top_k_distribution([3.0, 2.0, 1.0, 0.0], 2)
        self.assertEqual(sum(p > 0 for p in distribution), 2)
        self.assertAlmostEqual(sum(distribution), 1.0)

    def test_top_p_keeps_a_prefix_until_mass_threshold(self) -> None:
        distribution = top_p_distribution([3.0, 2.0, 1.0, 0.0], 0.8)
        self.assertEqual(sum(p > 0 for p in distribution), 2)
        self.assertAlmostEqual(sum(distribution), 1.0)

    def test_reparameterization_exposes_the_two_local_derivatives(self) -> None:
        random.seed(7)
        z, epsilon = reparam_sample(2.0, 0.5)
        self.assertAlmostEqual(z, 2.0 + 0.5 * epsilon)
        self.assertEqual(reparam_gradient(epsilon), (1.0, epsilon))

    def test_stratified_sample_uses_one_point_per_stratum(self) -> None:
        random.seed(8)
        samples = stratified_sample_1d(10)
        self.assertEqual(len(samples), 10)
        self.assertTrue(all(i / 10 <= x < (i + 1) / 10 for i, x in enumerate(samples)))

    def test_gumbel_softmax_is_a_probability_vector(self) -> None:
        random.seed(9)
        values = gumbel_softmax_sample([math.log(0.6), math.log(0.3), math.log(0.1)], 0.5)
        self.assertEqual(len(values), 3)
        self.assertAlmostEqual(sum(values), 1.0)
        self.assertTrue(all(v >= 0.0 for v in values))

    def test_sampling_parameters_reject_empty_or_invalid_values(self) -> None:
        with self.assertRaises(ValueError):
            sample_exponential_inverse_cdf(0)
        with self.assertRaises(ValueError):
            temperature_distribution([], 1.0)
        for temperature in (0.0, -1.0):
            with self.subTest(temperature=temperature):
                with self.assertRaises(ValueError):
                    temperature_sample([1.0, 0.0], temperature)
        for k in (0, 5):
            with self.subTest(k=k):
                with self.assertRaises(ValueError):
                    top_k_sample([3.0, 2.0, 1.0], k)
                with self.assertRaises(ValueError):
                    top_k_distribution([3.0, 2.0, 1.0], k)
        for p in (0.0, 1.1):
            with self.subTest(p=p):
                with self.assertRaises(ValueError):
                    top_p_sample([3.0, 2.0, 1.0], p)
                with self.assertRaises(ValueError):
                    top_p_distribution([3.0, 2.0, 1.0], p)

    def test_both_mh_paths_validate_sample_burnin_and_proposal(self) -> None:
        target_1d = lambda x: -0.5 * x * x
        target_2d = lambda x, y: -0.5 * (x * x + y * y)
        for sampler, args in (
            (metropolis_hastings, (target_1d, 0.0)),
            (metropolis_hastings_2d, (target_2d, 0.0, 0.0)),
        ):
            with self.subTest(sampler=sampler.__name__):
                with self.assertRaises(ValueError):
                    sampler(*args, n_samples=0, burn_in=0, proposal_std=1.0)
                with self.assertRaises(ValueError):
                    sampler(*args, n_samples=1, burn_in=-1, proposal_std=1.0)
                with self.assertRaises(ValueError):
                    sampler(*args, n_samples=1, burn_in=0, proposal_std=0.0)


if __name__ == "__main__":
    unittest.main()
