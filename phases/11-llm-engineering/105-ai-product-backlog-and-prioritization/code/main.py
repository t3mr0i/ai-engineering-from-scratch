"""
AI-Assisted Backlog Scoring: Value, Effort, Risk, and Dependencies

Part 1 — Weighted scorer
  Applies a configurable four-dimension formula to a synthetic backlog.
  Outputs a ranked table with per-dimension scores and composite scores.

Part 2 — Dependency graph analysis
  Builds a directed dependency graph from the backlog items, then computes
  depth (longest blocker chain) and fan-in (how many items are unblocked
  by each item) for every item. High-fan-in items are flagged as
  force-multipliers worth scheduling early.

No external dependencies. Run with: python3 main.py
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from collections import defaultdict, deque


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class BacklogItem:
    id: str
    title: str
    value: float          # 1–5: business value if shipped
    effort: float         # 1–5: engineering cost (higher = more expensive)
    risk: float           # 0–1: probability × severity composite (higher = riskier)
    blocked_by: List[str] = field(default_factory=list)  # ids of blocking items
    compliance: bool = False


@dataclass
class ScoringWeights:
    value_weight: float = 0.6
    risk_weight: float = 0.4
    # Multiplier applied to effort for each unresolved blocker
    dependency_multiplier_per_blocker: float = 0.3


@dataclass
class ScoredItem:
    item: BacklogItem
    composite: float
    adjusted_effort: float
    depth: int = 0
    fan_in: int = 0


# ---------------------------------------------------------------------------
# Part 1: Weighted scoring
# ---------------------------------------------------------------------------

def score_and_rank(
    items: List[BacklogItem],
    weights: ScoringWeights,
) -> List[ScoredItem]:
    """
    Score each item and return a list sorted by composite score descending.

    Formula:
        value_score  = item.value / 5 * weights.value_weight
        risk_score   = (1 - item.risk) * weights.risk_weight
        numerator    = value_score + risk_score
        effort_adj   = item.effort * (1 + len(blockers) * dependency_multiplier)
        composite    = numerator / effort_adj * 10   # scale to readable range
    """
    scored: List[ScoredItem] = []
    for item in items:
        value_score = (item.value / 5.0) * weights.value_weight
        risk_score = (1.0 - item.risk) * weights.risk_weight
        numerator = value_score + risk_score

        blocker_count = len(item.blocked_by)
        effort_multiplier = 1.0 + blocker_count * weights.dependency_multiplier_per_blocker
        adjusted_effort = item.effort * effort_multiplier

        composite = (numerator / adjusted_effort) * 10.0
        scored.append(ScoredItem(item=item, composite=composite, adjusted_effort=adjusted_effort))

    scored.sort(key=lambda s: s.composite, reverse=True)
    return scored


# ---------------------------------------------------------------------------
# Part 2: Dependency graph — depth and fan-in
# ---------------------------------------------------------------------------

def build_dependency_graph(items: List[BacklogItem]) -> Dict[str, ScoredItem]:
    """
    Compute depth (longest blocker chain to reach this item) and fan-in
    (number of items this item blocks) for every item.

    Returns a dict keyed by item id containing updated ScoredItem objects.
    This function is called after score_and_rank and mutates the ScoredItem
    objects in-place, then returns the lookup dict.
    """
    # Build reverse lookup: id -> ScoredItem
    by_id: Dict[str, BacklogItem] = {item.id: item for item in items}

    # Fan-in: for each item, count how many other items list it as a blocker
    fan_in: Dict[str, int] = defaultdict(int)
    for item in items:
        for blocker_id in item.blocked_by:
            fan_in[blocker_id] += 1

    # Depth: topological BFS from roots (items with no blockers)
    depth: Dict[str, int] = {item.id: 0 for item in items}
    # Kahn's algorithm
    in_degree: Dict[str, int] = {item.id: len(item.blocked_by) for item in items}
    queue: deque = deque([item.id for item in items if in_degree[item.id] == 0])
    # adjacency: blocker -> list of items it blocks
    adjacency: Dict[str, List[str]] = defaultdict(list)
    for item in items:
        for blocker_id in item.blocked_by:
            adjacency[blocker_id].append(item.id)

    while queue:
        current = queue.popleft()
        for dependent in adjacency[current]:
            depth[dependent] = max(depth[dependent], depth[current] + 1)
            in_degree[dependent] -= 1
            if in_degree[dependent] == 0:
                queue.append(dependent)

    return depth, dict(fan_in)


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

SAMPLE_BACKLOG: List[BacklogItem] = [
    BacklogItem("A", "SSO integration for enterprise customers",
                value=5, effort=3, risk=0.2, compliance=False),
    BacklogItem("B", "GDPR data-deletion endpoint",
                value=3, effort=2, risk=0.1, compliance=True),
    BacklogItem("C", "Realtime collaboration (shared cursors)",
                value=4, effort=5, risk=0.5, blocked_by=["A"]),
    BacklogItem("D", "Audit log export to S3",
                value=3, effort=2, risk=0.2, compliance=True, blocked_by=["B"]),
    BacklogItem("E", "ML-based anomaly alerts",
                value=4, effort=4, risk=0.6, blocked_by=["A", "D"]),
    BacklogItem("F", "Dark mode",
                value=2, effort=1, risk=0.05),
    BacklogItem("G", "Mobile push notifications",
                value=3, effort=3, risk=0.3, blocked_by=["A"]),
    BacklogItem("H", "Usage analytics dashboard",
                value=4, effort=2, risk=0.15, blocked_by=["D"]),
]


def main() -> None:
    weights = ScoringWeights(
        value_weight=0.6,
        risk_weight=0.4,
        dependency_multiplier_per_blocker=0.3,
    )

    print("=" * 70)
    print("BACKLOG SCORING — AI-Assisted Prioritization Model")
    print(f"Weights: value={weights.value_weight}, risk={weights.risk_weight}, "
          f"dep_multiplier_per_blocker={weights.dependency_multiplier_per_blocker}")
    print("=" * 70)

    scored = score_and_rank(SAMPLE_BACKLOG, weights)
    depth, fan_in = build_dependency_graph(SAMPLE_BACKLOG)

    # Attach graph metrics to scored items
    for s in scored:
        s.depth = depth[s.item.id]
        s.fan_in = fan_in.get(s.item.id, 0)

    # Print ranked table
    print(f"\n{'Rank':<5} {'ID':<4} {'Title':<42} {'Val':<5} {'Risk':<6} "
          f"{'Eff(adj)':<10} {'Composite':<10} {'Depth':<6} {'FanIn':<6}")
    print("-" * 100)
    for rank, s in enumerate(scored, 1):
        flag = " [COMPLIANCE]" if s.item.compliance else ""
        print(
            f"{rank:<5} {s.item.id:<4} {s.item.title:<42} "
            f"{s.item.value:<5.1f} {s.item.risk:<6.2f} "
            f"{s.adjusted_effort:<10.2f} {s.composite:<10.3f} "
            f"{s.depth:<6} {s.fan_in:<6}{flag}"
        )

    # Flags
    print("\n--- Risk flags (risk >= 0.5) ---")
    flagged_risk = [s for s in scored if s.item.risk >= 0.5]
    if flagged_risk:
        for s in flagged_risk:
            print(f"  [{s.item.id}] {s.item.title} — risk={s.item.risk:.2f}")
    else:
        print("  None")

    print("\n--- High fan-in items (force multipliers, fan-in >= 2) ---")
    force_multipliers = sorted(
        [s for s in scored if s.fan_in >= 2],
        key=lambda s: s.fan_in,
        reverse=True,
    )
    if force_multipliers:
        for s in force_multipliers:
            print(f"  [{s.item.id}] {s.item.title} — fan-in={s.fan_in}, depth={s.depth}")
    else:
        print("  None")

    print("\n--- Compliance items (mandatory, schedule regardless of score) ---")
    compliance_items = [s for s in scored if s.item.compliance]
    for s in compliance_items:
        print(f"  [{s.item.id}] {s.item.title} — composite={s.composite:.3f}")

    # Identify top item and highest fan-in item for exercises
    top_item = scored[0]
    highest_fan_in = max(scored, key=lambda s: s.fan_in)
    highest_value = max(scored, key=lambda s: s.item.value)
    lowest_composite = min(scored, key=lambda s: s.composite)

    print("\n" + "=" * 70)
    print("HEADLINE: Top-ranked item is"
          f" [{top_item.item.id}] '{top_item.item.title}'"
          f" (composite={top_item.composite:.3f}).")
    print(f"  Force-multiplier: [{highest_fan_in.item.id}]"
          f" '{highest_fan_in.item.title}' unblocks {highest_fan_in.fan_in} items.")
    print(f"  Highest value but lowest composite:"
          f" [{lowest_composite.item.id}] '{lowest_composite.item.title}'"
          f" — effort+deps outweigh raw value.")
    print("=" * 70)


if __name__ == "__main__":
    main()
