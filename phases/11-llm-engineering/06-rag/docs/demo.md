# Guided demo: RAG (Retrieval-Augmented Generation)

> **Time:** 10–15 minutes · **Question:** What observable evidence shows that you can build a complete RAG pipeline: document loading, chunking, embedding, vector storage, retrieval, and generation?

## Before you run

Write one predicted invariant for the baseline. Tie it to this objective: **Build a complete RAG pipeline: document loading, chunking, embedding, vector storage, retrieval, and generation.** Do not inspect the output first.

## Run the baseline

From the repository root:

```bash
python3 phases/11-llm-engineering/06-rag/code/main.py
```

The command must print a bounded result and exit with status 0. Locate the part of the output that provides evidence for **Build a complete RAG pipeline: document loading, chunking, embedding, vector storage, retrieval, and generation**. Record the exact input, the relevant output, and the invariant in one sentence.

## Change one variable

Change the smallest input or configuration value that helps you investigate **Implement semantic search using a vector database (ChromaDB, FAISS, or Pinecone) with proper indexing**. Keep every other value fixed. Run the same command again and capture a before/after pair; a screenshot without the values is not sufficient evidence.

## Probe a failure

Choose an edge case or violated precondition related to **Explain why RAG is preferred over fine-tuning for knowledge-grounded applications (cost, freshness, attribution)**. Predict whether the program should reject it, degrade gracefully, or return a different valid result. Run the probe and explain any mismatch between prediction and observation. Restore the source afterward.

## Exit ticket

In three sentences, state (1) the mechanism you observed, (2) the controlled change and its effect, and (3) the acceptance check that demonstrates you can **evaluate RAG quality using retrieval metrics (precision, recall) and generation metrics (faithfulness, relevance)**. If the evidence is ambiguous, name the next measurement rather than claiming success.

