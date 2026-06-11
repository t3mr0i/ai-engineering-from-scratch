import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("coe", "ownership unclear across teams", ("ownership unclear",), scale_value=3, governance_complexity=2)
        self.assertIn("ownership unclear", signal_matches(scenario))

    def test_score_increases_with_scale_value(self):
        low = Scenario("low", "same governance", (), scale_value=1, governance_complexity=2)
        high = Scenario("high", "same governance", (), scale_value=5, governance_complexity=2)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "operating model design")
        self.assertEqual(priority_for(12), "coe service design")
        self.assertEqual(priority_for(8), "standards backlog")
        self.assertEqual(priority_for(2), "monitor")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "standards gap", ("standards gap",), scale_value=4, governance_complexity=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), scale_value=1, governance_complexity=1),
            Scenario("large", "reuse opportunity scaling risk", ("reuse opportunity", "scaling risk"), scale_value=5, governance_complexity=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
