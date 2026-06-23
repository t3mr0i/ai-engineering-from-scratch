"""Agentic software engineering — two-part decision model. Stdlib only.

Part 1: Task-decomposition router.
    Scores a task description against structural signals (step count estimate,
    blast radius, parallelism potential, external state access) and recommends
    one of five decomposition patterns with explicit reasoning.

Part 2: Agent-loop state machine.
    Runs a synthetic three-step coding task through a minimal sequential loop,
    demonstrating re-read-before-write grounding, structured tool errors, and
    the blast-radius gate that triggers HITL before a destructive action.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Shared enums
# ---------------------------------------------------------------------------

class BlastRadius(int, Enum):
    ZERO   = 0   # reads, list ops
    LOW    = 1   # sandbox writes
    MEDIUM = 2   # stateful API calls
    HIGH   = 3   # deletes, deploys, outbound, credentials
    CRITICAL = 4 # prod DB, secret rotation, infra teardown


class DecompositionPattern(Enum):
    SEQUENTIAL          = "single-agent sequential"
    PLANNER_EXECUTOR    = "planner + executor"
    MULTI_AGENT         = "multi-agent parallel"
    REFLECTION_LOOP     = "reflection loop"
    HITL                = "human-in-the-loop"


# ---------------------------------------------------------------------------
# Part 1 — Task decomposition router
# ---------------------------------------------------------------------------

@dataclass
class TaskProfile:
    name: str
    estimated_steps: int     # rough step count
    blast_radius: BlastRadius
    subtasks_independent: bool   # can subtasks run in parallel?
    requires_quality_gate: bool  # does output quality need self-critique?
    human_confirmation_required: bool  # does operator policy require sign-off?


def route_decomposition(t: TaskProfile) -> tuple[DecompositionPattern, list[str]]:
    """Return recommended decomposition pattern and a list of reasoning lines."""
    reasons: list[str] = []

    # Operator policy or blast radius forces HITL first.
    if t.human_confirmation_required or t.blast_radius >= BlastRadius.HIGH:
        reasons.append(
            f"blast radius is {t.blast_radius.name} or operator requires confirmation"
        )
        return DecompositionPattern.HITL, reasons

    # Quality gate implies a reflection loop (layered on whatever else).
    if t.requires_quality_gate:
        reasons.append("quality gate required -> reflection loop reduces revision cycles")
        return DecompositionPattern.REFLECTION_LOOP, reasons

    # Many truly-independent subtasks -> parallel multi-agent.
    if t.subtasks_independent and t.estimated_steps > 20:
        reasons.append(
            f"{t.estimated_steps} steps with independent subtasks -> parallel multi-agent"
        )
        return DecompositionPattern.MULTI_AGENT, reasons

    # Large step count but subtasks depend on each other -> planner + executor.
    if t.estimated_steps > 20:
        reasons.append(
            f"{t.estimated_steps} steps, sequential dependencies -> planner + executor"
        )
        return DecompositionPattern.PLANNER_EXECUTOR, reasons

    # Bounded task, low blast radius -> simplest loop.
    reasons.append(
        f"{t.estimated_steps} steps, low blast radius -> single-agent sequential"
    )
    return DecompositionPattern.SEQUENTIAL, reasons


SAMPLE_TASKS = [
    TaskProfile(
        name="Add a null-check to one function",
        estimated_steps=3,
        blast_radius=BlastRadius.LOW,
        subtasks_independent=False,
        requires_quality_gate=False,
        human_confirmation_required=False,
    ),
    TaskProfile(
        name="Migrate auth module across 9 files with tests",
        estimated_steps=28,
        blast_radius=BlastRadius.LOW,
        subtasks_independent=False,
        requires_quality_gate=False,
        human_confirmation_required=False,
    ),
    TaskProfile(
        name="Generate release notes from 200 commits (parallel summarize)",
        estimated_steps=40,
        blast_radius=BlastRadius.ZERO,
        subtasks_independent=True,
        requires_quality_gate=False,
        human_confirmation_required=False,
    ),
    TaskProfile(
        name="Draft API documentation and self-critique for completeness",
        estimated_steps=10,
        blast_radius=BlastRadius.LOW,
        subtasks_independent=False,
        requires_quality_gate=True,
        human_confirmation_required=False,
    ),
    TaskProfile(
        name="Rotate production database credentials",
        estimated_steps=6,
        blast_radius=BlastRadius.CRITICAL,
        subtasks_independent=False,
        requires_quality_gate=False,
        human_confirmation_required=True,
    ),
]


def run_router() -> None:
    print("=" * 78)
    print("PART 1 — TASK DECOMPOSITION ROUTER")
    print("=" * 78)
    print()
    for t in SAMPLE_TASKS:
        pattern, reasons = route_decomposition(t)
        print(f"  Task: {t.name}")
        print(f"    -> Pattern : {pattern.value}")
        print(f"    -> Reason  : {reasons[0]}")
        print()


# ---------------------------------------------------------------------------
# Part 2 — Agent-loop state machine
# ---------------------------------------------------------------------------

class ToolResult(Enum):
    OK    = "ok"
    ERROR = "error"
    HITL  = "hitl_required"


@dataclass
class ToolOutput:
    status: ToolResult
    data: str
    error_code: str = ""
    suggestion: str = ""


@dataclass
class AgentStep:
    action: str           # human-readable label
    tool: str
    payload: str
    blast_radius: BlastRadius
    requires_reread: bool = False   # grounding: re-read before this write?


# Simulated tool executor — deterministic responses matching the scenario.
_TOOL_RESPONSES: dict[str, ToolOutput] = {
    "list_files src/":
        ToolOutput(ToolResult.OK, "['src/auth.py', 'src/models.py', 'src/utils.py']"),
    "read_file src/auth.py":
        ToolOutput(ToolResult.OK, "def verify_token(token):\n    # TODO: add expiry check\n    return True"),
    "read_file src/auth.py (reread)":
        ToolOutput(ToolResult.OK, "def verify_token(token):\n    # TODO: add expiry check\n    return True"),
    "write_file src/auth.py":
        ToolOutput(ToolResult.OK, "file written: 3 lines changed"),
    "run_tests tests/test_auth.py":
        ToolOutput(ToolResult.OK, "3 passed, 0 failed"),
    "deploy_to_production src/auth.py":
        ToolOutput(ToolResult.HITL, "", "blast_radius_high",
                   "obtain human approval before deploying to production"),
}


def execute_tool(step: AgentStep, state: dict) -> ToolOutput:
    """Simulate tool execution. Grounding re-read happens transparently."""
    if step.requires_reread:
        # Grounding always re-reads the target with read_file, not the write tool.
        reread_key = f"read_file {step.payload} (reread)"
        reread_out = _TOOL_RESPONSES.get(reread_key)
        if reread_out:
            state["last_reread"] = reread_out.data
            print(f"      [grounding] re-read before write: {len(reread_out.data)} chars")

    key = f"{step.tool} {step.payload}"
    return _TOOL_RESPONSES.get(
        key,
        ToolOutput(ToolResult.ERROR, "", "unknown_tool",
                   f"no handler for tool='{step.tool}' payload='{step.payload}'"),
    )


def check_blast_radius_gate(step: AgentStep) -> bool:
    """Return True if the step may proceed without human approval."""
    return step.blast_radius < BlastRadius.HIGH


def run_loop() -> None:
    print("=" * 78)
    print("PART 2 — AGENT-LOOP STATE MACHINE (sequential coding task)")
    print("=" * 78)
    print()
    print("  Task: Add token-expiry check to src/auth.py and verify tests pass.")
    print()

    steps: list[AgentStep] = [
        AgentStep(
            action="Discover relevant files",
            tool="list_files",
            payload="src/",
            blast_radius=BlastRadius.ZERO,
        ),
        AgentStep(
            action="Read current implementation",
            tool="read_file",
            payload="src/auth.py",
            blast_radius=BlastRadius.ZERO,
        ),
        AgentStep(
            action="Write updated implementation",
            tool="write_file",
            payload="src/auth.py",
            blast_radius=BlastRadius.LOW,
            requires_reread=True,   # grounding: re-read before writing
        ),
        AgentStep(
            action="Run tests to verify change",
            tool="run_tests",
            payload="tests/test_auth.py",
            blast_radius=BlastRadius.ZERO,
        ),
        AgentStep(
            action="Deploy updated module to production",
            tool="deploy_to_production",
            payload="src/auth.py",
            blast_radius=BlastRadius.HIGH,  # triggers HITL gate
        ),
    ]

    state: dict = {}
    completed = 0
    hitl_step: AgentStep | None = None

    for i, step in enumerate(steps, 1):
        print(f"  Step {i}: {step.action}")
        print(f"    tool={step.tool}  payload={step.payload}  radius={step.blast_radius.name}")

        if not check_blast_radius_gate(step):
            print(f"    -> HITL GATE: blast radius {step.blast_radius.name} requires human approval")
            print(f"       reason: {_TOOL_RESPONSES.get(step.tool + ' ' + step.payload, ToolOutput(ToolResult.HITL,'','','')).suggestion}")
            hitl_step = step
            break

        result = execute_tool(step, state)
        if result.status == ToolResult.ERROR:
            print(f"    -> TOOL ERROR [{result.error_code}]: {result.suggestion}")
            break
        print(f"    -> OK: {result.data[:72]}")
        completed += 1
        print()

    print()
    print(f"  Steps completed before gate: {completed}/{len(steps)}")
    if hitl_step:
        print(f"  Paused at: '{hitl_step.action}' — awaiting operator approval")


# ---------------------------------------------------------------------------
# Main driver
# ---------------------------------------------------------------------------

def main() -> None:
    run_router()
    print()
    run_loop()
    print()
    print("=" * 78)
    print("HEADLINE: scaffold determines reliability, not model intelligence")
    print("-" * 78)
    print("  Part 1: task shape drives decomposition pattern before the model runs.")
    print("  Part 2: re-read grounding, structured tool errors, and blast-radius")
    print("  gates catch the most common production failure modes — none of which")
    print("  require a smarter model. They require a better loop.")


if __name__ == "__main__":
    main()
