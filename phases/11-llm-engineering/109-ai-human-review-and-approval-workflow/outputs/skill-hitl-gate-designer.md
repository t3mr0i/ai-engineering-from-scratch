# HITL Gate Designer — Decision Aid

Use this sheet to specify a new human-in-the-loop review gate. Fill in one
column per gate. Keep a copy in your system design document; include it in
every compliance review.

---

## Step 1: Classify the Risk Tier

Answer the two decisive questions first. Everything else follows.

| Question | Your answer |
|---|---|
| Is the downstream action **reversible** within 24 hours? | Yes / No |
| What is the **blast radius** if this output is wrong? (circle one) | Internal only / Customer-facing / Legal/Financial / Safety/Regulatory |

Then assign the tier:

| Tier | Reversible? | Audience / Action | Gate required |
|---|---|---|---|
| **1 — Low** | Yes | Internal only; no downstream action | No gate; anomaly monitoring only |
| **2 — Medium** | Yes or No | Customer-facing; triggers notification or data write | Async review; 4-hour primary SLA |
| **3 — High** | No | Legal, financial, or personnel decision | Sync sign-off before action; 60-second mandatory hold |
| **4 — Critical** | No | Safety system, regulatory filing, irreversible commitment | Dual reviewer; sequential; 2-minute mandatory hold; rollback plan |

**Important:** tier is determined by reversibility and blast radius, not by
the model's confidence score. A 97% confident output in Tier 4 still gets the
full gate.

---

## Step 2: Define the Decision Surface

Write the exact question the reviewer will be asked. Vague questions ("does
this look right?") produce rubber stamps.

```
Reviewer decision surface:
  [ ] Accept — the output is correct and ready to act on
  [ ] Request revision — describe the specific problem:
      _______________________________________________
  [ ] Escalate — the case is outside my authority or judgment
```

For structured outputs, list the specific fields the reviewer must verify:

| Field name | What to check |
|---|---|
| (field 1) | |
| (field 2) | |

---

## Step 3: Name the Escalation Path

Fill in real names, not roles. Roles create silent gaps when vacancies occur.

| Level | Name | Backup | SLA | Action if SLA expires |
|---|---|---|---|---|
| Primary | | | hours | -> escalate to Secondary |
| Secondary | | | hours | -> escalate to Decision Owner |
| Decision Owner | | | hours | -> conservative default |
| **Conservative default** | **HOLD / REJECT** | | | **Never auto-approve** |

---

## Step 4: Instrument These Four Quality Signals

Wire these from day one. A gate without measurement is indistinguishable from
no gate after six months.

| Signal | Target | Red flag |
|---|---|---|
| Approval time distribution | Bimodal (fast scan + careful review) | 100% of approvals < mandatory hold time |
| Revision request rate | > 0% (even well-calibrated models have edge cases) | 0% revision rate over 2+ weeks |
| Escalation rate | > 0% (confirms the path is usable) | 0% escalation over 1+ month |
| Post-deployment error rate by reviewer | Declining over time | Specific reviewer consistently approves problematic output |

---

## Step 5: Mandatory Audit Record Fields

Every gate decision must write a record with all of these fields. No
exceptions for Tier 3/4 (EU AI Act Art. 14, ISO/IEC 42001).

```
output_id          — unique id of the AI output artifact
model_version      — model name + prompt version that produced the output
reviewer_id        — authenticated identity (not self-reported)
decision           — accept | request-revision | escalate | reject
review_duration_s  — seconds between output display and decision submit
revision_notes     — required when decision = request-revision
timestamp_utc      — ISO 8601
```

---

## Anti-Patterns Checklist

Before sign-off, confirm none of these are present:

- [ ] Conservative default is "auto-approve" (most common violation)
- [ ] Escalation path ends in a role, not a named person
- [ ] Reviewers have no explicit criteria — asked to "check for accuracy"
- [ ] No mandatory hold time on Tier 3/4 gates
- [ ] Approval time is not logged (no rubber-stamp detection possible)
- [ ] Gate can be bypassed when reviewers are unavailable
- [ ] Revision notes field is optional for revision decisions
- [ ] Audit record does not include the model version

---

## Quick Reference: Rubber-Stamp Detection

A gate is rubber-stamping if the approval time distribution has no tail.
Spot-check: route 5% of already-approved outputs to a second reviewer who
does not know the first already approved. Disagreement rate > 20% signals
a failing gate.

Mandatory hold times by tier:

| Tier | Minimum hold before "Accept" is enabled |
|---|---|
| 1 | None (no gate) |
| 2 | 30 seconds |
| 3 | 60 seconds |
| 4 | 120 seconds |
