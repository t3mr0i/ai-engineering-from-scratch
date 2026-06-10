"""Responsible AI Compliance Workflow course artifact.

Lesson docs: phases/11-llm-engineering/18-responsible-ai-compliance-workflow/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "Responsible AI Compliance Workflow"
CAPABILITY = "Foundation - Corporate Ethics & Compliance"
SIGNALS = ["sensitive data", "external impact", "automated decision", "explanation required"]
CONTROLS = ["PII minimization", "human review", "audit log", "approved tools only"]
CATEGORIES = ["privacy", "fairness", "accountability", "transparency"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    impact: int = 3
    uncertainty: int = 3


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
    base = scenario.impact * 2 + scenario.uncertainty
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "launch gate required"
    if score >= 11:
        return "guided pilot"
    if score >= 7:
        return "team practice"
    return "awareness only"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.impact + scenario.uncertainty) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Impact={scenario.impact}, uncertainty={scenario.uncertainty}."
    )
    return Recommendation(
        category=choose_category(scenario),
        score=score,
        priority=priority_for(score),
        controls=selected_controls,
        rationale=rationale,
    )


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
        Scenario(
            name="HR policy assistant",
            description="A real team wants to apply the course artifact to a recurring workflow with visible business impact.",
            signals=tuple(SIGNALS[:2]),
            impact=4,
            uncertainty=3,
        ),
        Scenario(
            name="customer email drafter",
            description="A smaller pilot with unclear ownership but enough evidence to practice the method safely.",
            signals=tuple(SIGNALS[1:3]),
            impact=3,
            uncertainty=2,
        ),
        Scenario(
            name="contract summarizer",
            description="A low-risk enablement exercise used for team learning before production rollout.",
            signals=tuple(SIGNALS[2:4]),
            impact=2,
            uncertainty=2,
        ),
    ]


def main() -> None:
    plan = build_plan(demo_scenarios())
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": plan}, indent=2))


if __name__ == "__main__":
    main()
