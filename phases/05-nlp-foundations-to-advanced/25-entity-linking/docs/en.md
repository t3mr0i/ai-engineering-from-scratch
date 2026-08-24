# Entity Linking & Disambiguation

> NER found "Paris." Entity linking decides: Paris, France? Paris Hilton? Paris, Texas? Paris (the Trojan prince)? Without linking, your knowledge graph stays ambiguous.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 minutes

## Learning Objectives

- Explain the core mechanism in Entity Linking & Disambiguation and place it in an NLP pipeline
- Implement the central transformation behind Entity Linking & Disambiguation from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Entity Linking & Disambiguation

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

**Worked example (hypothetical).** A system with 99% disambiguation on 80% candidate recall is only about an 80% end-to-end pipeline. Always report both stages.




## Further Reading

- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) — the foundational prior+context approach.
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) — the embedding-based workhorse.
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) — generative EL with constrained decoding.
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) — the benchmark paper.
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) — the open production stack.
