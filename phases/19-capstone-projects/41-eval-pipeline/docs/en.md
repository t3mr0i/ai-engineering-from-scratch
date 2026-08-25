# Capstone Lesson 41: Full Evaluation Pipeline

> Training is the part you can monitor with loss curves. Evaluation is the part you have to design. This lesson builds a unified eval pipeline that takes any trained language model, runs four heterogeneous evals on it, aggregates the results into a per-task report, and ships a local mock LLM-as-judge so the loop runs without a network. The four evals cover the dimensions every shipping model needs: language modelling (perplexity), short-form correctness (exact-match), open-form similarity (token F1), and qualitative scoring (judge).

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 lessons 30-37 (NLP LLM track: tokenizer, embedding table, attention block, transformer body, pre-training loop, checkpointing, generation, perplexity)
**Time:** ~90 minutes

## Learning Objectives

- Compute held-out perplexity with masked-token accounting on a tiny transformer.
- Run an exact-match eval on short-form factual prompts.
- Compute token-level F1 between predicted and reference strings with normalisation.
- Build a local mock LLM-as-judge that scores model outputs on a 1-5 scale.
- Aggregate the four evals into a single weighted report with per-task breakdown.

## The Problem

A single metric never describes a language model. Perplexity says how well the model fits the language distribution but says nothing about whether it answers questions. Exact-match says whether the model produces the gold string but punishes correct paraphrases. Token F1 forgives paraphrase but is fooled by lexical overlap with wrong content. LLM-as-judge captures qualitative dimensions but is expensive and stochastic.

The pipeline you actually want has all four. Each eval covers a dimension the others miss. Each runs on a different subset of held-out data shaped for that metric. The final report shows the per-task numbers side by side and an aggregate, so a reviewer can see at a glance which trade-offs the model is making.

This lesson builds that pipeline, end to end, in one file.

## The Concept

```mermaid
flowchart LR
  Model[trained model] --> PPL[perplexity eval<br/>held-out LM]
  Model --> EM[exact-match eval<br/>factual short-form]
  Model --> F1[token F1 eval<br/>open-ended]
  Model --> J[mock judge<br/>1-5 scoring]
  PPL --> R[Report]
  EM --> R
  F1 --> R
  J --> R
  R --> A[(aggregate score)]
```

Each eval is a function from `(model, dataset) -> EvalResult`. The result carries the metric value, per-example details for inspection, and a name for the aggregate. The pipeline composes them with a config that says which evals to run and how to weight them.

## Perplexity, properly counted

Perplexity is `exp(mean negative log-likelihood per token)`. The implementation has two traps:

- The mean must be over actual token positions, not over batch * sequence. Padding tokens have to be excluded from the denominator or perplexity will look better than it is.
- The model predicts the next token, so logits at position `i` predict the token at position `i+1`. Off-by-one mistakes here are silent: the loss still trains, but the metric becomes meaningless.

The eval computes per-batch sums of `-log p(token)` over non-pad positions and a per-batch token count, then divides at the end. This is numerically safer than averaging per-batch perplexities (which under-weights short sequences) and matches the textbook definition.

## Exact-match, with normalisation

The harness normalises both the prediction and the reference before comparing:

- Lowercase.
- Strip surrounding whitespace.
- Collapse internal whitespace runs to a single space.
- Drop trailing terminal punctuation (`.`, `!`, `?`) if both sides differ only by punctuation.

Normalisation makes exact-match useful in practice. A model that says `"Paris"` is right; one that says `"Paris."` is also right; one that says `"  paris  "` is also right. The metric still requires the answer to be the same string after normalisation.

## Token F1, the right way

Token F1 is the harmonic mean of precision and recall computed over the bag-of-tokens. Steps:

1. Normalise prediction and reference (same rules as exact-match).
2. Split each into a list of tokens (whitespace tokenisation).
3. Count the multiset intersection.
4. Precision = `intersection_count / len(pred_tokens)`. Recall = `intersection_count / len(ref_tokens)`. F1 = harmonic mean.

If both prediction and reference are empty, F1 is 1 (vacuous match). If only one is empty, F1 is 0. This pattern matches the SQuAD evaluation reference and produces stable numbers across paraphrases.

## Local Mock LLM-as-Judge

A real judge is a frontier model behind an API. For this lesson the judge has to run offline. The mock judge is a deterministic scorer that takes an instruction, the model's prediction, and the reference, and returns a score in `{1, 2, 3, 4, 5}` plus a one-line rationale. The scoring rules are explicit:

- 5 if normalised prediction equals normalised reference.
- 4 if token F1 between prediction and reference is at least 0.8.
- 3 if token F1 is in `[0.5, 0.8)`.
- 2 if token F1 is in `[0.2, 0.5)`.
- 1 otherwise.

This is not a real judge, but it has the right interface. Swap in a real model later by changing one function. The pipeline does not care.

