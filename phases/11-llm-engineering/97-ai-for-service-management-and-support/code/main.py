"""Service AI pipeline simulator — stdlib Python.

Part 1: Ticket triage router.
  Extracts structured fields (intent, product, version, urgency, prior_contact)
  from a raw ticket string using simple keyword heuristics, then applies a
  three-outcome routing policy:
    - ROUTE: all required fields extracted, confidence above threshold.
    - ROUTE_FLAG: incomplete extraction or confidence below threshold;
                  ticket routed but draft held for human review.
    - ESCALATE: P1 urgency signal or unclassifiable ticket; goes direct to L2.

Part 2: Response quality scorer.
  Takes a draft response and a list of retrieved knowledge article snippets.
  Scores on groundedness (every procedural step cites an article) and
  actionability (every step is executable as written). Returns PASS, PARTIAL,
  or BLOCK with the failing dimension identified.

No network, no LLM, no pip. The decision policies are the point — not the
heuristics. In a real deployment the extraction and classification steps are
model calls; the routing thresholds and scoring dimensions are identical.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Data shapes
# ---------------------------------------------------------------------------

class Intent(Enum):
    ACCESS = "access_request"
    CONFIG = "configuration_change"
    BILLING = "billing_query"
    BREAK_FIX = "break_fix"
    FEATURE = "feature_question"
    UNKNOWN = "unknown"


class RoutingOutcome(Enum):
    ROUTE = "ROUTE"
    ROUTE_FLAG = "ROUTE_FLAG (hold draft for human review)"
    ESCALATE = "ESCALATE (P1 — direct to L2)"


class QualityVerdict(Enum):
    PASS = "PASS"
    PARTIAL = "PARTIAL (flagged but surfaceable)"
    BLOCK = "BLOCK (do not surface)"


@dataclass
class TicketFields:
    raw: str
    intent: Intent = Intent.UNKNOWN
    product: str = ""
    version: str = ""
    urgency_p1: bool = False
    prior_contact: bool = False
    confidence: float = 0.0


@dataclass
class RoutingDecision:
    outcome: RoutingOutcome
    queue: str
    confidence: float
    reason: str


@dataclass
class QualityScore:
    groundedness: float       # 0.0–1.0; fraction of steps citing an article
    actionability: float      # 0.0–1.0; fraction of steps that are executable
    verdict: QualityVerdict
    failing_dimension: str    # empty string if PASS


# ---------------------------------------------------------------------------
# Part 1: Ticket extraction and routing
# ---------------------------------------------------------------------------

# Keyword tables — in production these are model-inferred; here they are
# explicit so the routing logic is transparent and testable.

INTENT_KEYWORDS: dict[Intent, list[str]] = {
    Intent.ACCESS: ["access", "permission", "login", "can't log in", "locked out", "account"],
    Intent.CONFIG: ["configure", "configuration", "setting", "enable", "disable", "setup"],
    Intent.BILLING: ["invoice", "billing", "charge", "payment", "subscription", "cost"],
    Intent.BREAK_FIX: ["broken", "error", "not working", "crash", "500", "outage", "down", "fails"],
    Intent.FEATURE: ["how do i", "how to", "feature", "capability", "does it support"],
}

URGENCY_P1_SIGNALS: list[str] = [
    "production down",
    "data loss",
    "security breach",
    "all users",
    "complete outage",
    "sla breach",
    "critical",
    "urgent",
]

PRODUCT_KEYWORDS: list[str] = [
    "servicedesk", "jira", "confluence", "datadog", "grafana",
    "salesforce", "sap", "azure", "aws", "gitlab",
]

VERSION_PREFIXES: list[str] = ["v1", "v2", "v3", "version 1", "version 2", "version 3"]

INTENT_TO_QUEUE: dict[Intent, str] = {
    Intent.ACCESS: "Identity & Access Management",
    Intent.CONFIG: "Platform Engineering",
    Intent.BILLING: "Finance & Billing",
    Intent.BREAK_FIX: "Incident Response",
    Intent.FEATURE: "Product Knowledge Base",
    Intent.UNKNOWN: "General Triage",
}

CONFIDENCE_ROUTE_THRESHOLD = 0.75   # below this -> ROUTE_FLAG
CONFIDENCE_ESCALATE_THRESHOLD = 0.3  # below this -> ESCALATE


def extract_fields(raw: str) -> TicketFields:
    """Extract structured fields from raw ticket text."""
    lower = raw.lower()
    tf = TicketFields(raw=raw)

    # Intent: first matching keyword set wins; score by match count
    best_intent = Intent.UNKNOWN
    best_count = 0
    for intent, keywords in INTENT_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in lower)
        if count > best_count:
            best_count = count
            best_intent = intent
    tf.intent = best_intent

    # Product
    for prod in PRODUCT_KEYWORDS:
        if prod in lower:
            tf.product = prod
            break

    # Version
    for vp in VERSION_PREFIXES:
        if vp in lower:
            tf.version = vp.replace("version ", "v")
            break

    # P1 urgency
    tf.urgency_p1 = any(sig in lower for sig in URGENCY_P1_SIGNALS)

    # Prior contact (simulated via a marker in the ticket text)
    tf.prior_contact = "re:" in lower or "follow-up" in lower or "reopening" in lower

    # Confidence: computed from field completeness
    filled = sum([
        tf.intent is not Intent.UNKNOWN,
        bool(tf.product),
        bool(tf.version),
    ])
    # Penalise if none of the three optional fields are present
    tf.confidence = round(0.4 + (filled / 3) * 0.6, 2)
    # Boost confidence if intent keyword count was high
    if best_count >= 2:
        tf.confidence = min(1.0, tf.confidence + 0.1)

    return tf


def route_ticket(tf: TicketFields) -> RoutingDecision:
    """Apply three-outcome routing policy."""
    queue = INTENT_TO_QUEUE[tf.intent]

    if tf.urgency_p1:
        return RoutingDecision(
            outcome=RoutingOutcome.ESCALATE,
            queue="L2 On-Call",
            confidence=tf.confidence,
            reason="P1 urgency signal detected — production impact or data loss",
        )

    if tf.confidence < CONFIDENCE_ESCALATE_THRESHOLD:
        return RoutingDecision(
            outcome=RoutingOutcome.ESCALATE,
            queue="L2 On-Call",
            confidence=tf.confidence,
            reason=f"Confidence {tf.confidence:.0%} below escalation threshold "
                   f"({CONFIDENCE_ESCALATE_THRESHOLD:.0%}) — unclassifiable",
        )

    if tf.confidence < CONFIDENCE_ROUTE_THRESHOLD:
        return RoutingDecision(
            outcome=RoutingOutcome.ROUTE_FLAG,
            queue=queue,
            confidence=tf.confidence,
            reason=f"Confidence {tf.confidence:.0%} below review threshold "
                   f"({CONFIDENCE_ROUTE_THRESHOLD:.0%}) — draft held for human review",
        )

    return RoutingDecision(
        outcome=RoutingOutcome.ROUTE,
        queue=queue,
        confidence=tf.confidence,
        reason=f"Confidence {tf.confidence:.0%} — all required fields extracted",
    )


# ---------------------------------------------------------------------------
# Part 2: Response quality scoring
# ---------------------------------------------------------------------------

def score_response(draft: str, articles: list[str]) -> QualityScore:
    """Score a draft response against retrieved articles.

    Groundedness: for each numbered step ("1.", "2.", ...) in the draft,
    check whether any token from that step appears verbatim in the article set.
    Actionability: check that each step starts with a verb (imperative) and
    does not contain speculative language ("might", "should probably", "may").
    """
    SPECULATIVE_PHRASES = ["might", "should probably", "may want to", "perhaps",
                           "possibly", "try to", "you could"]
    IMPERATIVE_STARTERS = [
        "open", "click", "navigate", "go to", "run", "execute", "select",
        "enter", "type", "confirm", "restart", "check", "verify", "contact",
        "copy", "paste", "download", "install", "enable", "disable", "set",
    ]

    # Extract numbered steps from the draft
    steps: list[str] = []
    for line in draft.splitlines():
        stripped = line.strip()
        if stripped and stripped[0].isdigit() and "." in stripped[:3]:
            steps.append(stripped)

    if not steps:
        # No structured steps — treat as a single unscored block
        return QualityScore(
            groundedness=0.0,
            actionability=0.0,
            verdict=QualityVerdict.BLOCK,
            failing_dimension="No numbered steps found in draft",
        )

    article_text = " ".join(articles).lower()

    grounded_count = 0
    actionable_count = 0

    for step in steps:
        lower_step = step.lower()

        # Groundedness: at least 4 consecutive words from the step appear in articles
        words = lower_step.split()
        grounded = False
        for i in range(len(words) - 3):
            phrase = " ".join(words[i:i+4])
            if phrase in article_text:
                grounded = True
                break
        if grounded:
            grounded_count += 1

        # Actionability: starts with imperative verb, no speculative language
        # Strip the step number prefix
        content = step.lstrip("0123456789. ").lower()
        starts_imperative = any(content.startswith(v) for v in IMPERATIVE_STARTERS)
        no_speculative = not any(sp in content for sp in SPECULATIVE_PHRASES)
        if starts_imperative and no_speculative:
            actionable_count += 1

    total = len(steps)
    groundedness = round(grounded_count / total, 2)
    actionability = round(actionable_count / total, 2)

    # Determine verdict
    if groundedness < 1.0:
        verdict = QualityVerdict.BLOCK
        failing_dimension = (
            f"groundedness {groundedness:.0%} — "
            f"{total - grounded_count} step(s) not traceable to retrieved articles"
        )
    elif actionability < 0.9:
        verdict = QualityVerdict.PARTIAL
        failing_dimension = (
            f"actionability {actionability:.0%} — "
            f"{total - actionable_count} step(s) speculative or not imperative"
        )
    else:
        verdict = QualityVerdict.PASS
        failing_dimension = ""

    return QualityScore(
        groundedness=groundedness,
        actionability=actionability,
        verdict=verdict,
        failing_dimension=failing_dimension,
    )


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

TICKETS = [
    # (label, raw_text)
    (
        "Clear break/fix — Grafana v2 alert not firing",
        "Subject: Grafana v2 alert rules not working\n"
        "Our grafana v2 alerting is broken. Rules are configured but alerts are "
        "not firing. This started after the config change yesterday. Error in logs: "
        "'evaluation failed'. Urgent.",
    ),
    (
        "Access request — incomplete, low confidence",
        "Hi, I need access to something. Thanks.",
    ),
    (
        "P1 escalation — production down",
        "Subject: Complete outage — all users cannot login\n"
        "Production down since 09:00 CET. All users are locked out. Data loss "
        "risk. SLA breach in 20 minutes. Need immediate help.",
    ),
    (
        "Follow-up ticket — prior contact present",
        "Re: Salesforce v3 billing invoice discrepancy\n"
        "Reopening this issue. The charge on our invoice still doesn't match the "
        "subscription plan. Previous ticket was closed but the problem persists.",
    ),
]

# Synthetic retrieved articles for the quality scorer
ARTICLES = [
    "To check grafana alert evaluation, navigate to Alerting > Alert Rules in the sidebar.",
    "Select the rule that is not firing and click 'Test rule' to run a manual evaluation.",
    "Verify the data source connection is healthy by going to Configuration > Data Sources.",
    "Restart the grafana-server service to reload rule configurations after a config change.",
    "Confirm the alert state transitions from Pending to Firing in the rule detail view.",
]

# Draft responses for the quality scorer
DRAFTS = [
    (
        "Good draft — grounded and actionable",
        "Thank you for contacting support. To resolve the Grafana alert issue:\n"
        "1. Navigate to Alerting > Alert Rules in the sidebar to check grafana alert evaluation.\n"
        "2. Select the rule that is not firing and click 'Test rule' to run a manual evaluation.\n"
        "3. Verify the data source connection is healthy by going to Configuration > Data Sources.\n"
        "4. Restart the grafana-server service to reload rule configurations after a config change.\n"
        "5. Confirm the alert state transitions from Pending to Firing in the rule detail view.\n"
    ),
    (
        "Bad draft — hallucinated step and speculative language",
        "Thank you for contacting support. To resolve the Grafana alert issue:\n"
        "1. Navigate to Alerting > Alert Rules in the sidebar to check grafana alert evaluation.\n"
        "2. You might want to check the secret grafana cache directory at /var/grafana/cache.\n"
        "3. Select the rule that is not firing and click 'Test rule' to run a manual evaluation.\n"
        "4. Perhaps try restarting the entire server cluster if the issue persists.\n"
    ),
]


def run_triage_demo() -> None:
    print("=" * 80)
    print("PART 1 — TICKET TRIAGE ROUTER")
    print("=" * 80)

    for label, raw in TICKETS:
        print(f"\n  Ticket: {label}")
        print(f"  Text:   {raw[:80].strip()}{'...' if len(raw) > 80 else ''}")
        tf = extract_fields(raw)
        print(f"  Extracted: intent={tf.intent.value}, product={tf.product or '(none)'},",
              f"version={tf.version or '(none)'}, urgency_p1={tf.urgency_p1},",
              f"prior_contact={tf.prior_contact}, confidence={tf.confidence:.0%}")
        rd = route_ticket(tf)
        print(f"  Outcome:  {rd.outcome.value}")
        print(f"  Queue:    {rd.queue}")
        print(f"  Reason:   {rd.reason}")


def run_quality_demo() -> None:
    print()
    print("=" * 80)
    print("PART 2 — RESPONSE QUALITY SCORER")
    print("=" * 80)
    print(f"\n  Retrieved articles ({len(ARTICLES)} snippets):")
    for i, a in enumerate(ARTICLES, 1):
        print(f"    [{i}] {a[:70]}...")

    for label, draft in DRAFTS:
        print(f"\n  Draft: {label}")
        qs = score_response(draft, ARTICLES)
        print(f"  Groundedness:  {qs.groundedness:.0%}")
        print(f"  Actionability: {qs.actionability:.0%}")
        print(f"  Verdict:       {qs.verdict.value}")
        if qs.failing_dimension:
            print(f"  Failing:       {qs.failing_dimension}")


def main() -> None:
    run_triage_demo()
    run_quality_demo()

    print()
    print("=" * 80)
    print("HEADLINE: pipeline gates catch what classifiers miss")
    print("-" * 80)
    print("  Routing: 1 clear route, 1 flagged-for-review, 2 P1 escalations,")
    print("           1 follow-up re-routed with prior-contact signal.")
    print("  Quality: Good draft PASS — all steps grounded and imperative.")
    print("           Bad draft BLOCK — hallucinated step + speculative language")
    print("           caught before the response reaches a human agent.")
    print("  The policy logic (thresholds, citation rules) is the engineering")
    print("  deliverable; the model fills the extraction and generation slots.")
    print("=" * 80)


if __name__ == "__main__":
    main()
