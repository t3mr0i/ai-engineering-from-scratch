# Transformer Block from Scratch — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to build a transformer block in PyTorch from the four moving pieces: LayerNorm, multi head causal attention, residual connections, position wise MLP.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Place the LayerNorms in two configurations (pre-LN and post-LN) and explain why one trains stably without warmup.
- **Evidence to retain:** the input, output, and invariant needed to implement causal masking inside the multi head attention so token `i` cannot see tokens `j > i`.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can track gradient flow through both variants on a 12 layer stack and read the result without hand waving.
- Run the lesson tests after adapting the implementation to a new project.

