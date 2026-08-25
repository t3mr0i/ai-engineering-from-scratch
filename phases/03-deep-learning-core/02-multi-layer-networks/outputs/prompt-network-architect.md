---
name: prompt-network-architect
description: Audit dense-layer shapes and parameter counts for a small network design
phase: 3
lesson: 2
---

# Dense architecture audit

Given a sequence of widths, compute each layer's `(inputs * neurons) + neurons` contribution and check that adjacent widths match. For example, `2-3-1` has `9 + 4 = 13` parameters; `784-256-128-10` has `235146`.

For a local XOR check, use `Network(xor_network().layers)` and report the four thresholded classes `[0, 1, 1, 0]`. State the exact input width and whether the output is a sigmoid probability or a thresholded class. Reject malformed matrices instead of padding or truncating vectors. These counts and outputs describe this lesson's hand-tuned fixture, not an architecture recommendation for a production workload.
