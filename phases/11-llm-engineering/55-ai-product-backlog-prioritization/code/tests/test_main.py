import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("feature", "customer value is clear", ("customer value",), value=3, effort=2)
        self.assertIn("customer value", signal_matches(scenario))

    def test_score_increases_with_value(self):
        low = Scenario("low", "same effort", (), value=1, effort=2)
        high = Scenario("high", "same effort", (), value=5, effort=2)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "next planning review")
        self.assertEqual(priority_for(12), "discovery refinement")
        self.assertEqual(priority_for(8), "backlog candidate")
        self.assertEqual(priority_for(2), "park")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "dependency pressure", ("dependency pressure",), value=4, effort=3)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), value=1, effort=5),
            Scenario("large", "customer value risk reduction", ("customer value", "risk reduction"), value=5, effort=2),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
