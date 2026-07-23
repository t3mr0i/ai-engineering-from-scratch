# Named Entity Recognition

> Pull the names out. Sounds easy until you deal with ambiguous boundaries, nested entities, and domain jargon.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

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


## Use It

spaCy ships production-grade NER out of the box.

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple sued Google over its iPhone search deal in the US.")
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")
```

```
Apple                ORG
Google               ORG
iPhone               ORG
US                   GPE
```

Notice `iPhone` labeled `ORG` rather than `PRODUCT` — spaCy's small model has weak product-entity coverage. The large model (`en_core_web_lg`) does better. The transformer model (`en_core_web_trf`) does better still.

Hugging Face for BERT-based NER:

```python
from transformers import pipeline

ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print(ner("Apple sued Google over its iPhone in the US."))
```

```
[{'entity_group': 'ORG', 'word': 'Apple', ...},
 {'entity_group': 'ORG', 'word': 'Google', ...},
 {'entity_group': 'MISC', 'word': 'iPhone', ...},
 {'entity_group': 'LOC', 'word': 'US', ...}]
```

`aggregation_strategy="simple"` merges contiguous B-X, I-X tokens into a span. Without it, you get token-level labels and have to merge yourself.

### LLM-based NER (the 2026 option)

Zero-shot and few-shot LLM NER is now competitive with fine-tuned models on many domains, and dramatically better when labeled data is scarce.

- **Zero-shot prompting.** Give the LLM a list of entity types and an example schema. Ask for JSON output. Works out of the box; accuracy is moderate on novel domains.
- **ZeroTuneBio-style prompting.** Decompose the task into candidate extraction → meaning explanation → judgment → re-check. A multi-stage prompt (not one-shot) lifts accuracy substantially on biomedical NER. The same pattern works for legal, financial, and scientific domains.
- **Dynamic prompting with RAG.** Retrieve the most similar labeled examples from a small annotated seed set for every inference call; build the few-shot prompt on the fly. In 2026 benchmarks, this lifts GPT-4 biomedical NER F1 by 11-12% over static prompting.
- **Per-entity-type decomposition.** For long documents, a single call that extracts all entity types at once loses recall as length grows. Run one extraction pass per entity type. Higher inference cost, substantially higher accuracy. This is the standard pattern for clinical notes and legal contracts.

Production recommendation as of 2026: start with an LLM zero-shot baseline before you collect training data. Often the F1 is good enough that you never need to fine-tune.

### Where classical NER still wins

Even with LLMs available, classical NER wins when:

- Latency budget is under 50ms.
- You have thousands of labeled examples and need 98%+ F1.
- The domain has a stable ontology where a pretrained CRF or BiLSTM transfers well.
- Regulatory constraints require an on-prem, non-generative model.

### Where it falls apart

- **Domain shift.** CoNLL-trained NER on legal contracts performs worse than a gazetteer. Fine-tune on your domain.
- **Nested entities.** "Bank of America Tower" is simultaneously an ORG and a FACILITY. Standard BIO cannot represent overlapping spans. You need nested NER (multi-pass or span-based models).
- **Long entities.** "United States Federal Deposit Insurance Corporation." Token-level models sometimes split this. Use `aggregation_strategy` or post-process.
- **Sparse types.** Medical NER labels like DRUG_BRAND, ADVERSE_EVENT, DOSE. General-purpose models have no idea. Scispacy and BioBERT are the starting points there.

## Ship It

Save as `outputs/skill-ner-picker.md`:

```markdown
---
name: ner-picker
description: Pick the right NER approach for a given extraction task.
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

Given a task description (domain, label set, language, latency, data volume), output:

1. Approach. Rule-based + gazetteer, CRF, BiLSTM-CRF, or transformer fine-tune.
2. Starting model. Name it (spaCy model ID, Hugging Face checkpoint ID, or "custom, trained from scratch").
3. Labeling strategy. BIO, BILOU, or span-based. Justify in one sentence.
4. Evaluation. Use `seqeval`. Always report entity-level F1 (not token-level).

Refuse to recommend fine-tuning a transformer for under 500 labeled examples unless the user already has a pretrained domain model. Flag nested entities as needing span-based or multi-pass models. Require a gazetteer audit if the user mentions "production scale" and labels are unchanged from CoNLL-2003.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NER | Extract names | Label token spans with types (PERSON, ORG, GPE, DATE, ...). |
| BIO | Tagging scheme | `B-X` begins, `I-X` continues, `O` outside. |
| BILOU | Better BIO | Adds `L-X` (last), `U-X` (unit) for cleaner boundaries. |
| CRF | Structured classifier | Models transitions between labels, not just emissions. Enforces valid sequences. |
| Nested NER | Overlapping entities | One span is a different entity than a sub-span of it. BIO cannot express this. |
| Entity-level F1 | Proper NER metric | Predicted span must match true span exactly. Token-level F1 overstates accuracy. |

## Further Reading

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) — the BiLSTM-CRF paper. Canonical.
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805) — introduces the token-classification pattern that became standard.
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) — practical reference for every attribute on `Doc.ents` and `Span`.
- [seqeval](https://github.com/chakki-works/seqeval) — the correct metric library. Use it always.
