# Text Processing — Tokenization, Stemming, Lemmatization

> Language is continuous. Models are discrete. Preprocessing is the bridge.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## Learning Objectives

- Explain the core mechanism in Text Processing — Tokenization, Stemming, Lemmatization and place it in an NLP pipeline
- Implement the central transformation behind Text Processing — Tokenization, Stemming, Lemmatization from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Text Processing — Tokenization, Stemming, Lemmatization

## The Problem

A model cannot read "The cats were running." It reads integers.

Every NLP system opens with the same three questions. Where does a word start. What is the root of the word. How do we treat "run", "running", "ran" as the same thing when it helps, and as different things when it doesn't.

Get tokenization wrong and the model learns from garbage. If your tokenizer treats `don't` as one token but `do n't` as two, the training distribution splits. If your stemmer collapses `organization` and `organ` to the same stem, topic modeling dies. If your lemmatizer needs part-of-speech context but you don't pass it, verbs get treated as nouns.

This lesson builds the three preprocessing steps from scratch, then shows how NLTK and spaCy do the same work so you can see the tradeoffs.

## The Concept

Three operations. Each has a job and a failure mode.

**Tokenization** splits a string into tokens. "Token" is deliberately vague because the right granularity depends on the task. Word-level for classical NLP. Subword for transformers. Character for languages without whitespace.

**Stemming** chops suffixes with rules. Fast, aggressive, dumb. `running -> run`. `organization -> organ`. That second one is the failure mode.

**Lemmatization** reduces a word to its dictionary form using grammar knowledge. Slower, accurate, needs a lookup table or morphological analyzer. `ran -> run` (needs to know "ran" is past tense of "run"). `better -> good` (needs to know comparative forms).

Rule of thumb. Stem when speed matters and you can tolerate noise (search indexing, rough classification). Lemmatize when meaning matters (question answering, semantic search, anything the user will read).




## Build It

Reconstruct **Text Processing — Tokenization, Stemming, Lemmatization** by following `tokenize` on tokens=["red","fox"]. Run `python3 main.py` and verify that the attention/embedding shape follows the token count and each valid attention row remains normalized.

## Use It

Call `tokenize` from a small caller with tokens=["red","fox"]. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/.gitkeep` with the command `python3 main.py`, the accepted input shape (tokens=["red","fox"]), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) — the original paper, five pages, still the clearest explanation.
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) — how a real pipeline is wired.
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) — tokenization edge cases you haven't thought of yet.

## Exercises

Keep two runs side by side for **Text Processing — Tokenization, Stemming, Lemmatization**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using tokens=["red","fox"]. Follow `tokenize`, `stem_step_1a`, `lemmatize`. Expect the attention/embedding shape follows the token count and each valid attention row remains normalized; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in Text Processing — Tokenization, Stemming, Lemmatization and place it in an NLP pipeline**.
2. **Run a two-value comparison.** Repeat the command after changing only the token sequence: use tokens=["red","fox","runs"]. Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind Text Processing — Tokenization, Stemming, Lemmatization from first principles** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation tokens=[]. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/.gitkeep` and add a worked example using tokens=["red","fox"]. Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for Text Processing — Tokenization, Stemming, Lemmatization**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Text Processing — Tokenization, Stemming, Lemmatization** should contain:

- the `python3 main.py` output for tokens=["red","fox"], with `tokenize`, `stem_step_1a`, `lemmatize` traced to the value or shape that supports **Explain the core mechanism in Text Processing — Tokenization, Stemming, Lemmatization and place it in an NLP pipeline**;
- a before/after comparison for the token sequence, where tokens=["red","fox","runs"] changes the observation in the direction predicted by **Implement the central transformation behind Text Processing — Tokenization, Stemming, Lemmatization from first principles**;
- a recorded result for tokens=[] that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/.gitkeep` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for Text Processing — Tokenization, Stemming, Lemmatization**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
## Guided Demo

Use the [10–15 minute guided demo](demo.md) to predict an invariant, run the canonical entrypoint, change one variable, and probe a failure case.
