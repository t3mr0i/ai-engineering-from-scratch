# Sampling primitives for phases/01-math-foundations/16-sampling-methods/docs/en.md.
# Implements inverse-CDF, rejection, importance, MCMC, decoding, reparameterization, and stratification.
# Uses Python's standard library and prints text summaries instead of requiring a plotting package.
# Canonical execution is `python3 main.py` from this code directory.
# Tests cover deterministic formulas, support bounds, and candidate-set invariants.

import math
import random

random.seed(42)


def _require_positive(value, name):
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        or value <= 0
    ):
        raise ValueError(f"{name} must be a finite value greater than zero")
    return value


def _require_nonnegative_int(value, name):
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError(f"{name} must be a non-negative integer")
    return value


def _require_positive_int(value, name):
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def _validate_logits(logits):
    values = list(logits)
    if not values:
        raise ValueError("logits must be non-empty")
    if any(not math.isfinite(value) for value in values):
        raise ValueError("logits must contain only finite values")
    return values


def _validate_probability_vector(probs):
    values = list(probs)
    if not values:
        raise ValueError("probabilities must be non-empty")
    if any(not math.isfinite(value) or value < 0 for value in values):
        raise ValueError("probabilities must be finite and non-negative")
    if sum(values) <= 0:
        raise ValueError("probabilities must have positive total mass")
    return values


def _validate_k(k, size):
    if isinstance(k, bool) or not isinstance(k, int) or not 1 <= k <= size:
        raise ValueError(f"k must be an integer in [1, {size}]")


def _validate_top_p(p):
    if (
        isinstance(p, bool)
        or not isinstance(p, (int, float))
        or not math.isfinite(p)
        or not 0 < p <= 1
    ):
        raise ValueError("p must be a finite value in (0, 1]")


def sample_uniform(a, b):
    if not math.isfinite(a) or not math.isfinite(b) or b <= a:
        raise ValueError("sample_uniform requires finite bounds with a < b")
    return a + (b - a) * random.random()


def sample_exponential_inverse_cdf(lam):
    _require_positive(lam, "lambda")
    u = random.random()
    while u == 0:
        u = random.random()
    return -math.log(u) / lam


def verify_inverse_cdf(lam, n=10000):
    _require_positive(lam, "lambda")
    _require_positive_int(n, "n")
    samples = [sample_exponential_inverse_cdf(lam) for _ in range(n)]
    empirical_mean = sum(samples) / len(samples)
    theoretical_mean = 1.0 / lam
    print(f"  Exponential(lambda={lam}): empirical mean={empirical_mean:.4f}, "
          f"theoretical={theoretical_mean:.4f}")
    return samples


def normal_pdf(x, mu, sigma):
    _require_positive(sigma, "sigma")
    coeff = 1.0 / (sigma * math.sqrt(2 * math.pi))
    exponent = -0.5 * ((x - mu) / sigma) ** 2
    return coeff * math.exp(exponent)


def sample_normal_box_muller(mu=0.0, sigma=1.0):
    _require_positive(sigma, "sigma")
    u1 = random.random()
    while u1 == 0:
        u1 = random.random()
    u2 = random.random()
    z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
    return mu + sigma * z


def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    _require_positive(M, "M")
    attempts = 0
    while True:
        x = proposal_sample()
        u = random.random()
        attempts += 1
        proposal_density = proposal_pdf(x)
        if proposal_density <= 0:
            raise ValueError("proposal_pdf must be positive at sampled points")
        if u < target_pdf(x) / (M * proposal_density):
            return x, attempts


def rejection_sample_batch(target_pdf, proposal_sample, proposal_pdf, M, n):
    _require_positive(M, "M")
    _require_positive_int(n, "n")
    samples = []
    total_attempts = 0
    for _ in range(n):
        x, attempts = rejection_sample(target_pdf, proposal_sample, proposal_pdf, M)
        samples.append(x)
        total_attempts += attempts
    acceptance_rate = n / total_attempts
    return samples, acceptance_rate


