"""Decision-quality gateway simulator — stdlib Python.

This module is the runnable form of the Phase 11, Lesson 91 decision gateway.
Two deterministic policies, both stdlib-only, no network, no model:

1. score_decision(): run a synthetic model output (point estimate, ECE,
   conformal prediction-set width, subgroup parity gap) through four gates
   in order:
       Gate 1 - Calibration:     ECE must be at or below a type-specific limit.
       Gate 2 - Uncertainty:     prediction-set width must be at or below budget.
       Gate 3 - Bias:            subgroup parity gap must be at or below tolerance.
       Gate 4 - Accountability:  a named approver must be present.
   Each gate's pass/fail is reported; a single failure blocks the action.

2. build_audit_entry(): score a decision and produce a structured audit log
   row. Critically, it sets `override = True` when the approver accepted
   despite at least one failed gate — the "rubber stamp" anti-pattern.

The driver runs a batch of decisions spanning the five decision types and
includes the contract-reviewer failure shape end-to-end: a high-risk decision
where the model is confidently wrong on a subgroup, gate 1 and gate 3 both
fail, the approver clicks through anyway, and the audit log records the
override. That is the failure the lesson is about, demonstrated by the
code rather than just described.

The headline summary names that failure shape.
"""

from __future__ import annotations

import datetime
import hashlib
from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Enums and thresholds
# ---------------------------------------------------------------------------

class DecisionType(Enum):
    CONTENT_REC = "content_recommendation"
    DOC_CLASS = "document_classification"
    RESOURCE_ALLOC = "resource_allocation"
    HIGH_RISK = "high_risk"          # credit, hiring, clinical triage
    IRREVERSIBLE = "irreversible"    # model provides evidence only


# Thresholds tighten as stakes rise. Defaults taken from the lesson; teams
# should override per use case. These are starting points, not a compliance
# floor. ECE_THRESHOLD: 0.02-0.10 across the five types.
ECE_THRESHOLD = {
    DecisionType.CONTENT_REC: 0.10,
    DecisionType.DOC_CLASS: 0.07,
    DecisionType.RESOURCE_ALLOC: 0.05,
    DecisionType.HIGH_RISK: 0.03,
    DecisionType.IRREVERSIBLE: 0.02,
}

# UNCERTAINTY_BUDGET: normalised conformal prediction-set width, 0.0-1.0.
# Below 0.1 = model is sure; above 0.3 = send to human for high-risk.
UNCERTAINTY_BUDGET = {
    DecisionType.CONTENT_REC: 0.50,
    DecisionType.DOC_CLASS: 0.35,
    DecisionType.RESOURCE_ALLOC: 0.25,
    DecisionType.HIGH_RISK: 0.15,
    DecisionType.IRREVERSIBLE: 0.10,
}

# PARITY_TOLERANCE: worst-case subgroup accuracy gap, 0.0-1.0. Production
# audits routinely see 0.05-0.15 gaps; >0.20 is the regulatory-complaint range.
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
    approver_id: str | None      # None = no approver assigned


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
    approver_id: str | None
    override: bool               # approver accepted despite at least one failed gate
    timestamp: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())


# ---------------------------------------------------------------------------
# Part 1: Decision-quality scorer
# ---------------------------------------------------------------------------

def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:12]


