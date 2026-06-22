# Source-Grounded AI Documentation: From Draft to Deliverable (2026)

> A 2025 Gartner survey found that 61 % of teams using AI for documentation reported at least one incident where an AI-generated document cited a requirement, API endpoint, or architectural decision that no longer existed in the codebase. The failure mode is not that the model fabricates — it is that documentation and source drift apart silently, and no one is accountable for the gap. By 2026 the craft is well-defined: source-grounded documentation anchors every substantive claim to a retrievable artifact (code, ADR, ticket, schema), structures handoff material so the next engineer or auditor can verify rather than trust, and treats AI as a drafter that accelerates extraction, not as an authority that replaces source review. The models that do this work best — Claude Sonnet 4.x, GPT-4.1, Gemini 2.5 Pro — are capable enough that the quality ceiling is now the quality of the context you feed them, not the model itself.

**Type:** Learn
**Languages:** Python (stdlib — source-claim matcher + documentation health scorer)
**Prerequisites:** Phase 11 · 05 (Context engineering), Phase 13 · 10 (MCP resources and prompts)
**Time:** ~45 minutes

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

## Use It

`code/main.py` models the core decision this lesson is about: source-claim matching and documentation health scoring. It defines a small set of documentation claims (strings asserting facts about a system), a set of source artifacts (files/tickets with content), and a deterministic matcher that tags each claim as `GROUNDED`, `INFERRED`, or `UNRESOLVED`. It then scores the document by type, applying the grounding thresholds from the table above, and prints a health report ending in a `HEADLINE:` verdict.

## Ship It

`outputs/skill-doc-grounding-checklist.md` is a one-page, paste-and-use decision aid for a consultant or engineer who is about to generate or review AI-assisted documentation. It operationalizes the grounding thresholds, the prompt template, and the accountability rules into a scannable checklist with hard reject criteria.

## Exercises

1. Run `code/main.py`. Which document type in the sample set fails the grounding threshold, and why? Change one `UNRESOLVED` claim to `GROUNDED` by adding a matching artifact entry — what is the minimum information a source artifact must contain to resolve a claim?

2. Run `code/main.py` again with the default inputs. The `INFERRED` claims pass the scorer but are flagged. Write one sentence for each flagged inference that a human reviewer should verify before publication. What artifact would resolve each one?

3. Take a piece of documentation from your own work (a runbook, an ADR, a README section). Mark every substantive claim with `[SOURCE: ?]` or `[INFERRED]`. What percentage of claims are unresolvable without going to source? What does that number tell you about the document's reliability?

4. Write a documentation prompt template for an ADR about a technology decision your team made recently. Identify three artifacts you would need to retrieve (via MCP or manually) before the model should write a single sentence. What would the prompt's "claim constraints" section say?

5. The CI-integrated doc generation pattern from the Concept section fails a build when a claim cannot be grounded. Design the failure message: what information does the engineer need to resolve the failure? How would you distinguish a "missing source" failure from a "stale source" failure?

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Source-grounded documentation | "Cited docs" | Every substantive claim traces to a retrievable, current artifact — not a recalled fact or training-data synthesis |
| `[SOURCE:]` tag | "Citation" | A retrieval instruction: `[SOURCE: <artifact-id>]` tells a reviewer exactly what to open to verify the claim |
| `[INFERRED]` label | "AI guess" | A claim the model derived from context without an explicit artifact — valid if flagged, dangerous if unmarked |
| Architecture Decision Record (ADR) | "ADR" | A structured record of a consequential technical decision, its context, and the alternatives considered — only as reliable as its sources |
| Documentation drift | "Docs are out of date" | The state where a document's claims no longer match the system they describe; invisible until it causes a failure |
| Context engineering | "Prompt with context" | The discipline of retrieving and structuring source artifacts before model inference — covered in Phase 11 · 05 |
| MCP resource server | "Docs plugin" | A server exposing documentation sources (Confluence, GitHub, Jira) as retrievable resources for model context — covered in Phase 13 · 10 |
| CI-integrated doc generation | "Docs in CI" | A pipeline step that generates or validates documentation from current build artifacts, failing if claims cannot be grounded |

## Consultant field notes

Named patterns from documentation engagements that look fine on paper and hurt in the meeting after.

- **The use case everyone approved but nobody wanted.** The steering committee green-lit the AI doc assistant because the demo was clean and the procurement window was closing. Six months in, the engineers who would have to maintain it never wrote the prompt template, the source inventory stalled at three artifacts, and the team quietly reverted to hand-written Confluence pages. Lesson: a documentation tool without an internal champion and a maintained source inventory is a license, not a workflow.
- **The RAG that returned the right doc but the wrong paragraph.** The retrieval was scoring on chunk similarity, not on the question the user actually asked, so the model answered authoritatively from a tangentially related section while the truly relevant paragraph sat three results down. Lesson: ground retrieval to the claim level, not the document level — the unit of correctness is the passage, not the file.
- **The prompt that worked in the demo but failed in production.** The demo source was a tidy three-file sample repo; the production repo had eight years of migrations, renamed modules, and deprecated endpoints in the same paths. The model's grounding discipline held against the clean artifacts and silently substituted training-data recall against the messy ones — with no signal in the output that the source had been abandoned. Lesson: source-grounding must be tested against the actual mess, not the curated subset.
- **The AI feature that hit a cost ceiling in month two.** The first invoice arrived and the project economics inverted: every regeneration of a "live" doc section called the frontier model with a full repository context window, and the monthly bill was on track to exceed the cost of the human author it was supposed to replace. Lesson: cost per grounded claim is the right unit, not cost per generation — and it has to be modeled before the pilot, not after.
- **The handoff document that nobody opened until the audit.** The transition doc was generated, merged, linked from the wiki sidebar, and forgotten. The incoming team asked the same questions the outgoing team had answered in it; the auditor asked a different set and found every claim stale. Lesson: a handoff doc that is not consulted within the first two weeks of the engagement is not a handoff doc — it is a liability with a creation date.

## Further Reading

- [Diátaxis documentation framework](https://diataxis.fr/) — the canonical framework for documentation types (tutorials, how-to guides, reference, explanation); source grounding requirements differ by type.
- [Architecture Decision Records (ADR) — adr.github.io](https://adr.github.io/) — the reference for ADR formats (MADR, Nygard, Planguage), tooling, and best practices.
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) — the authoritative source for machine-readable API documentation; the baseline for any API doc grounding workflow.
- [Model Context Protocol — MCP Resources](https://modelcontextprotocol.io/docs/concepts/resources) — how MCP servers expose retrievable artifacts to models; the plumbing for automated source injection.
- [Anthropic — Claude model documentation](https://docs.claude.com/en/docs/about-claude/models/overview) — current model capabilities and context window sizes; use this, not training-data recall, for model selection.