def truncated_normal_demo(mu, sigma, a, b, n=5000):
    _require_positive(sigma, "sigma")
    _require_positive_int(n, "n")
    if not math.isfinite(a) or not math.isfinite(b) or b <= a:
        raise ValueError("truncation bounds must be finite with a < b")
    norm_const = sum(
        normal_pdf(a + (b - a) * i / 1000, mu, sigma) * (b - a) / 1000
        for i in range(1001)
    )
    M_val = max(
        normal_pdf(x, mu, sigma) / (1.0 / (b - a))
        for x in [a + (b - a) * i / 200 for i in range(201)]
    )

    def target(x):
        if a <= x <= b:
            return normal_pdf(x, mu, sigma)
        return 0.0

    def proposal():
        return sample_uniform(a, b)

    def proposal_pdf(x):
        if a <= x <= b:
            return 1.0 / (b - a)
        return 0.0

    samples, acc_rate = rejection_sample_batch(target, proposal, proposal_pdf, M_val, n)
    return samples, acc_rate


def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    _require_positive_int(n, "n")
    weighted_sum = 0.0
    weight_sum = 0.0
    for _ in range(n):
        x = proposal_sample()
        proposal_density = proposal_pdf(x)
        if proposal_density <= 0:
            raise ValueError("proposal_pdf must be positive at sampled points")
        w = target_pdf(x) / proposal_density
        weighted_sum += f(x) * w
        weight_sum += w
    unnormalized = weighted_sum / n
    self_normalized = weighted_sum / weight_sum
    return unnormalized, self_normalized


def importance_sampling_demo():
    mu, sigma = 2.0, 1.0
    a, b = -3.0, 7.0

    def f(x):
        return x ** 2

    def target(x):
        return normal_pdf(x, mu, sigma)

    def proposal():
        return sample_uniform(a, b)

    def proposal_pdf(x):
        if a <= x <= b:
            return 1.0 / (b - a)
        return 0.0

    est_unnorm, est_selfnorm = importance_sampling_estimate(
        f, target, proposal_pdf, proposal, n=50000
    )
    theoretical = mu ** 2 + sigma ** 2
    print(f"  E[X^2] under N({mu},{sigma}):")
    print(f"    Unnormalized IS: {est_unnorm:.4f}")
    print(f"    Self-normalized IS: {est_selfnorm:.4f}")
    print(f"    Theoretical: {theoretical:.4f}")


def monte_carlo_pi(n):
    _require_positive_int(n, "n")
    inside = 0
    for _ in range(n):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x * x + y * y <= 1:
            inside += 1
    return 4 * inside / n


def monte_carlo_integral(f, a, b, n):
    _require_positive_int(n, "n")
    if not math.isfinite(a) or not math.isfinite(b) or b <= a:
        raise ValueError("integration bounds must be finite with a < b")
    total = 0.0
    for _ in range(n):
        x = sample_uniform(a, b)
        total += f(x)
    return (b - a) * total / n


def metropolis_hastings(target_log_pdf, x0, n_samples, burn_in, proposal_std=1.0):
    _require_positive_int(n_samples, "n_samples")
    _require_nonnegative_int(burn_in, "burn_in")
    _require_positive(proposal_std, "proposal_std")
    samples = []
    x = x0
    accepted = 0
    total = n_samples + burn_in

    for i in range(total):
        x_new = x + random.gauss(0, proposal_std)
        log_alpha = target_log_pdf(x_new) - target_log_pdf(x)

        if math.log(random.random() + 1e-300) < log_alpha:
            x = x_new
            if i >= burn_in:
                accepted += 1

        if i >= burn_in:
            samples.append(x)

    acceptance_rate = accepted / n_samples
    return samples, acceptance_rate


def metropolis_hastings_2d(target_log_pdf, x0, y0, n_samples, burn_in, proposal_std=0.5):
    _require_positive_int(n_samples, "n_samples")
    _require_nonnegative_int(burn_in, "burn_in")
    _require_positive(proposal_std, "proposal_std")
    samples = []
    x, y = x0, y0
    accepted = 0
    total = n_samples + burn_in

    for i in range(total):
        x_new = x + random.gauss(0, proposal_std)
        y_new = y + random.gauss(0, proposal_std)
        log_alpha = target_log_pdf(x_new, y_new) - target_log_pdf(x, y)

        if math.log(random.random() + 1e-300) < log_alpha:
            x, y = x_new, y_new
            if i >= burn_in:
                accepted += 1

        if i >= burn_in:
            samples.append((x, y))

    acceptance_rate = accepted / n_samples
    return samples, acceptance_rate


