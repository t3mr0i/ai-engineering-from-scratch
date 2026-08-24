# Text Summarization

> Extractive systems tell you what the document said. Abstractive systems tell you what the author meant. Different tasks, different pitfalls.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 11 (Machine Translation)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in Text Summarization and place it in an NLP pipeline
- Implement the central transformation behind Text Summarization from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Text Summarization

## The Problem

A 2,000-word news article lands in your feed. You need 120 words that capture it. You can either pick the three most important sentences from the article (extractive) or rewrite the content in your own words (abstractive). Both are called summarization. They are completely different problems.

Extractive summarization is a ranking problem. Score every sentence, return the top-`k`. The output is always grammatical because it is lifted verbatim. The risk is missing content that is distributed across the article.

Abstractive summarization is a generation problem. A transformer produces new text conditioned on the input. The output is fluent and compressive but may hallucinate facts that were not in the source. The risk is confident fabrication.

This lesson builds both, with the failure mode each one owns.

## The Concept

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive.** Treat the article as a graph where nodes are sentences and edges are similarities. Run PageRank (or something like it) over the graph to score sentences by how connected they are to everything else. Highest-scoring sentences are the summary. The canonical implementation is **TextRank** (Mihalcea and Tarau, 2004).

**Abstractive.** Fine-tune a transformer encoder-decoder (BART, T5, Pegasus) on document-summary pairs. At inference, the model reads the document and generates the summary token-by-token via cross-attention. Pegasus in particular uses a gap-sentence pretraining objective that makes it excellent at summarization without much fine-tuning.

Evaluation with **ROUGE** (Recall-Oriented Understudy for Gisting Evaluation). ROUGE-1 and ROUGE-2 score unigram and bigram overlap. ROUGE-L scores longest common subsequence. Higher is better but 40 ROUGE-L is "good" and 50 is "exceptional." Every paper reports all three. Use the `rouge-score` package.




## Further Reading

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) — the extractive canonical paper.
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) — the BART paper.
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) — Pegasus and the gap-sentence objective.
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/) — ROUGE paper.
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) — the factuality landscape paper.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Text Summarization and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Text Summarization from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Text Summarization and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
