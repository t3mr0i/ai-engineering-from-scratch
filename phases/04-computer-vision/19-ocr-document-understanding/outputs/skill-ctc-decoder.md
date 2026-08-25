---
name: skill-ctc-decoder
description: Decode time-major CTC log probabilities with explicit blank, repeat, and length contracts
version: 1.1.0
phase: 4
lesson: 19
tags: [ocr, ctc, decoding, sequence-models]
---

# CTC Decoder

## Input contract

- `log_probs`: finite `(T,N,V)` log probabilities.
- `blank`: integer `0 <= blank < V`.
- Every sequence has `T >= 1`; no vocabulary lookup happens inside the decoder.

## Greedy decode

```python
import numpy as np

def greedy_ctc_decode(log_probs, blank=0):
    log_probs = np.asarray(log_probs)
    if log_probs.ndim != 3 or min(log_probs.shape) < 1 or not np.isfinite(log_probs).all():
        raise ValueError("log_probs must be a non-empty (T,N,V) tensor")
    if not isinstance(blank, int) or isinstance(blank, bool) or not 0 <= blank < log_probs.shape[-1]:
        raise ValueError("blank must be a valid vocabulary index")
    ids = log_probs.argmax(axis=-1).transpose(1, 0).tolist()
    output = []
    for sequence in ids:
        collapsed, previous = [], None
        for index in sequence:
            if index != previous and index != blank:
                collapsed.append(index)
            previous = index
        output.append(collapsed)
    return output
```

The order matters: first merge adjacent repeats, then remove blank IDs according to the standard CTC collapse rule. A repeated character separated by a blank remains repeated.

For a loss, validate `input_length >= target_length + adjacent_repeat_count` before calling a framework loss. A numerical `zero_infinity` option is not an alignment validator.

## Report

```text
[decoder]
  shape:       (T,N,V)
  blank:       <integer>
  beam:        greedy | <width, if a separately implemented beam is used>
  output_ids:  <per-row sequences>
  metric:      <CER/WER on a named held-out set, or unknown>
```

The phase-04 code tests greedy decoding and CTC length validation. It does not claim that greedy is within a particular percentage of a beam decoder, because that depends on logits and a dataset.
