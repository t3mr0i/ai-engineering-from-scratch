# Loading Pretrained Weights — reusable artifact

Use this card to apply the lesson outcome outside the walkthrough. Its primary goal is to read a safetensors file with the `safetensors` Python library and inspect the tensor names and shapes.

## Executable interface

- **Implementation:** [main.py](../code/main.py)
- **Canonical command (from the lesson directory):** `python3 code/main.py`
- **Controlled variation:** Map each pretrained parameter name onto a parameter inside the lesson 35 GPT model.
- **Evidence to retain:** the input, output, and invariant needed to handle the two name conventions that differ between published GPT-2 weights and the model in this track: `wte/wpe/h.N.attn.c_attn/c_proj` and `mlp.c_fc/c_proj` versus the locally named `tok_embed/pos_embed/blocks.N.attn.qkv/out_proj` and `mlp.fc1/fc2`.

## Reuse checklist

- Record the exact command and inputs so another person can reproduce the baseline.
- Change one variable at a time and preserve the before/after evidence.
- Treat the artifact as accepted only when you can detect and refuse a shape mismatch with a clear error before any weight assignment happens.
- Run the lesson tests after adapting the implementation to a new project.

