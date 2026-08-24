# BPE Tokenizer From Scratch — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to train a Byte-Pair Encoding vocabulary from a raw text corpus by repeatedly merging the most frequent adjacent symbol pair.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Implement a deterministic merge table and apply it to fresh text to produce a stream of subword ids.
- **Evidence to retain:** the input, output, and invariant needed to round-trip arbitrary UTF-8 input to ids and back without information loss.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can reserve and protect special tokens (`<|endoftext|>`, `<|pad|>`) so they survive training and decoding.
- Run the lesson tests after adapting the implementation to a new project.

