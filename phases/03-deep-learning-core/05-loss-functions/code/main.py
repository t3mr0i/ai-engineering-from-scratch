# Losses and their derivatives built from scalar Python operations.
# Probabilities, labels, class indices, and vector lengths are validated explicitly.
# The implementation uses stable log-sum-exp arithmetic for cross-entropy.
# See phases/03-deep-learning-core/05-loss-functions/docs/en.md for derivations.
# Stdlib only; no framework loss function is used in the demo.

from __future__ import annotations

import math
import random
from typing import Sequence


def _paired(predictions: Sequence[float], targets: Sequence[float]) -> tuple[list[float], list[float]]:
    try:
        prediction_count, target_count = len(predictions), len(targets)
    except TypeError as exc:
        raise ValueError("predictions and targets must be sequences") from exc
    if prediction_count == 0 or prediction_count != target_count:
        raise ValueError("predictions and targets must be nonempty and equally long")
    p, t = [float(value) for value in predictions], [float(value) for value in targets]
    if not all(math.isfinite(value) for value in (*p, *t)):
        raise ValueError("loss inputs must be finite")
    return p, t


def _positive_finite(value: float, name: str) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be positive and finite") from exc
    if not math.isfinite(numeric) or numeric <= 0:
        raise ValueError(f"{name} must be positive and finite")
    return numeric


def _probability_epsilon(value: float) -> float:
    epsilon = _positive_finite(value, "eps")
    if epsilon >= 0.5:
        raise ValueError("eps must be in (0, 0.5)")
    return epsilon


def mse(predictions: Sequence[float], targets: Sequence[float]) -> float:
    p, t = _paired(predictions, targets)
    return sum((a - b) ** 2 for a, b in zip(p, t)) / len(p)


def mse_gradient(predictions: Sequence[float], targets: Sequence[float]) -> list[float]:
    p, t = _paired(predictions, targets)
    return [2.0 * (a - b) / len(p) for a, b in zip(p, t)]


def binary_cross_entropy(predictions: Sequence[float], targets: Sequence[int], eps: float = 1e-15) -> float:
    try:
        raw_targets = list(targets)
    except TypeError as exc:
        raise ValueError("targets must be a sequence") from exc
    if any(type(value) not in (int, float) or not math.isfinite(float(value)) or value not in (0, 1) for value in raw_targets):
        raise ValueError("BCE targets must be numeric 0 or 1")
    p, t = _paired(predictions, raw_targets)
    eps = _probability_epsilon(eps)
    if any(value not in (0.0, 1.0) for value in t) or any(value < 0 or value > 1 for value in p):
        raise ValueError("BCE probabilities must be in [0,1] and targets must be 0 or 1")
    return sum(-(target * math.log(max(eps, min(1 - eps, probability))) + (1 - target) * math.log(max(eps, min(1 - eps, 1 - probability)))) for probability, target in zip(p, t)) / len(p)


def bce_gradient(predictions: Sequence[float], targets: Sequence[int], eps: float = 1e-15) -> list[float]:
    try:
        raw_targets = list(targets)
    except TypeError as exc:
        raise ValueError("targets must be a sequence") from exc
    if any(type(value) not in (int, float) or not math.isfinite(float(value)) or value not in (0, 1) for value in raw_targets):
        raise ValueError("BCE targets must be numeric 0 or 1")
    p, t = _paired(predictions, raw_targets)
    eps = _probability_epsilon(eps)
    if any(value not in (0.0, 1.0) for value in t) or any(value < 0 or value > 1 for value in p):
        raise ValueError("BCE probabilities must be in [0,1] and targets must be 0 or 1")
    return [(-(target / max(eps, min(1 - eps, probability))) + (1 - target) / max(eps, min(1 - eps, 1 - probability))) / len(p) for probability, target in zip(p, t)]


def _logits(logits: Sequence[float]) -> list[float]:
    try:
        values = [float(logit) for logit in logits]
    except (TypeError, ValueError) as exc:
        raise ValueError("logits must be a nonempty sequence of numbers") from exc
    if not values or not all(math.isfinite(value) for value in values):
        raise ValueError("logits must be a nonempty finite sequence")
    return values


def _class_index(logits: Sequence[float], target_index: int) -> tuple[list[float], int]:
    values = _logits(logits)
    if isinstance(target_index, bool) or not isinstance(target_index, int) or not 0 <= target_index < len(values):
        raise ValueError("target_index must be an integer inside the logits")
    return values, target_index


def softmax(logits: Sequence[float]) -> list[float]:
    values = _logits(logits)
    maximum = max(values)
    exponentials = [math.exp(value - maximum) for value in values]
    total = sum(exponentials)
    return [value / total for value in exponentials]


def categorical_cross_entropy(logits: Sequence[float], target_index: int, eps: float = 1e-15) -> float:
    values, target_index = _class_index(logits, target_index)
    eps = _probability_epsilon(eps)
    return -math.log(max(eps, softmax(values)[target_index]))


