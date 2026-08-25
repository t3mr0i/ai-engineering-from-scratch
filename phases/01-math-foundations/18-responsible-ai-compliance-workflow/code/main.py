# Responsible-AI intake artifact for phases/01-math-foundations/18-responsible-ai-compliance-workflow/docs/en.md.
# Maps explicit risk phrases to governance categories, controls, and review evidence.
# The worksheet is deterministic and uses only the Python standard library.
# Canonical execution is `python3 main.py` from this code directory.
# Tests assert phrase boundaries, domain mappings, score bounds, and serialized handoffs.

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Iterable


TITLE = "Responsible AI Compliance Workflow"
CAPABILITY = "Foundation - Responsible AI intake"
SIGNALS = (
    "sensitive data",
    "external impact",
    "automated decision",
    "explanation required",
)
SIGNAL_ALIASES = {
    "sensitive data": ("sensitive data", "personal data", "PII"),
    "external impact": ("external impact", "public impact"),
    "automated decision": ("automated decision", "automated decisions", "decision automation"),
    "explanation required": ("explanation required", "explainability requirement"),
}
CATEGORY_ORDER = ("privacy", "fairness", "accountability", "transparency")
CATEGORIES_BY_SIGNAL = {
    "sensitive data": ("privacy",),
    "external impact": ("fairness", "accountability"),
    "automated decision": ("fairness", "accountability"),
    "explanation required": ("transparency",),
}
CONTROLS_BY_SIGNAL = {
    "sensitive data": ("PII minimization", "privacy review"),
    "external impact": ("impact assessment", "human review"),
    "automated decision": ("bias evaluation", "human review", "audit log"),
    "explanation required": ("decision rationale", "appeal path"),
}
EVIDENCE_BY_SIGNAL = {
    "sensitive data": ("data inventory", "purpose and retention note"),
    "external impact": ("affected-user impact note",),
    "automated decision": ("override procedure", "bias evaluation result"),
    "explanation required": ("sample decision rationale", "appeal owner"),
}
BASELINE_CATEGORIES = ("unclassified",)
BASELINE_CONTROLS = ("intended-use record", "named human owner")
CONTROLS = tuple(dict.fromkeys(control for values in CONTROLS_BY_SIGNAL.values() for control in values))


def normalize(text: str) -> str:
    """Normalize a phrase while preserving its word boundaries."""
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
        raise ValueError(f"unknown responsible-AI signal(s): {unknown}; allowed phrases: {allowed}")
    return tuple(canonical)


def _contains_phrase(text: str, phrase: str) -> bool:
    padded_text = f" {text} "
    return f" {normalize(phrase)} " in padded_text


def signal_matches(scenario: Scenario) -> list[str]:
    """Return canonical signals from explicit phrases or exact phrases in the text."""
    explicit = set(_canonical_explicit_signals(scenario))
    narrative = normalize(f"{scenario.name} {scenario.description}")
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
    return tuple(evidence) or ("confirm intended use and affected people",)


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
        f"Score={score}; this is a review plan, not a legal or regulatory verdict."
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
            name="HR screening assistant",
            description="Employee information feeds an automated decision and an explanation is required for affected staff.",
            signals=("sensitive data", "automated decision", "explanation required"),
            impact=4,
            uncertainty=4,
        ),
        Scenario(
            name="customer support escalation",
            description="The workflow has external impact for customers and the team needs a reviewable escalation explanation.",
            signals=("external impact", "explanation required"),
            impact=3,
            uncertainty=2,
        ),
        Scenario(
            name="internal meeting summarizer",
            description="A private team note is summarized for internal reference without a decision or affected-user signal.",
            signals=(),
            impact=1,
            uncertainty=1,
        ),
    ]


def main() -> None:
    plan = build_plan(demo_scenarios())
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": plan}, indent=2))


if __name__ == "__main__":
    main()
