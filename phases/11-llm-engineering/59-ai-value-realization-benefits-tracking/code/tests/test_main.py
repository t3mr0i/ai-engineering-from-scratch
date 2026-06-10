import unittest

from main import Scenario, build_plan, priority_for, recommend, score_scenario, signal_matches


class CourseArtifactTests(unittest.TestCase):
    def test_signal_matching_finds_known_signal(self):
        scenario = Scenario("value", "baseline missing for metric", ("baseline missing",), expected_value=3, measurement_confidence=3)
        self.assertIn("baseline missing", signal_matches(scenario))

    def test_score_increases_when_measurement_confidence_is_lower(self):
        confident = Scenario("confident", "same value", (), expected_value=4, measurement_confidence=5)
        weak = Scenario("weak", "same value", (), expected_value=4, measurement_confidence=1)
        self.assertGreater(score_scenario(weak), score_scenario(confident))

    def test_priority_thresholds_are_ordered(self):
        self.assertEqual(priority_for(17), "portfolio value review")
        self.assertEqual(priority_for(12), "benefits tracking")
        self.assertEqual(priority_for(8), "baseline setup")
        self.assertEqual(priority_for(2), "watch")

    def test_recommendation_contains_controls(self):
        scenario = Scenario("controlled", "adoption lag", ("adoption lag",), expected_value=4, measurement_confidence=2)
        rec = recommend(scenario)
        self.assertGreaterEqual(len(rec.controls), 2)
        self.assertTrue(rec.rationale.startswith("Matched"))

    def test_build_plan_sorts_by_score_descending(self):
        scenarios = [
            Scenario("small", "", (), expected_value=1, measurement_confidence=5),
            Scenario("large", "metric drift benefit owner", ("metric drift", "benefit owner"), expected_value=5, measurement_confidence=1),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "large")
        self.assertGreaterEqual(plan[0]["score"], plan[1]["score"])


if __name__ == "__main__":
    unittest.main()
