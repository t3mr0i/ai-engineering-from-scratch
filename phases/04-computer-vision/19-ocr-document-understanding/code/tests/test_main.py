"""CTC, decoder, rendering, and model-boundary tests for the OCR fixture."""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import unittest

import numpy as np
try:
    import torch
except ModuleNotFoundError:
    torch = None

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
SPEC = importlib.util.spec_from_file_location("lesson_ocr", MAIN)
OCR = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(OCR)


class NumpyBuildTests(unittest.TestCase):
    def test_numpy_greedy_decoder_collapses_repeats_and_blanks(self) -> None:
        ids = [0, 3, 3, 0, 3, 4]
        logits = np.full((len(ids), 1, len(OCR.VOCAB)), -10.0)
        for step, index in enumerate(ids):
            logits[step, 0, index] = 0.0
        self.assertEqual(OCR.numpy_ctc_greedy_decode(logits), [[3, 3, 4]])

    def test_numpy_batch_matches_ctc_shapes_and_ids(self) -> None:
        images, targets, lengths = OCR.numpy_build_batch(["abc", "xy"], max_len=3)
        self.assertEqual(images.shape, (2, 1, 32, 48))
        self.assertEqual(targets.tolist(), [11, 12, 13, 34, 35])
        self.assertEqual(lengths.tolist(), [3, 2])

    def test_numpy_ctc_forward_loss_is_finite_for_a_valid_path(self) -> None:
        ids = [0, 3, 0, 4]
        logits = np.full((len(ids), 1, len(OCR.VOCAB)), -8.0)
        for step, index in enumerate(ids):
            logits[step, 0, index] = 0.0
        logits -= np.log(np.exp(logits).sum(axis=-1, keepdims=True))
        loss = OCR.numpy_ctc_loss(logits, np.asarray([3, 4]), np.asarray([4]), np.asarray([2]))
        self.assertTrue(np.isfinite(loss))

    def test_numpy_ctc_rejects_impossible_repeat_alignments(self) -> None:
        logits = np.zeros((2, 1, len(OCR.VOCAB)))
        with self.assertRaises(ValueError):
            OCR.numpy_ctc_loss(logits, np.asarray([3, 3]), np.asarray([2]), np.asarray([2]))
        with self.assertRaises(ValueError):
            OCR.numpy_ctc_loss(logits, np.asarray([3, 4]), np.asarray([1]), np.asarray([2]))

    def test_numpy_ctc_contract_rejects_blank_targets_and_bad_text(self) -> None:
        logits = np.zeros((3, 1, len(OCR.VOCAB)))
        with self.assertRaises(ValueError):
            OCR.numpy_ctc_loss(logits, np.asarray([0]), np.asarray([3]), np.asarray([1]))
        with self.assertRaises(ValueError):
            OCR.numpy_build_batch(["A"])


class OcrFixtureTests(unittest.TestCase):
    def setUp(self) -> None:
        if torch is None:
            self.skipTest("optional PyTorch dependency is unavailable")

    def test_greedy_decoder_merges_repeats_but_not_blank_separated_repeats(self) -> None:
        ids = [0, 3, 3, 0, 3, 4]
        logits = torch.full((len(ids), 1, len(OCR.VOCAB)), -10.0)
        for step, index in enumerate(ids):
            logits[step, 0, index] = 0.0
        decoded = OCR.greedy_ctc_decode(torch.log_softmax(logits, dim=-1))
        self.assertEqual(decoded, [[3, 3, 4]])

    def test_ctc_loss_accepts_consistent_flattened_targets(self) -> None:
        log_probs = torch.log_softmax(torch.randn(6, 2, len(OCR.VOCAB)), dim=-1)
        loss = OCR.ctc_loss(log_probs, torch.tensor([3, 4, 5]), torch.tensor([6, 6]), torch.tensor([2, 1]))
        self.assertTrue(torch.isfinite(loss))

    def test_ctc_loss_rejects_bad_lengths_blank_and_targets(self) -> None:
        log_probs = torch.log_softmax(torch.randn(4, 1, len(OCR.VOCAB)), dim=-1)
        cases = [
            (torch.tensor([3]), torch.tensor([5]), torch.tensor([1])),
            (torch.tensor([0]), torch.tensor([4]), torch.tensor([1])),
        ]
        for targets, input_lengths, target_lengths in cases:
            with self.subTest(targets=targets), self.assertRaises(ValueError):
                OCR.ctc_loss(log_probs, targets, input_lengths, target_lengths)
        with self.assertRaises(ValueError):
            OCR.ctc_loss(log_probs, torch.tensor([3]), torch.tensor([4]), torch.tensor([1]), blank=len(OCR.VOCAB))
        short = torch.log_softmax(torch.randn(2, 1, len(OCR.VOCAB)), dim=-1)
        with self.assertRaises(ValueError):
            OCR.ctc_loss(short, torch.tensor([3, 3]), torch.tensor([2]), torch.tensor([2]))
        with self.assertRaises(ValueError):
            OCR.ctc_loss(short, torch.tensor([3, 4]), torch.tensor([1]), torch.tensor([2]))

    def test_synthetic_line_and_batch_have_expected_shapes(self) -> None:
        line = OCR.synthetic_line("abc", height=32, char_width=8)
        self.assertEqual(line.shape, (32, 24))
        images, targets, lengths = OCR.build_batch(["abc", "xy"], max_len=3)
        self.assertEqual(tuple(images.shape), (2, 1, 32, 48))
        self.assertEqual(targets.tolist(), [11, 12, 13, 34, 35])
        self.assertEqual(lengths.tolist(), [3, 2])

    def test_empty_unknown_and_too_short_text_inputs_are_rejected(self) -> None:
        for text in ("", "A", "!"):
            with self.subTest(text=text), self.assertRaises(ValueError):
                OCR.synthetic_line(text)
        with self.assertRaises(ValueError):
            OCR.build_batch([])
        with self.assertRaises(ValueError):
            OCR.build_batch(["abcd"], max_len=3)

    def test_crnn_output_uses_ctc_time_batch_vocab_layout(self) -> None:
        model = OCR.TinyCRNN(vocab_size=len(OCR.VOCAB), hidden=8, feat=4)
        output = model(torch.zeros(2, 1, 32, 48))
        self.assertEqual(output.shape[1], 2)
        self.assertEqual(output.shape[2], len(OCR.VOCAB))
        self.assertTrue(torch.allclose(output.exp().sum(dim=-1), torch.ones_like(output[..., 0]), atol=1e-5))

    def test_decode_to_str_rejects_blank_and_out_of_range_ids(self) -> None:
        self.assertEqual(OCR.decode_to_str([11, 12]), "ab")
        with self.assertRaises(ValueError):
            OCR.decode_to_str([0])
        with self.assertRaises(ValueError):
            OCR.decode_to_str([len(OCR.VOCAB)])

    def test_demo_exits_without_traceback(self) -> None:
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=45, env=os.environ.copy())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        self.assertIn("[CTC fixture]", result.stdout)


class OcrFallbackTests(unittest.TestCase):
    def test_source_compiles_without_importing_torch(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_module_exposes_dependency_state(self) -> None:
        self.assertIn(OCR.TORCH_AVAILABLE, (True, False))

    def test_canonical_command_is_bounded_when_torch_is_missing(self) -> None:
        if torch is not None:
            self.skipTest("fallback branch is only exercised without PyTorch")
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("skipped cleanly", result.stdout)


if __name__ == "__main__":
    unittest.main()
