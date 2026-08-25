# OCR & Document Understanding.
# Canonical PyTorch/NumPy fixture for phases/04-computer-vision/19-ocr-document-understanding/docs/en.md.
# It demonstrates CTC lengths, blank/repeat collapsing, and a tiny line recognizer offline.
# Production OCR, layout, and field extraction are separate contracts from this recognizer.

from __future__ import annotations

import math
from numbers import Integral, Real

import numpy as np
try:
    import torch
    import torch.nn.functional as F
    from torch import nn
    TORCH_AVAILABLE = True
except ModuleNotFoundError:  # The canonical command reports the optional dependency instead of crashing.
    torch = None  # type: ignore[assignment]
    F = None  # type: ignore[assignment]
    TORCH_AVAILABLE = False

    class _UnavailableModule:
        pass

    class _UnavailableNN:
        Module = _UnavailableModule

    nn = _UnavailableNN()  # type: ignore[assignment]


def _require_torch() -> None:
    if not TORCH_AVAILABLE:
        raise RuntimeError("PyTorch is unavailable; install the allowlisted optional dependency to run this fixture")


VOCAB = ["_"] + list("0123456789abcdefghijklmnopqrstuvwxyz")


def _positive_int(name: str, value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, Integral) or int(value) < 1:
        raise ValueError(f"{name} must be a positive integer")
    return int(value)


def numpy_ctc_greedy_decode(log_probs: np.ndarray, blank: int = 0) -> list[list[int]]:
    """Collapse the best path from a NumPy ``(T,N,V)`` log-probability tensor."""
    if not isinstance(log_probs, np.ndarray) or log_probs.ndim != 3 or min(log_probs.shape) < 1 or not np.isfinite(log_probs).all():
        raise ValueError("log_probs must be a non-empty finite (T,N,V) array")
    if isinstance(blank, bool) or not isinstance(blank, Integral) or not 0 <= int(blank) < log_probs.shape[-1]:
        raise ValueError("blank must be a valid vocabulary index")
    predictions = log_probs.argmax(axis=-1).transpose(1, 0)
    decoded_batch: list[list[int]] = []
    for sequence in predictions:
        decoded: list[int] = []
        previous: int | None = None
        for index in sequence.tolist():
            if index != previous and index != int(blank):
                decoded.append(int(index))
            previous = int(index)
        decoded_batch.append(decoded)
    return decoded_batch


def _numpy_logaddexp(values: list[float]) -> float:
    result = float(values[0])
    for value in values[1:]:
        result = float(np.logaddexp(result, float(value)))
    return result


def numpy_ctc_loss(
    log_probs: np.ndarray,
    targets: np.ndarray,
    input_lengths: np.ndarray,
    target_lengths: np.ndarray,
    blank: int = 0,
) -> float:
    """Compute a small log-space CTC forward DP, rejecting impossible alignments."""
    if not isinstance(log_probs, np.ndarray) or log_probs.ndim != 3 or min(log_probs.shape) < 1 or not np.isfinite(log_probs).all():
        raise ValueError("log_probs must be a non-empty finite (T,N,V) array")
    time_steps, batch, vocab_size = log_probs.shape
    if isinstance(blank, bool) or not isinstance(blank, Integral) or not 0 <= int(blank) < vocab_size:
        raise ValueError("blank must be a valid vocabulary index")
    targets = np.asarray(targets)
    input_lengths = np.asarray(input_lengths)
    target_lengths = np.asarray(target_lengths)
    if targets.ndim != 1 or targets.dtype.kind not in "iu":
        raise ValueError("targets must be a one-dimensional integer array")
    if input_lengths.shape != (batch,) or target_lengths.shape != (batch,) or input_lengths.dtype.kind not in "iu" or target_lengths.dtype.kind not in "iu":
        raise ValueError("length arrays must be integer vectors of length N")
    if targets.size and (targets.min() < 0 or targets.max() >= vocab_size or np.any(targets == int(blank))):
        raise ValueError("targets must contain non-blank vocabulary IDs")
    if np.any(input_lengths < 1) or np.any(input_lengths > time_steps) or np.any(target_lengths < 0) or int(target_lengths.sum()) != targets.size:
        raise ValueError("CTC lengths are inconsistent with the log-probability and target arrays")

    losses: list[float] = []
    offset = 0
    for sample in range(batch):
        target_length = int(target_lengths[sample])
        target = targets[offset : offset + target_length].astype(np.int64, copy=False)
        offset += target_length
        adjacent_repeats = int(np.sum(target[:-1] == target[1:])) if target_length > 1 else 0
        minimum_timesteps = target_length + adjacent_repeats
        length = int(input_lengths[sample])
        if length < minimum_timesteps:
            raise ValueError("input_length is too short for the target's CTC alignment")
        extended = np.full(2 * target_length + 1, int(blank), dtype=np.int64)
        extended[1::2] = target
        alpha = np.full((length, len(extended)), -np.inf, dtype=np.float64)
        alpha[0, 0] = log_probs[0, sample, int(blank)]
        if len(extended) > 1:
            alpha[0, 1] = log_probs[0, sample, int(target[0])]
        for step in range(1, length):
            for state, label in enumerate(extended):
                previous = [alpha[step - 1, state]]
                if state > 0:
                    previous.append(alpha[step - 1, state - 1])
                if state > 1 and label != int(blank) and label != extended[state - 2]:
                    previous.append(alpha[step - 1, state - 2])
                alpha[step, state] = _numpy_logaddexp(previous) + log_probs[step, sample, int(label)]
        final = [alpha[-1, -1]]
        if len(extended) > 1:
            final.append(alpha[-1, -2])
        log_likelihood = _numpy_logaddexp(final)
        if not np.isfinite(log_likelihood):
            raise ValueError("CTC alignment has no finite path")
        losses.append(-log_likelihood)
    return float(np.mean(losses))


