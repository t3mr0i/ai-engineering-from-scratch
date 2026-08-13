import json
import unittest

from main import Feedback, Harness, HarnessReport, ScopeContract, review_candidate


class CompleteHarnessTests(unittest.TestCase):
    def setUp(self):
        self.harness = Harness(
            "T-1",
            ScopeContract(("src", "tests"), ("secrets",)),
            ("unit", "acceptance"),
            ("read state", "respect scope", "verify"),
        )

    def passing_inputs(self):
        return (
            ("src/app.py", "tests/test_app.py"),
            {"unit": True, "acceptance": True},
            (Feedback("tests", True, "pass"),),
        )

    def test_complete_evidence_produces_ready_report_and_handoff(self):
        report = self.harness.run(*self.passing_inputs())
        self.assertIsInstance(report, HarnessReport)
        self.assertEqual(report.verdict, "ready")
        self.assertEqual(report.state.status, "ready")
        self.assertEqual(report.handoff["next_action"], "request human approval")

    def test_scope_violation_blocks_even_when_checks_pass(self):
        files, checks, feedback = self.passing_inputs()
        report = self.harness.run(files + ("secrets/key.txt",), checks, feedback)
        self.assertEqual(report.verdict, "blocked")
        self.assertIn("forbidden", report.scope_violations[0])

    def test_missing_required_check_blocks(self):
        files, _, feedback = self.passing_inputs()
        report = self.harness.run(files, {"unit": True}, feedback)
        self.assertFalse(report.review.passed)
        self.assertEqual(report.checks[-1].name, "acceptance")
        self.assertEqual(report.checks[-1].detail, "missing or failed")

    def test_failed_runtime_feedback_blocks(self):
        files, checks, _ = self.passing_inputs()
        report = self.harness.run(files, checks, (Feedback("tests", False, "exit 2"),))
        self.assertEqual(report.verdict, "blocked")
        self.assertIn("runtime", report.review.detail)

    def test_review_candidate_fails_closed_for_each_surface(self):
        good_checks = [("unit", True, "pass")]
        evidence = [self.harness.run(*self.passing_inputs()).checks[0]]
        good_feedback = [Feedback("test", True, "pass")]
        self.assertTrue(review_candidate((), evidence, good_feedback).passed)
        self.assertFalse(review_candidate(("outside",), evidence, good_feedback).passed)
        self.assertFalse(review_candidate((), (), good_feedback).passed)
        self.assertFalse(review_candidate((), evidence, (Feedback("test", False, "fail"),)).passed)
        del good_checks

    def test_instructions_and_contract_are_required(self):
        with self.assertRaises(ValueError):
            Harness("T-1", ScopeContract(("src",)), ("unit",), ())
        with self.assertRaises(ValueError):
            Harness("", ScopeContract(("src",)), ("unit",), ("read",))
        with self.assertRaises(ValueError):
            Harness("T-1", ScopeContract(("src",)), (), ("read",))

    def test_report_can_be_serialized_for_handoff(self):
        report = self.harness.run(*self.passing_inputs())
        encoded = json.dumps(report.as_dict(), sort_keys=True)
        self.assertIn('"verdict": "ready"', encoded)
        self.assertIn('"instructions_loaded": 3', encoded)

    def test_scope_contract_prefers_forbidden_paths(self):
        contract = ScopeContract(("**",), ("secrets",))
        self.assertEqual(contract.violations(("secrets/key",)), ("forbidden: secrets/key",))


if __name__ == "__main__":
    unittest.main()
