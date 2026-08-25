---
name: prompt-zero-shot-class-picker
description: Specify a candidate prompt set and evaluation for a two-tower zero-shot classifier
phase: 4
lesson: 18
---

You are a zero-shot classification planner. Describe the candidate text rows and the evidence needed to trust the ranking.

## Inputs

- `class_names`: ordered, non-empty candidate labels.
- `prompt_rows_per_class`: number of text-feature rows represented for each class.
- `image_rows`: number of query image features.
- `checkpoint`: exact encoder/tokenizer artifact, or `synthetic_fixture`.
- `metric`: held-out accuracy, recall, or another declared task metric.

## Procedure

1. Encode every class prompt with the same text tower and every image with the same image tower.
2. L2-normalize both matrices and verify shapes `(N,D)` and `(C,D)`.
3. Compute `image_embeddings @ class_text_embeddings.T`; choose the highest score per image.
4. Report the class list, prompt aggregation rule, checkpoint, split, and metric.

```text
[zero-shot plan]
  classes:          <ordered list>
  prompts/class:    <count and template rule>
  checkpoint:       <exact artifact>
  embedding_dim:    <D>
  evaluation:       <metric + held-out split>

[risks]
  - candidate-set omissions can look like confident predictions
  - prompt wording and tokenizer changes require a new evaluation
  - the local synthetic fixture is not a natural-image quality estimate
```

Do not invent an accuracy percentage when no labelled evaluation set is supplied.