def bimodal_log_pdf(x):
    p1 = 0.4 * normal_pdf(x, -3, 1)
    p2 = 0.6 * normal_pdf(x, 3, 1)
    return math.log(p1 + p2 + 1e-300)


def gibbs_sampling_2d(rho, n_samples, burn_in):
    _require_positive_int(n_samples, "n_samples")
    _require_nonnegative_int(burn_in, "burn_in")
    if not math.isfinite(rho) or not -1 < rho < 1:
        raise ValueError("rho must be strictly between -1 and 1")
    x, y = 0.0, 0.0
    samples = []

    for i in range(n_samples + burn_in):
        x = random.gauss(rho * y, math.sqrt(1 - rho ** 2))
        y = random.gauss(rho * x, math.sqrt(1 - rho ** 2))
        if i >= burn_in:
            samples.append((x, y))

    return samples


def softmax(logits):
    logits = _validate_logits(logits)
    max_l = max(logits)
    exps = [math.exp(z - max_l) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]


def sample_from_probs(probs):
    probs = _validate_probability_vector(probs)
    r = random.random()
    cumsum = 0.0
    for i, p in enumerate(probs):
        cumsum += p
        if r <= cumsum:
            return i
    return len(probs) - 1


def temperature_sample(logits, temperature):
    logits = _validate_logits(logits)
    _require_positive(temperature, "temperature")
    scaled = [z / temperature for z in logits]
    probs = softmax(scaled)
    return sample_from_probs(probs)


def temperature_distribution(logits, temperature):
    logits = _validate_logits(logits)
    _require_positive(temperature, "temperature")
    scaled = [z / temperature for z in logits]
    return softmax(scaled)


def top_k_sample(logits, k):
    logits = _validate_logits(logits)
    _validate_k(k, len(logits))
    indexed = sorted(enumerate(logits), key=lambda x: -x[1])
    top = indexed[:k]
    top_logits = [l for _, l in top]
    probs = softmax(top_logits)
    idx = sample_from_probs(probs)
    return top[idx][0]


def top_k_distribution(logits, k):
    logits = _validate_logits(logits)
    _validate_k(k, len(logits))
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    result = [0.0] * len(logits)
    top_indices = [idx for idx, _ in indexed[:k]]
    top_probs = [probs[idx] for idx in top_indices]
    total = sum(top_probs)
    for idx in top_indices:
        result[idx] = probs[idx] / total
    return result


def top_p_sample(logits, p):
    logits = _validate_logits(logits)
    _validate_top_p(p)
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0.0
    selected = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected.append((token_idx, prob))
        if cumsum >= p:
            break
    sel_probs = [pr for _, pr in selected]
    total = sum(sel_probs)
    sel_probs = [pr / total for pr in sel_probs]
    idx = sample_from_probs(sel_probs)
    return selected[idx][0]


def top_p_distribution(logits, p):
    logits = _validate_logits(logits)
    _validate_top_p(p)
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0.0
    selected_indices = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected_indices.append(token_idx)
        if cumsum >= p:
            break
    result = [0.0] * len(logits)
    total = sum(probs[i] for i in selected_indices)
    for i in selected_indices:
        result[i] = probs[i] / total
    return result


def reparam_sample(mu, sigma):
    _require_positive(sigma, "sigma")
    epsilon = random.gauss(0, 1)
    z = mu + sigma * epsilon
    return z, epsilon


