# Analyzing Legacy Code with AI: The Refactoring Slice Framework (2026)

> In 2026, large language models can read a 10,000-line legacy module and produce a dependency graph, a risk-ranked change list, and a first draft of the replacement — inside a single context window. That capability is real and widely deployed, but it accounts for fewer than half of the teams that attempt AI-assisted modernization. The other half stall not because the model is wrong, but because the humans around it have no framework for deciding which slice to cut first, how large a slice to take, and what "done" means before the next slice starts. The failure is operational, not technical. This lesson establishes the slice-based analysis workflow that the rest of this course builds on: from the first LLM-generated code audit (this lesson) through safe refactor execution (Phase 14, Lessons 38–39) and production controls (Phase 17, Lessons 20 and 25).

**Type:** Learn
**Languages:** Python (stdlib — legacy code scorer + slice prioritizer)
**Prerequisites:** Phase 11 · 01 (Prompt engineering), Phase 14 · 38 (Verification gates)
**Time:** ~45 minutes

## The Problem

The standard AI modernization pitch is seductive: paste in the legacy module, ask the model to rewrite it, ship the result. In practice this fails in two predictable ways. First, the model's rewrite is structurally correct but semantically wrong — it passes the tests that exist, not the tests that *should* exist, because the legacy code's implicit contracts (undocumented edge cases, data shape assumptions, caller expectations) were never made explicit before the rewrite began. Second, even when the rewrite is sound, the resulting PR is 2,000 lines across 40 files with no clear review path, so it either sits unreviewed or gets rubber-stamped. In both cases the root cause is identical: the rewrite was treated as a single atomic operation rather than a sequenced series of bounded, verifiable slices.

The engineering question for a consulting team is not "can the model rewrite this?" It is: what are the correct slice boundaries, in what order do we cut them, and what is the verification gate each slice must pass before we cut the next? That is a design decision requiring human judgment. The model's job is to analyze the codebase and surface the information needed to make that decision well — coupling metrics, change-frequency data, test coverage gaps, security smells — not to make the decision itself.

## The Concept

### The four-pass audit protocol

Asking a model to "analyze this legacy code" produces a broad, generic list. Asking it to perform four focused passes, in sequence, produces actionable structure. The passes are:

| Pass | Prompt focus | Model output | Human decision |
|---|---|---|---|
| **1. Structure** | "Map the module's public API, internal dependencies, and all call sites in the repo" | Dependency graph; entry/exit points; dead code candidates | Which parts are truly encapsulated vs. entangled |
| **2. Risk** | "Identify security smells, hardcoded secrets, SQL/shell injection surfaces, and deprecated dependency versions" | Ordered risk list with evidence | Which risks are blockers vs. acceptable technical debt |
| **3. Coverage** | "Enumerate every code path. For each, state whether it has a test that exercises it, and what the input space is" | Coverage gap map | Which gaps must be closed before any refactoring begins |
| **4. Slice candidates** | "Given the structure, risk, and coverage map, propose 5–8 bounded slices ordered by: (a) highest risk, (b) lowest coupling, (c) has or can get tests" | Ranked slice list with rationale | Final slice order and go/no-go on each |

Each pass should reference the output of the previous one. Pass 4 without Pass 3 is the failure mode: you cannot confidently assert a slice is "done" if you do not know which paths were tested before and after.

### Scoring a legacy module before you slice it

Before any rewrite, assign each candidate module a readiness score. This is not about whether the code is bad — all legacy code is bad, that is why you are here. It is about whether you have enough information and test coverage to cut a safe slice.

| Dimension | Red (score 0) | Amber (score 1) | Green (score 2) |
|---|---|---|---|
| **Coupling** | Module has >5 callers in other bounded contexts | 2–5 callers, interfaces exist | Single owner, clear interface |
| **Test coverage** | <40% branch coverage; no integration test | 40–70%; some happy-path integration tests | >70%; integration test covers failure paths |
| **Secret/config hygiene** | Hardcoded secrets, env vars read mid-call | Config centralized but unvalidated | Config injected at boundary, validated at startup |
| **Dependency age** | Direct dependency with known CVE | No CVE but end-of-life | All dependencies on supported versions |
| **Change frequency** | >3 commits per week in past 6 months | 1–3 per week | Stable (<1 per week) or frozen |

