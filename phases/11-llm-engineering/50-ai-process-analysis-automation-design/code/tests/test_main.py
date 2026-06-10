import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("process", "manual handoff is repeated", ("manual handoff",), value_potential=3, complexity=2)
        self.assertIn("manual handoff", signal_matches(scenario))

    def test_score_increases_with_value_potential(self):
        low = Scenario("low", "stable workflow", (), value_potential=1, complexity=1)
        high = Scenario("high", "stable workflow", (), value_potential=5, complexity=1)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "automation discovery workshop")
        self.assertEqual(priority_for(12), "guided pilot design")
        self.assertEqual(priority_for(8), "process mapping")
        self.assertEqual(priority_for(2), "observe")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "automation risk", ("automation risk",), value_potential=4, complexity=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), value_potential=1, complexity=1),
            Scenario("large", "process pain exception volume", ("process pain", "exception volume"), value_potential=5, complexity=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
