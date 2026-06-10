import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("message", "brand claim needs review", ("brand claim",), reach=3, sensitivity=2)
        self.assertIn("brand claim", signal_matches(scenario))

    def test_score_increases_with_sensitivity(self):
        low = Scenario("low", "simple internal note", (), reach=2, sensitivity=1)
        high = Scenario("high", "simple internal note", (), reach=2, sensitivity=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "communications review board")
        self.assertEqual(priority_for(12), "manager review")
        self.assertEqual(priority_for(8), "peer check")
        self.assertEqual(priority_for(2), "self check")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "sensitive topic", ("sensitive topic",), reach=4, sensitivity=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), reach=1, sensitivity=1),
            Scenario("large", "audience risk brand claim", ("audience risk", "brand claim"), reach=5, sensitivity=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
