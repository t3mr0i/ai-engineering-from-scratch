"""Goal-driven loop engineering with an independent evaluator.

Lesson: phases/14-agent-engineering/43-loop-engineering/docs/en.md
References: Anthropic, "Building effective agents"; OpenAI, "Harness engineering".
Stdlib only; the deterministic demo needs no model, network, or API key.
Run: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Callable


class TriggerKind(str, Enum):
    """The four useful ways to wake a loop."""

    MANUAL = "manual"
    GOAL = "goal"
    TIMER = "timer"
    EVENT = "event"


@dataclass(frozen=True)
class Trigger:
    """A trigger specification independent from the loop's work policy."""

    kind: TriggerKind | str
    interval_seconds: float = 0.0
    event_name: str | None = None

    def __post_init__(self) -> None:
        try:
            normalised_kind = TriggerKind(self.kind)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"invalid trigger kind: {self.kind!r}") from exc
        object.__setattr__(self, "kind", normalised_kind)
        if normalised_kind is TriggerKind.TIMER and self.interval_seconds <= 0:
            raise ValueError("timer triggers need a positive interval")
        if normalised_kind is TriggerKind.EVENT and not self.event_name:
            raise ValueError("event triggers need an event_name")


def trigger_is_due(
    trigger: Trigger,
    *,
    now: float,
    last_run: float | None = None,
    event_name: str | None = None,
    requested: bool = False,
) -> bool:
    """Return whether a trigger may start one loop run.

    `requested` represents a human or scheduler submitting a manual/goal run.
    Timer and event triggers deliberately carry no hidden global state.
    """

    if trigger.kind in (TriggerKind.MANUAL, TriggerKind.GOAL):
        return requested
    if trigger.kind is TriggerKind.EVENT:
        return event_name == trigger.event_name
    if last_run is None:
        return True
    return now - last_run >= trigger.interval_seconds


@dataclass(frozen=True)
class LoopPolicy:
    """Stop conditions that keep an unattended loop bounded."""

    max_rounds: int = 8
    required_passes: int = 1
    max_stalled_rounds: int = 2

    def __post_init__(self) -> None:
        if self.max_rounds < 1:
            raise ValueError("max_rounds must be positive")
        if self.required_passes < 1:
            raise ValueError("required_passes must be positive")
        if self.required_passes > self.max_rounds:
            raise ValueError("required_passes cannot exceed max_rounds")
        if self.max_stalled_rounds < 1:
            raise ValueError("max_stalled_rounds must be positive")


@dataclass(frozen=True)
class CheckResult:
    """The evaluator's complete, machine-readable response."""

    passed: bool
    feedback: str = ""
    score: float | None = None

    def __post_init__(self) -> None:
        if type(self.passed) is not bool:
            raise TypeError("passed must be a bool")
        if self.score is not None and not 0.0 <= self.score <= 1.0:
            raise ValueError("score must be between 0 and 1")


@dataclass(frozen=True)
class RoundRecord:
    """An immutable receipt for one maker/evaluator round."""

    number: int
    input_artifact: str
    output_artifact: str
    passed: bool
    feedback: str
    score: float | None
    changed: bool


@dataclass
class LoopResult:
    """The bounded result of a complete loop run."""

    status: str
    reason: str
    artifact: str
    rounds: list[RoundRecord] = field(default_factory=list)
    consecutive_passes: int = 0

    @property
    def complete(self) -> bool:
        return self.status == "complete"


Maker = Callable[[str, str, str], str]
Checker = Callable[[str, str], CheckResult]


def run_maker_checker(
    goal: str,
    maker: Maker,
    checker: Checker,
    *,
    initial_artifact: str = "",
    policy: LoopPolicy | None = None,
) -> LoopResult:
    """Run a goal loop until a verifier passes or a policy stops it.

    The maker sees the previous artifact and evaluator feedback. The checker
    sees a fresh immutable string and owns the completion decision. Keeping
    those roles separate is the important design boundary; the demo functions
    below are deterministic stand-ins for model-backed roles.
    """

    if not goal.strip():
        raise ValueError("goal must not be empty")
    active_policy = policy or LoopPolicy()
    artifact = initial_artifact
    feedback = ""
    stalled_rounds = 0
    consecutive_passes = 0
    rounds: list[RoundRecord] = []

    for number in range(1, active_policy.max_rounds + 1):
        input_artifact = artifact
        artifact = maker(goal, input_artifact, feedback)
        if not isinstance(artifact, str):
            raise TypeError("maker must return a string artifact")

        check = checker(goal, artifact)
        if not isinstance(check, CheckResult):
            raise TypeError("checker must return CheckResult")
        changed = artifact != input_artifact
        # A stable passing artifact is intentional when multiple consecutive
        # passes are required. Only unchanged *failed* rounds are stalls.
        stalled_rounds = 0 if changed or check.passed else stalled_rounds + 1
        consecutive_passes = consecutive_passes + 1 if check.passed else 0
        rounds.append(
            RoundRecord(
                number=number,
                input_artifact=input_artifact,
                output_artifact=artifact,
                passed=check.passed,
                feedback=check.feedback,
                score=check.score,
                changed=changed,
            )
        )

        if consecutive_passes >= active_policy.required_passes:
            return LoopResult(
                status="complete",
                reason="independent evaluator passed",
                artifact=artifact,
                rounds=rounds,
                consecutive_passes=consecutive_passes,
            )
        if stalled_rounds >= active_policy.max_stalled_rounds:
            return LoopResult(
                status="stalled",
                reason="artifact did not change while verification was failing",
                artifact=artifact,
                rounds=rounds,
                consecutive_passes=consecutive_passes,
            )
        feedback = check.feedback

    return LoopResult(
        status="exhausted",
        reason="maximum rounds reached",
        artifact=artifact,
        rounds=rounds,
        consecutive_passes=consecutive_passes,
    )


