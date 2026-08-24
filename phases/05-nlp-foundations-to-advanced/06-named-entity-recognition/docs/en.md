# Named Entity Recognition

> Pull the names out. Sounds easy until you deal with ambiguous boundaries, nested entities, and domain jargon.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in Named Entity Recognition and place it in an NLP pipeline
- Implement the central transformation behind Named Entity Recognition from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Named Entity Recognition

## The Problem

"Apple sued Google over its iPhone search deal in the US." Five entities: Apple (ORG), Google (ORG), iPhone (PRODUCT), search deal (maybe), US (GPE). A good NER system extracts all of them with correct types. A bad one misses iPhone, confuses Apple the fruit with Apple the company, and labels "US" as a PERSON.

NER is the workhorse underneath every structured extraction pipeline. Resume parsing, compliance log scanning, medical record anonymization, search query understanding, grounding for chatbot responses, legal contract extraction. You never quite see it; you always depend on it.

This lesson walks the classical path (rule-based, HMM, CRF) into the modern one (BiLSTM-CRF, then transformers). Each step solves a specific limitation of the one before it. The pattern is the lesson.

## The Concept

**BIO tagging** (or BILOU) turns entity extraction into a sequence-labeling problem. Label each token with `B-TYPE` (beginning of entity), `I-TYPE` (inside entity), or `O` (outside any entity).

```
Apple    B-ORG
sued     O
Google   B-ORG
over     O
its      O
iPhone   B-PRODUCT
search   O
deal     O
in       O
the      O
US       B-GPE
.        O
```

Multi-token entities chain: `New B-GPE`, `York I-GPE`, `City I-GPE`. A model that understands BIO can extract arbitrary spans.

The architecture progression:

- **Rule-based.** Regex + gazetteer lookups. High precision on known entities, zero coverage on new ones.
- **HMM.** Hidden Markov Model. Emission probability of token given tag, transition probability of tag-to-tag. Viterbi decode. Trained on labeled data.
- **CRF.** Conditional Random Field. Like HMM but discriminative, so you can mix arbitrary features (word shape, capitalization, neighboring words). Still the classical production workhorse in 2026 for low-resource deployments.
- **BiLSTM-CRF.** Neural features instead of hand-crafted. LSTM reads the sentence both directions, CRF layer on top enforces consistent tag sequences.
- **Transformer-based.** Fine-tune BERT with a token-classification head. Best accuracy. Most compute.




## Further Reading

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) — the BiLSTM-CRF paper. Canonical.
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805) — introduces the token-classification pattern that became standard.
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) — practical reference for every attribute on `Doc.ents` and `Span`.
- [seqeval](https://github.com/chakki-works/seqeval) — the correct metric library. Use it always.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Named Entity Recognition and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Named Entity Recognition from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Named Entity Recognition and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
