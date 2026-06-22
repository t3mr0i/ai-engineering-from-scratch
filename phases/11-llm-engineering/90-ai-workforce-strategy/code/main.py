"""Role-capability gap scorer and enablement backlog prioritiser — stdlib Python.

Part 1: Score each (role, interaction-point) pair against four competency
categories (prompt craft, output verification, escalation judgment, governance
and audit). Each pair gets a gap rating: Adequate, Gap, or Missing.

Part 2: Prioritise the gap pairs into an enablement backlog using a 2x2
impact-effort grid. EU AI Act high-risk flags act as a priority override,
forcing regulated interaction points to the top of the backlog regardless of
effort score.

The driver prints a complete gap report and a ranked backlog for a synthetic
three-role example (software engineer, product manager, compliance analyst),
then prints a HEADLINE summary.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------- Enumerations ----------

class GapRating(Enum):
    ADEQUATE = "Adequate"
    GAP = "Gap"
    MISSING = "Missing"

    def priority_weight(self) -> int:
        """Higher weight = higher urgency in the backlog."""
        return {self.MISSING: 3, self.GAP: 2, self.ADEQUATE: 0}[self]


class CompetencyCategory(Enum):
    PROMPT_CRAFT = "Prompt craft"
    OUTPUT_VERIFICATION = "Output verification"
    ESCALATION_JUDGMENT = "Escalation judgment"
    GOVERNANCE_AUDIT = "Governance and audit"


class Direction(Enum):
    PROMPT = "prompt"      # person sends input to the model
    REVIEW = "review"      # person receives and judges model output
    GOVERN = "govern"      # person sets policy or audit trail


# ---------- Data shapes ----------

@dataclass
class InteractionPoint:
    name: str
    direction: Direction
    reversible: bool          # can the AI output be corrected after the fact?
    eu_high_risk: bool        # does this touch an EU AI Act high-risk system?
    # Current competency ratings for each category
    ratings: dict[CompetencyCategory, GapRating] = field(default_factory=dict)


@dataclass
class RoleProfile:
    role: str
    interaction_points: list[InteractionPoint]


# ---------- Part 1: Gap scorer ----------

def score_impact(ip: InteractionPoint) -> int:
    """Business-impact score 1-5 for an interaction point.

    Rules:
    - Non-reversible output: +2
    - EU high-risk flag: +2
    - Review/govern direction (human is the last check): +1
    """
    score = 0
    if not ip.reversible:
        score += 2
    if ip.eu_high_risk:
        score += 2
    if ip.direction in (Direction.REVIEW, Direction.GOVERN):
        score += 1
    return min(score, 5)


def score_effort(rating: GapRating) -> int:
    """Remediation effort score 1-3. Missing gaps cost more to close."""
    return {GapRating.MISSING: 3, GapRating.GAP: 2, GapRating.ADEQUATE: 0}[rating]


@dataclass
class BacklogItem:
    role: str
    interaction_point: str
    category: CompetencyCategory
    gap_rating: GapRating
    impact: int
    effort: int
    eu_high_risk: bool

    def priority_score(self) -> float:
        """Higher is more urgent. EU high-risk override adds 10."""
        base = self.impact * self.gap_rating.priority_weight() - self.effort * 0.5
        return base + (10.0 if self.eu_high_risk else 0.0)


def build_gap_report(profiles: list[RoleProfile]) -> list[BacklogItem]:
    """Return all non-Adequate gap items as BacklogItems."""
    items: list[BacklogItem] = []
    for profile in profiles:
        for ip in profile.interaction_points:
            impact = score_impact(ip)
            for category, rating in ip.ratings.items():
                if rating is GapRating.ADEQUATE:
                    continue
                items.append(BacklogItem(
                    role=profile.role,
                    interaction_point=ip.name,
                    category=category,
                    gap_rating=rating,
                    impact=impact,
                    effort=score_effort(rating),
                    eu_high_risk=ip.eu_high_risk,
                ))
    return items


# ---------- Part 2: Backlog prioritiser ----------

def prioritise(items: list[BacklogItem]) -> list[BacklogItem]:
    """Sort by priority_score descending. EU high-risk items float to top."""
    return sorted(items, key=lambda x: x.priority_score(), reverse=True)


# ---------- Synthetic example data ----------

def build_example_profiles() -> list[RoleProfile]:
    return [
        RoleProfile(
            role="Software Engineer",
            interaction_points=[
                InteractionPoint(
                    name="AI-assisted code generation",
                    direction=Direction.REVIEW,
                    reversible=True,
                    eu_high_risk=False,
                    ratings={
                        CompetencyCategory.PROMPT_CRAFT: GapRating.ADEQUATE,
                        CompetencyCategory.OUTPUT_VERIFICATION: GapRating.GAP,
                        CompetencyCategory.ESCALATION_JUDGMENT: GapRating.GAP,
                        CompetencyCategory.GOVERNANCE_AUDIT: GapRating.MISSING,
                    },
                ),
                InteractionPoint(
                    name="Release-branch AI diff review",
                    direction=Direction.REVIEW,
                    reversible=False,
                    eu_high_risk=False,
                    ratings={
                        CompetencyCategory.PROMPT_CRAFT: GapRating.ADEQUATE,
                        CompetencyCategory.OUTPUT_VERIFICATION: GapRating.GAP,
                        CompetencyCategory.ESCALATION_JUDGMENT: GapRating.ADEQUATE,
                        CompetencyCategory.GOVERNANCE_AUDIT: GapRating.GAP,
                    },
                ),
            ],
        ),
        RoleProfile(
            role="Product Manager",
            interaction_points=[
                InteractionPoint(
                    name="AI-generated requirements review",
                    direction=Direction.REVIEW,
                    reversible=True,
                    eu_high_risk=False,
                    ratings={
                        CompetencyCategory.PROMPT_CRAFT: GapRating.GAP,
                        CompetencyCategory.OUTPUT_VERIFICATION: GapRating.GAP,
                        CompetencyCategory.ESCALATION_JUDGMENT: GapRating.MISSING,
                        CompetencyCategory.GOVERNANCE_AUDIT: GapRating.MISSING,
                    },
                ),
            ],
        ),
        RoleProfile(
            role="Compliance Analyst",
            interaction_points=[
                InteractionPoint(
                    name="AI-assisted creditworthiness assessment review",
                    direction=Direction.GOVERN,
                    reversible=False,
                    eu_high_risk=True,   # EU AI Act ANNEX III: creditworthiness
                    ratings={
                        CompetencyCategory.PROMPT_CRAFT: GapRating.MISSING,
                        CompetencyCategory.OUTPUT_VERIFICATION: GapRating.MISSING,
                        CompetencyCategory.ESCALATION_JUDGMENT: GapRating.MISSING,
                        CompetencyCategory.GOVERNANCE_AUDIT: GapRating.GAP,
                    },
                ),
                InteractionPoint(
                    name="AI policy governance sign-off",
                    direction=Direction.GOVERN,
                    reversible=False,
                    eu_high_risk=True,
                    ratings={
                        CompetencyCategory.PROMPT_CRAFT: GapRating.ADEQUATE,
                        CompetencyCategory.OUTPUT_VERIFICATION: GapRating.GAP,
                        CompetencyCategory.ESCALATION_JUDGMENT: GapRating.GAP,
                        CompetencyCategory.GOVERNANCE_AUDIT: GapRating.MISSING,
                    },
                ),
            ],
        ),
    ]


# ---------- Driver ----------

def print_gap_report(profiles: list[RoleProfile]) -> None:
    print("PART 1 — ROLE-CAPABILITY GAP REPORT")
    print("-" * 80)
    for profile in profiles:
        print(f"\nRole: {profile.role}")
        for ip in profile.interaction_points:
            flag = " [EU HIGH RISK]" if ip.eu_high_risk else ""
            rev = "reversible" if ip.reversible else "NON-REVERSIBLE"
            print(f"  Interaction point: {ip.name}{flag}")
            print(f"    direction={ip.direction.value}, {rev}, "
                  f"impact={score_impact(ip)}/5")
            for cat, rating in ip.ratings.items():
                marker = "  " if rating is GapRating.ADEQUATE else "!!"
                print(f"    {marker} {cat.value:<30} {rating.value}")


def print_backlog(items: list[BacklogItem]) -> None:
    print()
    print("PART 2 — PRIORITISED ENABLEMENT BACKLOG")
    print("-" * 80)
    print(f"  {'#':<3} {'Role':<22} {'Interaction point':<38} {'Category':<28} "
          f"{'Gap':<9} {'Impact':<7} {'Effort':<7} {'Score'}")
    print("  " + "-" * 120)
    for rank, item in enumerate(items, 1):
        eu = " [!]" if item.eu_high_risk else "    "
        print(
            f"  {rank:<3} {item.role:<22} {item.interaction_point[:36]:<38} "
            f"{item.category.value:<28} {item.gap_rating.value:<9} "
            f"{item.impact:<7} {item.effort:<7} {item.priority_score():.1f}{eu}"
        )
    print()
    print("  [!] = EU AI Act high-risk override applied (+10 priority score)")


def main() -> None:
    print("=" * 80)
    print("AI WORKFORCE STRATEGY: GAP SCORER + BACKLOG PRIORITISER")
    print("(Phase 11, Lesson 90 — code/main.py)")
    print("=" * 80)

    profiles = build_example_profiles()
    print_gap_report(profiles)

    items = build_gap_report(profiles)
    ranked = prioritise(items)
    print_backlog(ranked)

    # Compute summary statistics
    missing_by_role: dict[str, int] = {}
    for item in items:
        if item.gap_rating is GapRating.MISSING:
            missing_by_role[item.role] = missing_by_role.get(item.role, 0) + 1

    top_role = max(missing_by_role, key=lambda r: missing_by_role[r])
    top_item = ranked[0]

    print("=" * 80)
    print("HEADLINE: role with most Missing gaps, and the top backlog item")
    print("-" * 80)
    print(f"  Most Missing gaps: {top_role} ({missing_by_role[top_role]} Missing ratings)")
    print(f"  Top backlog item:  {top_item.role} / {top_item.interaction_point}")
    print(f"    category: {top_item.category.value}, gap: {top_item.gap_rating.value}, "
          f"score: {top_item.priority_score():.1f}")
    if top_item.eu_high_risk:
        print("    -> EU AI Act Article 4 override applied — compliance deadline drives rank")
    print("=" * 80)


if __name__ == "__main__":
    main()
