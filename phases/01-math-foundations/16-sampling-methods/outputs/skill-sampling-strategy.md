# Sampling Strategy Skill

Use this artifact whenever a random sampler changes an estimate, chain, or generated sequence.

## Required record

```text
sampler: <inverse CDF | rejection | importance | MCMC | decoding>
seed: <integer>
target_or_logits: <fixture description>
parameters: <lambda/M, proposal scale, burn-in, temperature, k, or p>
support: <bounds or nonzero candidates>
estimate_or_output: <value/list summary>
diagnostic: <acceptance, variance, error, or support count>
```

Checks:

- Verify inverse-CDF samples stay in the target support and rejection samples stay in `[a,b]`.
- For importance sampling, confirm the proposal has support wherever the target has mass.
- Report `n_samples` separately from MCMC burn-in; the lesson returns exactly the requested post-burn-in count.
- For decoding, inspect the renormalized distribution before drawing a token. Top-k has fixed support; top-p has a data-dependent prefix.
- For reparameterization, preserve `z=mu+sigma*epsilon` and report derivatives `(1,epsilon)`.
