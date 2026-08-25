# Source-Grounded AI Documentation: From Draft to Deliverable (2026)

> Teams using AI for documentation commonly report at least one incident where an AI-generated document cited a requirement, API endpoint, or architectural decision that no longer existed in the codebase. The failure mode is not that the model fabricates — it is that documentation and source drift apart silently, and no one is accountable for the gap. By 2026 the craft is well-defined: source-grounded documentation anchors every substantive claim to a retrievable artifact (code, ADR, ticket, schema), structures handoff material so the next engineer or auditor can verify rather than trust, and treats AI as a drafter that accelerates extraction, not as an authority that replaces source review. The models that do this work best — Claude Sonnet 4.x, GPT-4.1, Gemini 2.5 Pro — are capable enough that the quality ceiling is now the quality of the context you feed them, not the model itself.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 05 (Context engineering), Phase 13 · 10 (MCP resources and prompts)
**Time:** ~90 minutes

## Learning Objectives

- Explain the production problem addressed by Source-Grounded AI Documentation: From Draft to Deliverable (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## The Problem

Most teams discover the documentation problem at the worst possible moment: during an incident, an audit, or a handoff. The on-call engineer reads the runbook, follows the step, and finds that the configuration parameter it references was renamed six months ago. The auditor reads the architecture decision record and asks for the meeting notes it cites — which no longer exist in Confluence. These are not "AI problems." They are source-tracking problems, and AI drafting makes them worse because the model is confident, the prose is fluent, and the drift is invisible until it causes harm.

The engineering question for 2026 is not whether AI should assist with documentation — the throughput gains are real and the alternative (under-documented systems) is worse — it is how to enforce source-grounding as a first-class constraint rather than a quality-check afterthought. Documentation that cannot be verified at the claim level is a liability dressed as an asset. The same principle that makes code reviews valuable — every non-trivial statement should trace to something checkable — applies to documentation, and AI drafting workflows that skip this step ship technical debt that, in our experience, takes roughly twice as long to detect and repair — because the prose masks the source gap until something breaks against it.

## The Concept

### The four documentation types and their grounding requirements

Different documentation types have different source obligations. Conflating them leads to either over-engineering (adding citation footnotes to a tutorial) or under-engineering (treating an architecture decision record like a blog post).

| Doc type | Canonical sources | Minimum grounding | Failure mode without it |
|---|---|---|---|
| **Architecture Decision Record (ADR)** | Meeting notes, Jira/GitHub issues, PR descriptions, benchmarks | Every decision must link to the artifact that motivated it | ADR cites a constraint that was resolved; teams relitigate decisions |
| **Runbook / Operations guide** | Current infra config, IaC (Bicep/Terraform), monitoring dashboards, incident history | Every step must reference a current, named resource | Steps reference renamed/deleted resources; incident response fails |
| **API / schema documentation** | Source code (OpenAPI spec, GraphQL schema, protobuf), integration tests | Every endpoint, field, and error code must be generated from or verified against the spec | Clients build against stale contracts; prod breaks |
| **Handoff / transition document** | Git history, open tickets, deployment state, known issues | Every "current state" claim must have a timestamp and a retrieval path | Incoming team acts on stale state; context loss compounds |

### The source-grounding discipline

Source-grounding is not citation for its own sake. It is a two-part discipline:

1. **At draft time:** the model is given the source artifacts as context — not asked to recall them from training. This is the core lesson from Phase 11 · 05: context engineering is retrieving the right artifacts (the current Terraform module, the open Jira tickets, the last three PR descriptions) and placing them in the model's window before it writes a single sentence. Phase 13 · 10 extends this: with MCP resource servers, the model can retrieve a live ADR from Confluence, a current schema from the codebase, or an incident timeline from PagerDuty without you pasting it manually.

2. **At review time:** every substantive claim in the draft is tagged with a `[SOURCE: <artifact-id>]` marker that a human reviewer can resolve against the actual artifact. Claims that cannot be tagged are either inferences (explicitly labeled as such) or hallucinations (excised).

The practical implementation is a **documentation prompt template** with three required sections before the model writes anything:

```
## Retrieved artifacts
<paste or inject via MCP: the source files, schema, ADR list, ticket backlog>

## Scope and claim constraints
- Only describe behavior present in the retrieved artifacts.
- Tag every API endpoint, config key, and operational step with [SOURCE: <file:line or ticket-id>].
- Mark any inference or design rationale as [INFERRED] and flag for human review.
- Do not synthesize information from training data; if the source is absent, say so.

## Document type and audience
<ADR | Runbook | API docs | Handoff>
<audience: new engineer | auditor | on-call | external integrator>
```

This template is not optional polish — it is the mechanism that keeps the model from substituting its training-data knowledge for the real sources.

### Handoff documentation: the specific case

Handoff documents (transition docs, "state of the project" docs, end-of-engagement summaries) are the highest-risk documentation type because they are written under time pressure and read under uncertainty. The incoming party has no independent way to verify claims; they will act on whatever the document says.

The structure that works, drawn from engineering team practices at companies that have systematized this:

1. **Canonical state snapshot** — current deployment state, last commit hash, outstanding tickets with links. Every item timestamped. Generated by tooling where possible, not hand-written.
2. **Decision log summary** — the three to five most consequential decisions made during the engagement, each with the link to the ADR or PR that documents it. Not a summary of all decisions; the ones with non-obvious tradeoffs.
3. **Known issues and workarounds** — every known issue with a link to the ticket and, critically, the current workaround if one exists. The workaround must reference the real artifact (the cron job, the feature flag, the manual step) not describe it in prose from memory.
4. **Open questions** — explicitly marked as unresolved. The incoming team should know what is known-unknown before they start.

Phase 14 · 40 (Multi-session handoff) covers the agent-loop variant of this problem: when Claude Code or a similar agent hands off context between sessions, it uses a structured memory file that follows this same discipline. The lesson here generalizes that pattern to human-authored documentation.

### AI models as documentation drafters in 2026

The current working tier for documentation work:

| Model | Practical role in documentation workflows | Notable limits |
|---|---|---|
| **Claude Sonnet 4.x** | Long-context extraction from large codebases, structured output (JSON/YAML frontmatter), ADR drafting from PR history | Hallucination rate rises if context window is sparse; model will fill gaps |
| **Claude Opus 4.x** | Deep reasoning tasks: inferring design rationale from commit diffs, synthesizing constraint sets from multi-source evidence | Slower and more expensive; reserve for high-value decisions |
| **GPT-4.1** | Strong at following rigid output schemas; good for template-constrained doc generation | Requires explicit source injection; training data bleed is real without constraints |
| **Gemini 2.5 Pro** | Very large context window; effective at scanning entire repos or large Confluence spaces | Quality of source attribution varies with prompt structure |

All four models share the same failure mode without source-grounding discipline: confident, fluent, wrong. The tooling changes (MCP servers for Confluence, GitHub, Jira, schema registries); the discipline does not.

### Tooling patterns for source injection

Three patterns, in order of engineering investment:

1. **Manual context assembly** — the author retrieves artifacts manually, pastes into the prompt, uses the template above. Appropriate for one-off ADRs. Does not scale.
2. **MCP resource server** — as covered in Phase 13 · 10, an MCP server exposes documentation sources (Confluence pages, GitHub files, Jira boards) as resources the model can retrieve at request time. The author writes a prompt that references resource URIs; the MCP client resolves them at inference time. Scales to team workflows with a one-time server setup cost.
3. **CI-integrated doc generation** — a CI step extracts the current OpenAPI spec, Terraform outputs, or test fixtures and feeds them into a doc-generation prompt that writes or validates a section of the docs. The CI step fails if the model cannot ground all claims. This is the pattern used by teams doing continuous documentation: the docs are as fresh as the last merge.

The maturity progression mirrors Phase 11 · 05's context engineering ladder: manual → orchestrated retrieval → automated pipeline. The documentation discipline stays constant across all three.

### Accountability and review obligations

Source-grounding solves the technical problem. The organizational problem is accountability: who owns the claim, not just which artifact it traces to.

Two rules that hold across doc types:

- **The author of a documentation section is accountable for every `[SOURCE:]` tag they approved, not just for the prose they wrote.** If a human reviewer confirms a `[SOURCE: infra/main.bicep:L44]` tag without opening the file, the drift risk is still present. The tag is a retrieval instruction, not a seal of correctness.
- **AI-generated text that has not been reviewed against its sources is a draft, not a document.** Merge gates and publication workflows should reflect this: a PR that contains AI-drafted documentation sections without a source-review checklist item is incomplete, the same way a PR without tests is incomplete.



## Build It

Reconstruct **Source-Grounded AI Documentation: From Draft to Deliverable (2026)** by following `GroundingStatus` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `GroundingStatus` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-doc-grounding-checklist.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Diátaxis documentation framework](https://diataxis.fr/) — the canonical framework for documentation types (tutorials, how-to guides, reference, explanation); source grounding requirements differ by type.
- [Architecture Decision Records (ADR) — adr.github.io](https://adr.github.io/) — the reference for ADR formats (MADR, Nygard, Planguage), tooling, and best practices.
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) — the authoritative source for machine-readable API documentation; the baseline for any API doc grounding workflow.
- [Model Context Protocol — MCP Resources](https://modelcontextprotocol.io/docs/concepts/resources) — how MCP servers expose retrievable artifacts to models; the plumbing for automated source injection.
- [Anthropic — Claude model documentation](https://docs.claude.com/en/docs/about-claude/models/overview) — current model capabilities and context window sizes; use this, not training-data recall, for model selection.

## Exercises

Make the experiment auditable. Save the input, output, and one sentence explaining how the result bears on the claim.

1. **Trace the happy path.** Run [main.py](../code/main.py) with `python3 main.py` from the lesson's `code/` directory. Record the smallest input that demonstrates “Explain the production problem addressed by Source-Grounded AI Documentation: From Draft to Deliverable (2026)”. Point to `match_claims()`, `score_document()`, `run_scenario()` and name the returned field or printed value that serves as evidence.
2. **Perturb the input.** Change exactly one input, threshold, or option that affects “Apply the lesson's decision or implementation workflow to a concrete case”. Predict the direction of the change before running it, then compare the two outputs and explain why the other fields should stay stable.
3. **Test a failure case.** Construct a case that stresses “Measure quality, cost, latency, and risk with explicit acceptance criteria”: choose an empty collection, missing field, maximum-sized value, malformed record, or another boundary that fits this lesson. Write the expected behavior first and distinguish an intentional guard from an accidental crash.
4. **Transfer the result.** Open outputs/skill-doc-grounding-checklist.md and adapt one example to a real workflow. State the owner, evidence, and next decision required for “Identify failure modes and define a safe rollback or review path”; mark any assumption that the demo does not establish.

## Reference Solution

A useful submission records python3 main.py, the observed output, and the conclusion drawn from it. It should contain:

- evidence for “Explain the production problem addressed by Source-Grounded AI Documentation: From Draft to Deliverable (2026)” with the relevant input and returned field;
- a one-variable comparison that makes “Apply the lesson's decision or implementation workflow to a concrete case” visible;
- a predicted and observed boundary result for “Measure quality, cost, latency, and risk with explicit acceptance criteria”, including why the behavior is safe; and
- one concrete update to outputs/skill-doc-grounding-checklist.md that applies “Identify failure modes and define a safe rollback or review path” without hiding uncertainty.

Use match_claims(), score_document(), run_scenario() to explain the result, not only the prose output. If the experiment disagrees with the prediction, keep the failed prediction in the receipt and revise the explanation rather than changing the input until it passes.
