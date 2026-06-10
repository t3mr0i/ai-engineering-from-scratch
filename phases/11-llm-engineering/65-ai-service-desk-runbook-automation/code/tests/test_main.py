import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("vpn", "repeat ticket with known fix", ("repeat ticket",), ticket_volume=3, service_risk=2)
        self.assertIn("repeat ticket", signal_matches(scenario))

    def test_score_increases_with_ticket_volume(self):
        low = Scenario("low", "same", (), ticket_volume=1, service_risk=3)
        high = Scenario("high", "same", (), ticket_volume=5, service_risk=3)
        self.assertGreater(score_scenario(high), score_scenario(low))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "pilot runbook automation")
        self.assertEqual(priority_for(12), "design agent assist")
        self.assertEqual(priority_for(8), "improve knowledge article")
        self.assertEqual(priority_for(2), "observe")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("handoff", "escalation rule", ("escalation rule",), ticket_volume=4, service_risk=4)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), ticket_volume=1, service_risk=1),
            Scenario("large", "repeat ticket known fix escalation rule", ("repeat ticket", "known fix", "escalation rule"), ticket_volume=5, service_risk=5),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
