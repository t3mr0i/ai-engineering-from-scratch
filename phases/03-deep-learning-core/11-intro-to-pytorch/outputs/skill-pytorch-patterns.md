---
name: skill-pytorch-patterns
description: Reference patterns for the optional PyTorch path in this lesson
version: 1.0.0
phase: 03
lesson: 11
tags: [pytorch, training, tensors, patterns]
---

## Optional training loop

The lesson's canonical command is dependency-safe: if `torch` is unavailable it reports the fallback and exits 0. When it is installed, the bounded `train_demo` uses the same small fixture as the tests.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = Model().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.05)

for step in range(60):
    model.train()
    inputs, targets = fixture()
    inputs, targets = inputs.to(device), targets.to(device)
    optimizer.zero_grad()
    logits = model(inputs)
    loss = criterion(logits, targets)
    if not torch.isfinite(loss):
        raise RuntimeError("non-finite loss")
    loss.backward()
    optimizer.step()
```

## Device and evaluation boundary

```python
model.eval()
with torch.no_grad():
    logits = model(inputs)
    predictions = logits.argmax(dim=1)
```

`eval()` changes layers whose behavior depends on mode; `no_grad()` prevents an inference graph. This lesson does not promise a throughput or memory multiplier.

## Shape and target check

```python
inputs, targets = fixture()
assert inputs.shape == (4, 2)
assert targets.shape == (4,)
assert targets.dtype in (torch.int64, torch.long)
```

## Common mistakes checklist

1. Applying softmax before CrossEntropyLoss (it includes log_softmax internally).
2. Passing one-hot floating targets when class-index targets are required.
3. Forgetting to call `model.eval()` during validation.
4. Forgetting to move tensors to the same device as the model.
5. Omitting `optimizer.zero_grad()` and accidentally accumulating batch gradients.

If `torch_available()` is false, keep these patterns as review guidance and use the explicit fallback output; no dependency installation belongs in the canonical lesson run.
