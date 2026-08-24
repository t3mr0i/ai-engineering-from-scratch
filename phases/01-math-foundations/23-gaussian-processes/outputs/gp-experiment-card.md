# Gaussian process experiment card

Record the kernel family, length scale, signal variance, observation noise, and any numerical jitter. Preserve posterior mean and variance on interpolation and extrapolation regions separately. Compare hyperparameters on training or validation evidence, then report calibration on an untouched region. A reusable result includes the exact input scale, the Cholesky condition failure policy, and one kernel-mismatch probe.
