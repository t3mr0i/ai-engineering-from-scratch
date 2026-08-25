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




## Build It

Reconstruct **Coreference Resolution** by following `extract_mentions` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `extract_mentions` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-coref-picker.md` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) — canonical textbook chapter.
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) — span-based end-to-end.
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) — pretraining that improves coref.
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) — the benchmark.
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) — the rule-based classic.

## Exercises

Work from the smallest fixture that the Coreference Resolution demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `extract_mentions`, `infer_gender`, `agreement_score`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in Coreference Resolution and place it in an NLP pipeline**.
2. **Perturb one field.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind Coreference Resolution from first principles** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-coref-picker.md` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for Coreference Resolution**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Coreference Resolution** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `extract_mentions`, `infer_gender`, `agreement_score` traced to the value or shape that supports **Explain the core mechanism in Coreference Resolution and place it in an NLP pipeline**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central transformation behind Coreference Resolution from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/skill-coref-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for Coreference Resolution**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
