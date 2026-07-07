"""AI Value Realization and Benefits Tracking artifact.

Lesson docs: phases/11-llm-engineering/59-ai-value-realization-benefits-tracking/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Value Realization and Benefits Tracking"
CAPABILITY = "Leadership - AI Benefits Management"
SIGNALS = ["benefit owner", "baseline missing", "metric drift", "adoption lag"]
CONTROLS = ["benefit hypothesis", "baseline metric", "tracking cadence", "owner review"]
CATEGORIES = ["value case", "benefit tracker", "adoption metric", "portfolio review"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    expected_value: int = 3
    measurement_confidence: int = 3


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
    haystack_words = normalize(" ".join((scenario.name, scenario.description, " ".join(scenario.signals)))).split()
    matches = []
    for signal in SIGNALS:
        words = normalize(signal).split()
        if all(word in haystack_words for word in words[:2]):
            matches.append(signal)
        elif any(word in haystack_words for word in words):
            matches.append(signal)
    return matches


def score_scenario(scenario: Scenario) -> int:
    matches = signal_matches(scenario)
    confidence_gap = max(0, 6 - scenario.measurement_confidence)
    base = scenario.expected_value * 2 + confidence_gap
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "portfolio value review"
    if score >= 11:
        return "benefits tracking"
    if score >= 7:
        return "baseline setup"
    return "watch"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.expected_value + scenario.measurement_confidence) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Expected value={scenario.expected_value}, measurement confidence={scenario.measurement_confidence}."
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
        Scenario("copilot rollout", "Benefit owner exists but baseline missing and adoption lag is visible.", ("benefit owner", "baseline missing", "adoption lag"), 5, 2),
        Scenario("support assistant", "Metric drift threatens the value case.", ("metric drift",), 4, 3),
        Scenario("small prompt helper", "Low value and clear baseline.", (), 2, 5),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
