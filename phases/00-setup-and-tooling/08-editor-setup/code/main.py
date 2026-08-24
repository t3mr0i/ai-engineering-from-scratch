# Lesson demo for phases/00-setup-and-tooling/08-editor-setup/docs/en.md.
# Evaluates an editor configuration against a small AI-engineering checklist.
# Uses plain dictionaries so the policy is editor-neutral and testable.
# Does not modify local editor or user settings.
# Run with: python3 main.py

from __future__ import annotations

import json
from collections.abc import Mapping


REQUIRED_SETTINGS = {
    "format_on_save": True,
    "type_checking": True,
    "integrated_terminal": True,
    "notebook_support": True,
    "remote_ssh": True,
}


def evaluate_editor(settings: Mapping[str, bool]) -> dict[str, object]:
    """Return satisfied and missing checklist items without mutating settings."""

    satisfied = [name for name, expected in REQUIRED_SETTINGS.items() if settings.get(name) is expected]
    missing = [name for name in REQUIRED_SETTINGS if name not in satisfied]
    return {
        "ready": not missing,
        "satisfied": satisfied,
        "missing": missing,
        "score": len(satisfied) / len(REQUIRED_SETTINGS),
    }


if __name__ == "__main__":
    sample = {name: True for name in REQUIRED_SETTINGS}
    print(json.dumps(evaluate_editor(sample), indent=2))
