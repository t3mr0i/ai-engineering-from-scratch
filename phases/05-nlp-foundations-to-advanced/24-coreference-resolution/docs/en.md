# Coreference Resolution

> "She called him. He did not answer. The doctor was at lunch." Three references to two people and nobody is named. Coreference resolution figures out who is who.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 minutes

## Learning Objectives

- Explain the core mechanism in Coreference Resolution and place it in an NLP pipeline
- Implement the central transformation behind Coreference Resolution from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Coreference Resolution

## The Problem

Extract every mention of Apple Inc. from a 300-word article. Easy when the article says "Apple." Hard when it says "the company," "they," "Cupertino's technology giant," or "Jobs's firm." Without resolving these mentions to the same entity, your NER pipeline misses 60-80% of the mentions.

Coreference resolution links every expression that refers to the same real-world entity into one cluster. It is the glue between surface-level NLP (NER, parsing) and downstream semantics (IE, QA, summarization, KG).

Why it matters in 2026:

- Summarization: "The CEO announced..." vs "Tim Cook announced..." — the summary should name the CEO.
- Question answering: "Who did she call?" requires resolving "she."
- Information extraction: a knowledge graph with "PER1 founded Apple" and "Jobs founded Apple" as separate entries is wrong.
- Multi-document IE: merging mentions across articles about the same event is cross-document coreference.

## The Concept

![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.** Input: a document. Output: a clustering of mentions (spans) where each cluster refers to one entity.

**Mention types.**

- **Named entity.** "Tim Cook"
- **Nominal.** "the CEO", "the company"
- **Pronominal.** "he", "she", "they", "it"
- **Appositive.** "Tim Cook, Apple's CEO,"

**Architectures.**

1. **Rule-based (Hobbs, 1978).** Syntactic-tree-based pronoun resolution using grammar rules. Good baseline. Surprisingly hard to beat on pronouns.
2. **Mention-pair classifier.** For every pair of mentions (m_i, m_j), predict whether they corefer. Cluster by transitive closure. Standard pre-2016.
3. **Mention-ranking.** For each mention, rank candidate antecedents (including "no antecedent"). Pick the top.
4. **Span-based end-to-end (Lee et al., 2017).** Transformer encoder. Enumerate all candidate spans up to a length cap. Predict mention scores. Predict antecedent-probability for each span. Cluster greedily. The modern default.
5. **Generative (2024+).** Prompt an LLM: "List every pronoun in this text and its antecedent." Works well on easy cases, struggles on long documents and rare referents.

**The evaluation metrics.** Five standard metrics (MUC, B³, CEAF, BLANC, LEA) because no single metric captures clustering quality. Report the average of the first three as CoNLL F1. State-of-the-art in 2026 on CoNLL-2012: ~83 F1.

**Known hard cases.**

- Definite descriptions referring to entities introduced pages earlier.
- Bridging anaphora ("the wheels" → a previously mentioned car).
- Zero anaphora in languages like Chinese and Japanese.
- Cataphora (pronoun before referent): "When **she** walked in, Mary smiled."




## Further Reading

- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) — canonical textbook chapter.
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) — span-based end-to-end.
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) — pretraining that improves coref.
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) — the benchmark.
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) — the rule-based classic.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Coreference Resolution and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Coreference Resolution from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Coreference Resolution and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
