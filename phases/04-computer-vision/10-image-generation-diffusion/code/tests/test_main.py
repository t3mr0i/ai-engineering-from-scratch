from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("diffusion_math", CODE / "main.py")
diffusion = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(diffusion)


class DiffusionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.schedule = diffusion.precompute_schedule(diffusion.linear_beta_schedule(10, 1e-3, 0.02))

    def test_linear_schedule_is_increasing_and_bounded(self) -> None:
        betas = diffusion.linear_beta_schedule(10, 1e-3, 0.02)
        self.assertTrue(np.all(np.diff(betas) > 0))
        self.assertTrue(np.all((betas > 0) & (betas < 1)))
        with self.assertRaises(ValueError):
            diffusion.linear_beta_schedule(1)

    def test_precomputed_alpha_bar_decreases(self) -> None:
        alpha_bar = self.schedule["alpha_bar"]
        self.assertAlmostEqual(float(alpha_bar[0]), 1 - 1e-3, places=10)
        self.assertTrue(np.all(np.diff(alpha_bar) < 0))
        self.assertTrue(np.all(self.schedule["posterior_variance"] >= 0))

    def test_q_sample_matches_closed_form(self) -> None:
        x0 = np.ones((2, 1, 2, 2))
        noise = np.full_like(x0, 2.0)
        t = np.array([0, 3])
        actual = diffusion.q_sample(x0, t, noise, self.schedule)
        expected = (self.schedule["sqrt_alpha_bar"][t, None, None, None] * x0
                    + self.schedule["sqrt_one_minus_alpha_bar"][t, None, None, None] * noise)
        np.testing.assert_allclose(actual, expected)

    def test_predict_x0_recovers_clean_sample_when_noise_is_known(self) -> None:
        rng = np.random.default_rng(2)
        x0, noise = rng.normal(size=(2, 1, 3, 3)), rng.normal(size=(2, 1, 3, 3))
        noisy = diffusion.q_sample(x0, 5, noise, self.schedule)
        np.testing.assert_allclose(diffusion.predict_x0_from_eps(noisy, 5, noise, self.schedule), x0)

    def test_posterior_mean_uses_both_clean_and_noisy_states(self) -> None:
        x0, noisy = np.ones((1, 1, 2, 2)), np.full((1, 1, 2, 2), 2.0)
        mean = diffusion.posterior_mean(noisy, x0, 4, self.schedule)
        c1 = self.schedule["posterior_mean_coef1"][4]
        c2 = self.schedule["posterior_mean_coef2"][4]
        np.testing.assert_allclose(mean, c1 * x0 + c2 * noisy)

    def test_ddim_eta_zero_is_deterministic(self) -> None:
        x = np.ones((1, 1, 2, 2))
        eps = np.full_like(x, 0.25)
        first = diffusion.ddim_step(x, 8, 2, eps, self.schedule, eta=0)
        second = diffusion.ddim_step(x, 8, 2, eps, self.schedule, eta=0)
        np.testing.assert_array_equal(first, second)
        with self.assertRaises(ValueError):
            diffusion.ddim_step(x, 2, 8, eps, self.schedule)

    def test_timestep_embedding_and_fixture_are_reproducible(self) -> None:
        embedding = diffusion.timestep_embedding(np.array([0, 2, 4]), dim=7)
        self.assertEqual(embedding.shape, (3, 7))
        np.testing.assert_allclose(embedding[0, :3], 0.0)
        np.testing.assert_array_equal(diffusion.synthetic_circles(3, 8, 4), diffusion.synthetic_circles(3, 8, 4))
        with self.assertRaises(ValueError):
            diffusion.timestep_embedding(np.array([1.5]), dim=4)

    def test_shape_and_timestep_contracts_are_explicit(self) -> None:
        with self.assertRaises(ValueError):
            diffusion.q_sample(np.zeros((2, 1)), 10, np.zeros((2, 1)), self.schedule)
        with self.assertRaises(ValueError):
            diffusion.q_sample(np.zeros((2, 1)), np.array([1]), np.zeros((2, 1)), self.schedule)
        with self.assertRaises(ValueError):
            diffusion.precompute_schedule(np.array([0.1, np.nan]))

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("reconstruction_max_error", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
