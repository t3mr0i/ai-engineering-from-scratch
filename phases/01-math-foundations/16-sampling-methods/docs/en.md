# Sampling Methods

> Turn simple random draws into controlled estimates, chains, and token candidates.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 06–09 (probability and information theory)
**Time:** ~65 minutes

## Learning Objectives

- Implement inverse-CDF, rejection, importance, and Monte Carlo sampling from uniform draws.
- Explain burn-in, proposal scale, and acceptance behavior in Metropolis-Hastings.
- Produce temperature, top-k, and top-p token distributions with explicit support changes.
- Derive the local gradients of `z = mu + sigma * epsilon` in the reparameterization trick.
- Compare Gumbel-softmax and stratified sampling as practical variance/gradient tools.

## Sampling contracts

`sample_exponential_inverse_cdf(lambda)` maps `U` to `-log(U)/lambda`. `truncated_normal_demo` uses a uniform proposal on `[a,b]` and returns `(samples, acceptance_rate)`; every returned sample is inside that interval.

`metropolis_hastings(target_log_pdf, x0, n_samples, burn_in, proposal_std)` runs `n_samples + burn_in` transitions, discards the first `burn_in`, and returns exactly `n_samples` states plus the post-burn-in acceptance rate. The proposal is a symmetric Gaussian random walk, so the log acceptance ratio is the target log-density difference.

For decoding, `temperature_distribution` divides logits by a positive temperature and normalizes. `top_k_distribution` keeps exactly the largest `k` probability entries. `top_p_distribution` sorts probabilities, keeps the shortest prefix whose cumulative mass reaches `p`, and renormalizes it; its candidate count depends on the logits.

These public helpers reject malformed sampling requests with `ValueError`: logits must be non-empty, temperature and `lambda`/proposal scales must be positive, `1 <= k <= len(logits)`, `0 < p <= 1`, and both Metropolis-Hastings paths require `n_samples > 0` and `burn_in >= 0`. Temperature has no implicit zero-temperature greedy branch; call the explicit greedy path in `text_generation_demo` when deterministic argmax behavior is wanted.

The reparameterization helpers return `(z, epsilon)` and `(1, epsilon)`, making the random draw an external value while retaining derivatives with respect to `mu` and `sigma`. Gumbel-softmax produces a probability vector; the straight-through helper also returns a one-hot forward vector.

## Build It

Run the text-only canonical demo:

```bash
cd phases/01-math-foundations/16-sampling-methods/code
python3 main.py
```

It reports inverse-CDF means, rejection acceptance, importance estimates, Monte Carlo errors, one- and two-dimensional MCMC, Gibbs correlation, decoding distributions, reparameterized draws, Gumbel-softmax, stratified variance, and short generated strings. It intentionally has no plotting or image-generation dependency; the reusable artifact is the numeric output and returned lists.

Pin a single inverse-CDF draw for a hand check:

```python
import math
import random
from sampling import sample_exponential_inverse_cdf

original = random.random
random.random = lambda: 0.5
try:
    assert abs(sample_exponential_inverse_cdf(1.0) - math.log(2.0)) < 1e-12
finally:
    random.random = original
```

## Use It

Use importance weights `target_pdf(x)/proposal_pdf(x)` only where the proposal has support for the target. In MCMC, lowering proposal scale usually raises acceptance but can slow exploration; a high scale can reject more moves. Evaluate mixing with diagnostics rather than treating a single acceptance rate as a guarantee.

For text generation, lower positive temperature concentrates mass on high logits. Top-k gives a fixed support count; top-p gives a mass threshold and therefore a data-dependent count. The functions return distributions so a caller can inspect support before sampling a token.

## Ship It

The reusable artifact is [the sampling-strategy skill](../../16-sampling-methods/outputs/skill-sampling-strategy.md). It records seed, sampler, proposal/temperature parameters, support bounds, acceptance rate, burn-in, and the estimate's uncertainty. This makes a creative decoding change or Monte Carlo result reproducible without promising identical text from every random run.

## Exercises

1. Compare inverse-CDF samples for `lambda=0.5` and `lambda=2.0` with a fixed seed; report the sample means and the expected scale `1/lambda`.
2. Run Metropolis-Hastings on `-0.5*x*x` with `n_samples=100`, `burn_in=20`, and proposal scales `0.2` and `2.0`. Report chain length and acceptance; explain the exploration trade-off.
3. For logits `[3,2,1,0]`, compare temperatures `0.5` and `2.0`, count nonzero entries for top-k `k=2`, and count them for top-p `p=0.8`.
4. Verify `reparam_gradient(epsilon)` against the symbolic derivatives of `mu + sigma*epsilon`.

## Reference Solution

The exponential mean scales inversely with lambda. Both MCMC runs return exactly 100 post-burn-in states; the smaller proposal generally accepts more moves but explores slowly, while the larger proposal may move farther with more rejections. Temperature changes concentration but not vector length; top-k keeps two entries and top-p keeps the shortest probability prefix reaching `0.8`. The reparameterization derivatives are `1` and `epsilon`.

## Tests

```bash
python3 -m unittest discover tests -v
```

Twelve tests cover inverse-CDF, truncated support, Monte Carlo integration, MCMC burn-in and parameter contracts for both one- and two-dimensional paths, temperature normalization and guards, top-k/top-p support and guards, reparameterization, stratification, and Gumbel-softmax.
