# Cross-Encoder Reranker — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to distinguish a bi-encoder retriever from a cross-encoder reranker by their input shape, parameter count, and per-query cost.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement a small cross-encoder from scratch as a transformer block that consumes a packed (query, document) sequence and emits a single relevance scalar.
- **Evidence to retain:** the input, output, and invariant needed to wire a two-stage retrieve-then-rerank pipeline: retrieve top-N with a cheap retriever, rerank N to top-K with the cross-encoder, return K.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can measure the latency-vs-quality trade-off on a small fixture corpus and pick the right N for a given latency budget.
- Run the lesson tests after adapting the implementation to a new project.

