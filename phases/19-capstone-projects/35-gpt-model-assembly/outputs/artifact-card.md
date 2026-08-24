# GPT Model Assembly — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to assemble the transformer block from lesson 34 into a full GPT model: token embedding, position embedding, N blocks, final LayerNorm, language model head.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Reproduce the 124 million parameter configuration: vocab 50257, context 1024, embedding 768, twelve heads, twelve layers.
- **Evidence to retain:** the input, output, and invariant needed to tie the language model head weights to the token embedding and explain why that saves ~38 million parameters at this scale.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can generate text from a prompt with multinomial sampling, temperature scaling, and top-k truncation, holding context length with a sliding window.
- Run the lesson tests after adapting the implementation to a new project.

