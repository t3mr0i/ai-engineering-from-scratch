"""Sustainable AI Engineering: token-efficiency scorer + region carbon comparator.

Part 1 — Token-efficiency scorer.
    Takes a set of prompt variants for the same task and ranks them by estimated
    token count and information density. No model call needed; the point is to
    make the decision criteria for prompt efficiency explicit and runnable.

Part 2 — Region carbon comparator.
    Takes a serving region, looks up its approximate grid carbon intensity from a
    reference table, and computes the SCI delta versus the lowest-carbon baseline.
    Shows the concrete emissions savings (gCO2eq per 1,000 tokens) of a region
    switch and scales to a million-call workload.

Both parts operate on synthetic data. No network, no API key, no pip.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


# ---------------------------------------------------------------------------
# Part 1: Token-efficiency scorer
# ---------------------------------------------------------------------------

class EfficiencyGrade(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    POOR = "poor"


@dataclass
class PromptVariant:
    label: str
    text: str
    # Approximate token count; in production, call tokenizer.encode().
    # Here we use a simple heuristic: tokens ≈ words * 1.35.
    task_description: str = ""

    @property
    def approx_tokens(self) -> int:
        words = len(self.text.split())
        return round(words * 1.35)

    @property
    def word_count(self) -> int:
        return len(self.text.split())


def detect_inefficiency_patterns(variant: PromptVariant) -> list[str]:
    """Identify which of the three canonical prompt efficiency failure patterns
    are present in this variant."""
    issues: list[str] = []
    text_lower = variant.text.lower()

    # Pattern 1: Verbose instruction padding (filler phrases)
    FILLER_PHRASES = [
        "please carefully",
        "as an expert",
        "as a helpful assistant",
        "i would like you to",
        "could you please",
        "it would be great if",
        "make sure to",
        "remember to",
        "don't forget to",
        "feel free to",
    ]
    found_fillers = [p for p in FILLER_PHRASES if p in text_lower]
    if found_fillers:
        issues.append(f"verbose padding: {found_fillers}")

    # Pattern 2: Unconstrained output length (no explicit format/length instruction)
    LENGTH_SIGNALS = ["json", "one sentence", "one word", "bullet", "max ", "limit "]
    if not any(s in text_lower for s in LENGTH_SIGNALS):
        issues.append("unconstrained output length (no format/length directive)")

    # Pattern 3: Context stuffing heuristic — very long prompts relative to task
    if variant.approx_tokens > 300:
        issues.append(f"potential context stuffing ({variant.approx_tokens} tokens for this task)")

    return issues


def grade_efficiency(variant: PromptVariant) -> EfficiencyGrade:
    issues = detect_inefficiency_patterns(variant)
    if len(issues) == 0:
        return EfficiencyGrade.EXCELLENT
    if len(issues) == 1:
        return EfficiencyGrade.GOOD
    return EfficiencyGrade.POOR


def score_prompt_variants(variants: list[PromptVariant]) -> None:
    print("PART 1 — PROMPT EFFICIENCY SCORER")
    print("-" * 78)
    baseline_tokens = max(v.approx_tokens for v in variants)
    for v in sorted(variants, key=lambda x: x.approx_tokens):
        grade = grade_efficiency(v)
        issues = detect_inefficiency_patterns(v)
        savings_pct = round((1 - v.approx_tokens / baseline_tokens) * 100)
        print(f"  [{grade.value.upper():>9}] {v.label}")
        print(f"             ~{v.approx_tokens} tokens  ({savings_pct:+d}% vs worst-case baseline)")
        if issues:
            for issue in issues:
                print(f"             issue: {issue}")
        else:
            print(f"             no efficiency issues detected")
        print()


# ---------------------------------------------------------------------------
# Part 2: Region carbon comparator (SCI-based)
# ---------------------------------------------------------------------------

@dataclass
class RegionProfile:
    name: str
    cloud_label: str
    # Approximate grid carbon intensity, gCO2eq/kWh, 2024-2026 published estimates.
    grid_carbon_intensity_gco2_per_kwh: float
    notes: str = ""


# Reference table: approximate 2025-2026 figures from published cloud and grid data.
# Sources: Electricity Maps historical averages, cloud provider carbon dashboards.
REGION_PROFILES: list[RegionProfile] = [
    RegionProfile("Northern Europe (Sweden/Norway)", "aws:eu-north-1 / azure:norwayeast",
                  27.0, "Dominated by hydroelectric and nuclear"),
    RegionProfile("Western Europe (France)", "aws:eu-west-3 / azure:francecentral",
                  58.0, "High nuclear share (~70%)"),
    RegionProfile("US West (Oregon)", "aws:us-west-2 / azure:westus2",
                  115.0, "Mix of hydro, wind, and natural gas"),
    RegionProfile("Germany (Central Europe)", "aws:eu-central-1 / azure:germanywestcentral",
                  340.0, "Coal and gas remain significant, renewables growing"),
    RegionProfile("US East (Virginia)", "aws:us-east-1 / azure:eastus",
                  370.0, "PJM grid mix; improving but still gas-heavy"),
    RegionProfile("Southeast Asia (Singapore)", "aws:ap-southeast-1 / azure:southeastasia",
                  430.0, "Natural gas dominant; limited renewables"),
    RegionProfile("India (Mumbai)", "aws:ap-south-1 / azure:centralindia",
                  580.0, "Coal-heavy grid; rapid renewables buildout"),
    RegionProfile("Australia (Sydney)", "aws:ap-southeast-2 / azure:australiaeast",
                  620.0, "Coal still dominant in eastern grid"),
]

# Energy cost per 1,000 tokens for a midweight model on modern accelerators.
# Based on published benchmarks (Luccioni et al. 2023, MLPerf Power 2024).
ENERGY_PER_1K_TOKENS_KWH = 0.0015  # kWh per 1,000 tokens (midweight tier)


def compute_sci_per_1k_tokens(profile: RegionProfile) -> float:
    """Return gCO2eq per 1,000 tokens for this region."""
    return ENERGY_PER_1K_TOKENS_KWH * profile.grid_carbon_intensity_gco2_per_kwh


def compare_regions(profiles: list[RegionProfile], monthly_calls: int = 1_000_000,
                    avg_tokens_per_call: int = 1_000) -> None:
    print("PART 2 — REGION CARBON COMPARATOR (SCI-based)")
    print("-" * 78)
    print(f"  Assumptions: {monthly_calls:,} calls/month, {avg_tokens_per_call:,} tokens/call avg")
    print(f"  Energy model: {ENERGY_PER_1K_TOKENS_KWH} kWh per 1,000 tokens (midweight tier)")
    print()

    baseline_profile = min(profiles, key=lambda p: p.grid_carbon_intensity_gco2_per_kwh)
    baseline_sci = compute_sci_per_1k_tokens(baseline_profile)

    sorted_profiles = sorted(profiles, key=lambda p: p.grid_carbon_intensity_gco2_per_kwh)

    print(f"  {'Region':<38} {'gCO2/kWh':>8}  {'SCI (g/1k tok)':>14}  {'Monthly CO2':>12}  {'vs baseline':>11}")
    print(f"  {'-'*38}  {'-'*8}  {'-'*14}  {'-'*12}  {'-'*11}")

    for p in sorted_profiles:
        sci = compute_sci_per_1k_tokens(p)
        total_tokens = monthly_calls * (avg_tokens_per_call / 1000)
        monthly_co2_kg = (sci * total_tokens) / 1000  # convert g to kg
        delta_vs_baseline_kg = monthly_co2_kg - (baseline_sci * total_tokens / 1000)
        marker = " <- baseline" if p is baseline_profile else ""
        print(f"  {p.name:<38} {p.grid_carbon_intensity_gco2_per_kwh:>8.0f}  "
              f"{sci:>14.4f}  {monthly_co2_kg:>10.1f}kg  "
              f"{delta_vs_baseline_kg:>+10.1f}kg{marker}")

    worst = max(sorted_profiles, key=lambda p: p.grid_carbon_intensity_gco2_per_kwh)
    worst_sci = compute_sci_per_1k_tokens(worst)
    worst_tokens = monthly_calls * (avg_tokens_per_call / 1000)
    worst_co2_kg = (worst_sci * worst_tokens) / 1000
    best_co2_kg = (baseline_sci * worst_tokens) / 1000
    savings_kg = worst_co2_kg - best_co2_kg
    ratio = worst_sci / baseline_sci

    print()
    print(f"  Worst-to-best ratio:  {ratio:.1f}× more CO2 in {worst.name}")
    print(f"  Switching from worst to best region saves {savings_kg:.1f} kg CO2/month")
    print(f"  at this call volume ({monthly_calls:,} calls @ {avg_tokens_per_call:,} tokens).")


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

PROMPT_VARIANTS: list[PromptVariant] = [
    PromptVariant(
        label="Verbose (with filler + no format constraint)",
        text=(
            "As an expert technical writer, I would like you to carefully and thoroughly "
            "summarize the following support ticket for me. Please make sure to capture "
            "all key details and don't forget to include the resolution if one is present. "
            "Feel free to use your best judgment on length and format. "
            "The ticket is as follows: [TICKET_TEXT]"
        ),
        task_description="Summarize a support ticket",
    ),
    PromptVariant(
        label="Padded (filler removed, still unconstrained)",
        text=(
            "Summarize the following support ticket. Capture the issue, any steps taken, "
            "and the resolution if present. The ticket: [TICKET_TEXT]"
        ),
        task_description="Summarize a support ticket",
    ),
    PromptVariant(
        label="Efficient (constrained output, minimal instruction)",
        text=(
            "Summarize this support ticket. Return JSON: "
            "{\"issue\": \"<one sentence>\", \"resolution\": \"<one sentence or null>\"}. "
            "Ticket: [TICKET_TEXT]"
        ),
        task_description="Summarize a support ticket",
    ),
]


def main() -> None:
    print("=" * 78)
    print("SUSTAINABLE AI ENGINEERING — DECISION POLICY SIMULATOR (Phase 11, Lesson 84)")
    print("=" * 78)
    print()

    score_prompt_variants(PROMPT_VARIANTS)

    print()
    compare_regions(REGION_PROFILES, monthly_calls=1_000_000, avg_tokens_per_call=1_000)

    print()
    print("=" * 78)
    print("HEADLINE: four levers, measurable in the same sprint they are changed")
    print("-" * 78)
    print("  Prompt efficiency:  the 'efficient' variant cuts ~60% of tokens vs verbose,")
    print("  with identical information content. At 1M calls/month the energy saving")
    print("  is proportional.")
    print()
    print("  Serving region:     the carbon ratio from worst to best region exceeds 20×.")
    print("  For latency-insensitive batch workloads this is a config change with no")
    print("  quality impact — the highest-leverage, lowest-cost green engineering move.")
    print()
    print("  Both levers are directly measurable via the SCI formula:")
    print("  SCI = (E × I + M) / R  (Green Software Foundation spec)")


if __name__ == "__main__":
    main()
