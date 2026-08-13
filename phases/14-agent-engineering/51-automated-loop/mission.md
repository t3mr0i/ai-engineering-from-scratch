# Mission - Automated Loop

## Goal
Replace repeated manual prompting with explicit trigger semantics, a bounded maker/evaluator loop, and round receipts.

## Inputs
- One goal with machine-checkable acceptance
- A maker, evaluator, feedback path, and stop policy

## Deliverables
- `code/main.py` trigger and loop runner
- `code/tests/test_main.py` with trigger, feedback, budget, and stall tests
- A reusable automated-loop skill

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero.
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests.
- Every loop exit has a status, reason, and round receipts.

## Out of scope
- Real schedulers, model calls, irreversible actions, or unbounded retries.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
