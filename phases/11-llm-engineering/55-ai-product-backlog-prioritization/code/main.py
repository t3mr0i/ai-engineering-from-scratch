"""AI Product Backlog and Prioritization artifact.

Lesson docs: phases/11-llm-engineering/55-ai-product-backlog-prioritization/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Product Backlog and Prioritization"
CAPABILITY = "Product Management - AI-Supported Backlog Decisions"
SIGNALS = ["customer value", "delivery effort", "risk reduction", "dependency pressure"]
CONTROLS = ["evidence note", "scoring rubric", "dependency check", "decision log"]
CATEGORIES = ["feature candidate", "discovery item", "risk item", "dependency item"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    value: int = 3
    effort: int = 3


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
    effort_penalty = max(0, scenario.effort - 3)
    base = scenario.value * 3 - effort_penalty
    return max(1, min(20, base + len(matches) * 2))


def priority_for(score: int) -> str:
    if score >= 16:
        return "next planning review"
    if score >= 11:
        return "discovery refinement"
    if score >= 7:
        return "backlog candidate"
    return "park"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.value + scenario.effort) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Value={scenario.value}, effort={scenario.effort}."
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
        Scenario("self-service insight", "High customer value with risk reduction and dependency pressure.", ("customer value", "risk reduction", "dependency pressure"), 5, 3),
        Scenario("admin export", "Delivery effort is high and customer value is unclear.", ("delivery effort",), 2, 5),
        Scenario("search refinement", "Moderate customer value with small delivery effort.", ("customer value",), 3, 2),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
