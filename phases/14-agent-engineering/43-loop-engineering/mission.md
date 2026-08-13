# Mission - Loop Engineering

## Goal
Turn a bounded harness task into a loop with an explicit trigger, an independent evaluator, structured feedback, and a clean stop policy.

## Inputs
- The workbench pack from Phase 14 lessons 31-42
- One task with a machine-checkable acceptance condition
- A goal, scope, evidence, budget, and escalation rule

## Deliverables
- `code/main.py` with trigger semantics and a maker/evaluator runner
- `code/tests/test_main.py` with policy, feedback, stall, and trigger tests
- A short `goal.md` experiment comparing one manual run with one bounded loop run

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests
- Every loop exit has a status, reason, and round receipts
- The evaluator, not the maker, owns the completion decision
- Round receipts round-trip through the stdlib JSONL writer and reader

## Out of scope
- Calling a real model or scheduler. The reference is offline and deterministic.
- Irreversible production actions. Add approval and rollback before automating them.
- Graph topology and fan-out/fan-in. Those are the next lesson's concern.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
- `outputs/skill-loop-engineering.md` - extracted skill
