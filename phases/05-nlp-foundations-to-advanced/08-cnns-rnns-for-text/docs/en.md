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




## Build It

Reconstruct **CNNs and RNNs for Text** by following `vanishing_gradient_sim` on an 8x8 synthetic image. Run `python3 main.py` and verify that the reported height/width or feature-map shape changes predictably, without inventing pixels.

## Use It

Call `vanishing_gradient_sim` from a small caller with an 8x8 synthetic image. Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/.gitkeep` with the command `python3 main.py`, the accepted input shape (an 8x8 synthetic image), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) — the TextCNN paper. Eight pages. Readable.
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) — the LSTM paper. Unexpectedly lucid.
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) — the diagrams that made LSTMs accessible to everyone.

## Exercises

Work from the smallest fixture that the CNNs and RNNs for Text demo already understands, then make one deliberate change and record what moved.

1. **Run the smallest fixture.** From `code/`, run `python3 main.py` using an 8x8 synthetic image. Follow `vanishing_gradient_sim`, `conv1d_over_embeddings`, `max_pool`. Expect the reported height/width or feature-map shape changes predictably, without inventing pixels; capture the first printed shape, metric, status, or summary field and state which part supports **Explain the core mechanism in CNNs and RNNs for Text and place it in an NLP pipeline**.
2. **Perturb one field.** Repeat the command after changing only the center-pixel value: use the same image with one bright center pixel. Predict the direction of the change, then compare the two output values. Explain why **Implement the central transformation behind CNNs and RNNs for Text from first principles** says the other inputs should stay fixed.
3. **Check the failure boundary.** Feed the implementation a 1x1 image with all values zero. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Inspect intermediate representations to connect the algorithm to its output** and record the exception text if the code rejects the case.
4. **Make the result repeatable.** Open `outputs/.gitkeep` and add a worked example using an 8x8 synthetic image. Include the input contract, one expected output field, and a named acceptance check for **Evaluate failure cases and choose appropriate metrics for CNNs and RNNs for Text**; note what the demo cannot establish.

## Reference Solution

A checkable result for **CNNs and RNNs for Text** should contain:

- the `python3 main.py` output for an 8x8 synthetic image, with `vanishing_gradient_sim`, `conv1d_over_embeddings`, `max_pool` traced to the value or shape that supports **Explain the core mechanism in CNNs and RNNs for Text and place it in an NLP pipeline**;
- a before/after comparison for the center-pixel value, where the same image with one bright center pixel changes the observation in the direction predicted by **Implement the central transformation behind CNNs and RNNs for Text from first principles**;
- a recorded result for a 1x1 image with all values zero that matches the implementation’s validation or empty-result contract and explains the evidence for **Inspect intermediate representations to connect the algorithm to its output**; and
- an updated `outputs/.gitkeep` example with a concrete input, expected output field, and acceptance check tied to **Evaluate failure cases and choose appropriate metrics for CNNs and RNNs for Text**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
