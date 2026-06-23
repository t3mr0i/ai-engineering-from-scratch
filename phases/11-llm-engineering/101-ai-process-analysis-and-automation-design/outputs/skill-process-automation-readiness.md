# Process Automation Readiness — Decision Aid

Use this before any model selection, prompt engineering, or pilot budget is committed.

---

## The Four Readiness Checks

| # | Check | Pass condition | Common shortcut that fails |
|---|---|---|---|
| 1 | Exception map | >=80% of case volume covered by documented exception categories | Using the process SOP instead of observing the live process |
| 2 | Output sensitivity | Downstream consequence of a wrong output is understood and accepted by the process owner | Assuming "low risk" without tracing one real error forward |
| 3 | Volume profile | Historical data covering at least one peak period is available | Using average volume only; missing seasonal or burst peaks |
| 4 | Manual baseline | Current process error rate is measured from a sample audit, not assumed | Stating "the process is 99% accurate" without a source |

**Gate rule:** Two or more checks failing = FAIL (run pre-analysis sprint before any pilot). One check failing = CONDITIONAL (fix before committing budget). Zero failures = PASS (proceed to shadow pilot per Phase 17 · 20).

---

## Exception Map Template

Sit with 2-3 people who do the work. Ask: "What kinds of cases make you handle it differently?" and "Which ones do you escalate?"

| Exception type | % of volume (estimate) | Current handling |
|---|---|---|
| (category 1) | | |
| (category 2) | | |
| (category 3) | | |
| (category 4) | | |
| (category 5) | | |

Aim for 6-10 categories covering at least 80% of volume. If you cannot enumerate them, the process is not yet understood well enough to automate.

---

## Output Sensitivity Scoring

| Level | Downstream consequences | Automation posture |
|---|---|---|
| LOW | Detected quickly; correction takes minutes; no financial/legal exposure | Automate with lightweight monitoring |
| MEDIUM | May propagate one step; manual correction required; moderate rework cost | Automate with sampling-based human review (Phase 14 · 36) |
| HIGH | Financial, legal, or reputational consequences; may survive detection | Human-in-the-loop on every decision, or automation is premature |

To score sensitivity: trace one real wrong output forward. What is the next process that receives it? Does that process catch it? What happens if it does not?

---

## "Not Ready" Response Templates

Use when a check fails. Each response is a bounded task, not a project.

**Exception coverage too low (<80%)**
Run a two-week observation sprint. For each case handled, log: case type, whether it deviated from the standard path, and how it was resolved. Categorize at end of sprint.

**Sensitivity level unknown**
Walk through one real error with the process owner: what did they have to do to fix it, who else was involved, was there any external consequence (customer, regulator, downstream system). Score from that walkthrough.

**No volume profile**
Instrument the live queue for four weeks before the pilot. Capture case count per day and flag any weeks with known seasonality. If instrumentation is not possible, pull system logs or email/ticket history.

**Manual baseline not measured**
Run a 200-case sample audit. Select cases randomly from the last 90 days. Have a senior practitioner rate each output as correct or incorrect using a written rubric. Compute error rate and note which exception categories account for most errors.

---

## Decision Tree

```
Is the exception map built and covering >=80% of volume?
    No  -> Run observation sprint (2 weeks). Return to gate.
    Yes ->
        Is output sensitivity understood and accepted?
            No  -> Trace one real error forward with process owner. Score sensitivity.
            Yes ->
                Is historical volume data available (including peaks)?
                    No  -> Instrument queue for 4 weeks. Return to gate.
                    Yes ->
                        Is the manual error rate measured (not assumed)?
                            No  -> Run 200-case sample audit. Return to gate.
                            Yes ->
                                All four checks pass.
                                Is sensitivity HIGH?
                                    Yes -> Design HITL scope contract (Phase 14 · 36)
                                           before pilot launch.
                                    No  -> Proceed to shadow pilot (Phase 17 · 20).
```

---

## Pilot Handoff Checklist

When all four checks pass and you are ready to hand off to Phase 17 · 20:

- [ ] Exception map documented (categories, frequencies, current handling)
- [ ] Sensitivity level recorded with the trace that justified it
- [ ] Volume profile data provided to the pilot team (including peak periods)
- [ ] Manual baseline error rate recorded with audit methodology
- [ ] Shadow success metric defined: the AI must match or beat the baseline rate on the same sample categories
- [ ] For HIGH sensitivity: HITL scope contract drafted (what the AI decides vs. escalates)
- [ ] Process owner has signed off on the gate assessment

---

## Common Objections and Responses

**"We don't have time for four weeks of instrumentation."**
If the process has never been measured, the pilot will also be unmeasurable. A pilot with no baseline is an experiment you cannot interpret. The four weeks of measurement is also the period when the team learns the actual exception distribution — that knowledge is required for the HITL design regardless.

**"The demo showed 95% accuracy on our test set."**
Test sets curated by the team implementing the solution systematically exclude the exceptions the team did not know about. Accuracy on a curated set is not a readiness signal. Accuracy on a random sample from the live queue is.

**"We can learn from production."**
For LOW sensitivity processes with fast correction loops, learning from production is defensible. For MEDIUM or HIGH sensitivity, "learning from production" means accumulating real errors with real consequences before the model is calibrated. The gate exists to separate these cases.
