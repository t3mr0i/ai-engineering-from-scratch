from __future__ import annotations

from pathlib import Path
import sys
import unittest

import numpy as np


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main


class GaussianProcessTests(unittest.TestCase):
    def test_rbf_kernel_is_symmetric(self) -> None:
        values = np.array([-1.0, 0.0, 2.0])
        kernel = main.rbf_kernel(values, values, length_scale=0.7)
        np.testing.assert_allclose(kernel, kernel.T)

    def test_rbf_diagonal_equals_signal_variance(self) -> None:
        kernel = main.rbf_kernel([0.0, 1.0], [0.0, 1.0], signal_variance=2.5)
        np.testing.assert_allclose(np.diag(kernel), [2.5, 2.5])

    def test_posterior_shapes_match_test_inputs(self) -> None:
        mean, variance, _ = main.gp_posterior([0.0, 1.0], [0.0, 1.0], [-1.0, 0.5, 2.0])
        self.assertEqual(mean.shape, (3,))
        self.assertEqual(variance.shape, (3,))

    def test_variance_shrinks_near_observation(self) -> None:
        _, variance, _ = main.gp_posterior([0.0], [1.0], [0.0, 4.0], noise_variance=1e-6)
        self.assertLess(variance[0], variance[1])

    def test_marginal_likelihood_is_finite(self) -> None:
        score = main.log_marginal_likelihood([0.0, 1.0], [0.0, 1.0], length_scale=1.0)
        self.assertTrue(np.isfinite(score))

    def test_invalid_hyperparameter_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            main.rbf_kernel([0.0], [0.0], length_scale=0.0)


if __name__ == "__main__":
    unittest.main()
