# Optimizers

> Gradient descent tells you which direction to move. It says nothing about how far or how fast. SGD is a compass. Adam is GPS with traffic data.

**Type:** Build
**Languages:** Python
**Prerequisites:** Lesson 03.05 (Loss Functions)
**Time:** ~75 minutes

## Learning Objectives

- Implement SGD, SGD with momentum, Adam, and AdamW optimizers from scratch in Python
- Explain how Adam's bias correction compensates for zero-initialized moment estimates in early training steps
- Demonstrate why AdamW produces better generalization than Adam with L2 regularization on the same task
- Select the appropriate optimizer and default hyperparameters for transformers, CNNs, GANs, and fine-tuning

## The Problem

You computed the gradients. You know that weight #4,721 should decrease by 0.003 to reduce the loss. But 0.003 in what units? Scaled by what? And should you move the same amount on step 1 as on step 1,000?

Vanilla gradient descent applies the same learning rate to every parameter on every step: w = w - lr * gradient. This creates three problems that make training neural networks painful in practice.

First, oscillation. The loss landscape is rarely shaped like a smooth bowl. It's more like a long, narrow valley. The gradient points across the valley (steep direction), not along it (shallow direction). Gradient descent bounces back and forth across the narrow dimension while making tiny progress along the useful one. You've seen this: loss drops fast then plateaus, not because the model converged but because it's oscillating.

Second, one learning rate for all parameters is wrong. Some weights need large updates (they're in the early, underfitting stage). Others need tiny updates (they're near their optimal value). A learning rate that works for the former destroys the latter, and vice versa.

Third, saddle points. In high dimensions, the loss landscape has vast flat regions where the gradient is near zero. Vanilla SGD crawls through these at the speed of the gradient, which is effectively zero. The model looks stuck. It isn't stuck -- it's in a flat region with useful descent on the other side. But SGD has no mechanism to push through.

Adam solves all three. It maintains two running averages per parameter -- the mean gradient (momentum, handles oscillation) and the mean squared gradient (adaptive rate, handles different scales). Combined with bias correction for the first few steps, it gives you a single optimizer that works on 80% of problems with default hyperparameters. This lesson builds it from scratch so you understand exactly when and why it fails on the other 20%.

## The Concept

### Stochastic Gradient Descent (SGD)

The simplest optimizer. Compute the gradient on a mini-batch and step in the opposite direction.

```
w = w - lr * gradient
```

The "stochastic" means you use a random subset (mini-batch) of data to estimate the gradient, rather than the full dataset. This noise is actually useful -- it helps escape sharp local minima. But the noise also causes oscillation.

Learning rate is the only knob. Too high: the loss diverges. Too low: training takes forever. The optimal value depends on the architecture, the data, the batch size, and the current stage of training. For vanilla SGD on modern networks, typical values range from 0.01 to 0.1. But even within a single training run, the ideal learning rate changes.

### Momentum

The ball-rolling-downhill analogy is overused but accurate. Instead of stepping by the gradient alone, you maintain a velocity that accumulates past gradients.

```
m_t = beta * m_{t-1} + gradient
w = w - lr * m_t
```

Beta (typically 0.9) controls how much history to keep. With beta = 0.9, the momentum is roughly the average of the last 10 gradients (1 / (1 - 0.9) = 10).

Why this fixes oscillation: gradients that point in the same direction accumulate. Gradients that flip direction cancel out. In that narrow valley, the "across" component flips sign each step and gets dampened. The "along" component stays consistent and gets amplified. The result is smooth acceleration in the useful direction.

Real numbers: SGD alone on a badly conditioned loss landscape might take 10,000 steps. SGD with momentum (beta=0.9) typically takes 3,000-5,000 steps on the same problem. The speedup is not marginal.

### RMSProp

The first per-parameter adaptive learning rate method that actually worked. Proposed by Hinton in a Coursera lecture (never formally published).

```
s_t = beta * s_{t-1} + (1 - beta) * gradient^2
w = w - lr * gradient / (sqrt(s_t) + epsilon)
```

s_t tracks the running average of squared gradients. Parameters with consistently large gradients get divided by a large number (smaller effective learning rate). Parameters with small gradients get divided by a small number (larger effective learning rate).