```mermaid
flowchart LR
  Inst[instruction] --> Judge[mock judge]
  Pred[prediction] --> Judge
  Ref[reference] --> Judge
  Judge --> Score[1-5 score]
  Judge --> Why[rationale]
```

## Aggregation

The aggregate is a weighted mean of normalised eval scores. Each eval reports its own number in `[0, 1]`:

- Perplexity: normalise as `1 / (1 + log(perplexity))`. A perplexity of 1 maps to 1, infinity maps to 0.
- Exact-match: already in `[0, 1]`.
- Token F1: already in `[0, 1]`.
- Judge: divide by 5.

Weights are configurable. The default mix is 0.2 perplexity, 0.3 exact-match, 0.3 token F1, 0.2 judge. The choice of weights is a product decision; the lesson exposes the knob so you can experiment.

## Architecture

```mermaid
flowchart TD
  Data[(held-out fixtures<br/>LM / EM / F1 / Judge)] --> Suite[EvalSuite]
  Model[trained model] --> Suite
  Suite --> PE[perplexity_eval]
  Suite --> EE[exact_match_eval]
  Suite --> FE[token_f1_eval]
  Suite --> JE[judge_eval]
  PE --> Agg[Aggregator]
  EE --> Agg
  FE --> Agg
  JE --> Agg
  Agg --> R[FinalReport<br/>per-task + aggregate]
  R --> JSON[(report.json)]
  R --> Pretty[stdout table]
```

The `EvalSuite` is a thin orchestrator. Each individual eval is a free function that takes `(model, tokenizer, dataset, config)` and returns an `EvalResult`. The `Aggregator` collects results and produces the final report. The demo prints the table and writes a JSON copy that downstream CI can ingest.

## What you will build

The implementation is one `main.py` plus tests.

1. `TinyGPT`: the same decoder-only architecture used in lessons 38-40, included so the lesson stands alone.
2. `InstructionTokenizer`: byte tokeniser with INST / RESP / PAD specials.
3. Four fixtures: an LM corpus, an EM set, an F1 set, and a judge set. Twenty examples each, deterministic.
4. `perplexity_eval`: returns `EvalResult` with the perplexity value and per-token loss histogram.
5. `exact_match_eval`: returns mean EM and per-example records.
6. `token_f1_eval`: returns mean token F1 and per-example records.
7. `mock_judge` and `judge_eval`: per-example score and rationale, mean score across the set.
8. `Aggregator.normalise`: per-eval normalisation rule.
9. `Aggregator.aggregate`: weighted mean and the assembled report.
10. `run_demo`: trains a tiny model briefly, runs all four evals, prints the report table and writes the JSON, exits zero on success.

## Reading the report

The report has three layers. The top is the aggregate score. Below it are the four per-eval numbers. Below those are the per-example breakdowns for diagnostics. A failing CI run typically wants the aggregate, but a reviewer chasing a regression wants the per-example breakdown to see which inputs the model got wrong.

The JSON dump uses stable keys so a CI dashboard can plot trend lines across versions. The pretty-printed table is for humans staring at the terminal after a training run.

## Stretch goals

- Add a calibration eval: do the model's softmax probabilities match its accuracy? Bucket predictions by confidence and report the empirical accuracy per bucket.
- Add a robustness eval: tag each example with a perturbation (typo, paraphrase, distractor) and report metric drop per perturbation.
- Replace the mock judge with a real model behind an HTTP call. The function signature does not change.
- Add per-task weight learning: instead of fixed weights, fit weights to a target preference order over models.

The implementation gives you the four evals, the aggregator, and the report. Real evaluation pipelines layer many more dimensions on top; the pattern stays the same: one function per eval, one aggregator, one report.

## Build It

Reconstruct **Capstone Lesson 41: Full Evaluation Pipeline** by following `InstructionTokenizer` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `InstructionTokenizer` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/artifact-card.md` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Exercises

Work from the smallest fixture that the Capstone Lesson 41: Full Evaluation Pipeline demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `InstructionTokenizer`, `encode_pair`, `encode_prefix`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Compute held-out perplexity with masked-token accounting on a tiny transformer.**.
2. **Perturb one field.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Run an exact-match eval on short-form factual prompts.** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Compute token-level F1 between predicted and reference strings with normalisation.** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/artifact-card.md` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Build a local mock LLM-as-judge that scores model outputs on a 1-5 scale.**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Capstone Lesson 41: Full Evaluation Pipeline** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `InstructionTokenizer`, `encode_pair`, `encode_prefix` traced to the value or shape that supports **Compute held-out perplexity with masked-token accounting on a tiny transformer.**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Run an exact-match eval on short-form factual prompts.**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Compute token-level F1 between predicted and reference strings with normalisation.**; and
- an updated `outputs/artifact-card.md` example with a concrete input, expected output field, and acceptance check tied to **Build a local mock LLM-as-judge that scores model outputs on a 1-5 scale.**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
