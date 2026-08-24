# Query Rewriting: HyDE, Multi-Query, and Decomposition — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement Hypothetical Document Embeddings (HyDE): generate a fake answer, embed it, retrieve against that vector instead of the query vector.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement multi-query expansion: rewrite one query into N paraphrases, retrieve with each, merge the union by reciprocal rank fusion.
- **Evidence to retain:** the input, output, and invariant needed to implement query decomposition: split a complex question into sub-questions, retrieve per sub-question, merge.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can compare the three rewriters head to head on a fixture and explain when each strategy wins.
- Run the lesson tests after adapting the implementation to a new project.

