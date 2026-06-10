import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("risk", "audit evidence is incomplete", ("audit evidence",), impact=3, control_maturity=3)
        self.assertIn("audit evidence", signal_matches(scenario))

    def test_score_increases_when_control_maturity_is_lower(self):
        mature = Scenario("mature", "same impact", (), impact=4, control_maturity=5)
        immature = Scenario("immature", "same impact", (), impact=4, control_maturity=1)
        self.assertGreater(score_scenario(immature), score_scenario(mature))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "risk committee review")
        self.assertEqual(priority_for(12), "control design sprint")
        self.assertEqual(priority_for(8), "risk register update")
        self.assertEqual(priority_for(2), "monitor")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "policy exception", ("policy exception",), impact=4, control_maturity=2)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), impact=1, control_maturity=5),
            Scenario("large", "high impact policy exception", ("high impact", "policy exception"), impact=5, control_maturity=1),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
