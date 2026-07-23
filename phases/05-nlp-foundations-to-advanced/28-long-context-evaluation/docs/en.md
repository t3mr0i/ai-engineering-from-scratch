# Long-Context Evaluation — NIAH, RULER, LongBench, MRCR

> Gemini 3 Pro advertises 10M tokens of context. At 1M tokens, 8-needle MRCR drops to 26.3%. Advertised ≠ usable. Long-context evaluation tells you the actual capacity of the model you are shipping on.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 23 (Chunking Strategies)
**Time:** ~60 minutes

## The Problem

You have a 200-page contract. The model claims a 1M-token context. You paste the contract in and ask: "What is the termination clause?" The model answers — but answers from the cover page because the termination clause sits at 120k tokens deep, past where the model actually attends.

This is the 2026 context-capacity gap. Spec sheets say 1M or 10M. Reality says 60-70% of that is usable, and "usable" depends on the task.

- **Retrieval (single needle in haystack):** near-perfect up to the advertised max on frontier models.
- **Multi-hop / aggregation:** degrades sharply past ~128k on most models.
- **Reasoning over dispersed facts:** the first task to fail.

Long-context evaluation measures these axes. This lesson names the benchmarks, what each actually measures, and how to build a custom needle test for your domain.

## The Concept

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack (NIAH, 2023).** Place a fact ("the magic word is pineapple") at a controlled depth in a long context. Ask the model to retrieve it. Sweep depth × length. The original long-context benchmark. Frontier models now saturate this; it is a necessary but not sufficient baseline.

**RULER (Nvidia, 2024).** 13 task types across 4 categories: retrieval (single / multi-key / multi-value), multi-hop tracing (variable tracking), aggregation (common word frequency), QA. Configurable context length (4k to 128k+). Reveals models that saturate NIAH but fail on multi-hop. In the 2024 release, only half of 17 models claiming 32k+ context maintained quality at 32k.

**LongBench v2 (2024).** 503 multiple-choice questions, 8k-2M word contexts, six task categories: single-doc QA, multi-doc QA, long in-context learning, long dialogue, code repo, long structured data. The production benchmark for real-world long-context behavior.

**MRCR (Multi-Round Coreference Resolution).** Multi-turn coreference at scale. 8-needle, 24-needle, 100-needle variants. Exposes how many facts a model can juggle before attention degrades.

**NoLiMa.** "Non-lexical needle." The needle and the query share no literal overlap; retrieval requires one step of semantic reasoning. Harder than NIAH.

**HELMET.** Concatenates many documents, asks a question from any one. Tests selective attention.

**BABILong.** Embeds bAbI reasoning chains inside irrelevant haystacks. Tests reasoning-in-a-haystack, not just retrieval.

### What to actually report

- **Advertised context window.** The spec-sheet number.
- **Effective retrieval length.** NIAH pass at some threshold (e.g., 90%).
- **Effective reasoning length.** Multi-hop or aggregation pass at that threshold.
- **Degradation curve.** Accuracy vs context length, plotted per task type.

Two numbers for your spec sheet: retrieval-effective and reasoning-effective. Usually the reasoning-effective is 25-50% of the advertised window.




## Further Reading

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) — the original NIAH repo.
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) — the multi-task benchmark.
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) — real-world long-context eval.
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666) — harder needles.
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) — reasoning-in-haystack.
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) — the depth-bias paper.
