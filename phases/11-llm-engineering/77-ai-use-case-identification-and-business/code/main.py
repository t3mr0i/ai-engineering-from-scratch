"""Use-case triage engine — stdlib Python.

Two parts:

Part 1 — TRIAGE FUNNEL: runs a list of candidate use cases through five
sequential gates. Each gate either eliminates a candidate or annotates it
with a flag. Only candidates that pass all five gates are ranked.

    Stage 1: LLM fit   — is this a language-model problem?
    Stage 2: ROI       — back-of-envelope value/cost ratio
    Stage 3: Feasibility — blockers that add dependencies before sprint 1
    Stage 4: Risk screen — EU AI Act tier and GDPR flags
    Stage 5: Composite score — value x 0.4 + speed x 0.35 + fit x 0.25

Part 2 — THE COMMON-CASE SMUGGLE: demonstrates the failure shape that the
lesson is named after. A use case passes every Stage 3 gate when the SME
question is read as "can label common examples", but the *hard* version of
the same question ("can label the long tail") is no. The triage sees the
shallow form, ranks it #1, and the printout makes the smuggle visible.

No network, no model. The point is to make the decision policy explicit
and to show, by example, the exact way the policy can be cheated by
reading the gate in good faith but in the wrong register.
"""

from __future__ import annotations

import math
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
    automation_rate: float      # fraction of tasks the LLM handles end-to-end (0-1)
    tokens_in: int              # average input tokens per task (per CALL, not per task)
    tokens_out: int             # average output tokens per task (per CALL, not per task)
    calls_per_task: int         # number of model calls per user task (agent-loop multiplier)
    engineering_months: float   # estimated months to production
    # Stage 3 — feasibility flags (True = blocker present)
    missing_data: bool
    missing_eval_rubric: bool
    latency_issue: bool
    missing_sme: bool           # shallow read: no SME for the *common* examples
    needs_fine_tuning: bool
    # Stage 4 — risk
    eu_ai_act_tier: RiskTier    # green / amber / red
    needs_dpia: bool            # personal data sent to external model API
    # Stage 5 — strategic fit score (1-10, caller-assigned)
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

# Approximate 2026 pricing, EUR per 1K tokens (illustrative parity, ~1:1 USD/EUR)
SONNET_IN_PER_KTOK  = 0.003   # Sonnet 4.x ~ $3 / MTok in
SONNET_OUT_PER_KTOK = 0.015   # Sonnet 4.x ~ $15 / MTok out
ENGINEERING_MONTHLY_COST_EUR = 15_000  # loaded rate for one senior engineer-month
OPS_OVERHEAD_EUR_PER_YEAR    = 3_000   # monitoring, infra, incident response


def stage2_roi(uc: UseCase) -> tuple[float, float, float]:
    """Return (annual_value, annual_cost, roi_ratio).

    The agent-loop multiplier (calls_per_task) is what separates "per-task
    cost" from "per-call cost" — the most common Stage 2 error.
    """
    annual_value = (
        uc.annual_volume
        * uc.time_saved_min
        * uc.fte_rate_per_min
        * uc.automation_rate
    )
    # calls_per_task collapses to 1 for non-agent use cases.
    total_calls = uc.annual_volume * uc.calls_per_task
    token_cost = total_calls * (
        (uc.tokens_in  / 1_000) * SONNET_IN_PER_KTOK +
        (uc.tokens_out / 1_000) * SONNET_OUT_PER_KTOK
    )
    build_cost = uc.engineering_months * ENGINEERING_MONTHLY_COST_EUR
    annual_cost = token_cost + build_cost / 3 + OPS_OVERHEAD_EUR_PER_YEAR  # amortise build over 3 yrs
    roi_ratio = annual_value / annual_cost if annual_cost > 0 else 0.0
    return annual_value, annual_cost, roi_ratio


# ---------------------------------------------------------------------------
# Stage 3 — feasibility scan (shallow read)
# ---------------------------------------------------------------------------

def stage3_feasibility_shallow(uc: UseCase) -> list[str]:
    """The shallow read of Stage 3 — the SME gate as written in the lesson:
    "Do we have an SME who can label 50-100 examples?" If the SME has seen
    common examples, this gate returns yes. The smuggle lives here.
    """
    blockers: list[str] = []
    if uc.missing_data:
        blockers.append("missing input data — data engineering required")
    if uc.missing_eval_rubric:
        blockers.append("no eval rubric — define before prototype (Phase 11.10)")
    if uc.latency_issue:
        blockers.append("latency — needs streaming/caching/async (Phase 11.11)")
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
    # Value score (0-10): log scale; ROI 10:1 maps to ~10, ROI 1:1 maps to ~3
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
# Full triage driver (shallow read of Stage 3)
# ---------------------------------------------------------------------------

