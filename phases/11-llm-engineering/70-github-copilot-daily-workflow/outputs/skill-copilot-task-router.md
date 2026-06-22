# Skill: Copilot Task Router

A one-page decision aid. Paste your task, walk the three questions, get the
Copilot surface + the context to pin + the verification gate to apply.

## 1. Which rung? (ambiguity sets the rung — climb only as far as needed)

| If the task is… | Use | Blast radius |
|---|---|---|
| One line / one hunk, you know the answer | **Completion (ghost text)** | The line you accept |
| "Explain / why / how" — understanding, not editing | **Copilot Chat** (read-default) | None until you apply edits |
| A coordinated change over a few *named* files | **Edits (multi-file)** | The pinned set |
| Multi-file + needs to run tests and iterate | **Agent mode** | The working tree |
| Delegable end-to-end, no human at the keyboard | **Coding agent** (issue → draft PR) | A branch + PR |

Rule: do not use agent mode for a null-check, and do not use completion for a
9-file migration.

## 2. What context must I pin?

- **Tabs / selection** — open the files that matter, select the relevant block. Highest signal, cheapest.
- **`#`-references** — `#file`, `#selection`, `#codebase`, `#changes` (working diff), `#terminalLastCommand` (paste the failing test in with this).
- **`.github/copilot-instructions.md`** — repo rules read on every request. If it doesn't exist, write it before blaming the model.
- **MCP servers** — wire Jira / internal-docs MCP so agent mode reads tickets and the service catalog directly. (Risk: it now reads attacker-controllable text — treat ticket bodies as untrusted; see indirect prompt injection.)

## 3. What is the verification gate? (do not skip)

Before any diff above completion lands:

- [ ] **Read the diff**, file by file. Green tests are necessary, not sufficient.
- [ ] If tests were touched, confirm assertions got *stronger* or stayed equal — never weakened to pass.
- [ ] Scan for inline secrets / credentials.
- [ ] Run the tests yourself; don't trust the agent's "green" report blindly.
- [ ] You — a human — own the merge. Copilot code review is a first-pass reviewer, not an approver.

## Tool choice (where you live, not which is "best")

- **GitHub Copilot** — deepest GitHub flow (issue → coding agent → PR → review).
- **Cursor** — assistant-first editor; strongest composer + codebase indexing.
- **Claude Code** — terminal-native, permission modes + routines; best for unattended / scripted runs.

Lock-in is low. The transferable skill is the ladder + the gate, not the vendor.
