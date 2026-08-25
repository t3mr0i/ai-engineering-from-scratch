# Logistic Regression

> Turn a linear score into a bounded probability, then choose a threshold that matches the cost of mistakes.

**Type:** Build
**Languages:** Python, Julia
**Prerequisites:** Phase 02 lessons 01–02 and Phase 01 optimization
**Time:** ~65 minutes

## Learning Objectives

- Implement a numerically finite sigmoid and binary cross-entropy fit.
- Read a confusion matrix and compute precision, recall, and F1.
- Explain how a threshold changes the error trade-off without retraining.
- Extend the binary model to softmax probabilities for three classes.
- Validate labels, feature widths, and probability normalization at the API boundary.

## The model

The linear score is z=w·x+b; sigmoid(z) maps it into (0,1). LogisticRegression uses the derivative p-y and records binary cross-entropy after each epoch. The implementation clips extreme logits before exp and clamps probabilities before log, so the -500 to 500 stability fixture stays finite. It is a from-scratch teaching implementation, not a claim that a fixed threshold is medically appropriate.

ClassificationMetrics stores TP, TN, FP, and FN and derives accuracy, precision, recall, and F1. SoftmaxRegression subtracts the largest logit before exponentiating; its probability vector sums to one. The Julia entry point mirrors the same ideas with standard-library code.

## Build It

Run python3 main.py from code/. It creates 60 points near (2,2) with label 0 and 60 points near (5,5) with label 1, for 120 rows total. It fits 800 epochs and prints the initial/final BCE, accuracy, and metric dictionary. It then prints softmax probabilities for [3,0]; their sum is one. Exact accuracy is a property of the seeded local fixture, not a general guarantee.

A small hand fixture is X=[[0],[1],[2],[3]], y=[0,0,1,1]. After fitting, call predict on each row and compare the predictions with the labels.

## Use It

Lowering threshold marks more rows positive, which can increase recall and false positives; it does not alter the sigmoid weights. Choose the threshold on a validation set using the operational cost of FN versus FP. A positive label must be the integer 1 and a negative label the integer 0; fractional values, strings, booleans, and other integers are rejected rather than silently converted.

## Ship It

outputs/skill-classification-baseline.md records the label convention, split, threshold, confusion counts, and the chosen metric. Include the threshold in the handoff: a probability without its decision policy is not a complete classifier contract.

## Exercises

1. Confirm sigmoid(0)=0.5, and evaluate sigmoid(500) and sigmoid(-500) without producing an overflow traceback.
2. For TP=8, FP=2, FN=4, TN=6, calculate precision 0.8, recall 2/3, and F1 before checking ClassificationMetrics.
3. Train the four-row fixture twice with thresholds 0.5 and 0.3; explain which direction the positive count moves.

## Reference Solution

The demo's BCE decreases, the binary probabilities remain finite, and its metrics dictionary agrees with the confusion counts. sigmoid(0) is 0.5, while extreme inputs saturate safely. The confusion fixture gives precision 0.8, recall about 0.667, and F1 about 0.727. Lowering the threshold cannot retrain the model; it only changes which probabilities become class 1.
