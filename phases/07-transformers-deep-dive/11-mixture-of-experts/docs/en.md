# Mixture of Experts (MoE)

> A dense 70B transformer activates every parameter for every token. A 671B MoE activates only 37B per token and beats it on every benchmark. Sparsity is the most important scaling idea of the decade.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 07 (GPT)
**Time:** ~45 minutes

## The Problem

A dense transformer's FLOPs at inference equal its parameter count (times 2 for forward pass). Scale up a dense model and every token pays the full bill. By 2024 the frontier was hitting a compute wall: to be meaningfully smarter, you needed exponentially more FLOPs per token.

Mixture of Experts breaks this link. Replace each FFN with `E` independent experts + a router that picks `k` experts per token. Total parameters = `E × FFN_size`. Active parameters per token = `k × FFN_size`. Typical 2026 configuration: `E=256`, `k=8`. Storage scales with `E`, compute scales with `k`.

The 2026 frontier is almost entirely MoE: DeepSeek-V3 (671B total / 37B active), Mixtral 8×22B, Qwen2.5-MoE, Llama 4, Kimi K2, gpt-oss. On Artificial Analysis's independent leaderboard, the top 10 open-source models are all MoE.

## The Concept

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### The FFN swap

Dense transformer block:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

MoE block:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

Every expert is an independent FFN (typically SwiGLU). The router is a single linear layer. Each token picks its own `k` experts and gets a gated mixture of their outputs.

### The load-balancing problem

If the router puts 90% of tokens through expert 3, the other experts starve. Three fixes have been tried:

1. **Auxiliary load-balancing loss** (Switch Transformer, Mixtral). Add a penalty proportional to the variance in expert usage. Works, but adds a hyperparameter and a second gradient signal.
2. **Expert capacity + token dropping** (early Switch). Each expert processes at most `C × N/E` tokens; overflow tokens skip the layer. Hurts quality.
3. **Auxiliary-loss-free balancing** (DeepSeek-V3). Add a learned per-expert bias that shifts the router's top-k selection. Bias is updated outside the training loss. No penalty on the main objective. 2024's big unlock.

DeepSeek-V3's approach: after each training step, for every expert, check if its usage is above or below the target. Nudge the bias by `±γ`. Selection uses `scores + bias`. Expert probabilities used for gating are the raw `scores` unchanged. Decouples routing from expression.

### Shared experts

DeepSeek-V2/V3 also split experts into *shared* and *routed*. Every token passes through all shared experts. Routed experts are picked via top-k. Shared experts capture common knowledge; routed experts specialize. V3 runs 1 shared expert plus top-8 of 256 routed.

### Fine-grained experts

Classic MoE (GShard, Switch): each expert is as wide as a full FFN. `E` is small (8–64), `k` is small (1–2).

Modern fine-grained MoE (DeepSeek-V3, Qwen-MoE): each expert is narrower (1/8 FFN size). `E` is large (256+), `k` is larger (8+). Same total parameters, but combinations scale much faster. `C(256, 8) = 400 trillion` possible "experts" per token. Quality goes up, latency stays flat.

### The cost profile

Per token, per layer:

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

DeepSeek-V3 beats Llama 3 70B (dense) on almost every benchmark while doing **fewer active FLOPs per token**. More parameters = more knowledge. More active FLOPs = more compute per token. MoE decouples them.

### The catch: memory

All experts live on GPU regardless of which ones fire. A 671B model needs ~1.3 TB of VRAM for fp16 weights. Frontier MoE deployment requires expert parallelism — shard experts across GPUs, route tokens across the network. Latency is dominated by the all-to-all communication, not the matmul.




## Further Reading

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538) — the idea.
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) — Switch, the classic MoE.
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) — Mixtral 8×7B.
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) — MLA + auxiliary-loss-free MoE + MTP.
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664) — the bias-based balancing paper.
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) — the fine-grained + shared-expert split this lesson's router uses.
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) — original shared-expert paper.
