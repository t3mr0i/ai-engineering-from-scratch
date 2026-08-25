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




## Build It

Reconstruct **Natural Language Inference — Textual Entailment** by following `tokenize` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `tokenize` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-nli-picker.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) — SNLI.
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) — MultiNLI.
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) — the ANLI benchmark.
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) — NLI-as-classifier.
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) — the 2026 NLI workhorse.

## Exercises

Use `tokenize` as the trace: start from the text "red fox", keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the text "red fox". Follow `tokenize`, `content_words`, `has_negation`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in Natural Language Inference — Textual Entailment and place it in an NLP pipeline**.
2. **Vary one named input.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind Natural Language Inference — Textual Entailment from first principles** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/skill-nli-picker.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for Natural Language Inference — Textual Entailment**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Natural Language Inference — Textual Entailment** should contain:

- the `python3 main.py` output for the text "red fox", with `tokenize`, `content_words`, `has_negation` traced to the value or shape that supports **Explain the core mechanism in Natural Language Inference — Textual Entailment and place it in an NLP pipeline**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Implement the central transformation behind Natural Language Inference — Textual Entailment from first principles**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/skill-nli-picker.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for Natural Language Inference — Textual Entailment**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
