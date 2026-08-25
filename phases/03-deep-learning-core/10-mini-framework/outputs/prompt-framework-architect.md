---
name: prompt-framework-architect
description: Review a small neural-network framework by its module, parameter, gradient, mode, and data contracts
phase: 3
lesson: 10
---

# Framework review card

Describe the forward and reverse shape at every module. Count weights and biases from the actual fan-in/fan-out, and identify where each `Parameter.grad` is cleared. Test one train/eval transition for stochastic modules, one finite-difference gradient, and one final short batch from the loader. A framework is reusable only when malformed widths, pre-forward backward calls, empty data, invalid rates, and non-finite gradients fail explicitly. Keep the XOR result `[0,1,1,0]` as a local integration fixture, not a claim about arbitrary architectures.
