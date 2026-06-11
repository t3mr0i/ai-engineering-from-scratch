import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("crm", "transaction context is available", ("transaction context",), business_value=3, integration_risk=2)
        self.assertIn("transaction context", signal_matches(scenario))

    def test_score_increases_with_integration_risk(self):
        low = Scenario("low", "same value", (), business_value=3, integration_risk=1)
        high = Scenario("high", "same value", (), business_value=3, integration_risk=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "solution design workshop")
        self.assertEqual(priority_for(12), "guided feasibility review")
        self.assertEqual(priority_for(8), "business app discovery")
        self.assertEqual(priority_for(2), "watch")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "integration constraint", ("integration constraint",), business_value=4, integration_risk=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), business_value=1, integration_risk=1),
            Scenario("large", "workflow exception master data dependency", ("workflow exception", "master data dependency"), business_value=5, integration_risk=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
