# Data-readiness mapping tests for phases/01-math-foundations/30-data-literacy-for-ai-projects/docs/en.md.
# The cases cover source evidence, phrase boundaries, and the four readiness domains.
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


class DataReadinessTests(unittest.TestCase):
    def test_generic_words_do_not_activate_a_readiness_signal(self):
        scenario = Scenario(
            "metadata note",
            "The source owner reviewed the data quality and field notes.",
            (),
            impact=1,
            uncertainty=1,
            source_owner="data team",
            freshness_days=3,
            quality_rate=0.99,
        )
        self.assertEqual(signal_matches(scenario), [])

    def test_alias_phrase_is_detected_without_substring_matching(self):
        scenario = Scenario(
            "snapshot",
            "The report uses outdated data from the latest snapshot.",
            (),
            source_owner="data team",
            freshness_days=7,
            quality_rate=0.99,
        )
        self.assertEqual(signal_matches(scenario), ["stale data"])

    def test_structured_evidence_derives_all_four_signals(self):
        scenario = Scenario(
            "customer table",
            "A local extract is being assessed.",
            (),
            source_owner=None,
            freshness_days=91,
            quality_rate=0.8,
            sensitive_fields=("email",),
        )
        self.assertEqual(
            signal_matches(scenario),
            ["unclear source owner", "stale data", "quality issue", "sensitive field"],
        )

    def test_owner_signal_maps_to_ownership_controls(self):
        rec = recommend(Scenario("unowned", "", ("unclear source owner",), source_owner="team"))
        self.assertEqual(rec.categories, ("ownership",))
        self.assertEqual(rec.controls, ("source inventory", "named data steward"))
        self.assertIn("owner name and escalation route", rec.evidence)

    def test_quality_and_privacy_controls_are_unioned(self):
        rec = recommend(
            Scenario(
                "employee export",
                "",
                ("quality issue", "sensitive field"),
                source_owner="analytics",
                quality_rate=0.9,
                sensitive_fields=("employee_id",),
            )
        )
        self.assertEqual(rec.categories, ("quality", "privacy"))
        self.assertEqual(
            rec.controls,
            ("quality threshold", "evaluation sample", "privacy classification", "field minimization"),
        )

    def test_unknown_explicit_signal_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "unknown data-readiness signal"):
            signal_matches(Scenario("bad", "", ("source",), source_owner="team"))

    def test_metadata_and_score_bounds_are_validated(self):
        with self.assertRaises(ValueError):
            Scenario("bad", "", (), impact=6)
        with self.assertRaises(ValueError):
            Scenario("bad", "", (), freshness_days=-1, source_owner="team")
        with self.assertRaises(ValueError):
            Scenario("bad", "", (), quality_rate=1.1, source_owner="team")
        with self.assertRaises(ValueError):
            priority_for(21)
        full = Scenario(
            "full",
            "",
            tuple(("unclear source owner", "stale data", "quality issue", "sensitive field")),
            impact=5,
            uncertainty=5,
        )
        self.assertEqual(score_scenario(full), 20)

    def test_readiness_baseline_is_distinct_from_a_risk_mapping(self):
        rec = recommend(
            Scenario(
                "healthy glossary",
                "The named team refreshed the internal glossary yesterday.",
                (),
                impact=1,
                uncertainty=1,
                source_owner="docs team",
                freshness_days=1,
                quality_rate=0.99,
            )
        )
        self.assertEqual(rec.categories, ("unclassified",))
        self.assertEqual(rec.controls, ("intended-use record",))

    def test_build_plan_serializes_evidence_and_sorts_by_score_then_name(self):
        plan = build_plan([
            Scenario("low", "", (), impact=1, uncertainty=1, source_owner="team"),
            Scenario("high", "", ("stale data",), impact=5, uncertainty=5, source_owner="team"),
            Scenario("medium", "", ("quality issue",), impact=3, uncertainty=3, source_owner="team"),
        ])
        self.assertEqual([row["scenario"] for row in plan], ["high", "medium", "low"])
        self.assertEqual(
            set(plan[0]),
            {"scenario", "signals", "categories", "score", "priority", "controls", "evidence", "rationale"},
        )
        self.assertEqual(plan[0]["categories"], ["freshness"])

    def test_category_and_control_helpers_have_fixed_domain_order(self):
        self.assertEqual(
            categories_for_signals(["sensitive field", "unclear source owner"]),
            ("ownership", "privacy"),
        )
        self.assertEqual(
            controls_for_signals(["sensitive field", "unclear source owner"]),
            ("source inventory", "named data steward", "privacy classification", "field minimization"),
        )


if __name__ == "__main__":
    unittest.main()
