"""AI Business Applications, ERP, and CRM Consulting artifact.

Lesson docs: phases/11-llm-engineering/60-ai-business-applications-erp-crm-consulting/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Business Applications, ERP, and CRM Consulting"
CAPABILITY = "Business Applications - AI Use Case Fit"
SIGNALS = ["transaction context", "master data dependency", "workflow exception", "integration constraint"]
CONTROLS = ["system boundary", "data owner", "exception rule", "integration note"]
CATEGORIES = ["erp use case", "crm use case", "business app workflow", "integration decision"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    business_value: int = 3
    integration_risk: int = 3


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
    base = scenario.business_value * 2 + scenario.integration_risk
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "solution design workshop"
    if score >= 11:
        return "guided feasibility review"
    if score >= 7:
        return "business app discovery"
    return "watch"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.business_value + scenario.integration_risk) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Business value={scenario.business_value}, integration risk={scenario.integration_risk}."
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
        Scenario("salesforce opportunity assistant", "CRM workflow exception with master data dependency and integration constraint.", ("workflow exception", "master data dependency", "integration constraint"), 5, 5),
        Scenario("sap invoice explanation", "Transaction context is clear but integration risk remains.", ("transaction context",), 4, 3),
        Scenario("team note helper", "Low impact business app helper without integration.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