A module scoring 0–4 needs stabilization work (tests, secret extraction) before it is a safe modernization target. A module scoring 5–7 can proceed with caution — explicitly close the amber gaps before cutting the slice. A module scoring 8–10 is the right place to start; early wins here build team confidence and prove the workflow before you tackle the harder cases.

This scoring approach is deliberately low-tech. The point is to make the readiness assessment explicit and auditable, not to automate it away.

### Slice sizing and the review obligation

A slice should be the largest change whose full diff a senior engineer can review in under 30 minutes and whose test delta is fully explainable. In practice this is usually one module boundary, one dependency upgrade, or one security pattern applied consistently — not all three. Phase 14 · 38 (Verification gates) operationalizes the review step; the constraint here is upstream: slices that exceed this bound should be split, not force-merged under deadline pressure.

The model is useful for sizing. Ask it: "If I cut this slice, how many lines change, how many call sites are affected, and what new tests are needed?" If any answer is "I'm not sure" or "it depends on callers I can't see," the slice is too large or the codebase context is incomplete.

### Using current models effectively

As of mid-2026, Claude Sonnet 4.x and Claude Opus 4.x offer 1M-token context windows. This covers even large legacy codebases in a single pass. Practical constraints:

- **Context construction matters more than model choice.** Feed the model the actual source files, not a prose description. Include the test files alongside the source. A 1M-token window filled with the right code typically yields materially better analysis than a 128k window filled with prose summaries — in our experience, the gap is large enough that swapping models is rarely worth the effort if the context is poor.
- **Use structured output for the audit.** Ask for JSON or a defined markdown table; free-form prose analysis is harder to feed into Phase 14 · 38's gate-check format.
- **Reproduce the audit before acting on it.** Run the same four-pass protocol twice (temperature 0) with the same files. If the slice candidates differ materially, the codebase is underspecified — fill the gaps before you cut.

Cross-link: the reviewer agent in Phase 14 · 39 can consume the structured slice proposal output from Pass 4 directly, using it as a task specification. Design the Pass 4 output format with that handoff in mind.

### What the model cannot substitute for

The four-pass protocol surfaces information; it does not replace the following human decisions:

1. **Business context.** The model does not know that Module X is the billing path and must be frozen until Q4.
2. **Organizational risk appetite.** Two teams with identical codebases can have legitimately different answers to "how large is a safe slice?"
3. **Domain contracts.** Undocumented business rules embedded in legacy code are the hardest extraction problem. The model can flag "this branch is taken only when the input is negative" but cannot tell you whether that branch represents intentional behavior or a latent bug — only a domain expert can.

The slice framework is a structured way to surface these decisions early, make them explicit, and record them so the reviewer agent in Phase 14 · 39 has the right context.



## Further Reading

- [Martin Fowler — Refactoring (official site)](https://refactoring.com/) — the canonical reference on bounded change, test-first refactoring, and safe transformation patterns. The slice framework is an LLM-assisted implementation of these principles.
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — the risk pass in the four-pass audit should explicitly map findings to OWASP categories; this is the authoritative list.
- [Google Engineering Practices — Code Review guidelines](https://google.github.io/eng-practices/review/) — the review obligation that sizes slices; "reviewable in 30 minutes" is an operationalization of these guidelines.
- [Anthropic — Claude model documentation](https://docs.claude.com/en/docs/about-claude/models) — current model capabilities, context window sizes, and structured output support for the four-pass audit.
- [NIST SP 800-218 (Secure Software Development Framework)](https://csrc.nist.gov/publications/detail/sp/800-218/final) — the security-smells pass maps to SSDF practices PW.1 and PW.4; useful when the modernization scope includes a compliance mandate.
