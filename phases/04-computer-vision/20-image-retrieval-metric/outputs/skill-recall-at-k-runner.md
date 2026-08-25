---
name: skill-recall-at-k-runner
description: Evaluate exact normalized embedding retrieval with a declared query/gallery relevance contract
version: 1.1.0
phase: 4
lesson: 20
tags: [retrieval, evaluation, recall]
---

# Recall@K Runner

## Inputs

- `query_embeddings`: finite `(Q,D)` rows.
- `gallery_embeddings`: finite `(G,D)` rows.
- `query_labels`, `gallery_labels`: matching integer ID vectors.
- `ks`: positive integers no larger than `G`.
- optional query/gallery IDs when exact self-match must be removed.

## Exact baseline

```python
import numpy as np

def recall_at_k(query, gallery, query_labels, gallery_labels, k):
    if query.ndim != 2 or gallery.ndim != 2 or query.shape[1] != gallery.shape[1]:
        raise ValueError("query and gallery must be compatible matrices")
    if gallery.shape[0] == 0 or not 1 <= k <= gallery.shape[0]:
        raise ValueError("gallery must be non-empty and k must fit inside it")
    if query_labels.ndim != 1 or query_labels.shape[0] != query.shape[0]:
        raise ValueError("query labels must match query rows")
    if gallery_labels.ndim != 1 or gallery_labels.shape[0] != gallery.shape[0]:
        raise ValueError("gallery labels must match gallery rows")
    q = query / np.linalg.norm(query, axis=1, keepdims=True)
    g = gallery / np.linalg.norm(gallery, axis=1, keepdims=True)
    top = np.argsort(-(q @ g.T), axis=1, kind="stable")[:, :k]
    return float(np.mean((gallery_labels[top] == query_labels[:, None]).any(axis=1)))
```

## Report

```text
[evaluation]
  query_rows:       <Q>
  gallery_rows:     <G>
  embedding_dim:    <D>
  relevance:        exact ID | class ID
  self_match_rule:  <explicit rule>
  recall@K:          <value for each K>
```

If a query's relevant ID is absent from the gallery, report that coverage issue separately. Do not silently call an empty gallery a zero-quality model.
