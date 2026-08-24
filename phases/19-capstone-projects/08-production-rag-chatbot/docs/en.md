# Capstone 08 — Production RAG Chatbot for a Regulated Vertical

> Harvey, Glean, Mendable, and LlamaCloud all run the same production shape in 2026. Ingest with docling or Unstructured and ColPali for visuals. Hybrid search. Re-rank with bge-reranker-v2-gemma. Synthesize with Claude Sonnet 4.6 using prompt caching at 60-80% hit rate. Guard with Llama Guard 4 and NeMo Guardrails. Watch with Langfuse and Phoenix. Grade with RAGAS on a 200-question golden set. Build one in a regulated domain (legal, clinical, insurance), and the capstone is passing the golden set, the red team, and the drift dashboard.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P5 · P7 · P11 · P12 · P17 · P18
**Time:** 30 hours

## Learning Objectives

- Define measurable acceptance criteria for Capstone 08 — Production RAG Chatbot for a Regulated Vertical
- Integrate the required components into one self-terminating workflow
- Exercise happy paths, edge cases, and failure recovery with reproducible fixtures
- Package the verified result as a reusable curriculum artifact

## Problem

Regulated-domain RAG (legal contracts, clinical trial protocols, insurance policies) is the most-shipped production shape of 2026 because the ROI is obvious and the stakes are concrete. Harvey (Allen & Overy) built it for legal. Mendable ships the developer-docs flavor. Glean covers enterprise search. The pattern is: ingest high-fidelity, retrieve hybrid with rerank, synthesize with citation enforcement and prompt caching, guard with multiple safety layers, and monitor drift continuously.

The hard parts are not the model. They are jurisdiction-aware compliance (HIPAA, GDPR, SOC2), citation-level auditability, cost control (prompt caching buys 60-90% discount when hit rate is high), hallucination detection via RAGAS faithfulness, and drift detection when the source documents get updated without the index catching up. This capstone asks you to ship all of it on a 200-question golden set with a red-team suite alongside.

## Concept

The pipeline has two sides. **Ingestion**: docling or Unstructured parses structured documents; ColPali handles visually rich ones; chunks get summaries, tags, and role-based access labels. Vectors go into pgvector + pgvectorscale (under 50M vectors) or Qdrant Cloud; sparse BM25 runs alongside. **Conversation**: LangGraph handles memory and multi-turn; each query runs hybrid retrieval, reranks with bge-reranker-v2-gemma-2b, synthesizes with Claude Sonnet 4.6 (prompt-cached), passes output through Llama Guard 4 and NeMo Guardrails, and emits a citation-anchored response.

The eval stack has four layers. **Golden set** (200 labeled Q/A with citations) for correctness. **Red team** (jailbreaks, PII extraction attempts, off-domain questions) for safety. **RAGAS** for faithfulness / answer relevance / context precision automatically per-turn. **Drift dashboard** (Arize Phoenix) watching retrieval quality and hallucination score weekly.

Prompt caching is the cost lever. Claude 4.5+ and GPT-5+ support caching system prompts + retrieved context. At 60-80% hit rate, per-query cost drops 3-5x. The pipeline must be designed for stable prefixes (system prompt + reranked context first) to achieve high cache hit rates.

## Architecture

```
documents (contracts, protocols, policies)
      |
      v
docling / Unstructured parse + ColPali for visuals
      |
      v
chunks + summaries + role-labels + jurisdiction tags
      |
      v
pgvector + pgvectorscale  +  BM25 (Tantivy)
      |
query + role + jurisdiction
      |
      v
LangGraph conversational agent
   +--- retrieve (hybrid)
   +--- filter by role + jurisdiction
   +--- rerank (bge-reranker-v2-gemma-2b or Voyage rerank-2)
   +--- synthesize (Claude Sonnet 4.6, prompt cached)
   +--- guard (Llama Guard 4 + NeMo Guardrails + Presidio output PII scrub)
   +--- cite + return
      |
      v
eval:
  RAGAS faithfulness / answer_relevance / context_precision (online)
  Langfuse annotation queue (sampled)
  Arize Phoenix drift (weekly)
  red team suite (pre-release)
```

## Stack

- Ingestion: Unstructured.io or docling for structured documents; ColPali for visually-rich PDFs
- Vector DB: pgvector + pgvectorscale under 50M vectors; Qdrant Cloud otherwise
- Sparse: Tantivy BM25 with field weights
- Orchestration: LlamaIndex Workflows (ingestion) + LangGraph (conversation)
- Re-ranker: bge-reranker-v2-gemma-2b self-hosted or Voyage rerank-2 hosted
- LLM: Claude Sonnet 4.6 with prompt caching; fallback Llama 3.3 70B self-hosted
- Eval: RAGAS 0.2 online, DeepEval for hallucination and jailbreak suites
- Observability: Langfuse self-hosted with annotation queue; Arize Phoenix for drift
- Guardrails: Llama Guard 4 input/output classifier, NeMo Guardrails v0.12 policy, Presidio PII scrub
- Compliance: role-based access labels on chunks; jurisdiction tags for GDPR/HIPAA




## Further Reading

- [Harvey AI](https://www.harvey.ai) — reference legal production stack
- [Glean enterprise search](https://www.glean.com) — reference RAG at enterprise scale
- [Mendable documentation](https://mendable.ai) — developer-docs RAG reference
- [LlamaCloud Parse + Index](https://docs.llamaindex.ai/en/stable/examples/llama_cloud/llama_parse/) — managed ingestion
- [Anthropic prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — the cost-lever reference
- [RAGAS 0.2 documentation](https://docs.ragas.io/) — the canonical RAG eval framework
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) — reference drift observability
- [Llama Guard 4](https://ai.meta.com/research/publications/llama-guard-4/) — 2026 safety classifier
- [NeMo Guardrails v0.12](https://docs.nvidia.com/nemo-guardrails/) — policy rail framework