def cce_gradient(logits: Sequence[float], target_index: int) -> list[float]:
    values, target_index = _class_index(logits, target_index)
    result = softmax(values)
    result[target_index] -= 1.0
    return result


def label_smoothed_cce(logits: Sequence[float], target_index: int, num_classes: int, alpha: float = 0.1, eps: float = 1e-15) -> float:
    values, target_index = _class_index(logits, target_index)
    try:
        alpha = float(alpha)
    except (TypeError, ValueError) as exc:
        raise ValueError("alpha must be finite and in [0,1)") from exc
    if len(values) != num_classes or isinstance(num_classes, bool) or not isinstance(num_classes, int) or num_classes < 2 or not math.isfinite(alpha) or not 0 <= alpha < 1:
        raise ValueError("invalid class count, target index, or smoothing alpha")
    eps = _probability_epsilon(eps)
    probabilities = softmax(values)
    target = [
        (1.0 - alpha + alpha / num_classes) if index == target_index else alpha / num_classes
        for index in range(num_classes)
    ]
    return -sum(weight * math.log(max(eps, probability)) for weight, probability in zip(target, probabilities))


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    if not a or len(a) != len(b):
        raise ValueError("cosine vectors must be nonempty and equally long")
    values_a, values_b = [float(value) for value in a], [float(value) for value in b]
    if not all(math.isfinite(value) for value in (*values_a, *values_b)):
        raise ValueError("cosine vectors must be finite")
    norm_a = math.sqrt(sum(value ** 2 for value in values_a))
    norm_b = math.sqrt(sum(value ** 2 for value in values_b))
    if norm_a == 0 or norm_b == 0:
        raise ValueError("cosine vectors must have nonzero norm")
    return sum(x * y for x, y in zip(values_a, values_b)) / (norm_a * norm_b)


def contrastive_loss(anchor: Sequence[float], positive: Sequence[float], negatives: Sequence[Sequence[float]], temperature: float = 0.07) -> float:
    temperature = _positive_finite(temperature, "temperature")
    if not negatives:
        raise ValueError("temperature must be positive and negatives nonempty")
    scores = [cosine_similarity(anchor, positive), *(cosine_similarity(anchor, negative) for negative in negatives)]
    shifted = [score / temperature for score in scores]
    maximum = max(shifted)
    return -(shifted[0] - maximum - math.log(sum(math.exp(value - maximum) for value in shifted)))


def sigmoid(x: float) -> float:
    if x >= 0:
        e = math.exp(-x)
        return 1 / (1 + e)
    e = math.exp(x)
    return e / (1 + e)


def make_circle_data(n: int = 100, seed: int = 0) -> list[tuple[list[float], int]]:
    if n <= 0:
        raise ValueError("n must be positive")
    rng = random.Random(seed)
    return [
        ([x, y], int(x * x + y * y < 1.0))
        for x, y in ((rng.uniform(-1.5, 1.5), rng.uniform(-1.5, 1.5)) for _ in range(n))
    ]


class LossComparisonNetwork:
    """A tiny logistic model for comparing loss values, not a production trainer."""

    def __init__(self, lr: float = 0.1) -> None:
        self.lr = _positive_finite(lr, "lr")
        self.weights = [0.0, 0.0]
        self.bias = 0.0

    def fit(self, data: Sequence[tuple[Sequence[float], int]], epochs: int = 20) -> list[float]:
        if not data or epochs <= 0:
            raise ValueError("data must be nonempty and epochs positive")
        losses = []
        for _ in range(epochs):
            probabilities, targets = [], []
            for x, y in data:
                if len(x) != 2 or y not in (0, 1):
                    raise ValueError("data requires two features and binary labels")
                probability = sigmoid(sum(weight * value for weight, value in zip(self.weights, x)) + self.bias)
                probabilities.append(probability)
                targets.append(y)
                error = probability - y
                self.weights = [weight - self.lr * error * value for weight, value in zip(self.weights, x)]
                self.bias -= self.lr * error
            losses.append(binary_cross_entropy(probabilities, targets))
        return losses


def main() -> None:
    print(f"mse([1,3],[0,2])={mse([1, 3], [0, 2]):.3f}")
    print(f"bce([0.9],[1])={binary_cross_entropy([0.9], [1]):.4f}")
    probabilities = softmax((0.0, 1.0, 2.0))
    print(f"softmax([0,1,2])={[round(value, 4) for value in probabilities]}")
    print(f"smoothed CCE={label_smoothed_cce((0.0, 1.0, 2.0), 2, 3):.4f}")
    print(f"contrastive loss={contrastive_loss((1.0, 0.0), (1.0, 0.0), ((0.0, 1.0),)):.4f}")


if __name__ == "__main__":
    main()
