"""AI Prompt Library Governance and Reuse artifact.

Lesson docs: phases/11-llm-engineering/69-ai-prompt-library-governance-reuse/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Prompt Library Governance and Reuse"
CAPABILITY = "Knowledge Management - Reusable Prompt Pattern Governance"
SIGNALS = ["reused prompt", "owner missing", "quality drift", "context dependency"]
CONTROLS = ["pattern owner", "version note", "evaluation example", "retirement rule"]
CATEGORIES = ["prompt pattern", "library governance", "quality review", "reuse decision"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    reuse_value: int = 3
    drift_risk: int = 3


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
    base = scenario.reuse_value * 2 + scenario.drift_risk
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "publish governed pattern"
    if score >= 11:
        return "review before reuse"
    if score >= 7:
        return "assign owner"
    return "keep local"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.reuse_value + scenario.drift_risk) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Reuse value={scenario.reuse_value}, drift risk={scenario.drift_risk}."
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
        Scenario("proposal prompt pack", "Reused prompt has owner missing, quality drift, and context dependency.", ("reused prompt", "owner missing", "quality drift", "context dependency"), 5, 5),
        Scenario("monthly summary prompt", "Reusable prompt with a clear context dependency.", ("reused prompt", "context dependency"), 4, 3),
        Scenario("personal scratch prompt", "Low reuse value and no shared audience.", (), 1, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
