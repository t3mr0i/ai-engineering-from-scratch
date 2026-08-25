from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("toy_gan", CODE / "main.py")
gan = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(gan)


class GANTests(unittest.TestCase):
    def test_sigmoid_and_softplus_are_stable(self) -> None:
        np.testing.assert_allclose(gan.sigmoid(np.array([-1000.0, 0.0, 1000.0])), [0.0, 0.5, 1.0], atol=1e-12)
        self.assertTrue(np.isfinite(gan.softplus(np.array([-1000.0, 1000.0]))).all())

    def test_bce_logit_loss_matches_easy_predictions(self) -> None:
        loss = gan.binary_cross_entropy_with_logits(np.array([10.0, -10.0]), np.array([1.0, 0.0]))
        self.assertLess(loss, 1e-4)
        with self.assertRaises(ValueError):
            gan.binary_cross_entropy_with_logits(np.zeros(2), np.array([1.0]))

    def test_generator_objectives_are_distinct(self) -> None:
        logits = np.array([-4.0, 0.0, 1.0])
        self.assertGreater(gan.generator_loss_non_saturating(logits), gan.generator_loss_minimax(logits))
        self.assertGreater(gan.generator_loss_minimax(-logits), gan.generator_loss_non_saturating(-logits))

    def test_discriminator_loss_rewards_correct_real_fake_logits(self) -> None:
        good = gan.discriminator_loss(np.array([8.0, 7.0]), np.array([-8.0, -7.0]))
        bad = gan.discriminator_loss(np.array([-1.0, -2.0]), np.array([1.0, 2.0]))
        self.assertLess(good, bad)

    def test_scalar_generator_and_discriminator_shapes(self) -> None:
        z = np.array([-1.0, 0.0, 1.0])
        fake = gan.generator_samples(z, 2.0, 0.5)
        np.testing.assert_allclose(fake, [-1.5, 0.5, 2.5])
        np.testing.assert_allclose(gan.discriminator_logits(fake, 1.0, -0.5), [-2.0, 0.0, 2.0])
        with self.assertRaises(ValueError):
            gan.generator_samples(np.zeros((2, 2)), 1.0, 0.0)
        with self.assertRaises(ValueError):
            gan.generator_samples(z, np.array([1.0]), 0.0)

    def test_gan_step_updates_both_parameter_groups(self) -> None:
        params = {"g_weight": 0.15, "g_bias": -0.5, "d_weight": 0.2, "d_bias": 0.0}
        updated, losses = gan.gan_step(params, np.array([1.5, 2.0]), np.array([-1.0, 1.0]))
        self.assertNotEqual(updated["g_weight"], params["g_weight"])
        self.assertNotEqual(updated["d_weight"], params["d_weight"])
        self.assertEqual(set(losses), {"d_loss", "g_loss"})

    def test_toy_training_is_seeded_and_bounded(self) -> None:
        first = gan.train_toy_gan(steps=12, batch_size=8, seed=3)
        second = gan.train_toy_gan(steps=12, batch_size=8, seed=3)
        np.testing.assert_allclose(first["d_losses"], second["d_losses"])
        np.testing.assert_allclose(first["g_losses"], second["g_losses"])
        self.assertTrue(np.isfinite(first["fake_means"]).all())
        with self.assertRaises(ValueError):
            gan.train_toy_gan(steps=0)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("non-saturating", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
