"""AI process readiness gate — stdlib Python, no network, no pip.

Part 1: ProcessProfile dataclass capturing the four readiness inputs
(exception coverage, output sensitivity, volume profile availability,
manual baseline measurement).

Part 2: gate() scores a profile and returns a GateVerdict. recommend()
maps the verdict to a concrete next-step action.

The driver runs five synthetic profiles representing the spectrum from
clearly-ready to clearly-not-ready, then prints a headline summary.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------- Enums ----------

class Sensitivity(Enum):
    LOW = "low"       # correction cost is low, caught quickly downstream
    MEDIUM = "medium" # may propagate one step; correction requires intervention
    HIGH = "high"     # financial, legal, or reputational consequences


class GateVerdict(Enum):
    PASS = "PASS"
    CONDITIONAL = "CONDITIONAL"  # passes with stated caveats
    FAIL = "FAIL"


# ---------- Process profile ----------

@dataclass
class ProcessProfile:
    """One business process evaluated for AI automation readiness."""
    name: str
    # Exception coverage: fraction of volume covered by the documented map (0.0-1.0)
    exception_coverage: float
    # Output sensitivity level
    sensitivity: Sensitivity
    # Whether historical volume data exists covering at least one peak period
    has_volume_profile: bool
    # Whether the current manual error rate has been measured (not assumed)
    has_manual_baseline: bool
    # Rough daily average volume — informational, not part of the gate logic
    avg_daily_volume: int = 0


# ---------- Gate logic ----------

@dataclass
class GateResult:
    verdict: GateVerdict
    failed_checks: list[str] = field(default_factory=list)
    caveats: list[str] = field(default_factory=list)


def gate(p: ProcessProfile) -> GateResult:
    """Score a ProcessProfile against the four readiness checks.

    A process fails the gate if two or more checks are not met.
    A process is conditional if exactly one check is not met.
    A process passes if all four checks are met.

    Exception coverage threshold: 80% of volume must be mapped.
    Sensitivity HIGH always requires a measured baseline and full exception map.
    """
    failed: list[str] = []
    caveats: list[str] = []

    # Check 1: exception coverage
    if p.exception_coverage < 0.80:
        failed.append(
            f"Exception coverage {p.exception_coverage:.0%} < 80% threshold"
        )

    # Check 2: output sensitivity must be understood
    # HIGH sensitivity adds extra requirements beyond the base gate
    if p.sensitivity is Sensitivity.HIGH:
        if p.exception_coverage < 1.0:
            caveats.append(
                "HIGH sensitivity: exception coverage should be >=95% before pilot"
            )
        if not p.has_manual_baseline:
            failed.append(
                "HIGH sensitivity: manual baseline is mandatory (cannot be assumed)"
            )

    # Check 3: volume profile
    if not p.has_volume_profile:
        failed.append("No historical volume profile — peak behavior unknown")

    # Check 4: manual baseline
    if not p.has_manual_baseline:
        if "HIGH sensitivity" not in " ".join(failed):
            # Avoid duplicate entry when already added above for HIGH
            failed.append("Manual error rate not measured — baseline is an assumption")

    # Determine verdict
    if len(failed) == 0:
        verdict = GateVerdict.PASS
    elif len(failed) == 1:
        verdict = GateVerdict.CONDITIONAL
    else:
        verdict = GateVerdict.FAIL

    return GateResult(verdict=verdict, failed_checks=failed, caveats=caveats)


# ---------- Recommendation ----------

_NEXT_STEPS = {
    GateVerdict.PASS: (
        "Proceed to shadow-mode pilot (Phase 17 · 20). "
        "Define the shadow success metric using the measured baseline as the floor."
    ),
    GateVerdict.CONDITIONAL: (
        "Address the one failed check before committing pilot budget. "
        "Typical bounded sprint: 2 weeks of observation or one 200-case sample audit."
    ),
    GateVerdict.FAIL: (
        "Run pre-analysis sprint before any model selection. "
        "Each failed check is a bounded task (observation sprint, volume instrumentation, "
        "sample audit). Revisit gate after sprint."
    ),
}


def recommend(result: GateResult, p: ProcessProfile) -> str:
    base = _NEXT_STEPS[result.verdict]
    if p.sensitivity is Sensitivity.HIGH and result.verdict is not GateVerdict.FAIL:
        base += (
            " HIGH sensitivity: design a human-in-the-loop scope contract "
            "(Phase 14 · 36) before pilot launch."
        )
    return base


# ---------- Driver ----------

PROFILES: list[ProcessProfile] = [
    ProcessProfile(
        name="Invoice data extraction (mature AP team)",
        exception_coverage=0.91,
        sensitivity=Sensitivity.MEDIUM,
        has_volume_profile=True,
        has_manual_baseline=True,
        avg_daily_volume=450,
    ),
    ProcessProfile(
        name="Support ticket triage (no historical pull)",
        exception_coverage=0.85,
        sensitivity=Sensitivity.LOW,
        has_volume_profile=False,
        has_manual_baseline=True,
        avg_daily_volume=1200,
    ),
    ProcessProfile(
        name="Contract clause risk scoring (legal ops)",
        exception_coverage=0.72,
        sensitivity=Sensitivity.HIGH,
        has_volume_profile=True,
        has_manual_baseline=False,
        avg_daily_volume=30,
    ),
    ProcessProfile(
        name="Expense report categorization (well-documented)",
        exception_coverage=0.88,
        sensitivity=Sensitivity.LOW,
        has_volume_profile=True,
        has_manual_baseline=True,
        avg_daily_volume=800,
    ),
    ProcessProfile(
        name="Medical referral routing (new digital process)",
        exception_coverage=0.45,
        sensitivity=Sensitivity.HIGH,
        has_volume_profile=False,
        has_manual_baseline=False,
        avg_daily_volume=60,
    ),
]


def main() -> None:
    print("=" * 80)
    print("AI PROCESS READINESS GATE (Phase 11, Lesson 101)")
    print("=" * 80)
    print()

    verdict_counts: dict[GateVerdict, int] = {v: 0 for v in GateVerdict}

    for p in PROFILES:
        result = gate(p)
        verdict_counts[result.verdict] += 1

        print(f"  Process : {p.name}")
        print(f"  Volume  : ~{p.avg_daily_volume}/day  |  "
              f"Sensitivity: {p.sensitivity.value.upper()}  |  "
              f"Exception coverage: {p.exception_coverage:.0%}")
        print(f"  Verdict : {result.verdict.value}")

        if result.failed_checks:
            for fc in result.failed_checks:
                print(f"    FAILED CHECK: {fc}")
        if result.caveats:
            for cv in result.caveats:
                print(f"    CAVEAT: {cv}")

        print(f"  Next    : {recommend(result, p)}")
        print()

    print("=" * 80)
    passed = verdict_counts[GateVerdict.PASS]
    conditional = verdict_counts[GateVerdict.CONDITIONAL]
    failed = verdict_counts[GateVerdict.FAIL]
    total = len(PROFILES)

    print("HEADLINE: most processes need more analysis before a pilot budget")
    print("-" * 80)
    print(f"  {passed}/{total} processes passed the gate outright.")
    print(f"  {conditional}/{total} were conditional (one check missing).")
    print(f"  {failed}/{total} failed (two or more checks missing).")
    print()
    print("  The gate does not block automation — it blocks underprepared automation.")
    print("  Each failed check maps to a bounded sprint (2-4 weeks), not a project.")
    print("  Sensitivity HIGH processes require HITL design (Phase 14 · 36)")
    print("  in addition to passing the gate.")


if __name__ == "__main__":
    main()
