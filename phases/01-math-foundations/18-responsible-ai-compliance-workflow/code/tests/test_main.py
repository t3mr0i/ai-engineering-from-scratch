# Responsible-AI mapping tests for phases/01-math-foundations/18-responsible-ai-compliance-workflow/docs/en.md.
# The cases use explicit governance phrases and verify their category/control unions.
# Run from the lesson code directory with: python3 -m unittest discover tests -v.

import unittest

from main import (
    Scenario,
    build_plan,
    categories_for_signals,
    controls_for_signals,
    priority_for,
    recommend,
    score_scenario,
    signal_matches,
)


class ResponsibleIntakeTests(unittest.TestCase):
    def test_matching_requires_a_complete_phrase(self):
        generic = Scenario("notes", "The workflow contains data for a report.", (), impact=1, uncertainty=1)
        self.assertEqual(signal_matches(generic), [])
        exact = Scenario("notes", "The workflow contains sensitive data for a report.", ())
        self.assertEqual(signal_matches(exact), ["sensitive data"])

    def test_explicit_alias_is_normalized_and_unknown_is_rejected(self):
        pii = Scenario("intake", "", ("  PII ",), impact=2, uncertainty=2)
        self.assertEqual(signal_matches(pii), ["sensitive data"])
        with self.assertRaisesRegex(ValueError, "unknown responsible-AI signal"):
            signal_matches(Scenario("intake", "", ("decision",)))

    def test_sensitive_data_maps_to_privacy_controls(self):
        rec = recommend(Scenario("HR file", "", ("sensitive data",), impact=3, uncertainty=3))
        self.assertEqual(rec.categories, ("privacy",))
        self.assertEqual(rec.controls, ("PII minimization", "privacy review"))
        self.assertIn("data inventory", rec.evidence)

    def test_automated_decision_and_explanation_union_mappings(self):
        rec = recommend(Scenario("screening", "", ("automated decision", "explanation required")))
        self.assertEqual(rec.categories, ("fairness", "accountability", "transparency"))
        self.assertEqual(
            rec.controls,
            ("bias evaluation", "human review", "audit log", "decision rationale", "appeal path"),
        )

    def test_external_impact_has_fairness_and_accountability_review(self):
        self.assertEqual(
            categories_for_signals(["external impact"]),
            ("fairness", "accountability"),
        )
        self.assertEqual(
            controls_for_signals(["external impact"]),
            ("impact assessment", "human review"),
        )

    def test_scenario_levels_and_priority_scores_are_bounded(self):
        for field in ("impact", "uncertainty"):
            kwargs = {field: -1}
            with self.assertRaises(ValueError):
                Scenario("bad", "", (), **kwargs)
            kwargs[field] = 6
            with self.assertRaises(ValueError):
                Scenario("bad", "", (), **kwargs)
        with self.assertRaises(ValueError):
            priority_for(21)
        with self.assertRaises(ValueError):
            priority_for(-1)
        high = Scenario("high", "", tuple(("sensitive data", "external impact", "automated decision", "explanation required")), impact=5, uncertainty=5)
        self.assertEqual(score_scenario(high), 20)

    def test_unclassified_case_uses_a_review_baseline(self):
        rec = recommend(Scenario("internal note", "No affected people or risk phrase is present.", (), impact=1, uncertainty=1))
        self.assertEqual(rec.categories, ("unclassified",))
        self.assertEqual(rec.controls, ("intended-use record", "named human owner"))

    def test_build_plan_serializes_signals_and_sorts_deterministically(self):
        plan = build_plan([
            Scenario("low", "", (), impact=1, uncertainty=1),
            Scenario("high", "", ("automated decision",), impact=5, uncertainty=5),
            Scenario("same score", "", ("external impact",), impact=3, uncertainty=3),
        ])
        self.assertEqual([row["scenario"] for row in plan], ["high", "same score", "low"])
        self.assertEqual(
            set(plan[0]),
            {"scenario", "signals", "categories", "score", "priority", "controls", "evidence", "rationale"},
        )
        self.assertEqual(plan[0]["categories"], ["fairness", "accountability"])


if __name__ == "__main__":
    unittest.main()
