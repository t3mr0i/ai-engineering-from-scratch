# Data-readiness triage artifact for phases/01-math-foundations/30-data-literacy-for-ai-projects/docs/en.md.
# Derives ownership, freshness, quality, and privacy checks from local data evidence.
# The worksheet is deterministic and uses only the Python standard library.
# Canonical execution is `python3 main.py` from this code directory.
# Tests assert phrase boundaries, evidence-derived signals, controls, score bounds, and handoffs.

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Iterable


TITLE = "Data Literacy for AI Projects"
CAPABILITY = "Foundation - Data readiness"
SIGNALS = (
    "unclear source owner",
    "stale data",
    "quality issue",
    "sensitive field",
)
SIGNAL_ALIASES = {
    "unclear source owner": ("unclear source owner", "missing source owner", "unknown data owner"),
    "stale data": ("stale data", "outdated data", "stale snapshot"),
    "quality issue": ("quality issue", "data quality issue", "missing values"),
    "sensitive field": ("sensitive field", "personal field", "PII field"),
}
CATEGORY_ORDER = ("ownership", "freshness", "quality", "privacy")
CATEGORIES_BY_SIGNAL = {
    "unclear source owner": ("ownership",),
    "stale data": ("freshness",),
    "quality issue": ("quality",),
    "sensitive field": ("privacy",),
}
CONTROLS_BY_SIGNAL = {
    "unclear source owner": ("source inventory", "named data steward"),
    "stale data": ("freshness SLA", "refresh timestamp"),
    "quality issue": ("quality threshold", "evaluation sample"),
    "sensitive field": ("privacy classification", "field minimization"),
}
EVIDENCE_BY_SIGNAL = {
    "unclear source owner": ("owner name and escalation route",),
    "stale data": ("last refresh timestamp", "freshness target"),
    "quality issue": ("missingness or validity measurement",),
    "sensitive field": ("field inventory and access purpose",),
}
BASELINE_CATEGORIES = ("unclassified",)
BASELINE_CONTROLS = ("intended-use record",)
CONTROLS = tuple(dict.fromkeys(control for values in CONTROLS_BY_SIGNAL.values() for control in values))
FRESHNESS_LIMIT_DAYS = 30
QUALITY_FLOOR = 0.95


def normalize(text: str) -> str:
    """Normalize a phrase without turning a single generic word into a signal."""
    if not isinstance(text, str):
        raise TypeError("signals and text fields must be strings")
    return " ".join(re.findall(r"[a-z0-9]+", text.lower()))


def _validate_level(value: int, field: str) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 5:
        raise ValueError(f"{field} must be an integer from 0 through 5")


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    impact: int = 3
    uncertainty: int = 3
    source_owner: str | None = None
    freshness_days: int | None = None
    quality_rate: float | None = None
    sensitive_fields: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name.strip():
            raise ValueError("name must be a non-empty string")
        if not isinstance(self.description, str):
            raise TypeError("description must be a string")
        if isinstance(self.signals, (str, bytes)):
            raise TypeError("signals must be an iterable of phrases")
        object.__setattr__(self, "signals", tuple(self.signals))
        _validate_level(self.impact, "impact")
        _validate_level(self.uncertainty, "uncertainty")
        if self.source_owner is not None and (not isinstance(self.source_owner, str) or not self.source_owner.strip()):
            raise ValueError("source_owner must be a non-empty string or None")
        if self.freshness_days is not None and (
            isinstance(self.freshness_days, bool)
            or not isinstance(self.freshness_days, int)
            or self.freshness_days < 0
        ):
            raise ValueError("freshness_days must be a non-negative integer or None")
        if self.quality_rate is not None and not 0.0 <= self.quality_rate <= 1.0:
            raise ValueError("quality_rate must be between 0 and 1")
        if isinstance(self.sensitive_fields, (str, bytes)):
            raise TypeError("sensitive_fields must be an iterable of field names")
        fields = tuple(self.sensitive_fields)
        if any(not isinstance(field, str) or not field.strip() for field in fields):
            raise ValueError("sensitive_fields must contain non-empty names")
        object.__setattr__(self, "sensitive_fields", fields)


@dataclass(frozen=True)
class Recommendation:
    categories: tuple[str, ...]
    score: int
    priority: str
    controls: tuple[str, ...]
    evidence: tuple[str, ...]
    rationale: str


def _canonical_explicit_signals(scenario: Scenario) -> tuple[str, ...]:
    aliases = {
        normalize(alias): canonical
        for canonical, phrases in SIGNAL_ALIASES.items()
        for alias in phrases
    }
    canonical = []
    unknown = []
    for raw_signal in scenario.signals:
        if not isinstance(raw_signal, str):
            unknown.append(repr(raw_signal))
            continue
        mapped = aliases.get(normalize(raw_signal))
        if mapped is None:
            unknown.append(raw_signal)
        elif mapped not in canonical:
            canonical.append(mapped)
    if unknown:
        allowed = ", ".join(SIGNALS)
        raise ValueError(f"unknown data-readiness signal(s): {unknown}; allowed phrases: {allowed}")
    return tuple(canonical)


