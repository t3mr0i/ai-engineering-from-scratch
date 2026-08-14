"""AI Cost and Value Economics — stdlib Python model.

Two parts:

Part 1 — Cost model.
  Computes per-query API cost under a range of cache hit rates for two model
  tiers (Opus frontier and Haiku fast/cheap). Shows the crossover point where
  a high-hit-rate Opus system becomes cheaper per effective call than a zero-
  cache Haiku system with the same prompt structure.

Part 2 — Routing policy simulator + value-case calculator.
  A three-signal routing rule (length, category, confidence) diverts queries
  to the cheapest tier that meets quality bar. The driver shows cost vs.
  "always Opus" at a configurable monthly query volume, then feeds the saving
  into a simple value-case calculator (break-even volume, payback period).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Model tier definitions (mid-2026 reference prices, USD per million tokens)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ModelTier:
    name: str
    input_price_per_m: float   # $ per million input tokens
    output_price_per_m: float  # $ per million output tokens


HAIKU   = ModelTier("claude-haiku-4",   input_price_per_m=0.25,  output_price_per_m=1.25)
SONNET  = ModelTier("claude-sonnet-4.6", input_price_per_m=3.00, output_price_per_m=15.00)
OPUS    = ModelTier("claude-opus-4.7",  input_price_per_m=15.00, output_price_per_m=75.00)

# Cache costs are fractions of the base input price (Anthropic structure)
CACHE_WRITE_FRACTION = 0.25   # writing a cacheable block: 25% premium over input price (125% total)
CACHE_READ_FRACTION  = 0.10   # reading a cached block: 10% of input price


# ---------------------------------------------------------------------------
# Part 1: Cache hit rate cost model
# ---------------------------------------------------------------------------

def cost_per_query(
    tier: ModelTier,
    system_prompt_tokens: int,
    user_turn_tokens: int,
    output_tokens: int,
    cache_hit_rate: float,
) -> float:
    """Return USD cost per query given a cache hit rate on the system prompt.

    On a cache miss, the system prompt is billed at the full input rate.
    On a cache hit, it is billed at the cache-read rate.
    The user turn is always billed at full input rate (not cached).
    """
    assert 0.0 <= cache_hit_rate <= 1.0

    cache_miss_rate = 1.0 - cache_hit_rate

    # System-prompt tokens: fraction hit cached, fraction miss full price.
    # Amortised cache-write cost: paid once per block TTL; here we fold it
    # into the miss cost (worst-case: every miss triggers a re-write).
    sys_input_cost = (
        system_prompt_tokens * cache_miss_rate * (1.0 + CACHE_WRITE_FRACTION)
        + system_prompt_tokens * cache_hit_rate * CACHE_READ_FRACTION
    ) / 1_000_000 * tier.input_price_per_m

    user_input_cost = user_turn_tokens / 1_000_000 * tier.input_price_per_m
    output_cost     = output_tokens    / 1_000_000 * tier.output_price_per_m

    return sys_input_cost + user_input_cost + output_cost


def print_cache_sweep() -> None:
    """Print cost per query across cache hit rates: cached Opus vs uncached Sonnet.

    The comparison that matters in production is not "Opus vs Haiku" on raw
    price — Haiku always wins on a per-token basis. The real question is whether
    a heavily-cached Opus system can become cost-competitive with an uncached
    Sonnet system on a large-context use case (e.g. RAG with a 4,000-token
    context window). That is where the crossover actually appears.
    """
    sys_tokens    = 4_000   # large system prompt / retrieved context
    user_tokens   = 400
    output_tokens = 600

    hit_rates = [0.0, 0.20, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00]

    print("=" * 72)
    print("PART 1 — CACHE HIT RATE vs COST PER QUERY")
    print(f"  System prompt: {sys_tokens} tokens | User turn: {user_tokens} | "
          f"Output: {output_tokens}")
    print("  Comparing: Opus (variable hit rate) vs Sonnet (0% hit rate)")
    print("-" * 72)
    header = f"  {'Hit rate':>8}  {'Opus ($/q)':>12}  {'Sonnet ($/q)':>13}  "
    header += f"{'Opus cheaper?':>14}"
    print(header)
    print("-" * 72)

    sonnet_zero = cost_per_query(SONNET, sys_tokens, user_tokens, output_tokens, 0.0)
    crossover_hr: float | None = None

    for hr in hit_rates:
        opus_cost  = cost_per_query(OPUS, sys_tokens, user_tokens, output_tokens, hr)
        opus_cheaper = opus_cost < sonnet_zero
        marker = " <-- CROSSOVER" if opus_cheaper and crossover_hr is None else ""
        if opus_cheaper and crossover_hr is None:
            crossover_hr = hr
        print(f"  {hr:>7.0%}  {opus_cost:>12.5f}  {sonnet_zero:>13.5f}  "
              f"{'YES' if opus_cheaper else 'no':>14}{marker}")

    print()
    if crossover_hr is not None:
        print(f"  Crossover: Opus at >{crossover_hr:.0%} cache hit rate is cheaper per query")
        print(f"  than Sonnet at 0% caching on this {sys_tokens}-token context window.")
    else:
        # Fine-grained search for the exact crossover
        for hr_int in range(0, 101):
            hr = hr_int / 100
            if cost_per_query(OPUS, sys_tokens, user_tokens, output_tokens, hr) < sonnet_zero:
                print(f"  Crossover: Opus with >{hr:.0%} cache hit rate is cheaper than "
                      f"Sonnet with 0% caching.")
                break
        else:
            print("  No crossover in this scenario: Sonnet is always cheaper uncached.")


# ---------------------------------------------------------------------------
# Part 2: Routing policy + value-case calculator
# ---------------------------------------------------------------------------

class TaskCategory(Enum):
    STRUCTURED_EXTRACTION = "structured_extraction"
    SHORT_QA              = "short_qa"
    COMPLEX_REASONING     = "complex_reasoning"
    CODE_GENERATION       = "code_generation"


@dataclass
class Query:
    description: str
    input_tokens: int
    output_tokens: int
    category: TaskCategory
    confidence: float   # 0.0–1.0: routing classifier confidence for downgrade


# Routing thresholds
MAX_TOKENS_FOR_HAIKU   = 600   # queries under this token count route to Haiku
MIN_CONFIDENCE_HAIKU   = 0.85  # minimum confidence to route to Haiku
MIN_CONFIDENCE_SONNET  = 0.70  # minimum confidence to route to Sonnet

# Fraction of traffic sent to frontier in a typical production system
# (before routing); used in the monthly projection.
FRONTIER_FRACTION = 1.0   # "always Opus" baseline


def route(q: Query) -> ModelTier:
    """Return the cheapest tier that meets the routing policy for query q."""
    # Complex reasoning and low-confidence queries always go to Opus
    if q.category == TaskCategory.COMPLEX_REASONING:
        return OPUS
    if q.confidence < MIN_CONFIDENCE_SONNET:
        return OPUS
    # Short, high-confidence structured tasks route to Haiku
    if (q.input_tokens + q.output_tokens < MAX_TOKENS_FOR_HAIKU
            and q.confidence >= MIN_CONFIDENCE_HAIKU
            and q.category in (TaskCategory.STRUCTURED_EXTRACTION,
                               TaskCategory.SHORT_QA)):
        return HAIKU
    # Everything else: Sonnet
    return SONNET


def query_cost(q: Query, tier: ModelTier) -> float:
    return (q.input_tokens / 1_000_000 * tier.input_price_per_m
            + q.output_tokens / 1_000_000 * tier.output_price_per_m)


def print_routing_simulation() -> None:
    queries = [
        Query("Extract JSON fields from invoice",       250, 120, TaskCategory.STRUCTURED_EXTRACTION, 0.92),
        Query("Single-sentence classification",         180,  40, TaskCategory.SHORT_QA,              0.88),
        Query("Multi-step legal reasoning",            1800, 800, TaskCategory.COMPLEX_REASONING,     0.75),
        Query("Generate unit tests for auth module",   1200, 900, TaskCategory.CODE_GENERATION,        0.80),
        Query("Summarise 5-page policy document",      3500, 600, TaskCategory.STRUCTURED_EXTRACTION,  0.72),
        Query("Ambiguous classification (low conf.)",   400, 200, TaskCategory.SHORT_QA,              0.55),
        Query("Simple keyword extraction",              150,  60, TaskCategory.STRUCTURED_EXTRACTION,  0.94),
        Query("Architecture trade-off analysis",       2200, 1200, TaskCategory.COMPLEX_REASONING,    0.90),
    ]

    MONTHLY_VOLUME = 1_000_000  # representative production scale

    print("=" * 72)
    print("PART 2 — ROUTING POLICY SIMULATION")
    print(f"  Monthly query volume (projection): {MONTHLY_VOLUME:,}")
    print("-" * 72)
    print(f"  {'Query (truncated)':<40}  {'Routed to':<14}  {'$/query':>9}")
    print("-" * 72)

    total_routed_cost = 0.0
    total_opus_cost   = 0.0
    tier_counts: dict[str, int] = {"claude-haiku-4": 0,
                                    "claude-sonnet-4.6": 0,
                                    "claude-opus-4.7": 0}

    for q in queries:
        tier = route(q)
        c    = query_cost(q, tier)
        c_opus = query_cost(q, OPUS)
        total_routed_cost += c
        total_opus_cost   += c_opus
        tier_counts[tier.name] += 1
        print(f"  {q.description[:39]:<40}  {tier.name:<14}  {c:>9.5f}")

    avg_routed = total_routed_cost / len(queries)
    avg_opus   = total_opus_cost   / len(queries)
    saving_per_q = avg_opus - avg_routed
    monthly_saving = saving_per_q * MONTHLY_VOLUME

    print("-" * 72)
    print(f"  Avg cost/query — routed: ${avg_routed:.5f}  |  always-Opus: ${avg_opus:.5f}")
    print(f"  Projected saving at {MONTHLY_VOLUME:,}/month: ${monthly_saving:,.0f}")
    print()
    for name, count in tier_counts.items():
        pct = count / len(queries) * 100
        print(f"    {name}: {count}/{len(queries)} queries ({pct:.0f}%)")


# ---------------------------------------------------------------------------
# Part 3: Value-case calculator
# ---------------------------------------------------------------------------

def print_value_case() -> None:
    """Simple time-saved value case with break-even and payback period."""

    # Scenario: legal document review assistant
    baseline_minutes_per_doc = 45.0
    ai_assisted_minutes      = 18.0   # net of review time for AI output
    fte_hourly_rate_usd      = 85.0   # fully loaded cost
    useful_output_rate       = 0.88   # fraction of AI outputs that are usable
    queries_per_doc          = 6.0    # API calls per document review
    avg_cost_per_query       = 0.008  # routed cost from simulation

    monthly_docs             = 4_000
    implementation_cost_usd  = 35_000  # one-time: prompt engineering + integration

    time_saved_per_doc_hours  = (baseline_minutes_per_doc - ai_assisted_minutes) / 60
    gross_saving_per_doc      = time_saved_per_doc_hours * fte_hourly_rate_usd
    api_cost_per_doc          = queries_per_doc * avg_cost_per_query / useful_output_rate
    net_saving_per_doc        = gross_saving_per_doc - api_cost_per_doc

    monthly_net_saving        = net_saving_per_doc * monthly_docs
    payback_months            = implementation_cost_usd / monthly_net_saving

    cost_per_useful_output    = api_cost_per_doc  # already adjusted for useful_output_rate

    print("=" * 72)
    print("PART 3 — VALUE-CASE CALCULATOR (Legal document review scenario)")
    print("-" * 72)
    print(f"  Baseline time/doc:           {baseline_minutes_per_doc:.0f} min")
    print(f"  AI-assisted net time/doc:    {ai_assisted_minutes:.0f} min")
    print(f"  Time saved/doc:              {time_saved_per_doc_hours*60:.0f} min  "
          f"(${gross_saving_per_doc:.2f} gross at ${fte_hourly_rate_usd:.0f}/hr FTE)")
    print(f"  API cost/doc (adj. for {useful_output_rate:.0%} useful rate): ${api_cost_per_doc:.4f}")
    print(f"  Net saving/doc:              ${net_saving_per_doc:.2f}")
    print(f"  Monthly docs:                {monthly_docs:,}")
    print(f"  Monthly net saving:          ${monthly_net_saving:,.0f}")
    print(f"  Implementation cost:         ${implementation_cost_usd:,}")
    print(f"  Payback period:              {payback_months:.1f} months")
    print(f"  Cost per useful output:      ${cost_per_useful_output:.4f}/doc")


# ---------------------------------------------------------------------------
# Main driver
# ---------------------------------------------------------------------------

def main() -> None:
    print_cache_sweep()
    print()
    print_routing_simulation()
    print()
    print_value_case()
    print()
    print("=" * 72)
    print("HEADLINE: token price is not the dominant cost lever")
    print("-" * 72)
    print("  Cache hit rate determines whether a frontier model is affordable.")
    print("  Routing policy determines whether you pay frontier price at all.")
    print("  Cost-per-useful-output — not cost-per-query — is the metric that")
    print("  survives a finance review and reflects what users actually produce.")


if __name__ == "__main__":
    main()
