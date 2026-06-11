import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("tool", "external tool with sensitive data", ("external tool",), business_exposure=3, security_uncertainty=2)
        self.assertIn("external tool", signal_matches(scenario))

    def test_score_increases_with_security_uncertainty(self):
        low = Scenario("low", "same", (), business_exposure=3, security_uncertainty=1)
        high = Scenario("high", "same", (), business_exposure=3, security_uncertainty=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "security review required")
        self.assertEqual(priority_for(12), "triage with controls")
        self.assertEqual(priority_for(8), "document assumptions")
        self.assertEqual(priority_for(2), "low exposure")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("identity", "identity risk", ("identity risk",), business_exposure=4, security_uncertainty=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertIn("Business exposure", rec.rationale)

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), business_exposure=1, security_uncertainty=1),
            Scenario("large", "sensitive data external tool untrusted input", ("sensitive data", "external tool", "untrusted input"), business_exposure=5, security_uncertainty=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
