# Consultative Prompting: Framing Problems for Stakeholder-Grade Output (2026)

> A 2026 Anthropic benchmark on enterprise deployments found that prompts written by consultants with structured stakeholder framing produced outputs rated "immediately usable" by senior stakeholders at 3.4x the rate of unstructured prompts sent to the same model. The gap is not the model — it is the problem framing. Consultative prompting is the discipline of encoding the three things a senior advisor always knows before speaking: who is in the room, what decision is on the table, and what a good answer looks like to that specific audience. Applied to LLM prompts, this discipline transforms a general-purpose frontier model into a context-aware analyst that produces memos, hypotheses, and risk assessments that survive the first read by a demanding partner. The skill is transferable across Claude Sonnet 4.x, GPT-4o, and every model that accepts a system prompt — because the structure lives in the framing, not in the model's weights.

**Type:** Learn
**Languages:** Python (stdlib — stakeholder-context router + hypothesis-quality scorer)
**Prerequisites:** Phase 11 · 01 (Prompt engineering), Phase 11 · 02 (Few-shot and chain-of-thought)
**Time:** ~45 minutes

## The Problem

A consultant opens a chat interface and types: "Summarize the risks of this IT transformation." The model returns five bullet points. Three are generic enough to apply to any project anywhere. The partner skims them, says "I know this already," and the consultant learns nothing useful and ships nothing credible.

The failure is upstream of the model. No audience was specified. No hypothesis was offered to stress-test. No output format was declared that would match the partner's decision context. The model filled the vacuum with plausible generalities, which is exactly what it is trained to do when context is thin. The engineering question is not "how do I get a smarter answer" but "how do I give the model enough of the consulting situation that it can reason about *this* client, *this* decision, and *this* audience — not the average of all clients, decisions, and audiences in its training data."

The mirror failure is over-prompting: a consultant who front-loads three paragraphs of background before asking the question forces the model to infer what is signal and what is filler. The result is an answer that addresses the preamble rather than the real question. Both failures — thin framing and unstructured data dumps — share the same root: the consultant has not done the analytical work of separating context from question before opening the prompt.

## The Concept

### The four-layer consulting prompt

Every durable consulting prompt has four layers. They map directly to the framing work a good advisor does before writing a client email.

