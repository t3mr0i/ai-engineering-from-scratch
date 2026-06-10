import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("workshop", "decision needed now", ("decision needed",), stakeholder_count=3, decision_pressure=2)
        self.assertIn("decision needed", signal_matches(scenario))

    def test_score_increases_with_decision_pressure(self):
        low = Scenario("low", "simple sync", (), stakeholder_count=2, decision_pressure=1)
        high = Scenario("high", "simple sync", (), stakeholder_count=2, decision_pressure=5)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "designed workshop")
        self.assertEqual(priority_for(12), "facilitated session")
        self.assertEqual(priority_for(8), "structured meeting")
        self.assertEqual(priority_for(2), "light agenda")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "follow up risk", ("follow up risk",), stakeholder_count=4, decision_pressure=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), stakeholder_count=1, decision_pressure=1),
            Scenario("large", "mixed audience unclear outcome", ("mixed audience", "unclear outcome"), stakeholder_count=5, decision_pressure=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
