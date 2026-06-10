import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("learning", "role context is important", ("role context",), learner_impact=3, transfer_risk=2)
        self.assertIn("role context", signal_matches(scenario))

    def test_score_increases_with_learner_impact(self):
        low = Scenario("low", "simple tip", (), learner_impact=1, transfer_risk=1)
        high = Scenario("high", "simple tip", (), learner_impact=5, transfer_risk=1)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "curriculum module")
        self.assertEqual(priority_for(12), "guided cohort")
        self.assertEqual(priority_for(8), "practice sprint")
        self.assertEqual(priority_for(2), "reference only")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "practice need", ("practice need",), learner_impact=4, transfer_risk=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), learner_impact=1, transfer_risk=1),
            Scenario("large", "skill gap practice need", ("skill gap", "practice need"), learner_impact=5, transfer_risk=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
