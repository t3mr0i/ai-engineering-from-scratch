# Relation Extraction & Knowledge Graph Construction

> NER found the entities. Entity linking anchored them. Relation extraction finds the edges between them. A knowledge graph is the sum of nodes, edges, and their provenance.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 minutes

## The Problem

An analyst reads: "Tim Cook became CEO of Apple in 2011." Four facts:

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

Relation Extraction (RE) turns free text into structured triples `(subject, relation, object)`. Aggregate across a corpus and you have a knowledge graph. Aggregate and query and you have a reasoning substrate for RAG, analytics, or compliance audits.

The 2026 problem: LLMs extract relations enthusiastically. Too enthusiastically. They hallucinate triples that the source text does not support. Without provenance, you cannot tell real triples from plausible fiction. The 2026 answer is AEVS-style anchor-and-verify pipelines.

## The Concept

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple form.** `(subject_entity, relation_type, object_entity)`. Relations come from a closed ontology (Wikidata properties, FIBO, UMLS) or an open set (OpenIE-style, anything goes).

**Three extraction approaches.**

1. **Rule / pattern-based.** Hearst patterns: "X such as Y" → `(Y, isA, X)`. Plus hand-crafted regex. Brittle, precise, explainable.
2. **Supervised classifier.** Given two entity mentions in a sentence, predict the relation from a fixed set. Trained on TACRED, ACE, KBP. Standard 2015–2022.
3. **Generative LLM.** Prompt the model to emit triples. Works out of the box. Needs provenance, or hallucinates plausible-looking junk.

**AEVS (Anchor-Extraction-Verification-Supplement, 2026).** The current hallucination-mitigation framework:

- **Anchor.** Identify every entity span and relation-phrase span with exact positions.
- **Extract.** Generate triples linked to anchor spans.
- **Verify.** Match each triple element back to the source text; reject anything unsupported.
- **Supplement.** A coverage pass ensures no anchored span is dropped.

Hallucinations drop sharply. Requires more compute but is auditable.

**The open-vs-closed tradeoff.**

- **Closed ontology.** Fixed property list (e.g., Wikidata's 11,000+ properties). Predictable. Queryable. Hard to invent.
- **Open IE.** Any verbal phrase becomes a relation. High recall. Low precision. Messy to query.

Production KGs usually mix: open IE for discovery, then canonicalize relations onto a closed ontology before merging into the main graph.




## Further Reading

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) — the distant-supervision paper.
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) — seq2seq RE workhorse.
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) — joint IE.
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178) — 2026 hallucination-mitigation design.
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) — canonical graph queries.
