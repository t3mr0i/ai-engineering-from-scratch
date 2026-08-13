"""Run an explicit workflow graph with routing, approval, checkpoints, and merge.

Lesson: phases/14-agent-engineering/52-workflow-graph/docs/en.md
References: Python dataclasses, copy, and JSON standard-library contracts.
The graph is deterministic and framework-free so every route is testable.
Run: python3 main.py
"""

from __future__ import annotations

import copy
import json
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Callable, Mapping


class GraphError(RuntimeError):
    pass


class Status(str, Enum):
    READY = "ready"
    PAUSED = "paused"
    COMPLETE = "complete"


@dataclass(frozen=True)
class NodeResult:
    updates: dict[str, object] = field(default_factory=dict)
    route: str = "default"
    pause: bool = False
    note: str = ""


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    label: str


@dataclass(frozen=True)
class Checkpoint:
    next_node: str | None
    state: dict[str, object]
    trace_length: int


@dataclass(frozen=True)
class Trace:
    step: int
    node: str
    route: str
    note: str


Node = Callable[[dict[str, object]], NodeResult]


class Graph:
    def __init__(self):
        self.nodes: dict[str, Node] = {}
        self.edges: list[Edge] = []

    def add_node(self, name: str, node: Node) -> None:
        if not name.strip() or name in self.nodes or not callable(node):
            raise GraphError(f"invalid or duplicate node: {name!r}")
        self.nodes[name] = node

    def add_edge(self, source: str, target: str, label: str = "default") -> None:
        if source not in self.nodes or target not in self.nodes or not label.strip():
            raise GraphError("edge endpoints and label must be registered")
        if any(edge.source == source and edge.label == label for edge in self.edges):
            raise GraphError(f"duplicate route: {source}:{label}")
        self.edges.append(Edge(source, target, label))

    def next(self, source: str, route: str) -> str | None:
        outgoing = [edge for edge in self.edges if edge.source == source]
        matches = [edge.target for edge in outgoing if edge.label == route]
        if len(matches) > 1 or (outgoing and not matches) or (not outgoing and route != "default"):
            raise GraphError(f"unknown or ambiguous route: {source}:{route}")
        return matches[0] if matches else None


class GraphRunner:
    def __init__(self, graph: Graph, initial: Mapping[str, object], start: str):
        if start not in graph.nodes:
            raise GraphError(f"unknown start node: {start}")
        self.graph = graph
        self.state = copy.deepcopy(dict(initial))
        self.current: str | None = start
        self.status = Status.READY
        self.trace: list[Trace] = []
        self.checkpoints: list[Checkpoint] = []

    def step(self) -> None:
        if self.status in (Status.PAUSED, Status.COMPLETE):
            raise GraphError(f"cannot step while {self.status.value}")
        if self.current is None:
            self.status = Status.COMPLETE
            return
        node_name = self.current
        result = self.graph.nodes[node_name](copy.deepcopy(self.state))
        if not isinstance(result, NodeResult) or not isinstance(result.route, str) or not result.route:
            raise GraphError(f"node {node_name} returned invalid result")
        if result.pause and result.route != "default":
            raise GraphError("paused nodes must use the default route")
        next_node = node_name if result.pause else self.graph.next(node_name, result.route)
        next_state = copy.deepcopy(self.state)
        next_state.update(copy.deepcopy(result.updates))
        self.state = next_state
        self.trace.append(Trace(len(self.trace) + 1, node_name, result.route, result.note))
        self.current = next_node
        self.checkpoints.append(Checkpoint(next_node, copy.deepcopy(self.state), len(self.trace)))
        self.status = Status.PAUSED if result.pause else Status.READY
        if next_node is None and not result.pause:
            self.status = Status.COMPLETE

    def run(self, max_steps: int = 50) -> None:
        if max_steps < 1:
            raise ValueError("max_steps must be positive")
        steps = 0
        while self.current is not None and self.status is not Status.PAUSED:
            if steps >= max_steps:
                raise GraphError("step budget exhausted")
            self.step()
            steps += 1

    def resume(self, updates: Mapping[str, object]) -> None:
        if self.status is not Status.PAUSED or self.current is None:
            raise GraphError("graph is not paused")
        decision = updates.get("approval")
        if decision not in {"approved", "rejected"}:
            raise GraphError("approval must be approved or rejected")
        self.state.update(copy.deepcopy(dict(updates)))
        self.state["approval"] = decision
        self.status = Status.READY

    def restore(self, checkpoint: Checkpoint) -> None:
        if checkpoint.next_node is not None and checkpoint.next_node not in self.graph.nodes:
            raise GraphError("checkpoint points to unknown node")
        if checkpoint.trace_length < 0:
            raise GraphError("checkpoint trace length must be non-negative")
        self.current = checkpoint.next_node
        self.state = copy.deepcopy(checkpoint.state)
        self.trace = self.trace[: checkpoint.trace_length]
        self.status = Status.READY if self.current is not None else Status.COMPLETE


