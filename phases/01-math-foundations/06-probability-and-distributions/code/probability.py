# Probability helpers for phases/01-math-foundations/06-probability-and-distributions/docs/en.md.
# Implements PMFs, PDFs, sampling, stable softmax, log probabilities, and marginals from scratch.
# This Python reference is stdlib-only; the canonical runnable entry point is main.jl.
# The final report is a deterministic text summary, so no plotting package is required.
# Run this reference directly with: python3 probability.py

import math
import random

random.seed(42)


def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result


def combinations(n, k):
    return factorial(n) // (factorial(k) * factorial(n - k))


def conditional_probability(p_a_and_b, p_b):
    return p_a_and_b / p_b


def bernoulli_pmf(k, p):
    return p if k == 1 else (1 - p)


def categorical_pmf(k, probs):
    return probs[k]


def poisson_pmf(k, lam):
    return (lam ** k) * math.exp(-lam) / factorial(k)


def uniform_pdf(x, a, b):
    if a <= x <= b:
        return 1.0 / (b - a)
    return 0.0


def normal_pdf(x, mu, sigma):
    coeff = 1.0 / (sigma * math.sqrt(2 * math.pi))
    exponent = -0.5 * ((x - mu) / sigma) ** 2
    return coeff * math.exp(exponent)


def expected_value(values, probabilities):
    return sum(v * p for v, p in zip(values, probabilities))


def variance(values, probabilities):
    mu = expected_value(values, probabilities)
    return sum(p * (v - mu) ** 2 for v, p in zip(values, probabilities))


def sample_bernoulli(p, n=1):
    return [1 if random.random() < p else 0 for _ in range(n)]


def sample_categorical(probs, n=1):
    cumulative = []
    total = 0
    for p in probs:
        total += p
        cumulative.append(total)
    samples = []
    for _ in range(n):
        r = random.random()
        for i, c in enumerate(cumulative):
            if r <= c:
                samples.append(i)
                break
    return samples


def sample_uniform(a, b, n=1):
    return [a + (b - a) * random.random() for _ in range(n)]


def sample_normal_box_muller(mu, sigma, n=1):
    samples = []
    for _ in range(n):
        u1 = random.random()
        u2 = random.random()
        z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        samples.append(mu + sigma * z)
    return samples


def softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    exps = [math.exp(z) for z in shifted]
    total = sum(exps)
    return [e / total for e in exps]


def log_softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = max_logit + math.log(sum(math.exp(z) for z in shifted))
    return [z - log_sum_exp for z in logits]


def cross_entropy_loss(logits, target_index):
    log_probs = log_softmax(logits)
    return -log_probs[target_index]


def joint_to_marginals(joint):
    rows = len(joint)
    cols = len(joint[0])
    marginal_x = [sum(joint[i][j] for j in range(cols)) for i in range(rows)]
    marginal_y = [sum(joint[i][j] for i in range(rows)) for j in range(cols)]
    return marginal_x, marginal_y


def check_independence(joint, marginal_x, marginal_y, tol=1e-9):
    for i in range(len(marginal_x)):
        for j in range(len(marginal_y)):
            if abs(joint[i][j] - marginal_x[i] * marginal_y[j]) > tol:
                return False
    return True


def demonstrate_clt(dist_fn, n_per_sample, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_per_sample)]
        averages.append(sum(samples) / len(samples))
    return averages


def distribution_summary():
    """Return compact, deterministic values suitable for a text handoff or test."""
    logits = [2.0, 1.0, 0.1]
    return {
        "bernoulli_pmf": [bernoulli_pmf(k, 0.7) for k in (0, 1)],
        "poisson_pmf_zero": poisson_pmf(0, 3),
        "normal_pdf_zero": normal_pdf(0, 0, 1),
        "softmax": softmax(logits),
        "cross_entropy_target_0": cross_entropy_loss(logits, 0),
    }


