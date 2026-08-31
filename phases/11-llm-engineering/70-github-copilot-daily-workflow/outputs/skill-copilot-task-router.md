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

## Project transfer: issue-to-PR evidence pack

Use this with one anonymized ticket from the current project. If project data
cannot leave its approved environment, use the lesson's booking-synchronization
fallback. Never paste credentials, personal data, production identifiers,
restricted source, or proprietary logs into an unapproved assistant.

### A. Bounded task brief

- **Ticket / goal:**
- **Why this change is needed:**
- **Allowed files:**
- **Forbidden changes:**
- **Acceptance checks:**
- **Data classification:** public / sanitized internal
- **Predicted Copilot rung:**
- **Why this rung fits the ambiguity and blast radius:**

Before editing, run `python3 main.py` and compare this brief with the generated
`build_copilot_brief()` contract. A missing allowed-file list or observable
acceptance check is a stop condition, not a prompt-writing inconvenience.

### B. Repository-context packet

- **Instructions used:** `.github/copilot-instructions.md`, `AGENTS.md`, or equivalent
- **Files deliberately opened/pinned:**
- **Ticket details included after sanitization:**
- **Context deliberately excluded and why:**
- **MCP sources used, permission level, and trust boundary:**

### C. Annotated diff review

For every changed file, record:

| File | Why each change is in scope | Correctness/security/privacy finding | Test impact |
|---|---|---|---|
| `<relative path>` |  |  | stronger / equivalent / weaker |

Any unrelated cleanup, secret literal, weakened assertion, unexpected file, or
unexplained public-interface change blocks the handoff until resolved.

### D. Verification receipt

- **Commands run:**
- **Observed result:**
- **Deliberate failure or boundary case:**
- **Expected vs observed behavior:**
- **Residual risk not covered by the checks:**

Keep raw command output or a stable link beside the interpretation. “Copilot
said tests pass” is not evidence.

### E. Pull-request handoff

- **Intent and linked ticket:**
- **What changed and why:**
- **Verification evidence:**
- **Known limitations / rollback:**
- **Human reviewer and merge owner:**
- **Decision:** merge / request changes / block

The evidence pack is complete only when another engineer can reproduce the
verification and the named human owner has read the diff.
