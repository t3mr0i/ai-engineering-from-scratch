import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("library", "reused prompt", ("reused prompt",), reuse_value=3, drift_risk=2)
        self.assertIn("reused prompt", signal_matches(scenario))

    def test_score_increases_with_drift_risk(self):
        low = Scenario("low", "same", (), reuse_value=3, drift_risk=1)
        high = Scenario("high", "same", (), reuse_value=3, drift_risk=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "publish governed pattern")
        self.assertEqual(priority_for(12), "review before reuse")
        self.assertEqual(priority_for(8), "assign owner")
        self.assertEqual(priority_for(2), "keep local")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("owner", "owner missing", ("owner missing",), reuse_value=4, drift_risk=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertIn("Reuse value", rec.rationale)

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), reuse_value=1, drift_risk=1),
            Scenario("large", "reused prompt owner missing quality drift", ("reused prompt", "owner missing", "quality drift"), reuse_value=5, drift_risk=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
