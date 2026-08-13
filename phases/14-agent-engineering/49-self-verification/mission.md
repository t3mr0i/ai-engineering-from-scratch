# Mission - Self-Verification

## Goal
Run independent named checks and produce a fail-closed verification report with evidence for every result.

## Inputs
- A temporary candidate artifact
- Required file and acceptance checks

## Deliverables
- `code/main.py` verification aggregator and evidence types
- `code/tests/test_main.py` with pass, fail, exception, and malformed-check tests
- A reusable verification-report skill

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero.
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests.
- Missing checks, exceptions, and failed evidence cannot produce a passing report.

## Out of scope
- Calling a judge model or replacing deterministic acceptance commands.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
