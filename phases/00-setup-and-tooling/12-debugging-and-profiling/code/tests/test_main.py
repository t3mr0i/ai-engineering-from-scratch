# Behavioral tests for both the stdlib fallback and optional tensor tooling.
from __future__ import annotations

import contextlib
import io
from pathlib import Path
import subprocess
import sys
import unittest

CODE = Path(__file__).resolve().parents[1]
MAIN = CODE / "main.py"
sys.path.insert(0, str(CODE))

import debug_tools  # noqa: E402


class DebugToolTests(unittest.TestCase):
    def test_timer_records_a_nonnegative_duration(self) -> None:
        with debug_tools.Timer("unit") as timer:
            sum(range(1000))
        self.assertGreaterEqual(timer.elapsed, 0.0)

    def test_stdlib_timing_demo_runs_without_torch(self) -> None:
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            debug_tools.demo_stdlib_timing()
        self.assertIn("Built 10000 values", output.getvalue())

    def test_memory_tracking_demo_uses_stdlib_allocations(self) -> None:
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            debug_tools.demo_memory_tracking()
        self.assertIn("Top 5 memory allocations", output.getvalue())
        self.assertNotIn("Traceback", output.getvalue())

    def test_logging_demo_emits_the_lesson_events(self) -> None:
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            with self.assertLogs(debug_tools.logger, level="INFO") as logs:
                debug_tools.demo_logging()
        self.assertIn("Structured Logging", output.getvalue())
        events = "\n".join(logs.output)
        self.assertIn("Training started", events)
        self.assertIn("Loss spike detected", events)

    def test_no_torch_subprocess_path_exits_zero(self) -> None:
        result = subprocess.run(
            [sys.executable, "-S", MAIN.name],
            cwd=CODE,
            text=True,
            capture_output=True,
            check=False,
            timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("standard-library demos only", result.stdout)
        self.assertIn("diagnostics complete", result.stdout)
        self.assertNotIn("Traceback", result.stderr)

    def test_source_compiles_and_has_main_entrypoint(self) -> None:
        compile((CODE / "debug_tools.py").read_text(encoding="utf-8"), "debug_tools.py", "exec")
        source = MAIN.read_text(encoding="utf-8")
        self.assertIn("runpy.run_path", source)

    def test_optional_torch_flag_is_boolean(self) -> None:
        self.assertIsInstance(debug_tools.HAS_TORCH, bool)


if __name__ == "__main__":
    unittest.main()
