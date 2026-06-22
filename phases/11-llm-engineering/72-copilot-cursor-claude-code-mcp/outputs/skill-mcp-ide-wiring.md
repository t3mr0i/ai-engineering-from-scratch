# Skill: MCP-in-IDE Wiring Guide

The tools converged on one loop, the same models, and the same MCP plumbing.
Invest in the plumbing and the discipline, not the brand.

## The four-question decision (steps 2–4 are tool-independent)

1. **Where does the work live?** → picks the tool
   - GitHub lifecycle (issue → PR → review) → **Copilot**
   - Heavy multi-file authoring / codebase indexing → **Cursor**
   - Long-horizon / unattended / scripted in CI → **Claude Code**
2. **What context must the assistant reach?** → picks the MCP servers (same set, any tool)
3. **What's the blast radius?** → picks the permission rung (see Lesson 70 ladder)
4. **What's the verification gate?** → unchanged across tools: read the diff, run the tests, you own the merge

## MCP server trust checklist (run before wiring any server)

The rule: **the capability you grant a server = the capability you grant whoever
can write the data it reads.** A ticket body is attacker-controllable text the
instant an agent reads it (indirect prompt injection — not fully patchable).

| Server profile | Safe posture |
|---|---|
| No mutating tools (read-only) | Wire broadly — safe |
| Reads untrusted data, no write | Read-only — fine |
| Writes, but inputs trusted + low blast radius | Read-write, auto-approve |
| Writes + (reads untrusted **or** reaches shell/secrets) | Read-write, **gated** (HITL on writes) |
| Writes that reach shell/secrets **and** reads untrusted text | **Demote to read-only** or split the write half out |

For each server you add, write down: read-only vs write-capable, and the
attacker-controllable data (if any) it exposes the agent to.

## Don't standardize the org on one tool

Lock-in is low and the loop is shared, so a global mandate trades real
per-task ergonomic wins for uniformity you don't need. Standardize the
*plumbing* (MCP servers, instruction files, the verification gate) instead —
that's what's portable.