def fan_out_merge(initial: Mapping[str, object], branches: Mapping[str, Callable[[dict[str, object]], Mapping[str, object]]], *, append_keys: set[str] | None = None) -> dict[str, object]:
    append_keys = append_keys or set()
    merged = copy.deepcopy(dict(initial))
    for name, branch in branches.items():
        update = dict(branch(copy.deepcopy(dict(initial))))
        for key, value in update.items():
            if key in append_keys:
                current = merged.setdefault(key, [])
                if not isinstance(current, list) or not isinstance(value, list):
                    raise GraphError(f"append field must be lists: {key}")
                current.extend(copy.deepcopy(value))
            elif key in merged and merged[key] != value:
                raise GraphError(f"conflicting scalar update for {key} from {name}")
            else:
                merged[key] = copy.deepcopy(value)
    return merged


def demo_graph() -> Graph:
    graph = Graph()
    graph.add_node("research", lambda state: NodeResult({"requirements": state.get("requirements") or "known"}, note="requirements recorded"))

    def implement(state):
        attempts = int(state.get("attempts", 0)) + 1
        return NodeResult({"artifact": "implementation", "attempts": attempts}, note=f"attempt {attempts}")

    def verify(state):
        passed = state.get("artifact") == "implementation" and int(state.get("attempts", 0)) >= 2
        return NodeResult({"review": "pass" if passed else "fail"}, route="pass" if passed else "fail", note="verification evaluated")

    def approval(state):
        decision = state.get("approval")
        if decision is None:
            return NodeResult(pause=True, note="waiting for human approval")
        if decision not in {"approved", "rejected"}:
            raise GraphError("approval must be approved or rejected")
        # Consume the decision in the approval node. A rejection can therefore
        # take the repair edge once without being reused at the next gate.
        return NodeResult({"approval": None}, route=decision, note=f"approval consumed: {decision}")

    graph.add_node("implement", implement)
    graph.add_node("verify", verify)
    graph.add_node("approval", approval)
    graph.add_node("merge", lambda state: NodeResult({"merged": True}, note="deterministic merge"))
    graph.add_edge("research", "implement")
    graph.add_edge("implement", "verify")
    graph.add_edge("verify", "approval", "pass")
    graph.add_edge("verify", "implement", "fail")
    graph.add_edge("approval", "merge", "approved")
    graph.add_edge("approval", "implement", "rejected")
    return graph


def main() -> None:
    runner = GraphRunner(demo_graph(), {"requirements": "", "attempts": 0}, "research")
    runner.run()
    checkpoint = runner.checkpoints[-1]
    runner.resume({"approval": "approved"})
    runner.run()
    merged = fan_out_merge({"evidence": ["requirements"]}, {"tests": lambda state: {"evidence": ["tests"]}, "security": lambda state: {"evidence": ["security"]}}, append_keys={"evidence"})
    with TemporaryDirectory(prefix="graph-") as directory:
        Path(directory, "checkpoint.json").write_text(json.dumps(asdict(checkpoint), indent=2), encoding="utf-8")
    print(json.dumps({"status": runner.status.value, "trace": [asdict(item) for item in runner.trace], "merged": merged}, indent=2))


if __name__ == "__main__":
    main()
