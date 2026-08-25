# Skill Libraries and Lifelong Learning (Voyager)

> Voyager (Wang et al., TMLR 2024) treats executable code as a skill. Skills are named, retrievable, composable, and refined by environment feedback. This is the reference architecture for Claude Agent SDK skills, skillkit, and the 2026 skill-library pattern.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## Learning Objectives

- Name Voyager's three components — automatic curriculum, skill library, iterative prompting — and the role of each.
- Explain why Voyager makes the action space code, not primitive commands.
- Implement a stdlib skill library with registration, retrieval, composition, and failure-driven refinement.
- Map Voyager's pattern onto the 2026 Claude Agent SDK skills and the skillkit ecosystem.

## The Problem

Agents that rebuild every capability from scratch in every session do three things wrong:

1. **Waste tokens.** Every task re-elicits the same reasoning.
2. **Lose progress.** A correction learned in session A doesn't transfer to session B.
3. **Fail on long-horizon composition.** Complex tasks need capability hierarchies; one-shot prompts cannot express them.

Voyager's answer: treat each reusable capability as a named chunk of code stored in a library, retrievable by similarity, composable with other skills, and refined by execution feedback.

## The Concept

### Three components

Voyager (arXiv:2305.16291) structures an agent around:

1. **Automatic curriculum.** A curiosity-driven proposer picks the next task based on the agent's current skill set and environment state. Exploration is bottom-up.
2. **Skill library.** Each skill is executable code. New skills are added when a task succeeds. Skills are retrieved by query-to-description similarity.
3. **Iterative prompting mechanism.** On failure, the agent receives execution errors, environment feedback, and self-verification output, then refines the skill.

The Minecraft evaluation (Wang et al., 2024): 3.3x more unique items, 8.5x faster stone tools, 6.4x faster iron tools, 2.3x longer map traversal versus baselines. The numbers are Minecraft-specific, but the pattern transfers.

### Action space = code

Most agents emit primitive commands. Voyager emits JavaScript functions. A skill is:

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

Composed from sub-skills. Stored keyed on description and embedding. Retrieved as a program, not a prompt.

This is the 2026 Claude Agent SDK skill: a named, retrievable chunk of code plus instructions the agent loads on demand.

### Skill retrieval

New task "make a diamond pickaxe." Agent:

1. Embeds the task description.
2. Queries the skill library for top-k similar skills.
3. Retrieves `craftIronPickaxe`, `mineDiamond`, `placeCraftingTable` etc.
4. Composes the new skill from retrieved primitives + new logic.

This is the pattern MCP resources (Phase 13) and Agent SDK skills implement: retrieval over a knowledge/code surface, scoped to the current task.

### Iterative refinement

Voyager's feedback loop:

1. Agent writes a skill.
2. Skill runs against the environment.
3. One of three signals returns: `success`, `error` (with stack trace), `self-verification failure`.
4. Agent rewrites the skill using the signal as context.
5. Loop until success or max rounds.

This is Self-Refine (Lesson 05) applied to code generation with environment-grounded verification. CRITIC (Lesson 05) is the same pattern with external tools as the verifier.

### Curriculum and exploration

Voyager's curriculum module proposes tasks like "build a shelter near the lake" based on what the agent has and what it has not yet done. The proposer uses the environment state + skill inventory to pick a task just above current capability — the exploration sweet spot.

For production agents this translates to a "what's missing" operator: given the current skill library and a domain, what skills are we not yet covering? Teams typically implement this manually as curriculum review.

### Where this pattern goes wrong

- **Skill library rot.** Same skill added 10 times with slightly different descriptions. Add deduplication on write; retrieval returns only one.
- **Composed-skill drift.** Parent skill depends on a child that was refined. Version skills; a parent pinned to v1 doesn't magically pick up v3.
- **Retrieval quality.** Vector retrieval over skill descriptions degrades as the library grows past a few hundred. Supplement with tag filters and hard constraints ("only skills with `category=tooling`").




## Build It

Reconstruct **Skill Libraries and Lifelong Learning (Voyager)** by following `Skill` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `Skill` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-skill-library.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) — the original skill-library paper
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — skills as the 2026 productization
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — skills and subagents in practice
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) — the refinement loop underneath Voyager

## Exercises

Keep two runs side by side for **Skill Libraries and Lifelong Learning (Voyager)**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using the text "red fox". Follow `Skill`, `SkillLibrary`, `register`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Name Voyager's three components — automatic curriculum, skill library, iterative prompting — and the role of each.**.
2. **Run a two-value comparison.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Explain why Voyager makes the action space code, not primitive commands.** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Implement a stdlib skill library with registration, retrieval, composition, and failure-driven refinement.** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-skill-library.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Map Voyager's pattern onto the 2026 Claude Agent SDK skills and the skillkit ecosystem.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Skill Libraries and Lifelong Learning (Voyager)** should contain:

- the `python3 main.py` output for the text "red fox", with `Skill`, `SkillLibrary`, `register` traced to the value or shape that supports **Name Voyager's three components — automatic curriculum, skill library, iterative prompting — and the role of each.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Explain why Voyager makes the action space code, not primitive commands.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Implement a stdlib skill library with registration, retrieval, composition, and failure-driven refinement.**; and
- an updated `outputs/skill-skill-library.md` example with a concrete input, expected output field, and acceptance check tied to **Map Voyager's pattern onto the 2026 Claude Agent SDK skills and the skillkit ecosystem.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
