"""Vendor scorecard engine — stdlib Python, no network, no dependencies.

Two parts:

Part 1 — SCORECARD EVALUATOR
Takes a set of AI vendor profiles (pre-scored on six evaluation dimensions)
and a client weight profile (set by engagement context). Computes weighted
totals, ranks vendors, and surfaces the dimension where each vendor most
diverges from the leader.

Part 2 — PORTFOLIO COMPARISON
Runs the same vendor set against three different client weight profiles
(regulated enterprise, consulting internal tool, startup) and prints a
side-by-side ranking matrix. Makes explicit that the "right" vendor is
context-dependent: a vendor that leads for a regulated client may rank
third for a startup with different priorities.

All scores are integers 0-4:
  0 = does not meet bar / no evidence
  1 = partial / documentation gaps
  2 = meets minimum bar
  3 = strong / exceeds typical requirements
  4 = best-in-class
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Tuple


# ---------- Dimensions ----------

class Dim(Enum):
    CAPABILITY      = "Model capability"
    DATA_HANDLING   = "Data handling & residency"
    SECURITY        = "Security posture"
    COMPLIANCE      = "Compliance certifications"
    INTEGRATION     = "Integration & lock-in risk"
    ECONOMICS       = "Economics & exit planning"


ALL_DIMS: List[Dim] = list(Dim)


# ---------- Vendor profile ----------

@dataclass
class Vendor:
    name: str
    scores: Dict[Dim, int]  # 0-4 for each dimension

    def score_for(self, dim: Dim) -> int:
        return self.scores.get(dim, 0)


# ---------- Weight profile ----------

@dataclass
class WeightProfile:
    name: str
    weights: Dict[Dim, float]  # must sum to 1.0

    def __post_init__(self) -> None:
        total = sum(self.weights.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Weights for '{self.name}' sum to {total:.3f}, expected 1.0")


# ---------- Scoring ----------

def weighted_score(vendor: Vendor, profile: WeightProfile) -> float:
    return sum(
        vendor.score_for(dim) * profile.weights.get(dim, 0.0)
        for dim in ALL_DIMS
    )


def rank(vendors: List[Vendor], profile: WeightProfile) -> List[Tuple[Vendor, float]]:
    """Return vendors sorted by weighted score descending."""
    scored = [(v, weighted_score(v, profile)) for v in vendors]
    return sorted(scored, key=lambda x: x[1], reverse=True)


def biggest_gap_from_leader(
    vendor: Vendor,
    leader: Vendor,
    profile: WeightProfile,
) -> Tuple[Dim, float]:
    """Return the dimension where this vendor most trails the leader,
    weighted by that dimension's importance in the profile."""
    gaps = {
        dim: (leader.score_for(dim) - vendor.score_for(dim)) * profile.weights[dim]
        for dim in ALL_DIMS
    }
    worst_dim = max(gaps, key=lambda d: gaps[d])
    return worst_dim, gaps[worst_dim]


# ---------- Vendor data (illustrative, grounded in public 2026 information) ----------

VENDORS: List[Vendor] = [
    Vendor(
        name="Anthropic Enterprise API (direct)",
        scores={
            Dim.CAPABILITY:    4,
            Dim.DATA_HANDLING: 3,
            Dim.SECURITY:      3,
            Dim.COMPLIANCE:    3,
            Dim.INTEGRATION:   2,  # proprietary extended-thinking API surface
            Dim.ECONOMICS:     2,  # no batch discount on direct API
        },
    ),
    Vendor(
        name="AWS Bedrock (Claude + others)",
        scores={
            Dim.CAPABILITY:    3,
            Dim.DATA_HANDLING: 4,  # AWS DPA, CMEK, PrivateLink, no training by default
            Dim.SECURITY:      4,  # SOC 2 II, ISO 27001, BSI C5, FedRAMP
            Dim.COMPLIANCE:    4,
            Dim.INTEGRATION:   3,  # OpenAI-compatible endpoint available
            Dim.ECONOMICS:     3,  # batch pricing, reserved capacity
        },
    ),
    Vendor(
        name="Azure AI Foundry (GPT-4o + others)",
        scores={
            Dim.CAPABILITY:    4,
            Dim.DATA_HANDLING: 4,
            Dim.SECURITY:      4,
            Dim.COMPLIANCE:    4,  # BSI C5, ISO 42001 in progress
            Dim.INTEGRATION:   3,
            Dim.ECONOMICS:     3,
        },
    ),
    Vendor(
        name="Google Vertex AI (Gemini)",
        scores={
            Dim.CAPABILITY:    4,
            Dim.DATA_HANDLING: 3,
            Dim.SECURITY:      3,
            Dim.COMPLIANCE:    3,
            Dim.INTEGRATION:   2,  # Vertex SDK is non-standard
            Dim.ECONOMICS:     3,
        },
    ),
    Vendor(
        name="Mistral API (EU-hosted)",
        scores={
            Dim.CAPABILITY:    2,
            Dim.DATA_HANDLING: 4,  # EU data residency by default
            Dim.SECURITY:      2,
            Dim.COMPLIANCE:    2,  # GDPR-native but limited cert coverage
            Dim.INTEGRATION:   4,  # OpenAI-compatible; open weights available
            Dim.ECONOMICS:     4,  # lowest price tier for many tasks
        },
    ),
    Vendor(
        name="Self-hosted open weights (e.g. Llama 4)",
        scores={
            Dim.CAPABILITY:    3,
            Dim.DATA_HANDLING: 4,  # data never leaves your environment
            Dim.SECURITY:      3,  # depends entirely on your infra posture
            Dim.COMPLIANCE:    3,  # you control the cert scope
            Dim.INTEGRATION:   4,  # full control; OpenAI-compatible serving possible
            Dim.ECONOMICS:     2,  # high upfront infra cost; low marginal cost at scale
        },
    ),
]