def _contains_phrase(text: str, phrase: str) -> bool:
    padded_text = f" {text} "
    return f" {normalize(phrase)} " in padded_text


def signal_matches(scenario: Scenario) -> list[str]:
    """Combine exact narrative phrases with structured source evidence."""
    explicit = set(_canonical_explicit_signals(scenario))
    narrative = normalize(f"{scenario.name} {scenario.description}")
    if scenario.source_owner is None or scenario.source_owner.strip().lower() in {"unknown", "unassigned"}:
        explicit.add("unclear source owner")
    if scenario.freshness_days is not None and scenario.freshness_days > FRESHNESS_LIMIT_DAYS:
        explicit.add("stale data")
    if scenario.quality_rate is not None and scenario.quality_rate < QUALITY_FLOOR:
        explicit.add("quality issue")
    if scenario.sensitive_fields:
        explicit.add("sensitive field")
    matches = []
    for signal in SIGNALS:
        phrase_match = any(_contains_phrase(narrative, alias) for alias in SIGNAL_ALIASES[signal])
        if signal in explicit or phrase_match:
            matches.append(signal)
    return matches


def categories_for_signals(matches: Iterable[str]) -> tuple[str, ...]:
    found = set(matches)
    categories = tuple(
        category
        for category in CATEGORY_ORDER
        if any(category in CATEGORIES_BY_SIGNAL[signal] for signal in found)
    )
    return categories or BASELINE_CATEGORIES


def controls_for_signals(matches: Iterable[str]) -> tuple[str, ...]:
    selected = []
    for signal in SIGNALS:
        if signal in matches:
            for control in CONTROLS_BY_SIGNAL[signal]:
                if control not in selected:
                    selected.append(control)
    return tuple(selected) or BASELINE_CONTROLS


def evidence_for_signals(matches: Iterable[str]) -> tuple[str, ...]:
    evidence = []
    for signal in SIGNALS:
        if signal in matches:
            for item in EVIDENCE_BY_SIGNAL[signal]:
                if item not in evidence:
                    evidence.append(item)
    return tuple(evidence) or ("confirm source scope and intended use",)


def score_scenario(scenario: Scenario) -> int:
    matches = signal_matches(scenario)
    return min(20, scenario.impact * 2 + scenario.uncertainty + 2 * len(matches))


def priority_for(score: int) -> str:
    if isinstance(score, bool) or not isinstance(score, int) or not 0 <= score <= 20:
        raise ValueError("score must be an integer from 0 through 20")
    if score >= 16:
        return "launch gate required"
    if score >= 11:
        return "guided pilot"
    if score >= 7:
        return "team practice"
    return "awareness only"


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    categories = categories_for_signals(matches)
    controls = controls_for_signals(matches)
    evidence = evidence_for_signals(matches)
    rationale = (
        f"Matched signals: {', '.join(matches) if matches else 'none'}. "
        f"Categories: {', '.join(categories)}. Controls: {', '.join(controls)}. "
        f"Score={score}; this is a data-readiness triage, not a quality certificate."
    )
    return Recommendation(categories, score, priority_for(score), controls, evidence, rationale)


def build_plan(scenarios: Iterable[Scenario]) -> list[dict]:
    rows = []
    for scenario in scenarios:
        matches = signal_matches(scenario)
        rec = recommend(scenario)
        rows.append({
            "scenario": scenario.name,
            "signals": matches,
            "categories": list(rec.categories),
            "score": rec.score,
            "priority": rec.priority,
            "controls": list(rec.controls),
            "evidence": list(rec.evidence),
            "rationale": rec.rationale,
        })
    return sorted(rows, key=lambda row: (-row["score"], row["scenario"]))


def demo_scenarios() -> list[Scenario]:
    return [
        Scenario(
            name="knowledge assistant",
            description="SharePoint extracts are stale and the source owner is unclear.",
            signals=("stale data", "unclear source owner", "quality issue"),
            impact=4,
            uncertainty=4,
            freshness_days=90,
            quality_rate=0.92,
        ),
        Scenario(
            name="employee report summarizer",
            description="A weekly report has a sensitive field and a measurable quality issue.",
            signals=("sensitive field", "quality issue"),
            impact=3,
            uncertainty=3,
            source_owner="analytics team",
            freshness_days=7,
            quality_rate=0.91,
            sensitive_fields=("employee_id",),
        ),
        Scenario(
            name="team glossary",
            description="A small internal glossary has a named owner and a recent refresh.",
            signals=(),
            impact=2,
            uncertainty=2,
            source_owner="docs team",
            freshness_days=7,
            quality_rate=0.99,
        ),
    ]


def main() -> None:
    plan = build_plan(demo_scenarios())
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": plan}, indent=2))


if __name__ == "__main__":
    main()
