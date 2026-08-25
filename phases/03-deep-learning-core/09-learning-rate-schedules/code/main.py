# Learning-rate schedules evaluated from explicit scalar formulas, stdlib only.
# Each schedule validates step counts and keeps endpoint semantics visible.
# train_quadratic is a deterministic fixture for comparing trajectories, not a benchmark.
# See phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md.

from __future__ import annotations

import math
import random
from typing import Callable, Sequence


Schedule = Callable[..., float]


def _nonnegative_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError(f"{name} must be a non-negative integer")
    return value


def _positive_int(value: int, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def _finite(value: float, name: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be finite") from exc
    if not math.isfinite(number):
        raise ValueError(f"{name} must be finite")
    return number


def _learning_rate(lr: float, name: str = "lr") -> float:
    value = _finite(lr, name)
    if value <= 0:
        raise ValueError(f"{name} must be positive")
    return value


def _step(step: int) -> int:
    return _nonnegative_int(step, "step")


def _bounds(lr: float, lr_min: float) -> tuple[float, float]:
    peak = _learning_rate(lr)
    floor = _finite(lr_min, "lr_min")
    if floor < 0 or floor > peak:
        raise ValueError("lr_min must be finite, non-negative, and no larger than lr")
    return peak, floor


def constant_schedule(step: int, lr: float = 0.01, **_: object) -> float:
    _step(step)
    return _learning_rate(lr)


def step_decay_schedule(step: int, lr: float = 0.1, step_size: int = 100, gamma: float = 0.1, **_: object) -> float:
    step = _step(step)
    lr = _learning_rate(lr)
    step_size = _positive_int(step_size, "step_size")
    gamma = _finite(gamma, "gamma")
    if not 0.0 <= gamma <= 1.0:
        raise ValueError("gamma must be in [0,1]")
    return lr * gamma ** (step // step_size)


def cosine_schedule(step: int, lr: float = 0.01, total_steps: int = 1000, lr_min: float = 1e-5, **_: object) -> float:
    step = _step(step)
    peak, floor = _bounds(lr, lr_min)
    total_steps = _positive_int(total_steps, "total_steps")
    if step >= total_steps:
        return floor
    progress = step / total_steps
    return floor + 0.5 * (peak - floor) * (1.0 + math.cos(math.pi * progress))


def warmup_cosine_schedule(
    step: int,
    lr: float = 0.01,
    total_steps: int = 1000,
    warmup_steps: int = 100,
    lr_min: float = 1e-5,
    **_: object,
) -> float:
    step = _step(step)
    peak, floor = _bounds(lr, lr_min)
    total_steps = _positive_int(total_steps, "total_steps")
    warmup_steps = _nonnegative_int(warmup_steps, "warmup_steps")
    if warmup_steps >= total_steps:
        raise ValueError("warmup_steps must be smaller than total_steps")
    if warmup_steps and step < warmup_steps:
        return peak * (step + 1) / warmup_steps
    if step >= total_steps:
        return floor
    progress = (step - warmup_steps) / (total_steps - warmup_steps)
    return floor + 0.5 * (peak - floor) * (1.0 + math.cos(math.pi * progress))


def one_cycle_schedule(
    step: int,
    lr: float = 0.01,
    total_steps: int = 1000,
    div_factor: float = 25.0,
    final_div_factor: float = 10000.0,
    **_: object,
) -> float:
    step = _step(step)
    peak = _learning_rate(lr)
    total_steps = _positive_int(total_steps, "total_steps")
    if total_steps < 3:
        raise ValueError("total_steps must be at least 3 for start, peak, and finish points")
    div_factor = _learning_rate(div_factor, "div_factor")
    final_div_factor = _learning_rate(final_div_factor, "final_div_factor")
    start = peak / div_factor
    finish = peak / final_div_factor
    if step >= total_steps:
        return finish
    half = max(1, total_steps // 2)
    if step <= half:
        progress = step / half
        return start + 0.5 * (peak - start) * (1.0 - math.cos(math.pi * progress))
    progress = (step - half) / max(1, total_steps - 1 - half)
    return finish + 0.5 * (peak - finish) * (1.0 + math.cos(math.pi * progress))


def schedule_values(schedule: Schedule, total_steps: int, **kwargs: object) -> list[float]:
    total_steps = _positive_int(total_steps, "total_steps")
    values = [float(schedule(step, total_steps=total_steps, **kwargs)) for step in range(total_steps)]
    if not all(math.isfinite(value) and value >= 0.0 for value in values):
        raise ValueError("schedule returned a non-finite or negative learning rate")
    return values


def make_circle_data(n: int = 40, seed: int = 42) -> list[tuple[tuple[float, float], int]]:
    n = _positive_int(n, "n")
    rng = random.Random(seed)
    data = []
    for _ in range(n):
        x, y = rng.uniform(-2.0, 2.0), rng.uniform(-2.0, 2.0)
        data.append(((x, y), int(x * x + y * y < 1.5)))
    return data


def train_quadratic(
    schedule: Schedule,
    steps: int = 40,
    start: float = 5.0,
    target: float = 1.5,
    base_lr: float = 0.1,
    **kwargs: object,
) -> dict[str, object]:
    steps = _positive_int(steps, "steps")
    parameter = _finite(start, "start")
    target = _finite(target, "target")
    base_lr = _learning_rate(base_lr)
    losses: list[float] = []
    rates: list[float] = []
    for step in range(steps):
        rate = float(schedule(step, lr=base_lr, total_steps=steps, **kwargs))
        if not math.isfinite(rate) or rate < 0.0:
            raise ValueError("schedule must return a finite non-negative rate")
        parameter -= rate * 2.0 * (parameter - target)
        loss = (parameter - target) ** 2
        losses.append(loss)
        rates.append(rate)
    return {"parameter": parameter, "losses": losses, "rates": rates}


def main() -> None:
    total_steps = 12
    schedules = (
        ("constant", constant_schedule, {}),
        ("step", step_decay_schedule, {"step_size": 4, "gamma": 0.5}),
        ("cosine", cosine_schedule, {"lr_min": 0.01}),
        ("warmup_cosine", warmup_cosine_schedule, {"warmup_steps": 3, "lr_min": 0.01}),
        ("one_cycle", one_cycle_schedule, {}),
    )
    for name, schedule, kwargs in schedules:
        values = schedule_values(schedule, total_steps, lr=0.1, **kwargs)
        result = train_quadratic(schedule, steps=total_steps, base_lr=0.1, **kwargs)
        print(f"{name:14s} step0={values[0]:.5f} final={values[-1]:.5f} loss={result['losses'][-1]:.6f}")


if __name__ == "__main__":
    main()
