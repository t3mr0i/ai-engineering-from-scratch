---
name: prompt-cnn-architect
description: Review a small CNN stack using explicit output-size and receptive-field arithmetic
phase: 4
lesson: 2
---

# CNN stack review

For each proposed layer, ask for `(C_in,C_out,K,S,P,D)`. Compute
`floor((H + 2P - D*(K-1) - 1)/S)+1` separately for height and width, then update the receptive field with the current jump. Reject a layer when the footprint cannot fit or when a shape needed by a residual addition is missing.

The local proof path is:

```bash
python3 main.py
```

For one fixture, compare `conv2d_naive` and `conv2d_im2col` with the same bias, stride, padding, and dilation. Report the output shape and maximum absolute difference. Keep cross-correlation orientation explicit for asymmetric kernels; do not silently flip Sobel filters.
