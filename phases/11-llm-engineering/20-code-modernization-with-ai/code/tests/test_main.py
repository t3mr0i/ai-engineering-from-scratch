import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("pilot", "workflow includes low tests", ("low tests",), impact=3, uncertainty=2)
        self.assertIn("low tests", signal_matches(scenario))

    def test_score_increases_with_impact(self):
        low = Scenario("low", "simple workflow", (), impact=1, uncertainty=1)
        high = Scenario("high", "simple workflow", (), impact=5, uncertainty=1)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "launch gate required")
        self.assertEqual(priority_for(12), "guided pilot")
        self.assertEqual(priority_for(8), "team practice")
        self.assertEqual(priority_for(2), "awareness only")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "low tests", ("low tests",), impact=4, uncertainty=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), impact=1, uncertainty=1),
            Scenario("large", "low tests", ("low tests",), impact=5, uncertainty=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
