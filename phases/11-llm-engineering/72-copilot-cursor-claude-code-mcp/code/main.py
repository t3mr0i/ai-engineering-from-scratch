"""Tool-fit selection & MCP trust models — stdlib Python.

Two deterministic policies, made runnable:

1. select_tool(): pick Copilot / Cursor / Claude Code by WHERE the work lives
   (the axis that doesn't age), not by a feature table (which does).
2. mcp_posture(): given a proposed MCP server's capability and whether it reads
   attacker-controllable data, return the safe permission posture. Encodes the
   rule: the capability you grant a server = the capability you grant whoever
   can write the data it reads.

No model, no network.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------- Part 1: where does the work live -> which tool ----------

class Tool(Enum):
    COPILOT = "GitHub Copilot"
    CURSOR = "Cursor"
    CLAUDE_CODE = "Claude Code"


def select_tool(task: str) -> tuple[Tool, str]:
    t = task.lower()
    # Terminal / unattended / scripted -> Claude Code.
    if any(k in t for k in ("overnight", "ci", "unattended", "scripted", "terminal", "migration")):
        return Tool.CLAUDE_CODE, "long-horizon / scripted; terminal-native + permission modes"
    # PR / issue lifecycle -> Copilot.
    if any(k in t for k in ("pr", "pull request", "issue", "review", "github flow")):
        return Tool.COPILOT, "lives in the GitHub lifecycle; issue -> agent -> PR -> review"
    # Heavy multi-file authoring -> Cursor.
    if any(k in t for k in ("multi-file", "cross-file", "big feature", "large refactor", "codebase-wide")):
        return Tool.CURSOR, "heavy authoring; editor-native multi-file + codebase indexing"
    # Default: interactive editing leans editor-native.
    return Tool.CURSOR, "interactive authoring; editor-native default"


# ---------- Part 2: MCP server trust posture ----------

class Posture(Enum):
    READ_WRITE_AUTO = "read-write, auto-approve"
    READ_WRITE_GATED = "read-write, gated (HITL on writes)"
    READ_ONLY = "read-only"


@dataclass
class MCPServer:
    name: str
    can_write: bool            # exposes mutating tools
    reads_untrusted: bool      # reads attacker-controllable data (tickets, web, email)
    has_shell_or_secrets: bool # write reaches shell / credentials / prod


def mcp_posture(s: MCPServer) -> tuple[Posture, str]:
    # Rule: capability granted = capability granted to whoever writes the data.
    # Untrusted-data + write is the indirect-injection vector (P18.15).
    if not s.can_write:
        return Posture.READ_ONLY, "no mutating tools; safe to wire broadly"
    if s.reads_untrusted and s.has_shell_or_secrets:
        return Posture.READ_ONLY, (
            "writes reach shell/secrets AND it reads untrusted text -> "
            "demote to read-only or split the write half out")
    if s.reads_untrusted or s.has_shell_or_secrets:
        return Posture.READ_WRITE_GATED, "writes must gate through HITL (permission ladder)"
    return Posture.READ_WRITE_AUTO, "writes are low-blast-radius and inputs are trusted"


# ---------- Driver ----------

def main() -> None:
    print("=" * 78)
    print("PART 1 — tool fit: where the work lives picks the tool")
    print("=" * 78)
    tasks = [
        "overnight migration of the auth module in CI",
        "fix the issue, open a PR, get it reviewed",
        "big multi-file feature with lots of cross-file edits",
        "tweak one function while exploring the code",
    ]
    for task in tasks:
        tool, why = select_tool(task)
        print(f"  - {task}")
        print(f"      -> {tool.value:<16} ({why})")

    print()
    print("=" * 78)
    print("PART 2 — MCP trust: capability granted = capability granted to")
    print("         whoever can write the data the server reads")
    print("=" * 78)
    servers = [
        MCPServer("docs-catalog (read-only)", can_write=False,
                  reads_untrusted=False, has_shell_or_secrets=False),
        MCPServer("jira-readonly", can_write=False,
                  reads_untrusted=True, has_shell_or_secrets=False),
        MCPServer("jira-write + shell runner", can_write=True,
                  reads_untrusted=True, has_shell_or_secrets=True),
        MCPServer("internal-feature-flags (trusted, write)", can_write=True,
                  reads_untrusted=False, has_shell_or_secrets=False),
    ]
    for s in servers:
        posture, why = mcp_posture(s)
        print(f"  - {s.name}")
        print(f"      -> {posture.value:<28} ({why})")

    print()
    print("-" * 78)
    print("HEADLINE: the tools converged on one loop + MCP + the same models, so")
    print("pick by WHERE you live, wire the same servers in, and remember an MCP")
    print("server's write capability is handed to anyone who writes its inputs.")


if __name__ == "__main__":
    main()
