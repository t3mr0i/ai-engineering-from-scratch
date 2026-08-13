import json
import unittest

from main import (
    Attempt,
    Task,
    compare,
    prompt_only_attempt,
    rules_first_attempt,
    validate_attempt,
)


class PromptRulesTests(unittest.TestCase):
    def setUp(self):
        self.task = Task(
            "ship validation",
            ("src/app.py", "tests/test_app.py"),
            ("unit", "acceptance"),
        )

    def test_task_rejects_missing_contract_parts(self):
        with self.assertRaises(ValueError):
            Task("", ("src/app.py",), ("unit",))
        with self.assertRaises(ValueError):
            Task("goal", (), ("unit",))
        with self.assertRaises(ValueError):
            Task("goal", ("src/app.py",), ())

    def test_prompt_only_attempt_fails_scope_and_evidence(self):
        verdict = validate_attempt(self.task, prompt_only_attempt(self.task))
        self.assertFalse(verdict.passed)
        self.assertTrue(any("out-of-scope" in item for item in verdict.violations))
        self.assertTrue(any("missing checks" in item for item in verdict.violations))

    def test_rules_first_attempt_passes_the_same_validator(self):
        verdict = validate_attempt(self.task, rules_first_attempt(self.task))
        self.assertTrue(verdict.passed)
        self.assertEqual(verdict.violations, ())

    def test_validator_detects_missing_artifact_entry(self):
        attempt = Attempt(("src/app.py",), {}, ("unit", "acceptance"))
        verdict = validate_attempt(self.task, attempt)
        self.assertFalse(verdict.passed)
        self.assertIn("missing artifact entries: src/app.py", verdict.violations)

    def test_comparison_keeps_two_independent_verdicts(self):
        report = compare(self.task)
        self.assertFalse(report["prompt_only"]["verdict"]["passed"])
        self.assertTrue(report["rules_first"]["verdict"]["passed"])
        self.assertNotEqual(report["prompt_only"]["attempt"], report["rules_first"]["attempt"])

    def test_comparison_is_json_serializable_and_sorted_by_main(self):
        encoded = json.dumps(compare(self.task), sort_keys=True)
        self.assertIn('"rules_first"', encoded)
        self.assertIn('"prompt_only"', encoded)


if __name__ == "__main__":
    unittest.main()
