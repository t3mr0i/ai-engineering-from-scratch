---
name: skill-cmer-monitor
description: Monitor high-confidence image-text pairs whose normalized similarity falls below a gate
version: 1.0.0
phase: 4
lesson: 25
tags: [vlm, embeddings, monitoring, routing]
---

# CMER Monitor

For each pair, log normalized cosine similarity, text confidence, and the two thresholds. Flag only
`confidence > conf_threshold` together with `similarity < sim_threshold`; report flagged pairs divided
by total pairs. CMER is a review-routing signal, not a calibrated probability or an automatic claim
that the generated text is false.
