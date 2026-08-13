# Mission - Graph Engineering

## Goal
Make a multi-step agent workflow explicit as nodes, edges, shared state, routing rules, checkpoints, and approval boundaries.

## Inputs
- The bounded loop from Phase 14 lesson 43
- A task with at least one meaningful verification or rollback path
- A state contract that names owners and merge semantics

## Deliverables
- `code/main.py` with a framework-free graph runner
- `code/tests/test_main.py` with routing, checkpoint, pause, fan-in, and failure tests
- A graph description listing every node, edge, state field, and route label

## Acceptance
- From the lesson directory, `cd code && python3 main.py` exits zero
- From the lesson directory, `cd code && python3 -m unittest discover tests -v` reports at least five passing tests
- A failed verification routes to a named repair node
- A missing approval pauses the graph and an explicit approval resumes it
- Conflicting parallel updates fail at fan-in instead of being silently overwritten
- A JSON checkpoint round-trips into a fresh runner and resumes successfully

## Out of scope
- Calling an external model or graph framework. The reference stays stdlib-first.
- Treating a diagram as a substitute for replayability, verification, or observability.
- Parallel writes without a declared merge policy.

## References
- `docs/en.md` - full lesson
- `code/main.py` - reference implementation
- `outputs/skill-graph-engineering.md` - extracted skill