_ROUND_RECORD_KEYS = {
    "number",
    "input_artifact",
    "output_artifact",
    "passed",
    "feedback",
    "score",
    "changed",
}


def _round_record_from_mapping(raw: object, *, line_number: int) -> RoundRecord:
    if not isinstance(raw, dict) or set(raw) != _ROUND_RECORD_KEYS:
        raise ValueError(f"invalid round receipt at line {line_number}")
    number = raw["number"]
    if type(number) is not int or number < 1:
        raise ValueError(f"invalid round number at line {line_number}")
    if not all(isinstance(raw[key], str) for key in ("input_artifact", "output_artifact", "feedback")):
        raise ValueError(f"artifact and feedback fields must be strings at line {line_number}")
    if type(raw["passed"]) is not bool or type(raw["changed"]) is not bool:
        raise ValueError(f"passed and changed fields must be bools at line {line_number}")
    score = raw["score"]
    if score is not None and (isinstance(score, bool) or not isinstance(score, (int, float)) or not 0.0 <= score <= 1.0):
        raise ValueError(f"invalid score at line {line_number}")
    return RoundRecord(
        number=number,
        input_artifact=raw["input_artifact"],
        output_artifact=raw["output_artifact"],
        passed=raw["passed"],
        feedback=raw["feedback"],
        score=score,
        changed=raw["changed"],
    )


def write_round_receipts(result: LoopResult, path: str | Path) -> None:
    """Atomically persist every round as one validated JSONL object."""

    if not isinstance(result, LoopResult):
        raise TypeError("write_round_receipts expects a LoopResult")
    records: list[dict[str, object]] = []
    for line_number, record in enumerate(result.rounds, start=1):
        if not isinstance(record, RoundRecord):
            raise TypeError("round receipts must contain RoundRecord values")
        raw = {
            "number": record.number,
            "input_artifact": record.input_artifact,
            "output_artifact": record.output_artifact,
            "passed": record.passed,
            "feedback": record.feedback,
            "score": record.score,
            "changed": record.changed,
        }
        validated = _round_record_from_mapping(raw, line_number=line_number)
        if validated.number != line_number:
            raise ValueError(f"round receipts must be sequential at line {line_number}")
        records.append(raw)

    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp")
    try:
        with temporary.open("w", encoding="utf-8") as handle:
            for record in records:
                handle.write(json.dumps(record, sort_keys=True) + "\n")
        temporary.replace(destination)
    finally:
        if temporary.exists():
            temporary.unlink()


def read_round_receipts(path: str | Path) -> list[RoundRecord]:
    """Load and validate JSONL receipts for replay and independent review."""

    receipts: list[RoundRecord] = []
    try:
        lines = Path(path).read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise ValueError(f"could not read round receipts: {path}") from exc
    for line_number, line in enumerate(lines, start=1):
        if not line.strip():
            raise ValueError(f"blank round receipt at line {line_number}")
        try:
            raw = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"invalid JSON at line {line_number}") from exc
        record = _round_record_from_mapping(raw, line_number=line_number)
        if record.number != len(receipts) + 1:
            raise ValueError(f"round receipts must be sequential at line {line_number}")
        receipts.append(record)
    return receipts


def demo_maker(goal: str, artifact: str, feedback: str) -> str:
    """Repair one missing acceptance item per round without an LLM."""

    del goal
    if not artifact:
        return "implementation"
    if "tests" not in artifact:
        return f"{artifact} + tests"
    if "acceptance" not in artifact:
        return f"{artifact} + acceptance"
    if feedback and "documentation" in feedback and "documentation" not in artifact:
        return f"{artifact} + documentation"
    return artifact


def demo_checker(goal: str, artifact: str) -> CheckResult:
    """Require explicit evidence rather than trusting the maker's claim."""

    del goal
    required = ("implementation", "tests", "acceptance")
    missing = [item for item in required if item not in artifact]
    if missing:
        return CheckResult(False, feedback="missing: " + ", ".join(missing), score=0.5)
    return CheckResult(True, feedback="all acceptance evidence present", score=1.0)


def main() -> None:
    result = run_maker_checker("ship a tested implementation", demo_maker, demo_checker)
    print(f"status={result.status} reason={result.reason}")
    for record in result.rounds:
        verdict = "PASS" if record.passed else "FAIL"
        print(f"round {record.number}: {verdict} artifact={record.output_artifact!r}")
    print(f"trigger timer_due={trigger_is_due(Trigger(TriggerKind.TIMER, 60), now=120, last_run=0)}")


if __name__ == "__main__":
    main()
