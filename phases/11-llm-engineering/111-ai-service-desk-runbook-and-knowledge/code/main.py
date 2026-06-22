"""AI Service Desk Triage Model — stdlib Python, no external dependencies.

Part 1 — Ticket classifier:
    Takes a synthetic ticket description plus keyword signals for knowledge
    quality and resolution determinism, and assigns the ticket to one of four
    zones (A/B/C/D). The zone drives the recommended action: automate, augment,
    document-first, or escalate.

Part 2 — Runbook scorer:
    Applies a five-dimension rubric (completeness, determinism, currency,
    machine-readability, ownership) to sample runbook metadata. Returns a score
    out of 10, an automation verdict, and the specific dimensions below threshold.
    A score >= 7 qualifies for Zone A automation; 4-6 is Zone B (analyst surface);
    below 4 is Zone C/D (document or escalate first).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class Zone(Enum):
    A = "A — Automate"
    B = "B — Augment (surface to analyst)"
    C = "C — Document first"
    D = "D — Escalate or accept"


class AutomationVerdict(Enum):
    READY = "READY — qualify for Zone A automation"
    SURFACE = "SURFACE — use as analyst augmentation only"
    DOCUMENT = "DOCUMENT — fix runbook before any automation attempt"
    ESCALATE = "ESCALATE — manual L2/L3; AI flags pattern only"


# ---------------------------------------------------------------------------
# Part 1: Ticket classifier
# ---------------------------------------------------------------------------

# Signals that indicate HIGH knowledge quality (documented, retrievable)
HIGH_KNOWLEDGE_SIGNALS = (
    "kb article",
    "runbook",
    "documented procedure",
    "standard fix",
    "known issue",
    "resolution recorded",
    "wiki",
    "step-by-step",
)

# Signals that indicate HIGH resolution determinism (low ambiguity path)
HIGH_DETERMINISM_SIGNALS = (
    "password reset",
    "vpn reconnect",
    "account unlock",
    "restart service",
    "clear cache",
    "provision account",
    "install package",
    "add to group",
    "update dns",
)


@dataclass
class Ticket:
    id: str
    title: str
    # Summarised context provided by the triage analyst (one sentence each)
    knowledge_context: str
    resolution_context: str


def score_signals(text: str, signals: tuple[str, ...]) -> int:
    """Count how many signals appear as affirmative phrases in the lowercased text.

    Simple negation guard: skip any signal that is immediately preceded by
    "no " or "not " within the five characters before the match. This prevents
    "No runbook" from scoring as a positive runbook signal.
    """
    import re
    lower = text.lower()
    count = 0
    for s in signals:
        for m in re.finditer(re.escape(s), lower):
            start = m.start()
            prefix = lower[max(0, start - 5): start]
            if "no " in prefix or "not " in prefix:
                continue
            count += 1
    return count


def classify_ticket(t: Ticket) -> tuple[Zone, str]:
    """Assign a triage zone based on signal counts in context strings.

    Each context string is evaluated independently so that adding or removing
    a single keyword produces a predictable zone shift — this makes the
    classifier useful as a teaching model as well as a real triage aid.
    """
    kq = score_signals(t.knowledge_context, HIGH_KNOWLEDGE_SIGNALS)
    rd = score_signals(t.resolution_context, HIGH_DETERMINISM_SIGNALS)

    # Thresholds: >=1 hit = high for the signal class
    knowledge_high = kq >= 1
    determinism_high = rd >= 1

    if knowledge_high and determinism_high:
        return Zone.A, f"knowledge signals={kq}, determinism signals={rd}"
    elif knowledge_high and not determinism_high:
        return Zone.B, f"knowledge signals={kq}, determinism signals={rd} (decision ambiguous)"
    elif not knowledge_high and determinism_high:
        return Zone.C, f"knowledge signals={kq} (undocumented fix), determinism signals={rd}"
    else:
        return Zone.D, f"knowledge signals={kq}, determinism signals={rd} (novel or complex)"


# ---------------------------------------------------------------------------
# Part 2: Runbook scorer
# ---------------------------------------------------------------------------

@dataclass
class RunbookMetadata:
    name: str
    completeness: int     # 0-2: missing steps / all steps / steps + validation
    determinism: int      # 0-2: vague / explicit branches / full coverage
    currency: int         # 0-2: stale / recent / change-linked
    machine_readability: int  # 0-2: prose PDF / structured headings / YAML/MD with conditions
    ownership: int        # 0-2: none / named team / named person + cadence

    def total(self) -> int:
        return (self.completeness + self.determinism + self.currency
                + self.machine_readability + self.ownership)

    def weak_dimensions(self) -> list[str]:
        """Return dimension names that score 0."""
        dims = {
            "completeness": self.completeness,
            "determinism": self.determinism,
            "currency": self.currency,
            "machine_readability": self.machine_readability,
            "ownership": self.ownership,
        }
        return [k for k, v in dims.items() if v == 0]


def score_runbook(rb: RunbookMetadata) -> tuple[AutomationVerdict, str]:
    """Return a verdict and rationale for the runbook's automation readiness."""
    total = rb.total()
    weak = rb.weak_dimensions()

    if total >= 7:
        verdict = AutomationVerdict.READY
        rationale = f"score {total}/10 — qualifies for Zone A (shadow mode first)"
    elif total >= 4:
        verdict = AutomationVerdict.SURFACE
        rationale = f"score {total}/10 — surface to analyst; do not automate state changes"
    else:
        verdict = AutomationVerdict.DOCUMENT
        rationale = f"score {total}/10 — too low to use as automation source"

    if weak:
        rationale += f"; zero-score dimensions: {', '.join(weak)}"

    return verdict, rationale


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

