# The Fourier Transform

> Move a signal from samples to frequencies, then return to the samples without hiding the normalization.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 1, Lessons 01–04 and 19 (linear algebra, calculus, and complex numbers)
**Time:** ~90 minutes

## Learning Objectives

- Compute a direct DFT and its normalized inverse with the local `Complex` type.
- Explain why a sampled sine creates peaks at specific frequency bins.
- Compare the radix-2 `fft` with `dft` and use `ifft` for reconstruction.
- Apply Hann/Hamming windows and inspect a one-sided magnitude spectrum.
- Use zero-padded spectral multiplication to reproduce linear convolution.
- Relate sinusoidal positional encodings to frequency-indexed phases.

## Build It

Run the standard-library implementation:

```bash
cd phases/01-math-foundations/20-fourier-transform/code
python3 main.py
```

`dft` uses `exp(-2πikn/N)` and `idft` uses the opposite sign with `1/N`. `fft` recursively splits even and odd samples when `N` is even; for an odd length it deliberately falls back to `dft`. `power_spectrum` returns squared magnitudes and `spectral_analysis(signal, sample_rate)` returns frequencies and magnitudes for bins `0..N//2`.

The first demo generates a 32-sample, 32-Hz sine at 5 Hz, so its positive-frequency peak is bin `k=5` with magnitude near `N/2 = 16`. The multi-frequency fixture uses `N=64`, `sample_rate=64`, frequencies `[3,7,15]`, and amplitudes `[1.0,0.5,0.3]`; expected positive-bin magnitudes are approximately `[32,16,9.6]`.

## Use It

`convolve_fft(x,h)` pads both inputs to the next power of two, multiplies spectra pointwise, applies `ifft`, and trims to `len(x)+len(h)-1`. Compare it with `convolve_direct` on short arrays before trusting a longer signal. A window changes edge samples to reduce leakage; it also changes the measured amplitude, so keep the chosen window in the experiment record.

`positional_encoding(pos,d_model)` returns `d_model` values in alternating sine/cosine pairs. For `pos=0,d_model=4`, the output is `[0,1,0,1]`; later positions advance each pair at a different frequency. This is a local encoding fixture, not a complete transformer.

## Ship It

The handoff artifact is [the spectral-analyzer prompt](../../20-fourier-transform/outputs/prompt-spectral-analyzer.md). Store sample rate, sample count, window, transform convention, peak bins, and reconstruction error with any spectral result.

## Exercises

1. Run `generate_signal([5],[1.0],32,32)`, compute `dft`, and identify the largest magnitude in bins `0..16`.
2. Verify `max(abs(a.real-b)) < 1e-10` for `b=[1,-2,0.5,3]` after `idft(dft(b))`.
3. Compare `fft` and `dft` for an eight-sample signal and report the largest complex-component difference.
4. Compare `convolve_direct([1,2,3],[2,-1])` and `convolve_fft` and explain why padding avoids circular wraparound.

## Reference Solution

The 5-Hz sine peaks at bin 5 with magnitude about 16. The inverse transform reconstructs the four-sample fixture to floating-point tolerance, and radix-2 FFT agrees with the direct DFT for a power-of-two length. Both convolution paths return `[2,3,4,-3]`; the FFT path obtains that linear result by padding before multiplication.

## Tests

```bash
python3 -m unittest discover tests -v
```

Tests cover complex arithmetic, DFT/IDFT and FFT parity, spectral bins, windows, direct-versus-FFT convolution, positional-encoding shape, and the canonical demo.
