"""AI Test Data and Synthetic Data Governance artifact.

Lesson docs: phases/11-llm-engineering/57-ai-test-data-synthetic-data-governance/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Test Data and Synthetic Data Governance"
CAPABILITY = "Quality Engineering - Governed Test Data"
SIGNALS = ["privacy risk", "coverage gap", "synthetic drift", "data leakage"]
CONTROLS = ["data classification", "coverage matrix", "drift check", "leakage test"]
CATEGORIES = ["test data request", "synthetic dataset", "coverage review", "privacy review"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    test_impact: int = 3
    data_sensitivity: int = 3


@dataclass(frozen=True)
class Recommendation:
    category: str
    score: int
    priority: str
    controls: tuple[str, ...]
    rationale: str


def normalize(text: str) -> str:
    return " ".join(text.lower().replace("-", " ").split())


def signal_matches(scenario: Scenario) -> list[str]:
    haystack = normalize(" ".join((scenario.name, scenario.description, " ".join(scenario.signals))))
    matches = []
    for signal in SIGNALS:
        words = normalize(signal).split()
        if all(word in haystack for word in words[:2]):
            matches.append(signal)
        elif any(word in haystack for word in words):
            matches.append(signal)
    return matches


def score_scenario(scenario: Scenario) -> int:
    matches = signal_matches(scenario)
    base = scenario.test_impact * 2 + scenario.data_sensitivity * 2
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "governance review"
    if score >= 11:
        return "controlled test data build"
    if score >= 7:
        return "coverage check"
    return "standard fixture"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.test_impact + scenario.data_sensitivity) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Test impact={scenario.test_impact}, data sensitivity={scenario.data_sensitivity}."
    )
    return Recommendation(choose_category(scenario), score, priority_for(score), selected_controls, rationale)


def build_plan(scenarios: Iterable[Scenario]) -> list[dict]:
    rows = []
    for scenario in scenarios:
        rec = recommend(scenario)
        rows.append({
            "scenario": scenario.name,
            "category": rec.category,
            "score": rec.score,
            "priority": rec.priority,
            "controls": list(rec.controls),
            "rationale": rec.rationale,
        })
    return sorted(rows, key=lambda row: row["score"], reverse=True)


def demo_scenarios() -> list[Scenario]:
    return [
        Scenario("customer simulation", "Privacy risk and data leakage must be prevented in synthetic data.", ("privacy risk", "data leakage"), 5, 5),
        Scenario("edge cases", "Coverage gap appears in regression tests.", ("coverage gap",), 4, 2),
        Scenario("static fixture", "Low sensitivity static fixture for parser tests.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
