# CNNs and RNNs for Text

> Convolutions learn n-grams. Recurrences remember. Both are superseded by attention. Both still matter on constrained hardware.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 11 (PyTorch Intro), Phase 5 · 03 (Word Embeddings), Phase 4 · 02 (Convolutions from Scratch)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in CNNs and RNNs for Text and place it in an NLP pipeline
- Implement the central transformation behind CNNs and RNNs for Text from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for CNNs and RNNs for Text

## The Problem

TF-IDF and Word2Vec produced flat vectors that ignored word order. A classifier built on them could not tell `dog bites man` from `man bites dog`. Word order sometimes carries the signal.

Two families of architectures filled that gap before transformers arrived.

**Convolutional nets for text (TextCNN).** Apply 1D convolutions over sequences of word embeddings. A filter of width 3 is a learnable trigram detector: it spans three words and outputs a score. Stack different widths (2, 3, 4, 5) to detect multi-scale patterns. Max-pool to a fixed-size representation. Flat, parallel, fast.

**Recurrent nets (RNN, LSTM, GRU).** Process tokens one at a time, maintaining a hidden state that carries information forward. Sequential, memory-bearing, flexible input lengths. Dominated sequence modeling from 2014 to 2017, then attention happened.

This lesson builds both, then names the failure that motivated attention.

## The Concept

**TextCNN** (Kim, 2014). Tokens get embedded. A width-`k` 1D convolution slides a filter over consecutive `k`-grams of embeddings, producing a feature map. Global max-pooling over that map picks the strongest activation. Concatenate max-pooled outputs from several filter widths. Feed to a classifier head.

Why it works. A filter is a learnable n-gram. Max-pooling is position-invariant, so "not good" fires the same feature at the start or middle of a review. Three filter widths with 100 filters each gives you 300 learned n-gram detectors. Training is parallel; no sequential dependency.

**RNN.** At each time step `t`, the hidden state `h_t = f(W * x_t + U * h_{t-1} + b)`. Share `W`, `U`, `b` across time. The hidden state at time `T` is a summary of the entire prefix. For classification, pool across `h_1 ... h_T` (max, mean, or last).

Plain RNNs suffer vanishing gradients. The **LSTM** adds gates that decide what to forget, what to store, and what to output, stabilizing gradients through long sequences. The **GRU** simplifies LSTM to two gates; performs similarly with fewer parameters.

**Bidirectional RNNs** run one RNN forward and another backward, concatenating hidden states. Every token's representation sees both left and right context. Essential for tagging tasks.




## Further Reading

- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) — the TextCNN paper. Eight pages. Readable.
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) — the LSTM paper. Unexpectedly lucid.
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) — the diagrams that made LSTMs accessible to everyone.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in CNNs and RNNs for Text and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind CNNs and RNNs for Text from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in CNNs and RNNs for Text and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
