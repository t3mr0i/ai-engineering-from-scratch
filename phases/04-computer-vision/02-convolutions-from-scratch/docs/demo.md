# Guided demo: matching two convolution paths

This short run checks one concrete invariant: the nested-loop and `im2col` implementations must agree on the same finite CHW/OCHW fixture.

## Run

From the repository root:

```bash
python3 phases/04-computer-vision/02-convolutions-from-scratch/code/main.py
```

The first line reports a `(4,6,7)` output and a small maximum absolute difference for stride two and padding two. The Sobel line then shows a nonzero response at the synthetic left/right step. The final lines evaluate `output_size(32, K, P, S)` and the receptive field of three layers.

## One controlled comparison

In a Python shell, keep the input, weights, and bias fixed and call both functions once with `dilation=2`. Compare `np.max(np.abs(naive-im2col))`. If the shapes differ, inspect the effective footprint `D*(K-1)+1` before comparing values; a padding or stride mismatch is not a numerical tolerance problem.

## Exit check

Record the output shape, maximum difference, Sobel response shape, and the receptive-field integer. A valid handoff includes the exact parameter tuple and notes that these functions implement cross-correlation rather than a flipped mathematical convolution.
