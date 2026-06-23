"""Prompt pattern classifier and output contract validator — stdlib Python.

Part 1: Pattern classifier.
  Takes a prompt string and assigns it to one of six named patterns (or
  "unstructured"). Uses a scored feature-extraction approach so the confidence
  score is interpretable: each matching feature adds weight to one or more
  pattern labels. The highest-scoring label wins.

Part 2: Output contract validator.
  Takes a labelled-template contract (a dict of field names to optional
  value constraints) and a model response string, and reports which required
  fields are present, missing, or constraint-violating. Deterministic,
  no regex magic — just prefix/keyword matching on the response lines.

Part 3: Workshop-vs-Production failure demonstration.
  The lesson's core insight: a prompt can score perfectly on the three demo
  inputs the workshop presenter hand-picked, and still fail on the fourth
  real-world input the team will hit in week two. We model a "summarise
  support tickets" prompt that exhibits three named failure shapes — the
  demo set passes 100%, the production-shaped set fails 70-80% — so the
  reader can see the gap quantified, not just described.

The driver runs all three parts. Two prompts in Part 1 score below 0.5
confidence (exercise 5). One response in Part 2 has a missing required field
(exercise 2). Part 3 fails on production-shaped inputs even though the demo
set is green. All three are deliberate.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

class Pattern(Enum):
    ZERO_SHOT       = "zero-shot instruction"
    FEW_SHOT        = "few-shot with contract"
    CHAIN_OF_THOUGHT = "chain-of-thought"
    PERSONA_CONSTRAINT = "persona + constraint"
    DECOMPOSE_ROUTE = "decompose and route"
    CRITIC_REVISE   = "critic-then-revise"
    UNSTRUCTURED    = "unstructured"


@dataclass
class PromptSample:
    label: str
    text: str


@dataclass
class ClassifierResult:
    pattern: Pattern
    confidence: float        # 0.0 – 1.0
    matched_features: list[str]


@dataclass
class ContractField:
    name: str
    required: bool = True
    allowed_values: Optional[list[str]] = None   # None = unconstrained


@dataclass
class ValidationResult:
    field: str
    present: bool
    constraint_ok: Optional[bool]   # None if field absent or unconstrained
    detail: str


# ---------------------------------------------------------------------------
# Part 1: Pattern classifier
# ---------------------------------------------------------------------------

# Feature weights: (pattern, weight). Sum per pattern, normalise to [0,1].
_FEATURES: list[tuple[str, list[tuple[Pattern, float]]]] = [
    # Few-shot signals
    ("example 1:", [(Pattern.FEW_SHOT, 0.5)]),
    ("example:", [(Pattern.FEW_SHOT, 0.5)]),
    ("input:", [(Pattern.FEW_SHOT, 0.4), (Pattern.ZERO_SHOT, 0.1)]),
    ("output:", [(Pattern.FEW_SHOT, 0.4), (Pattern.ZERO_SHOT, 0.1)]),
    ("for example,", [(Pattern.FEW_SHOT, 0.3)]),
    ("here is an example", [(Pattern.FEW_SHOT, 0.3)]),

    # Chain-of-thought signals
    ("think step by step", [(Pattern.CHAIN_OF_THOUGHT, 0.8)]),
    ("let's think", [(Pattern.CHAIN_OF_THOUGHT, 0.7)]),
    ("reasoning:", [(Pattern.CHAIN_OF_THOUGHT, 0.5)]),
    ("scratchpad:", [(Pattern.CHAIN_OF_THOUGHT, 0.5)]),
    ("step 1:", [(Pattern.CHAIN_OF_THOUGHT, 0.4)]),
    ("first,", [(Pattern.CHAIN_OF_THOUGHT, 0.2)]),

    # Persona + constraint signals
    ("you are a", [(Pattern.PERSONA_CONSTRAINT, 0.5), (Pattern.ZERO_SHOT, 0.2)]),
    ("you are an", [(Pattern.PERSONA_CONSTRAINT, 0.5), (Pattern.ZERO_SHOT, 0.2)]),
    ("acting as", [(Pattern.PERSONA_CONSTRAINT, 0.4)]),
    ("do not", [(Pattern.PERSONA_CONSTRAINT, 0.3), (Pattern.ZERO_SHOT, 0.1)]),
    ("never", [(Pattern.PERSONA_CONSTRAINT, 0.3)]),
    ("only respond", [(Pattern.PERSONA_CONSTRAINT, 0.4)]),

    # Decompose-and-route signals
    ("sub-task", [(Pattern.DECOMPOSE_ROUTE, 0.6)]),
    ("subtask", [(Pattern.DECOMPOSE_ROUTE, 0.6)]),
    ("step 1 of", [(Pattern.DECOMPOSE_ROUTE, 0.5)]),
    ("route to", [(Pattern.DECOMPOSE_ROUTE, 0.5)]),
    ("break this into", [(Pattern.DECOMPOSE_ROUTE, 0.5)]),

    # Critic-then-revise signals
    ("critique", [(Pattern.CRITIC_REVISE, 0.6)]),
    ("evaluate the following", [(Pattern.CRITIC_REVISE, 0.5)]),
    ("assess", [(Pattern.CRITIC_REVISE, 0.3)]),
    ("improve the", [(Pattern.CRITIC_REVISE, 0.3)]),
    ("revise", [(Pattern.CRITIC_REVISE, 0.5)]),
    ("rubric:", [(Pattern.CRITIC_REVISE, 0.6)]),

    # Output contract signals (boost whichever pattern is already leading)
    ("answer:", [(Pattern.ZERO_SHOT, 0.2), (Pattern.FEW_SHOT, 0.1)]),
    ("confidence:", [(Pattern.ZERO_SHOT, 0.2)]),
    ("format:", [(Pattern.ZERO_SHOT, 0.2), (Pattern.FEW_SHOT, 0.1)]),
    ("respond with", [(Pattern.ZERO_SHOT, 0.3)]),
    ("return a json", [(Pattern.ZERO_SHOT, 0.4)]),
]

_MAX_SCORE: dict[Pattern, float] = {}
for _keyword, _weights in _FEATURES:
    for _pat, _w in _weights:
        _MAX_SCORE[_pat] = _MAX_SCORE.get(_pat, 0.0) + _w


def classify_prompt(prompt: str) -> ClassifierResult:
    """Score a prompt against the feature table. Return the best-scoring pattern."""
    lower = prompt.lower()
    scores: dict[Pattern, float] = {p: 0.0 for p in Pattern}
    matched: list[str] = []

    for keyword, weights in _FEATURES:
        if keyword in lower:
            matched.append(keyword)
            for pat, w in weights:
                scores[pat] += w

    # Remove UNSTRUCTURED from scoring — it is the fallback
    scores.pop(Pattern.UNSTRUCTURED, None)

    if not scores or max(scores.values()) == 0.0:
        return ClassifierResult(Pattern.UNSTRUCTURED, 0.0, [])

    best_pat = max(scores, key=lambda p: scores[p])
    raw_score = scores[best_pat]
    # Normalise against max achievable score for this pattern (cap at 1.0)
    max_achievable = _MAX_SCORE.get(best_pat, 1.0)
    confidence = min(raw_score / max_achievable, 1.0) if max_achievable > 0 else 0.0

    if confidence < 0.15:
        return ClassifierResult(Pattern.UNSTRUCTURED, confidence, matched)
    return ClassifierResult(best_pat, confidence, matched)


# ---------------------------------------------------------------------------
# Part 2: Output contract validator
# ---------------------------------------------------------------------------

def validate_response(
    response: str,
    contract: list[ContractField],
) -> list[ValidationResult]:
    """Check a response string against a list of ContractFields.

    Each field is expected to appear on its own line as:
        FIELD_NAME: <value>

    Case-insensitive match on the field name prefix.
    """
    results: list[ValidationResult] = []
    lines = response.strip().splitlines()

    for cf in contract:
        prefix = cf.name.upper() + ":"
        matching_lines = [l.strip() for l in lines if l.strip().upper().startswith(prefix)]

        if not matching_lines:
            results.append(ValidationResult(
                field=cf.name,
                present=False,
                constraint_ok=None,
                detail="field missing from response",
            ))
            continue

        value = matching_lines[0][len(prefix):].strip()

        if cf.allowed_values is not None:
            ok = any(v.lower() == value.lower() for v in cf.allowed_values)
            results.append(ValidationResult(
                field=cf.name,
                present=True,
                constraint_ok=ok,
                detail=(
                    f"value '{value}' accepted"
                    if ok
                    else f"value '{value}' not in {cf.allowed_values}"
                ),
            ))
        else:
            results.append(ValidationResult(
                field=cf.name,
                present=True,
                constraint_ok=True,
                detail=f"value '{value[:40]}'" + ("..." if len(value) > 40 else ""),
            ))

    return results


# ---------------------------------------------------------------------------
# Sample data
# ---------------------------------------------------------------------------

SAMPLE_PROMPTS: list[PromptSample] = [
    PromptSample(
        label="Good zero-shot with contract",
        text=(
            "You are a senior technical writer. "
            "Summarise the following release note in one sentence. "
            "Do not include version numbers. "
            "Respond with exactly two fields:\n"
            "ANSWER: <one sentence, ≤ 30 words>\n"
            "CONFIDENCE: low | medium | high"
        ),
    ),
    PromptSample(
        label="Few-shot with contract",
        text=(
            "Classify the sentiment of each customer comment.\n\n"
            "Example 1:\n"
            "Input: 'The onboarding was seamless.'\n"
            "Output: SENTIMENT: positive\n\n"
            "Example 2:\n"
            "Input: 'It crashed three times.'\n"
            "Output: SENTIMENT: negative\n\n"
            "Now classify:\n"
            "Input: '{comment}'\n"
            "Output:"
        ),
    ),
    PromptSample(
        label="Chain-of-thought",
        text=(
            "A client invoices 120 hours at €85/hour, minus a 10% early-payment "
            "discount. What is the final amount?\n"
            "Think step by step, then provide:\n"
            "REASONING: <your working>\n"
            "ANSWER: <final amount in euros>"
        ),
    ),
    PromptSample(
        label="Persona + constraint (tight)",
        text=(
            "You are an EU GDPR compliance officer. "
            "Review the following data processing description. "
            "Only respond in terms of GDPR Articles 5–9. "
            "Never speculate about intent. "
            "FINDING: <one sentence>\n"
            "ARTICLE: <article number(s)>"
        ),
    ),
    PromptSample(
        label="Critic-then-revise (critic call)",
        text=(
            "Evaluate the following project status summary against this rubric:\n"
            "Rubric:\n"
            "1. States current phase clearly.\n"
            "2. Lists at least one risk.\n"
            "3. States next milestone with date.\n\n"
            "Summary: '{summary}'\n\n"
            "SCORE: pass | fail\n"
            "GAPS: <list missing rubric items or 'none'>"
        ),
    ),
    PromptSample(
        label="Unstructured (no contract, no pattern)",
        text="Tell me something about machine learning.",
    ),
    PromptSample(
        label="Ambiguous — short persona, no contract",
        text="You are helpful. Summarise this text.",
    ),
]


# Standard contract for the first sample prompt
SAMPLE_CONTRACT: list[ContractField] = [
    ContractField("ANSWER", required=True, allowed_values=None),
    ContractField("CONFIDENCE", required=True, allowed_values=["low", "medium", "high"]),
]

SAMPLE_RESPONSES: list[tuple[str, str]] = [
    (
        "Good response — all fields present and valid",
        "ANSWER: The v3.2 release adds multi-region failover and cuts cold-start latency by 40%.\nCONFIDENCE: high",
    ),
    (
        "Bad response — CONFIDENCE field missing (exercise 2 target)",
        "ANSWER: The release improves performance and stability across all tiers.",
    ),
    (
        "Bad response — CONFIDENCE value not in allowed set",
        "ANSWER: Three new integrations ship in this release.\nCONFIDENCE: very high",
    ),
]


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------
# Part 3: Workshop-vs-Production failure demonstration
# ---------------------------------------------------------------------------
#
# Lesson insight: a prompt can be 100% green on the three demo inputs a
# workshop presenter hand-picked, and still fail on the 100th real input
# the team sees in week two. The "demo set" shares a distribution the live
# process does not — shorter, cleaner, English-only, well-formed. The
# production set has noise, missing fields, foreign-language strings,
# adversarial phrasing, and out-of-scope requests.
#
# Below we model a "summarise a support ticket" prompt with a hand-built
# quality function. The function is intentionally simple (keyword +
# length checks) — it stands in for what a real eval rubric would do.
# The point is the gap, not the rubric.

# Three named failure shapes (the same shapes the lesson doc names
# verbally in the "Field notes" sidebar). Each is what a workshop
# prompt silently produces in production.
WORKSHOP_PROMPT = (
    "Summarise the following support ticket in 2-3 sentences. "
    "Identify the customer's problem and the resolution status."
)


def _demo_input(text: str) -> str:
    """Strip to a clean, English, well-formed ticket — the workshop demo shape."""
    return f"Ticket: {text}. Customer: Acme GmbH. Status: resolved. Action taken: password reset."


def _production_input(text: str, lang: str = "en") -> str:
    """A realistic ticket: noise, missing fields, possibly non-English, status unclear."""
    return f"hallo kunde schreibt {text}, kein status?? bitte schauen, danke. (#4471)"


def rubric_summarise(model_output: str, source: str) -> dict:
    """Toy rubric: 3 binary checks. Real rubric would use LLM-as-judge + ground truth.

    Returns dict with per-check pass/fail and a single overall 'pass' bool.
    """
    out = model_output.lower()

    has_resolution_status = any(w in out for w in (
        "resolved", "open", "pending", "escalated", "unresolved", "abgeschlossen",
        "geklärt", "ouvert", "in arbeit",
    ))
    has_customer_problem = len(out.split()) >= 5 and any(w in out for w in (
        "password", "login", "access", "billing", "invoice", "outage", "error",
        "passwort", "zugang", "rechnung", "fehler", "connexion", "erreur",
    ))
    not_too_long = len(model_output.split()) <= 40

    overall = has_resolution_status and has_customer_problem and not_too_long
    return {
        "has_resolution_status": has_resolution_status,
        "has_customer_problem": has_customer_problem,
        "not_too_long": not_too_long,
        "pass": overall,
    }


def _model_stand_in(prompt: str, source: str) -> str:
    """Toy 'model' that mimics the failure shapes a real LLM would produce.

    Workshop-shaped input → clean, complete summary.   (the demo illusion)
    Production-shaped input → the model parrots the noise; status, customer
    problem, and length are not what a downstream tool can rely on.
    """
    s = source.lower()
    if "kunde" in s or "schauen" in s or "résolu" in s or "facture" in s:
        # production-shaped: model is verbose, misses the status field, picks
        # up the noise ("hallo kunde schreibt...") instead of the problem.
        if "passwort" in s or "password" in s:
            return ("The customer opened the ticket. The support team reviewed "
                    "the request and proceeded with the standard handling. "
                    "A colleague will follow up as appropriate.")
        return ("Ticket received from the customer. The text was reviewed and "
                "routed to the appropriate queue. Awaiting further information "
                "from the requester on next steps.")
    # demo-shaped: model gives the clean two-sentence summary the presenter wants
    if "password" in s or "passwort" in s:
        return "Customer had a password reset issue. Status: resolved."
    if "billing" in s or "rechnung" in s or "facture" in s:
        return "Customer had a billing question about an invoice. Status: pending."
    if "login" in s or "zugang" in s or "connexion" in s:
        return "Customer could not log in. Status: resolved via account unlock."
    return "Customer reported an access issue. Status: resolved."


def run_workshop_vs_production() -> None:
    """Demo set: 3 inputs hand-picked by the workshop presenter.
    Production set: 5 inputs that look like real tickets.
    Same prompt, same rubric, same model stand-in. The gap is the point.
    """
    print()
    print("PART 3 — WORKSHOP-vs-PRODUCTION FAILURE DEMONSTRATION")
    print("-" * 80)
    print("  Prompt: \"Summarise the support ticket in 2-3 sentences.")
    print("            Identify the customer's problem and the resolution status.\"")
    print()
    print("  Three named failure shapes this demo exhibits:")
    print("    Shape A — the demo illusion: 3 hand-picked inputs all pass the rubric.")
    print("    Shape B — the noise leak: production tickets come with chat-tone,")
    print("              'hallo kunde schreibt…', a ticket number in parens, and")
    print("              no machine-readable status. The summary parrots the noise.")
    print("    Shape C — the language drift: a German/French ticket still gets")
    print("              a confident English summary; the downstream tool that")
    print("              relied on the 'status: resolved' enum gets a wrong value.")
    print()

    demo_inputs = [
        _demo_input("Customer reports a password reset failure"),
        _demo_input("Customer has a billing question about invoice INV-4471"),
        _demo_input("Customer cannot log in to the partner portal"),
    ]
    production_inputs = [
        _production_input("Passwort geht nicht mehr"),
        _production_input("habe immer noch keine Rechnung erhalten"),
        _production_input("le client dit que la facture est incorrecte"),
        _production_input("???   kein zugriff auf das portal bitte helfen"),
        _production_input("outage in production seit 14:00 uhr, bitte dringend"),
    ]

    demo_results = [
        (label, rubric_summarise(_model_stand_in(WORKSHOP_PROMPT, src), src)["pass"])
        for label, src in (
            ("password reset", demo_inputs[0]),
            ("billing/invoice", demo_inputs[1]),
            ("login failure", demo_inputs[2]),
        )
    ]
    prod_results = [
        (label, rubric_summarise(_model_stand_in(WORKSHOP_PROMPT, src), src)["pass"])
        for label, src in (
            ("DE password (real)", production_inputs[0]),
            ("DE invoice (real)", production_inputs[1]),
            ("FR facture (real)", production_inputs[2]),
            ("DE garbled (real)", production_inputs[3]),
            ("DE outage (real)", production_inputs[4]),
        )
    ]

    demo_pass = sum(1 for _, ok in demo_results if ok)
    prod_pass = sum(1 for _, ok in prod_results if ok)

    print(f"  Demo set:     {demo_pass} / {len(demo_results)} pass the rubric (clean, English, well-formed)")
    print(f"  Production:   {prod_pass} / {len(prod_results)} pass the rubric (real ticket shapes)")
    print()
    print("  Detail:")
    for label, ok in demo_results:
        print(f"    [demo]       {label:<30} {'PASS' if ok else 'FAIL'}")
    for label, ok in prod_results:
        print(f"    [production] {label:<30} {'PASS' if ok else 'FAIL'}")

    print()
    print("  Read the numbers: a prompt that scores 100% in the workshop")
    print("  scores roughly 0% on production inputs. The prompt is identical.")
    print("  The difference is the input distribution, which the workshop")
    print("  never showed. The lesson in this code block: ship the rubric")
    print("  WITH the prompt, run it on a stratified sample of the real")
    print("  queue before any go/no-go, and treat a green demo as a necessary")
    print("  but not sufficient condition.")


# ---------------------------------------------------------------------------

def main() -> None:
    print("=" * 80)
    print("PROMPT PATTERN CLASSIFIER + OUTPUT CONTRACT VALIDATOR (Phase 11, Lesson 76)")
    print("=" * 80)

    # --- Part 1: Classify prompts ---
    print()
    print("PART 1 — PROMPT PATTERN CLASSIFIER")
    print("-" * 80)
    low_confidence_count = 0
    for sample in SAMPLE_PROMPTS:
        result = classify_prompt(sample.text)
        conf_tag = f"{result.confidence:.2f}"
        if result.confidence < 0.5:
            low_confidence_count += 1
            conf_tag += " [low-confidence]"
        print(f"  {sample.label}")
        print(f"    -> {result.pattern.value:<30} confidence={conf_tag}")
        if result.matched_features:
            print(f"    matched: {', '.join(result.matched_features[:5])}")
        print()

    # --- Part 2: Validate responses against contract ---
    print()
    print("PART 2 — OUTPUT CONTRACT VALIDATOR")
    print(f"  Contract: {[cf.name + ('*' if cf.required else '') for cf in SAMPLE_CONTRACT]}")
    print("-" * 80)
    fail_count = 0
    for desc, response in SAMPLE_RESPONSES:
        print(f"  {desc}")
        results = validate_response(response, SAMPLE_CONTRACT)
        for r in results:
            status = "OK" if r.present and (r.constraint_ok is not False) else "FAIL"
            if status == "FAIL":
                fail_count += 1
            print(f"    [{status}] {r.field}: {r.detail}")
        print()

    # --- Summary ---
    print("=" * 80)
    print("HEADLINE: a workshop-green prompt can be production-red on the same model, same rubric")
    print("-" * 80)
    print(f"  {low_confidence_count} of {len(SAMPLE_PROMPTS)} prompts scored below 0.5 confidence")
    print(f"  (ambiguous or unstructured — the classifier cannot assign a reliable pattern).")
    print(f"  {fail_count} contract violation(s) detected across {len(SAMPLE_RESPONSES)} sample responses.")
    print()
    print("  The pattern classifier finds prompts without a contract, without examples,")
    print("  or without a scope constraint — before they go near a model. The contract")
    print("  validator catches missing fields and bad enum values in responses — before")
    print("  they go near downstream code. Both checks are deterministic and fast.")
    print("  Apply them in a pre-flight pass on any prompt you version-control.")
    print()

    # --- Part 3: Workshop-vs-Production failure demo (the lesson's core insight) ---
    run_workshop_vs_production()


if __name__ == "__main__":
    main()
