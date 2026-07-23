# Speculative Decoding and EAGLE

> A frontier LLM generating one token requires a full forward pass over billions of parameters. That forward pass is massively over-provisioned: most of the time a much smaller model can guess the next 3-5 tokens correctly, and the big model only needs to *verify* the guess. When the guess is right you got 5 tokens for the price of one. Speculative decoding (Leviathan et al. 2023) made this exact, and EAGLE-3 (2025) pushed acceptance rates to ~4.5 tokens per verify — a 4-5x speedup at matched output distribution.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## The Problem

Decode throughput for a 70B-class model on H100 is typically 40-80 tokens/second. Each token requires a full forward pass reading all model weights from HBM. You cannot make the model smaller without changing its output. You cannot increase batch size beyond memory. You're stuck — unless you can let the model output more than one token per forward pass.

Autoregressive generation looks inherently serial: `x_{t+1} = sample(p(· | x_{1:t}))`. But there is a concurrency opportunity. If you had a cheap predictor that said "the next 4 tokens are probably [a, b, c, d]" you could verify all 5 positions in a **single forward pass of the big model** and accept the longest matching prefix.

Leviathan, Kalai, Matias (2023, "Fast Inference from Transformers via Speculative Decoding") made this exact via a clever accept/reject rule that preserves the target model's sampling distribution. The same output distribution, 2-4× faster.

## The Concept

### The Two-Model Setup

- **Target model** `M_p`: the big, slow, high-quality model you actually want samples from. Distribution: `p(x)`.
- **Draft model** `M_q`: a small, fast, lower-quality model. Distribution: `q(x)`. 5-30× smaller.

Per step:

1. Draft model proposes `K` tokens autoregressively: `x_1, x_2, ..., x_K ~ q`.
2. Target model runs ONE forward pass over all `K+1` positions in parallel, producing `p(x_k)` for each proposed token.
3. Accept/reject each token left-to-right via the modified rejection-sampling rule below. Accept the longest matching prefix.
4. If any token is rejected, sample the replacement from the corrected distribution and stop. Otherwise sample one bonus token from `p(· | x_1...x_K)`.

If the draft matches the target perfectly, you get K+1 tokens per target-forward. If the draft is wrong at position 1, you get only 1 token.

### The Exactness Rule

Speculative decoding is **provably equivalent in distribution to sampling from p**. The rejection rule:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

where `(p - q)+` denotes the positive part of the pointwise difference. When the draft and target agree (`p ≈ q`) acceptance is nearly 1. When they disagree, the residual distribution is constructed so that the overall sample is still exactly `p`.

**Greedy case.** For temperature=0 sampling just check `argmax(p) == x_t`. If yes, accept; if no, output `argmax(p)` and stop.

### Expected Speedup

If the draft model's token-level acceptance rate is `α`, the expected tokens produced per target-forward pass is:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

At `α = 0.8, K = 4`: `(1 - 0.8^5)/(1 - 0.8) = 3.36` tokens per forward. A single target forward costs roughly `cost_q * K + cost_p` (K draft steps plus one target verify). If `cost_p >> cost_q * K` the speedup ratio is `3.36× / 1 = 3.36×` on throughput.

The only real parameter is `α`, which depends entirely on the draft-target alignment. A good draft is everything.

### Training the Draft: Distillation

A random small model makes a poor draft. The standard recipe is to distill from the target:

1. Pick a small architecture (~1B for a 70B target, ~500M for a 7B target).
2. Run the target model on a large text corpus; store its next-token distributions.
3. Train the draft with KL divergence against the target's distribution (not against ground-truth tokens).

The result: `α` typically 0.6-0.8 on coding, 0.7-0.85 on natural-language chat. Speedups 2-3× in production.

### EAGLE: Tree Drafting + Feature Reuse

Li, Wei, Zhang, Zhang (2024, "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty") observed two inefficiencies in standard speculative decoding:

1. The draft does K serial steps, each full-stack. But the draft could reuse the target's features (hidden states) from the most recent verify — the target already computed rich representations that the draft is re-deriving from scratch.
2. The draft outputs a linear chain. If the draft could output a *tree* of candidates (each node multiple guesses), the target's single forward pass could verify multiple candidate paths in parallel via a tree attention mask, and pick the longest accepted branch.

EAGLE-1 changes:
- Draft input = target's final hidden state at position t, not raw tokens.
- Draft architecture = 1 transformer decoder layer (not a separate small model).
- Output = tree of K = 4-8 candidates per depth, depth 4-6.

EAGLE-2 (2024) adds dynamic tree topology: the tree grows wider where the draft is uncertain and stays narrow where it is confident. Raises `α_effective` without increasing verify cost.

EAGLE-3 (Li et al. 2025, "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test") removes the fixed top-layer feature dependency and trains the draft with a new "test-time simulation" loss — the draft is trained on outputs that match the target's test-time distribution rather than teacher-forced training distribution. Acceptance rate rises from 0.75 (EAGLE-2) to 0.82 (EAGLE-3), and mean tokens/verify from 3.0 to 4.5.

### Tree Attention Verification

When the draft outputs a tree, the target model verifies it in a single forward pass using a **tree attention mask** — a causal mask that encodes the tree topology rather than a pure line. Each token attends only to its ancestors in the tree. The verify pass is still one forward, one matmul; the topological mask costs only a few extra KV entries.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

If `a, b` are competing first-token candidates and `c, d, e, f` are second-token candidates, all six positions are verified in one forward pass. The output is the longest prefix along any accepted path.

### When It Wins, When It Doesn't

**Wins:**
- Chat / completion with predictable text (code, common English, structured output). `α` is high.
- Settings with unused GPU compute during decode (memory-bound phase). Tree drafting uses the available FLOPs.

**Loses / no win:**
- Highly stochastic outputs (creative writing at high temperature). `α` drops toward `1/|vocab|`.
- Batch serving with very high concurrency — batching already fills the FLOPs, little room for tree verification.
- Very small target models where the draft isn't much smaller.

Production shops typically report 2-3× wall-clock speedup on chat, 3-5× on code generation, and near-zero on creative writing.




## Further Reading

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) — the exact rejection rule and the theoretical speedup analysis
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) — concurrent speculative-sampling paper at DeepMind
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) — parallel-heads alternative to a draft model
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) — feature reuse and tree drafting
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) — dynamic tree topology
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) — train-time test-time matching
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) — Jacobi/lookahead decoding, a speculator-free alternative
