# Mission - Agent-Readable Workspace

## Goal
Build a deterministic repository index and select a small progressive-disclosure read set for a task.

## Inputs
- A temporary fixture workspace with router, source, docs, and generated output
- A task description used for ranking

## Deliverables
- `code/main.py` index and ranking implementation
- `code/tests/test_main.py` with filtering, ordering, and ranking tests
- A reusable workspace-index skill

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero.
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests.
- Generated directories are excluded and the root router is included first.

## Out of scope
- Building a semantic code search engine or indexing a real repository during the lesson.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