def triage(candidates: list[UseCase]) -> list[UseCase]:
    """Run all five stages (with the shallow Stage 3 read) and return survivors."""
    survivors: list[UseCase] = []

    print("=" * 80)
    print("USE CASE TRIAGE ENGINE  (Phase 11, Lesson 77)")
    print("=" * 80)

    for uc in candidates:
        print(f"\n--- {uc.name} ---")

        # Stage 1
        passes, reason = stage1_llm_fit(uc)
        print(f"  S1 LLM fit:       {'PASS' if passes else 'FAIL'}  - {reason}")
        if not passes:
            uc.track = ProjectTrack.RULED_OUT
            continue

        # Stage 2
        annual_value, annual_cost, roi_ratio = stage2_roi(uc)
        loop_note = (
            f"  (calls/task={uc.calls_per_task}, total calls/yr="
            f"{uc.annual_volume * uc.calls_per_task:,})"
            if uc.calls_per_task > 1 else ""
        )
        print(f"  S2 ROI:           value EUR {annual_value:,.0f}/yr  "
              f"cost EUR {annual_cost:,.0f}/yr  ratio {roi_ratio:.1f}:1{loop_note}")

        # Stage 3 (SHALLOW)
        blockers = stage3_feasibility_shallow(uc)
        if blockers:
            for b in blockers:
                print(f"  S3 blocker:       {b}")
        else:
            print("  S3 feasibility:   all clear (SHALLOW read of SME gate)")

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
# The common-case smuggle — hard read of the Stage 3 SME gate
# ---------------------------------------------------------------------------

# A use case fails the *hard* read of Stage 3 if any of these hold:
#   - SME gate waved through on common cases, but a known hard distribution exists
#   - Eval rubric can be written for common cases but not for the long tail
#   - Latency budget is fine for single-shot but not for the required retries
# These are not in the surface attributes; they are runtime inspections of
# how the gate was answered. The smuggle is that the surface attribute says
# "no blocker" while the inspection would say "blocker".

HARD_CASE_FLAGS: dict[str, str] = {
    # The contract reviewer at an insurer — the named failure shape.
    "Contract clause extractor":
        "common-case smuggle: SME reviewed 80 standard clauses, but ~12% of "
        "contracts contain unusual change-of-control / assignment language "
        "the SME has not seen; eval set has none of them; gate should be NO",

    # The CRM RAG at a logistics firm — a long-tail retrieval failure.
    "Internal knowledge base Q&A":
        "common-case smuggle: SME can label FAQ-style queries, but ~20% of "
        "inbound queries are multi-hop ('why did shipment X arrive late given "
        "carrier Y and weather Z?'); retrieval eval set has none of them",

    # A pure happy-path case — no smuggle. Kept for contrast.
    "Meeting summary generator":
        "no hard-case distribution flagged; SME's notes are uniformly structured",

    # The CV pre-screener — risk-screen kill, not a smuggle. Kept to show the
    # difference between a hard-blocker and a common-case smuggle.
    "CV pre-screening assistant":
        "no smuggle — blocked at Stage 4 (EU AI Act high-risk, recruitment)",

    # The sensor anomaly detector — Stage 1 kill. Not a smuggle either.
    "Real-time sensor anomaly detection":
        "no smuggle — blocked at Stage 1 (not language-shaped)",
}


def stage3_hard_read(uc: UseCase, blockers: list[str]) -> list[str]:
    """The hard read of Stage 3: if the candidate is flagged in HARD_CASE_FLAGS,
    the SME gate re-opens and a new blocker is added. This is what the lesson
    is named after — the gate that looked closed is actually open.
    """
    if uc.name in HARD_CASE_FLAGS and "no SME to label" not in "\n".join(blockers):
        note = HARD_CASE_FLAGS[uc.name]
        if "smuggle" in note:
            return blockers + [f"hard read: {note}"]
    return blockers


