"""Compare manual intervention with a bounded automated maker/evaluator loop.

Lesson: phases/14-agent-engineering/51-automated-loop/docs/en.md
References: Python dataclasses and enum standard-library contracts.
The fixture has no model, network, scheduler, or irreversible side effect.
Run: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Callable


class TriggerKind(str, Enum):
    MANUAL = "manual"
    GOAL = "goal"
    TIMER = "timer"
    EVENT = "event"


@dataclass(frozen=True)
class Trigger:
    kind: TriggerKind | str
    interval: float = 0.0
    event_name: str | None = None

    def __post_init__(self) -> None:
        try:
            kind = TriggerKind(self.kind)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"unknown trigger: {self.kind!r}") from exc
        object.__setattr__(self, "kind", kind)
        if kind is TriggerKind.TIMER and self.interval <= 0:
            raise ValueError("timer interval must be positive")
        if kind is TriggerKind.EVENT and not self.event_name:
            raise ValueError("event trigger needs event_name")


def trigger_due(trigger: Trigger, *, now: float, last_run: float | None = None, requested: bool = False, event_name: str | None = None) -> bool:
    if trigger.kind in (TriggerKind.MANUAL, TriggerKind.GOAL):
        return requested
    if trigger.kind is TriggerKind.EVENT:
        return event_name == trigger.event_name
    return last_run is None or now - last_run >= trigger.interval


@dataclass(frozen=True)
class LoopPolicy:
    max_rounds: int = 6
    max_stalled: int = 2
    max_interventions: int = 0

    def __post_init__(self) -> None:
        if self.max_rounds < 1 or self.max_stalled < 1 or self.max_interventions < 0:
            raise ValueError("loop limits must be non-negative, with positive round and stall limits")


@dataclass(frozen=True)
class RoundReceipt:
    number: int
    artifact_before: str
    artifact_after: str
    passed: bool
    feedback: str
    changed: bool
    intervention: str | None = None
    intervention_feedback: str | None = None


@dataclass(frozen=True)
class Evaluation:
    """A machine verdict with optional, explicitly counted human involvement."""

    passed: bool
    feedback: str
    intervention: str | None = None

    def __post_init__(self) -> None:
        if type(self.passed) is not bool or not isinstance(self.feedback, str):
            raise TypeError("evaluation needs a boolean verdict and string feedback")
        if self.intervention is not None and (not isinstance(self.intervention, str) or not self.intervention.strip()):
            raise TypeError("intervention must be a non-empty string when present")


@dataclass
class LoopResult:
    status: str
    reason: str
    artifact: str
    receipts: list[RoundReceipt] = field(default_factory=list)
    interventions: int = 0


Maker = Callable[[str, str, str], str]
Evaluator = Callable[[str, str], Evaluation | tuple[bool, str]]
InterventionHandler = Callable[[str, str], str]


def _coerce_evaluation(outcome: Evaluation | tuple[bool, str]) -> Evaluation:
    if isinstance(outcome, Evaluation):
        return outcome
    if isinstance(outcome, tuple) and len(outcome) == 2 and type(outcome[0]) is bool and isinstance(outcome[1], str):
        return Evaluation(outcome[0], outcome[1])
    raise TypeError("evaluator must return Evaluation or (bool, feedback)")


def run_loop(
    goal: str,
    maker: Maker,
    evaluator: Evaluator,
    *,
    policy: LoopPolicy | None = None,
    initial: str = "",
    intervene: InterventionHandler | None = None,
) -> LoopResult:
    if not goal.strip():
        raise ValueError("goal must not be empty")
    active = policy or LoopPolicy()
    artifact = initial
    feedback = ""
    stalled = 0
    interventions = 0
    receipts: list[RoundReceipt] = []
    for number in range(1, active.max_rounds + 1):
        before = artifact
        artifact = maker(goal, artifact, feedback)
        if not isinstance(artifact, str):
            raise TypeError("maker must return a string")
        outcome = _coerce_evaluation(evaluator(goal, artifact))
        intervention_feedback: str | None = None
        if outcome.intervention is not None:
            interventions += 1
            if interventions > active.max_interventions:
                receipts.append(
                    RoundReceipt(
                        number,
                        before,
                        artifact,
                        outcome.passed,
                        outcome.feedback,
                        artifact != before,
                        outcome.intervention,
                    )
                )
                return LoopResult(
                    "intervention_budget_exhausted",
                    "intervention budget reached",
                    artifact,
                    receipts,
                    interventions,
                )
            if intervene is None:
                receipts.append(
                    RoundReceipt(
                        number,
                        before,
                        artifact,
                        outcome.passed,
                        outcome.feedback,
                        artifact != before,
                        outcome.intervention,
                    )
                )
                return LoopResult(
                    "intervention_required",
                    "evaluator requested human input",
                    artifact,
                    receipts,
                    interventions,
                )
            intervention_feedback = intervene(outcome.intervention, artifact)
            if not isinstance(intervention_feedback, str):
                raise TypeError("intervention handler must return a string")
            feedback = intervention_feedback
        else:
            feedback = outcome.feedback
        passed = outcome.passed
        changed = artifact != before
        stalled = stalled + 1 if not passed and not changed else 0
        receipts.append(RoundReceipt(number, before, artifact, passed, feedback, changed, outcome.intervention, intervention_feedback))
        if passed:
            return LoopResult("complete", "evaluator passed", artifact, receipts, interventions)
        if stalled >= active.max_stalled:
            return LoopResult("stalled", "failed artifact did not change", artifact, receipts, interventions)
    return LoopResult("exhausted", "round budget reached", artifact, receipts, interventions)


def compare_manual_and_automated(manual_interventions: int, automated: LoopResult) -> dict[str, object]:
    if manual_interventions < 0:
        raise ValueError("manual interventions cannot be negative")
    if not isinstance(automated, LoopResult):
        raise TypeError("automated must be a LoopResult")
    return {
        "manual_interventions": manual_interventions,
        "automated_interventions": automated.interventions,
        "automated_rounds": len(automated.receipts),
        "status": automated.status,
        "interventions_reduced": manual_interventions - automated.interventions,
    }


def demo_maker(goal: str, artifact: str, feedback: str) -> str:
    del goal
    missing = [item for item in ("scope", "tests", "acceptance") if item not in artifact]
    return artifact + (" " + missing[0] if missing else "")


def _missing_items(artifact: str) -> list[str]:
    return [item for item in ("scope", "tests", "acceptance") if item not in artifact]


def demo_evaluator(goal: str, artifact: str) -> Evaluation:
    del goal
    missing = _missing_items(artifact)
    return Evaluation(not missing, "missing: " + ", ".join(missing) if missing else "all evidence present")


def manual_demo_evaluator(goal: str, artifact: str) -> Evaluation:
    """Model a manual review that records one intervention per failed review."""

    del goal
    missing = _missing_items(artifact)
    return Evaluation(
        not missing,
        "manual review: " + ", ".join(missing) if missing else "all evidence present",
        "review missing: " + missing[0] if missing else None,
    )


def manual_demo_intervention(reason: str, artifact: str) -> str:
    del artifact
    return "human resolved " + reason


def main() -> None:
    automated = run_loop("ship a scoped feature", demo_maker, demo_evaluator)
    manual = run_loop(
        "ship a scoped feature",
        demo_maker,
        manual_demo_evaluator,
        policy=LoopPolicy(max_interventions=3),
        intervene=manual_demo_intervention,
    )
    comparison = compare_manual_and_automated(manual.interventions, automated)
    print(
        json.dumps(
            {
                "trigger_due": trigger_due(Trigger(TriggerKind.GOAL), now=0, requested=True),
                "manual": asdict(manual),
                "result": asdict(automated),
                "comparison": comparison,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
