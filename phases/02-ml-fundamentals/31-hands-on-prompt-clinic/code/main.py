# Prompt-clinic planner for phases/02-ml-fundamentals/31-hands-on-prompt-clinic/docs/en.md.
# Turns an ML request into explicit framing, leakage, split, metric, and acceptance checks.
# The artifact is deterministic and uses only the Python standard library.
# Run from this directory with: python3 main.py

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Iterable


TITLE = "Hands-on ML Prompt Clinic"
SIGNALS = (
    "vague target",
    "missing audience",
    "leakage risk",
    "missing split",
    "undefined metric",
    "no acceptance test",
)
SIGNAL_CATEGORIES = {
    "vague target": "problem framing",
    "missing audience": "problem framing",
    "leakage risk": "data integrity",
    "missing split": "evaluation design",
    "undefined metric": "evaluation design",
    "no acceptance test": "release review",
}
SIGNAL_CONTROLS = {
    "vague target": ("problem brief",),
    "missing audience": ("problem brief",),
    "leakage risk": ("leakage check", "source check"),
    "missing split": ("split protocol",),
    "undefined metric": ("metric definition", "evaluation rubric"),
    "no acceptance test": ("acceptance test", "output rubric"),
}
DEFAULT_CONTROLS = ("problem brief", "metric definition", "split protocol", "acceptance test")


def normalize(text: str) -> str:
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    return " ".join(text.lower().replace("-", " ").split())


@dataclass(frozen=True)
class Scenario:
    name: str
    description: str
    signals: tuple[str, ...]
    impact: int = 3
    uncertainty: int = 3

    def __post_init__(self) -> None:
        if not isinstance(self.name, str) or not self.name.strip():
            raise ValueError("name must be non-empty text")
        if not isinstance(self.description, str):
            raise TypeError("description must be text")
        known = tuple(self.signals)
        if len(set(known)) != len(known) or any(signal not in SIGNALS for signal in known):
            raise ValueError(f"signals must be unique values from {list(SIGNALS)}")
        for field, value in (("impact", self.impact), ("uncertainty", self.uncertainty)):
            if not isinstance(value, int) or not 1 <= value <= 5:
                raise ValueError(f"{field} must be an integer from 1 through 5")


@dataclass(frozen=True)
class Recommendation:
    category: str
    score: int
    priority: str
    controls: tuple[str, ...]
    rationale: str
    categories: tuple[str, ...] = ()


def _contains_phrase(text: str, phrase: str) -> bool:
    haystack = f" {normalize(text)} "
    needle = f" {normalize(phrase)} "
    return needle in haystack


def signal_matches(scenario: Scenario) -> list[str]:
    if not isinstance(scenario, Scenario):
        raise TypeError("scenario must be a Scenario")
    detected = [signal for signal in SIGNALS if _contains_phrase(scenario.description, signal)]
    return [signal for signal in SIGNALS if signal in detected or signal in scenario.signals]


def score_scenario(scenario: Scenario) -> int:
    matches = signal_matches(scenario)
    return min(20, scenario.impact * 2 + scenario.uncertainty + len(matches) * 2)


def priority_for(score: int) -> str:
    if not isinstance(score, int) or not 0 <= score <= 20:
        raise ValueError("score must be an integer from 0 through 20")
    if score >= 16:
        return "launch gate required"
    if score >= 11:
        return "guided pilot"
    if score >= 7:
        return "team practice"
    return "awareness only"


def choose_category(scenario: Scenario) -> str:
    return choose_categories(scenario)[0]


def choose_categories(scenario: Scenario) -> tuple[str, ...]:
    matches = signal_matches(scenario)
    categories: list[str] = []
    for signal in matches:
        category = SIGNAL_CATEGORIES[signal]
        if category not in categories:
            categories.append(category)
    return tuple(categories or ["problem framing"])


def recommend(scenario: Scenario) -> Recommendation:
    matches = signal_matches(scenario)
    controls: list[str] = []
    for signal in matches:
        for control in SIGNAL_CONTROLS[signal]:
            if control not in controls:
                controls.append(control)
    if not controls:
        controls.extend(DEFAULT_CONTROLS)
    score = score_scenario(scenario)
    matched = ", ".join(matches) if matches else "none"
    rationale = (
        f"Matched signals: {matched}. Controls cover the stated ML risk; "
        f"impact={scenario.impact}, uncertainty={scenario.uncertainty}."
    )
    categories = choose_categories(scenario)
    return Recommendation(categories[0], score, priority_for(score), tuple(controls), rationale, categories)


def build_plan(scenarios: Iterable[Scenario]) -> list[dict]:
    rows = []
    for scenario in scenarios:
        rec = recommend(scenario)
        rows.append({
            "scenario": scenario.name,
            "category": rec.category,
            "categories": list(rec.categories),
            "score": rec.score,
            "priority": rec.priority,
            "controls": list(rec.controls),
            "rationale": rec.rationale,
        })
    return sorted(rows, key=lambda row: (-row["score"], row["scenario"]))


def demo_scenarios() -> list[Scenario]:
    return [
        Scenario(
            "support-ticket triage",
            "Predict an escalation label for a support queue; the target and audience are vague, and no acceptance test is written.",
            ("vague target", "missing audience", "no acceptance test"),
            3,
            3,
        ),
        Scenario(
            "weekly churn classifier",
            "Predict next-month churn from account activity; a post-outcome field creates leakage risk and the time split and metric are missing.",
            ("leakage risk", "missing split", "undefined metric"),
            5,
            4,
        ),
        Scenario(
            "reviewed demand baseline",
            "Forecast next week's demand with a chronological split, MAE, and a held-out acceptance test.",
            (),
            2,
            2,
        ),
    ]


def main() -> None:
    print(json.dumps({"title": TITLE, "plan": build_plan(demo_scenarios())}, indent=2))


if __name__ == "__main__":
    main()
