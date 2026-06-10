import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("data", "duplicate records found", ("duplicate records",), data_impact=3, correction_effort=2)
        self.assertIn("duplicate records", signal_matches(scenario))

    def test_score_increases_with_data_impact(self):
        low = Scenario("low", "simple lookup", (), data_impact=1, correction_effort=1)
        high = Scenario("high", "simple lookup", (), data_impact=5, correction_effort=1)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "data governance action")
        self.assertEqual(priority_for(12), "quality rule sprint")
        self.assertEqual(priority_for(8), "sampling check")
        self.assertEqual(priority_for(2), "observe")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "missing owner", ("missing owner",), data_impact=4, correction_effort=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), data_impact=1, correction_effort=1),
            Scenario("large", "stale field definition gap", ("stale field", "definition gap"), data_impact=5, correction_effort=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
