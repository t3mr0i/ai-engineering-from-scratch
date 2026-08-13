"""A framework-free graph runner with routing, checkpoints, and fan-in.

Lesson: phases/14-agent-engineering/44-graph-engineering/docs/en.md
References: Anthropic, "Building effective agents"; LangGraph graph API concepts.
Stdlib only; the reference graph runs offline with deterministic node functions.
Run: python3 main.py
"""

from __future__ import annotations

import copy
import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Callable, Mapping


class GraphError(RuntimeError):
    """Raised when a graph definition or run cannot make a safe decision."""


@dataclass(frozen=True)
class NodeResult:
    """A node's state patch, route label, and optional human pause."""

    updates: dict[str, object] = field(default_factory=dict)
    route: str = "default"
    pause: bool = False
    note: str = ""


NodeFunction = Callable[[dict[str, object]], NodeResult]


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    label: str = "default"


@dataclass(frozen=True)
class TraceEvent:
    step: int
    node: str
    route: str
    update_keys: tuple[str, ...]
    note: str


@dataclass(frozen=True)
class Checkpoint:
    """State after a node; `next_node` is the resume position."""

    next_node: str | None
    state: dict[str, object]
    trace_length: int


_CHECKPOINT_KEYS = {"next_node", "state", "trace_length"}


def _checkpoint_from_mapping(raw: object) -> Checkpoint:
    if not isinstance(raw, dict) or set(raw) != _CHECKPOINT_KEYS:
        raise GraphError("checkpoint must contain exactly next_node, state, and trace_length")
    next_node = raw["next_node"]
    if next_node is not None and not isinstance(next_node, str):
        raise GraphError("checkpoint next_node must be a string or null")
    state = raw["state"]
    if not isinstance(state, dict) or not all(isinstance(key, str) for key in state):
        raise GraphError("checkpoint state must be an object with string keys")
    trace_length = raw["trace_length"]
    if type(trace_length) is not int or trace_length < 0:
        raise GraphError("checkpoint trace_length must be a non-negative integer")
    return Checkpoint(next_node, copy.deepcopy(state), trace_length)


def save_checkpoint(checkpoint: Checkpoint, path: str | Path) -> None:
    """Atomically persist a JSON checkpoint that a fresh process can load."""

    if not isinstance(checkpoint, Checkpoint):
        raise GraphError("save_checkpoint expects a Checkpoint")
    payload = {
        "next_node": checkpoint.next_node,
        "state": copy.deepcopy(checkpoint.state),
        "trace_length": checkpoint.trace_length,
    }
    validated = _checkpoint_from_mapping(payload)
    try:
        encoded = json.dumps(
            {
                "next_node": validated.next_node,
                "state": validated.state,
                "trace_length": validated.trace_length,
            },
            sort_keys=True,
        )
    except (TypeError, ValueError) as exc:
        raise GraphError("checkpoint state must be JSON-serializable") from exc

    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(destination.name + ".tmp")
    try:
        temporary.write_text(encoded + "\n", encoding="utf-8")
        temporary.replace(destination)
    finally:
        if temporary.exists():
            temporary.unlink()


def load_checkpoint(path: str | Path) -> Checkpoint:
    """Load and validate a JSON checkpoint from disk."""

    try:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise GraphError(f"could not load checkpoint: {path}") from exc
    return _checkpoint_from_mapping(raw)


class GraphStatus(str, Enum):
    READY = "ready"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETE = "complete"


class GraphSpec:
    """A named graph whose edges make all routing choices reviewable."""

    def __init__(self) -> None:
        self.nodes: dict[str, NodeFunction] = {}
        self.edges: list[Edge] = []

    def add_node(self, name: str, function: NodeFunction) -> None:
        if not name or name in self.nodes:
            raise GraphError(f"node name is missing or already used: {name!r}")
        if not callable(function):
            raise GraphError(f"node function for {name!r} must be callable")
        self.nodes[name] = function

    def add_edge(self, source: str, target: str, label: str = "default") -> None:
        if source not in self.nodes or target not in self.nodes:
            raise GraphError("both edge endpoints must be registered nodes")
        if not label:
            raise GraphError("edge labels must not be empty")
        if any(e.source == source and e.label == label for e in self.edges):
            raise GraphError(f"duplicate route {source!r}:{label!r}")
        self.edges.append(Edge(source, target, label))

    def next_node(self, source: str, route: str) -> str | None:
        outgoing = [e for e in self.edges if e.source == source]
        matches = [e.target for e in outgoing if e.label == route]
        if len(matches) > 1:
            raise GraphError(f"route {source!r}:{route!r} has multiple targets")
        if not outgoing and route != "default":
            raise GraphError(f"unknown terminal route {source!r}:{route!r}")
        if not matches and outgoing:
            raise GraphError(f"unknown route {source!r}:{route!r}")
        return matches[0] if matches else None


