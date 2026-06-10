"""AI Architecture Decision Governance artifact.

Lesson docs: phases/11-llm-engineering/54-ai-architecture-decision-governance/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Architecture Decision Governance"
CAPABILITY = "Architecture - Governed AI Design Decisions"
SIGNALS = ["technical uncertainty", "vendor lock in", "security boundary", "cost tradeoff"]
CONTROLS = ["adr record", "threat model", "cost model", "review board"]
CATEGORIES = ["architecture decision", "vendor choice", "security review", "cost review"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    design_impact: int = 3
    reversibility: int = 3


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
    irreversibility = max(0, 6 - scenario.reversibility)
    base = scenario.design_impact * 2 + irreversibility
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "architecture review board"
    if score >= 11:
        return "formal adr"
    if score >= 7:
        return "design note"
    return "team note"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.design_impact + scenario.reversibility) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Design impact={scenario.design_impact}, reversibility={scenario.reversibility}."
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
        Scenario("model gateway choice", "Vendor lock in, cost tradeoff and security boundary are open.", ("vendor lock in", "cost tradeoff", "security boundary"), 5, 2),
        Scenario("retrieval design", "Technical uncertainty remains around chunking and permissions.", ("technical uncertainty", "security boundary"), 4, 3),
        Scenario("small prompt helper", "Low impact reversible helper.", (), 2, 5),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
