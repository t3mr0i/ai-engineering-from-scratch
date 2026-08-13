"""Aggregate independent, fail-closed checks into a verification report.

Lesson: phases/14-agent-engineering/49-self-verification/docs/en.md
References: Python dataclasses and callable standard-library contracts.
The sample checks run against a temporary artifact and require no dependencies.
Run: python3 main.py
"""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Callable, Iterable


@dataclass(frozen=True)
class Evidence:
    name: str
    passed: bool
    detail: str


@dataclass(frozen=True)
class VerificationReport:
    passed: bool
    evidence: tuple[Evidence, ...]


Check = Callable[[], tuple[bool, str]]
_WINDOWS_DRIVE = re.compile(r"^[A-Za-z]:")


def _normalize_relative(value: str) -> str | None:
    """Return a safe POSIX-relative path, or ``None`` for unsafe input."""

    if not isinstance(value, str) or not value.strip():
        return None
    candidate = value.replace("\\", "/")
    if candidate.startswith("/") or _WINDOWS_DRIVE.match(candidate):
        return None
    parts: list[str] = []
    for part in candidate.split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            return None
        parts.append(part)
    return "/".join(parts) or None


def _contains_symlink(root: Path, relative: str) -> bool:
    """Reject symlinked path components without resolving outside the root."""

    current = root
    for part in relative.split("/"):
        current /= part
        if current.is_symlink():
            return True
    return False


def verify(checks: Iterable[tuple[str, Check]]) -> VerificationReport:
    """Run named checks in order and fail closed for empty or broken checks."""

    items = list(checks)
    if not items:
        return VerificationReport(False, (Evidence("checks", False, "no checks supplied"),))
    evidence: list[Evidence] = []
    names: set[str] = set()
    for name, check in items:
        if not isinstance(name, str) or not name.strip() or name in names:
            evidence.append(Evidence(str(name), False, "check names must be unique and non-empty"))
            continue
        names.add(name)
        if not callable(check):
            evidence.append(Evidence(name, False, "check is not callable"))
            continue
        try:
            outcome = check()
            if not isinstance(outcome, tuple) or len(outcome) != 2 or type(outcome[0]) is not bool:
                raise TypeError("check must return (bool, detail)")
            passed, detail = outcome
            if not isinstance(detail, str):
                raise TypeError("check detail must be a string")
            evidence.append(Evidence(name, passed, detail))
        except Exception as exc:  # verification must report an exception, not pass
            evidence.append(Evidence(name, False, f"check error: {type(exc).__name__}: {exc}"))
    return VerificationReport(bool(evidence) and all(item.passed for item in evidence), tuple(evidence))


def file_exists(root: str | Path, relative: str) -> tuple[bool, str]:
    normalized = _normalize_relative(relative)
    if normalized is None:
        return False, "file path must be a non-empty relative path without traversal"
    root_path = Path(root)
    if _contains_symlink(root_path, normalized):
        return False, f"{relative}: symlink path is not allowed"
    path = root_path / normalized
    present = path.is_file()
    return present, f"{relative}: {'present' if present else 'missing'}"


def main() -> None:
    with TemporaryDirectory(prefix="verification-") as directory:
        root = Path(directory)
        (root / "src").mkdir()
        (root / "tests").mkdir()
        (root / "src" / "app.py").write_text("def validate(value): return bool(value)\n", encoding="utf-8")
        report = verify(
            [
                ("implementation exists", lambda: file_exists(root, "src/app.py")),
                ("tests exist", lambda: file_exists(root, "tests/test_app.py")),
                ("scope recorded", lambda: (True, "scope receipt present")),
            ]
        )
        print(json.dumps({"passed": report.passed, "evidence": [asdict(item) for item in report.evidence]}, indent=2))


if __name__ == "__main__":
    main()
