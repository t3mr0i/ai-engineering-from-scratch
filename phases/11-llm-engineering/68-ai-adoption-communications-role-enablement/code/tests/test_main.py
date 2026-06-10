import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("rollout", "role impact is visible", ("role impact",), adoption_value=3, change_friction=2)
        self.assertIn("role impact", signal_matches(scenario))

    def test_score_increases_with_change_friction(self):
        low = Scenario("low", "same", (), adoption_value=3, change_friction=1)
        high = Scenario("high", "same", (), adoption_value=3, change_friction=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "launch enablement plan")
        self.assertEqual(priority_for(12), "prepare manager brief")
        self.assertEqual(priority_for(8), "clarify role message")
        self.assertEqual(priority_for(2), "monitor")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("manager", "manager dependency", ("manager dependency",), adoption_value=4, change_friction=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertIn("Adoption value", rec.rationale)

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), adoption_value=1, change_friction=1),
            Scenario("large", "role impact resistance signal manager dependency", ("role impact", "resistance signal", "manager dependency"), adoption_value=5, change_friction=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
