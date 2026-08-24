# Phase 19 assessed tracks

Phase 19's micro-lessons become portfolio-grade work when they are integrated, evaluated, and defended as one system. Pick one track; do not submit isolated lesson outputs as a capstone.

## Shared milestone pattern

- **Week 1 — Contract and baseline:** define fixtures, safety boundaries, simplest baseline, and acceptance metrics before implementation.
- **Middle weeks — Vertical increments:** integrate a small end-to-end path each week; preserve before/after evidence and failure cases.
- **Final week — Reproduction and defense:** rebuild from a clean clone, run the frozen evaluation, document limitations, and produce a verification receipt.

## Track map

| Track | Lessons | Duration | Integrated deliverable |
|---|---:|---:|---|
| Agent harness | 20–29 | 4 weeks | Tool-using coding agent with sandbox, verification budget, eval fixtures, and traces |
| Mini LLM | 30–41 | 6 weeks | Tokenizer-to-evaluation decoder model with fine-tuning and preference optimization |
| Training system | 42–49 | 4 weeks | Resumable corpus-to-checkpoint training pipeline with accumulation and distributed parity |
| Research system | 50–57 | 4 weeks | Hypothesis-to-report loop with evidence retrieval, experiment isolation, critic, and stop policy |
| Multimodal VLM | 58–63 | 3 weeks | Vision encoder, alignment, fusion, pretraining objective, and modality-specific evaluation |
| Advanced RAG | 64–69 | 3 weeks | Hybrid retrieval, rewriting, reranking, grounded generation, and retrieval/answer evaluation |
| Evaluation framework | 70–75 | 3 weeks | Versioned task specs, safe code execution, calibrated metrics, aggregation, and CLI runner |
| Distributed training | 76–81 | 3 weeks | Collective operations, sharding, pipeline schedule, atomic checkpoint, and resume parity |
| Safety harness | 82–87 | 3 weeks | Attack taxonomy, detector, refusal eval, classifier, constitutional rules, and end-to-end gate |

## Review questions

1. Can a reviewer reproduce the result without private context or hidden manual steps?
2. Does the evaluation include a baseline, normal fixtures, edge cases, and adversarial cases?
3. Are irreversible actions, credentials, data access, and network access bounded explicitly?
4. Does the report separate observed evidence from inference and disclose negative results?
5. Does the system fail closed or degrade predictably when a dependency is absent?

Submit through the [Verified Capstone challenge](../../challenges/verified-capstone/README.md).
