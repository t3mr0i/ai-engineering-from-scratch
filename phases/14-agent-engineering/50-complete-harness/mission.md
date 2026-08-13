# Mission - Complete Harness

## Goal
Compose instructions, state, scope, feedback, verification, review, and handoff into one readiness report.

## Inputs
- A task contract with allowed paths and required checks
- Complete and intentionally incomplete fixture candidates

## Deliverables
- `code/main.py` framework-free harness control plane
- `code/tests/test_main.py` with surface and handoff tests
- A reusable complete-harness skill

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero.
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests.
- Scope, feedback, verification, and review failures block readiness and leave a next action.

## Out of scope
- Automatic production deployment or vendor SDK integration.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
