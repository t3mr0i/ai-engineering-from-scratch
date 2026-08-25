import unittest

from main import (
    SIGNALS,
    Scenario,
    build_plan,
    normalize,
    priority_for,
    recommend,
    score_scenario,
    signal_matches,
)


class PromptClinicContracts(unittest.TestCase):
    def test_normalize_is_small_and_explicit(self):
        self.assertEqual(normalize("A  time-series plan"), "a time series plan")
        with self.assertRaises(TypeError):
            normalize(3)

    def test_exact_signal_matching_avoids_single_word_false_positive(self):
        scenario = Scenario("metric review", "The team discusses a target and a split.", ())
        self.assertEqual(signal_matches(scenario), [])
        explicit = Scenario("risk", "", ("leakage risk",))
        self.assertEqual(signal_matches(explicit), ["leakage risk"])

    def test_unknown_signals_and_score_bounds_are_rejected(self):
        with self.assertRaises(ValueError):
            Scenario("bad", "", ("leakage",))
        with self.assertRaises(ValueError):
            Scenario("bad", "", (), impact=6)
        with self.assertRaises(ValueError):
            priority_for(21)

    def test_score_and_priority_are_monotonic(self):
        low = Scenario("low", "", (), impact=1, uncertainty=1)
        high = Scenario("high", "", ("leakage risk",), impact=5, uncertainty=5)
        self.assertLess(score_scenario(low), score_scenario(high))
        self.assertEqual(priority_for(16), "launch gate required")
        self.assertEqual(priority_for(11), "guided pilot")

    def test_recommendation_contains_semantic_controls(self):
        scenario = Scenario("forecast", "future values create leakage risk and no acceptance test", ("leakage risk", "no acceptance test"), 4, 4)
        rec = recommend(scenario)
        self.assertEqual(rec.category, "data integrity")
        self.assertEqual(rec.categories, ("data integrity", "release review"))
        self.assertIn("leakage check", rec.controls)
        self.assertIn("acceptance test", rec.controls)
        self.assertIn("leakage risk", rec.rationale)

    def test_plan_is_sorted_and_serializable(self):
        scenarios = [
            Scenario("baseline", "", ()),
            Scenario("classifier", "target is vague and metric is undefined", ("vague target", "undefined metric"), 5, 4),
        ]
        plan = build_plan(scenarios)
        self.assertEqual(plan[0]["scenario"], "classifier")
        self.assertEqual(set(plan[0]["controls"]) & {"problem brief", "metric definition"}, {"problem brief", "metric definition"})


if __name__ == "__main__":
    unittest.main()
