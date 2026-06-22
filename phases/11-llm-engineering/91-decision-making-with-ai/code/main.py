"""Decision-quality gateway simulator — stdlib Python.

Part 1: Decision-quality scorer.
  Takes a synthetic model output (point estimate, ECE, prediction set width,
  subgroup parity gap) and runs it through a four-gate decision gateway:
    Gate 1 - Calibration:   ECE must be below threshold.
    Gate 2 - Uncertainty:   prediction set width must be within budget.
    Gate 3 - Bias:          subgroup parity gap must be within tolerance.
    Gate 4 - Accountability: a named approver must be present.
  Reports which gates pass and which block.

Part 2: Accountability chain builder.
  Accepts a sequence of scored decisions and produces a structured audit log.
  Flags any decision where the approver accepted despite a failed gate — the
  "rubber stamp" anti-pattern the lesson discusses.
"""

from __future__ import annotations

import datetime
import hashlib
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Enums and thresholds
# ---------------------------------------------------------------------------

class DecisionType(Enum):
    CONTENT_REC = "content_recommendation"
    DOC_CLASS = "document_classification"
    RESOURCE_ALLOC = "resource_allocation"
    HIGH_RISK = "high_risk"          # credit, hiring, clinical triage
    IRREVERSIBLE = "irreversible"    # model provides evidence only


# Thresholds per decision type.  Tighter for higher-stakes decisions.
ECE_THRESHOLD = {
    DecisionType.CONTENT_REC: 0.10,
    DecisionType.DOC_CLASS: 0.07,
    DecisionType.RESOURCE_ALLOC: 0.05,
    DecisionType.HIGH_RISK: 0.03,
    DecisionType.IRREVERSIBLE: 0.02,
}

# Max fraction of labels in prediction set (0.0-1.0 normalized)
UNCERTAINTY_BUDGET = {
    DecisionType.CONTENT_REC: 0.50,
    DecisionType.DOC_CLASS: 0.35,
    DecisionType.RESOURCE_ALLOC: 0.25,
    DecisionType.HIGH_RISK: 0.15,
    DecisionType.IRREVERSIBLE: 0.10,
}

# Max allowed subgroup parity gap (accuracy difference, 0.0-1.0)
PARITY_TOLERANCE = {
    DecisionType.CONTENT_REC: 0.10,
    DecisionType.DOC_CLASS: 0.08,
    DecisionType.RESOURCE_ALLOC: 0.05,
    DecisionType.HIGH_RISK: 0.03,
    DecisionType.IRREVERSIBLE: 0.02,
}


# ---------------------------------------------------------------------------
# Data shapes
# ---------------------------------------------------------------------------

@dataclass
class ModelOutput:
    """All signals required before a decision action is taken."""
    decision_id: str
    input_text: str              # abbreviated representation of the input
    point_estimate: float        # score in [0, 1]
    ece: float                   # Expected Calibration Error
    pred_set_width: float        # normalised width of conformal prediction set
    subgroup_parity_gap: float   # worst-case accuracy gap across groups
    decision_type: DecisionType
    approver_id: Optional[str]   # None = no approver assigned


@dataclass
class GateResult:
    gate: str
    passed: bool
    reason: str


@dataclass
class AuditEntry:
    decision_id: str
    model_version: str
    input_hash: str
    point_estimate: float
    ece: float
    pred_set_width: float
    subgroup_parity_gap: float
    gates: list[GateResult]
    all_gates_passed: bool
    approver_id: Optional[str]
    override: bool               # approver accepted despite failed gate
    timestamp: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())


# ---------------------------------------------------------------------------
# Part 1: Decision-quality scorer
# ---------------------------------------------------------------------------

def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:12]


def score_decision(output: ModelOutput) -> tuple[list[GateResult], bool]:
    """Run the four-gate decision gateway.  Returns (gates, all_passed)."""
    gates: list[GateResult] = []
    dt = output.decision_type

    # Gate 1 — Calibration
    ece_limit = ECE_THRESHOLD[dt]
    g1_pass = output.ece <= ece_limit
    gates.append(GateResult(
        gate="Calibration (ECE)",
        passed=g1_pass,
        reason=f"ECE={output.ece:.3f} {'<=' if g1_pass else '>'} limit={ece_limit:.3f}",
    ))

    # Gate 2 — Uncertainty
    unc_limit = UNCERTAINTY_BUDGET[dt]
    g2_pass = output.pred_set_width <= unc_limit
    gates.append(GateResult(
        gate="Uncertainty (pred-set width)",
        passed=g2_pass,
        reason=f"width={output.pred_set_width:.2f} {'<=' if g2_pass else '>'} budget={unc_limit:.2f}",
    ))

    # Gate 3 — Bias / subgroup parity
    par_limit = PARITY_TOLERANCE[dt]
    g3_pass = output.subgroup_parity_gap <= par_limit
    gates.append(GateResult(
        gate="Bias (subgroup parity gap)",
        passed=g3_pass,
        reason=f"gap={output.subgroup_parity_gap:.3f} {'<=' if g3_pass else '>'} tolerance={par_limit:.3f}",
    ))

    # Gate 4 — Accountability
    # Irreversible decisions never auto-approve; HITL is mandatory regardless.
    if dt is DecisionType.IRREVERSIBLE:
        g4_pass = output.approver_id is not None
        reason = "irreversible: named approver required"
    else:
        g4_pass = output.approver_id is not None
        reason = f"approver={output.approver_id!r}"
    gates.append(GateResult(gate="Accountability (approver)", passed=g4_pass, reason=reason))

    return gates, all(g.passed for g in gates)


