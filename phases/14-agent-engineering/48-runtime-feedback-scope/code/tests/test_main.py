import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from main import ScopeContract, check_scope, run_command, run_feedback


class RuntimeFeedbackTests(unittest.TestCase):
    def test_scope_accepts_exact_and_nested_allowed_paths(self):
        contract = ScopeContract("T-1", ("src/**", "tests/test_app.py"))
        result = check_scope(("src/app.py", "src/lib/util.py", "tests/test_app.py"), contract)
        self.assertTrue(result.passed)

    def test_forbidden_pattern_wins_over_allowed_pattern(self):
        contract = ScopeContract("T-1", ("**",), ("secrets/**",))
        result = check_scope(("src/app.py", "secrets/key.txt"), contract)
        self.assertFalse(result.passed)
        self.assertEqual(result.violations, ("forbidden: secrets/key.txt",))

    def test_scope_rejects_outside_paths_and_bad_contracts(self):
        result = check_scope(("docs/readme.md",), ScopeContract("T-1", ("src/**",)))
        self.assertFalse(result.passed)
        self.assertIn("outside allowed scope", result.violations[0])
        with self.assertRaises(ValueError):
            check_scope(("src/app.py",), ScopeContract("", ("src/**",)))

    def test_scope_rejects_parent_traversal_and_absolute_paths(self):
        contract = ScopeContract("T-1", ("src/**",))
        result = check_scope(("../src/app.py", "/tmp/src/app.py"), contract)
        self.assertFalse(result.passed)
        self.assertEqual(len(result.violations), 2)
        self.assertTrue(all(item.startswith("outside allowed scope") for item in result.violations))

    def test_scope_rejects_unsafe_contract_patterns(self):
        with self.assertRaises(ValueError):
            check_scope(("src/app.py",), ScopeContract("T-1", ("../src/**",)))
        with self.assertRaises(ValueError):
            check_scope(("src/app.py",), ScopeContract("T-1", ("/tmp/**",)))

    def test_successful_command_captures_stdout(self):
        with TemporaryDirectory() as directory:
            receipt = run_command((sys.executable, "-c", "print('ok')"), Path(directory))
        self.assertTrue(receipt.passed)
        self.assertEqual(receipt.returncode, 0)
        self.assertEqual(receipt.stdout.strip(), "ok")
        self.assertEqual(receipt.stderr, "")

    def test_failed_command_captures_stderr_without_raising(self):
        with TemporaryDirectory() as directory:
            receipt = run_command((sys.executable, "-c", "import sys; print('bad', file=sys.stderr); sys.exit(3)"), directory)
        self.assertFalse(receipt.passed)
        self.assertEqual(receipt.returncode, 3)
        self.assertIn("bad", receipt.stderr)

    def test_timeout_is_an_explicit_receipt(self):
        with TemporaryDirectory() as directory:
            receipt = run_command((sys.executable, "-c", "import time; time.sleep(0.2)"), directory, timeout=0.01)
        self.assertFalse(receipt.passed)
        self.assertTrue(receipt.timed_out)
        self.assertEqual(receipt.returncode, -1)

    def test_feedback_runner_preserves_order(self):
        with TemporaryDirectory() as directory:
            receipts = run_feedback(
                [(sys.executable, "-c", "print('one')"), (sys.executable, "-c", "print('two')")],
                directory,
            )
        self.assertEqual([receipt.stdout.strip() for receipt in receipts], ["one", "two"])

    def test_command_validation_rejects_empty_argv_and_timeout(self):
        with TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                run_command((), directory)
            with self.assertRaises(ValueError):
                run_command((sys.executable,), directory, timeout=0)


if __name__ == "__main__":
    unittest.main()
