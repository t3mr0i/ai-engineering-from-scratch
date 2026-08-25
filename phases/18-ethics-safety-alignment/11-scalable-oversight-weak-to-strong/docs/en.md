# Scalable Oversight and Weak-to-Strong Generalization

> Burns et al. (OpenAI Superalignment, "Weak-to-Strong Generalization", 2023) proposed a proxy for the superalignment problem: fine-tune a strong model using labels produced by a weaker model. If the strong model generalizes correctly from imperfect weak supervision, current human-scale alignment methods may extend to superhuman systems. Scalable oversight and W2SG are complementary. Scalable oversight (debate, recursive reward modeling, task decomposition) increases the overseer's effective capability so it can keep up with the model under oversight. W2SG ensures the strong model generalizes correctly from whatever imperfect supervision the overseer provides. Debate Helps W2SG (arXiv:2501.13124, January 2025) combines them.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 18 · 01 (instruction-following), Phase 18 · 10 (AI Control), Phase 09 (RL foundations)
**Time:** ~60 minutes

## Learning Objectives

- Define scalable oversight and weak-to-strong generalization and explain how they are complementary.
- Describe the Burns et al. 2023 experimental setup: fine-tune GPT-4 using labels from GPT-2.
- Explain the performance gap recovered (PGR) metric and what it measures.
- State the three major scalable-oversight mechanisms (debate, recursive reward modeling, task decomposition) and one strength of each.

## The Problem

Every alignment technique so far in Phase 18 assumes the overseer can evaluate the model's behaviour. When the model is superhuman, the overseer is the weak link. The superalignment question: can a weaker supervisor reliably produce a stronger, aligned model?

Burns et al. reduce this to an operationalized empirical setup: supervise strong with weak, measure how much of the strong model's capability survives the weak supervision. This is not a solution to superalignment — it is a proxy that lets us measure progress.

## The Concept

### W2SG: the Burns et al. setup

- Weak model: GPT-2 class.
- Strong model: GPT-4 class.
- Target: strong GPT-4 ceiling on the task.

Procedure:
1. Get weak model's zero-shot predictions on a task.
2. Fine-tune the strong model on weak-labeled data.
3. Measure the strong fine-tuned model's accuracy.

Baselines: weak model's own accuracy, strong model's supervised ceiling on gold labels.

Gap metric: Performance Gap Recovered (PGR) = (fine-tuned - weak) / (ceiling - weak). PGR of 1.0 means weak supervision fully closes the gap; PGR of 0 means weak supervision did not help.

### Burns et al. empirical findings

Across NLP, chess-puzzle, and reward-modeling tasks, PGR was consistently positive: the strong model generalized beyond the weak supervisor's mistakes. Task-specific PGR varied from ~20% to ~80%. The strong model "understands" the intended task from imperfect labels, filling in with its pre-trained priors.

Limitations Burns et al. note:
- The weak-to-strong gap here is capability, not alignment. The weak model is aligned; a truly superhuman model might be aligned by a human but with a much larger capability gap.
- The strong model's generalization may be more about task priors than about recovering ground-truth intent.
- Eliciting the strong model's latent knowledge is the real problem; PGR measures a specific operationalization.

### Scalable oversight: three mechanisms

- **Debate (Irving et al. 2018).** Two instances of U argue opposite sides; the weak judge decides. The assumption: finding a convincing true answer is easier than finding a convincing false answer. Recent 2024-2025 work (Khan et al., Michael et al.) shows debate sometimes helps and sometimes does not, and whether it helps depends on task structure.
- **Recursive Reward Modeling (Leike et al. 2018).** U helps the human train the reward model for U+1. The overseer's effective capability grows with the model's.
- **Task Decomposition (Christiano, Shlegeris, Amodei 2018).** Decompose a hard task into sub-tasks the human can check, recursively. Assumes decomposability.

Each mechanism assumes something about the structure of the task or the alignment of the intermediate components.

### Why scalable oversight and W2SG are complementary

Scalable oversight increases the overseer's effective signal quality.
W2SG closes the gap from whatever imperfect signal the overseer can provide.

Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124) combines them: a debate protocol provides better weak labels, and the strong model is trained on those labels. Reported PGR gains on NLP tasks.

### The organizational drama

OpenAI's Superalignment team dissolved in May 2024 after Jan Leike's departure to Anthropic. The agenda (scalable oversight, W2SG, automated alignment research) continued at Anthropic and at academic labs — MATS (Lesson 28), Redwood (Lesson 10), Apollo (Lesson 8), METR (Lesson 28). The organizational structure changed; the research questions did not.

### Where this fits in Phase 18

Lessons 6-10 describe the threat and the defensive paradigm under the assumption U is untrustworthy. Lesson 11 is the offensive paradigm: make the overseer strong enough to verify U's alignment. Lessons 12-16 then turn to the practical tooling of adversarial evaluation.



## Build It

Reconstruct **Scalable Oversight and Weak-to-Strong Generalization** by following `gen` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `gen` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-w2sg-pgr.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) — the W2SG paper
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) — the debate mechanism
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) — recursive reward modeling
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) — 2024 empirical study of debate with stronger debaters
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) — 2025 combination of debate + W2SG

## Exercises

Work from the smallest fixture that the Scalable Oversight and Weak-to-Strong Generalization demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `gen`, `weak_label`, `train_strong`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Define scalable oversight and weak-to-strong generalization and explain how they are complementary.**.
2. **Perturb one field.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Describe the Burns et al. 2023 experimental setup: fine-tune GPT-4 using labels from GPT-2.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Explain the performance gap recovered (PGR) metric and what it measures.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-w2sg-pgr.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **State the three major scalable-oversight mechanisms (debate, recursive reward modeling, task decomposition) and one strength of each.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Scalable Oversight and Weak-to-Strong Generalization** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `gen`, `weak_label`, `train_strong` traced to the value or shape that supports **Define scalable oversight and weak-to-strong generalization and explain how they are complementary.**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Describe the Burns et al. 2023 experimental setup: fine-tune GPT-4 using labels from GPT-2.**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Explain the performance gap recovered (PGR) metric and what it measures.**; and
- an updated `outputs/skill-w2sg-pgr.md` example with a concrete input, expected output field, and acceptance check tied to **State the three major scalable-oversight mechanisms (debate, recursive reward modeling, task decomposition) and one strength of each.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
