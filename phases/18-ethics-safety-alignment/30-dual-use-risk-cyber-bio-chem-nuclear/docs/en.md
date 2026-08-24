# Dual-Use Risk — Cyber, Bio, Chem, Nuclear Uplift

> Dual-use risk must be evaluated domain by domain. OpenAI's [Preparedness Framework update](https://openai.com/index/updating-our-preparedness-framework/) describes biological and cybersecurity capability thresholds. Anthropic's [cyber-espionage case report](https://www.anthropic.com/news/disrupting-AI-espionage) says a threat actor used Claude for 80–90% of a campaign, with human intervention at roughly four to six decision points. In a benign wet-lab setting, OpenAI reports a [79× cloning-efficiency improvement](https://openai.com/index/accelerating-biological-research-in-the-wet-lab/); the result is specific to that protocol and does not by itself establish dangerous capability. Safety cases must separate information access, experimental execution, and expert oversight.

**Type:** Learn
**Languages:** none
**Prerequisites:** Phase 18 · 17 (WMDP), Phase 18 · 18 (safety frameworks), Phase 18 · 28 (ecosystem)
**Time:** ~75 minutes

## Learning Objectives

- Explain how [OpenAI's Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/) turns observed capability into tracked risk thresholds.
- Describe Anthropic's [November 2025 cyber case](https://www.anthropic.com/news/disrupting-AI-espionage), including its vendor-reported 80–90% automation estimate.
- Describe the chem/bio execution-gap erosion: vision-enabled real-time correction of wet-lab experiments.
- State the novice-relative vs expert-absolute asymmetry and its implication for safety-case construction.

## The Problem

Lesson 17 is the measurement methodology. Lesson 30 is the 2026 state of the measurement. The picture shifted materially between 2024 and late 2025: each domain crossed a threshold that the 2024 frameworks did not anticipate.

## The Concept

### Bio/chem uplift narrative

Three phases (repeated from Lesson 17 for coherence):

1. **2024 "mild uplift."** Early Preparedness/RSP evaluations reported small novice advantages over internet search.
2. **April 2025 "on the cusp."** OpenAI PF v2 warned models were "on the cusp of meaningfully helping novices create known biological threats."
3. **2025 Anthropic bioweapon-acquisition trial.** Controlled novice study; 2.53x uplift on acquisition-phase tasks; insufficient to rule out ASL-3.

The shift is qualitative: "mild" evolved into "plausibly enabling" within eighteen months, even without a capability breakthrough.

### Chem/bio execution-gap erosion

Historic defense: information is necessary but not sufficient; the skill of executing the protocol blocks novices. 2025 frontier models with vision break this defense partially:

- **Real-time protocol correction.** GPT-5.2, Gemini 3 Pro, Claude Opus 4.5, Grok 4.1 can observe wet-lab video and flag errors mid-procedure.
- **December 2025 OpenAI demonstration.** GPT-5 iterating on wet-lab experiments achieves 79x efficiency improvement via protocol optimization.

The implication: execution-skill-as-defense is eroding. Procurement and equipment gaps remain, but the tacit-knowledge gap is narrowing.

### Cyber uplift (November 2025)

Anthropic's [November 2025 report](https://www.anthropic.com/news/disrupting-AI-espionage) says Chinese-linked state actors used Claude's coding capabilities for 80–90% of a cyberattack campaign, with human intervention at roughly four to six decision points. Attribute this number to the vendor and distinguish it from an independently audited measurement.

Implications:
- Agentic coding is the attack-automation primitive. Previous AI cyber assistance was bounded at code-snippet level; agentic workflows integrate reconnaissance, exploitation, post-exploitation, and exfiltration.
- The 4-6 human steps are the bottleneck; future capability gains would reduce that count.
- Defensive dual-use: OpenAI's "trusted access" pilot provides vetted security organisations (established incident-response firms, government) with capability access for defense. Asymmetry in access favors defenders if the pilot scales.

### Nuclear

The least-analyzed of the four CBRN domains in public documentation. The threat model is different: fissile-material acquisition dominates the difficulty, not information. AI uplift on the information layer provides limited novice uplift in practice. No 2024-2025 major-lab report identifies a nuclear-specific threshold crossing.

### Novice-relative vs expert-absolute

A pattern across all four domains:

- **Novice-relative uplift.** High. Multiplicative. Per Anthropic 2025 bio, 2.53x.
- **Expert-absolute capability.** High ceiling. An expert extracts more than a novice because the expert knows what to ask and how to interpret.

Implication for safety cases: addressing only novice uplift (via input filters, refusals, uncertainty) is insufficient for expert-absolute control. Additional measures required: elicitation-hardening, capability unlearning (Lesson 17), and control protocols (Lesson 10).

### Cross-domain synthesis

| Domain | 2024 | 2025 | Inflection |
|---|---|---|---|
| Bio | mild uplift | 2.53x uplift, ASL-3 approach | acquisition-phase automation |
| Chem | mild uplift | execution-gap erosion via vision | real-time wet-lab correction |
| Cyber | code assistance | 80-90% campaign automation | agentic coding |
| Nuclear | limited | limited | material-access bottleneck holds |

Three domains crossed thresholds. One remains bounded by non-informational barriers.

### Where this fits in Phase 18

Lesson 30 is the capstone: the current dual-use picture that every prior lesson contributes to measuring, limiting, or governing. Lessons 17-18 give the measurement and frameworks; Lessons 12-16 give the evaluation tooling; Lessons 24-25 give the regulatory and disclosure layer; Lesson 28 gives the research ecosystem. Lesson 30 is where the evidence lands.



## Further Reading

- [Anthropic — November 2025 cyber threat report](https://www.anthropic.com/news/disrupting-AI-espionage) — Chinese-linked campaign automation
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) — bio "on the cusp"
- [Anthropic — RSP v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) — ASL-3 bio thresholds
- [Council on Strategic Risks — 2025 AI x Bio wrapup](https://councilonstrategicrisks.org/2025/12/22/2025-aixbio-wrapped-a-year-in-review-and-projections-for-2026/) — year-end synthesis