class GraphRunner:
    """Execute one graph instance while recording state and checkpoints."""

    def __init__(self, graph: GraphSpec, initial_state: Mapping[str, object], start: str) -> None:
        if start not in graph.nodes:
            raise GraphError(f"unknown start node: {start}")
        self.graph = graph
        self.state: dict[str, object] = copy.deepcopy(dict(initial_state))
        self.current: str | None = start
        self.status = GraphStatus.READY
        self.trace: list[TraceEvent] = []
        self.checkpoints: list[Checkpoint] = []

    def step(self) -> None:
        if self.status in (GraphStatus.COMPLETE, GraphStatus.PAUSED):
            raise GraphError(f"cannot step while graph is {self.status.value}")
        if self.current is None:
            self.status = GraphStatus.COMPLETE
            return

        node_name = self.current
        result = self.graph.nodes[node_name](copy.deepcopy(self.state))
        if not isinstance(result, NodeResult):
            raise GraphError(f"node {node_name!r} did not return NodeResult")
        if type(result.pause) is not bool:
            raise GraphError(f"node {node_name!r} returned a non-bool pause flag")
        if not isinstance(result.route, str) or not result.route:
            raise GraphError(f"node {node_name!r} returned an invalid route")
        if not isinstance(result.updates, dict) or not all(
            isinstance(key, str) for key in result.updates
        ):
            raise GraphError(f"node {node_name!r} returned invalid updates")

        # Resolve the route before mutating state, trace, current, or checkpoints.
        # A route error is therefore a transaction abort, not a partial commit.
        if result.pause:
            if result.route != "default":
                raise GraphError(f"paused node {node_name!r} must use the default route")
            next_node = node_name
        else:
            next_node = self.graph.next_node(node_name, result.route)

        next_state = copy.deepcopy(self.state)
        next_state.update(copy.deepcopy(result.updates))
        event = TraceEvent(
            step=len(self.trace) + 1,
            node=node_name,
            route=result.route,
            update_keys=tuple(sorted(result.updates)),
            note=result.note,
        )

        self.state = next_state
        self.trace.append(event)
        self.current = next_node
        self.checkpoints.append(
            Checkpoint(next_node, copy.deepcopy(self.state), len(self.trace))
        )
        if result.pause:
            self.status = GraphStatus.PAUSED
        elif next_node is None:
            self.status = GraphStatus.COMPLETE
        else:
            self.status = GraphStatus.RUNNING

    def run(self, *, max_steps: int = 100) -> "GraphRunner":
        if self.status is GraphStatus.PAUSED:
            raise GraphError("resume() is required after a human pause")
        if self.status is GraphStatus.COMPLETE:
            return self
        previous_status = self.status
        self.status = GraphStatus.RUNNING
        try:
            for _ in range(max_steps):
                self.step()
                if self.status in (GraphStatus.PAUSED, GraphStatus.COMPLETE):
                    return self
            raise GraphError("step budget exhausted before graph reached a stop")
        except Exception:
            # A route/step-budget failure leaves the runner retryable from the
            # same committed node rather than marooning it in RUNNING.
            self.status = previous_status
            raise

    def resume(self, updates: Mapping[str, object] | None = None, *, max_steps: int = 100) -> "GraphRunner":
        if self.status is not GraphStatus.PAUSED:
            raise GraphError("resume() requires a paused graph")
        if updates:
            self.state.update(copy.deepcopy(dict(updates)))
        self.status = GraphStatus.READY
        return self.run(max_steps=max_steps)

    def restore(self, checkpoint: Checkpoint) -> None:
        """Restore a checkpoint without replaying or mutating its stored state."""

        if checkpoint.next_node is not None and checkpoint.next_node not in self.graph.nodes:
            raise GraphError(f"checkpoint points to unknown node: {checkpoint.next_node}")
        self.state = copy.deepcopy(checkpoint.state)
        self.current = checkpoint.next_node
        self.trace = self.trace[: checkpoint.trace_length]
        self.checkpoints = [copy.deepcopy(checkpoint)]
        self.status = GraphStatus.COMPLETE if self.current is None else GraphStatus.READY


BranchFunction = Callable[[dict[str, object]], Mapping[str, object]]


