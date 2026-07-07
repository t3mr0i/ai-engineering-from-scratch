"""AI Cloud, Data Platform, and IoT Use Case Design artifact.

Lesson docs: phases/11-llm-engineering/61-ai-cloud-data-platform-use-case-design/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Cloud, Data Platform, and IoT Use Case Design"
CAPABILITY = "Technology Consulting - Platform-Aware AI Design"
SIGNALS = ["latency need", "data residency", "sensor stream", "platform dependency"]
CONTROLS = ["architecture sketch", "data boundary", "streaming fit", "platform decision"]
CATEGORIES = ["cloud ai use case", "data platform pattern", "iot pattern", "edge constraint"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    technical_value: int = 3
    platform_risk: int = 3


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
    base = scenario.technical_value * 2 + scenario.platform_risk
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "architecture review"
    if score >= 11:
        return "platform feasibility review"
    if score >= 7:
        return "solution sketch"
    return "monitor"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.technical_value + scenario.platform_risk) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Technical value={scenario.technical_value}, platform risk={scenario.platform_risk}."
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
        Scenario("iot anomaly assistant", "Sensor stream and latency need create edge and platform dependency.", ("sensor stream", "latency need", "platform dependency"), 5, 5),
        Scenario("regional document search", "Data residency matters for cloud AI retrieval.", ("data residency",), 4, 4),
        Scenario("prototype notebook", "Small internal experiment with low platform risk.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
