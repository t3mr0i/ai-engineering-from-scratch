---
name: skill-svm-kernel-chooser
description: Choose a kernel and record a scratch SVM margin experiment
phase: 2
lesson: 5
tags: [svm, hinge-loss, kernels, margin]
---

# SVM kernel handoff

First record that labels are -1 and 1 and that features have compatible scales. Use a linear kernel when a hyperplane is a reasonable first explanation. Use the polynomial or RBF helper when a nonlinear similarity is a reasoned hypothesis, not as a default claim.

Record lr, lambda_param, n_epochs, kernel parameters, support-vector tolerance, margin_width, and validation accuracy. The scratch objective is average hinge loss plus 0.5*lambda_param*||w||²; it does not expose a C parameter. A point outside signed margin one contributes zero hinge loss.

Keep the kernel matrix symmetric and note its dimension. Reject empty or mismatched vectors and labels outside -1/1. The artifact documents a small experiment and does not establish deployment performance.
