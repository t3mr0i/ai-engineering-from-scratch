# Question Answering Systems

> Three systems shaped modern QA. Extractive found spans. Retrieval-augmented grounded them in documents. Generative produced answers. Every modern AI assistant is a mix of the three.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 11 (Machine Translation), Phase 5 · 10 (Attention Mechanism)
**Time:** ~75 minutes

## The Problem

A user types "When did the first iPhone launch?" and expects "June 29, 2007." Not "Apple's history is long and varied." Not "2007" sitting in isolation with no sentence. A direct, grounded, correct answer.

Three architectures have dominated QA over the last decade.

- **Extractive QA.** Given a question and a passage that is known to contain the answer, find the start and end indices of the answer span in the passage. SQuAD is the canonical benchmark.
- **Open-domain QA.** The passage is not given. Retrieve the relevant passage first, then extract or generate an answer. This is the bedrock of every RAG pipeline today.
- **Generative / Closed-book QA.** A large language model answers from its parametric memory. No retrieval. Fastest at inference, least reliable on facts.

The trend in 2026 is hybrid: retrieve the best few passages, then prompt a generative model to answer grounded in those passages. That is RAG, and lesson 14 covers the retrieval half in depth. This lesson builds the QA half.

## The Concept

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive.** Encode question and passage together with a transformer (BERT family). Train two heads that predict start and end token indices of the answer. Loss is cross-entropy over valid positions. Output is a span from the passage. Never hallucinates (by construction), never handles questions the passage cannot answer (by construction).

**Retrieval-augmented (RAG).** Two stages. First, a retriever finds the top-`k` passages from a corpus. Second, a reader (extractive or generative) produces the answer using those passages. The retriever-reader split lets each be trained and evaluated independently. Modern RAG often adds a reranker between them.

**Generative.** A decoder-only LLM (GPT, Claude, Llama) answers from learned weights. No retrieval step. Excellent on common knowledge, catastrophic on rare or recent facts. The hallucination rate is inversely correlated with fact frequency in the pretraining data.


## Use It

The 2026 stack.

| Use case | Recommended |
|---------|-------------|
| Given passage, find answer span | `deepset/roberta-base-squad2` |
| Over a fixed corpus, closed-book not acceptable | RAG: dense retriever + LLM reader |
| Real-time over a document store | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA (follow-up questions) | LLM with conversation history + RAG on each turn |
| Highly factual, regulated domains | Extractive over an authoritative corpus; never generative alone |

Extractive QA is unfashionable in 2026 because RAG with LLMs handles more cases. It still ships in contexts where literal quotation is required: legal research, regulatory compliance, audit tools.

## Ship It

Save as `outputs/skill-qa-architect.md`:

```markdown
---
name: qa-architect
description: Choose QA architecture, retrieval strategy, and evaluation plan.
version: 1.0.0
phase: 5
lesson: 13
tags: [nlp, qa, rag]
---

Given requirements (corpus size, question type, factuality constraint, latency budget), output:

1. Architecture. Extractive, RAG with extractive reader, RAG with generative reader, or closed-book LLM. One-sentence reason.
2. Retriever. None, BM25, dense (name the encoder), or hybrid.
3. Reader. SQuAD-tuned model, LLM by name, or "domain-fine-tuned DistilBERT."
4. Evaluation. EM + F1 for extractive benchmarks; answer accuracy + citation accuracy + refusal calibration for production. Name what you are measuring and how you are measuring it.

Refuse closed-book LLM answers for regulatory or compliance-sensitive questions. Refuse any QA system without a retrieval-recall baseline (you cannot evaluate the reader without knowing the retriever surfaced the right passage). Flag questions that require multi-hop reasoning as needing specialized multi-hop retrievers like HotpotQA-trained systems.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Extractive QA | Find the answer span | Predict start and end indices of the answer within a given passage. |
| Open-domain QA | QA over a corpus | No given passage; must retrieve then answer. |
| RAG | Retrieve then generate | Retrieval-augmented generation. Retriever + reader pipeline. |
| SQuAD | Canonical benchmark | Stanford Question Answering Dataset. EM + F1 metrics. |
| Hallucination | Made-up answer | Reader output not supported by retrieved context. |
| Refusal calibration | Know when to shut up | System correctly says "I don't know" when unable to answer. |

## Further Reading

- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) — the benchmark paper.
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) — DPR, the canonical dense retriever for QA.
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) — the paper that named RAG.
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) — comprehensive RAG survey.