SAMPLE_TICKETS: list[Ticket] = [
    Ticket(
        id="T-001",
        title="User locked out of Active Directory account",
        knowledge_context="Step-by-step unlock procedure exists as kb article #AD-04.",
        resolution_context="Account unlock via AD Users and Computers; deterministic.",
    ),
    Ticket(
        id="T-002",
        title="VPN client disconnects after 15 minutes on macOS 15",
        knowledge_context="Known issue logged; resolution recorded in runbook NET-11.",
        resolution_context="VPN reconnect by toggling split-tunnel setting; reproducible.",
    ),
    Ticket(
        id="T-003",
        title="SharePoint permissions error after team migration",
        knowledge_context="Wiki article exists for standard SharePoint permissions; partial coverage.",
        resolution_context="Depends on which groups were migrated and source tenant; path unclear.",
    ),
    Ticket(
        id="T-004",
        title="New employee needs M365 account provisioned",
        knowledge_context="Documented procedure exists in wiki and ticket template.",
        resolution_context="Provision account via admin portal; standard fix.",
    ),
    Ticket(
        id="T-005",
        title="Printer driver install fails on Windows 11 24H2",
        knowledge_context="No runbook; unwritten workaround held by one engineer; not in any system.",
        resolution_context="Install package with elevated flag; always same steps, fully deterministic.",
    ),
    Ticket(
        id="T-006",
        title="Application throws 500 error after last deployment",
        knowledge_context="No documented procedure; happens sporadically.",
        resolution_context="Could be DB connection, config drift, or memory leak; not deterministic.",
    ),
]

SAMPLE_RUNBOOKS: list[RunbookMetadata] = [
    RunbookMetadata(
        name="AD Account Unlock (AD-04)",
        completeness=2,
        determinism=2,
        currency=2,
        machine_readability=1,
        ownership=2,
    ),
    RunbookMetadata(
        name="VPN Reconnect macOS (NET-11)",
        completeness=1,
        determinism=1,
        currency=1,
        machine_readability=0,   # PDF with screenshots
        ownership=1,
    ),
    RunbookMetadata(
        name="M365 Provisioning (HR-02)",
        completeness=0,   # missing validation steps
        determinism=1,
        currency=0,       # last updated 14 months ago
        machine_readability=1,
        ownership=0,      # no named owner
    ),
]


def main() -> None:
    separator = "=" * 76

    print(separator)
    print("SERVICE DESK AI TRIAGE MODEL (Phase 11 · 111)")
    print(separator)

    # --- Part 1: Ticket classification ---
    print()
    print("PART 1 — TICKET ZONE CLASSIFIER")
    print("-" * 76)

    zone_counts: dict[str, int] = {z.name: 0 for z in Zone}
    for t in SAMPLE_TICKETS:
        zone, detail = classify_ticket(t)
        zone_counts[zone.name] += 1
        print(f"  {t.id}  {t.title[:46]:<46}")
        print(f"         -> {zone.value}")
        print(f"            {detail}")
        print()

    print(f"  Zone summary: {dict(zone_counts)}")

    # --- Part 2: Runbook scoring ---
    print()
    print("PART 2 — RUNBOOK AUTOMATION READINESS SCORER")
    print("-" * 76)

    ready_count = 0
    for rb in SAMPLE_RUNBOOKS:
        verdict, rationale = score_runbook(rb)
        if verdict is AutomationVerdict.READY:
            ready_count += 1
        print(f"  Runbook : {rb.name}")
        print(f"  Score   : {rb.total()}/10")
        print(f"  Verdict : {verdict.value}")
        print(f"  Detail  : {rationale}")
        print()

    # --- HEADLINE ---
    print(separator)
    print("HEADLINE: automation readiness is a documentation problem first")
    print("-" * 76)
    zone_a = zone_counts.get("A", 0)
    print(f"  Of {len(SAMPLE_TICKETS)} tickets: {zone_a} in Zone A (automate), "
          f"{zone_counts.get('C', 0)} in Zone C (document first).")
    print(f"  Of {len(SAMPLE_RUNBOOKS)} runbooks: {ready_count} score >= 7 "
          f"(automation-ready).")
    print("  Zone C tickets and low-scoring runbooks share the same root cause:")
    print("  the fix is known and deterministic, but not written down well enough")
    print("  to drive a model or even a new analyst reliably.")
    print("  Prioritise Zone C documentation before building any automation.")
    print(separator)


if __name__ == "__main__":
    main()