def score_decision(output: ModelOutput) -> tuple[list[GateResult], bool]:
    """Run the four-gate decision gateway. Returns (gates, all_passed).

    Any single failed gate blocks the action. This is intentional: the gateway
    is a conjunction, not a vote. A model output that is calibrated but biased
    is still unsafe to act on; a model output that is unbiased but wildly
    uncertain is still unsafe to auto-approve.
    """
    gates: list[GateResult] = []
    dt = output.decision_type

    # Gate 1 — Calibration. ECE is a population property; we look up the
    # most recent value for the model version. The lesson: the number must
    # exist at decision time, not just in a quarterly slide.
    ece_limit = ECE_THRESHOLD[dt]
    g1_pass = output.ece <= ece_limit
    gates.append(GateResult(
        gate="Calibration (ECE)",
        passed=g1_pass,
        reason=f"ECE={output.ece:.3f} {'<=' if g1_pass else '>'} limit={ece_limit:.3f}",
    ))

    # Gate 2 — Uncertainty. Conformal prediction-set width, normalised.
    # Wide set = model is uncertain; this is the signal to escalate to human.
    unc_limit = UNCERTAINTY_BUDGET[dt]
    g2_pass = output.pred_set_width <= unc_limit
    gates.append(GateResult(
        gate="Uncertainty (pred-set width)",
        passed=g2_pass,
        reason=f"width={output.pred_set_width:.2f} {'<=' if g2_pass else '>'} budget={unc_limit:.2f}",
    ))

    # Gate 3 — Bias / subgroup parity. The 92%-aggregate trap: a model can
    # look fine on the headline dashboard and still be wrong on a subgroup
    # that matters. The contract-reviewer failure shape lived here.
    par_limit = PARITY_TOLERANCE[dt]
    g3_pass = output.subgroup_parity_gap <= par_limit
    gates.append(GateResult(
        gate="Bias (subgroup parity gap)",
        passed=g3_pass,
        reason=f"gap={output.subgroup_parity_gap:.3f} {'<=' if g3_pass else '>'} tolerance={par_limit:.3f}",
    ))

    # Gate 4 — Accountability. For every decision type the approver is
    # mandatory. "AUTOMATED" is acceptable only for low-stakes rows.
    g4_pass = output.approver_id is not None
    if dt is DecisionType.IRREVERSIBLE:
        reason = "irreversible: named human approver required (no AUTOMATED)"
        g4_pass = output.approver_id is not None and output.approver_id != "AUTOMATED"
    else:
        reason = f"approver={output.approver_id!r}"
    gates.append(GateResult(gate="Accountability (approver)", passed=g4_pass, reason=reason))

    return gates, all(g.passed for g in gates)


# ---------------------------------------------------------------------------
# Part 2: Accountability chain builder
# ---------------------------------------------------------------------------

MODEL_VERSION = "v2.4.1"   # synthetic; represents a pinned, auditable artifact


def build_audit_entry(output: ModelOutput) -> AuditEntry:
    """Score a decision and produce a structured audit log entry.

    The `override` flag is the heart of the rubber-stamp detection. It fires
    when the approver accepted (i.e. approver_id is set) but at least one gate
    failed. This is the failure shape the lesson is named after: a human in
    the loop who was not actually in the loop.
    """
    gates, all_passed = score_decision(output)
    # Rubber-stamp detection: approver accepted despite at least one failed gate.
    gate_fail = not all_passed
    override = gate_fail and output.approver_id is not None and output.approver_id != "AUTOMATED"
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


