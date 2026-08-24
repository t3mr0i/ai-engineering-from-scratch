# Sequence-to-Sequence Models

> Two RNNs pretending to be a translator. The bottleneck they hit is the reason attention exists.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## Learning Objectives

- Explain the core mechanism in Sequence-to-Sequence Models and place it in an NLP pipeline
- Implement the central transformation behind Sequence-to-Sequence Models from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for Sequence-to-Sequence Models

## The Problem

Classification maps a variable-length sequence to a single label. Translation maps a variable-length sequence to another variable-length sequence. The input and output live in different vocabularies, possibly different languages, with no guarantee of length parity.

The seq2seq architecture (Sutskever, Vinyals, Le, 2014) cracked this with a deliberately simple recipe. Two RNNs. One reads the source sentence and produces a fixed-size context vector. The other reads that vector and generates the target sentence token by token. Same code you wrote for lesson 08, glued together differently.

This is worth studying for two reasons. First, the context-vector bottleneck is the most pedagogically useful failure in NLP. It motivates everything attention and transformers are good at. Second, the training recipe (teacher forcing, scheduled sampling, beam search at inference) still applies to every modern generation system including LLMs.

## The Concept

**Encoder.** An RNN that reads the source sentence. Its final hidden state is the **context vector** — a fixed-size summary of the entire input. Lose nothing but the source, supposedly.

**Decoder.** Another RNN initialized from the context vector. At each step it takes the previously generated token as input and produces a distribution over the target vocabulary. Sample or argmax to pick the next token. Feed it back in. Repeat until an `<EOS>` token is produced or max length is hit.

**Training:** Cross-entropy loss at each decoder step, summed over the sequence. Standard backprop through time through both networks.

**Teacher forcing.** During training, the decoder's input at step `t` is the *ground-truth* token at position `t-1`, not the decoder's own previous prediction. This stabilizes training; without it, early mistakes cascade and the model never learns. At inference, you have to use the model's own predictions, so there is always a train/inference distribution gap. That gap is called **exposure bias**.

**The bottleneck.** Everything the encoder learned about the source must be squeezed into that one context vector. Long sentences lose detail. Rare words get blurred. Reordering (chat noir vs. black cat) has to be memorized, not computed.

Attention (lesson 10) fixes this by letting the decoder look at *every* encoder hidden state, not just the last one. That is the whole pitch.




## Further Reading

- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) — the original seq2seq paper. Four pages.
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078) — introduced the GRU and the encoder-decoder framing.
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) — the attention paper. Read immediately after this lesson.
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) — buildable seq2seq + attention code.

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Explain the core mechanism in Sequence-to-Sequence Models and place it in an NLP pipeline.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Implement the central transformation behind Sequence-to-Sequence Models from first principles.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Inspect intermediate representations to connect the algorithm to its output.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Explain the core mechanism in Sequence-to-Sequence Models and place it in an NLP pipeline,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Inspect intermediate representations to connect the algorithm to its output,” and cite a repeatable check rather than relying on visual inspection alone.
