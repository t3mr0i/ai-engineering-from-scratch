import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("change", "role impact is high", ("role impact",), people_impact=3, adoption_complexity=2)
        self.assertIn("role impact", signal_matches(scenario))

    def test_score_increases_with_people_impact(self):
        low = Scenario("low", "same adoption", (), people_impact=1, adoption_complexity=2)
        high = Scenario("high", "same adoption", (), people_impact=5, adoption_complexity=2)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "change plan required")
        self.assertEqual(priority_for(12), "stakeholder engagement")
        self.assertEqual(priority_for(8), "communication prep")
        self.assertEqual(priority_for(2), "light update")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "manager dependency", ("manager dependency",), people_impact=4, adoption_complexity=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), people_impact=1, adoption_complexity=1),
            Scenario("large", "adoption risk communication gap", ("adoption risk", "communication gap"), people_impact=5, adoption_complexity=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
