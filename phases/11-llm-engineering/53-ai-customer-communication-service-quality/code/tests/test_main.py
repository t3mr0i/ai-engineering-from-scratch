import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("reply", "customer frustration is visible", ("customer frustration",), customer_impact=3, uncertainty=2)
        self.assertIn("customer frustration", signal_matches(scenario))

    def test_score_increases_with_customer_impact(self):
        low = Scenario("low", "simple note", (), customer_impact=1, uncertainty=1)
        high = Scenario("high", "simple note", (), customer_impact=5, uncertainty=1)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "service lead review")
        self.assertEqual(priority_for(12), "guided response")
        self.assertEqual(priority_for(8), "peer check")
        self.assertEqual(priority_for(2), "self check")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "escalation need", ("escalation need",), customer_impact=4, uncertainty=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), customer_impact=1, uncertainty=1),
            Scenario("large", "sla risk response uncertainty", ("sla risk", "response uncertainty"), customer_impact=5, uncertainty=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
