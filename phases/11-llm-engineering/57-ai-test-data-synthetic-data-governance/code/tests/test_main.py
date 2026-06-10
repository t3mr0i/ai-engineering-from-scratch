import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("test", "privacy risk is high", ("privacy risk",), test_impact=3, data_sensitivity=3)
        self.assertIn("privacy risk", signal_matches(scenario))

    def test_score_increases_with_data_sensitivity(self):
        low = Scenario("low", "same test", (), test_impact=3, data_sensitivity=1)
        high = Scenario("high", "same test", (), test_impact=3, data_sensitivity=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "governance review")
        self.assertEqual(priority_for(12), "controlled test data build")
        self.assertEqual(priority_for(8), "coverage check")
        self.assertEqual(priority_for(2), "standard fixture")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "data leakage", ("data leakage",), test_impact=4, data_sensitivity=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), test_impact=1, data_sensitivity=1),
            Scenario("large", "coverage gap synthetic drift", ("coverage gap", "synthetic drift"), test_impact=5, data_sensitivity=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
