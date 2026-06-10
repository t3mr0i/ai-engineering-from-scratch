import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("content", "stale content appears in search", ("stale content",), usage_frequency=3, trust_risk=2)
        self.assertIn("stale content", signal_matches(scenario))

    def test_score_increases_with_trust_risk(self):
        low = Scenario("low", "wiki page", (), usage_frequency=2, trust_risk=1)
        high = Scenario("high", "wiki page", (), usage_frequency=2, trust_risk=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "governance cleanup")
        self.assertEqual(priority_for(12), "source review")
        self.assertEqual(priority_for(8), "owner assignment")
        self.assertEqual(priority_for(2), "monitor")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "access risk", ("access risk",), usage_frequency=4, trust_risk=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), usage_frequency=1, trust_risk=1),
            Scenario("large", "unclear source duplicate answer", ("unclear source", "duplicate answer"), usage_frequency=5, trust_risk=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
