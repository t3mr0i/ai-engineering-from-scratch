# Chunking Strategies, Compared — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to implement five chunking strategies from scratch: fixed-window, sentence, recursive-split, semantic clustering, and structural markdown headers.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Measure recall@k on a fixture corpus with gold-labeled answer spans and explain why one strategy wins on prose and a different strategy wins on technical documents.
- **Evidence to retain:** the input, output, and invariant needed to read a chunk-length distribution and recognize the failure modes each strategy injects: orphan sentences, mid-symbol cuts, header-only chunks, semantic drift.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can pick a default for a new corpus without running the benchmark by inspecting three properties: document type, average paragraph length, and whether the format carries explicit structure.
- Run the lesson tests after adapting the implementation to a new project.

