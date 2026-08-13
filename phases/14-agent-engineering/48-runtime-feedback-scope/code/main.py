"""Run bounded commands and preserve scope plus runtime feedback receipts.

Lesson: phases/14-agent-engineering/48-runtime-feedback-scope/docs/en.md
References: Python subprocess and fnmatch standard-library contracts.
Commands are argv lists; the demo uses a temporary directory and no shell.
Run: python3 main.py
"""

from __future__ import annotations

import fnmatch
import json
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Iterable, Sequence


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


@dataclass(frozen=True)
class ScopeContract:
    task_id: str
    allowed: tuple[str, ...]
    forbidden: tuple[str, ...] = ()

    def validate(self) -> None:
        if not self.task_id.strip() or not self.allowed:
            raise ValueError("scope needs a task id and at least one allowed pattern")
        if any(_normalize_relative(pattern) is None for pattern in self.allowed + self.forbidden):
            raise ValueError("scope patterns must be non-empty POSIX-relative paths")


@dataclass(frozen=True)
class ScopeResult:
    passed: bool
    violations: tuple[str, ...]


@dataclass(frozen=True)
class CommandReceipt:
    command: tuple[str, ...]
    returncode: int
    stdout: str
    stderr: str
    timed_out: bool = False

    @property
    def passed(self) -> bool:
        return self.returncode == 0 and not self.timed_out


def _matches(path: str, pattern: str) -> bool:
    candidate = _normalize_relative(path)
    normal = _normalize_relative(pattern)
    if candidate is None or normal is None:
        return False
    if normal.endswith("/**"):
        prefix = normal[:-3].rstrip("/")
        return candidate == prefix or candidate.startswith(prefix + "/")
    return candidate == normal or fnmatch.fnmatchcase(candidate, normal)


def check_scope(paths: Iterable[str], contract: ScopeContract) -> ScopeResult:
    contract.validate()
    violations: list[str] = []
    for raw in paths:
        if not isinstance(raw, str) or not raw.strip():
            violations.append(repr(raw))
            continue
        path = raw.replace("\\", "/")
        if any(_matches(path, pattern) for pattern in contract.forbidden):
            violations.append(f"forbidden: {path}")
        elif not any(_matches(path, pattern) for pattern in contract.allowed):
            violations.append(f"outside allowed scope: {path}")
    return ScopeResult(not violations, tuple(violations))


def run_command(command: Sequence[str], cwd: str | Path, *, timeout: float = 5.0) -> CommandReceipt:
    """Execute one argv command and turn every outcome into a receipt."""

    if not command or not all(isinstance(item, str) and item for item in command):
        raise ValueError("command must be a non-empty argv sequence")
    if timeout <= 0:
        raise ValueError("timeout must be positive")
    argv = tuple(command)
    try:
        completed = subprocess.run(
            argv,
            cwd=Path(cwd),
            shell=False,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return CommandReceipt(argv, completed.returncode, completed.stdout, completed.stderr)
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout.decode(errors="replace") if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        stderr = exc.stderr.decode(errors="replace") if isinstance(exc.stderr, bytes) else (exc.stderr or "")
        return CommandReceipt(argv, -1, stdout, stderr, timed_out=True)


def run_feedback(commands: Iterable[Sequence[str]], cwd: str | Path, *, timeout: float = 5.0) -> list[CommandReceipt]:
    return [run_command(command, cwd, timeout=timeout) for command in commands]


def main() -> None:
    with TemporaryDirectory(prefix="runtime-feedback-") as directory:
        contract = ScopeContract("T-204", ("src/**", "tests/**"), ("secrets/**",))
        scope = check_scope(("src/app.py", "tests/test_app.py", "secrets/key.txt"), contract)
        receipts = run_feedback(
            [
                (sys.executable, "-c", "print('tests: pass')"),
                (sys.executable, "-c", "import sys; print('tests: fail', file=sys.stderr); sys.exit(2)"),
            ],
            directory,
        )
        print(json.dumps({"scope": asdict(scope), "receipts": [asdict(item) for item in receipts]}, indent=2))


if __name__ == "__main__":
    main()
