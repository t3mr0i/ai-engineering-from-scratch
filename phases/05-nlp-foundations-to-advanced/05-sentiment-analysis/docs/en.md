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




## Further Reading

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) — the foundational survey. Long, but the first four sections cover everything classical.
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) — the paper that showed bigrams + Naive Bayes is hard to beat on short text.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) — reference for `CountVectorizer`, `TfidfVectorizer`, and every knob you'll tune.
