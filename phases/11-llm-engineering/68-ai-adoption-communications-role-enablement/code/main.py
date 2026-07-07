"""AI Adoption Communications and Role-Based Enablement artifact.

Lesson docs: phases/11-llm-engineering/68-ai-adoption-communications-role-enablement/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Adoption Communications and Role-Based Enablement"
CAPABILITY = "Change Management - Role-Based Adoption Communication"
SIGNALS = ["role impact", "resistance signal", "manager dependency", "message gap"]
CONTROLS = ["role narrative", "manager brief", "practice task", "feedback channel"]
CATEGORIES = ["role enablement", "manager communication", "adoption campaign", "feedback loop"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    adoption_value: int = 3
    change_friction: int = 3


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
        if all(word in haystack_words for word in words):
            matches.append(signal)
        elif any(word in haystack_words for word in words):
            matches.append(signal)
    return matches


def score_scenario(scenario: Scenario) -> int:
    matches = signal_matches(scenario)
    base = scenario.adoption_value * 2 + scenario.change_friction
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "launch enablement plan"
    if score >= 11:
        return "prepare manager brief"
    if score >= 7:
        return "clarify role message"
    return "monitor"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.adoption_value + scenario.change_friction) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Adoption value={scenario.adoption_value}, change friction={scenario.change_friction}."
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
        Scenario("claims team rollout", "Role impact is high with resistance signal and manager dependency.", ("role impact", "resistance signal", "manager dependency"), 5, 5),
        Scenario("finance assistant update", "Message gap makes adoption unclear.", ("message gap",), 3, 4),
        Scenario("minor prompt tip", "Low impact reminder for an already enabled team.", (), 1, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
