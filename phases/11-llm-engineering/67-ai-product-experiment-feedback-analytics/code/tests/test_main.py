import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("study", "user feedback is available", ("user feedback",), learning_value=3, rollout_risk=2)
        self.assertIn("user feedback", signal_matches(scenario))

    def test_score_increases_with_learning_value(self):
        low = Scenario("low", "same", (), learning_value=1, rollout_risk=3)
        high = Scenario("high", "same", (), learning_value=5, rollout_risk=3)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "run controlled experiment")
        self.assertEqual(priority_for(12), "prepare feedback study")
        self.assertEqual(priority_for(8), "define hypothesis")
        self.assertEqual(priority_for(2), "backlog note")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("metric", "metric missing", ("metric missing",), learning_value=4, rollout_risk=3)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertIn("Learning value", rec.rationale)

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), learning_value=1, rollout_risk=1),
            Scenario("large", "user feedback hypothesis unclear metric missing", ("user feedback", "hypothesis unclear", "metric missing"), learning_value=5, rollout_risk=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