# ---------------------------------------------------------------------------
# Part 2: Accountability chain builder
# ---------------------------------------------------------------------------

MODEL_VERSION = "v2.4.1"   # synthetic; represents a pinned, auditable artifact


def build_audit_entry(output: ModelOutput) -> AuditEntry:
    """Score a decision and produce a structured audit log entry."""
    gates, all_passed = score_decision(output)
    # Rubber-stamp detection: approver accepted despite at least one failed gate.
    gate_fail = not all_passed
    override = gate_fail and output.approver_id is not None
    return AuditEntry(
        decision_id=output.decision_id,
        model_version=MODEL_VERSION,
        input_hash=_hash(output.input_text),
        point_estimate=output.point_estimate,
        ece=output.ece,
        pred_set_width=output.pred_set_width,
        subgroup_parity_gap=output.subgroup_parity_gap,
        gates=gates,
        all_gates_passed=all_passed,
        approver_id=output.approver_id,
        override=override,
    )


def print_audit_entry(entry: AuditEntry) -> None:
    status = "CLEARED" if entry.all_gates_passed else "BLOCKED"
    override_flag = " [RUBBER-STAMP DETECTED]" if entry.override else ""
    print(f"  decision_id      : {entry.decision_id}")
    print(f"  model_version    : {entry.model_version}")
    print(f"  input_hash       : {entry.input_hash}")
    print(f"  point_estimate   : {entry.point_estimate:.3f}")
    print(f"  approver         : {entry.approver_id or 'NONE'}")
    for g in entry.gates:
        mark = "PASS" if g.passed else "FAIL"
        print(f"    [{mark}] {g.gate:<35} {g.reason}")
    print(f"  outcome          : {status}{override_flag}")
    print()


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 80)
    print("DECISION-QUALITY GATEWAY SIMULATOR (Phase 11, Lesson 91)")
    print("=" * 80)
    print()

    # Five synthetic decisions: benign to high-risk, with deliberate failures.
    decisions = [
        ModelOutput(
            decision_id="D-001",
            input_text="recommend article to user session 9f3a",
            point_estimate=0.87,
            ece=0.04,
            pred_set_width=0.20,
            subgroup_parity_gap=0.06,
            decision_type=DecisionType.CONTENT_REC,
            approver_id="AUTOMATED",        # fine for content rec
        ),
        ModelOutput(
            decision_id="D-002",
            input_text="classify contract #8812 as standard vs non-standard",
            point_estimate=0.73,
            ece=0.06,                        # within DOC_CLASS threshold
            pred_set_width=0.28,
            subgroup_parity_gap=0.04,
            decision_type=DecisionType.DOC_CLASS,
            approver_id="reviewer@company.de",
        ),
        ModelOutput(
            decision_id="D-003",
            input_text="allocate Q3 training budget across 4 departments",
            point_estimate=0.81,
            ece=0.06,                        # FAILS resource_alloc threshold (0.05)
            pred_set_width=0.22,
            subgroup_parity_gap=0.04,
            decision_type=DecisionType.RESOURCE_ALLOC,
            approver_id="head-of-ops@company.de",   # approver present but gate 1 fails
        ),
        ModelOutput(
            decision_id="D-004",
            input_text="loan application #LN-4491 approve/deny",
            point_estimate=0.68,
            ece=0.02,
            pred_set_width=0.12,
            subgroup_parity_gap=0.05,        # FAILS high_risk parity tolerance (0.03)
            decision_type=DecisionType.HIGH_RISK,
            approver_id="credit-officer@company.de",
        ),
        ModelOutput(
            decision_id="D-005",
            input_text="triage patient P-7721 for surgical referral",
            point_estimate=0.91,
            ece=0.01,
            pred_set_width=0.08,
            subgroup_parity_gap=0.01,
            decision_type=DecisionType.IRREVERSIBLE,
            approver_id=None,                # FAILS: no approver — irreversible decision
        ),
    ]

    entries: list[AuditEntry] = []
    print("--- GATE-BY-GATE RESULTS ---")
    print()
    for d in decisions:
        entry = build_audit_entry(d)
        entries.append(entry)
        print_audit_entry(entry)

    # Summary statistics
    cleared = sum(1 for e in entries if e.all_gates_passed)
    blocked = len(entries) - cleared
    rubber_stamps = sum(1 for e in entries if e.override)
    gate_fail_counts: dict[str, int] = {}
    for e in entries:
        for g in e.gates:
            if not g.passed:
                gate_fail_counts[g.gate] = gate_fail_counts.get(g.gate, 0) + 1

    most_blocking = max(gate_fail_counts, key=gate_fail_counts.get) if gate_fail_counts else "none"

    print("=" * 80)
    print("HEADLINE: decision quality is a process property, not a model property")
    print("-" * 80)
    print(f"  Decisions run         : {len(entries)}")
    print(f"  Cleared all gates     : {cleared}")
    print(f"  Blocked by >=1 gate   : {blocked}")
    print(f"  Rubber-stamp detected : {rubber_stamps}  (approver accepted despite gate failure)")
    print(f"  Most-blocking gate    : {most_blocking}")
    print()
    print("  Gate 1 (calibration) fails when ECE exceeds the type-specific threshold.")
    print("  Gate 3 (bias) fails when the worst subgroup gap exceeds tolerance.")
    print("  Neither failure is the model's fault; both are detectable before acting.")
    print("  Logging gate state on accepted decisions enables post-hoc audit of overrides.")


if __name__ == "__main__":
    main()
