from __future__ import annotations

import importlib.util
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np


CODE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sd_contracts", CODE / "main.py")
sd = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(sd)


class StableDiffusionContractTests(unittest.TestCase):
    def test_latent_shape_is_explicit(self) -> None:
        self.assertEqual(sd.latent_shape((2, 3, 32, 32), 8, 4), (2, 4, 4, 4))
        with self.assertRaises(ValueError):
            sd.latent_shape((1, 3, 30, 32), 8, 4)

    def test_mean_pool_latent_and_decode_shapes(self) -> None:
        image = np.arange(3 * 8 * 8, dtype=float).reshape(1, 3, 8, 8)
        latent = sd.encode_latent(image, downsample_factor=2, latent_channels=4)
        self.assertEqual(latent.shape, (1, 4, 4, 4))
        decoded = sd.decode_latent(latent, image_channels=3, upsample_factor=2)
        self.assertEqual(decoded.shape, image.shape)
        with self.assertRaises(ValueError):
            sd.decode_latent(latent, image_channels=5, upsample_factor=2)
        with self.assertRaises(ValueError):
            sd.encode_latent(np.zeros((1, 5, 8, 8)), downsample_factor=2, latent_channels=4)

    def test_classifier_free_guidance_formula(self) -> None:
        uncond = np.zeros((2, 3))
        cond = np.ones((2, 3))
        np.testing.assert_allclose(sd.classifier_free_guidance(uncond, cond, 5), 5.0)
        with self.assertRaises(ValueError):
            sd.classifier_free_guidance(uncond, np.ones((2, 2)), 5)

    def test_scheduler_sigmas_are_descending_and_finite(self) -> None:
        sigmas = sd.scheduler_sigmas(5, 1.0, 0.1)
        self.assertTrue(np.all(np.diff(sigmas) < 0))
        self.assertTrue(np.isfinite(sigmas).all())
        endpoints = sd.scheduler_sigmas(2, 1.0, 0.1)
        np.testing.assert_allclose(endpoints, [1.0, 0.1])
        with self.assertRaises(ValueError):
            sd.scheduler_sigmas(1, 1.0, 0.1)
        with self.assertRaises(ValueError):
            sd.scheduler_sigmas(5, 0.1, 1.0)
        with self.assertRaises(ValueError):
            sd.scheduler_sigmas(2, True, 0.1)

    def test_lora_update_has_low_rank_delta(self) -> None:
        base = np.zeros((4, 4))
        down = np.ones((2, 4))
        up = np.ones((4, 2))
        updated = sd.lora_update(base, down, up, 0.5)
        self.assertEqual(updated.shape, (4, 4))
        np.testing.assert_allclose(updated, 1.0)
        with self.assertRaises(ValueError):
            sd.lora_update(base, np.ones((3, 5)), up)
        with self.assertRaises(ValueError):
            sd.lora_update(np.zeros((0, 2)), np.zeros((1, 2)), np.zeros((0, 1)))
        with self.assertRaises(ValueError):
            sd.lora_update(np.zeros((2, 2)), np.zeros((0, 2)), np.zeros((2, 0)))

    def test_manifest_names_roles_without_external_framework(self) -> None:
        manifest = sd.pipeline_manifest()
        self.assertEqual([item["component"] for item in manifest], ["text_encoder", "denoiser", "scheduler", "VAE", "safety_check"])
        self.assertEqual(manifest[-1]["status"], "not implemented here")

    def test_nonfinite_and_parameter_contracts_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            sd.encode_latent(np.full((1, 3, 4, 4), np.nan), 2, 4)
        with self.assertRaises(ValueError):
            sd.classifier_free_guidance(np.zeros(2), np.zeros(2), -1)
        with self.assertRaises(ValueError):
            sd.classifier_free_guidance(np.zeros(2), np.zeros(2), True)
        with self.assertRaises(ValueError):
            sd.lora_update(np.zeros((2, 2)), np.zeros((1, 2)), np.zeros((2, 1)), scale=np.inf)
        with self.assertRaises(ValueError):
            sd.lora_update(np.zeros((2, 2)), np.ones((1, 2)), np.ones((2, 1)), scale=True)

    def test_canonical_demo_exits_cleanly(self) -> None:
        result = subprocess.run([sys.executable, "main.py"], cwd=CODE, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("offline Stable-Diffusion", result.stdout)
        self.assertNotIn("Traceback", result.stderr)


if __name__ == "__main__":
    unittest.main()
