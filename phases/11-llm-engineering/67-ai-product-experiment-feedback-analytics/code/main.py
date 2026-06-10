"""AI Product Experiment Design and Feedback Analytics artifact.

Lesson docs: phases/11-llm-engineering/67-ai-product-experiment-feedback-analytics/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Product Experiment Design and Feedback Analytics"
CAPABILITY = "Products and Value Streams - Experiment Feedback Fit"
SIGNALS = ["user feedback", "hypothesis unclear", "metric missing", "experiment risk"]
CONTROLS = ["hypothesis statement", "success metric", "feedback sample", "stop rule"]
CATEGORIES = ["discovery experiment", "feedback synthesis", "metric definition", "rollout decision"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    learning_value: int = 3
    rollout_risk: int = 3


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
        if all(word in haystack for word in words):
            matches.append(signal)
        elif any(word in haystack for word in words):
            matches.append(signal)
    return matches


def score_scenario(scenario: Scenario) -> int:
    matches = signal_matches(scenario)
    base = scenario.learning_value * 2 + scenario.rollout_risk
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "run controlled experiment"
    if score >= 11:
        return "prepare feedback study"
    if score >= 7:
        return "define hypothesis"
    return "backlog note"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.learning_value + scenario.rollout_risk) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Learning value={scenario.learning_value}, rollout risk={scenario.rollout_risk}."
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
        Scenario("copilot onboarding test", "User feedback is strong but hypothesis unclear and metric missing.", ("user feedback", "hypothesis unclear", "metric missing"), 5, 4),
        Scenario("search ranking change", "Experiment risk is high before rollout.", ("experiment risk",), 4, 5),
        Scenario("minor copy idea", "Small improvement with limited learning value.", (), 1, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
