"""AI Data Quality and Master Data Processes artifact.

Lesson docs: phases/11-llm-engineering/49-ai-data-quality-master-data-processes/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Data Quality and Master Data Processes"
CAPABILITY = "Data Literacy - Quality Rules and Ownership"
SIGNALS = ["missing owner", "duplicate records", "stale field", "definition gap"]
CONTROLS = ["data owner", "quality rule", "sample check", "issue backlog"]
CATEGORIES = ["master data", "quality rule", "migration", "reporting feed"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    data_impact: int = 3
    correction_effort: int = 3


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
    base = scenario.data_impact * 2 + scenario.correction_effort
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "data governance action"
    if score >= 11:
        return "quality rule sprint"
    if score >= 7:
        return "sampling check"
    return "observe"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.data_impact + scenario.correction_effort) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Data impact={scenario.data_impact}, correction effort={scenario.correction_effort}."
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
        Scenario("customer master cleanup", "Duplicate records and missing owner before AI-assisted enrichment.", ("duplicate records", "missing owner"), 5, 4),
        Scenario("reporting field", "Stale field and definition gap create inconsistent KPI explanations.", ("stale field", "definition gap"), 4, 4),
        Scenario("stable lookup", "Known owner and sampled field quality.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
