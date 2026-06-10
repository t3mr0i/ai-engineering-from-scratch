"""AI Knowledge Management and Content Governance artifact.

Lesson docs: phases/11-llm-engineering/52-ai-knowledge-management-content-governance/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Knowledge Management and Content Governance"
CAPABILITY = "Knowledge Management - Governed AI Content Sources"
SIGNALS = ["stale content", "duplicate answer", "unclear source", "access risk"]
CONTROLS = ["content owner", "freshness check", "source rank", "access rule"]
CATEGORIES = ["content cleanup", "source governance", "assistant readiness", "access review"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    usage_frequency: int = 3
    trust_risk: int = 3


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
    base = scenario.usage_frequency + scenario.trust_risk * 2
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "governance cleanup"
    if score >= 11:
        return "source review"
    if score >= 7:
        return "owner assignment"
    return "monitor"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.usage_frequency + scenario.trust_risk) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Usage frequency={scenario.usage_frequency}, trust risk={scenario.trust_risk}."
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
        Scenario("policy assistant source", "Stale content and unclear source create duplicate answer risk.", ("stale content", "unclear source", "duplicate answer"), 5, 5),
        Scenario("team wiki", "Access risk exists for a high-use knowledge page.", ("access risk",), 4, 4),
        Scenario("stable FAQ", "Named owner and recent review.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