def fan_out_merge(
    initial_state: Mapping[str, object],
    branches: Mapping[str, BranchFunction],
    *,
    append_keys: set[str] | None = None,
) -> dict[str, object]:
    """Run isolated branches and merge their patches with explicit semantics.

    The calls are sequential in this stdlib teaching implementation so runs are
    deterministic. A production scheduler may execute them concurrently, but
    it still needs the same conflict policy at the fan-in boundary.
    """

    if not branches:
        raise GraphError("fan-out needs at least one branch")
    base = copy.deepcopy(dict(initial_state))
    append_keys = append_keys or set()
    merged: dict[str, object] = {
        key: copy.deepcopy(value) for key, value in base.items() if key in append_keys
    }
    for name, branch in branches.items():
        patch = dict(branch(copy.deepcopy(base)))
        for key, value in patch.items():
            if key not in merged:
                merged[key] = copy.deepcopy(value)
                continue
            if key in append_keys and isinstance(merged[key], list) and isinstance(value, list):
                merged[key] = [*merged[key], *copy.deepcopy(value)]
                continue
            if merged[key] != value:
                raise GraphError(f"fan-in conflict for {key!r} from branch {name!r}")
    result = copy.deepcopy(base)
    result.update(merged)
    return result


def _append_history(state: dict[str, object], event: str) -> list[str]:
    history = list(state.get("history", []))
    history.append(event)
    return history


def research_node(state: dict[str, object]) -> NodeResult:
    requirements = str(state.get("requirements", "")).strip()
    if not requirements:
        requirements = "implement validation and prove it with tests"
    return NodeResult(
        updates={
            "requirements": requirements,
            "history": _append_history(state, "research"),
        },
        note="requirements are explicit before implementation",
    )


def implement_node(state: dict[str, object]) -> NodeResult:
    attempts = int(state.get("attempts", 0)) + 1
    artifact = "implementation" if attempts == 1 else "implementation + tests + validation"
    return NodeResult(
        updates={
            "artifact": artifact,
            "attempts": attempts,
            "history": _append_history(state, "implement"),
        },
        note=f"implementation attempt {attempts}",
    )


def verify_node(state: dict[str, object]) -> NodeResult:
    if not str(state.get("requirements", "")).strip():
        return NodeResult(
            updates={"review": "needs_research", "history": _append_history(state, "verify")},
            route="needs_research",
            note="verification lacks requirements",
        )
    artifact = str(state.get("artifact", ""))
    missing = [item for item in ("tests", "validation") if item not in artifact]
    if missing:
        return NodeResult(
            updates={
                "review": "fail",
                "feedback": "missing: " + ", ".join(missing),
                "history": _append_history(state, "verify"),
            },
            route="fail",
            note="verification returned actionable feedback",
        )
    return NodeResult(
        updates={"review": "pass", "history": _append_history(state, "verify")},
        route="pass",
        note="verification evidence is complete",
    )


def approval_node(state: dict[str, object]) -> NodeResult:
    approval = state.get("approval")
    if approval is None:
        return NodeResult(
            updates={"approval_request": "approve or reject the verified change"},
            pause=True,
            note="human approval required before merge",
        )
    route = "approved" if approval == "approved" else "rejected"
    # A decision is a one-shot input. Rejection must not poison the next
    # approval request after the graph repairs the artifact.
    return NodeResult(
        updates={"approval": None, "history": _append_history(state, "approval")},
        route=route,
    )


def merge_node(state: dict[str, object]) -> NodeResult:
    return NodeResult(
        updates={"merged": True, "history": _append_history(state, "merge")},
        note="merge is deterministic and happens after approval",
    )


def build_demo_graph() -> GraphSpec:
    graph = GraphSpec()
    for name, function in (
        ("research", research_node),
        ("implement", implement_node),
        ("verify", verify_node),
        ("approval", approval_node),
        ("merge", merge_node),
    ):
        graph.add_node(name, function)
    graph.add_edge("research", "implement")
    graph.add_edge("implement", "verify")
    graph.add_edge("verify", "implement", label="fail")
    graph.add_edge("verify", "research", label="needs_research")
    graph.add_edge("verify", "approval", label="pass")
    graph.add_edge("approval", "merge", label="approved")
    graph.add_edge("approval", "implement", label="rejected")
    return graph


def main() -> None:
    runner = GraphRunner(build_demo_graph(), {"requirements": "", "attempts": 0}, "research")
    runner.run()
    print(f"paused={runner.status.value} node={runner.current} checkpoints={len(runner.checkpoints)}")
    runner.resume({"approval": "approved"})
    print(f"status={runner.status.value} merged={runner.state['merged']} trace={[e.node for e in runner.trace]}")
    parallel = fan_out_merge(
        {"artifact": "implementation"},
        {
            "tests": lambda state: {"evidence": ["tests:pass"]},
            "security": lambda state: {"evidence": ["security:pass"]},
        },
        append_keys={"evidence"},
    )
    print(f"fan_in={parallel['evidence']}")


if __name__ == "__main__":
    main()
