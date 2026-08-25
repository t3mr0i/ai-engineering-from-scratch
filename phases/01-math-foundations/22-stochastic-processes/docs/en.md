# Stochastic Processes

> Randomness gains structure when a state, transition rule, and time index are made explicit.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 06–07 (probability and Bayes)
**Time:** ~75 minutes

## Learning Objectives

- Simulate seeded one- and two-dimensional random walks and inspect their path shapes.
- Represent a finite Markov chain with a row-stochastic transition matrix.
- Compute and verify a stationary distribution with `pi @ P == pi`.
- Compare Langevin dynamics and Metropolis-Hastings as sampling mechanisms.
- Read a beta schedule and trajectory from the forward diffusion fixture.

## Build It

Run the NumPy implementation and its five local demonstrations:

```bash
cd phases/01-math-foundations/22-stochastic-processes/code
python3 main.py
```

`random_walk_1d(n_steps, seed)` returns `n_steps+1` positions starting at zero; each difference is `-1` or `+1`. `random_walk_2d` makes one axis-aligned unit move per step. The 1,000-step batch in the demo has a theoretical standard-deviation scale of `sqrt(1000)`, not a deterministic endpoint.

`MarkovChain` validates a non-empty square matrix whose rows are non-negative and sum to one. `stationary_distribution` selects the eigenvector of `P.T` nearest eigenvalue one and normalizes it. `simulate(start_state, n_steps)` returns the initial state plus `n_steps` transitions. The weather fixture uses states Sunny, Rainy, and Cloudy.

## Use It

`langevin_dynamics` updates `x` by `-dt * grad_U(x) + sqrt(2*T*dt) * noise`; the demo targets a Gaussian with mean `3` and variance `2`. `metropolis_hastings` uses a symmetric Gaussian proposal and accepts from the log-density ratio. It returns exactly `n_samples` states; when `n_samples=1` its acceptance rate is defined as `0.0` because no proposal was evaluated.

`diffusion_forward(signal, n_steps, beta_start, beta_end)` applies `x = sqrt(1-beta)*x + sqrt(beta)*noise` and returns a trajectory of shape `(n_steps+1, len(signal))` plus the beta array. This is only the forward corruption process; no learned reverse model is included. The implementation rejects invalid step counts, temperatures, proposal scales, and beta schedules.

## Ship It

The handoff artifact is [the stochastic-process advisor](../../22-stochastic-processes/outputs/prompt-stochastic-process-advisor.md). Record the seed, matrix convention, burn-in or discarded prefix, proposal scale, time step, temperature, and beta schedule beside every reported statistic.

## Exercises

1. Compare two seeded 1,000-step walks and verify each has 1,001 positions; estimate the standard deviation from 2,000 independent endpoints.
2. For `P=[[0.7,0.3],[0.2,0.8]]`, check that the returned stationary vector sums to one and satisfies `pi @ P` within `1e-10`.
3. Run Langevin dynamics with `dt=0.05` for 2,000 steps and compare the late mean/variance with the target; state that finite-step discretization creates error.
4. Run Metropolis-Hastings with `n_samples=1` and `proposal_std=0.8`; verify the one-state shape and the defined zero acceptance rate.
5. Diffuse a three-value signal for 10 steps and verify the initial trajectory row equals the signal and the beta length is 10.

## Reference Solution

Seeded walks reproduce exactly and have one initial row. The two-state stationary vector is approximately `[0.4,0.6]`, which remains unchanged under left multiplication by `P`. Langevin statistics approach, but do not exactly equal, the target at finite step size. The one-sample MH boundary returns shape `(1,1)` and acceptance `0.0`. Forward diffusion returns 11 rows for 10 updates and preserves the input as row zero.

## Tests

```bash
python3 -m unittest discover tests -v
```

Tests cover seeded path increments, Markov invariants and state counts, Langevin shapes, the one-sample MH boundary, diffusion schedules, and invalid transition/step contracts.
