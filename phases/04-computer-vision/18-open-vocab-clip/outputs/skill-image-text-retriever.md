---
name: skill-image-text-retriever
description: Build a small exact in-memory image/text embedding index from already encoded rows
version: 1.1.0
phase: 4
lesson: 18
tags: [clip, retrieval, zero-shot]
---

# Image-Text Retriever

This artifact assumes that an approved image/text encoder has already produced finite feature rows. It focuses on the contract between encoding and ranking.

## Inputs

- `gallery_embeddings`: finite `(G,D)` image matrix.
- `query_embeddings`: finite `(Q,D)` image or text matrix.
- `ids`: length-`G` gallery identifiers.
- `k`: `1 <= k <= G`.

## Exact ranking

```python
import numpy as np

def search(query_embeddings, gallery_embeddings, ids, k=5):
    if query_embeddings.ndim != 2 or gallery_embeddings.ndim != 2:
        raise ValueError("query and gallery rows must be matrices")
    if query_embeddings.shape[1] != gallery_embeddings.shape[1] or gallery_embeddings.shape[0] == 0:
        raise ValueError("embedding widths must match and the gallery must be non-empty")
    if not 1 <= k <= gallery_embeddings.shape[0]:
        raise ValueError("k must fit inside the gallery")
    query = query_embeddings / np.linalg.norm(query_embeddings, axis=1, keepdims=True)
    gallery = gallery_embeddings / np.linalg.norm(gallery_embeddings, axis=1, keepdims=True)
    scores = query @ gallery.T
    indices = np.argsort(-scores, axis=1, kind="stable")[:, :k]
    return [[(ids[int(i)], float(scores[row, i])) for i in row_i] for row, row_i in enumerate(indices)]
```

## Report

```text
[retrieval]
  checkpoint:     <exact encoder artifact>
  gallery_rows:   <G>
  query_rows:     <Q>
  embedding_dim:  <D>
  metric:         cosine via normalized dot product
  recall:         <held-out result or unknown>
```

The phase-04 code trains a synthetic two-tower fixture and demonstrates ranking. It does not decode image files, fetch a model, or provide an approximate index. Add those integrations only with a separately reviewed dependency and evaluation contract.
