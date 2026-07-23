# Entity Linking & Disambiguation

> NER found "Paris." Entity linking decides: Paris, France? Paris Hilton? Paris, Texas? Paris (the Trojan prince)? Without linking, your knowledge graph stays ambiguous.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 minutes

## The Problem

A sentence reads: "Jordan beat the press." Your NER tags "Jordan" as PERSON. Good. But *which* Jordan?

- Michael Jordan (basketball)?
- Michael B. Jordan (actor)?
- Michael I. Jordan (Berkeley ML professor — yes, this confusion is real in ML papers)?
- Jordan (the country)?
- Jordan (Hebrew first name)?

Entity linking (EL) resolves each mention to a unique entry in a knowledge base: Wikidata, Wikipedia, DBpedia, or your domain KB. Two subtasks:

1. **Candidate generation.** Given "Jordan," which KB entries are plausible?
2. **Disambiguation.** Given the context, which candidate is the right one?

Both steps are learnable. Both are benchmarked. The combined pipeline has been stable for a decade — what changes is the quality of the disambiguator.

## The Concept

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation.** Given the mention surface form ("Jordan"), look up candidates in an alias index. Wikipedia alias dictionaries cover most named entities: "JFK" → John F. Kennedy, Jacqueline Kennedy, JFK airport, JFK (movie). Typical index returns 10-30 candidates per mention.

**Disambiguation: three approaches.**

1. **Prior + context (Milne & Witten, 2008).** `P(entity | mention) × context-similarity(entity, text)`. Works well, fast, no training.
2. **Embedding-based (ESS / REL / Blink).** Encode mention + context. Encode each candidate's description. Pick max cosine. The 2020-2024 default.
3. **Generative (GENRE, 2021; LLM-based, 2023+).** Decode the entity's canonical name token-by-token. Constrained to a trie of valid entity names so output is guaranteed to be a valid KB id.

**End-to-end vs pipeline.** Modern models (ELQ, BLINK, ExtEnD, GENRE) run NER + candidate generation + disambiguation in one pass. Pipeline systems still dominate in production because you can swap components.

### The two measurements

- **Mention recall (candidate gen).** Fraction of gold mentions where the correct KB entry appears in the candidate list. Floor for the whole pipeline.
- **Disambiguation accuracy / F1.** Given correct candidates, how often the top-1 is right.

Always report both. A system with 99% disambiguation on 80% candidate recall is an 80% pipeline.


## Use It

The 2026 stack:

| Situation | Pick |
|-----------|------|
| General-purpose English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, few mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB (medical, legal) | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| Extremely low-latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

Production pattern that ships in 2026: NER → coref → EL on each mention → collapse clusters to one canonical entity per cluster. Output: one KB id per entity in the document, not one per mention.

## Ship It

Save as `outputs/skill-entity-linker.md`:

```markdown
---
name: entity-linker
description: Design an entity linking pipeline — KB, candidate generator, disambiguator, evaluation.
version: 1.0.0
phase: 5
lesson: 25
tags: [nlp, entity-linking, knowledge-graph]
---

Given a use case (domain KB, language, volume, latency budget), output:

1. Knowledge base. Wikidata / Wikipedia / custom KB. Version date. Refresh cadence.
2. Candidate generator. Alias-index, embedding, or hybrid. Target mention recall @ K.
3. Disambiguator. Prior + context, embedding-based, generative, or LLM-prompted.
4. NIL strategy. Threshold on top score, classifier, or explicit NIL candidate.
5. Evaluation. Mention recall @ 30, top-1 accuracy, NIL-detection F1 on held-out set.

Refuse any EL pipeline without a mention-recall baseline (you cannot evaluate a disambiguator without knowing candidate gen surfaced the right entity). Refuse any pipeline using LLM-prompted EL without constrained output to valid KB ids. Flag systems where popularity bias affects minority entities (e.g. name-clashes) without domain fine-tuning.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Entity linking (EL) | Link to Wikipedia | Map a mention to a unique KB entry. |
| Candidate generation | Who could it be? | Return a shortlist of plausible KB entries for a mention. |
| Disambiguation | Pick the right one | Score candidates using context, pick the winner. |
| Alias index | The lookup table | Map from surface form → candidate entities. |
| NIL | Not in KB | Explicit prediction that no KB entry matches. |
| KB | Knowledge base | Wikidata, Wikipedia, DBpedia, or your domain KB. |
| AIDA-CoNLL | The benchmark | 1,393 Reuters articles with gold entity links. |

## Further Reading

- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) — the foundational prior+context approach.
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) — the embedding-based workhorse.
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) — generative EL with constrained decoding.
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) — the benchmark paper.
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) — the open production stack.