def reparam_gradient(epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma


def vae_forward_demo(mu, log_var):
    sigma = math.exp(0.5 * log_var)
    z, epsilon = reparam_sample(mu, sigma)

    dz_dmu = 1.0
    dz_dsigma = epsilon
    dsigma_dlogvar = 0.5 * sigma

    dz_dmu_total = dz_dmu
    dz_dlogvar = dz_dsigma * dsigma_dlogvar

    return z, epsilon, dz_dmu_total, dz_dlogvar


def gumbel_sample():
    u = random.random()
    while u == 0:
        u = random.random()
    return -math.log(-math.log(u))


def gumbel_max_sample(log_probs):
    log_probs = _validate_logits(log_probs)
    gumbels = [lp + gumbel_sample() for lp in log_probs]
    return gumbels.index(max(gumbels))


def gumbel_softmax_sample(log_probs, temperature):
    log_probs = _validate_logits(log_probs)
    _require_positive(temperature, "temperature")
    gumbels = [lp + gumbel_sample() for lp in log_probs]
    scaled = [g / temperature for g in gumbels]
    return softmax(scaled)


def gumbel_softmax_straight_through(log_probs, temperature):
    soft = gumbel_softmax_sample(log_probs, temperature)
    hard_idx = soft.index(max(soft))
    hard = [0.0] * len(log_probs)
    hard[hard_idx] = 1.0
    return hard, soft


def stratified_sample_1d(n):
    _require_positive_int(n, "n")
    samples = []
    for i in range(n):
        u = random.random()
        samples.append((i + u) / n)
    return samples


def compare_sampling_variance(f, n, n_trials=200):
    _require_positive_int(n, "n")
    _require_positive_int(n_trials, "n_trials")
    standard_estimates = []
    stratified_estimates = []

    for _ in range(n_trials):
        standard_samples = [random.random() for _ in range(n)]
        standard_est = sum(f(x) for x in standard_samples) / n
        standard_estimates.append(standard_est)

        strat_samples = stratified_sample_1d(n)
        strat_est = sum(f(x) for x in strat_samples) / n
        stratified_estimates.append(strat_est)

    std_mean = sum(standard_estimates) / len(standard_estimates)
    std_var = sum((e - std_mean) ** 2 for e in standard_estimates) / len(standard_estimates)

    strat_mean = sum(stratified_estimates) / len(stratified_estimates)
    strat_var = sum((e - strat_mean) ** 2 for e in stratified_estimates) / len(stratified_estimates)

    return std_var, strat_var


def text_generation_demo(vocab, logits, length, method, **kwargs):
    tokens = []
    for _ in range(length):
        if method == "greedy":
            idx = logits.index(max(logits))
        elif method == "temperature":
            idx = temperature_sample(logits, kwargs.get("temperature", 1.0))
        elif method == "top_k":
            idx = top_k_sample(logits, kwargs.get("k", 5))
        elif method == "top_p":
            idx = top_p_sample(logits, kwargs.get("p", 0.9))
        else:
            idx = sample_from_probs(softmax(logits))
        tokens.append(vocab[idx])
    return " ".join(tokens)


if __name__ == "__main__":
    print("=" * 65)
    print("SAMPLING METHODS")
    print("=" * 65)

    print("\n--- 1. Inverse CDF Sampling (Exponential) ---")
    for lam in [0.5, 1.0, 2.0]:
        verify_inverse_cdf(lam)

    print("\n--- 2. Rejection Sampling (Truncated Normal) ---")
    trunc_samples, acc = truncated_normal_demo(0, 1, -1, 2, n=5000)
    trunc_mean = sum(trunc_samples) / len(trunc_samples)
    print(f"  Truncated N(0,1) on [-1, 2]: mean={trunc_mean:.4f}, "
          f"acceptance rate={acc:.4f}")

    print("\n--- 3. Importance Sampling ---")
    importance_sampling_demo()

    print("\n--- 4. Monte Carlo Estimation ---")
    print("  Estimating pi:")
    for n in [1000, 10000, 100000]:
        pi_est = monte_carlo_pi(n)
        error = abs(pi_est - math.pi)
        print(f"    N={n:>7d}: pi ~ {pi_est:.6f}, error={error:.6f}")

    print("  Estimating integral of sin(x) from 0 to pi (true = 2.0):")
    for n in [1000, 10000, 100000]:
        est = monte_carlo_integral(math.sin, 0, math.pi, n)
        error = abs(est - 2.0)
        print(f"    N={n:>7d}: estimate={est:.6f}, error={error:.6f}")

    print("\n--- 5. Metropolis-Hastings MCMC ---")
    print("  Sampling from bimodal distribution (mixture of Gaussians):")
    for std in [0.5, 1.0, 3.0]:
        samples_mh, acc_rate = metropolis_hastings(
            bimodal_log_pdf, x0=0.0, n_samples=10000, burn_in=2000,
            proposal_std=std
        )
        mh_mean = sum(samples_mh) / len(samples_mh)
        mh_std = (sum((x - mh_mean) ** 2 for x in samples_mh) / len(samples_mh)) ** 0.5
        print(f"    proposal_std={std}: mean={mh_mean:.4f}, std={mh_std:.4f}, "
              f"acceptance={acc_rate:.4f}")

    print("\n  Sampling from 2D Gaussian:")
    def gaussian_2d_log_pdf(x, y):
        return -0.5 * (x ** 2 + y ** 2)

    samples_2d, acc_2d = metropolis_hastings_2d(
        gaussian_2d_log_pdf, x0=5.0, y0=5.0,
        n_samples=10000, burn_in=2000, proposal_std=1.0
    )
    xs = [s[0] for s in samples_2d]
    ys = [s[1] for s in samples_2d]
    print(f"    mean_x={sum(xs)/len(xs):.4f}, mean_y={sum(ys)/len(ys):.4f}, "
          f"acceptance={acc_2d:.4f}")

    print("\n--- 6. Gibbs Sampling (Correlated 2D Gaussian) ---")
    for rho in [0.0, 0.5, 0.9]:
        gibbs_samples = gibbs_sampling_2d(rho, n_samples=10000, burn_in=1000)
        gx = [s[0] for s in gibbs_samples]
        gy = [s[1] for s in gibbs_samples]
        empirical_corr = (
            sum(a * b for a, b in gibbs_samples) / len(gibbs_samples)
            - (sum(gx) / len(gx)) * (sum(gy) / len(gy))
        )
        print(f"  rho={rho}: empirical correlation={empirical_corr:.4f}")

    print("\n--- 7. Temperature Sampling ---")
    token_logits = [3.0, 2.0, 1.5, 0.5, -1.0, -2.0]
    vocab = ["the", "a", "this", "one", "that", "some"]
    print("  Logits:", token_logits)
    print("  Vocab:", vocab)
    for temp in [0.1, 0.5, 1.0, 1.5, 3.0]:
        dist = temperature_distribution(token_logits, temp)
        formatted = [f"{p:.4f}" for p in dist]
        print(f"  T={temp:.1f}: [{', '.join(formatted)}]")

    print("\n  Generation samples at different temperatures:")
    for temp in [0.1, 0.7, 1.0, 2.0]:
        tokens_out = []
        for _ in range(10):
            idx = temperature_sample(token_logits, temp)
            tokens_out.append(vocab[idx])
        print(f"    T={temp}: {' '.join(tokens_out)}")

    print("\n--- 8. Top-k Sampling ---")
    print("  Logits:", token_logits)
    for k in [1, 2, 3, 6]:
        dist = top_k_distribution(token_logits, k)
        formatted = [f"{p:.4f}" for p in dist]
        print(f"  k={k}: [{', '.join(formatted)}]")

    print("\n--- 9. Top-p (Nucleus) Sampling ---")
    print("  Logits:", token_logits)
    for p in [0.5, 0.8, 0.9, 0.95, 1.0]:
        dist = top_p_distribution(token_logits, p)
        nonzero = sum(1 for d in dist if d > 0)
        formatted = [f"{d:.4f}" for d in dist]
        print(f"  p={p:.2f}: [{', '.join(formatted)}] ({nonzero} tokens)")

    print("\n--- 10. Reparameterization Trick ---")
    mu_val, log_var_val = 2.0, 0.5

    print(f"  VAE encoder output: mu={mu_val}, log_var={log_var_val}")
    z_samples = []
    for trial in range(5):
        z, eps, dz_dmu, dz_dlogvar = vae_forward_demo(mu_val, log_var_val)
        z_samples.append(z)
        print(f"    Trial {trial+1}: z={z:.4f}, eps={eps:.4f}, "
              f"dz/dmu={dz_dmu:.4f}, dz/dlog_var={dz_dlogvar:.4f}")

    print(f"  Mean of z samples: {sum(z_samples)/len(z_samples):.4f} "
          f"(expected ~{mu_val})")
    print("  Gradients exist because z = mu + sigma * epsilon is differentiable.")

    print("\n  Verifying reparameterization matches direct sampling:")
    sigma_val = math.exp(0.5 * log_var_val)
    direct_samples = [sample_normal_box_muller(mu_val, sigma_val) for _ in range(10000)]
    reparam_samples = [reparam_sample(mu_val, sigma_val)[0] for _ in range(10000)]
    d_mean = sum(direct_samples) / len(direct_samples)
    r_mean = sum(reparam_samples) / len(reparam_samples)
    d_std = (sum((x - d_mean)**2 for x in direct_samples) / len(direct_samples)) ** 0.5
    r_std = (sum((x - r_mean)**2 for x in reparam_samples) / len(reparam_samples)) ** 0.5
    print(f"    Direct:  mean={d_mean:.4f}, std={d_std:.4f}")
    print(f"    Reparam: mean={r_mean:.4f}, std={r_std:.4f}")

    print("\n--- 11. Gumbel-Softmax ---")
    probs = [0.5, 0.3, 0.15, 0.05]
    log_probs = [math.log(p) for p in probs]
    labels = ["cat", "dog", "bird", "fish"]
    print(f"  True probs: {probs}")

    print("\n  Gumbel-Max (exact categorical) verification:")
    counts = [0] * len(probs)
    n_gumbel = 10000
    for _ in range(n_gumbel):
        idx = gumbel_max_sample(log_probs)
        counts[idx] += 1
    empirical = [c / n_gumbel for c in counts]
    print(f"    Empirical: [{', '.join(f'{p:.4f}' for p in empirical)}]")
    print(f"    True:      [{', '.join(f'{p:.4f}' for p in probs)}]")

    print("\n  Gumbel-Softmax at different temperatures:")
    for tau in [0.1, 0.5, 1.0, 5.0]:
        soft = gumbel_softmax_sample(log_probs, tau)
        formatted = [f"{s:.4f}" for s in soft]
        max_idx = soft.index(max(soft))
        print(f"    tau={tau:.1f}: [{', '.join(formatted)}] -> {labels[max_idx]}")

    print("\n  Straight-through estimator:")
    hard, soft = gumbel_softmax_straight_through(log_probs, temperature=0.5)
    print(f"    Hard (forward): {hard}")
    print(f"    Soft (backward): [{', '.join(f'{s:.4f}' for s in soft)}]")

    print("\n--- 12. Stratified Sampling ---")
    def test_fn(x):
        return math.sin(math.pi * x)

    print("  Comparing standard vs stratified Monte Carlo:")
    print(f"  Function: sin(pi*x) on [0,1], true integral = 2/pi = {2/math.pi:.6f}")
    for n in [10, 50, 100]:
        std_var, strat_var = compare_sampling_variance(test_fn, n)
        ratio = std_var / strat_var if strat_var > 0 else float('inf')
        print(f"    N={n:3d}: standard_var={std_var:.8f}, "
              f"stratified_var={strat_var:.8f}, ratio={ratio:.2f}x")

    print("\n--- 13. Text Generation Demo ---")
    gen_vocab = ["the", "cat", "sat", "on", "mat", "a", "dog", "ran", "big", "red"]
    gen_logits = [3.0, 2.5, 2.0, 1.8, 1.5, 1.0, 0.5, 0.0, -0.5, -1.0]

    print(f"  Vocab: {gen_vocab}")
    print(f"  Logits: {gen_logits}")
    print()

    methods = [
        ("greedy", {}),
        ("temperature", {"temperature": 0.5}),
        ("temperature", {"temperature": 1.0}),
        ("temperature", {"temperature": 2.0}),
        ("top_k", {"k": 3}),
        ("top_p", {"p": 0.8}),
    ]

    for method_name, params in methods:
        label = method_name
        if params:
            label += f"({', '.join(f'{k}={v}' for k, v in params.items())})"
        sequences = []
        for run in range(3):
            seq = text_generation_demo(gen_vocab, gen_logits, length=8,
                                       method=method_name, **params)
            sequences.append(seq)
        print(f"  {label}:")
        for i, seq in enumerate(sequences):
            print(f"    Run {i+1}: {seq}")
        unique = len(set(sequences))
        print(f"    Unique sequences: {unique}/3")
        print()

    print("\n--- 14. Text summary (no plotting dependency) ---")
    print("  The numerical fixtures above are the reproducible artifact.")
    print("  Inspect distributions with returned lists or a notebook; this demo stays stdlib-only.")

    print("\n" + "=" * 65)
    print("All sampling methods complete.")
    print("=" * 65)
