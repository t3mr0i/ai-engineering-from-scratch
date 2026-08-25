# Optional PyTorch adapter for the hand-built framework's module/training contracts.
# Importing this file never imports or downloads PyTorch; availability is checked locally.
# When present, the demo trains a tiny tensor classifier on a fixed four-row fixture.
# See phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md.

from __future__ import annotations

import importlib.util
import math
from typing import Any


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def torch_available() -> bool:
    """Return whether an already installed torch distribution can be resolved."""
    return importlib.util.find_spec("torch") is not None


def _torch() -> Any:
    if not torch_available():
        raise RuntimeError("PyTorch is not installed; install it separately to run tensor examples")
    import torch

    return torch


def device_name() -> str:
    if not torch_available():
        return "unavailable"
    torch = _torch()
    return "cuda" if torch.cuda.is_available() else "cpu"


def build_model(input_features: int = 2, hidden_features: int = 4, classes: int = 2) -> Any:
    input_features = _positive_int(input_features, "input_features")
    hidden_features = _positive_int(hidden_features, "hidden_features")
    classes = _positive_int(classes, "classes")
    torch = _torch()
    return torch.nn.Sequential(
        torch.nn.Linear(input_features, hidden_features),
        torch.nn.Tanh(),
        torch.nn.Linear(hidden_features, classes),
    )


def fixture() -> tuple[Any, Any]:
    torch = _torch()
    x = torch.tensor(((0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0)), dtype=torch.float32)
    y = torch.tensor((0, 1, 1, 0), dtype=torch.long)
    return x, y


def train_demo(steps: int = 60, device: str | None = None) -> dict[str, object]:
    steps = _positive_int(steps, "steps")
    torch = _torch()
    torch.manual_seed(7)
    selected_device = device or device_name()
    model = build_model().to(selected_device)
    x, y = fixture()
    x, y = x.to(selected_device), y.to(selected_device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.SGD(model.parameters(), lr=0.2)
    losses: list[float] = []
    model.train()
    for _ in range(steps):
        optimizer.zero_grad(set_to_none=True)
        logits = model(x)
        loss = criterion(logits, y)
        if not math.isfinite(float(loss.item())):
            raise RuntimeError("torch loss became non-finite")
        loss.backward()
        optimizer.step()
        losses.append(float(loss.item()))
    model.eval()
    with torch.no_grad():
        logits = model(x)
        accuracy = float((logits.argmax(dim=1) == y).float().mean().item())
    return {"device": selected_device, "input_shape": tuple(x.shape), "losses": losses, "accuracy": accuracy}


def main() -> int:
    if not torch_available():
        print("PyTorch unavailable; optional tensor path was not executed.")
        print("The local contract remains import-safe and no package installation is attempted.")
        return 0
    summary = train_demo()
    print(f"torch device={summary['device']} input_shape={summary['input_shape']} accuracy={summary['accuracy']:.2f} loss={summary['losses'][-1]:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
