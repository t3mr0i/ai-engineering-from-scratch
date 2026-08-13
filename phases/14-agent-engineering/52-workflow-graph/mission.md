# Mission - Workflow Graph

## Goal
Turn a bounded loop into an explicit graph with labeled routes, checkpoints, fan-in rules, rollback, and approval.

## Inputs
- Research, implementation, verification, approval, and merge nodes
- A graph state with a failing and a passing verification path

## Deliverables
- `code/main.py` framework-free graph runner
- `code/tests/test_main.py` with route, checkpoint, approval, and merge tests
- A reusable workflow-graph skill

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero.
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests.
- Unknown routes fail closed, missing approval pauses, and conflicting fan-in updates are rejected.

## Out of scope
- A production scheduler, parallel threads, or a specific graph framework.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
