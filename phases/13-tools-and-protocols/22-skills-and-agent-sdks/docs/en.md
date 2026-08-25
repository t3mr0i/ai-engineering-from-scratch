# Skills and Agent SDKs — Anthropic Skills, AGENTS.md, OpenAI Apps SDK

> MCP says "what tools exist." Skills say "how to do a task." The 2026 stack layers both. Anthropic's Agent Skills (open standard, December 2025) ship as SKILL.md with progressive disclosure. OpenAI's Apps SDK is MCP plus widget metadata. AGENTS.md (now in 60,000+ repos) sits at the repo root as project-level agent context. This lesson names what each covers and builds a minimal SKILL.md + AGENTS.md bundle that travels across agents.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server)
**Time:** ~45 minutes

## Learning Objectives

- Distinguish the three layers: AGENTS.md (project context), SKILL.md (reusable know-how), MCP (tools).
- Write a SKILL.md with YAML frontmatter and progressive disclosure.
- Load skills filesystem-style into an agent runtime.
- Compose a skill with an MCP server and an AGENTS.md so one package works in Claude Code, Cursor, and Codex.

## The Problem

An engineer distills a release-notes-writing workflow into a multi-step prompt: "Read the latest merged PRs. Group by area. Summarize each. Write a changelog entry following the team's style. Post to Slack draft." They put it in a Notion doc for their team.

Now they want to use this workflow from Claude Code, Cursor, and Codex CLI. Each agent has a different way to load instructions: Claude Code slash-commands, Cursor rules, Codex `.codex.md`. The engineer copies the workflow three times and maintains three copies.

AGENTS.md and SKILL.md together fix this:

- **AGENTS.md** sits at the repo root. Every compatible agent reads it on session start. "How does this project work? What are the conventions? Which commands run tests?"
- **SKILL.md** is a portable bundle: YAML frontmatter (name, description) + markdown body + optional resources. Agents that support skills load them by name on demand.
- **MCP** (Phase 13 · 06-14) handles the tools the skill needs to invoke.

Three layers, one portable artifact.

## The Concept

### AGENTS.md (agents.md)

Launched late 2025, adopted by 60,000+ repos by April 2026. One file at repo root. Format:

```markdown
# Project: my-service

## Conventions
- TypeScript with strict mode.
- Use Pydantic for models on the Python side.
- Tests run with `pnpm test`.

## Build and run
- `pnpm dev` for local dev server.
- `pnpm build` for production bundle.
```

Agents read this on session start and use it to calibrate their behavior for that project. Every coding agent in 2026 supports AGENTS.md: Claude Code, Cursor, Codex, Copilot Workspace, opencode, Windsurf, Zed.

### SKILL.md format

Anthropic's Agent Skills (released as an open standard December 2025):