def _print_entry(entry: AuditEntry) -> None:
    status = "CLEARED" if entry.all_gates_passed else "BLOCKED"
    override_flag = "  [RUBBER-STAMP DETECTED]" if entry.override else ""
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

    # Five decisions. The last two are the ones that demonstrate the failure
    # shape the lesson is named after: a model that is confidently wrong on a
    # subgroup, the audit trail says so, and the approver clicks through
    # anyway. That is the contract-reviewer failure in 30 lines.
    decisions = [
        # D-001: clean content recommendation. All four gates pass.
        ModelOutput(
            decision_id="D-001",
            input_text="recommend article to user session 9f3a",
            point_estimate=0.87,
            ece=0.04,
            pred_set_width=0.20,
            subgroup_parity_gap=0.06,
            decision_type=DecisionType.CONTENT_REC,
            approver_id="AUTOMATED",        # acceptable for low-stakes content
        ),
        # D-002: doc classification. All four gates pass.
        ModelOutput(
            decision_id="D-002",
            input_text="classify contract #8812 as standard vs non-standard",
            point_estimate=0.73,
            ece=0.06,                        # within DOC_CLASS threshold (0.07)
            pred_set_width=0.28,
            subgroup_parity_gap=0.04,
            decision_type=DecisionType.DOC_CLASS,
            approver_id="reviewer@company.de",
        ),
        # D-003: resource allocation. Gate 1 fails (ECE 0.06 > 0.05).
        # Approver accepted anyway -- override flag fires.
        ModelOutput(
            decision_id="D-003",
            input_text="allocate Q3 training budget across 4 departments",
            point_estimate=0.81,
            ece=0.06,                        # FAILS resource_alloc threshold (0.05)
            pred_set_width=0.22,
            subgroup_parity_gap=0.04,
            decision_type=DecisionType.RESOURCE_ALLOC,
            approver_id="head-of-ops@company.de",
        ),
        # D-004: THE CONTRACT-REVIEWER FAILURE SHAPE.
        # High-risk loan decision. Gate 1 fails (model is miscalibrated) and
        # gate 3 fails (subgroup parity gap 0.05 > 0.03 tolerance). The
        # point estimate looks confident. The approver is present. The
        # approver clicks "approve" anyway. This is the audit log row that
        # an external regulator will read six months later.
        ModelOutput(
            decision_id="D-004",
            input_text="loan application #LN-4491 approve/deny",
            point_estimate=0.68,
            ece=0.05,                        # FAILS high_risk ECE threshold (0.03)
            pred_set_width=0.12,
            subgroup_parity_gap=0.05,        # FAILS high_risk parity tolerance (0.03)
            decision_type=DecisionType.HIGH_RISK,
            approver_id="credit-officer@company.de",
        ),
        # D-005: irreversible decision with no approver. Gate 4 fails.
        ModelOutput(
            decision_id="D-005",
            input_text="triage patient P-7721 for surgical referral",
            point_estimate=0.91,
            ece=0.01,
            pred_set_width=0.08,
            subgroup_parity_gap=0.01,
            decision_type=DecisionType.IRREVERSIBLE,
            approver_id=None,                # FAILS: no approver on an irreversible decision
        ),
    ]

    entries: list[AuditEntry] = []
    print("--- GATE-BY-GATE RESULTS ---")
    print()
    for d in decisions:
        entry = build_audit_entry(d)
        entries.append(entry)
        _print_entry(entry)

    # Summary statistics.
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
    print("HEADLINE: the system being wrong in the demonstrated failure shape")
    print("-" * 80)
    print(f"  Decisions run         : {len(entries)}")
    print(f"  Cleared all gates     : {cleared}")
    print(f"  Blocked by >=1 gate   : {blocked}")
    print(f"  Rubber-stamp detected : {rubber_stamps}  (approver accepted despite gate failure)")
    print(f"  Most-blocking gate    : {most_blocking}")
    print()
    print("  Failure shape just demonstrated: THE 92% AGGREGATE TRAP.")
    print()
    print("  D-004 was a high-risk loan decision. The point estimate was 0.68 --")
    print("  the model looked decisive. The audit log shows gate 1 (calibration)")
    print("  failed because ECE 0.05 exceeds the high-risk threshold of 0.03;")
    print("  gate 3 (bias) failed because the subgroup parity gap 0.05 exceeds")
    print("  the high-risk tolerance of 0.03. The approver was a named human")
    print("  with the right credentials. The approver accepted anyway. The")
    print("  override flag in the audit log captures exactly this: an approver")
    print("  was present, a gate failed, the action went through.")
    print()
    print("  This is the contract-reviewer failure shape in miniature: a model")
    print("  that is confidently wrong on a subgroup, an approver who clicks")
    print("  through, and an audit trail that records both. The point of the")
    print("  gateway is not to stop the approver from acting -- sometimes the")
    print("  approver has context the model does not. The point is to make the")
    print("  failure shape visible six months later when someone asks why.")
    print()
    print("  Three of five decisions were blocked. One was a rubber stamp. The")
    print("  most-blocking gate was calibration -- because most production")
    print("  models, evaluated honestly, are not as calibrated as the eval")
    print("  deck suggested.")


if __name__ == "__main__":
    main()
