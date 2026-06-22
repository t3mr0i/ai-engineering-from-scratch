"""AI-Enhanced User Research: hypothesis scorer + representational bias checker.

Two parts:

Part 1 — Hypothesis scorer.
Takes a hypothesis with evidence metadata (distinct participant count, segment
count, temporal spread, and snippet count) and applies the confidence rubric
from Phase 11 · 85.  Returns a named confidence tier and the rule that set it.

Part 2 — Representational bias checker.
Takes a cluster's segment evidence breakdown (how many snippets came from each
participant segment) and the target population share of each segment.  Flags
any cluster where one segment contributes more than SKEW_THRESHOLD of the
evidence while representing less than POP_THRESHOLD of the population.

Neither part makes a network call or imports anything outside stdlib.
The driver runs five sample hypotheses and two bias scenarios.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Shared constants
# ---------------------------------------------------------------------------

SKEW_THRESHOLD = 0.60   # segment contributes > 60 % of cluster snippets
POP_THRESHOLD  = 0.40   # but represents < 40 % of the target population


# ---------------------------------------------------------------------------
# Part 1 — Hypothesis scorer
# ---------------------------------------------------------------------------

class ConfidenceTier(Enum):
    STRONG   = "strong   (0.80–1.00)"
    MODERATE = "moderate (0.50–0.79)"
    WEAK     = "weak     (0.20–0.49)"
    ANECDOTE = "anecdote (0.00–0.19)"


@dataclass
class HypothesisEvidence:
    """Metadata attached to a single hypothesis from the clustering stage."""
    label: str
    distinct_participants: int
    segment_count: int          # number of distinct participant segments
    snippet_count: int
    multi_session: bool         # evidence spans more than one session date


def score_hypothesis(e: HypothesisEvidence) -> tuple[ConfidenceTier, float, str]:
    """Return (tier, score, reason) for a hypothesis given its evidence.

    Rules applied in order, first match wins:
    - STRONG   if >= 5 distinct participants AND >= 2 segments AND multi-session
    - MODERATE if 3–4 distinct participants, OR single-segment only
    - WEAK     if 1–2 distinct participants
    - ANECDOTE if snippet_count == 1 or distinct_participants < 1
    """
    if e.distinct_participants < 1 or e.snippet_count < 1:
        return ConfidenceTier.ANECDOTE, 0.10, "fewer than 1 source or 0 snippets"

    if e.distinct_participants == 1:
        return ConfidenceTier.ANECDOTE, 0.15, "single participant (anecdote risk)"

    if e.distinct_participants >= 5 and e.segment_count >= 2 and e.multi_session:
        score = min(1.0, 0.80 + 0.04 * (e.distinct_participants - 5))
        return ConfidenceTier.STRONG, round(score, 2), \
            f"{e.distinct_participants} participants, {e.segment_count} segments, multi-session"

    if e.distinct_participants >= 3:
        base = 0.50 if e.segment_count < 2 else 0.62
        score = min(0.79, base + 0.04 * (e.distinct_participants - 3))
        reason = "3–4 participants" if e.distinct_participants < 5 else "5+ participants but single segment or single session"
        return ConfidenceTier.MODERATE, round(score, 2), reason

    # 2 participants
    return ConfidenceTier.WEAK, 0.30, "only 2 distinct participants"


# ---------------------------------------------------------------------------
# Part 2 — Representational bias checker
# ---------------------------------------------------------------------------

@dataclass
class SegmentEvidence:
    """Evidence breakdown for one segment within a cluster."""
    name: str
    snippet_count: int
    population_share: float   # 0.0–1.0, this segment's share of the target population


@dataclass
class ClusterBiasResult:
    cluster_label: str
    total_snippets: int
    flags: list[str] = field(default_factory=list)
    silent_segments: list[str] = field(default_factory=list)

    @property
    def is_flagged(self) -> bool:
        return bool(self.flags)


def check_bias(
    cluster_label: str,
    segments: list[SegmentEvidence],
    all_segments_in_pool: list[str],
) -> ClusterBiasResult:
    """Run coverage and silence checks for a cluster.

    Coverage check: flag any segment whose evidence share exceeds SKEW_THRESHOLD
    while its population share is below POP_THRESHOLD.

    Silence check: list segments present in the participant pool but absent from
    the cluster's evidence.
    """
    total = sum(s.snippet_count for s in segments)
    result = ClusterBiasResult(cluster_label=cluster_label, total_snippets=total)

    present_names = {s.name for s in segments}

    for seg in segments:
        if total == 0:
            break
        evidence_share = seg.snippet_count / total
        if evidence_share > SKEW_THRESHOLD and seg.population_share < POP_THRESHOLD:
            result.flags.append(
                f"FLAGGED: '{seg.name}' contributes {evidence_share:.0%} of evidence "
                f"but is only {seg.population_share:.0%} of population"
            )

    # Silence check
    for name in all_segments_in_pool:
        if name not in present_names:
            result.silent_segments.append(name)

    return result


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

SAMPLE_HYPOTHESES: list[HypothesisEvidence] = [
    HypothesisEvidence(
        label="Users who skip the onboarding tutorial take 30 % longer to reach first value",
        distinct_participants=8,
        segment_count=3,
        snippet_count=22,
        multi_session=True,
    ),
    HypothesisEvidence(
        label="Power users rely on keyboard shortcuts not surfaced in the UI",
        distinct_participants=4,
        segment_count=2,
        snippet_count=9,
        multi_session=True,
    ),
    HypothesisEvidence(
        label="Mobile users abandon the checkout flow at the address step",
        distinct_participants=3,
        segment_count=1,   # single segment: mobile only
        snippet_count=7,
        multi_session=False,
    ),
    HypothesisEvidence(
        label="Users expect real-time collaboration in the editor",
        distinct_participants=2,
        segment_count=1,
        snippet_count=4,
        multi_session=False,
    ),
    HypothesisEvidence(
        label="The export button is hard to find",
        distinct_participants=1,
        segment_count=1,
        snippet_count=1,
        multi_session=False,
    ),
]

# Scenario A: well-distributed evidence — no flag expected
SCENARIO_A_LABEL = "onboarding confusion"
SCENARIO_A_SEGMENTS = [
    SegmentEvidence("new-user",       9, population_share=0.45),
    SegmentEvidence("returning-user", 5, population_share=0.35),
    SegmentEvidence("power-user",     3, population_share=0.20),
]

# Scenario B: new-users dominate a cluster for an objective that affects all users
SCENARIO_B_LABEL = "data export reliability"
SCENARIO_B_SEGMENTS = [
    SegmentEvidence("new-user",       14, population_share=0.30),
    SegmentEvidence("power-user",      3, population_share=0.45),
    SegmentEvidence("enterprise-user", 1, population_share=0.25),
]

ALL_SEGMENTS_IN_POOL = ["new-user", "returning-user", "power-user", "enterprise-user"]


def main() -> None:
    separator = "=" * 78

    print(separator)
    print("AI-ENHANCED USER RESEARCH — HYPOTHESIS SCORER + BIAS CHECKER")
    print("Phase 11 · Lesson 85")
    print(separator)

    # --- Part 1: hypothesis scoring ---
    print()
    print("PART 1 — HYPOTHESIS SCORING")
    print("-" * 78)

    tier_counts: dict[ConfidenceTier, int] = {t: 0 for t in ConfidenceTier}

    for hyp in SAMPLE_HYPOTHESES:
        tier, score, reason = score_hypothesis(hyp)
        tier_counts[tier] += 1
        print(f"  Hypothesis : {hyp.label[:60]}")
        print(f"  Evidence   : {hyp.distinct_participants} participants, "
              f"{hyp.segment_count} segment(s), "
              f"{hyp.snippet_count} snippets, "
              f"multi-session={hyp.multi_session}")
        print(f"  Score      : {score:.2f}  tier={tier.value}")
        print(f"  Reason     : {reason}")
        print()

    # --- Part 2: bias checks ---
    print("PART 2 — REPRESENTATIONAL BIAS CHECKS")
    print("-" * 78)

    for label, segments in [
        (SCENARIO_A_LABEL, SCENARIO_A_SEGMENTS),
        (SCENARIO_B_LABEL, SCENARIO_B_SEGMENTS),
    ]:
        result = check_bias(label, segments, ALL_SEGMENTS_IN_POOL)
        print(f"  Cluster    : '{result.cluster_label}'  ({result.total_snippets} snippets)")
        for seg in segments:
            share = seg.snippet_count / result.total_snippets if result.total_snippets else 0
            print(f"    {seg.name:<20} {seg.snippet_count:>3} snippets "
                  f"({share:.0%} of evidence, {seg.population_share:.0%} of population)")
        if result.flags:
            for f in result.flags:
                print(f"  *** {f}")
        else:
            print("  CLEAN: evidence distribution within thresholds")
        if result.silent_segments:
            print(f"  SILENT segments (present in pool, absent from cluster): "
                  f"{', '.join(result.silent_segments)}")
        print()

    # --- Summary ---
    print(separator)
    print("HEADLINE: pipeline gates make analyst judgment legible and auditable")
    print("-" * 78)
    strong   = tier_counts[ConfidenceTier.STRONG]
    moderate = tier_counts[ConfidenceTier.MODERATE]
    weak     = tier_counts[ConfidenceTier.WEAK]
    anecdote = tier_counts[ConfidenceTier.ANECDOTE]
    print(f"  Scoring    : {strong} strong, {moderate} moderate, "
          f"{weak} weak, {anecdote} anecdote-grade hypotheses")
    print(f"  Bias check : Scenario A CLEAN, Scenario B FLAGGED")
    print(f"  Thresholds : evidence skew > {SKEW_THRESHOLD:.0%} "
          f"AND population share < {POP_THRESHOLD:.0%} triggers flag")
    print("  Neither stage makes a product decision — they make the evidence")
    print("  distribution visible so the analyst and PM can decide with context.")


if __name__ == "__main__":
    main()