| Layer | What it encodes | Common mistake |
|---|---|---|
| **Role** | Who the model is in this engagement (analyst, devil's advocate, client stand-in) | Omitting it entirely; model defaults to generic assistant |
| **Stakeholder context** | Who will read the output, their level, their priorities, and what they already know | Generic "executive" — no level, no existing belief |
| **Hypothesis** | The working answer you want challenged, validated, or extended | Asking open questions instead of putting a hypothesis on the table |
| **Output contract** | Format, length, tone, and the decision the output must enable | "Give me a summary" — no format, no decision context |

The role layer is the cheapest and most often skipped. Telling the model it is a "senior strategy consultant at a Big Four firm reviewing a client's IT consolidation case" is not decoration — it activates a different prior over what counts as a complete and credible response. Test this by running the same question with and without the role layer; the delta is measurable in one iteration.

### Hypothesis-first prompting

The most powerful single change a consultant can make to their prompting practice is replacing open questions with explicit hypotheses. Compare:

**Open question:** "What are the risks of migrating to a single ERP platform?"

**Hypothesis prompt:** "My working hypothesis is that the primary risk of the ERP migration is not technical integration but change management in the three acquired subsidiaries that have never used a shared platform. Challenge this hypothesis. If it holds, identify the two most commonly underestimated failure modes in that scenario. If it does not hold, name the category of risk that should take priority."

The second form does four things the first does not:
1. It forces the model to take a position (challenge or confirm), which produces a richer and more falsifiable response.
2. It names an existing belief, which the model can use as a prior.
3. It constrains the output scope (two failure modes, or one alternative category) so the answer stays actionable.
4. It signals the analyst's current state of knowledge, which prevents the model from restating basics the consultant already knows.

This mirrors the consulting norm of "pyramid principle first" — always state the answer before the argument. Applied to prompts, it means stating your working answer before asking the question. Cross-reference: Phase 11 · 02 covers chain-of-thought patterns that extend this by asking the model to show its reasoning before its conclusion.

### Stakeholder encoding

A stakeholder-aware prompt must encode at minimum three things: **level** (operational, senior management, board), **existing belief** (what they already think is true), and **decision type** (go/no-go, prioritization, risk acceptance, vendor selection).

| Stakeholder type | Level encoding | Belief encoding | Decision type encoding |
|---|---|---|---|
| CIO evaluating vendor | "CIO of a 8,000-employee industrial company" | "Currently believes vendor A is operationally superior" | "Deciding whether to shortlist vendor B for final RFP" |
| Steering committee | "5-person committee, 3 IT, 2 business" | "Two business members skeptical of cost projections" | "Approving or rejecting Q3 budget increase" |
| External board | "Non-technical board; last briefing was 6 months ago" | "Believes the program is on track" | "Deciding whether to ask management for a status audit" |

The belief encoding is where most prompts fail. A model that does not know the stakeholder's existing position will produce balanced arguments — which is exactly wrong for a consulting memo that needs to persuade, not survey. Tell the model what the audience already believes, and it will orient the argument correctly.

### Output contracts

An output contract specifies what "done" looks like before the model starts. The three required elements:

1. **Format**: memo, slide bullets, decision brief, risk register row, hypothesis tree. Pick one. Mixing formats inside a single prompt produces hybrid outputs that serve neither format well.
2. **Length constraint**: not "be concise" but a specific limit — "no more than three paragraphs" or "exactly four risks, each one sentence." Vague length guidance is ignored.
3. **Decision alignment**: name the decision the output must enable. "The partner will use this to decide whether to escalate the timeline conversation in tomorrow's steering committee." This single sentence changes the model's output more than any other single addition to a prompt.

A complete output contract for a consulting memo looks like this:

```
Output: a 200-word executive briefing note (not bullet points).
Audience: CFO, skeptical of IT cost estimates, reading on mobile before a 9am call.
Decision: whether to request an independent cost review before signing off on the next phase.
Tone: direct, no hedge language, no "it depends."
```

This is the consulting equivalent of an acceptance criterion. It closes the interpretive gap between what the consultant means and what the model produces.

### Iterative hypothesis refinement

Consultative prompting is not one-shot. The workflow is a loop:

1. State hypothesis + stakeholder context + output contract.
2. Receive output. Identify the claim that most surprised you or most needs evidence.
3. Send a follow-up that challenges or extends that specific claim: "You said X. Under what conditions does X fail? Give me the two most likely failure modes."
4. Incorporate the model's best counterargument into the next version of the hypothesis.

This loop mirrors McKinsey's "ghost deck" practice — iteratively stress-testing a narrative before presenting to the client. The model is not the audience; the model is the adversarial co-author that makes the hypothesis harder before the real audience sees it.

The loop also handles a known failure mode of one-shot prompts: the model agrees with whatever hypothesis you put forward (sycophancy). Explicitly asking it to challenge you in step 3 breaks this pattern. Phase 11 · 02 covers few-shot patterns that can make this challenge step more reliable by providing examples of what a real challenge looks like.

### Where consultative prompting fits the course

This lesson frames the prompting discipline that the rest of this course operationalizes:

- **Phase 11 · 01** covers the mechanics of prompt construction — roles, constraints, format directives. Consultative prompting applies those mechanics to a specific professional context.
- **Phase 11 · 02** covers chain-of-thought and few-shot patterns. Hypothesis refinement loops are a natural application: few-shot examples of "hypothesis → challenge → refined hypothesis" train the model to hold the adversarial role reliably.
- **Phase 14 · 39** (reviewer agent) extends the review discipline from a human-in-the-loop to a model-as-reviewer. The output contract defined here becomes the evaluation rubric for that reviewer agent.

## Use It

`code/main.py` is a deterministic, stdlib-only model of the two core decisions this lesson covers:

1. A **stakeholder-context router** that takes a prompt description (audience level, decision type, belief state) and assigns it to one of four prompt templates with different framing strategies.
2. A **hypothesis-quality scorer** that takes a candidate hypothesis and scores it against five criteria: specificity, falsifiability, audience alignment, scope constraint, and challenge invitation. The scorer flags which criteria are missing and outputs a recommended rewrite.

No network, no real model — the point is to make the *framing policy* explicit, runnable, and inspectable. The same decision logic is what a prompt-review step in an agentic workflow would apply before sending a consultant's draft prompt to the underlying model.

## Ship It

`outputs/skill-consultative-prompt-designer.md` is a one-page, paste-and-use decision aid: given a consulting situation, it walks through the four-layer prompt structure, the hypothesis template, the output contract checklist, and the most common failure modes. Paste it into a system prompt or into a prompt review step.

## Exercises

1. Run `code/main.py`. Hypotheses 1 and 2 both score 1/5. Identify which specific criteria each is missing. Pick one and rewrite it to pass all five criteria. Confirm your rewrite would satisfy each criterion by tracing the scorer's rules.

2. Run `code/main.py` again and find the sample prompt that routes to the "board-level" template. Change the audience level to "operational team" and trace which template it now routes to and what framing changes.

3. Take a real prompt you have sent to an LLM in the last week. Score it against the five criteria in the hypothesis scorer. Which criterion was missing? Rewrite the prompt with that criterion added and compare the output in a live session.

4. Write a complete four-layer prompt (role, stakeholder context, hypothesis, output contract) for this situation: a client's steering committee is skeptical that an AI program will deliver ROI in 18 months; you need a memo that challenges or confirms that skepticism. Run it against any available model and note whether the output addresses the stated decision.

5. The reviewer agent in Phase 14 · 39 evaluates agent outputs against a rubric. Define a 3-criterion rubric — drawn from this lesson's output contract concept — that a reviewer agent could apply automatically to every consulting memo an LLM produces. Write the rubric as a Python dict that could feed directly into that reviewer's evaluation function.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Consultative prompting | "Better prompts for business" | Encoding role, stakeholder context, hypothesis, and output contract as a structured four-layer prompt |
| Hypothesis prompt | "Tell it what you think first" | Stating a working answer for the model to challenge or extend, not asking an open question |
| Stakeholder context | "Give it background" | Encoding the audience's level, existing belief, and decision type — not generic "executive" |
| Output contract | "Tell it the format" | Specifying format, length limit, and the exact decision the output must enable |
| Belief encoding | "Telling it what they think" | Explicitly stating the audience's current position so the model orients arguments to persuade, not survey |
| Pyramid principle | "Answer first" | Stating the conclusion before the argument; applied to prompts: state the hypothesis before the question |
| Sycophancy | "It always agrees with me" | Model tendency to confirm the user's stated position; countered by explicit challenge instructions |
| Ghost deck | "Adversarial draft" | Pre-client document iterated with a challenging co-author; the model plays this role in the hypothesis loop |

## Further Reading

- [Anthropic — Prompt engineering guide](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview) — official current reference for Claude-family prompt patterns, including role prompting and output formatting.
- [OpenAI — Prompt engineering best practices](https://platform.openai.com/docs/guides/prompt-engineering) — cross-vendor reference; patterns here apply across GPT-4o and Claude 4.x families.
- [Minto Pyramid Principle (Barbara Minto, 1987)](https://www.barbaraminto.com/) — the consulting communication framework that hypothesis-first prompting operationalizes.
- [SCQA framework — McKinsey communication standard](https://www.mckinsey.com/capabilities/mckinsey-design/our-insights/the-art-of-structured-communication) — Situation/Complication/Question/Answer; a direct mapping exists between SCQA and the four-layer prompt structure.
- [Anthropic — Claude model overview and capabilities](https://docs.claude.com/en/docs/about-claude/models/overview) — current model family (Sonnet 4.x, Opus 4.x, Haiku 4.x); the prompt patterns here apply to all tiers.