```markdown
---
name: release-notes-writer
description: Write a changelog entry for the latest merged PRs following this project's style.
---

# Release notes writer

When invoked, run these steps:

1. List PRs merged since the last tag. Use `gh pr list --base main --state merged`.
2. Group by label: feature, fix, chore, docs.
3. For each PR in each group, write one line: `- <title> (#<num>)`.
4. Draft the release notes and stage them in CHANGELOG.md.

If the user says "ship", run `git tag vX.Y.Z` and `gh release create`.

## Notes

- Never include commits without a PR.
- Skip "chore" entries from the public changelog.
```

Frontmatter declares the skill's identity. The body is the prompt shown to the model when the skill loads.

### Progressive disclosure

Skills can reference sub-resources that the agent fetches only when needed. Example:

```
skills/
  release-notes-writer/
    SKILL.md
    style-guide.md
    template.md
    scripts/
      generate.sh
```

SKILL.md says "see style-guide.md for the style rules." The agent pulls style-guide.md only when the skill is actively running. This avoids bloating the prompt with detail the model may not need.

### Filesystem discovery

Agent runtimes scan known directories for SKILL.md files:

- `~/.anthropic/skills/*/SKILL.md`
- Project `./skills/*/SKILL.md`
- `~/.claude/skills/*/SKILL.md`

Loading is by folder name and frontmatter `name`. Claude Code, Anthropic Claude Agent SDK, and SkillKit (cross-agent) all follow this pattern.

### Anthropic Claude Agent SDK

`@anthropic-ai/claude-agent-sdk` (TypeScript) and `claude-agent-sdk` (Python) load skills at session start, expose them as callable "agents" inside the runtime. The agent loop dispatches to a skill when the user invokes it.

### OpenAI Apps SDK

Launched October 2025; built directly on MCP. Unifies OpenAI's prior Connectors and Custom GPT Actions under a single developer surface. An Apps SDK app is:

- An MCP server (tools, resources, prompts).
- Plus widget metadata for ChatGPT's UI.
- Plus an optional MCP Apps `ui://` resource for interactive surfaces.

Same protocol, richer UX.

### Cross-agent portability via SkillKit

Tools like SkillKit and similar cross-agent distribution layers translate a single SKILL.md into the native format of each of 32+ AI agents (Claude Code, Cursor, Codex, Gemini CLI, OpenCode, etc.). One source of truth; many consumers.

### The three-layer stack

| Layer | File | Loaded when | Purpose |
|-------|------|-------------|---------|
| AGENTS.md | repo root | session start | project-level conventions |
| SKILL.md | skills directory | skill invoked | reusable workflow |
| MCP server | external process | tools needed | callable actions |

All three compose: the agent reads AGENTS.md on session start, the user invokes a skill, the skill's instructions include MCP tool calls, the agent dispatches via an MCP client.



## Build It

Reconstruct **Skills and Agent SDKs — Anthropic Skills, AGENTS.md, OpenAI Apps SDK** by following `setup_fixtures` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `setup_fixtures` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-agent-bundle.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Anthropic — Agent Skills announcement](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) — October 2025 launch
- [Anthropic — Agent Skills docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) — SKILL.md format reference
- [OpenAI — Apps SDK](https://developers.openai.com/apps-sdk) — MCP-based developer platform for ChatGPT
- [agents.md](https://agents.md/) — AGENTS.md format and adoption list
- [Anthropic — anthropics/skills GitHub](https://github.com/anthropics/skills) — official skill examples

## Exercises

This lab follows `setup_fixtures` and `Skill` on a controlled fixture; write down the value before changing the input.

1. **Trace the canonical fixture.** From `code/`, run `python3 main.py` using the text "red fox". Follow `setup_fixtures`, `Skill`, `parse_frontmatter`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Distinguish the three layers: AGENTS.md (project context), SKILL.md (reusable know-how), MCP (tools).**.
2. **Change the controlled parameter.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Write a SKILL.md with YAML frontmatter and progressive disclosure.** says the other inputs should stay fixed.
3. **Exercise the guard.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Load skills filesystem-style into an agent runtime.** and record the exception text if the code rejects the case.
4. **Prepare the artifact for reuse.** Open `outputs/skill-agent-bundle.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Compose a skill with an MCP server and an AGENTS.md so one package works in Claude Code, Cursor, and Codex.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Skills and Agent SDKs — Anthropic Skills, AGENTS.md, OpenAI Apps SDK** should contain:

- the `python3 main.py` output for the text "red fox", with `setup_fixtures`, `Skill`, `parse_frontmatter` traced to the value or shape that supports **Distinguish the three layers: AGENTS.md (project context), SKILL.md (reusable know-how), MCP (tools).**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Write a SKILL.md with YAML frontmatter and progressive disclosure.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Load skills filesystem-style into an agent runtime.**; and
- an updated `outputs/skill-agent-bundle.md` example with a concrete input, expected output field, and acceptance check tied to **Compose a skill with an MCP server and an AGENTS.md so one package works in Claude Code, Cursor, and Codex.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
