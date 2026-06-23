# Skill: Prompt Library Governance

One-page decision aid for managing shared prompts as governed artefacts.
Paste into your team wiki as the standing operating procedure for your prompt library.

---

## Onboarding checklist — adding a new prompt to the registry

Before any prompt enters the registry as DRAFT, confirm all four primitives are present.

| # | Field | Check |
|---|---|---|
| 1 | **Owner** | Named individual or team account recorded; not "the team" generically |
| 2 | **Version** | Semver string (`1.0.0`); starts at `0.1.0` for first DRAFT |
| 3 | **Evaluation anchor** | At least one (input, expected_output) pair stored alongside the prompt text |
| 4 | **Retirement rule** | At least one condition set: `model_sunset`, `accuracy_floor`, `date_sunset`, or `replacement_stable` |

If any field is missing, return to the author. A prompt without all four is a note, not a registry entry.

---

## Promotion gate — who can do what

| Transition | Who may act | Additional requirements |
|---|---|---|
| DRAFT -> REVIEW | Owner only | All four primitives present |
| REVIEW -> STABLE | Any reviewer who is **not** the owner | Anchor score >= threshold (default 0.80); reviewer explicitly assigned |
| STABLE -> DEPRECATED | Owner or automated policy | Replacement prompt named in the record |
| DEPRECATED -> RETIRED | Automated (retirement rule fires) | Tombstone redirect set before retiring |

**Hard rule:** self-review is never permitted. The person who wrote the prompt cannot also approve it for STABLE.

---

## Versioning quick reference

| Change type | Version bump | Example |
|---|---|---|
| Typo, whitespace, formatting — no behavioral change | Patch `1.0.0 -> 1.0.1` | Fix "Summarise" -> "Summarize" |
| Additive: new examples, clearer instruction, same task + output format | Minor `1.0.0 -> 1.1.0` | Add two-shot examples |
| Contract change: different task, new output schema, different required model capability | Major `1.0.0 -> 2.0.0` | Switch from free-text to JSON output |

A major bump requires a new evaluation anchor before the record may re-enter REVIEW.
Never edit prompt text in place under an existing version once it has left DRAFT.

---

## Retirement rule reference

Configure at least one rule per prompt. Rules are checked automatically on model upgrade events and on a weekly registry sweep.

| Rule | Trigger condition | Typical use case |
|---|---|---|
| `model_sunset` | `target_model` is no longer available in the API | Prompts tuned to a specific model version |
| `accuracy_floor` | Current anchor score drops below threshold on production model | Any prompt whose quality is measurable |
| `date_sunset` | Calendar date is reached or passed | Campaign prompts, seasonal workflows, pilots |
| `replacement_stable` | Named successor prompt reaches STABLE | Controlled migration from v1 to v2 |

When a rule fires: set state to RETIRED, record the tombstone redirect (the successor prompt id), log the trigger reason. Do not delete the record.

---

## Model upgrade checklist

When a new model version is available (e.g. claude-sonnet-4-6 -> claude-sonnet-4-7):

- [ ] Re-run all evaluation anchors for every STABLE prompt against the new model.
- [ ] Flag any prompt whose anchor score drops below its `accuracy_floor`.
- [ ] Notify owners of flagged prompts; give a 30-day remediation window before auto-retirement.
- [ ] Update `target_model` field on prompts that owners migrate successfully.
- [ ] Trigger `model_sunset` retirement for prompts targeting the deprecated model once it is removed from the API.

---

## Evaluation anchor types

| Type | When to use | Limitation |
|---|---|---|
| Exact match | Structured extraction, classification, fixed-format output | Brittle to minor phrasing variation |
| Structural match | JSON schema, regex pattern, field presence check | Does not catch semantic errors within the structure |
| LLM-as-judge | Free-text quality, tone, reasoning — hard to exact-match | Requires calibration; do not use the same model as the one being evaluated |

Minimum: one anchor per prompt. Recommended: one per output type the prompt produces. Store anchors in the registry record, not in a separate test suite that can drift.

---

## Escalation path

| Situation | Action |
|---|---|
| Owner is unreachable for >30 days | Assign interim owner from the owning team; log the change |
| Anchor fails after model upgrade; no owner response in 30 days | Auto-deprecate; notify team lead |
| Prompt has no retirement rule set | Block promotion to STABLE until a rule is added |
| Two prompts claim the same functional role | Initiate a consolidation review; one becomes the `replacement_stable` target |
