# Multilingual NLP

> One model, 100+ languages, zero training data for most of them. Cross-lingual transfer is the practical miracle of the 2020s.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 04 (GloVe, FastText, Subword), Phase 5 · 11 (Machine Translation)
**Time:** ~45 minutes

## Learning Objectives

- Explain the core mechanism in Multilingual NLP and place it in an NLP pipeline
- Implement the central transformation behind Multilingual NLP from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Multilingual NLP

## The Problem

English has billions of labeled examples. Urdu has thousands. Maithili has almost none. Any practical NLP system that serves a global audience has to work on the long tail of languages where task-specific training data does not exist.

Multilingual models solve this by training one model on many languages simultaneously. The shared representation lets the model transfer skills learned in high-resource languages to low-resource ones. Fine-tune the model on English sentiment analysis, and it produces surprisingly good sentiment predictions on Urdu out of the box. That is zero-shot cross-lingual transfer, and it has reshaped how NLP ships to the world.

This lesson names the tradeoffs, the canonical models, and the one decision that trips up teams new to multilingual work: picking a source language for transfer.

## The Concept

![Cross-lingual transfer via shared multilingual embedding space](../assets/multilingual.svg)

**Shared vocabulary.** Multilingual models use a SentencePiece or WordPiece tokenizer trained on text from all target languages. The vocabulary is shared: the same subword unit represents the same morpheme across related languages. `anti-` in English and Italian gets the same token.

**Shared representation.** A transformer pretrained on masked language modeling across many languages learns that semantically similar sentences in different languages produce similar hidden states. mBERT, XLM-R, and NLLB all exhibit this. Embeddings for "cat" in English cluster near "chat" in French and "gato" in Spanish, and so do full-sentence embeddings.

**Zero-shot transfer.** Fine-tune the model on labeled data in one language (usually English). At inference, run it on any other language the model supports. No target-language labels needed. Results are strong for typologically related languages and weaker for distant ones.

**Few-shot fine-tuning.** Add 100-500 labeled examples in the target language. Accuracy jumps to 95-98% of the English baseline on classification tasks. This is the single most cost-effective lever in multilingual NLP.

## The models

| Model | Year | Coverage | Notes |
|-------|------|----------|-------|
| mBERT | 2018 | 104 languages | Trained on Wikipedia. First practical multilingual LM. Weak on low-resource. |
| XLM-R | 2019 | 100 languages | Trained on CommonCrawl (much larger than Wikipedia). Sets the cross-lingual baseline. Base 270M, Large 550M. |
| XLM-V | 2023 | 100 languages | XLM-R with 1M-token vocabulary (vs 250k). Better on low-resource. |
| mT5 | 2020 | 101 languages | T5 architecture for multilingual generation. |
| NLLB-200 | 2022 | 200 languages | Meta's translation model; includes 55 low-resource languages. |
| BLOOM | 2022 | 46 languages + 13 programming | Open 176B LLM trained multilingually. |
| Aya-23 | 2024 | 23 languages | Cohere's multilingual LLM. Strong on Arabic, Hindi, Swahili. |

Pick by use case. Classification works well with XLM-R-base as the sane default. Generation tasks call for mT5 or NLLB depending on translation vs open generation. LLM-style work pairs with Aya-23 or Claude using explicit multilingual prompting.

## The source-language decision (2026 research)

Most teams default to English as the fine-tuning source. Recent research (2026) shows this is often wrong.

Language similarity predicts transfer quality better than raw corpus size. For Slavic targets, German or Russian often beat English. For Indic targets, Hindi often beats English. The **qWALS** similarity metric (2026, based on World Atlas of Language Structures features) quantifies this. **LANGRANK** (Lin et al., ACL 2019) is a separate, earlier method that ranks candidate source languages from a combination of linguistic similarity, corpus size, and genetic relatedness.

Practical rule: if your target language has a typologically close high-resource relative, try fine-tuning on that one first, then compare to English fine-tune.




## Further Reading

- [Conneau et al. (2019). Unsupervised Cross-lingual Representation Learning at Scale](https://arxiv.org/abs/1911.02116) — the XLM-R paper.
- [Pires, Schlinger, Garrette (2019). How Multilingual is Multilingual BERT?](https://arxiv.org/abs/1906.01502) — the analysis paper that started the cross-lingual transfer research line.
- [Costa-jussà et al. (2022). No Language Left Behind](https://arxiv.org/abs/2207.04672) — NLLB-200 paper.
- [Üstün et al. (2024). Aya Model: An Instruction Finetuned Open-Access Multilingual Language Model](https://arxiv.org/abs/2402.07827) — Aya, Cohere's multilingual LLM.
- [Language Similarity Predicts Cross-Lingual Transfer Learning Performance (2026)](https://www.mdpi.com/2504-4990/8/3/65) — the qWALS / LANGRANK source-language paper.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Multilingual NLP and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Multilingual NLP from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Multilingual NLP and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
