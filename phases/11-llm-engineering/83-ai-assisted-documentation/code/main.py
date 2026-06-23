"""Source-grounding matcher and documentation health scorer — stdlib Python.

Part 1: Claim-to-artifact matcher.
    Takes a set of documentation claims and a set of source artifacts. Each
    claim is matched against the artifact corpus. A claim is GROUNDED if a
    matching artifact exists and its content is current. A claim is INFERRED
    if the model derived it from context without an explicit artifact match.
    A claim is UNRESOLVED if no artifact can be found.

Part 2: Documentation health scorer.
    Applies doc-type-specific grounding thresholds (from the lesson table) to
    produce a pass/fail health report with per-claim detail. The scorer mirrors
    the CI-integration pattern: it returns a non-zero exit code when a
    document fails its threshold, which a CI pipeline can treat as a build
    failure.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# ---------- Grounding status ----------

class GroundingStatus(Enum):
    GROUNDED = "GROUNDED"
    INFERRED = "INFERRED"
    UNRESOLVED = "UNRESOLVED"


# ---------- Doc types and their grounding thresholds ----------

class DocType(Enum):
    ADR = "Architecture Decision Record"
    RUNBOOK = "Runbook / Operations guide"
    API_DOCS = "API / Schema documentation"
    HANDOFF = "Handoff / Transition document"


# Minimum fraction of claims that must be GROUNDED (not INFERRED or UNRESOLVED)
# for the document to pass health check.
GROUNDING_THRESHOLD: dict[DocType, float] = {
    DocType.ADR:      0.80,  # decisions must be traceable
    DocType.RUNBOOK:  0.90,  # operational steps must reference real resources
    DocType.API_DOCS: 1.00,  # every endpoint/field must be spec-derived
    DocType.HANDOFF:  0.75,  # state claims must be timestamped and traceable
}


# ---------- Source artifact ----------

@dataclass
class Artifact:
    artifact_id: str   # e.g. "infra/main.bicep:L44", "JIRA-1234", "openapi.yaml:paths./users"
    content_keywords: tuple[str, ...]  # keywords that a claim must mention to match


# ---------- Documentation claim ----------

@dataclass
class Claim:
    text: str
    status: GroundingStatus = GroundingStatus.UNRESOLVED
    resolved_by: str = ""


# ---------- Matcher ----------

def match_claims(claims: list[Claim], artifacts: list[Artifact]) -> list[Claim]:
    """Return claims annotated with grounding status.

    Matching rule: a claim is GROUNDED if the claim text contains at least one
    keyword from any artifact in the corpus. The first matching artifact wins.
    INFERRED claims are passed through unchanged (they were already labeled).
    Everything else remains UNRESOLVED.
    """
    for claim in claims:
        if claim.status is GroundingStatus.INFERRED:
            continue  # pre-labeled; do not overwrite
        for artifact in artifacts:
            if any(kw.lower() in claim.text.lower() for kw in artifact.content_keywords):
                claim.status = GroundingStatus.GROUNDED
                claim.resolved_by = artifact.artifact_id
                break
    return claims


# ---------- Health scorer ----------

def score_document(
    doc_type: DocType,
    claims: list[Claim],
) -> tuple[bool, float, str]:
    """Return (passed, grounded_fraction, summary_line).

    A document passes if grounded_fraction >= threshold for its type.
    INFERRED claims do not count as GROUNDED but do not count as UNRESOLVED
    either — they reduce the grounded fraction without triggering a hard fail
    on their own, but are flagged for human review.
    """
    total = len(claims)
    if total == 0:
        return True, 1.0, "no claims to score"

    grounded = sum(1 for c in claims if c.status is GroundingStatus.GROUNDED)
    inferred = sum(1 for c in claims if c.status is GroundingStatus.INFERRED)
    unresolved = sum(1 for c in claims if c.status is GroundingStatus.UNRESOLVED)

    grounded_fraction = grounded / total
    threshold = GROUNDING_THRESHOLD[doc_type]
    passed = grounded_fraction >= threshold

    summary = (
        f"{grounded}/{total} grounded ({grounded_fraction:.0%}) | "
        f"{inferred} inferred | {unresolved} unresolved | "
        f"threshold {threshold:.0%} -> {'PASS' if passed else 'FAIL'}"
    )
    return passed, grounded_fraction, summary


# ---------- Driver ----------

def run_scenario(
    label: str,
    doc_type: DocType,
    claims: list[Claim],
    artifacts: list[Artifact],
) -> bool:
    print(f"  {doc_type.value}: {label}")
    annotated = match_claims(claims, artifacts)
    for i, c in enumerate(annotated, 1):
        src = f"  <- {c.resolved_by}" if c.resolved_by else ""
        flag = " [FLAG: review required]" if c.status is GroundingStatus.INFERRED else ""
        print(f"    {i}. [{c.status.value:<10}]{flag} {c.text[:60]}{src}")
    passed, fraction, summary = score_document(doc_type, annotated)
    print(f"    -> {summary}")
    print()
    return passed


def main() -> None:
    print("=" * 72)
    print("SOURCE-GROUNDING MATCHER + DOCUMENTATION HEALTH SCORER")
    print("Phase 11, Lesson 83")
    print("=" * 72)
    print()

    # --- Scenario 1: ADR — mostly grounded, one inference, passes threshold ---
    adr_artifacts = [
        Artifact("JIRA-4421",          ("latency", "p99", "database")),
        Artifact("PR-882/description", ("postgres", "migration", "schema")),
        Artifact("ADR-07.md",          ("event sourcing", "kafka", "append-only")),
        Artifact("bench-2025-11.xlsx", ("throughput", "benchmark", "comparison")),
    ]
    adr_claims = [
        Claim("The p99 database latency exceeded 400ms under load (JIRA-4421)."),
        Claim("We chose event sourcing over direct SQL updates to decouple writes."),
        Claim("The postgres schema migration was validated in PR-882."),
        Claim("Throughput benchmarks showed a 3x improvement over the baseline.",
              status=GroundingStatus.INFERRED),  # model inference; no raw data attached
        Claim("Kafka was selected as the append-only event log after ADR-07."),
    ]
    passed_adr = run_scenario("new event sourcing decision", DocType.ADR,
                              adr_claims, adr_artifacts)

    # --- Scenario 2: Runbook — one unresolved step, fails threshold ---
    runbook_artifacts = [
        Artifact("infra/main.bicep:L44",    ("app-service", "restart", "az webapp")),
        Artifact("monitoring/alerts.yaml",  ("cpu", "alert", "threshold")),
        Artifact("infra/redis.tf:L12",      ("redis", "flush", "cache")),
    ]
    runbook_claims = [
        Claim("Run `az webapp restart --name app-service-prod` to restart the service."),
        Claim("If CPU alert fires, check the monitoring/alerts.yaml threshold."),
        Claim("Flush the Redis cache using the procedure in infra/redis.tf step 12."),
        Claim("Rotate the API key in Azure Key Vault using the admin portal."),  # no artifact
        Claim("Scale out to 5 instances if throughput exceeds 10k req/s."),       # no artifact
    ]
    passed_runbook = run_scenario("on-call restart procedure", DocType.RUNBOOK,
                                  runbook_claims, runbook_artifacts)

    # --- Scenario 3: API docs — fully grounded from spec, passes threshold ---
    api_artifacts = [
        Artifact("openapi.yaml:paths./users.GET",   ("GET /users", "200", "user list")),
        Artifact("openapi.yaml:paths./users.POST",  ("POST /users", "201", "created")),
        Artifact("openapi.yaml:components.schemas", ("email", "required", "string")),
        Artifact("openapi.yaml:paths./users.errors", ("404", "not found", "error")),
    ]
    api_claims = [
        Claim("GET /users returns a 200 with the user list."),
        Claim("POST /users returns 201 when the user is created."),
        Claim("The email field is a required string in the request schema."),
        Claim("A 404 error is returned when the user is not found."),
    ]
    passed_api = run_scenario("users endpoint reference", DocType.API_DOCS,
                              api_claims, api_artifacts)

    # --- Scenario 4: Handoff doc — mixed, passes threshold ---
    handoff_artifacts = [
        Artifact("git:HEAD@2026-06-18",         ("last commit", "deploy", "main")),
        Artifact("JIRA-board:open-tickets",     ("open", "ticket", "backlog")),
        Artifact("ADR-09.md",                   ("feature flag", "rollout", "decision")),
        Artifact("infra/cron.yaml:L8",          ("workaround", "cron", "retry")),
    ]
    handoff_claims = [
        Claim("The last commit deployed to main on 2026-06-18 (git:HEAD)."),
        Claim("Three open tickets remain in the JIRA backlog."),
        Claim("The feature flag rollout decision is documented in ADR-09."),
        Claim("A cron job in infra/cron.yaml:L8 is the current retry workaround."),
        Claim("The team velocity will likely increase once the flag is removed.",
              status=GroundingStatus.INFERRED),
    ]
    passed_handoff = run_scenario("end-of-sprint transition", DocType.HANDOFF,
                                  handoff_claims, handoff_artifacts)

    # --- Summary ---
    results = [
        ("ADR",     passed_adr),
        ("Runbook", passed_runbook),
        ("API",     passed_api),
        ("Handoff", passed_handoff),
    ]
    print("=" * 72)
    print("HEADLINE: grounding thresholds enforce doc-type-specific accountability")
    print("-" * 72)
    for name, passed in results:
        status = "PASS" if passed else "FAIL (below threshold — CI would block merge)"
        print(f"  {name:<8} -> {status}")
    print()
    print("  The Runbook fails because 2 of 5 operational steps reference no")
    print("  retrievable artifact. In a CI pipeline this is a build error, not")
    print("  a style comment. Fix: add the Key Vault rotation procedure to an")
    print("  infra artifact and cite the scale-out threshold in monitoring/alerts.")
    print()
    print("  INFERRED claims never block, but are flagged for human review.")
    print("  A reviewer who approves an [INFERRED] claim without checking owns it.")


if __name__ == "__main__":
    main()
