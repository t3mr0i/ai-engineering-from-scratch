# Iteration Scheduler — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to model a research workflow as a hypothesis queue feeding parallel experiment slots whose results fan back in.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Run multiple experiments concurrently with asyncio so the scheduler can keep all slots busy.
- **Evidence to retain:** the input, output, and invariant needed to score each hypothesis branch with UCB so the scheduler can prune low-yield branches without abandoning exploration.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can fan out finished results to a paper-write stage and a re-queue stage so a high-yield branch spawns follow-up hypotheses.
- Run the lesson tests after adapting the implementation to a new project.

