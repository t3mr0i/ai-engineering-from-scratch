# Sentiment Analysis

> The canonical NLP task. Most of what you need to know about classical text classification shows up here.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in Sentiment Analysis and place it in an NLP pipeline
- Implement the central transformation behind Sentiment Analysis from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Sentiment Analysis

## The Problem

"The food was not great." Positive or negative?

Sentiment sounds simple. A reviewer said they liked or did not like something. Label the sentence. The reason it became the canonical NLP task is that every easy-looking case hides a hard one. Negation flips meaning. Sarcasm inverts it. "Not bad at all" is positive despite two negative-coded words. Emojis carry more signal than surrounding text. Domain vocabulary matters (`tight` in music review versus `tight` in fashion review).

Sentiment is a working lab for classical NLP. If you understand why every naive baseline has a specific failure mode, you understand why every richer model was invented. This lesson builds a Naive Bayes baseline from scratch, adds logistic regression, and names the traps that make production sentiment a compliance-grade problem.

## The Concept

Classical sentiment is a two-step recipe.

1. **Represent.** Turn the text into a feature vector. BoW, TF-IDF, or n-grams.
2. **Classify.** Fit a linear model (Naive Bayes, logistic regression, SVM) on labeled examples.

Naive Bayes is the dumbest model that works. Assume every feature is independent given the label. Estimate `P(word | positive)` and `P(word | negative)` from counts. At inference, multiply the probabilities. The "naive" independence assumption is laughably wrong and yet the results are shockingly strong. The reason: with sparse text features and moderate data, the classifier cares about which side each word leans toward more than how much.

Logistic regression fixes the independence assumption. It learns a weight per feature, including negative weights. `not good` as a bigram feature gets a negative weight. Naive Bayes cannot do that for bigrams it has never labeled.




## Build It

Reconstruct **Sentiment Analysis** by following `tokenize` on the demo’s smallest built-in fixture. Run `python3 main.py` and verify that the result reports the empty case explicitly or raises the documented validation error.

## Use It

Call `tokenize` from a small caller with the demo’s smallest built-in fixture. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/.gitkeep` with the command `python3 main.py`, the accepted input shape (the demo’s smallest built-in fixture), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) — the foundational survey. Long, but the first four sections cover everything classical.
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) — the paper that showed bigrams + Naive Bayes is hard to beat on short text.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) — reference for `CountVectorizer`, `TfidfVectorizer`, and every knob you'll tune.

## Exercises

Use `tokenize` as the trace: start from the demo’s smallest built-in fixture, keep the raw output, and tie each observation to a named objective.

1. **Reproduce the reference path.** From `code/`, run `python3 main.py` using the demo’s smallest built-in fixture. Follow `tokenize`, `apply_negation`, `build_vocab`. Expect the result reports the empty case explicitly or raises the documented validation error; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in Sentiment Analysis and place it in an NLP pipeline**.
2. **Vary one named input.** Repeat the command after changing only the primary fixture value: use the same fixture with its primary value changed from 1 to 2. Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind Sentiment Analysis from first principles** says the other inputs should stay fixed.
3. **Probe the empty case.** Feed the implementation an empty fixture {}. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Package a usable handoff.** Open `outputs/.gitkeep` and add a worked example using the demo’s smallest built-in fixture. Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for Sentiment Analysis**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Sentiment Analysis** should contain:

- the `python3 main.py` output for the demo’s smallest built-in fixture, with `tokenize`, `apply_negation`, `build_vocab` traced to the value or shape that supports **Explain the core mechanism in Sentiment Analysis and place it in an NLP pipeline**;
- a before/after comparison for the primary fixture value, where the same fixture with its primary value changed from 1 to 2 changes the observation in the direction predicted by **Implement the central transformation behind Sentiment Analysis from first principles**;
- a recorded result for an empty fixture {} that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/.gitkeep` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for Sentiment Analysis**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
