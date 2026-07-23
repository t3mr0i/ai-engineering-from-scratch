# POS Tagging and Syntactic Parsing

> Grammar was unfashionable for a while. Then every LLM pipeline needed to validate structured extraction, and it came back.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

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


## Use It

Every production NLP library ships POS and dependency parsers as part of a standard pipeline.

- **spaCy** (`en_core_web_sm` / `md` / `lg` / `trf`). Fast, accurate, integrated with tokenization + NER + lemmatization. `token.tag_` (Penn), `token.pos_` (UD), `token.dep_` (dependency relation).
- **Stanford NLP (stanza)**. Stanford's successor to CoreNLP. State-of-the-art on 60+ languages.
- **trankit**. Transformer-based, good UD accuracy.
- **NLTK**. `pos_tag`. Usable, slow, older. Fine for teaching.

### Where this still matters in 2026

- **Lemmatization.** Lesson 01 needs POS to lemmatize correctly. Always.
- **Structured extraction from LLM outputs.** Validate that a generated sentence respects grammatical constraints (e.g., subject-verb agreement, required modifiers).
- **Aspect-based sentiment.** Dependency parses tell you which adjective modifies which noun.
- **Query understanding.** "movies directed by Wes Anderson starring Bill Murray" decomposes into structured constraints via the parse.
- **Cross-lingual transfer.** UD tags and dependency relations are language-agnostic, enabling zero-shot structured analysis of new languages.
- **Low-compute pipelines.** If you cannot ship a transformer, POS + dependency parse + gazetteer gets you surprisingly far.

## Ship It

Save as `outputs/skill-grammar-pipeline.md`:

```markdown
---
name: grammar-pipeline
description: Design a classical POS + dependency pipeline for a downstream NLP task.
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

Given a downstream task (information extraction, rewrite validation, query decomposition, lemmatization), you output:

1. Tagset to use. Penn Treebank for English-only legacy pipelines, Universal Dependencies for multilingual or cross-lingual.
2. Library. spaCy for most production, stanza for academic-grade multilingual, trankit for highest UD accuracy. Name the specific model ID.
3. Integration pattern. Show the 3-5 lines that call the library and consume the needed attributes (`.pos_`, `.dep_`, `.head`).
4. Failure mode to test. Noun-verb ambiguity (`saw`, `book`, `can`) and PP-attachment ambiguity are the classical traps. Sample 20 outputs and eyeball.

Refuse to recommend rolling your own parser. Building parsers from scratch is a research project, not an application task. Flag any pipeline that consumes POS tags without handling lowercase/uppercase variants as fragile.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| POS tag | Word's type | Grammatical category. PTB has 36; UD has 17. |
| Penn Treebank | Standard tagset | English-specific. Fine-grained verb tenses and noun number. |
| Universal Dependencies | Multilingual tagset | Coarser than PTB; language-neutral; defaults for cross-lingual work. |
| Dependency parse | Sentence tree | Each word has one head, each edge has a grammatical relation. |
| Viterbi | Dynamic programming | Finds the highest-probability tag sequence given emissions and transitions. |

## Further Reading

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) — the canonical textbook treatment of POS and parsing.
- [Universal Dependencies project](https://universaldependencies.org/) — the cross-lingual tagset and treebank collection used by every multilingual parser.
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) — practical reference for every attribute exposed on `Token`.
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) — the paper that brought neural parsers into the mainstream.
