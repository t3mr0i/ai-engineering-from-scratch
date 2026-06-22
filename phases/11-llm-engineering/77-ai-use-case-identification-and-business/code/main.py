"""Use-case triage engine — stdlib Python.

Two parts:

Part 1 — TRIAGE FUNNEL: runs a list of candidate use cases through five
sequential gates. Each gate either eliminates a candidate or annotates it
with a flag. Only candidates that pass all five gates are ranked.

    Stage 1: LLM fit   — is this a language-model problem?
    Stage 2: ROI       — back-of-envelope value/cost ratio
    Stage 3: Feasibility — blockers that add dependencies before sprint 1
    Stage 4: Risk screen — EU AI Act tier and GDPR flags
    Stage 5: Composite score — value × 0.4 + speed × 0.35 + fit × 0.25

Part 2 — RANKING: survivors are split into quick wins (all Stage 3 gates
clear, ROI > 5, risk green) and strategic projects (one or more dependencies
or amber risk). A HEADLINE line names the recommended sprint-1 candidates.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class RiskTier(Enum):
    GREEN = "green"
    AMBER = "amber"
    RED   = "red"


class ProjectTrack(Enum):
    QUICK_WIN          = "quick-win"
    STRATEGIC_PROJECT  = "strategic-project"
    RULED_OUT          = "ruled-out"


# ---------------------------------------------------------------------------
# Use case descriptor
# ---------------------------------------------------------------------------

@dataclass
class UseCase:
    name: str
    # Stage 1 — LLM fit
    language_shaped: bool       # task involves reading/writing/classifying text
    human_judgment: bool        # requires expert judgment recoverable from text
    variance_acceptable: bool   # output variance is OK (not tax calc / reg reporting)
    # Stage 2 — ROI inputs
    annual_volume: int          # number of tasks per year
    time_saved_min: float       # minutes saved per task (vs. current process)
    fte_rate_per_min: float     # loaded FTE cost in EUR per minute
    automation_rate: float      # fraction of tasks the LLM handles end-to-end (0–1)
    tokens_in: int              # average input tokens per task
    tokens_out: int             # average output tokens per task
    engineering_months: float   # estimated months to production
    # Stage 3 — feasibility flags (True = blocker present)
    missing_data: bool
    missing_eval_rubric: bool
    latency_issue: bool
    missing_sme: bool
    needs_fine_tuning: bool
    # Stage 4 — risk
    eu_ai_act_tier: RiskTier    # green / amber / red
    needs_dpia: bool            # personal data sent to external model API
    # Stage 5 — strategic fit score (1–10, caller-assigned)
    strategic_fit: float = 5.0
    # Derived (filled in by triage)
    track: ProjectTrack = field(default=ProjectTrack.RULED_OUT, init=False)
    composite_score: float = field(default=0.0, init=False)
    roi_ratio: float = field(default=0.0, init=False)
    blockers: list[str] = field(default_factory=list, init=False)


# ---------------------------------------------------------------------------
# Stage 1 — LLM fit
# ---------------------------------------------------------------------------

def stage1_llm_fit(uc: UseCase) -> tuple[bool, str]:
    """Return (passes, reason). All three sub-criteria must hold."""
    if not uc.language_shaped:
        return False, "task is not language-shaped (lookup/calculation/sensor)"
    if not uc.human_judgment:
        return False, "no expert judgment involved — deterministic system preferred"
    if not uc.variance_acceptable:
        return False, "zero variance required — LLM output not suitable without rule checker"
    return True, "LLM fit: language-shaped, expert judgment, variance acceptable"


# ---------------------------------------------------------------------------
# Stage 2 — back-of-envelope ROI
# ---------------------------------------------------------------------------

# Model pricing (EUR per 1 000 tokens, ~2026 Sonnet 4.x)
SONNET_IN_PER_KTOK  = 0.003   # $3 / MTok = €0.003 / Ktok at ~1:1 parity for illustration
SONNET_OUT_PER_KTOK = 0.015
ENGINEERING_MONTHLY_COST_EUR = 15_000  # loaded rate for one senior engineer-month
OPS_OVERHEAD_EUR_PER_YEAR    = 3_000   # monitoring, infra, incident response


def stage2_roi(uc: UseCase) -> tuple[float, float, float]:
    """Return (annual_value, annual_cost, roi_ratio)."""
    annual_value = (
        uc.annual_volume
        * uc.time_saved_min
        * uc.fte_rate_per_min
        * uc.automation_rate
    )
    token_cost = uc.annual_volume * (
        (uc.tokens_in  / 1_000) * SONNET_IN_PER_KTOK +
        (uc.tokens_out / 1_000) * SONNET_OUT_PER_KTOK
    )
    build_cost = uc.engineering_months * ENGINEERING_MONTHLY_COST_EUR
    annual_cost = token_cost + build_cost / 3 + OPS_OVERHEAD_EUR_PER_YEAR  # amortise build over 3 yrs
    roi_ratio = annual_value / annual_cost if annual_cost > 0 else 0.0
    return annual_value, annual_cost, roi_ratio


# ---------------------------------------------------------------------------
# Stage 3 — feasibility scan
# ---------------------------------------------------------------------------

def stage3_feasibility(uc: UseCase) -> list[str]:
    """Return list of blocker descriptions (empty = all clear)."""
    blockers: list[str] = []
    if uc.missing_data:
        blockers.append("missing input data — data engineering required")
    if uc.missing_eval_rubric:
        blockers.append("no eval rubric — define before prototype (Phase 11·10)")
    if uc.latency_issue:
        blockers.append("latency — needs streaming/caching/async (Phase 11·11)")
    if uc.missing_sme:
        blockers.append("no SME to label 50-100 examples — eval blocked")
    if uc.needs_fine_tuning:
        blockers.append("fine-tuning required — adds 3-6 weeks and training data")
    return blockers


# ---------------------------------------------------------------------------
# Stage 4 — risk screen
# ---------------------------------------------------------------------------

def stage4_risk(uc: UseCase) -> tuple[RiskTier, list[str]]:
    """Return (effective_tier, risk_notes)."""
    notes: list[str] = []
    tier = uc.eu_ai_act_tier
    if tier is RiskTier.RED:
        notes.append("EU AI Act: unacceptable-risk category — do not build")
    elif tier is RiskTier.AMBER:
        notes.append("EU AI Act: high-risk category — conformity assessment required")
    if uc.needs_dpia:
        notes.append("GDPR DPIA required before sending personal data to external API")
        if tier is RiskTier.GREEN:
            tier = RiskTier.AMBER  # DPIA obligation upgrades effective risk
    if not notes:
        notes.append("risk screen: minimal risk, no special obligations")
    return tier, notes


# ---------------------------------------------------------------------------
# Stage 5 — composite score and track assignment
# ---------------------------------------------------------------------------

def stage5_score(uc: UseCase, roi_ratio: float, blockers: list[str],
                 effective_tier: RiskTier) -> float:
    """Compute composite score and assign track. Modifies uc in place."""
    # Value score (0-10): log-ish scale; roi 10:1 maps to 10, 1:1 maps to ~3
    import math
    value_score = min(10.0, max(0.0, 3.0 * math.log10(max(roi_ratio, 0.1) + 1) * 5))

    # Speed score (0-10): fewer blockers = faster
    speed_score = max(0.0, 10.0 - 2.0 * len(blockers))

    composite = (value_score * 0.4) + (speed_score * 0.35) + (uc.strategic_fit * 0.25)

    uc.roi_ratio       = roi_ratio
    uc.blockers        = blockers
    uc.composite_score = round(composite, 2)

    is_quick_win = (
        len(blockers) == 0
        and roi_ratio >= 5.0
        and effective_tier is RiskTier.GREEN
    )
    uc.track = ProjectTrack.QUICK_WIN if is_quick_win else ProjectTrack.STRATEGIC_PROJECT
    return composite


# ---------------------------------------------------------------------------
# Full triage driver
# ---------------------------------------------------------------------------

def triage(candidates: list[UseCase]) -> list[UseCase]:
    """Run all five stages and return only use cases that survive Stage 1."""
    survivors: list[UseCase] = []

    print("=" * 80)
    print("USE CASE TRIAGE ENGINE  (Phase 11, Lesson 77)")
    print("=" * 80)

    for uc in candidates:
        print(f"\n--- {uc.name} ---")

        # Stage 1
        passes, reason = stage1_llm_fit(uc)
        print(f"  S1 LLM fit:       {'PASS' if passes else 'FAIL'}  — {reason}")
        if not passes:
            uc.track = ProjectTrack.RULED_OUT
            continue

        # Stage 2
        annual_value, annual_cost, roi_ratio = stage2_roi(uc)
        print(f"  S2 ROI:           value €{annual_value:,.0f}/yr  "
              f"cost €{annual_cost:,.0f}/yr  ratio {roi_ratio:.1f}:1")

        # Stage 3
        blockers = stage3_feasibility(uc)
        if blockers:
            for b in blockers:
                print(f"  S3 blocker:       {b}")
        else:
            print("  S3 feasibility:   all clear")

        # Stage 4
        effective_tier, risk_notes = stage4_risk(uc)
        for note in risk_notes:
            print(f"  S4 risk:          [{effective_tier.value.upper()}] {note}")
        if effective_tier is RiskTier.RED:
            uc.track = ProjectTrack.RULED_OUT
            print("  => RULED OUT (red risk)")
            continue

        # Stage 5
        composite = stage5_score(uc, roi_ratio, blockers, effective_tier)
        print(f"  S5 score:         {composite:.2f}  track={uc.track.value}")
        survivors.append(uc)

    return survivors


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    candidates: list[UseCase] = [
        UseCase(
            name="Contract clause extractor",
            language_shaped=True,
            human_judgment=True,
            variance_acceptable=True,
            annual_volume=12_000,
            time_saved_min=25.0,
            fte_rate_per_min=1.25,
            automation_rate=0.80,
            tokens_in=3_000,
            tokens_out=600,
            engineering_months=2.5,
            missing_data=False,
            missing_eval_rubric=False,
            latency_issue=False,
            missing_sme=False,
            needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN,
            needs_dpia=False,
            strategic_fit=7.0,
        ),
        UseCase(
            name="CV pre-screening assistant",
            language_shaped=True,
            human_judgment=True,
            variance_acceptable=True,
            annual_volume=8_000,
            time_saved_min=15.0,
            fte_rate_per_min=1.10,
            automation_rate=0.60,
            tokens_in=2_000,
            tokens_out=400,
            engineering_months=4.0,
            missing_data=False,
            missing_eval_rubric=True,   # no rubric yet
            latency_issue=False,
            missing_sme=False,
            needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.AMBER,   # EU AI Act high-risk: recruitment
            needs_dpia=True,
            strategic_fit=6.0,
        ),
        UseCase(
            name="Real-time sensor anomaly detection",
            language_shaped=False,     # not language-shaped — fails Stage 1
            human_judgment=False,
            variance_acceptable=False,
            annual_volume=500_000,
            time_saved_min=0.5,
            fte_rate_per_min=0.80,
            automation_rate=0.95,
            tokens_in=200,
            tokens_out=50,
            engineering_months=3.0,
            missing_data=False,
            missing_eval_rubric=False,
            latency_issue=True,
            missing_sme=False,
            needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN,
            needs_dpia=False,
            strategic_fit=8.0,
        ),
        UseCase(
            name="Internal knowledge base Q&A",
            language_shaped=True,
            human_judgment=True,
            variance_acceptable=True,
            annual_volume=50_000,
            time_saved_min=8.0,
            fte_rate_per_min=0.90,
            automation_rate=0.70,
            tokens_in=1_500,
            tokens_out=300,
            engineering_months=3.0,
            missing_data=True,    # docs not indexed yet
            missing_eval_rubric=True,
            latency_issue=False,
            missing_sme=False,
            needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN,
            needs_dpia=False,
            strategic_fit=9.0,
        ),
        UseCase(
            name="Meeting summary generator",
            language_shaped=True,
            human_judgment=True,
            variance_acceptable=True,
            annual_volume=30_000,
            time_saved_min=12.0,
            fte_rate_per_min=1.00,
            automation_rate=0.90,
            tokens_in=4_000,
            tokens_out=500,
            engineering_months=1.5,
            missing_data=False,
            missing_eval_rubric=False,
            latency_issue=False,
            missing_sme=False,
            needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN,
            needs_dpia=False,
            strategic_fit=6.5,
        ),
    ]

    survivors = triage(candidates)

    # Ranking
    ranked = sorted(survivors, key=lambda u: u.composite_score, reverse=True)
    quick_wins    = [u for u in ranked if u.track is ProjectTrack.QUICK_WIN]
    strategic     = [u for u in ranked if u.track is ProjectTrack.STRATEGIC_PROJECT]
    ruled_out     = [u for u in candidates if u.track is ProjectTrack.RULED_OUT]

    print()
    print("=" * 80)
    print("RANKING SUMMARY")
    print("=" * 80)
    print(f"\n  {'#':<3} {'Use case':<38} {'Score':>6}  {'ROI':>7}  {'Track'}")
    print(f"  {'-'*3} {'-'*38} {'-'*6}  {'-'*7}  {'-'*20}")
    for rank, u in enumerate(ranked, 1):
        print(f"  {rank:<3} {u.name:<38} {u.composite_score:>6.2f}  "
              f"{u.roi_ratio:>6.1f}:1  {u.track.value}")

    if ruled_out:
        print(f"\n  RULED OUT: {', '.join(u.name for u in ruled_out)}")

    print()
    print("=" * 80)
    print("HEADLINE: recommended sprint-1 candidates")
    print("-" * 80)
    if quick_wins:
        print("  QUICK WINS (start next sprint):")
        for u in quick_wins:
            print(f"    - {u.name}  (score {u.composite_score:.2f}, ROI {u.roi_ratio:.1f}:1, "
                  f"0 blockers)")
    else:
        print("  No quick wins — all survivors carry dependencies.")
    if strategic:
        print("  STRATEGIC PROJECTS (plan separately):")
        for u in strategic:
            nb = len(u.blockers)
            print(f"    - {u.name}  (score {u.composite_score:.2f}, "
                  f"{nb} blocker{'s' if nb != 1 else ''})")
    print()
    print("  Next step: for each quick win, define the eval rubric (Phase 11·10)")
    print("  and the cost ceiling (Phase 11·11) before sprint planning.")


if __name__ == "__main__":
    main()