def requalify_with_hard_read(uc: UseCase) -> tuple[bool, bool]:
    """Re-run a survivor through Stage 3 and Stage 5 with the hard read applied.

    Returns (reclassified, was_quick_win_before).
    The smuggle is the case where was_quick_win_before is True and
    reclassified is True: a use case the shallow read called a quick win
    that the hard read downgrades to strategic project.
    """
    shallow = stage3_feasibility_shallow(uc)
    hard = stage3_hard_read(uc, shallow)
    if len(hard) <= len(shallow):
        return False, False

    was_quick_win = uc.track is ProjectTrack.QUICK_WIN
    _, _, roi_ratio = stage2_roi(uc)
    effective_tier, _ = stage4_risk(uc)
    if was_quick_win:
        uc.track = ProjectTrack.STRATEGIC_PROJECT
    stage5_score(uc, roi_ratio, hard, effective_tier)
    return True, was_quick_win


# ---------------------------------------------------------------------------
# The seven candidate use cases
# ---------------------------------------------------------------------------

def sample_candidates() -> list[UseCase]:
    return [
        UseCase(
            name="Contract clause extractor",
            language_shaped=True, human_judgment=True, variance_acceptable=True,
            annual_volume=12_000, time_saved_min=25.0, fte_rate_per_min=1.25,
            automation_rate=0.80, tokens_in=3_000, tokens_out=600,
            calls_per_task=1, engineering_months=2.5,
            missing_data=False, missing_eval_rubric=False,
            latency_issue=False, missing_sme=False, needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN, needs_dpia=False, strategic_fit=7.0,
        ),
        UseCase(
            name="CV pre-screening assistant",
            language_shaped=True, human_judgment=True, variance_acceptable=True,
            annual_volume=8_000, time_saved_min=15.0, fte_rate_per_min=1.10,
            automation_rate=0.60, tokens_in=2_000, tokens_out=400,
            calls_per_task=1, engineering_months=4.0,
            missing_data=False, missing_eval_rubric=True,
            latency_issue=False, missing_sme=False, needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.AMBER, needs_dpia=True, strategic_fit=6.0,
        ),
        UseCase(
            name="Real-time sensor anomaly detection",
            language_shaped=False, human_judgment=False, variance_acceptable=False,
            annual_volume=500_000, time_saved_min=0.5, fte_rate_per_min=0.80,
            automation_rate=0.95, tokens_in=200, tokens_out=50,
            calls_per_task=1, engineering_months=3.0,
            missing_data=False, missing_eval_rubric=False,
            latency_issue=True, missing_sme=False, needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN, needs_dpia=False, strategic_fit=8.0,
        ),
        UseCase(
            name="Internal knowledge base Q&A",
            language_shaped=True, human_judgment=True, variance_acceptable=True,
            annual_volume=50_000, time_saved_min=8.0, fte_rate_per_min=0.90,
            automation_rate=0.70, tokens_in=1_500, tokens_out=300,
            calls_per_task=4, engineering_months=3.0,
            missing_data=True, missing_eval_rubric=True,
            latency_issue=False, missing_sme=False, needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN, needs_dpia=False, strategic_fit=9.0,
        ),
        UseCase(
            name="Meeting summary generator",
            language_shaped=True, human_judgment=True, variance_acceptable=True,
            annual_volume=30_000, time_saved_min=12.0, fte_rate_per_min=1.00,
            automation_rate=0.90, tokens_in=4_000, tokens_out=500,
            calls_per_task=1, engineering_months=1.5,
            missing_data=False, missing_eval_rubric=False,
            latency_issue=False, missing_sme=False, needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN, needs_dpia=False, strategic_fit=6.5,
        ),
        # Agent-loop candidate — illustrates the calls_per_task multiplier
        UseCase(
            name="Multi-step research agent",
            language_shaped=True, human_judgment=True, variance_acceptable=True,
            annual_volume=10_000, time_saved_min=45.0, fte_rate_per_min=1.40,
            automation_rate=0.65, tokens_in=8_000, tokens_out=1_200,
            calls_per_task=25, engineering_months=6.0,
            missing_data=False, missing_eval_rubric=True,
            latency_issue=True, missing_sme=False, needs_fine_tuning=False,
            eu_ai_act_tier=RiskTier.GREEN, needs_dpia=False, strategic_fit=8.5,
        ),
    ]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    candidates = sample_candidates()
    survivors = triage(candidates)

    # ----- Ranking under the shallow read -----
    ranked = sorted(survivors, key=lambda u: u.composite_score, reverse=True)
    quick_wins    = [u for u in ranked if u.track is ProjectTrack.QUICK_WIN]
    strategic     = [u for u in ranked if u.track is ProjectTrack.STRATEGIC_PROJECT]
    ruled_out     = [u for u in candidates if u.track is ProjectTrack.RULED_OUT]

    print()
    print("=" * 80)
    print("RANKING SUMMARY  (shallow read of Stage 3)")
    print("=" * 80)
    print(f"\n  {'#':<3} {'Use case':<38} {'Score':>6}  {'ROI':>7}  Track")
    print(f"  {'-'*3} {'-'*38} {'-'*6}  {'-'*7}  {'-'*20}")
    for rank, u in enumerate(ranked, 1):
        print(f"  {rank:<3} {u.name:<38} {u.composite_score:>6.2f}  "
              f"{u.roi_ratio:>6.1f}:1  {u.track.value}")
    if ruled_out:
        print(f"\n  RULED OUT: {', '.join(u.name for u in ruled_out)}")

    # ----- The smuggle: re-run with the hard read -----
    print()
    print("=" * 80)
    print("THE COMMON-CASE SMUGGLE  (hard read of Stage 3)")
    print("=" * 80)
    print()
    print("  Re-open the SME gate. The shallow read asked 'can the SME label")
    print("  50-100 examples?' The hard read asks 'can the SME label the hard")
    print("  examples, including the long tail the use case will actually see?'")
    print()
    quick_win_flips: list[UseCase] = []
    for uc in survivors:
        before_track = uc.track
        before_score = uc.composite_score
        reclassified, was_quick_win_before = requalify_with_hard_read(uc)
        if not reclassified:
            continue
        marker = "QUICK-WIN SMUGGLE" if was_quick_win_before else "HARD-READ ANNOTATION"
        print(f"  [{marker}] {uc.name}")
        print(f"     before: track={before_track.value:<20} score={before_score:.2f}")
        print(f"     after:  track={uc.track.value:<20} score={uc.composite_score:.2f}")
        print(f"     reason: {uc.blockers[-1]}")
        print()
        if was_quick_win_before:
            quick_win_flips.append(uc)

    if not quick_win_flips:
        print("  No quick-win smuggle detected — every shallow quick-win also")
        print("  passes the hard read. (Other survivors may still carry additional")
        print("  hard-case notes; see above.)")
        print()

    # ----- Re-ranking -----
    reranked = sorted(survivors, key=lambda u: u.composite_score, reverse=True)
    print()
    print("=" * 80)
    print("RANKING SUMMARY  (after hard read)")
    print("=" * 80)
    print(f"\n  {'#':<3} {'Use case':<38} {'Score':>6}  {'ROI':>7}  Track")
    print(f"  {'-'*3} {'-'*38} {'-'*6}  {'-'*7}  {'-'*20}")
    for rank, u in enumerate(reranked, 1):
        print(f"  {rank:<3} {u.name:<38} {u.composite_score:>6.2f}  "
              f"{u.roi_ratio:>6.1f}:1  {u.track.value}")

    quick_wins_after = [u for u in reranked if u.track is ProjectTrack.QUICK_WIN]
    strategic_after  = [u for u in reranked if u.track is ProjectTrack.STRATEGIC_PROJECT]

    print()
    print("=" * 80)
    print("HEADLINE")
    print("-" * 80)
    print("  Demonstrated failure shape: THE COMMON-CASE SMUGGLE.")
    print()
    print(f"  Under the shallow read of Stage 3, {len(quick_wins)} use case(s) "
          f"cleared the gate as quick wins. Under the hard read — which is")
    print(f"  the read the contract reviewer at an insurer skipped — "
          f"{len(quick_win_flips)} of those quick wins flip to strategic project:")
    for u in quick_win_flips:
        print(f"    - {u.name}  (re-opened SME gate on hard cases)")
    print()
    print("  Sprint-1 recommendation (hard read):")
    if quick_wins_after:
        print("    QUICK WINS (start next sprint):")
        for u in quick_wins_after:
            print(f"      - {u.name}  (score {u.composite_score:.2f}, "
                  f"ROI {u.roi_ratio:.1f}:1, 0 blockers)")
    else:
        print("    No quick wins — every survivor carries at least one blocker")
        print("    once the SME gate is read in the right register.")
    if strategic_after:
        print("    STRATEGIC PROJECTS (plan separately):")
        for u in strategic_after:
            nb = len(u.blockers)
            print(f"      - {u.name}  (score {u.composite_score:.2f}, "
                  f"{nb} blocker{'s' if nb != 1 else ''})")
    print()
    print("  Next step: for each quick win, define the eval rubric (Phase 11.10),")
    print("  the cost ceiling (Phase 11.11), and re-confirm the SME gate against")
    print("  the *hard* examples, not the common ones.")


if __name__ == "__main__":
    main()
