# Guided demo: Vectors, Matrices & Operations

> **Time:** 10–15 minutes · **Question:** Can you predict the result and shape of each operation before the interpreter prints it?

## Run the baseline

From the repository root:

```bash
python3 phases/01-math-foundations/02-vectors-matrices-operations/code/main.py
```

Find the `A * B (element-wise)` and `A @ B (matrix multiply)` sections. For `A=[[1,2],[3,4]]` and `B=[[5,6],[7,8]]`, record `[[5,12],[21,32]]` versus `[[19,22],[43,50]]`, then state why both products have shape `(2,2)` in this particular fixture.

## Change a bias shape

In `demo_broadcasting`, replace `bias = Matrix([[10,20,30]])` with `Matrix([[10],[20]])`. Predict both output rows before rerunning. The row bias produces `[[11,22,33],[14,25,36]]`; the column bias produces `[[11,12,13],[24,25,26]]`. Explain which dimension is repeated in each case.

## Probe a contract boundary

In a Python shell from `code/`, evaluate `Matrix([[1,2],[2,4]]).inverse_2x2()`. Capture `ValueError("Matrix is singular, no inverse exists")`. Then try a `(2,3) @ (2,1)` product and capture the inner-dimension error. These probes test the numerical and shape contracts, not formatting.

## Exit ticket

Write one sentence for each: element-wise versus matrix multiplication, why `det([[4,7],[2,6]])=10` permits an inverse, and why `(4,3) @ (3,1) + (4,1)` is a valid dense-layer step. Restore any demo edits after the exercise.
