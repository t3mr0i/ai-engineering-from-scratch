---
name: skill-anomaly-detector
description: Choose and review a point or multivariate anomaly detector
phase: 2
lesson: 16
---

# Anomaly Detector Review Card

Run python3 main.py from code/ and record the normal training window, detector
parameters, threshold, review capacity k, and operator action. The local fixture
make_anomaly_data(60, 6, 2, seed=7) has shape (66, 2); it is not a production
calibration set.

Use Z-score for transparent per-feature deviations, IQR for robust fences, and
IsolationForest for multivariate random partitions. Fit only on a period believed
to be normal. Use precision/recall/F1 or Precision@k on labels held out from fit;
do not use accuracy as the sole metric for rare alerts.

State whether the event is point, contextual, or collective. Add time/peer
features for contextual events and window features for sequences. Monitor score
drift and alert volume. A score is a screening signal, not a calibrated
probability or an automatic fraud decision.
