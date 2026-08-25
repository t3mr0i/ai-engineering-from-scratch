# Complex Numbers for AI

> Complex multiplication is a compact language for rotations, phases, and Fourier coefficients.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 01–04 (vectors, calculus, and transformations)
**Time:** ~60 minutes

## Learning Objectives

- Implement rectangular complex addition, multiplication, division, and conjugation.
- Convert between rectangular and polar form with `atan2` and trigonometric reconstruction.
- Verify Euler's formula and the unit magnitude of `exp(iθ)`.
- Compute a small DFT and recover its input with the inverse transform.
- Connect unit-magnitude complex multiplication to pairwise rotations in RoPE-like encodings.

## Build It

The implementation is a standard-library `Complex` class plus DFT helpers. Run the canonical demo:

```bash
cd phases/01-math-foundations/19-complex-numbers/code
python3 main.py
```

The arithmetic fixture uses `z1=3+2i` and `z2=1+4i`. `Complex.__mul__` implements `(a+bi)(c+di)=(ac-bd)+(ad+bc)i`; division multiplies by the conjugate and rejects a zero denominator. `to_polar` returns `(magnitude, phase)` and `from_polar` reconstructs the rectangular value.

`euler(theta)` returns `(cos(theta), sin(theta))`, so its magnitude is one. `roots_of_unity(4)` includes `1`, `i`, `-1`, and `-i`; their sum is approximately zero. `dft` uses the negative exponential sign and `idft` uses the positive sign plus `1/N` normalization.

## Use It

For `signal=[1,-2,0.5,3]`, `idft(dft(signal))` returns four `Complex` values whose imaginary parts are numerical noise near zero. The DFT in this lesson is intentionally direct `O(N²)` code; Lesson 20 adds the radix-2 FFT. `Complex(3,4) * euler(pi/2)` rotates the point to approximately `(-4,3)` without changing magnitude.

The same operation explains a RoPE pair: group two real coordinates as `z=x+iy` and multiply by a unit complex phase. The phase changes while `|z|` is preserved; the implementation does not claim to be a complete transformer positional-encoding layer.

## Ship It

The handoff is [the complex-arithmetic skill](../../19-complex-numbers/outputs/skill-complex-arithmetic.md). Record whether a task needs rectangular form (addition), polar form (rotation), roots of unity (DFT), or a conjugate (division), and include a reconstruction tolerance.

## Exercises

1. Compute `(2+3i)+(1-4i)` and `(2+3i)(1-2i)` with `Complex`; compare against hand expansion.
2. Convert `Complex(-2,3)` to polar form and back. Check both coordinates within `1e-10`.
3. Sum `roots_of_unity(8)` and verify both components are near zero.
4. Run `dft([1,-2,0.5,3])`, apply `idft`, and report the largest real reconstruction error.

## Reference Solution

The arithmetic results are `3-i` and `8-i`. Polar conversion preserves `(-2,3)` up to floating-point error. The eight roots sum to zero, and the DFT/IDFT round trip returns the four input samples with imaginary parts close to zero. Multiplication by `euler(pi/2)` preserves magnitude because the multiplier has unit magnitude.

## Tests

```bash
python3 -m unittest discover tests -v
```

Tests cover arithmetic, conjugate products, division reconstruction and zero rejection, polar round trips, Euler rotations, roots of unity, and the DFT/IDFT round trip.
