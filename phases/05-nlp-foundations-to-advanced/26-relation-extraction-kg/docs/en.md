# Relation Extraction & Knowledge Graph Construction

> NER found the entities. Entity linking anchored them. Relation extraction finds the edges between them. A knowledge graph is the sum of nodes, edges, and their provenance.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 minutes

## Learning Objectives

- Explain the core mechanism in Relation Extraction & Knowledge Graph Construction and place it in an NLP pipeline
- Implement the central transformation behind Relation Extraction & Knowledge Graph Construction from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Relation Extraction & Knowledge Graph Construction

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




## Build It

Reconstruct **Relation Extraction & Knowledge Graph Construction** by following `extract` on a graph with edges (0,1) and (1,2). Run `python3 main.py` and verify that degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly.

## Use It

Call `extract` from a small caller with a graph with edges (0,1) and (1,2). Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-re-designer.md` with the command `python3 main.py`, the accepted input shape (a graph with edges (0,1) and (1,2)), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) — the distant-supervision paper.
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) — seq2seq RE workhorse.
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) — joint IE.
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178) — 2026 hallucination-mitigation design.
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) — canonical graph queries.

## Exercises

Work from the smallest fixture that the Relation Extraction & Knowledge Graph Construction demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using a graph with edges (0,1) and (1,2). Follow `extract`, `verify`, `build_graph`. Expect degrees, adjacency, or connectivity expose the isolated/no-edge case explicitly; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in Relation Extraction & Knowledge Graph Construction and place it in an NLP pipeline**.
2. **Perturb one field.** Repeat the command after changing only the edge list: use the same graph with an isolated node 3. Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind Relation Extraction & Knowledge Graph Construction from first principles** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation a graph with no edges. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/skill-re-designer.md` and add a worked example using a graph with edges (0,1) and (1,2). Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for Relation Extraction & Knowledge Graph Construction**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Relation Extraction & Knowledge Graph Construction** should contain:

- the `python3 main.py` output for a graph with edges (0,1) and (1,2), with `extract`, `verify`, `build_graph` traced to the value or shape that supports **Explain the core mechanism in Relation Extraction & Knowledge Graph Construction and place it in an NLP pipeline**;
- a before/after comparison for the edge list, where the same graph with an isolated node 3 changes the observation in the direction predicted by **Implement the central transformation behind Relation Extraction & Knowledge Graph Construction from first principles**;
- a recorded result for a graph with no edges that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/skill-re-designer.md` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for Relation Extraction & Knowledge Graph Construction**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
