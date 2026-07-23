# Text Processing — Tokenization, Stemming, Lemmatization

> Language is continuous. Models are discrete. Preprocessing is the bridge.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

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




## Further Reading

- [Porter, M. F. (1980). An algorithm for suffix stripping](https://tartarus.org/martin/PorterStemmer/def.txt) — the original paper, five pages, still the clearest explanation.
- [spaCy 101 — linguistic features](https://spacy.io/usage/linguistic-features) — how a real pipeline is wired.
- [NLTK book, chapter 3](https://www.nltk.org/book/ch03.html) — tokenization edge cases you haven't thought of yet.
