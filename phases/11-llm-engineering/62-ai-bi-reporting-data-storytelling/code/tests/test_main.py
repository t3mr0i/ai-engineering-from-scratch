import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("report", "metric ambiguity is unresolved", ("metric ambiguity",), decision_impact=3, evidence_risk=2)
        self.assertIn("metric ambiguity", signal_matches(scenario))

    def test_score_increases_with_decision_impact(self):
        low = Scenario("low", "same evidence", (), decision_impact=1, evidence_risk=2)
        high = Scenario("high", "same evidence", (), decision_impact=5, evidence_risk=2)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "report review required")
        self.assertEqual(priority_for(12), "guided data story")
        self.assertEqual(priority_for(8), "metric check")
        self.assertEqual(priority_for(2), "self check")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "causality claim", ("causality claim",), decision_impact=4, evidence_risk=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), decision_impact=1, evidence_risk=1),
            Scenario("large", "visualization risk audience decision", ("visualization risk", "audience decision"), decision_impact=5, evidence_risk=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
