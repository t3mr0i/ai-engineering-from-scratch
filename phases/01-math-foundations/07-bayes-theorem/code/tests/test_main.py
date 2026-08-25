# Contract and executable-behavior tests for this lesson demo.
from __future__ import annotations

import ast
import functools
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
sys.path.insert(0, str(CODE))
from bayes import NaiveBayes, bayes, beta_update  # noqa: E402
ALLOWED = set(sys.stdlib_module_names) | {"numpy", "torch", "h5py", "zstandard", "safetensors"}

def source_trees() -> list[ast.AST]:
    return [ast.parse(path.read_text(encoding="utf-8")) for path in CODE.glob("*.py")]

def external_roots() -> set[str]:
    roots: set[str] = set()
    for tree in source_trees():
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                roots.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                roots.add(node.module.split(".")[0])
    return {name for name in roots if not (CODE / f"{name}.py").exists() and not (CODE / name).is_dir()}

@functools.lru_cache(maxsize=1)
def run_demo() -> subprocess.CompletedProcess[str]:
    missing = sorted(name for name in external_roots() if name in ALLOWED and importlib.util.find_spec(name) is None)
    banned = sorted(external_roots() - ALLOWED)
    if missing or banned:
        raise unittest.SkipTest(f"demo dependencies unavailable or disallowed: {missing + banned}")
    env = os.environ.copy()
    for key in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "HF_TOKEN", "HUGGINGFACE_TOKEN"):
        env.pop(key, None)
    return subprocess.run(
        [sys.executable, MAIN.name], cwd=CODE, text=True, capture_output=True,
        timeout=45, env=env, check=False,
    )

class LessonDemoTests(unittest.TestCase):
    def test_source_compiles(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_demo_has_explicit_entrypoint(self) -> None:
        source = MAIN.read_text(encoding="utf-8")
        self.assertTrue("__main__" in source or "runpy.run_path" in source)

    def test_demo_exits_successfully(self) -> None:
        self.assertEqual(run_demo().returncode, 0, run_demo().stderr)

    def test_demo_emits_bounded_output(self) -> None:
        result = run_demo()
        self.assertTrue((result.stdout + result.stderr).strip())
        self.assertLess(len(result.stdout) + len(result.stderr), 1_000_000)

    def test_demo_has_no_traceback(self) -> None:
        self.assertNotIn("Traceback (most recent call last)", run_demo().stderr)

    def test_bayes_medical_fixture(self) -> None:
        posterior = bayes(0.0001, 0.99, 0.01)
        self.assertAlmostEqual(posterior, 0.0098039, places=5)

    def test_beta_update_adds_counts(self) -> None:
        self.assertEqual(beta_update(1, 1, 3, 1), (4, 2))

    def test_naive_bayes_smoothing_and_probabilities(self) -> None:
        model = NaiveBayes(smoothing=1.0)
        model.train(["free offer", "team meeting"], ["spam", "ham"])
        self.assertAlmostEqual(model._log_likelihood("unseen", "spam"), __import__("math").log(1 / 6))
        probabilities = model.predict_proba("free")
        self.assertAlmostEqual(sum(probabilities.values()), 1.0)

    def test_training_and_prediction_validation(self) -> None:
        model = NaiveBayes()
        with self.assertRaises(ValueError):
            model.predict("hello")
        with self.assertRaises(ValueError):
            model.train(["one"], [])
        with self.assertRaises(ValueError):
            model.train([], [])

    def test_probability_validation(self) -> None:
        with self.assertRaises(ValueError):
            bayes(-0.1, 0.9, 0.1)
        with self.assertRaises(ValueError):
            bayes(0.0, 0.0, 0.0)

if __name__ == "__main__":
    unittest.main()
