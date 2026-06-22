"""Legacy code readiness scorer and refactoring slice prioritizer — stdlib Python.

Part 1: ModuleScorer
  Evaluates a legacy module against five readiness dimensions
  (coupling, test coverage, secret hygiene, dependency age, change frequency).
  Each dimension scores 0 (Red), 1 (Amber), or 2 (Green). Total out of 10.
  Returns a readiness tier: Red (<5), Amber (5-7), Green (8-10).

Part 2: SlicePrioritizer
  Takes a list of SliceCandidate objects (each with a module score and a risk
  reduction estimate) and produces a recommended cut sequence.
  Ordering rule: (1) exclude Red-tiered modules unless no alternative exists,
  (2) among Amber/Green, rank by combined_score = readiness + risk_reduction,
  (3) tie-break by lowest coupling (fewest cross-context callers).
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------- Scoring primitives ----------

class Tier(Enum):
    RED = "Red"
    AMBER = "Amber"
    GREEN = "Green"


@dataclass
class DimensionScore:
    name: str
    score: int          # 0, 1, or 2
    evidence: str       # one-line rationale


@dataclass
class ModuleScore:
    module_name: str
    dimensions: list[DimensionScore]

    @property
    def total(self) -> int:
        return sum(d.score for d in self.dimensions)

    @property
    def tier(self) -> Tier:
        if self.total >= 8:
            return Tier.GREEN
        if self.total >= 5:
            return Tier.AMBER
        return Tier.RED

    @property
    def coupling_score(self) -> int:
        """Return the raw coupling dimension score (0-2)."""
        for d in self.dimensions:
            if d.name == "Coupling":
                return d.score
        return 0

    def has_red_dimension(self) -> bool:
        return any(d.score == 0 for d in self.dimensions)

    def red_dimensions(self) -> list[str]:
        return [d.name for d in self.dimensions if d.score == 0]


# ---------- Scorer ----------

def score_module(
    module_name: str,
    callers: int,
    branch_coverage_pct: int,
    has_integration_test_with_failure_paths: bool,
    has_hardcoded_secrets: bool,
    config_injected_at_boundary: bool,
    dependency_has_cve: bool,
    dependency_is_eol: bool,
    commits_per_week: float,
) -> ModuleScore:
    """Score a legacy module across five readiness dimensions.

    All inputs are straightforward measurables that a codebase audit or CI
    tooling (Trivy, coverage.py, git log) can produce.
    """

    # Dimension 1: Coupling
    if callers > 5:
        coupling = DimensionScore("Coupling", 0, f"{callers} callers across bounded contexts")
    elif callers >= 2:
        coupling = DimensionScore("Coupling", 1, f"{callers} callers, interfaces partially defined")
    else:
        coupling = DimensionScore("Coupling", 2, f"{callers} caller(s), clear single owner")

    # Dimension 2: Test coverage
    if branch_coverage_pct < 40 or not has_integration_test_with_failure_paths:
        cov_score = 0
        cov_evidence = f"{branch_coverage_pct}% branch coverage, failure paths untested"
    elif branch_coverage_pct < 70:
        cov_score = 1
        cov_evidence = f"{branch_coverage_pct}% branch coverage, some integration tests"
    else:
        cov_score = 2
        cov_evidence = f"{branch_coverage_pct}% branch coverage, failure paths covered"
    coverage = DimensionScore("Test Coverage", cov_score, cov_evidence)

    # Dimension 3: Secret / config hygiene
    if has_hardcoded_secrets:
        secret = DimensionScore("Secret Hygiene", 0, "hardcoded secrets present")
    elif not config_injected_at_boundary:
        secret = DimensionScore("Secret Hygiene", 1, "config centralized but not injected at boundary")
    else:
        secret = DimensionScore("Secret Hygiene", 2, "config injected at boundary, no hardcoded values")

    # Dimension 4: Dependency age
    if dependency_has_cve:
        dep = DimensionScore("Dependency Age", 0, "direct dependency with known CVE")
    elif dependency_is_eol:
        dep = DimensionScore("Dependency Age", 1, "no CVE but dependency is end-of-life")
    else:
        dep = DimensionScore("Dependency Age", 2, "all dependencies on supported versions")

    # Dimension 5: Change frequency (stability)
    if commits_per_week > 3:
        churn = DimensionScore("Change Frequency", 0, f"{commits_per_week:.1f} commits/week (high churn)")
    elif commits_per_week > 1:
        churn = DimensionScore("Change Frequency", 1, f"{commits_per_week:.1f} commits/week (moderate)")
    else:
        churn = DimensionScore("Change Frequency", 2, f"{commits_per_week:.1f} commits/week (stable)")

    return ModuleScore(
        module_name=module_name,
        dimensions=[coupling, coverage, secret, dep, churn],
    )


# ---------- Slice candidate ----------

@dataclass
class SliceCandidate:
    module_score: ModuleScore
    risk_reduction: int     # 0-5 estimate: how much risk this slice eliminates
    description: str


# ---------- Prioritizer ----------

def prioritize_slices(candidates: list[SliceCandidate]) -> list[tuple[int, SliceCandidate, str]]:
    """Return an ordered list of (rank, candidate, rationale).

    Ordering:
      1. Red-tiered modules go to the back (they need stabilization first).
      2. Among Amber/Green, rank by combined_score = readiness_total + risk_reduction.
      3. Tie-break by highest coupling_score (prefer well-isolated modules).
    """
    def sort_key(c: SliceCandidate) -> tuple[int, int, int]:
        tier_penalty = 0 if c.module_score.tier != Tier.RED else -1000
        return (
            tier_penalty + c.module_score.total + c.risk_reduction,
            c.module_score.coupling_score,
            0,
        )

    ranked = sorted(candidates, key=sort_key, reverse=True)
    results = []
    for i, c in enumerate(ranked, 1):
        if c.module_score.tier == Tier.RED:
            rationale = (
                f"DEFERRED — Red tier (total {c.module_score.total}/10). "
                f"Red dimensions: {', '.join(c.module_score.red_dimensions())}. "
                "Stabilize before cutting."
            )
        else:
            rationale = (
                f"Rank {i}: {c.module_score.tier.value} tier "
                f"(readiness {c.module_score.total}/10 + risk reduction {c.risk_reduction}/5 "
                f"= combined {c.module_score.total + c.risk_reduction}). "
                f"Coupling score {c.module_score.coupling_score}/2."
            )
        results.append((i, c, rationale))
    return results


# ---------- Driver ----------

def main() -> None:
    print("=" * 80)
    print("LEGACY CODE READINESS SCORER + SLICE PRIORITIZER (Phase 11, Lesson 82)")
    print("=" * 80)
    print()

    # --- Score three candidate modules ---

    payment_score = score_module(
        module_name="payment_processor.py",
        callers=7,
        branch_coverage_pct=35,
        has_integration_test_with_failure_paths=False,
        has_hardcoded_secrets=True,
        config_injected_at_boundary=False,
        dependency_has_cve=True,
        dependency_is_eol=False,
        commits_per_week=4.5,
    )

    auth_score = score_module(
        module_name="auth_middleware.py",
        callers=3,
        branch_coverage_pct=62,
        has_integration_test_with_failure_paths=True,
        has_hardcoded_secrets=False,
        config_injected_at_boundary=False,
        dependency_has_cve=False,
        dependency_is_eol=True,
        commits_per_week=1.5,
    )

    report_score = score_module(
        module_name="report_exporter.py",
        callers=1,
        branch_coverage_pct=75,
        has_integration_test_with_failure_paths=True,
        has_hardcoded_secrets=False,
        config_injected_at_boundary=True,
        dependency_has_cve=False,
        dependency_is_eol=False,
        commits_per_week=0.3,
    )

    all_scores = [payment_score, auth_score, report_score]

    print("PART 1: MODULE READINESS SCORES")
    print("-" * 80)
    for ms in all_scores:
        print(f"\n  {ms.module_name}  [{ms.tier.value.upper()}]  total: {ms.total}/10")
        for d in ms.dimensions:
            marker = "R" if d.score == 0 else ("A" if d.score == 1 else "G")
            print(f"    [{marker}] {d.name:<20} {d.score}/2  {d.evidence}")

    # --- Build slice candidates and prioritize ---

    candidates = [
        SliceCandidate(
            module_score=payment_score,
            risk_reduction=5,
            description="Extract secrets to vault + replace CVE dependency",
        ),
        SliceCandidate(
            module_score=auth_score,
            risk_reduction=3,
            description="Upgrade EOL dependency + inject config at boundary",
        ),
        SliceCandidate(
            module_score=report_score,
            risk_reduction=1,
            description="Migrate to new output format (low risk, stable module)",
        ),
    ]

    print()
    print("PART 2: SLICE PRIORITIZATION")
    print("-" * 80)
    ranked = prioritize_slices(candidates)
    for rank, c, rationale in ranked:
        print(f"\n  {rank}. {c.module_score.module_name}")
        print(f"     Task: {c.description}")
        print(f"     {rationale}")

    print()
    print("=" * 80)
    print("HEADLINE: sequence matters as much as the rewrite itself")
    print("-" * 80)
    print("  report_exporter.py ranks first despite lowest risk reduction:")
    print("  Green tier, low coupling, stable — it is the safe first slice.")
    print("  payment_processor.py has the highest risk reduction (5/5) but")
    print("  is Red-tiered: 4 Red dimensions mean stabilization must precede")
    print("  any refactoring. Cutting it first violates the verification gate")
    print("  contract established in Phase 14 · 38.")
    print("  auth_middleware.py is the correct second slice: Amber tier,")
    print("  meaningful risk reduction, and no blocking Red dimensions.")


if __name__ == "__main__":
    main()
