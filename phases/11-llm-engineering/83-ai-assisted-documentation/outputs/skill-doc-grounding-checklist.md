---
name: doc-grounding-checklist
description: Pre-generation and pre-publication checklist for AI-assisted documentation. Enforces source-grounding thresholds by doc type and operationalizes accountability rules before a document reaches reviewers or users.
version: 1.0.0
phase: 11
lesson: 83
tags: [documentation, source-grounding, ADR, runbook, api-docs, handoff, ai-assisted]
---

Use this checklist before generating AI-assisted documentation and again before merging or publishing it. Work through each section top to bottom. A single hard-reject stops the workflow.

---

## Step 1 — Classify the document

Identify which type this document is. This determines the grounding threshold in Step 4.

| Type | Characteristics |
|---|---|
| **ADR** | Records a technical decision: context, options, decision, consequences |
| **Runbook** | Operational procedures: steps a human or automation executes during an incident |
| **API / schema docs** | Describes endpoints, fields, error codes — must match the live spec |
| **Handoff** | Transfer-of-knowledge: current state, open issues, outstanding decisions |

If the document spans more than one type, apply the **stricter** threshold.

---

## Step 2 — Assemble source artifacts before the model writes

Hard rejects — stop here if any apply:

- [ ] No source artifacts have been retrieved (model will use training data to fill gaps)
- [ ] Source artifacts are older than 30 days and the system has changed since then
- [ ] The document covers a resource (endpoint, config key, infra component) for which no artifact exists

Required artifacts by doc type:

**ADR**
- [ ] The ticket or discussion that raised the problem (Jira, GitHub issue, meeting notes)
- [ ] The PR or commit that resolved it, or the benchmark/test that motivated the choice
- [ ] Any prior ADR this decision supersedes or depends on

**Runbook**
- [ ] Current IaC or config files for every resource the runbook mentions (Bicep, Terraform, Helm values)
- [ ] Monitoring dashboard config or alert definition for any threshold cited
- [ ] Incident history entry if the runbook was written in response to a real incident

**API / schema docs**
- [ ] Current OpenAPI spec, GraphQL schema, protobuf definition, or equivalent
- [ ] Integration tests or contract tests that exercise the described behavior
- [ ] Changelog or migration guide if the API has versioned changes

**Handoff**
- [ ] Git HEAD commit hash and deployment timestamp
- [ ] Open ticket list with current status (exported from Jira/GitHub, not recalled)
- [ ] Link to each consequential ADR made during the engagement
- [ ] Each known workaround must reference the actual artifact (cron file, feature flag config)

---

## Step 3 — Use the source-grounding prompt template

Paste this header before your documentation prompt. Fill in the bracketed sections.

```
## Retrieved artifacts
[Paste or inject via MCP: the source files, schema exports, ADR content,
 ticket exports. Do not summarize — paste the raw artifact content.]

## Claim constraints
- Only describe behavior present in the retrieved artifacts above.
- Tag every API endpoint, config key, resource name, and operational step
  with [SOURCE: <artifact-id>] where artifact-id matches what you pasted above.
- Mark any claim derived by inference (not directly stated in an artifact)
  with [INFERRED] and do not present it as a confirmed fact.
- If a source artifact for a required claim is absent, write
  [MISSING SOURCE: <what is needed>] and stop; do not synthesize from training data.
- Do not use knowledge from your training data about this system; use only
  the artifacts provided above.

## Document type and audience
[ADR | Runbook | API docs | Handoff]
[Audience: new engineer | auditor | on-call | external integrator | leadership]

## Document request
[Your specific documentation request here]
```

---

## Step 4 — Verify grounding thresholds before review

After the model generates the draft, count the grounding status of every substantive claim.

| Doc type | Minimum grounded fraction | INFERRED claims | UNRESOLVED claims |
|---|---|---|---|
| ADR | 80% | Flagged for human review; do not count as grounded | Must be zero |
| Runbook | 90% | Flagged for human review; do not count as grounded | Must be zero |
| API / schema docs | 100% | Not permitted in reference sections | Must be zero |
| Handoff | 75% | Flagged for human review; do not count as grounded | Must be zero |

How to count:
- **GROUNDED**: claim has a `[SOURCE: <artifact-id>]` tag and the artifact exists in the retrieved set
- **INFERRED**: claim has an `[INFERRED]` label — valid only for rationale/design sections
- **UNRESOLVED**: claim has no tag and no `[INFERRED]` label, or has `[MISSING SOURCE: ...]`

If the document fails its threshold, return to Step 2. Do not send it for review.

---

## Step 5 — Human review obligations

The reviewer's job is not to read the prose. It is to verify the sources.

For each `[SOURCE: <artifact-id>]` tag:
- [ ] Open the artifact. Confirm the claim is supported by the artifact's current content.
- [ ] Confirm the artifact is current (check the file's last-modified date or commit timestamp).

For each `[INFERRED]` label:
- [ ] Determine whether the inference is reasonable given the retrieved artifacts.
- [ ] Either convert it to `[SOURCE: ...]` by finding the artifact, or label it explicitly as a design assumption in the final text.

A reviewer who marks a `[SOURCE:]` tag as reviewed without opening the artifact is accountable for that claim.

---

## Step 6 — Merge / publication gate

The following must be true before the document is merged, published, or distributed:

- [ ] Grounding threshold met for the doc type (Step 4)
- [ ] Zero UNRESOLVED claims remain
- [ ] Every INFERRED claim has been reviewed and either grounded or labeled as an explicit assumption
- [ ] Reviewer has signed off that they opened each source artifact, not just read the prose
- [ ] If the document references a resource that changes frequently (API, infra config), a review cadence is scheduled (quarterly at minimum for Runbooks and API docs)

Hard rejects — block publication if any apply:

- AI-generated sections with no `[SOURCE:]` tags in a Runbook or API doc
- Any operational step in a Runbook with no matching infra/config artifact
- A Handoff document with no git commit hash and no ticket export timestamp
- An ADR that describes a constraint but does not link to the artifact that imposed it

---

## Reference: common failure patterns and fixes

| Failure | Root cause | Fix |
|---|---|---|
| Step references a renamed resource | Artifact was not retrieved at draft time | Retrieve current IaC before re-drafting the step |
| API doc describes a deprecated field | Model used training-data knowledge of the API | Re-run with the current OpenAPI spec injected; add `[MISSING SOURCE]` check to the prompt |
| ADR cites a meeting that has no record | Meeting notes were not in the artifact set | Either locate/create the record or label the claim `[INFERRED: decision rationale]` explicitly |
| Handoff doc has no commit hash | Author wrote from memory under time pressure | Run `git log -1 --format="%H %ai"` and insert the output before any model inference runs |
| Model fills a `[MISSING SOURCE]` silently | Claim-constraint prompt was not used | Use the prompt template in Step 3 verbatim; test it on a known-missing source before the real run |
