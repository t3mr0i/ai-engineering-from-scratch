import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("design", "security boundary is unclear", ("security boundary",), design_impact=3, reversibility=3)
        self.assertIn("security boundary", signal_matches(scenario))

    def test_score_increases_when_reversibility_is_lower(self):
        reversible = Scenario("reversible", "same design", (), design_impact=4, reversibility=5)
        hard_to_reverse = Scenario("hard", "same design", (), design_impact=4, reversibility=1)
        self.assertGreater(score_scenario(hard_to_reverse), score_scenario(reversible))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "architecture review board")
        self.assertEqual(priority_for(12), "formal adr")
        self.assertEqual(priority_for(8), "design note")
        self.assertEqual(priority_for(2), "team note")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "cost tradeoff", ("cost tradeoff",), design_impact=4, reversibility=2)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), design_impact=1, reversibility=5),
            Scenario("large", "vendor lock in technical uncertainty", ("vendor lock in", "technical uncertainty"), design_impact=5, reversibility=1),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