def numpy_build_batch(strings: list[str], max_len: int | None = None) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Build local grayscale lines and flattened CTC targets without Torch."""
    if not isinstance(strings, list) or not strings or any(not isinstance(text, str) or not text for text in strings):
        raise ValueError("strings must be a non-empty list of non-empty strings")
    if any(any(character not in VOCAB[1:] for character in text) for text in strings):
        raise ValueError("strings contain a character outside VOCAB")
    longest = max(len(text) for text in strings)
    if max_len is None:
        max_len = longest
    else:
        max_len = _positive_int("max_len", max_len)
        if max_len < longest:
            raise ValueError("max_len cannot be shorter than the longest string")
    images = np.ones((len(strings), 1, 32, 16 * int(max_len)), dtype=np.float32)
    targets: list[int] = []
    lengths: list[int] = []
    for row, text in enumerate(strings):
        line = synthetic_line(text, height=32, char_width=16)
        images[row, 0, :, : line.shape[1]] = line
        targets.extend(VOCAB.index(character) for character in text)
        lengths.append(len(text))
    return images, np.asarray(targets, dtype=np.int64), np.asarray(lengths, dtype=np.int64)


def ctc_loss(log_probs: torch.Tensor, targets: torch.Tensor, input_lengths: torch.Tensor, target_lengths: torch.Tensor, blank: int = 0) -> torch.Tensor:
    """Validate and compute PyTorch CTC loss for flattened targets."""
    _require_torch()
    if not isinstance(log_probs, torch.Tensor) or log_probs.ndim != 3:
        raise ValueError("log_probs must have shape (T,N,V)")
    time_steps, batch, vocab_size = log_probs.shape
    if min(time_steps, batch, vocab_size) < 1 or not torch.isfinite(log_probs).all():
        raise ValueError("log_probs must be non-empty and finite")
    if isinstance(blank, bool) or not isinstance(blank, Integral) or not 0 <= int(blank) < vocab_size:
        raise ValueError("blank must be a valid vocabulary index")
    if not isinstance(targets, torch.Tensor) or targets.ndim != 1 or targets.dtype not in (torch.int32, torch.int64):
        raise ValueError("targets must be a one-dimensional integer tensor")
    if targets.numel() and (targets.min() < 0 or targets.max() >= vocab_size or (targets == int(blank)).any()):
        raise ValueError("targets must contain non-blank vocabulary IDs")
    if not isinstance(input_lengths, torch.Tensor) or input_lengths.ndim != 1 or input_lengths.shape[0] != batch or input_lengths.dtype not in (torch.int32, torch.int64):
        raise ValueError("input_lengths must be an integer vector of length N")
    if not isinstance(target_lengths, torch.Tensor) or target_lengths.ndim != 1 or target_lengths.shape[0] != batch or target_lengths.dtype not in (torch.int32, torch.int64):
        raise ValueError("target_lengths must be an integer vector of length N")
    if (input_lengths < 1).any() or (input_lengths > time_steps).any() or (target_lengths < 0).any() or target_lengths.sum() != targets.numel():
        raise ValueError("CTC lengths are inconsistent with the log-probability and target tensors")
    offset = 0
    for length, target_length in zip(input_lengths.tolist(), target_lengths.tolist()):
        target = targets[offset : offset + int(target_length)]
        offset += int(target_length)
        adjacent_repeats = int((target[:-1] == target[1:]).sum()) if int(target_length) > 1 else 0
        if int(length) < int(target_length) + adjacent_repeats:
            raise ValueError("input_length is too short for the target's CTC alignment")
    return F.ctc_loss(log_probs, targets, input_lengths, target_lengths, blank=int(blank), reduction="mean", zero_infinity=True)


def greedy_ctc_decode(log_probs: torch.Tensor, blank: int = 0) -> list[list[int]]:
    _require_torch()
    if not isinstance(log_probs, torch.Tensor) or log_probs.ndim != 3 or min(log_probs.shape) < 1 or not torch.isfinite(log_probs).all():
        raise ValueError("log_probs must be a non-empty finite (T,N,V) tensor")
    if isinstance(blank, bool) or not isinstance(blank, Integral) or not 0 <= int(blank) < log_probs.shape[-1]:
        raise ValueError("blank must be a valid vocabulary index")
    predictions = log_probs.argmax(dim=-1).transpose(0, 1).cpu().tolist()
    decoded_batch: list[list[int]] = []
    for sequence in predictions:
        decoded: list[int] = []
        previous: int | None = None
        for index in sequence:
            if index != previous and index != int(blank):
                decoded.append(index)
            previous = index
        decoded_batch.append(decoded)
    return decoded_batch


class TinyCRNN(nn.Module):
    def __init__(self, vocab_size: int = len(VOCAB), hidden: int = 64, feat: int = 16) -> None:
        super().__init__()
        _require_torch()
        self.vocab_size = _positive_int("vocab_size", vocab_size)
        self.hidden = _positive_int("hidden", hidden)
        self.feat = _positive_int("feat", feat)
        self.cnn = nn.Sequential(
            nn.Conv2d(1, self.feat, 3, 1, 1), nn.BatchNorm2d(self.feat), nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(self.feat, self.feat * 2, 3, 1, 1), nn.BatchNorm2d(self.feat * 2), nn.ReLU(inplace=True), nn.MaxPool2d(2),
            nn.Conv2d(self.feat * 2, self.feat * 4, 3, 1, 1), nn.BatchNorm2d(self.feat * 4), nn.ReLU(inplace=True), nn.MaxPool2d((2, 1)),
            nn.Conv2d(self.feat * 4, self.feat * 4, 3, 1, 1), nn.BatchNorm2d(self.feat * 4), nn.ReLU(inplace=True), nn.MaxPool2d((2, 1)),
        )
        self.rnn = nn.LSTM(self.feat * 4, self.hidden, bidirectional=True, batch_first=True)
        self.head = nn.Linear(self.hidden * 2, self.vocab_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if not isinstance(x, torch.Tensor) or x.ndim != 4 or x.shape[1] != 1 or x.shape[0] < 1 or x.shape[2] < 16 or x.shape[3] < 16:
            raise ValueError("TinyCRNN expects a non-empty (N,1,H,W) input with H,W >= 16")
        if not torch.isfinite(x).all():
            raise ValueError("TinyCRNN input must be finite")
        features = self.cnn(x)
        sequence = features.mean(dim=2).transpose(1, 2)
        recurrent, _ = self.rnn(sequence)
        return F.log_softmax(self.head(recurrent).transpose(0, 1), dim=-1)


def synthetic_line(text: str, height: int = 32, char_width: int = 16) -> np.ndarray:
    if not isinstance(text, str) or not text or any(character not in VOCAB[1:] for character in text):
        raise ValueError("text must be a non-empty string made of VOCAB characters")
    height = _positive_int("height", height)
    char_width = _positive_int("char_width", char_width)
    if height < 16 or char_width < 4:
        raise ValueError("height must be >=16 and char_width >=4")
    image = np.ones((height, char_width * len(text)), dtype=np.float32)
    for index, character in enumerate(text):
        x = index * char_width
        shade = 0.0 if character.isalnum() else 0.5
        image[height // 5 : height - height // 5, x + 2 : x + char_width - 2] = shade
    return image


def build_batch(strings: list[str], max_len: int | None = None) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    _require_torch()
    if not isinstance(strings, list) or not strings or any(not isinstance(text, str) or not text for text in strings):
        raise ValueError("strings must be a non-empty list of non-empty strings")
    if any(any(character not in VOCAB[1:] for character in text) for text in strings):
        raise ValueError("strings contain a character outside VOCAB")
    longest = max(len(text) for text in strings)
    if max_len is None:
        max_len = longest
    else:
        max_len = _positive_int("max_len", max_len)
        if max_len < longest:
            raise ValueError("max_len cannot be shorter than the longest string")
    height, width = 32, 16 * max_len
    images = np.ones((len(strings), 1, height, width), dtype=np.float32)
    targets: list[int] = []
    lengths: list[int] = []
    for row, text in enumerate(strings):
        line = synthetic_line(text, height=height, char_width=16)
        images[row, 0, :, : line.shape[1]] = line
        targets.extend(VOCAB.index(character) for character in text)
        lengths.append(len(text))
    return torch.from_numpy(images), torch.tensor(targets, dtype=torch.long), torch.tensor(lengths, dtype=torch.long)


def decode_to_str(ids: list[int]) -> str:
    if not isinstance(ids, list) or any(isinstance(index, bool) or not isinstance(index, Integral) or not 0 <= int(index) < len(VOCAB) or int(index) == 0 for index in ids):
        raise ValueError("ids must contain non-blank VOCAB indices")
    return "".join(VOCAB[int(index)] for index in ids)


def main() -> None:
    ids = [0, 11, 11, 0, 12, 0]
    scores = np.full((len(ids), 1, len(VOCAB)), -6.0, dtype=np.float64)
    for step, index in enumerate(ids):
        scores[step, 0, index] = 0.0
    scores -= np.log(np.exp(scores).sum(axis=-1, keepdims=True))
    target = np.asarray([11, 12], dtype=np.int64)
    lengths = np.asarray([len(ids)], dtype=np.int64)
    build_images, _, _ = numpy_build_batch(["abc", "xy"], max_len=3)
    print(
        f"[NumPy Build-It] batch={tuple(build_images.shape)} "
        f"decoded={numpy_ctc_greedy_decode(scores)} loss={numpy_ctc_loss(scores, target, lengths, np.asarray([2])):.3f}"
    )
    if not TORCH_AVAILABLE:
        print("PyTorch is unavailable; optional Use-It path skipped cleanly.")
        return
    torch.manual_seed(0)
    rng = np.random.default_rng(0)
    model = TinyCRNN()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    train_strings = [f"abc{digit}" for digit in range(10)] + [f"xy{digit}{digit + 1}" for digit in range(9)]
    print(f"[CTC fixture] vocab={len(VOCAB)} examples={len(train_strings)}")
    for step in range(60):
        indices = rng.integers(0, len(train_strings), size=4)
        strings = [train_strings[int(index)] for index in indices]
        images, targets, target_lengths = build_batch(strings, max_len=5)
        log_probs = model(images)
        input_lengths = torch.full((images.shape[0],), log_probs.shape[0], dtype=torch.long)
        loss = ctc_loss(log_probs, targets, input_lengths, target_lengths)
        optimizer.zero_grad(); loss.backward(); optimizer.step()
        if step % 20 == 0:
            print(f"  step {step:2d} loss={loss.item():.3f}")
    model.eval()
    test_strings = ["abc7", "xy45", "abc2"]
    images, _, _ = build_batch(test_strings, max_len=5)
    with torch.no_grad():
        predictions = greedy_ctc_decode(model(images))
    for target, ids in zip(test_strings, predictions):
        predicted = decode_to_str(ids) if ids else ""
        print(f"  {target!r} -> {predicted!r}")


if __name__ == "__main__":
    main()
