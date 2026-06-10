"""AI Risk Management and Internal Controls artifact.

Lesson docs: phases/11-llm-engineering/51-ai-risk-management-internal-controls/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Risk Management and Internal Controls"
CAPABILITY = "Governance - AI Risk and Control Evidence"
SIGNALS = ["control owner", "audit evidence", "policy exception", "high impact"]
CONTROLS = ["risk register", "control test", "audit trail", "approval owner"]
CATEGORIES = ["risk triage", "control design", "audit preparation", "exception review"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    impact: int = 3
    control_maturity: int = 3


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
    maturity_gap = max(0, 6 - scenario.control_maturity)
    base = scenario.impact * 2 + maturity_gap
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "risk committee review"
    if score >= 11:
        return "control design sprint"
    if score >= 7:
        return "risk register update"
    return "monitor"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.impact + scenario.control_maturity) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Impact={scenario.impact}, control maturity={scenario.control_maturity}."
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
        Scenario("customer-data assistant", "High impact AI use with policy exception and missing audit evidence.", ("high impact", "policy exception", "audit evidence"), 5, 2),
        Scenario("finance summary", "Control owner exists but approval evidence is incomplete.", ("control owner", "audit evidence"), 4, 3),
        Scenario("team experiment", "Low impact internal prompt trial.", (), 2, 5),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
