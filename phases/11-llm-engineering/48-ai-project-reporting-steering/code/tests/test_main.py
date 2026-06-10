import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("report", "risk unclear for steering", ("risk unclear",), delivery_impact=3, ambiguity=2)
        self.assertIn("risk unclear", signal_matches(scenario))

    def test_score_increases_with_delivery_impact(self):
        low = Scenario("low", "simple status", (), delivery_impact=1, ambiguity=1)
        high = Scenario("high", "simple status", (), delivery_impact=5, ambiguity=1)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "steering escalation")
        self.assertEqual(priority_for(12), "managed report")
        self.assertEqual(priority_for(8), "team follow-up")
        self.assertEqual(priority_for(2), "monitor")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "decision request", ("decision request",), delivery_impact=4, ambiguity=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), delivery_impact=1, ambiguity=1),
            Scenario("large", "status drift dependency gap", ("status drift", "dependency gap"), delivery_impact=5, ambiguity=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
