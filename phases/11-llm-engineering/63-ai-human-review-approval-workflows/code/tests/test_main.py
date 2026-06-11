import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("review", "approval gap exists", ("approval gap",), impact=3, uncertainty=2)
        self.assertIn("approval gap", signal_matches(scenario))

    def test_score_increases_with_uncertainty(self):
        low = Scenario("low", "same impact", (), impact=3, uncertainty=1)
        high = Scenario("high", "same impact", (), impact=3, uncertainty=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "mandatory approval gate")
        self.assertEqual(priority_for(12), "named reviewer")
        self.assertEqual(priority_for(8), "peer review")
        self.assertEqual(priority_for(2), "self review")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "user impact", ("user impact",), impact=4, uncertainty=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), impact=1, uncertainty=1),
            Scenario("large", "decision authority quality uncertainty", ("decision authority", "quality uncertainty"), impact=5, uncertainty=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
