# Stochastic-process contract tests for phases/01-math-foundations/22-stochastic-processes/docs/en.md.
# They use seeded NumPy fixtures so numerical checks remain reproducible.
# The suite covers path shapes, Markov invariants, and sampler/diffusion boundaries.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.

from __future__ import annotations

from pathlib import Path
import sys
import unittest

import numpy as np

CODE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CODE))

from stochastic import (  # noqa: E402
    MarkovChain,
    diffusion_forward,
    langevin_dynamics,
    metropolis_hastings,
    random_walk_1d,
    random_walk_2d,
)


class StochasticProcessTests(unittest.TestCase):
    def test_random_walk_is_seeded_and_has_one_initial_position(self) -> None:
        first = random_walk_1d(20, seed=4)
        second = random_walk_1d(20, seed=4)
        np.testing.assert_array_equal(first, second)
        self.assertEqual(first.shape, (21,))
        self.assertEqual(first[0], 0)
        self.assertTrue(set(np.diff(first)).issubset({-1, 1}))

    def test_random_walk_2d_has_unit_axis_steps(self) -> None:
        x, y = random_walk_2d(30, seed=5)
        self.assertEqual(x.shape, (31,))
        self.assertEqual(y.shape, (31,))
        step_lengths = np.abs(np.diff(x)) + np.abs(np.diff(y))
        np.testing.assert_array_equal(step_lengths, np.ones(30))

    def test_markov_chain_stationary_distribution_is_invariant(self) -> None:
        chain = MarkovChain([[0.7, 0.3], [0.2, 0.8]])
        stationary = chain.stationary_distribution()
        self.assertAlmostEqual(stationary.sum(), 1.0)
        np.testing.assert_allclose(stationary @ chain.P, stationary, atol=1e-10)

    def test_markov_simulation_has_expected_state_count(self) -> None:
        chain = MarkovChain([[0.7, 0.3], [0.2, 0.8]])
        states = chain.simulate(0, 50, seed=8)
        self.assertEqual(len(states), 51)
        self.assertTrue(all(state in (0, 1) for state in states))

    def test_langevin_returns_initial_state_plus_steps(self) -> None:
        trajectory = langevin_dynamics(
            lambda x: x,
            np.array([0.0, 1.0]),
            dt=0.05,
            temperature=1.0,
            n_steps=12,
            seed=9,
        )
        self.assertEqual(trajectory.shape, (13, 2))
        np.testing.assert_array_equal(trajectory[0], [0.0, 1.0])

    def test_metropolis_hastings_returns_requested_sample_count(self) -> None:
        samples, acceptance = metropolis_hastings(
            lambda x: -0.5 * np.sum(x * x),
            proposal_std=0.8,
            x0=np.array([0.0]),
            n_samples=1,
            seed=10,
        )
        self.assertEqual(samples.shape, (1, 1))
        self.assertEqual(acceptance, 0.0)

    def test_diffusion_keeps_initial_signal_and_schedule_length(self) -> None:
        signal = np.array([1.0, -1.0, 0.5])
        trajectory, betas = diffusion_forward(signal, n_steps=10, seed=11)
        self.assertEqual(trajectory.shape, (11, 3))
        self.assertEqual(betas.shape, (10,))
        np.testing.assert_array_equal(trajectory[0], signal)


if __name__ == "__main__":
    unittest.main()
