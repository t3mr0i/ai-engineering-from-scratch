# Tensor Shape Trace Prompt

Produce a one-line trace for every boundary in a tensor pipeline:

```text
step: <operation>
formula: <einsum or reshape expression>
input: <named shapes>
output: <named shape>
invariant: <element count, contracted axis, or normalization>
```

For the lesson attention fixture, a correct trace includes:

```text
X: (B,T,E) -> Q/K/V: (B,H,T,D) -> scores: (B,H,T,T) -> output: (B,H,T,D)
```

with `E=H*D`. If a bias has shape `(D,)`, state that it broadcasts across `B`, `H`, and `T` only when those axes are arranged so `D` is trailing. Keep the trace next to the code review or experiment record.
