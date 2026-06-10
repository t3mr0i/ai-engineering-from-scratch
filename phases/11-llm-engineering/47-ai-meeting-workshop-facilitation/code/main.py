"""AI Meeting Facilitation and Workshop Design artifact.

Lesson docs: phases/11-llm-engineering/47-ai-meeting-workshop-facilitation/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Meeting Facilitation and Workshop Design"
CAPABILITY = "Collaboration - AI-Supported Meeting Outcomes"
SIGNALS = ["unclear outcome", "mixed audience", "decision needed", "follow up risk"]
CONTROLS = ["agenda contract", "facilitation script", "decision log", "action tracker"]
CATEGORIES = ["standup", "workshop", "decision meeting", "retro"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    stakeholder_count: int = 3
    decision_pressure: int = 3


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
    base = scenario.stakeholder_count + scenario.decision_pressure * 2
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "designed workshop"
    if score >= 11:
        return "facilitated session"
    if score >= 7:
        return "structured meeting"
    return "light agenda"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.stakeholder_count + scenario.decision_pressure) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Stakeholders={scenario.stakeholder_count}, decision pressure={scenario.decision_pressure}."
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
        Scenario("roadmap decision", "Mixed audience and decision needed with unclear outcome.", ("mixed audience", "decision needed", "unclear outcome"), 5, 5),
        Scenario("retrospective", "Follow up risk after repeated action items.", ("follow up risk",), 4, 3),
        Scenario("daily sync", "Low pressure operational check-in.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
