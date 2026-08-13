# Mission - Prompt-Only vs Rules-First

## Goal
Run one scoped fixture task through a prompt-only worker and a rules-first worker, then compare their independent validation receipts.

## Inputs
- A task goal, allowed paths, and required checks
- The deterministic workers in `code/main.py`

## Deliverables
- `code/main.py` comparison runner
- `code/tests/test_main.py` with contract and verdict tests
- A reusable prompt-versus-rules comparison skill

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero.
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests.
- The same validator rejects the prompt-only attempt and accepts the rules-first attempt.

## Out of scope
- Calling a real model or changing a production repository.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
