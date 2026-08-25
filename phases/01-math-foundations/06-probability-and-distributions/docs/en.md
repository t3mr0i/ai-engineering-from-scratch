# Probability and Distributions

> A model's uncertainty becomes useful only when the probability calculation is inspectable.

**Type:** Learn
**Languages:** Julia
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 minutes

## Learning Objectives

- Implement PMFs and PDFs for Bernoulli, categorical, Poisson, uniform, and normal fixtures.
- Compute expectations and variances and observe the variance of a sample mean shrink with sample size.
- Implement numerically stable `softmax` and `log_softmax` by subtracting the maximum logit.
- Calculate cross-entropy from logits and a zero-based target index.
- Derive marginal distributions and test independence from a joint table.

## Build It

`code/main.jl` is the canonical, deterministic entry point and uses only Julia's `Random`, `Statistics`, and `Printf` standard libraries. `probability.py` is a parallel stdlib-only reference; neither path imports a plotting package.

```bash
julia main.jl
python3 probability.py
```

The Julia run seeds `MersenneTwister(42)`. `conditional_probability(4/52,12/52)` prints `1/3`; the Bernoulli fixture uses `p=0.7`; and the fair die has `E[X]=3.5` and `Var(X)=2.9167`. The Poisson fixture uses `lambda=3`, so `P(X=0)=exp(-3)`. A normal PDF value is a density, not a point probability.

The softmax fixture uses logits `[2.0,1.0,0.1]`. `softmax` subtracts the maximum before exponentiating, so `[100,101,102]` is safe and its probabilities still sum to `1`. `cross_entropy_loss([2,1,0.1],0)` is `-log_softmax(logits)[1]`, because Julia's vector index for target `0` is `1`. The joint table `[[0.40,0.10],[0.05,0.45]]` produces row/column marginals that fail the independence check.

## Use It

Treat PMF values as masses on discrete outcomes and PDF values as heights whose integral over an interval is probability. `expected_value(values, probs)` and `variance_of` assume aligned vectors; `sample_categorical` returns zero-based class labels even though Julia arrays are one-based internally. `sample_normal_box_muller` generates a standard-normal fixture from two uniform draws.

`log_softmax` is the stable representation used by the cross-entropy calculation. Comparing `exp.(log_softmax(logits))` with `softmax(logits)` is a useful invariant. The central-limit demo averages uniform `[0,1)` samples for `n=1,2,5,30`; its means stay near `0.5` while the standard deviation decreases. These are Monte Carlo observations from the seeded fixture, not guarantees about a finite run.

## Ship It

`outputs/skill-probability-reasoning.md` is a distribution-selection checklist. Its handoff should name the support, parameterization, and observed invariant for each choice. The executable artifact is a text report: it intentionally does not save a chart and does not require Matplotlib, NumPy, or another external package.

## Exercises

1. Evaluate `bernoulli_pmf(0,0.7)` and `bernoulli_pmf(1,0.7)` and verify that the two masses sum to `1`.
2. Run `softmax([1000,1001])` in a small Julia caller and confirm finite probabilities summing to `1`.
3. For the lesson's joint table, calculate one product of marginals and compare it with the corresponding joint cell. Use that mismatch to explain the `false` independence result.
4. Change only `n_per_sample` in `demonstrate_clt` from `1` to `30`, keep the seed and `n_averages` fixed, and compare the two sample standard deviations.

## Reference Solution

The Bernoulli masses are `0.3` and `0.7`; the Poisson zero mass is approximately `0.0498`; and the fair-die variance is `2.9167`. Stable softmax returns finite values whose sum is one even for large logits. The joint cell `0.40` is not equal to its marginal product `0.5*0.45=0.225`, so the table is not independent. Increasing the average size from `1` to `30` reduces the observed standard deviation in the seeded CLT run.
