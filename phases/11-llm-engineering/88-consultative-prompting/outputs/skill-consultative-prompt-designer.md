# Skill: Consultative Prompt Designer

One-page decision aid for structuring LLM prompts in consulting situations.
Paste into a system prompt, a prompt-review step, or use as a pre-send checklist.

---

## Step 1 — Route to a template

| Audience level | Belief state | Template | Core change vs. default |
|---|---|---|---|
| Board | Any | **BOARD** | Implication first, one decision-brief, no jargon |
| Senior mgmt / C-suite | Skeptical | **ADVERSARIAL** | Lead with the counter-position; earn the affirmation |
| Senior mgmt / C-suite | Aligned or uninformed | **SENIOR_MGMT** | Hypothesis-driven memo, argument before evidence |
| Operational team | Any | **OPERATIONAL** | Full depth, actionable specifics, owners and timelines |

**Quick rule:** if the audience will push back, use ADVERSARIAL before anything else.

---

## Step 2 — Build the four-layer prompt

```
[ROLE]
Act as a [role appropriate to the template above].
Assume [what this audience already knows / their existing position].

[STAKEHOLDER CONTEXT]
Audience: [level + role + existing belief].
Decision they are making: [exact decision, one sentence].

[HYPOTHESIS]
My working hypothesis is: [specific, falsifiable claim].
This holds unless [counter-condition].
[Challenge / confirm this. / Under what conditions does this fail?]

[OUTPUT CONTRACT]
Format: [memo / decision brief / bullet list / risk register row].
Length: [specific limit, e.g., "200 words max" or "four bullets"].
Tone: [direct / no hedge language / executive register].
This output will be used to: [the decision it must enable].
```

---

## Step 3 — Score the hypothesis before sending

Check each criterion. A hypothesis must pass all five to be prompt-ready.

| Criterion | Pass signal | Fail signal | Quick fix |
|---|---|---|---|
| **Specificity** | Names a project, system, entity, or timeline | Generic noun ("the migration", "the project") | Replace with the actual name |
| **Falsifiability** | "This holds unless..." or "if X then Y" | Assertion with no escape condition | Add "unless [counter-condition]" |
| **Audience alignment** | Names the audience role and their decision | No audience mention | Add "For the [role] deciding [decision]..." |
| **Scope constraint** | "Top two", "confirm or reject", "name one" | "Discuss", "explore", open question | Add a count or a binary |
| **Challenge invitation** | "Challenge this", "under what conditions does this fail" | No challenge instruction | Add "Challenge this hypothesis." |

Score = number of criteria passed / 5. Send at 5/5. Iterate at 3-4/5. Rewrite at 1-2/5.

---

## Common failure modes

| Failure | Symptom | Fix |
|---|---|---|
| Generic summary | Model returns five bullets that apply to any project | Add specificity and audience alignment |
| Sycophancy | Model confirms every hypothesis without challenge | Add explicit challenge invitation |
| Format mismatch | Output is a memo when the partner wants one slide | Specify format in the output contract |
| Scope explosion | Model writes 800 words when you needed 200 | Add a hard length limit to the output contract |
| Preamble problem | Model addresses the background, not the question | Move the hypothesis to the first sentence |
| Balanced-argument trap | Model surveys pros and cons instead of taking a position | Encode the audience's existing belief so the model knows which side to argue |

---

## Template starters (copy, fill in brackets, send)

### ADVERSARIAL — skeptical senior audience
```
Act as a senior advisor stress-testing the following position.
Assume the audience will reject any unsupported claim.

Audience: [role], currently skeptical that [belief they are challenging].
Decision: [exact decision on the table].

Hypothesis: [your working position].
This holds unless [counter-condition].

First: state the strongest version of the counter-position in one paragraph.
Second: state the minimum evidence required to shift that counter-position.
Format: two paragraphs, no hedge language, 150 words max.
```

### BOARD — decision brief
```
Act as a non-executive board advisor. Assume the reader has 90 seconds.
State the implication before the evidence.

Audience: [board composition and what they last heard about this topic].
Decision: [exact go/no-go or risk-acceptance decision].

Hypothesis: [the position the board brief must support or challenge].
Challenge this if the evidence does not support it.

Format: one headline sentence, three bullet implications, one recommended action.
No acronyms unexplained. No jargon. 120 words max.
```

### OPERATIONAL — implementation depth
```
Act as an experienced implementation consultant.
Assume the audience wants actionable specifics and can handle technical depth.

Audience: [team composition and their current blockers].
Decision: [what they need to decide or prioritize].

Hypothesis: [your working diagnosis of the root cause].
This holds unless [counter-condition]. Identify the top [N] recommended actions.

Format: problem statement, root-cause hypothesis, [N] recommended actions each with
an owner role and timeline. Bullet format. Every bullet must be actionable.
```

---

## Reviewer rubric (for Phase 14 · 39 automated review)

Feed this dict to a reviewer agent's evaluation function:

```python
CONSULTING_MEMO_RUBRIC = {
    "decision_alignment": "Does the output enable the stated decision? (yes/no + reason)",
    "audience_calibration": "Is the depth and tone appropriate for the stated audience level?",
    "hypothesis_addressed": "Does the output confirm, challenge, or extend the stated hypothesis?",
}
```

A reviewer agent that scores each criterion pass/fail before delivery catches the most common consulting memo failures without a human in the loop on every draft.
