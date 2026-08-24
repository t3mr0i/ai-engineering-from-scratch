# RAG Evaluation: Precision, Recall, MRR, nDCG, Faithfulness, Answer Relevance — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compute four retrieval metrics from gold qrels: precision@k, recall@k, MRR (mean reciprocal rank), and nDCG@k.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Compute two answer-grade metrics: faithfulness (every claim grounded in retrieved context) and answer relevance (the answer addresses the question).
- **Evidence to retain:** the input, output, and invariant needed to build a fixture qrels file (queries, gold doc ids, gold answer text) that the eval reads end to end.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can read the metric values to diagnose where a pipeline is failing: retrieval, ranking, generation, or grounding.
- Run the lesson tests after adapting the implementation to a new project.

