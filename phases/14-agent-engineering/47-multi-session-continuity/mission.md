# Mission - Multi-Session Continuity

## Goal
Persist a validated task state, resume it in a second session, and emit a reviewable handoff packet.

## Inputs
- A versioned session state schema
- One task with progress, touched files, and a next action

## Deliverables
- `code/main.py` atomic state writer, loader, and handoff builder
- `code/tests/test_main.py` with schema, resume, and receipt tests
- A reusable session-handoff skill

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero.
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests.
- A fresh load preserves completed steps, blockers, touched files, and one next action.

## Out of scope
- Distributed locking, branch synchronization, or external state services.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
