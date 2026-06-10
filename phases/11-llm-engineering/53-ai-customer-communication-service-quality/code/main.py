"""AI Customer Communication and Service Quality artifact.

Lesson docs: phases/11-llm-engineering/53-ai-customer-communication-service-quality/docs/en.md
Source basis: LHIND AI Self-Assessment capability and training catalog.
Implements the reusable classroom artifact without external dependencies.
Run with: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "AI Customer Communication and Service Quality"
CAPABILITY = "Customer Service - AI-Assisted Response Quality"
SIGNALS = ["customer frustration", "response uncertainty", "sla risk", "escalation need"]
CONTROLS = ["response source", "empathy check", "confidence threshold", "escalation path"]
CATEGORIES = ["response draft", "service recovery", "knowledge gap", "escalation"]


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    customer_impact: int = 3
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
    base = scenario.customer_impact * 2 + scenario.uncertainty
    return min(20, base + len(matches) * 2)


def priority_for(score: int) -> str:
    if score >= 16:
        return "service lead review"
    if score >= 11:
        return "guided response"
    if score >= 7:
        return "peer check"
    return "self check"


def choose_category(scenario: Scenario) -> str:
    matches = signal_matches(scenario)
    if not matches:
        return CATEGORIES[0]
    return CATEGORIES[(len(matches) + scenario.customer_impact + scenario.uncertainty) % len(CATEGORIES)]


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    score = score_scenario(scenario)
    selected_controls = tuple(CONTROLS[: max(2, min(len(CONTROLS), 1 + len(matches)))])
    rationale = (
        f"Matched {len(matches)} signal(s): {', '.join(matches) if matches else 'none'}. "
        f"Customer impact={scenario.customer_impact}, uncertainty={scenario.uncertainty}."
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
        Scenario("delayed service reply", "Customer frustration, SLA risk and response uncertainty.", ("customer frustration", "sla risk", "response uncertainty"), 5, 5),
        Scenario("technical answer", "Escalation need because source confidence is low.", ("escalation need",), 4, 4),
        Scenario("simple update", "Known source and low customer impact.", (), 2, 1),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "capability": CAPABILITY, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
