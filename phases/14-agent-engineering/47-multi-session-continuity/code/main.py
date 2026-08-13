"""Persist and resume a small, validated multi-session work state.

Lesson: phases/14-agent-engineering/47-multi-session-continuity/docs/en.md
References: Python pathlib, dataclasses, and atomic replace semantics.
The demo uses a temporary directory and never touches the repository state.
Run: python3 main.py
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any, Iterable


SCHEMA_VERSION = 1
REQUIRED_FIELDS = {
    "schema_version",
    "session_id",
    "task_id",
    "status",
    "completed_steps",
    "touched_files",
    "blockers",
    "next_action",
}


@dataclass
class SessionState:
    session_id: str
    task_id: str
    status: str = "in_progress"
    completed_steps: list[str] = field(default_factory=list)
    touched_files: list[str] = field(default_factory=list)
    blockers: list[str] = field(default_factory=list)
    next_action: str = "inspect the task"
    schema_version: int = SCHEMA_VERSION

    def validate(self) -> None:
        if self.schema_version != SCHEMA_VERSION:
            raise ValueError(f"unsupported schema version: {self.schema_version}")
        if not self.session_id.strip() or not self.task_id.strip():
            raise ValueError("session_id and task_id must not be empty")
        if self.status not in {"in_progress", "blocked", "complete"}:
            raise ValueError(f"invalid session status: {self.status}")
        for name, values in (
            ("completed_steps", self.completed_steps),
            ("touched_files", self.touched_files),
            ("blockers", self.blockers),
        ):
            if not isinstance(values, list) or not all(isinstance(item, str) and item.strip() for item in values):
                raise ValueError(f"{name} must be a list of non-empty strings")
        if not isinstance(self.next_action, str) or not self.next_action.strip():
            raise ValueError("next_action must not be empty")


def _from_mapping(raw: Any) -> SessionState:
    if not isinstance(raw, dict) or set(raw) != REQUIRED_FIELDS:
        raise ValueError("state must contain exactly the documented fields")
    state = SessionState(
        session_id=raw["session_id"],
        task_id=raw["task_id"],
        status=raw["status"],
        completed_steps=raw["completed_steps"],
        touched_files=raw["touched_files"],
        blockers=raw["blockers"],
        next_action=raw["next_action"],
        schema_version=raw["schema_version"],
    )
    state.validate()
    return state


def save_state(state: SessionState, path: str | Path) -> None:
    """Write a validated state snapshot with an atomic replace."""

    state.validate()
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp")
    try:
        temporary.write_text(json.dumps(asdict(state), indent=2, sort_keys=True) + "\n", encoding="utf-8")
        temporary.replace(destination)
    finally:
        if temporary.exists():
            temporary.unlink()


def load_state(path: str | Path) -> SessionState:
    try:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"could not load state: {path}") from exc
    return _from_mapping(raw)


def record_step(state: SessionState, step: str, *, touched: Iterable[str] = ()) -> SessionState:
    """Return a new state after one idempotent progress update."""

    if not step.strip():
        raise ValueError("step must not be empty")
    updated = SessionState(**asdict(state))
    if step not in updated.completed_steps:
        updated.completed_steps.append(step)
    for path in touched:
        if not isinstance(path, str) or not path.strip():
            raise ValueError("touched paths must be non-empty strings")
        if path not in updated.touched_files:
            updated.touched_files.append(path)
    updated.next_action = "run acceptance checks"
    updated.validate()
    return updated


def build_handoff(state: SessionState, commands: Iterable[str], risks: Iterable[str]) -> dict[str, object]:
    state.validate()
    command_list = list(commands)
    risk_list = list(risks)
    if not all(isinstance(item, str) and item.strip() for item in command_list + risk_list):
        raise ValueError("commands and risks must contain non-empty strings")
    return {
        "task_id": state.task_id,
        "summary": f"{len(state.completed_steps)} step(s) recorded; status={state.status}",
        "changed_files": list(state.touched_files),
        "commands_run": command_list,
        "open_risks": risk_list,
        "next_action": state.next_action,
    }


def main() -> None:
    with TemporaryDirectory(prefix="session-state-") as directory:
        path = Path(directory) / "agent_state.json"
        first = SessionState("session-1", "T-101", next_action="inspect source")
        first = record_step(first, "read router", touched=("AGENTS.md",))
        save_state(first, path)
        resumed = load_state(path)
        resumed.session_id = "session-2"
        resumed = record_step(resumed, "write focused test", touched=("tests/test_app.py",))
        handoff = build_handoff(resumed, ["python3 -m unittest"], ["acceptance not run yet"])
        save_state(resumed, path)
        print(json.dumps({"state": asdict(resumed), "handoff": handoff}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
