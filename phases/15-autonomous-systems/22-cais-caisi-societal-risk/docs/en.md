# CAIS, CAISI, and Societal-Scale Risk

> The Center for AI Safety (CAIS, San Francisco, founded 2022 by Hendrycks and Zhang) publishes the four-risk framework — malicious use, AI races, organizational risks, rogue AIs — and the May 2023 statement on extinction risk signed by hundreds of professors and company leaders. 2026 releases from CAIS: AI Dashboard for frontier-model evaluation, Remote Labor Index (with Scale AI), Superintelligence Strategy Paper, AI Frontiers newsletter. A distinct entity: NIST Center for AI Standards and Innovation (CAISI) — US-government-facing voluntary agreements and unclassified capability evaluations focused on cyber, bio, and chemical-weapons risks. CAIS flags organizational risk as one of four top-level risks: safety culture, rigorous audits, multi-layered defenses, and information security are foundational but routinely traded off against deployment speed. California SB-53, if signed, would be the first US state-level catastrophic-risk regulation.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 15 · 19 (RSP), Phase 15 · 20 (PF + FSF)
**Time:** ~45 minutes

## Learning Objectives

- Explain the autonomy mechanism and assumptions behind CAIS, CAISI, and Societal-Scale Risk
- Model its control loop, state transitions, and stopping conditions explicitly
- Apply bounded permissions, budgets, and rollback controls
- Evaluate capability and safety claims against reproducible evidence

## The Problem

Lessons 19 and 20 covered lab-internal scaling policies. Lesson 21 covered independent capability evaluation. This lesson covers the third perspective: civil society and government organizations who shape public discussion and regulatory baseline for catastrophic AI risk.

Two distinct entities matter. CAIS is a non-profit research org that publishes frameworks for thinking about AI risk and coordinates public statements. CAISI is a US-government center within NIST that runs voluntary agreements with labs and unclassified capability evaluations. The names rhyme; the missions do not overlap. A practitioner should know both.

The practical content: CAIS's four-risk framework is the most widely cited societal-scale-risk taxonomy in the literature. Safety culture and organizational risk are one of those four, and this is the one most directly under a practitioner's control. SB-53 (California) would be the first US state-level catastrophic-risk regulation if signed; the bill's framing matters because state-level regulation has historically led federal action in US tech policy.

## The Concept

### CAIS — Center for AI Safety

- Founded: 2022 in San Francisco, by Dan Hendrycks and colleagues (the "Zhang" name refers to an early collaborator, not a current co-founder; see CAIS website for current leadership).
- Status: 501(c)(3) non-profit.
- Notable 2023 output: statement on extinction risk, co-signed by hundreds of researchers and CEOs. Stated: "Mitigating the risk of extinction from AI should be a global priority alongside other societal-scale risks such as pandemics and nuclear war."
- 2026 outputs: AI Dashboard for frontier-model evaluation, Remote Labor Index (joint with Scale AI), Superintelligence Strategy Paper, AI Frontiers newsletter.

### The four-risk framework

CAIS's framework groups catastrophic AI risk into four top-level categories:

1. **Malicious use**: a bad actor uses AI to cause harm (bioweapons synthesis, disinformation, cyberattacks).
2. **AI races**: competitive pressure between labs, companies, or nations pushes deployment past the point where it is safe.
3. **Organizational risks**: internal lab dynamics (safety-culture failures, insufficient audit, under-resourced security) produce a bad deployment.
4. **Rogue AIs**: a sufficiently capable AI pursues goals that conflict with human welfare.

This is not the only taxonomy; it is the most cited. The categories are not mutually exclusive — a rogue AI produced by an organization that traded audit for speed in a race is all four.

### Where organizational risk lives

Of the four categories, organizational risk is the most actionable for practitioners. A lab's safety culture, audit rigor, defense layering, and information security decide whether their model ships with the controls of Lessons 10–18 actually in place, or whether those controls are checklist items nobody verified.

The concrete organizational-risk levers:

- **Safety culture**: do team members feel able to escalate a concern without career cost? CAIS surveys find this is a strong predictor of the other levers.
- **Rigorous audits**: external and internal. Internal-only audits produce optimistic reports.
- **Multi-layered defenses**: no single layer is sufficient (the running theme of Phase 15).
- **Information security**: model weights leaking, eval data leaking, monitor-bypass techniques leaking. RAND SL-4 in Lesson 19 is a specific standard.

### CAISI — Center for AI Standards and Innovation

- Operates within NIST.
- Runs voluntary agreements with frontier labs.
- Publishes unclassified capability evaluations focused on cyber, bio, and chemical-weapons risks.
- Distinct from CAIS; the acronyms collide; check the URL (nist.gov) to confirm which one you are reading.

CAISI's role is the public, government-facing counterpart to METR's private lab engagements (Lesson 21). CAISI reports are unclassified; METR reports are often NDA-gated. A practitioner reading both gets a fuller picture.

### California SB-53

The California Senate bill (2025–2026 session) addresses catastrophic risk from frontier models. Key provisions as drafted:

- Specific capability thresholds that trigger state-level obligations.
- Whistleblower protections for AI lab employees.
- Incident reporting requirements for catastrophic failures.

If signed, it would be the first US state-level catastrophic-risk regulation. Regardless of signing status, the bill's framing shapes how other state legislatures approach the problem. Practitioners in California should track the bill's status; practitioners elsewhere should read it to understand what US state-level regulation will likely look like.

### Societal-scale risk is not a single-layer problem

The running theme of Phase 15 — defense in depth — applies at the societal layer too. No single organization, regulation, or framework closes catastrophic risk. The ecosystem functions only when:

- Labs ship scaling policies (Lessons 19, 20).
- External evaluators produce measurements (Lesson 21).
- Civil society tracks and publicizes (CAIS).
- Government runs voluntary programs and baseline regulation (CAISI, SB-53).
- Practitioners build multi-layered controls (Lessons 10–18).

This is the final synthesis for the phase: every previous lesson is one layer in a stack whose completeness matters more than any single layer's strength.



## Further Reading

- [Center for AI Safety](https://safe.ai/) — institutional home of the four-risk framework.
- [CAIS — AI Risks that Could Lead to Catastrophe](https://safe.ai/ai-risk) — the four-risk paper.
- [CAIS — May 2023 statement on extinction risk](https://safe.ai/statement-on-ai-risk) — short joint statement.
- [NIST CAISI](https://www.nist.gov/caisi) — government-facing AI standards and innovation center.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — connects lab-level commitments to societal-scale framing.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the autonomy mechanism and assumptions behind CAIS, CAISI, and Societal-Scale Risk.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Model its control loop, state transitions, and stopping conditions explicitly.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Apply bounded permissions, budgets, and rollback controls.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the autonomy mechanism and assumptions behind CAIS, CAISI, and Societal-Scale Risk,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Apply bounded permissions, budgets, and rollback controls,” and cite a repeatable check rather than relying on visual inspection alone.
