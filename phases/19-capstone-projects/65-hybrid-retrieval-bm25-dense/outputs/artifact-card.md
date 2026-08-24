# Hybrid Retrieval with BM25 and Dense Embeddings — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement BM25 from scratch from the Robertson and Sparck Jones formulation, with field weighting, document length normalization, and tunable k1 and b.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Build a dense retriever on top of a deterministic mock embedding so the loop runs offline.
- **Evidence to retain:** the input, output, and invariant needed to implement reciprocal rank fusion exactly as Cormack, Clarke, and Buettcher published it in 2009, and explain why it dominates score-weighted interpolation.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can tune the RRF k constant and the per-modality weights and read the trade-offs on a small fixture corpus.
- Run the lesson tests after adapting the implementation to a new project.

