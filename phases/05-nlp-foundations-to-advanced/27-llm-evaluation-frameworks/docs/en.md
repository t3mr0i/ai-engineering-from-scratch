# LLM Evaluation — RAGAS, DeepEval, G-Eval

> Exact-match and F1 miss semantic equivalence. Human review does not scale. LLM-as-judge is the production answer — with enough calibration to trust the number.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 13 (Question Answering), Phase 5 · 14 (Information Retrieval)
**Time:** ~75 minutes

## The Problem

Your RAG system answers: "June 29th, 2007."
The gold reference is: "June 29, 2007."
Exact Match scores 0. F1 scores ~75%. A human would score 100%.

Now multiply by 10,000 test cases. Multiply again by every change to the retriever, chunking, prompt, or model. You need an evaluator that understands meaning, runs cheaply at scale, does not lie about regressions, and surfaces the right failure modes.

2026 has three frameworks that own this problem.

- **RAGAS.** Retrieval-Augmented Generation ASsessment. Four RAG metrics (faithfulness, answer-relevance, context-precision, context-recall) with NLI + LLM-judge backends. Research-backed, lightweight.
- **DeepEval.** Pytest for LLMs. G-Eval, task-completion, hallucination, bias metrics. CI/CD-native.
- **G-Eval.** A method (and a DeepEval metric): LLM-as-judge with chain-of-thought, custom criteria, 0-1 score.

All three lean on LLM-as-judge. This lesson builds intuition for the method and the trust layer around it.

## The Concept

![Four evaluation dimensions, LLM-as-judge architecture](../assets/llm-evaluation.svg)

**LLM-as-judge.** Replace a static metric with an LLM that scores outputs given a rubric. Given `(query, context, answer)`, prompt a judge LLM: "Score 0-1 on faithfulness." Return the score.

Why it works: LLMs approximate human judgment at a tiny fraction of the cost. GPT-4o-mini at ~$0.003 per scored case enables 1000-sample regression eval runs for under $5.

Why it fails silently:

1. **Judge bias.** Judges prefer longer answers, answers from their own model family, answers that match the prompt style.
2. **JSON parsing failures.** Bad JSON → NaN score → silently excluded from the aggregate. RAGAS users know this pain. Gate with try/except + explicit failure mode.
3. **Drift over model versions.** Upgrading the judge changes every metric. Freeze judge model + version.

**The RAG four.**

| Metric | Question | Backend |
|--------|----------|---------|
| Faithfulness | Does each claim in the answer come from the retrieved context? | NLI-based entailment |
| Answer relevance | Does the answer address the question? | Generate hypothetical questions from answer; compare to real question |
| Context precision | Of retrieved chunks, what fraction were relevant? | LLM-judge |
| Context recall | Did retrieval return everything needed? | LLM-judge against gold answer |

**G-Eval.** Define a custom criterion: "Did the answer cite the correct source?" The framework auto-expands into chain-of-thought evaluation steps, then scores 0-1. Good for domain-specific quality dimensions RAGAS does not cover.

**Calibration.** Never trust the raw judge score until you have a correlation against human labels. Run 100 hand-labeled examples. Plot judge vs human. Compute Spearman rho. If rho < 0.7, your judge rubric needs work.


## Use It

The 2026 stack:

| Use case | Framework |
|---------|-----------|
| RAG quality monitoring | RAGAS (4 metrics) |
| CI/CD regression gates | DeepEval + pytest |
| Custom domain criteria | G-Eval within DeepEval |
| Online live-traffic monitoring | RAGAS with reference-free mode |
| Human-in-the-loop spot checks | LangSmith or Phoenix with annotation UI |
| Red-teaming / safety eval | Promptfoo + DeepEval |

Typical stack: RAGAS for monitoring, DeepEval for CI, G-Eval for novel dimensions. Run all three; they disagree usefully.

## Ship It

Save as `outputs/skill-eval-architect.md`:

```markdown
---
name: eval-architect
description: Design an LLM evaluation plan with calibrated judge and CI gates.
version: 1.0.0
phase: 5
lesson: 27
tags: [nlp, evaluation, rag]
---

Given a use case (RAG / agent / generative task), output:

1. Metrics. Faithfulness / relevance / context-precision / context-recall + any custom G-Eval metrics with criteria.
2. Judge model. Named model + version, rationale for cost vs accuracy.
3. Calibration. Hand-labeled set size, target Spearman rho vs human > 0.7.
4. Dataset versioning. Tag strategy, change log, stratification.
5. CI gate. Thresholds per metric, regression-window logic, bottom-quantile alert.

Refuse to rely on a judge untested against ≥50 human-labeled examples. Refuse self-evaluation (same model generates + judges). Refuse aggregate-only reporting without bottom-10% surfacing. Flag any pipeline where judge upgrade lands without parallel baseline eval.
```


## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| LLM-as-judge | Scoring with an LLM | Prompt a judge model to score outputs 0-1 given a rubric. |
| RAGAS | The RAG metric library | Open-source eval framework with 4 reference-free RAG metrics. |
| Faithfulness | Is the answer grounded? | Fraction of answer claims entailed by retrieved context. |
| Context precision | Were retrieved chunks relevant? | Fraction of top-K chunks that actually mattered. |
| Context recall | Did retrieval find everything? | Fraction of gold-answer claims supported by retrieved chunks. |
| G-Eval | Custom LLM judge | Rubric + chain-of-thought eval steps + 0-1 score. |
| Calibration | Trust but verify | Spearman correlation between judge score and human score. |

## Further Reading

- [Es et al. (2023). RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) — the RAGAS paper.
- [Liu et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment](https://arxiv.org/abs/2303.16634) — the G-Eval paper.
- [DeepEval docs](https://deepeval.com/docs/metrics-introduction) — open production stack.
- [Zheng et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) — biases, calibration, limits.
- [MLflow GenAI Scorer](https://mlflow.org/blog/third-party-scorers) — unifying framework that integrates RAGAS, DeepEval, Phoenix.