This solves the "one learning rate for all parameters" problem. A weight that's already been getting large updates is probably near its target -- slow it down. A weight that's been getting tiny updates might be undertrained -- speed it up.

Epsilon (typically 1e-8) prevents division by zero when a parameter hasn't been updated.

### Adam: Momentum + RMSProp

Adam combines both ideas. It maintains two exponential moving averages per parameter:

```
m_t = beta1 * m_{t-1} + (1 - beta1) * gradient        (first moment: mean)
v_t = beta2 * v_{t-1} + (1 - beta2) * gradient^2       (second moment: variance)
```

**Bias correction** is the key detail most explanations skip. At step 1, m_1 = (1 - beta1) * gradient. With beta1 = 0.9, that's 0.1 * gradient -- ten times too small. The moving average hasn't warmed up yet. Bias correction compensates:

```
m_hat = m_t / (1 - beta1^t)
v_hat = v_t / (1 - beta2^t)
```

At step 1 with beta1 = 0.9: m_hat = m_1 / (1 - 0.9) = m_1 / 0.1 = the actual gradient. At step 100: (1 - 0.9^100) is approximately 1.0, so the correction vanishes. Bias correction matters for the first ~10 steps and is irrelevant after ~50.

The update:

```
w = w - lr * m_hat / (sqrt(v_hat) + epsilon)
```

Adam defaults: lr = 0.001, beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8. These defaults work for 80% of problems. When they don't, change lr first. Then beta2. Almost never change beta1 or epsilon.

### AdamW: Weight Decay Done Right

L2 regularization adds lambda * w^2 to the loss. In vanilla SGD, this is equivalent to weight decay (subtracting lambda * w from the weight at each step). In Adam, this equivalence breaks.

The Loshchilov & Hutter insight: when you add L2 to the loss and then Adam processes the gradient, the adaptive learning rate scales the regularization term too. Parameters with large gradient variance get less regularization. Parameters with small variance get more. This is not what you want -- you want uniform regularization regardless of the gradient statistics.

AdamW fixes this by applying weight decay directly to the weights, after the Adam update:

```
w = w - lr * m_hat / (sqrt(v_hat) + epsilon) - lr * lambda * w
```

The weight decay term (lr * lambda * w) is not scaled by Adam's adaptive factor. Every parameter gets the same proportional shrinkage.

This seems like a minor detail. It's not. AdamW converges to better solutions than Adam + L2 regularization on virtually every task. It's the default optimizer in PyTorch for training transformers, diffusion models, and most modern architectures. BERT, GPT, LLaMA, Stable Diffusion -- all trained with AdamW.

### Learning Rate: The Most Important Hyperparameter

```mermaid
graph TD
    LR["Learning Rate"] --> TooHigh["Too high (lr > 0.01)"]
    LR --> JustRight["Just right"]
    LR --> TooLow["Too low (lr < 0.00001)"]

    TooHigh --> Diverge["Loss explodes<br/>NaN weights<br/>Training crashes"]
    JustRight --> Converge["Loss decreases steadily<br/>Reaches good minimum<br/>Generalizes well"]
    TooLow --> Stall["Loss decreases slowly<br/>Gets stuck in suboptimal minimum<br/>Wastes compute"]

    JustRight --> Schedule["Usually needs scheduling"]
    Schedule --> Warmup["Warmup: ramp from 0 to max<br/>First 1-10% of training"]
    Schedule --> Decay["Decay: reduce over time<br/>Cosine or linear"]
```

If you tune one hyperparameter, tune the learning rate. A 10x change in learning rate matters more than any architectural decision you'll make. Common defaults:

- SGD: lr = 0.01 to 0.1
- Adam/AdamW: lr = 1e-4 to 3e-4
- Fine-tuning pretrained models: lr = 1e-5 to 5e-5
- Learning rate warmup: linear ramp over first 1-10% of steps

### Optimizer Comparison

```mermaid
flowchart LR
    subgraph "Optimization Path"
        SGD_P["SGD<br/>Oscillates across valley<br/>Slow but finds flat minima"]
        Mom_P["SGD + Momentum<br/>Smoother path<br/>3x faster than SGD"]
        Adam_P["Adam<br/>Adapts per-parameter<br/>Fast convergence"]
        AdamW_P["AdamW<br/>Adam + proper decay<br/>Best generalization"]
    end
    SGD_P --> Mom_P --> Adam_P --> AdamW_P
```

