"""Executable contracts for the local edge-profiler fixture."""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import unittest

try:
    import torch
    from torch import nn
except ModuleNotFoundError:
    torch = None
    nn = None

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
SPEC = importlib.util.spec_from_file_location("lesson_edge", MAIN)
EDGE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(EDGE)


class PythonBuildContractTests(unittest.TestCase):
    def test_percentile_uses_sorted_tail_index(self) -> None:
        self.assertEqual(EDGE._percentile([1.0, 2.0, 5.0, 8.0], 0.50), 2.0)
        self.assertEqual(EDGE._percentile([1.0, 2.0, 5.0, 8.0], 0.95), 8.0)

    def test_shape_contract_requires_four_positive_dimensions(self) -> None:
        self.assertEqual(EDGE._input_shape((1, 3, 16, 16)), (1, 3, 16, 16))
        with self.assertRaises(ValueError):
            EDGE._input_shape((1, 3, 0, 16))

    def test_control_contract_rejects_boolean_and_negative_values(self) -> None:
        with self.assertRaises(ValueError):
            EDGE._positive_int("iters", True)
        with self.assertRaises(ValueError):
            EDGE._positive_int("warmup", -1, allow_zero=True)


class EdgeProfilerTests(unittest.TestCase):
    def setUp(self) -> None:
        if torch is None:
            self.skipTest("optional PyTorch dependency is unavailable")

    def test_measure_latency_returns_all_percentiles(self) -> None:
        report = EDGE.measure_latency(nn.Identity(), (1, 3, 8, 8), warmup=0, iters=4)
        self.assertEqual(set(report), {"p50_ms", "p95_ms", "p99_ms", "mean_ms"})
        self.assertTrue(all(value >= 0 for value in report.values()))

    def test_measure_latency_rejects_empty_or_boolean_controls(self) -> None:
        with self.assertRaises(ValueError):
            EDGE.measure_latency(nn.Identity(), (1, 3, 8, 8), iters=0)
        with self.assertRaises(ValueError):
            EDGE.measure_latency(nn.Identity(), (1, 3, 8, 8), warmup=True)
        with self.assertRaises(ValueError):
            EDGE.measure_latency(nn.Identity(), (1, 3, 8, 8), input_shape=(1, 3, 0, 8))

    def test_measure_latency_rejects_unknown_device(self) -> None:
        with self.assertRaises(ValueError):
            EDGE.measure_latency(nn.Identity(), (1, 3, 8, 8), device="tpu")

    def test_parameter_count_matches_tensors(self) -> None:
        model = nn.Linear(3, 2, bias=True)
        self.assertEqual(EDGE.parameter_count(model), 8)
        with self.assertRaises(TypeError):
            EDGE.parameter_count(object())

    def test_flops_count_handles_grouped_convolution(self) -> None:
        model = nn.Conv2d(4, 4, kernel_size=3, padding=1, groups=4, bias=False)
        # 2 operations * 1 input/channel * 4 outputs * 3*3 * 5*5.
        self.assertEqual(EDGE.flops_estimate(model, (1, 4, 5, 5)), 1800)

    def test_local_backbones_share_the_expected_contract(self) -> None:
        for model in (EDGE.TinyDenseBackbone(), EDGE.TinyDepthwiseBackbone()):
            output = model(torch.zeros(2, 3, 16, 16))
            self.assertEqual(tuple(output.shape), (2, 10))
            self.assertGreater(EDGE.parameter_count(model), 0)

    def test_compare_backbones_is_local_and_finite(self) -> None:
        rows = EDGE.compare_backbones(resolution=16, warmup=0, iters=2)
        self.assertEqual([row["model"] for row in rows], ["tiny_dense", "tiny_depthwise"])
        for row in rows:
            self.assertTrue(all(float(row[key]) >= 0 for key in ("params", "flops", "p50_ms", "p95_ms")))

    def test_python_demo_exits_without_traceback(self) -> None:
        env = os.environ.copy()
        result = subprocess.run(
            [sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True,
            timeout=45, env=env, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("Traceback", result.stderr)
        self.assertIn("tiny_depthwise", result.stdout)


class EdgeFallbackTests(unittest.TestCase):
    def test_source_compiles_without_importing_torch(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_module_exposes_dependency_state(self) -> None:
        self.assertIn(EDGE.TORCH_AVAILABLE, (True, False))

    def test_canonical_command_is_bounded_when_torch_is_missing(self) -> None:
        if torch is not None:
            self.skipTest("fallback branch is only exercised without PyTorch")
        result = subprocess.run([sys.executable, MAIN.name], cwd=CODE, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Python Build-It fallback", result.stdout)
        self.assertIn("skipped cleanly", result.stdout)


if __name__ == "__main__":
    unittest.main()
