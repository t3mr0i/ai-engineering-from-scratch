# Benchmarks: SWE-bench, GAIA, AgentBench

> Three benchmarks anchor agent evaluation in 2026. SWE-bench tests code patching. GAIA tests generalist tool use. AgentBench tests multi-environment reasoning. Know their composition, their contamination story, and what they do not measure.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 14 · 06 (Tool Use)
**Time:** ~60 minutes

## Learning Objectives

- Name SWE-bench's test harness (FAIL_TO_PASS) and explain why it gates on unit tests.
- Explain why SWE-bench Verified (OpenAI, 500 tasks) exists and what it removes.
- Describe GAIA's design: simple for humans, hard for AI; three difficulty levels.
- Name AgentBench's eight environments and its primary blocker for open-source LLMs.
- Summarize the SWE-bench+ contamination finding and its implications.

## The Problem

Leaderboards tell you which model wins on one benchmark. They do not tell you:

- Whether the benchmark is contaminated (solutions in training data, test leakage).
- Whether the benchmark measures what you care about (code vs browsing vs generalist).
- Whether the evaluator is robust (AST matching, state checks, human review).

Know the three anchoring benchmarks and their failure modes before you quote a number.

## The Concept

### SWE-bench (Jimenez et al., ICLR 2024 oral)

- 2,294 real GitHub issues from 12 popular Python repos.
- Agent gets: the codebase at the pre-fix commit + natural-language issue description.
- Agent produces: a patch.
- Evaluator: apply patch, run the repo's test suite. The patch must flip FAIL_TO_PASS tests (previously failing, now passing) without breaking PASS_TO_PASS tests.

SWE-agent (Yang et al., 2024) hit 12.5% at release by emphasizing agent-computer interfaces (file editor commands, search syntax the model understands).

### SWE-bench Verified

OpenAI, Aug 2024. Human-curated 500-task subset. Removes ambiguous issues, unreliable tests, and tasks where the fix was unclear. Primary benchmark for "does your agent ship real patches?"

### Contamination

- Over 94% of SWE-bench issues predate most model cutoffs.
- **SWE-bench+** found 32.67% of successful patches leaked solutions in the issue text (model saw the fix in the description), and 31.08% were suspicious due to weak test coverage.
- Verified is cleaner but not contamination-free.

**Hypothetical example.** A model reported at 50% on SWE-bench could score 35% on a separately audited variant. Always name the exact benchmark and split instead of transferring a score between them.

### GAIA (Mialon et al., Nov 2023)

- 466 questions; 300 retained for the private leaderboard at huggingface.co/gaia-benchmark.
- Design philosophy: "conceptually simple for humans (92%) but hard for AI (GPT-4 with plugins: 15%)."
- Tests reasoning, multi-modality, web, tool use.
- Three difficulty levels; Level 3 requires long tool chains across modalities.

GAIA is what you run to measure "generalist capability." Do not confuse with code-specific benchmarks.

### AgentBench (Liu et al., ICLR 2024)

- 8 environments across code (Bash, DB, KG), games (Alfworld, LTP), web (WebShop, Mind2Web), and open-ended generation.
- Multi-turn, ~4k-13k turns per split.
- Primary finding: long-term reasoning, decision-making, and instruction following are the blockers for OSS LLMs catching up to commercial.

### What these do not measure

- Real-world operational cost (tokens, wall-clock).
- Safety behavior in adversarial conditions.
- Performance on your domain (use your own evals, Lesson 30).
- Tail failures (benchmarks average; production operators care about the worst 1%).

### Where benchmarking goes wrong

- **Single-number fixation.** SWE-bench 50% tells you less than the P50/P75/P95 cost + step distribution.
- **Contaminated claims.** Reporting SWE-bench without mentioning Verified or SWE-bench+ is misleading.
- **Benchmark-as-development-target.** Optimizing for the benchmark diverges from production usefulness.




## Build It

Reconstruct **Benchmarks: SWE-bench, GAIA, AgentBench** by following `Task` on the smallest valid record {"id": 1}. Run `python3 main.py` and verify that validation names the missing field or rejects the request; it must not silently accept an incomplete record.

## Use It

Call `Task` from a small caller with the smallest valid record {"id": 1}. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-benchmark-harness.md` with the command `python3 main.py`, the accepted input shape (the smallest valid record {"id": 1}), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Jimenez et al., SWE-bench (arXiv:2310.06770)](https://arxiv.org/abs/2310.06770) — the original benchmark
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — the curated subset
- [Mialon et al., GAIA (arXiv:2311.12983)](https://arxiv.org/abs/2311.12983) — generalist benchmark
- [Liu et al., AgentBench (arXiv:2308.03688)](https://arxiv.org/abs/2308.03688) — multi-environment suite

## Exercises

Work from the smallest fixture that the Benchmarks: SWE-bench, GAIA, AgentBench demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the smallest valid record {"id": 1}. Follow `Task`, `TaskResult`, `run_task`. Expect validation names the missing field or rejects the request; it must not silently accept an incomplete record; capture the first printed shape, metric, status, or summary field and state which part supports **Name SWE-bench's test harness (FAIL_TO_PASS) and explain why it gates on unit tests.**.
2. **Perturb one field.** Repeat the command after changing only the optional field: use the same record with one optional field changed. Predict the direction of the change, then compare the two output values. Explain why **Explain why SWE-bench Verified (OpenAI, 500 tasks) exists and what it removes.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation a record missing the required "id" field. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe GAIA's design: simple for humans, hard for AI; three difficulty levels.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-benchmark-harness.md` and add a worked example using the smallest valid record {"id": 1}. Include the input contract, one expected output field, and a named acceptance check for **Name AgentBench's eight environments and its primary blocker for open-source LLMs.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Benchmarks: SWE-bench, GAIA, AgentBench** should contain:

- the `python3 main.py` output for the smallest valid record {"id": 1}, with `Task`, `TaskResult`, `run_task` traced to the value or shape that supports **Name SWE-bench's test harness (FAIL_TO_PASS) and explain why it gates on unit tests.**;
- a before/after comparison for the optional field, where the same record with one optional field changed changes the observation in the direction predicted by **Explain why SWE-bench Verified (OpenAI, 500 tasks) exists and what it removes.**;
- a recorded result for a record missing the required "id" field that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe GAIA's design: simple for humans, hard for AI; three difficulty levels.**; and
- an updated `outputs/skill-benchmark-harness.md` example with a concrete input, expected output field, and acceptance check tied to **Name AgentBench's eight environments and its primary blocker for open-source LLMs.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
