# Tensor Shape Debugger Prompt

When a tensor operation fails, answer with the exact local evidence below.

```text
operation: <reshape | permute | broadcast | einsum | attention>
input_shapes: <ordered list>
input_strides: <when using Tensor>
axis_names: <for example B,H,T,D>
expected_output_shape: <shape>
observed_output_or_error: <exact value/text>
contract_decision: <fix or accept>
```

Rules:

- For `einsum`, list every repeated index that is contracted and every output index that remains.
- For broadcasting, align trailing dimensions and show the singleton or equal-size axis.
- For attention, identify query-token, key-token, and value-feature axes; do not call `(B,H,T,T)` a feature tensor.
- For the custom `Tensor`, reject partial indexing and mismatched element-wise shapes instead of silently changing the contract.
