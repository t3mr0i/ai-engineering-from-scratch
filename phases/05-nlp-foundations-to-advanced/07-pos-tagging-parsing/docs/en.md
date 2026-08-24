# POS Tagging and Syntactic Parsing

> Grammar was unfashionable for a while. Then every LLM pipeline needed to validate structured extraction, and it came back.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## Learning Objectives

- Explain the core mechanism in POS Tagging and Syntactic Parsing and place it in an NLP pipeline
- Implement the central transformation behind POS Tagging and Syntactic Parsing from first principles
- Inspect intermediate representations to connect the algorithm to its output
- Evaluate failure cases and choose appropriate metrics for POS Tagging and Syntactic Parsing

## The Problem

Lesson 01 promised that lemmatization needs a part-of-speech tag. Without knowing `running` is a verb, a lemmatizer cannot reduce it to `run`. Without knowing `better` is an adjective, it cannot reduce to `good`.

That promise hid a whole subfield. Part-of-speech tagging assigns grammatical categories. Syntactic parsing recovers the sentence's tree structure: which word modifies which, which verb governs which arguments. Classical NLP spent twenty years refining both. Then deep learning collapsed them into a token-classification task on top of a pretrained transformer, and the research community moved on.

Not the applied community. Every structured-extraction pipeline still uses POS and dependency trees under the hood. LLM-generated JSON gets validated against grammatical constraints. Question-answering systems decompose queries using dependency parses. Machine translation quality evaluators check alignment of parse trees.

Worth knowing. This lesson introduces the tagsets, the baselines, and the point where you stop implementing from scratch and call spaCy.

## The Concept

**POS tagging** labels each token with a grammatical category. The **Penn Treebank (PTB)** tagset is the English default. 36 tags with distinctions the casual reader finds fussy: `NN` singular noun, `NNS` plural noun, `NNP` proper noun singular, `VBD` verb past tense, `VBZ` verb 3rd person singular present, and so on. The **Universal Dependencies (UD)** tagset is coarser (17 tags) and language-agnostic; it became the default for cross-lingual work.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing** produces a tree. Two major styles:

- **Constituency parsing.** Noun phrases, verb phrases, prepositional phrases nest inside each other. Output is a tree of non-terminal categories (NP, VP, PP) with words as leaves.
- **Dependency parsing.** Each word has a single head word it depends on, labeled with a grammatical relation. Output is a tree where every edge is a (head, dependent, relation) triple.

Dependency parsing won in the 2010s because it generalizes cleanly across languages, especially free-word-order ones.

```
running is ROOT
cats is nsubj of running
were is aux of running
at is prep of running
3pm is pobj of at
```




## Further Reading

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) — the canonical textbook treatment of POS and parsing.
- [Universal Dependencies project](https://universaldependencies.org/) — the cross-lingual tagset and treebank collection used by every multilingual parser.
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) — practical reference for every attribute exposed on `Token`.
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) — the paper that brought neural parsers into the mainstream.