# ---------- Weight profiles ----------

PROFILES: List[WeightProfile] = [
    WeightProfile(
        name="Regulated enterprise (financial/public sector, GDPR high-sensitivity)",
        weights={
            Dim.CAPABILITY:    0.10,
            Dim.DATA_HANDLING: 0.25,
            Dim.SECURITY:      0.25,
            Dim.COMPLIANCE:    0.20,
            Dim.INTEGRATION:   0.10,
            Dim.ECONOMICS:     0.10,
        },
    ),
    WeightProfile(
        name="Consulting internal tool (moderate data sensitivity, rapid iteration)",
        weights={
            Dim.CAPABILITY:    0.25,
            Dim.DATA_HANDLING: 0.15,
            Dim.SECURITY:      0.15,
            Dim.COMPLIANCE:    0.10,
            Dim.INTEGRATION:   0.20,
            Dim.ECONOMICS:     0.15,
        },
    ),
    WeightProfile(
        name="Startup prototype (speed and cost dominant, no regulated data)",
        weights={
            Dim.CAPABILITY:    0.30,
            Dim.DATA_HANDLING: 0.05,
            Dim.SECURITY:      0.05,
            Dim.COMPLIANCE:    0.05,
            Dim.INTEGRATION:   0.25,
            Dim.ECONOMICS:     0.30,
        },
    ),
]


# ---------- Display helpers ----------

BAR_WIDTH = 4


def score_bar(score: int, max_score: int = 4) -> str:
    filled = int(round(score / max_score * BAR_WIDTH))
    return "[" + "#" * filled + "." * (BAR_WIDTH - filled) + "]"


def print_scorecard(ranked: List[Tuple[Vendor, float]], profile: WeightProfile) -> None:
    leader_vendor = ranked[0][0]
    col_w = 38
    print(f"\n  Profile: {profile.name}")
    print(f"  {'Vendor':<{col_w}} {'Score':>6}  {'Rank':<6}")
    print(f"  {'-' * col_w} {'------':>6}  {'----':<6}")
    for pos, (vendor, score) in enumerate(ranked, 1):
        print(f"  {vendor.name:<{col_w}} {score:>6.2f}  #{pos}")
        if pos > 1:
            gap_dim, gap_val = biggest_gap_from_leader(vendor, leader_vendor, profile)
            print(f"    ^ weakest vs leader: {gap_dim.value} "
                  f"(weighted gap {gap_val:.2f})")


def print_dimension_detail(vendors: List[Vendor]) -> None:
    col_w = 38
    dim_w = 28
    print(f"\n  {'Vendor':<{col_w}}", end="")
    for dim in ALL_DIMS:
        short = dim.value.split()[0][:7]
        print(f"  {short:>7}", end="")
    print()
    print(f"  {'-' * col_w}", end="")
    for _ in ALL_DIMS:
        print(f"  {'-------':>7}", end="")
    print()
    for vendor in vendors:
        print(f"  {vendor.name:<{col_w}}", end="")
        for dim in ALL_DIMS:
            bar = score_bar(vendor.score_for(dim))
            print(f"  {bar:>7}", end="")
        print()


# ---------- Main ----------

def main() -> None:
    separator = "=" * 80

    print(separator)
    print("AI VENDOR SCORECARD ENGINE  (Phase 11, Lesson 95)")
    print(separator)

    # Part 1: dimension detail — raw scores
    print("\nPART 1 — RAW DIMENSION SCORES  (0=none  4=best-in-class)")
    print_dimension_detail(VENDORS)
    print()
    print("  Score legend: [####]=4  [###.]=3  [##..]=2  [#...]=1  [....]=0")

    # Part 2: ranked scorecard per profile
    print(f"\n{separator}")
    print("PART 2 — WEIGHTED RANKING BY CLIENT PROFILE")
    print(separator)

    all_rankings: Dict[str, List[str]] = {}
    for profile in PROFILES:
        ranked = rank(VENDORS, profile)
        print_scorecard(ranked, profile)
        all_rankings[profile.name] = [v.name for v, _ in ranked]

    # Part 3: ranking stability matrix
    print(f"\n{separator}")
    print("PART 3 — RANKING STABILITY MATRIX")
    print(separator)
    print()
    profile_short = ["Regulated", "Consulting", "Startup"]
    col = 38
    print(f"  {'Vendor':<{col}}", end="")
    for s in profile_short:
        print(f"  {s:>10}", end="")
    print()
    print(f"  {'-' * col}", end="")
    for _ in profile_short:
        print(f"  {'----------':>10}", end="")
    print()

    for vendor in VENDORS:
        print(f"  {vendor.name:<{col}}", end="")
        for profile_name, ranking in all_rankings.items():
            pos = ranking.index(vendor.name) + 1
            print(f"  {'#' + str(pos):>10}", end="")
        print()

    print()
    print(separator)
    print("HEADLINE: vendor ranking is not portable across client profiles")
    print("-" * 80)
    print("  The vendor that leads for a regulated financial client")
    print("  is not the same as the leader for a cost-sensitive startup.")
    print("  Data handling and security weight dominate the regulated case;")
    print("  economics and integration portability dominate the startup case.")
    print("  Run this scorecard with client-specific weights before committing")
    print("  to a vendor — the inputs change the recommendation materially.")
    print(separator)


if __name__ == "__main__":
    main()
