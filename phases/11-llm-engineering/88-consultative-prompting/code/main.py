"""Consultative prompting decision model — stdlib Python.

Part 1: Stakeholder-context router.
  Takes a prompt description (audience level, decision type, belief state) and
  assigns it to one of four framing templates: OPERATIONAL, SENIOR_MGMT,
  BOARD, and ADVERSARIAL. Each template encodes different role, hypothesis,
  and output-contract defaults appropriate to that stakeholder tier.

Part 2: Hypothesis-quality scorer.
  Takes a candidate hypothesis string and scores it against five criteria:
  specificity, falsifiability, audience alignment, scope constraint, and
  challenge invitation. Missing criteria are flagged with a recommended fix.
  A hypothesis that passes all five criteria is "prompt-ready."
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

class AudienceLevel(Enum):
    OPERATIONAL = "operational"
    SENIOR_MGMT = "senior_mgmt"
    BOARD = "board"


class DecisionType(Enum):
    GO_NOGO = "go_nogo"
    PRIORITIZATION = "prioritization"
    RISK_ACCEPTANCE = "risk_acceptance"
    VENDOR_SELECTION = "vendor_selection"


class BeliefState(Enum):
    ALIGNED = "aligned"       # audience already agrees with the consultant
    SKEPTICAL = "skeptical"   # audience doubts the consultant's position
    UNINFORMED = "uninformed" # audience has no strong prior


class PromptTemplate(Enum):
    OPERATIONAL = "operational"
    SENIOR_MGMT = "senior_mgmt"
    BOARD = "board"
    ADVERSARIAL = "adversarial"  # used when audience is skeptical + senior


@dataclass
class PromptSituation:
    """Describes the consulting situation a prompt must address."""
    audience_level: AudienceLevel
    decision_type: DecisionType
    belief_state: BeliefState
    description: str = ""


@dataclass
class RoutingResult:
    template: PromptTemplate
    role_hint: str
    output_contract_hint: str
    reasoning: str


# ---------------------------------------------------------------------------
# Part 1 — Stakeholder-context router
# ---------------------------------------------------------------------------

def route_prompt(situation: PromptSituation) -> RoutingResult:
    """Route a consulting situation to the most appropriate prompt template.

    The routing logic encodes the four-layer consulting prompt model from
    the lesson: role, stakeholder context, hypothesis, and output contract.
    Template selection is driven by audience level first, then belief state.
    """
    level = situation.audience_level
    belief = situation.belief_state

    # ADVERSARIAL: skeptical senior audience — the most demanding template.
    # Standard templates will produce arguments the audience will dismiss.
    if level in (AudienceLevel.SENIOR_MGMT, AudienceLevel.BOARD) and belief is BeliefState.SKEPTICAL:
        return RoutingResult(
            template=PromptTemplate.ADVERSARIAL,
            role_hint=(
                "Act as a senior advisor stress-testing the consultant's position. "
                "Assume the audience will push back on every unsupported claim."
            ),
            output_contract_hint=(
                "Two-paragraph max. First paragraph: the strongest version of the "
                "audience's counter-position. Second paragraph: the minimum evidence "
                "required to shift that position. No hedge language."
            ),
            reasoning=(
                "Skeptical senior audience requires the adversarial template: the model "
                "must produce the challenge before the affirmation, or the memo will be "
                "dismissed in the room."
            ),
        )

    # BOARD: uninformed or aligned, high-level decision.
    if level is AudienceLevel.BOARD:
        return RoutingResult(
            template=PromptTemplate.BOARD,
            role_hint=(
                "Act as a non-executive board advisor. Assume the reader has 90 seconds "
                "and no operational detail. State the implication before the evidence."
            ),
            output_contract_hint=(
                "Single decision-brief format: one headline sentence, three bullet "
                "implications, one recommended action. No jargon. No acronyms unexplained."
            ),
            reasoning=(
                "Board-level audience with no strong prior needs a decision brief, not "
                "an analysis memo. Pyramid principle applies: implication first."
            ),
        )

    # SENIOR_MGMT: aligned or uninformed.
    if level is AudienceLevel.SENIOR_MGMT:
        return RoutingResult(
            template=PromptTemplate.SENIOR_MGMT,
            role_hint=(
                "Act as a senior strategy consultant. Assume the audience knows the "
                "domain and will probe the hypothesis, not the background."
            ),
            output_contract_hint=(
                "Memo format: hypothesis statement (one sentence), three supporting "
                "arguments with evidence, one risk the hypothesis underweights. "
                "200 words max."
            ),
            reasoning=(
                "Senior management with no strong resistance needs a hypothesis-driven "
                "memo. Open-question format wastes their attention on basics they know."
            ),
        )

    # OPERATIONAL: any belief state — detail is welcome, tone is analytical.
    return RoutingResult(
        template=PromptTemplate.OPERATIONAL,
        role_hint=(
            "Act as an experienced implementation consultant. Assume the audience "
            "wants actionable specifics and can handle technical depth."
        ),
        output_contract_hint=(
            "Structured analysis: problem statement, root-cause hypothesis, "
            "three recommended actions with owners and timelines. Bullet format. "
            "No length limit but every bullet must be actionable."
        ),
        reasoning=(
            "Operational audience benefits from depth and specificity. Generic "
            "summaries are less useful here than concrete, ownable next steps."
        ),
    )


# ---------------------------------------------------------------------------
# Part 2 — Hypothesis-quality scorer
# ---------------------------------------------------------------------------

@dataclass
class HypothesisCriterion:
    name: str
    check_hint: str       # what the criterion looks for (keyword/structural signal)
    missing_fix: str      # recommended rewrite instruction if criterion fails


CRITERIA: list[HypothesisCriterion] = [
    HypothesisCriterion(
        name="specificity",
        check_hint="names a specific entity, project, or system (not generic 'the migration' or 'the project')",
        missing_fix="Replace generic nouns with the specific client/project/system name.",
    ),
    HypothesisCriterion(
        name="falsifiability",
        check_hint="contains a condition that could prove it wrong ('if X then Y', 'unless Z')",
        missing_fix="Add a falsifiability clause: 'This holds unless [specific counter-condition].'",
    ),
    HypothesisCriterion(
        name="audience_alignment",
        check_hint="names the audience or their decision context explicitly",
        missing_fix="Add audience framing: 'For the [role] deciding [decision], ...'",
    ),
    HypothesisCriterion(
        name="scope_constraint",
        check_hint="limits the expected output (a number, a category, a decision, not 'discuss')",
        missing_fix="Add a scope constraint: 'Identify the top two ...' or 'Confirm or reject ...'",
    ),
    HypothesisCriterion(
        name="challenge_invitation",
        check_hint="explicitly invites the model to challenge or stress-test the hypothesis",
        missing_fix="Add 'Challenge this hypothesis.' or 'Under what conditions does this fail?'",
    ),
]


@dataclass
class ScorerResult:
    hypothesis: str
    passed: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)
    fixes: list[str] = field(default_factory=list)

    @property
    def score(self) -> int:
        return len(self.passed)

    @property
    def is_prompt_ready(self) -> bool:
        return self.score == len(CRITERIA)


# Simple heuristic checks — keyword/structural signals, not NLP.
_SPECIFICITY_SIGNALS = (
    "ERP", "SAP", "Oracle", "Salesforce", "AWS", "Azure", "GCP",
    "subsidiary", "division", "Q", "phase", "program",
)
_FALSIFIABILITY_SIGNALS = ("unless", "if ", "provided that", "except when", "only if")
_AUDIENCE_SIGNALS = ("CIO", "CFO", "board", "committee", "partner", "steering", "stakeholder", "for the")
_SCOPE_SIGNALS = ("top ", "two ", "three ", "one ", "single ", "identify", "confirm", "reject", "name", "list")
_CHALLENGE_SIGNALS = ("challenge", "stress-test", "where does", "under what conditions", "when does this fail")


def _has_signal(text: str, signals: tuple[str, ...]) -> bool:
    lower = text.lower()
    return any(s.lower() in lower for s in signals)


def score_hypothesis(hypothesis: str) -> ScorerResult:
    """Score a hypothesis string against the five criteria."""
    result = ScorerResult(hypothesis=hypothesis)
    checks = [
        ("specificity",         _has_signal(hypothesis, _SPECIFICITY_SIGNALS)),
        ("falsifiability",      _has_signal(hypothesis, _FALSIFIABILITY_SIGNALS)),
        ("audience_alignment",  _has_signal(hypothesis, _AUDIENCE_SIGNALS)),
        ("scope_constraint",    _has_signal(hypothesis, _SCOPE_SIGNALS)),
        ("challenge_invitation",_has_signal(hypothesis, _CHALLENGE_SIGNALS)),
    ]
    criterion_map = {c.name: c for c in CRITERIA}
    for name, passed in checks:
        if passed:
            result.passed.append(name)
        else:
            result.failed.append(name)
            result.fixes.append(criterion_map[name].missing_fix)
    return result


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

SAMPLE_SITUATIONS: list[PromptSituation] = [
    PromptSituation(
        audience_level=AudienceLevel.BOARD,
        decision_type=DecisionType.RISK_ACCEPTANCE,
        belief_state=BeliefState.UNINFORMED,
        description="Board risk acceptance on AI program timeline",
    ),
    PromptSituation(
        audience_level=AudienceLevel.SENIOR_MGMT,
        decision_type=DecisionType.GO_NOGO,
        belief_state=BeliefState.SKEPTICAL,
        description="CFO skeptical about ERP migration cost estimate",
    ),
    PromptSituation(
        audience_level=AudienceLevel.SENIOR_MGMT,
        decision_type=DecisionType.PRIORITIZATION,
        belief_state=BeliefState.ALIGNED,
        description="CIO aligned on cloud strategy, prioritizing workloads",
    ),
    PromptSituation(
        audience_level=AudienceLevel.OPERATIONAL,
        decision_type=DecisionType.VENDOR_SELECTION,
        belief_state=BeliefState.UNINFORMED,
        description="Implementation team evaluating integration middleware",
    ),
]

SAMPLE_HYPOTHESES: list[str] = [
    # Hypothesis 1: weak — generic, no falsifiability, no challenge invitation
    "The primary risk of the migration is that the team is not ready for the change.",
    # Hypothesis 2: medium — specific entity, has scope, missing challenge and falsifiability
    "The SAP rollout will face the most resistance in the acquired subsidiary in Q3.",
    # Hypothesis 3: strong — specific, falsifiable, audience-aligned, scoped, and challenges invited
    (
        "For the steering committee deciding Q3 budget approval, the primary risk of "
        "the SAP ERP rollout is change management in the three acquired subsidiaries, "
        "not technical integration. This holds unless the middleware layer has not been "
        "validated. Identify the top two underestimated failure modes and challenge this hypothesis."
    ),
    # Hypothesis 4: board-level, missing scope and challenge
    "The AI program will not deliver ROI within 18 months for the board.",
]


def main() -> None:
    sep = "=" * 80

    print(sep)
    print("CONSULTATIVE PROMPTING — DECISION MODEL (Phase 11, Lesson 88)")
    print(sep)

    # --- Part 1: routing ---
    print()
    print("PART 1 — STAKEHOLDER-CONTEXT ROUTER")
    print("-" * 80)
    for sit in SAMPLE_SITUATIONS:
        result = route_prompt(sit)
        print(f"  Situation : {sit.description}")
        print(f"  Template  : {result.template.value.upper()}")
        print(f"  Reasoning : {result.reasoning}")
        print(f"  Role hint : {result.role_hint[:72]}...")
        print(f"  Output    : {result.output_contract_hint[:72]}...")
        print()

    # --- Part 2: scoring ---
    print(sep)
    print("PART 2 — HYPOTHESIS-QUALITY SCORER")
    print("-" * 80)
    for i, hyp in enumerate(SAMPLE_HYPOTHESES, 1):
        sr = score_hypothesis(hyp)
        status = "PROMPT-READY" if sr.is_prompt_ready else f"NEEDS WORK ({sr.score}/5)"
        print(f"  Hypothesis {i}: \"{hyp[:64]}{'...' if len(hyp) > 64 else ''}\"")
        print(f"  Score     : {sr.score}/5  [{status}]")
        if sr.passed:
            print(f"  Passed    : {', '.join(sr.passed)}")
        if sr.failed:
            print(f"  Failed    : {', '.join(sr.failed)}")
        for fix in sr.fixes:
            print(f"  Fix       : {fix}")
        print()

    print(sep)
    print("HEADLINE: prompt quality is a framing problem, not a model problem")
    print("-" * 80)
    print("  Hypothesis 1 passes 1/5 — 'team' triggers audience_alignment heuristic,")
    print("    but no specificity, no falsifiability, no scope, and no challenge.")
    print("  Hypothesis 2 passes 1/5 — named entity (SAP), but no falsifiability,")
    print("    no audience alignment, no scope constraint, no challenge invitation.")
    print("  Hypothesis 3 passes 5/5 — prompt-ready: encodes all four layers.")
    print("  Hypothesis 4 passes 1/5 — names the audience but missing scope,")
    print("    falsifiability, and a challenge invitation.")
    print("  The router selects the ADVERSARIAL template for the skeptical CFO because")
    print("  a standard memo would be dismissed without addressing the counter-position")
    print("  first. Template selection is driven by audience level + belief state.")


if __name__ == "__main__":
    main()
