import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("platform", "data residency matters", ("data residency",), technical_value=3, platform_risk=2)
        self.assertIn("data residency", signal_matches(scenario))

    def test_score_increases_with_platform_risk(self):
        low = Scenario("low", "same value", (), technical_value=3, platform_risk=1)
        high = Scenario("high", "same value", (), technical_value=3, platform_risk=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "architecture review")
        self.assertEqual(priority_for(12), "platform feasibility review")
        self.assertEqual(priority_for(8), "solution sketch")
        self.assertEqual(priority_for(2), "monitor")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "sensor stream", ("sensor stream",), technical_value=4, platform_risk=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), technical_value=1, platform_risk=1),
            Scenario("large", "latency need platform dependency", ("latency need", "platform dependency"), technical_value=5, platform_risk=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