### When Each Optimizer Wins

```mermaid
flowchart TD
    Task["What are you training?"] --> Type{"Model type?"}

    Type -->|"Transformer / LLM"| AdamW["AdamW<br/>lr=1e-4, wd=0.01-0.1"]
    Type -->|"CNN / ResNet"| SGD_M["SGD + Momentum<br/>lr=0.1, momentum=0.9"]
    Type -->|"GAN"| Adam2["Adam<br/>lr=2e-4, beta1=0.5"]
    Type -->|"Fine-tuning"| AdamW2["AdamW<br/>lr=2e-5, wd=0.01"]
    Type -->|"Don't know yet"| Default["Start with AdamW<br/>lr=3e-4, wd=0.01"]
```


## Use It

PyTorch optimizers handle parameter groups, gradient clipping, and learning rate scheduling:

```python
import torch
import torch.optim as optim

model = torch.nn.Sequential(
    torch.nn.Linear(784, 256),
    torch.nn.ReLU(),
    torch.nn.Linear(256, 10),
)

optimizer = optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)

scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=100)

for epoch in range(100):
    optimizer.zero_grad()
    output = model(torch.randn(32, 784))
    loss = torch.nn.functional.cross_entropy(output, torch.randint(0, 10, (32,)))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
    optimizer.step()
    scheduler.step()
```

The pattern is always: zero_grad, forward, loss, backward, (clip), step, (schedule). Memorize this order. Getting it wrong (e.g., calling scheduler.step() before optimizer.step()) is a common source of subtle bugs.

For CNNs, many practitioners still prefer SGD + momentum (lr=0.1, momentum=0.9, weight_decay=1e-4) with a step or cosine schedule. SGD finds flatter minima, which often generalize better. For transformers and LLMs, AdamW with warmup + cosine decay is the universal default. Don't fight the consensus without a measured reason.

## Ship It

This lesson produces:
- `outputs/prompt-optimizer-selector.md` -- a decision prompt for choosing the right optimizer and learning rate for any architecture


## Key Terms

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Learning rate | "Step size" | The scalar multiplier on the gradient update; the single most impactful hyperparameter in training |
| SGD | "Basic gradient descent" | Stochastic gradient descent: update weights by subtracting lr * gradient, computed on a mini-batch |
| Momentum | "Rolling ball analogy" | Exponential moving average of past gradients; dampens oscillation and accelerates consistent directions |
| RMSProp | "Adaptive learning rate" | Divides each parameter's gradient by the running RMS of its recent gradients; equalizes learning rates |
| Adam | "The default optimizer" | Combines momentum (first moment) and RMSProp (second moment) with bias correction for the initial steps |
| AdamW | "Adam done right" | Adam with decoupled weight decay; applies regularization directly to weights rather than through the gradient |
| Bias correction | "Warmup for running averages" | Dividing by (1 - beta^t) to compensate for the zero-initialization of Adam's moment estimates |
| Weight decay | "Shrink the weights" | Subtracting a fraction of the weight value at each step; a regularizer that penalizes large weights |
| Learning rate schedule | "Changing lr over time" | A function that adjusts the learning rate during training; warmup + cosine decay is the modern default |
| Gradient clipping | "Capping the gradient norm" | Scaling down the gradient vector when its norm exceeds a threshold; prevents exploding gradient updates |

## Further Reading

- Kingma & Ba, "Adam: A Method for Stochastic Optimization" (2014) -- the original Adam paper with convergence analysis and the bias correction derivation
- Loshchilov & Hutter, "Decoupled Weight Decay Regularization" (2017) -- proved that L2 regularization and weight decay are not equivalent in Adam, and proposed AdamW
- Smith, "Cyclical Learning Rates for Training Neural Networks" (2017) -- introduced the LR range test and cyclical schedules that remove the need to tune a fixed learning rate
- Ruder, "An Overview of Gradient Descent Optimization Algorithms" (2016) -- the best single survey of all optimizer variants, with clear comparisons and intuitions
