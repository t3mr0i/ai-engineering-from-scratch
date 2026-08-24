# End-to-End RAG System — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to compose the chunker, hybrid retriever, query rewriter, cross-encoder reranker, and answer generator into a single end-to-end pipeline.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement an answer generator that cites its claims by chunk anchor, with refuse-on-low-confidence fallback.
- **Evidence to retain:** the input, output, and invariant needed to run the lesson 68 eval against the assembled pipeline and prove the staged build wins on every metric over the same components in isolation.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can build a self-terminating CLI demo that ingests a fixture corpus, runs a fixed query set, and exits zero with a summary report.
- Run the lesson tests after adapting the implementation to a new project.

