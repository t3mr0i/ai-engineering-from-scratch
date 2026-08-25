# Contract and executable-behavior tests for this lesson demo.
from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"

def run_no_torch_demo() -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    for key in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "HF_TOKEN", "HUGGINGFACE_TOKEN"):
        env.pop(key, None)
    return subprocess.run(
        [sys.executable, "-S", MAIN.name], cwd=CODE, text=True, capture_output=True,
        timeout=45, env=env, check=False,
    )

class LessonDemoTests(unittest.TestCase):
    def test_source_compiles(self) -> None:
        compile(MAIN.read_text(encoding="utf-8"), str(MAIN), "exec")

    def test_demo_has_explicit_entrypoint(self) -> None:
        source = MAIN.read_text(encoding="utf-8")
        self.assertTrue("__main__" in source or "runpy.run_path" in source)

    def test_demo_exits_successfully(self) -> None:
        result = run_no_torch_demo()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_demo_emits_bounded_output(self) -> None:
        result = run_no_torch_demo()
        self.assertTrue((result.stdout + result.stderr).strip())
        self.assertLess(len(result.stdout) + len(result.stderr), 1_000_000)

    def test_demo_has_no_traceback(self) -> None:
        self.assertNotIn("Traceback (most recent call last)", run_no_torch_demo().stderr)

    def test_no_torch_fallback_reports_missing_dependency_and_succeeds(self) -> None:
        result = run_no_torch_demo()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PyTorch not installed", result.stdout)
        self.assertNotIn("Traceback", result.stdout + result.stderr)

if __name__ == "__main__":
    unittest.main()
