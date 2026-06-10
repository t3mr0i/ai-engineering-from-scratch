import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("analysis", "stakeholder gap is visible", ("stakeholder gap",), business_impact=3, ambiguity=2)
        self.assertIn("stakeholder gap", signal_matches(scenario))

    def test_score_increases_with_ambiguity(self):
        low = Scenario("low", "same impact", (), business_impact=3, ambiguity=1)
        high = Scenario("high", "same impact", (), business_impact=3, ambiguity=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "discovery workshop")
        self.assertEqual(priority_for(12), "guided analysis")
        self.assertEqual(priority_for(8), "clarify")
        self.assertEqual(priority_for(2), "monitor")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "requirement ambiguity", ("requirement ambiguity",), business_impact=4, ambiguity=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), business_impact=1, ambiguity=1),
            Scenario("large", "process variant evidence missing", ("process variant", "evidence missing"), business_impact=5, ambiguity=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
