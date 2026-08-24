# Prompt Library Governance: Versioning, Ownership, and Retirement (2026)

> A prompt is software. Teams that treat it as an informal note — pasted into a chat, tweaked by whoever is at the keyboard, never attributed to anyone — accumulate the same class of debt as teams that never version their config files. In 2026 the stakes are higher: a single shared system prompt may gate a customer-facing workflow used by dozens of engineers and thousands of users. The governance gap is real: organisations without a defined prompt registry are far more exposed to silent regressions after model upgrades than those with one. This lesson frames prompts as reusable patterns — artefacts with an owner, a version, an evaluation example, and a retirement rule — and gives you the mechanics to govern them at team scale.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 01 (Prompt engineering), Phase 13 · 22 (Skills and agent SDKs)
**Time:** ~45 minutes

## Learning Objectives

- Explain the production problem addressed by Prompt Library Governance: Versioning, Ownership, and Retirement (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## The Problem

Most teams reach for prompt sharing in one of two broken ways. The first is ad-hoc copying: the analyst who wrote a good extraction prompt pastes it into Slack, others copy it, and within a month five slightly different versions are in production with no record of which one was tested. The second is over-engineering: a shared Git repo with no review process, no evaluation harness, and no one responsible for prompts that break when the model upgrades. Both failures surface the same way — a model upgrade, a change in the underlying data, or a new team member's edit silently degrades output quality and no one notices until a customer complains.

The engineering question for 2026 is operational: how do you manage a corpus of prompts the way you manage a library of functions? What is the minimum governance surface that prevents silent regression without creating a bureaucratic bottleneck? The answer has four moving parts: ownership, versioning, an evaluation anchor (a canonical input/output pair that any new version must beat), and a retirement rule so dead prompts do not silently outlive their context.

## The Concept

### The four governance primitives

Every reusable prompt needs exactly four attributes to be governable. Nothing more is required to start; nothing less survives contact with a model upgrade.

| Attribute | What it captures | Why it fails without it |
|---|---|---|
| **Owner** | A named individual or team account | No owner → prompts are "everyone's problem", meaning no one's |
| **Version** | A semver string tied to a specific text snapshot | No version → you cannot diff, bisect, or roll back a regression |
| **Evaluation anchor** | One canonical (input, expected-output) pair that new versions must pass | No anchor → "this prompt is better" is untestable opinion |
| **Retirement rule** | A condition (model sunset, accuracy threshold, date) that triggers archival | No retirement rule → stale prompts accumulate and confuse new users |

These map onto how good configuration and library management already works. Owners are like CODEOWNERS. Versions follow semver conventions the team already uses for code. Evaluation anchors are the unit-test analogue. Retirement rules are end-of-life (EOL) policies the same way a library dependency has a support horizon.

### Lifecycle states

A prompt in a governed registry moves through predictable states. Treating these as explicit, machine-checkable states — not informal tags in a spreadsheet — is what makes governance automatable.

```
DRAFT -> REVIEW -> STABLE -> DEPRECATED -> RETIRED
                   ^
                   |
              (new version bumps back to REVIEW)
```

| State | Meaning | Who can advance it |
|---|---|---|
| `DRAFT` | Author is iterating; not for production use | Owner |
| `REVIEW` | Owner has submitted for evaluation; anchor test must pass | Reviewer (not owner) |
| `STABLE` | Passed evaluation; approved for production | Reviewer |
| `DEPRECATED` | Replacement exists; still usable but flagged | Owner or automated policy |
| `RETIRED` | No longer valid; lookup returns tombstone with redirect | Automated by retirement rule |

This is the same state machine that package ecosystems use (`alpha`, `beta`, `stable`, `deprecated`, `end-of-life`). Modelling it explicitly prevents the common failure where a prompt is informally "deprecated" in a comment but still served to production callers.

### Versioning discipline

Prompt versioning follows semantic versioning adapted for the prompt domain:

- **Patch** (`1.0.0 -> 1.0.1`): Typo fix, whitespace, formatting that does not change model behavior on the anchor test.
- **Minor** (`1.0.0 -> 1.1.0`): Additive change — new examples, clearer instruction — that improves performance without changing the prompt's contract (same task, same output format).
- **Major** (`1.0.0 -> 2.0.0`): The task, output schema, or required model capability changes. Callers must opt in. A major version bump is the trigger for a fresh evaluation anchor.

The key discipline: **never edit a prompt in place under an existing version.** Treat the (id, version) pair as immutable once it leaves DRAFT. This is the same invariant as published package releases.

### Evaluation anchors and the regression gate

An evaluation anchor is the minimum viable test suite for a prompt: at least one (input, expected-output) pair that exercises the prompt's core claim. It is not exhaustive — exhaustive prompt evaluation belongs in Phase 11 · 01's deeper treatment — but it is the gate that every new version must clear before moving to REVIEW.

In 2026 teams run three types of anchors:

1. **Exact match**: output equals a reference string (works for structured extraction, classification).
2. **Structural match**: output matches a schema (JSON schema validation, regex).
3. **LLM-as-judge**: a secondary model scores the output against a rubric. Current practice uses Claude Sonnet 4.x as the judge model because in our experience it scores a typical 200-word anchor output in roughly one to two seconds — typically an order of magnitude faster than pulling in a human reviewer for every registry change — and its judgment correlates well with human raters on short-form tasks (see Phase 11 · 01 for caveats on self-evaluation).

The anchor should be stored alongside the prompt text in the registry, not in a separate test suite that can drift. When the model upgrades — from claude-sonnet-4-5 to claude-sonnet-4-6, for example — re-running all anchors across the STABLE corpus is the regression check. This is where the registry pays back its maintenance cost.

### Ownership and review

The CODEOWNERS analogy is direct: every prompt record has an `owner` field, and no version can advance from REVIEW to STABLE without a reviewer who is not the owner signing off. This is a minimal social control that prevents the failure mode where the person who wrote a prompt also approves its own production promotion.

At team scale (20+ prompts), ownership tends to migrate naturally toward functional teams rather than individuals. A prompt for extracting contract clauses is owned by the legal-automation team; a prompt for summarising customer support tickets is owned by the CX-automation team. The registry should support both individual and team ownership, and the retirement rule should include a "no active owner" trigger so prompts do not become ownerless forever when someone leaves.

### Retirement rules

A retirement rule is a machine-checkable condition. Examples:

- `model_sunset`: retire when the model in the `target_model` field is no longer available in the API (Anthropic publishes model deprecation timelines at least six months in advance).
- `accuracy_floor`: retire if the anchor score drops below a threshold on the current production model (useful when the prompt was tuned to a specific model version and has not been updated).
- `date_sunset`: retire on a calendar date (for time-bounded campaigns, pilot programmes, seasonal workflows).
- `replacement_stable`: retire once a named successor prompt reaches STABLE (enforces explicit supersession).

Retirement does not delete — it tombstones. The record stays in the registry with a redirect to the replacement so callers get a deprecation warning rather than a silent 404.

### Cross-lesson connections

The prompt registry pattern connects to several other lessons in this track:

- **Phase 11 · 01 (Prompt engineering)**: the craft of writing the prompt text itself. This lesson assumes you can write good prompts; it governs them once you have them.
- **Phase 13 · 22 (Skills and agent SDKs)**: skills in agent frameworks are executable prompts. The same four governance primitives — owner, version, anchor, retirement rule — apply to agent skill definitions, and the registry model scales directly to a skill library. A prompt registry is the static-asset precursor to a skill registry.

### Tooling landscape in 2026

Purpose-built prompt registries are still an emerging category. In 2026 the common patterns are:

| Pattern | When it fits | Limitation |
|---|---|---|
| Git repo + PR-based promotion | Teams already in a GitHub/GitLab flow; free; familiar | No structured metadata, no anchor runner out of the box |
| LangSmith prompt hub | Teams already on LangChain/LangSmith; integrated with their tracing | Vendor lock-in; weak retirement support |
| Promptfoo registry mode | Open-source; strong anchor/eval runner; CLI-first | Less UI; no ownership model built in |
| Internal registry (this lesson's model) | Full control; integrates with any model provider; auditable | You build it |

The model in `code/main.py` implements the internal registry pattern because it makes every policy decision explicit and runnable, not hidden behind a vendor's UI.



## Further Reading

- [Anthropic — Model deprecations and migration](https://docs.claude.com/en/api/versioning) — official model lifecycle and deprecation timeline policy; the source of truth for `model_sunset` retirement rules.
- [Promptfoo documentation](https://promptfoo.dev/docs/intro) — open-source prompt evaluation framework; strong anchor-runner and regression-testing tooling.
- [Semantic Versioning specification](https://semver.org/) — the versioning contract this lesson adapts for the prompt domain.
- [LangSmith prompt hub](https://docs.smith.langchain.com/prompt-hub) — one commercial implementation of a prompt registry; useful as a comparison point for your internal design.
- [NIST AI RMF 1.0](https://airc.nist.gov/) — the risk-management framework that underpins governance requirements in regulated industries; prompt governance is an application of its GOVERN and MANAGE functions.
