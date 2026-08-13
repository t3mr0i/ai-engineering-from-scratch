"""Build a progressive-disclosure index for an agent-readable workspace.

Lesson: phases/14-agent-engineering/46-agent-readable-workspace/docs/en.md
References: Python pathlib and fnmatch standard-library contracts.
The demo creates a temporary fixture and has no repository side effects.
Run: python3 main.py
"""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from tempfile import TemporaryDirectory


SKIP_DIRS = {".git", ".venv", "__pycache__", "dist", "build", ".cache"}
ROOT_HINTS = ("AGENTS.md", "README.md")


@dataclass(frozen=True)
class Entry:
    path: str
    summary: str
    kind: str


@dataclass(frozen=True)
class WorkspaceIndex:
    root: str
    entries: tuple[Entry, ...]


def _summary(path: Path) -> str:
    """Extract one useful, bounded line without parsing the whole file."""

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return "unreadable"
    for line in text.splitlines():
        line = re.sub(r"^\s*#+\s*", "", line).strip()
        if line and not line.startswith(("---", "```", "<!--")):
            return line[:140]
    return "empty file"


def build_index(root: str | Path) -> WorkspaceIndex:
    """Return deterministic entries while ignoring generated directories."""

    base = Path(root).resolve()
    if not base.is_dir():
        raise ValueError(f"workspace is not a directory: {root}")
    entries: list[Entry] = []
    for path in sorted(base.rglob("*")):
        if not path.is_file() or any(part in SKIP_DIRS for part in path.relative_to(base).parts):
            continue
        relative = path.relative_to(base).as_posix()
        kind = "router" if path.name in ROOT_HINTS else "file"
        entries.append(Entry(relative, _summary(path), kind))
    return WorkspaceIndex(base.as_posix(), tuple(entries))


def progressive_read_set(index: WorkspaceIndex, task: str, limit: int = 5) -> list[Entry]:
    """Rank likely source files while always preserving a root router hint."""

    if limit < 1:
        raise ValueError("limit must be positive")
    terms = {term.lower() for term in re.findall(r"[a-z0-9]+", task) if len(term) > 2}

    def score(entry: Entry) -> tuple[int, int, str]:
        haystack = f"{entry.path} {entry.summary}".lower()
        overlap = sum(1 for term in terms if term in haystack)
        root_bonus = 100 if entry.kind == "router" else 0
        # Negative scores sort highest first while the final path key remains
        # ascending, making ties deterministic (AGENTS.md before README.md).
        return (-(root_bonus + overlap), -root_bonus, entry.path)

    ranked = sorted(index.entries, key=score)
    selected: list[Entry] = []
    for entry in ranked:
        if entry not in selected:
            selected.append(entry)
        if len(selected) >= limit:
            break
    return selected


def main() -> None:
    with TemporaryDirectory(prefix="agent-readable-") as directory:
        root = Path(directory)
        (root / "AGENTS.md").write_text("# Router\nRead docs and src before acting.\n", encoding="utf-8")
        (root / "README.md").write_text("# Service\nA small validation service.\n", encoding="utf-8")
        (root / "src").mkdir()
        (root / "src" / "validator.py").write_text("# Input validation\n", encoding="utf-8")
        (root / "docs").mkdir()
        (root / "docs" / "acceptance.md").write_text("# Acceptance\nRun the validation checks.\n", encoding="utf-8")
        (root / "dist").mkdir()
        (root / "dist" / "bundle.js").write_text("generated", encoding="utf-8")
        index = build_index(root)
        selected = progressive_read_set(index, "add validation and run acceptance tests", limit=4)
        print(json.dumps({"entries": [asdict(e) for e in index.entries], "read_set": [e.path for e in selected]}, indent=2))


if __name__ == "__main__":
    main()
