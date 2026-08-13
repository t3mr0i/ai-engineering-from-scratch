# Mission - Runtime Feedback and Scope

## Goal
Validate task paths and run bounded argv commands while preserving exit, output, and timeout evidence.

## Inputs
- A scope contract with allowed and forbidden patterns
- Successful, failed, and timed-out fixture commands

## Deliverables
- `code/main.py` scope checker and command receipt runner
- `code/tests/test_main.py` with scope, failure, timeout, and ordering tests
- A reusable runtime-feedback skill

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero.
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests.
- Forbidden paths, non-zero exits, stderr, and timeouts remain explicit in receipts.

## Out of scope
- Shell pipelines, production writes, or retry scheduling.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
