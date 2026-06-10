"""AI Change Impact and Stakeholder Analysis artifact.

Lesson docs: phases/11-llm-engineering/58-ai-change-impact-stakeholder-analysis/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Change Impact and Stakeholder Analysis"
CAPABILITY = "Change Management - Stakeholder Impact Mapping"
SIGNALS = ["role impact", "adoption risk", "communication gap", "manager dependency"]
CONTROLS = ["impact map", "stakeholder plan", "communication script", "manager brief"]
CATEGORIES = ["impact assessment", "adoption plan", "communication plan", "manager enablement"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    people_impact: int = 3
    adoption_complexity: int = 3


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
    base = scenario.people_impact * 2 + scenario.adoption_complexity
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "change plan required"
    if score >= 11:
        return "stakeholder engagement"
    if score >= 7:
        return "communication prep"
    return "light update"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.people_impact + scenario.adoption_complexity) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"People impact={scenario.people_impact}, adoption complexity={scenario.adoption_complexity}."
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
        Scenario("assistant rollout", "Role impact and adoption risk are high with manager dependency.", ("role impact", "adoption risk", "manager dependency"), 5, 5),
        Scenario("workflow change", "Communication gap after process automation pilot.", ("communication gap",), 4, 3),
        Scenario("small tool tip", "Low people impact update for known users.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