if __name__ == "__main__":
    print("=" * 60)
    print("PROBABILITY AND DISTRIBUTIONS")
    print("=" * 60)

    print("\n--- Conditional Probability ---")
    p_king_given_face = conditional_probability(4 / 52, 12 / 52)
    print(f"P(King | Face card) = {p_king_given_face:.4f}")

    print("\n--- PMF: Bernoulli (p=0.7) ---")
    for k in [0, 1]:
        print(f"  P(X={k}) = {bernoulli_pmf(k, 0.7):.4f}")

    print("\n--- PMF: Categorical ---")
    cat_probs = [0.1, 0.3, 0.4, 0.2]
    for k, p in enumerate(cat_probs):
        print(f"  P(X={k}) = {categorical_pmf(k, cat_probs):.4f}")

    print("\n--- PMF: Poisson (lambda=3) ---")
    for k in range(10):
        print(f"  P(X={k}) = {poisson_pmf(k, 3):.4f}")

    print("\n--- PDF: Normal (mu=0, sigma=1) ---")
    for x in [-3, -2, -1, 0, 1, 2, 3]:
        print(f"  f({x:+d}) = {normal_pdf(x, 0, 1):.4f}")

    print("\n--- Expected Value & Variance ---")
    die_values = [1, 2, 3, 4, 5, 6]
    die_probs = [1 / 6] * 6
    mu = expected_value(die_values, die_probs)
    var = variance(die_values, die_probs)
    print(f"  Fair die: E[X] = {mu:.4f}, Var(X) = {var:.4f}, SD = {var ** 0.5:.4f}")

    print("\n--- Sampling: Bernoulli (p=0.3, n=20) ---")
    bern_samples = sample_bernoulli(0.3, 20)
    print(f"  Samples: {bern_samples}")
    print(f"  Empirical mean: {sum(bern_samples) / len(bern_samples):.4f} (expected 0.3)")

    print("\n--- Sampling: Categorical ---")
    cat_samples = sample_categorical([0.1, 0.3, 0.4, 0.2], 1000)
    counts = [cat_samples.count(i) for i in range(4)]
    print(f"  Counts from 1000 samples: {counts}")
    print(f"  Empirical: {[c / 1000 for c in counts]}")
    print(f"  Expected:  [0.1, 0.3, 0.4, 0.2]")

    print("\n--- Sampling: Normal (Box-Muller) ---")
    norm_samples = sample_normal_box_muller(0, 1, 10000)
    sample_mean = sum(norm_samples) / len(norm_samples)
    sample_var = sum((x - sample_mean) ** 2 for x in norm_samples) / len(norm_samples)
    print(f"  10000 samples from N(0,1):")
    print(f"  Sample mean: {sample_mean:.4f} (expected 0)")
    print(f"  Sample var:  {sample_var:.4f} (expected 1)")

    print("\n--- Softmax ---")
    logits = [2.0, 1.0, 0.1]
    probs = softmax(logits)
    print(f"  Logits:  {logits}")
    print(f"  Softmax: [{', '.join(f'{p:.4f}' for p in probs)}]")
    print(f"  Sum:     {sum(probs):.4f}")

    print("\n--- Softmax with large logits (stability test) ---")
    large_logits = [100, 101, 102]
    probs_large = softmax(large_logits)
    print(f"  Logits:  {large_logits}")
    print(f"  Softmax: [{', '.join(f'{p:.4f}' for p in probs_large)}]")
    print(f"  (No overflow because we subtract max before exp)")

    print("\n--- Log Probabilities ---")
    log_probs = log_softmax(logits)
    print(f"  Logits:      {logits}")
    print(f"  Log-softmax: [{', '.join(f'{lp:.4f}' for lp in log_probs)}]")
    print(f"  Verify exp:  [{', '.join(f'{math.exp(lp):.4f}' for lp in log_probs)}]")

    print("\n--- Cross-Entropy Loss ---")
    ce = cross_entropy_loss([2.0, 1.0, 0.1], target_index=0)
    print(f"  Logits: [2.0, 1.0, 0.1], target: 0")
    print(f"  Cross-entropy loss: {ce:.4f}")

    print("\n--- Why log probabilities matter ---")
    word_prob = 0.01
    n_words = 50
    raw_product = word_prob ** n_words
    log_sum = n_words * math.log(word_prob)
    print(f"  P(word)^{n_words} = {word_prob}^{n_words}")
    print(f"  Raw product: {raw_product:.2e} (underflows with more terms)")
    print(f"  Log sum:     {log_sum:.4f} (stable)")
    print(f"  Recovered:   {math.exp(log_sum):.2e}")

    print("\n--- Joint & Marginal Distributions ---")
    joint = [
        [0.40, 0.10],
        [0.05, 0.45],
    ]
    marginal_x, marginal_y = joint_to_marginals(joint)
    print(f"  Joint distribution (weather x umbrella):")
    print(f"    Sun,  no umbrella: {joint[0][0]}")
    print(f"    Sun,  umbrella:    {joint[0][1]}")
    print(f"    Rain, no umbrella: {joint[1][0]}")
    print(f"    Rain, umbrella:    {joint[1][1]}")
    print(f"  Marginal X (weather):  {marginal_x}")
    print(f"  Marginal Y (umbrella): {marginal_y}")
    print(f"  Independent? {check_independence(joint, marginal_x, marginal_y)}")

    print("\n--- Central Limit Theorem ---")
    print("  Averaging uniform [0,1) samples:")
    for n in [1, 2, 5, 30]:
        avgs = demonstrate_clt(random.random, n, 10000)
        avg_mean = sum(avgs) / len(avgs)
        avg_std = (sum((x - avg_mean) ** 2 for x in avgs) / len(avgs)) ** 0.5
        print(f"    n={n:2d}: mean={avg_mean:.4f}, std={avg_std:.4f}")
    print("  As n grows, std shrinks and distribution approaches normal.")

    print("\n--- Text summary (stdlib only) ---")
    for name, value in distribution_summary().items():
        print(f"  {name}: {value}")

    print("\n" + "=" * 60)
    print("All probability computations complete.")
    print("=" * 60)
