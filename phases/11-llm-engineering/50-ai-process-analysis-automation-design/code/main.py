"""AI Process Analysis and Automation Design artifact.

Lesson docs: phases/11-llm-engineering/50-ai-process-analysis-automation-design/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Process Analysis and Automation Design"
CAPABILITY = "Process Improvement - AI-Supported Automation Design"
SIGNALS = ["process pain", "manual handoff", "exception volume", "automation risk"]
CONTROLS = ["process map", "value check", "exception log", "human fallback"]
CATEGORIES = ["workflow triage", "automation candidate", "exception process", "pilot design"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    value_potential: int = 3
    complexity: int = 3


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
    base = scenario.value_potential * 2 + scenario.complexity
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "automation discovery workshop"
    if score >= 11:
        return "guided pilot design"
    if score >= 7:
        return "process mapping"
    return "observe"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.value_potential + scenario.complexity) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Value potential={scenario.value_potential}, complexity={scenario.complexity}."
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
        Scenario("invoice handoff", "Manual handoff with exception volume and visible process pain.", ("manual handoff", "exception volume", "process pain"), 5, 4),
        Scenario("support routing", "Automation risk is high because exceptions need human judgment.", ("automation risk",), 4, 4),
        Scenario("simple reminder", "Low value operational reminder with stable rules.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
