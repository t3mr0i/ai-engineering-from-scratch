# Skill: AI Workforce Gap Mapper

One-page decision aid for consultants and AI operations leads. Use this when:
- Starting an AI transformation engagement and need to scope the people side
- A model upgrade has shipped and you need to re-assess existing role readiness
- Preparing for an EU AI Act Article 4 compliance audit

---

## Step 1 — Identify interaction points (15 min per role)

For each affected role, list every step where a person prompts, reviews, or governs an AI system. Use the three-question test:

| Question | Answer you need |
|---|---|
| What does the person *do differently* because of AI? | The interaction point name |
| Who is accountable if the AI output is wrong? | The accountability gap |
| Can the error be corrected after the fact? | Reversibility flag |

---

## Step 2 — Rate competency for each interaction point

Rate each of the four categories as: **Adequate / Gap / Missing**

| Category | Evidence of Adequate | Typical Gap signal |
|---|---|---|
| **Prompt craft** | Person can elicit well-scoped output; knows when to add constraints | Vague prompts, copy-paste of output without modification |
| **Output verification** | Person cross-checks facts and domain logic; does not treat fluent output as correct | "Looks good to me" review; trusting test-pass without reading the test delta |
| **Escalation judgment** | Person names specific failure modes; knows who to contact | "I wasn't sure but I approved it anyway" patterns |
| **Governance and audit** | Decisions are logged with prompts and outputs; audit trail exists | No record of what the AI contributed to a decision |

---

## Step 3 — Score and prioritise gaps

For each non-Adequate rating, score the interaction point on two axes:

```
Impact score (1-5):
  +2  Non-reversible output
  +2  EU AI Act high-risk system (ANNEX III: biometric, employment, credit, etc.)
  +1  Review or Govern direction (human is the final check)

Effort score (1-3):
  3   Missing (capability does not exist in the role today)
  2   Gap (person needs structured enablement)
  0   Adequate (no action needed)

Priority = (Impact × gap_weight) − (Effort × 0.5)
EU high-risk override: +10 to priority score regardless of other factors
```

---

## Step 4 — Match gap type to enablement measure

| Gap type | Right measure | Wrong measure |
|---|---|---|
| Prompt craft | Paired practice + prompt library | Slides on "how LLMs work" |
| Output verification (domain-specific) | Domain-specific checklist + red-team exercise | Generic critical thinking course |
| Escalation judgment | Simulated failure scenarios (run with real cases) | Written policy document |
| Governance and audit | Documentation template + audit walk-through drill | One-time compliance training |
| Structural Missing | Role redesign or new hire | Any training programme |

---

## Governance checklist (per audit cycle)

- [ ] AI system inventory is current (add any new deployments since last audit)
- [ ] Model version changes reviewed for failure-mode shifts that affect existing Adequate ratings
- [ ] All roles touching EU AI Act ANNEX III systems have closed or formally accepted their Article 4 gaps
- [ ] Enablement backlog has an owner per gap item and a target close date
- [ ] Prompt and output logs exist for all non-reversible, high-risk interaction points
- [ ] Accountability gaps are documented and signed off by a named individual per role

---

## Quick-reference: EU AI Act ANNEX III high-risk categories (2026)

Interaction points in these domains require the EU high-risk override in prioritisation:

- Biometric identification and categorisation
- Critical infrastructure (energy, water, transport)
- Education and vocational training decisions
- Employment, worker management, and self-employment access
- Access to essential private and public services (creditworthiness, social benefits)
- Law enforcement
- Migration, asylum, and border control
- Administration of justice and democratic processes

If in doubt: check the current consolidated ANNEX III text at eur-lex.europa.eu.

---

## Backlog item template

```
Role:               [role name]
Interaction point:  [step in the workflow]
Category:           [Prompt craft / Output verification / Escalation judgment / Governance and audit]
Gap rating:         [Gap / Missing]
Impact:             [1-5]
Effort:             [1-3]
EU high-risk:       [yes / no]
Priority score:     [calculated]
Owner:              [name]
Measure:            [paired practice / checklist / scenario / template / role redesign]
Target close:       [date]
```

---

*Refresh this artefact after every model upgrade and at each quarterly business review.*
