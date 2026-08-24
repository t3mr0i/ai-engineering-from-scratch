# Natural Language Inference — Textual Entailment

> "t entails h" means a human reading t would conclude h is true. NLI is the task of predicting entailment / contradiction / neutral. Boring on the surface, load-bearing in production.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment Analysis), Phase 5 · 13 (Question Answering)
**Time:** ~60 minutes

## Learning Objectives

- Explain the core mechanism in Natural Language Inference — Textual Entailment and place it in an NLP pipeline
- Implement the central transformation behind Natural Language Inference — Textual Entailment from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Natural Language Inference — Textual Entailment

## The Problem

You built a summarizer. It produced a summary. How do you know the summary does not contain a hallucination?

You built a chatbot. It answered "yes." How do you know the answer is supported by the retrieved passage?

You need to classify 10,000 news articles by topic. You have no training labels. Can you reuse a model?

All three problems reduce to Natural Language Inference. NLI asks: given a premise `t` and a hypothesis `h`, is `h` entailed by `t`, contradicted, or neutral (unrelated)?

- **Hallucination check:** `t` = source document, `h` = summary claim. Not entailment = hallucination.
- **Grounded QA:** `t` = retrieved passage, `h` = generated answer. Not entailment = fabrication.
- **Zero-shot classification:** `t` = document, `h` = verbalized label ("This is about sports"). Entailment = predicted label.

One task, three production uses. This is why every RAG evaluation framework ships an NLI model under the hood.

## The Concept

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**The three labels.**

- **Entailment.** `t` → `h`. "The cat is on the mat" entails "There is a cat."
- **Contradiction.** `t` → ¬`h`. "The cat is on the mat" contradicts "There is no cat."
- **Neutral.** No inference either way. "The cat is on the mat" is neutral to "The cat is hungry."

**Not logical entailment.** NLI is *natural* language inference — what a typical human reader would infer, not strict logic. "John walked his dog" entails "John has a dog" in NLI, but strict first-order logic would only admit it if you axiomatize possession.

**Datasets.**

- **SNLI** (2015). 570k human-annotated pairs, image captions as premises. Narrow domain.
- **MultiNLI** (2017). 433k pairs across 10 genres. The standard training corpus in 2026.
- **ANLI** (2019). Adversarial NLI. Humans wrote examples specifically designed to break existing models. Harder.
- **DocNLI, ConTRoL** (2020–21). Document-length premises. Tests multi-hop and long-range inference.

**The architecture.** A transformer encoder (BERT, RoBERTa, DeBERTa) reads `[CLS] premise [SEP] hypothesis [SEP]`. The `[CLS]` representation feeds a 3-way softmax. Train on MNLI, evaluate on held-out benchmarks, get 90%+ accuracy on in-distribution pairs.

**Zero-shot via NLI.** Given a document and candidate labels, turn each label into a hypothesis ("This text is about sports"). Compute entailment probability for each. Pick the max. This is the mechanism behind Hugging Face's `zero-shot-classification` pipeline.




## Further Reading

- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) — SNLI.
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) — MultiNLI.
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) — the ANLI benchmark.
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) — NLI-as-classifier.
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) — the 2026 NLI workhorse.
