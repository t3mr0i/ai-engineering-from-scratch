# AI System Type Classifier — Consultant Decision Aid

Use this one-pager in project kickoffs, client workshops, or proposal reviews to classify an AI use case and assess its risk before committing to architecture or estimation.

---

## Step 1: Classify the System Type

Answer the three questions left to right. Stop at the first "yes."

| Question | If YES | If NO |
|---|---|---|
| Does it plan across multiple steps AND take external actions (send, write, call APIs)? | **AGENTIC** — proceed to Step 3 risk gates | Continue |
| Does it produce open-ended text, code, images, or audio? | **GENERATIVE** — check grounding below | Continue |
| Does it map variable inputs to bounded outputs (score, class, number)? | **ML CLASSIFIER / PREDICTOR** | Consider a deterministic rule first |

### Generative AI: grounding check

If GENERATIVE, answer one more question:

| Grounding source | Label | Key mitigation |
|---|---|---|
| No retrieval — model generates from parametric knowledge only | Generative (ungrounded) | Human review required before consequential use |
| Retrieves from live documents before generating | Generative + RAG | Verify that citations trace to retrieved source, not model memory |

---

## Step 2: Realistic Capability Limits

Do not promise what the system type cannot deliver.

| Capability | Reliable | Needs mitigation | Do not rely on |
|---|---|---|---|
| Summarize provided text | Generative, Agentic | — | — |
| Classify into defined categories | ML, Generative | Validate on held-out data | — |
| Arithmetic / multi-step calculation | — | Route to code execution | Raw LLM output |
| Cite external sources accurately | — | RAG with retrieved text | Parametric recall |
| Real-time information | — | Retrieval / search tool | Model alone |
| Consistent JSON/schema output | — | Structured output API | Freeform prompt |
| Irreversible action (send, delete, charge) | — | HITL gate required | Autonomous approval |

---

## Step 3: Agentic Risk Gates (required for AGENTIC classification)

Check all four. Any gate that fails is a blocker unless mitigated before production.

| Gate | Question | Pass | Fail / Action required |
|---|---|---|---|
| A — Blast radius | What can the agent reach? | Read-only or limited write with rollback | Broad write or irreversible actions with no rollback procedure |
| B — Reversibility | Can every action be undone? | Yes, or HITL checkpoint is technically enforced before irreversible steps | Irreversible actions exist and no checkpoint is enforced in code |
| C — Oversight | Is human review enforced technically (not just by policy) before consequential actions? | Yes — enforced in the system, not just documented | No — trust is procedural only |
| D — Injection surface | Does the agent read external, attacker-controllable text? (emails, tickets, web pages) | No | Yes — apply input sanitization, scope restrictions; flag for security review |

**Verdict:**
- All gates pass: PROCEED with standard monitoring and logging
- Any gate partially fails: REVIEW — document mitigation before deployment
- Gate A or B fails without mitigation: BLOCK — do not deploy to production

---

## Step 4: EU AI Act Risk Tier Quick-Reference

Classification determines legal obligations, not just architecture.

| Tier | Examples relevant to consulting | Obligations |
|---|---|---|
| Unacceptable risk (prohibited) | Social scoring; real-time biometric surveillance in public spaces | Cannot deploy |
| High risk | AI in employment decisions, credit scoring, critical infrastructure, safety components, education assessment | Conformity assessment, registration, technical documentation, human oversight, logging |
| Limited risk | Chatbots and generative AI interacting with users | Transparency: user must know content is AI-generated |
| Minimal risk | Spam filters, AI-assisted spreadsheet tools | No mandatory obligations (voluntary code of conduct) |

If in doubt about tier: treat as high risk and document accordingly. Reclassifying down later is easier than retrofitting compliance.

---

## Quick-Reference: Three Questions for Every AI Project

Write answers before architecture begins. Unanswered questions are project risk.

1. **What type of AI system is this?** (Rule / ML / Generative / Agentic — with which tools, which data access)
2. **What is the ground truth?** How will anyone know the system is wrong, and how quickly?
3. **What does a failure cost?** Wrong answer vs. wrong action; reversible vs. irreversible; regulatory vs. reputational.

If the answer to question 2 is "we will trust the output" — the project is not ready to begin.
