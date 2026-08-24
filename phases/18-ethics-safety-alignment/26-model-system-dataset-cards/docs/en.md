# Model, System, and Dataset Cards

> Three documentation formats structure AI transparency. [Model Cards](https://arxiv.org/abs/1810.03993) document intended use, evaluation, limitations, and disaggregated performance. [Datasheets for Datasets](https://arxiv.org/abs/1803.09010) cover motivation, composition, collection, labeling, distribution, and maintenance. [Data Cards](https://arxiv.org/abs/2204.01075) organize layered detail for different readers. Newer work such as [CardGen](https://arxiv.org/abs/2405.06258) explores assisted generation, but automation does not verify claims. System cards extend documentation to the end-to-end system, including safeguards and operational limitations.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 18 · 18 (safety frameworks), Phase 18 · 24 (regulatory)
**Time:** ~60 minutes

## Learning Objectives

- Describe the original Mitchell et al. 2019 model card and the Gebru et al. 2018 datasheet.
- Describe Data Cards' telescopic/periscopic/microscopic layering.
- Describe System Cards and their end-to-end coverage.
- State three 2024-2025 developments (automated generation, verifiable attestations, sustainability reporting).

## The Problem

Regulatory frameworks (Lesson 24) and lab safety policies (Lesson 18) both require documentation. Documentation formats evolved from model-specific (model cards) to dataset-specific (datasheets) to system-specific (system cards). Each addresses a different scope of transparency. The 2024-2025 automation and verifiable-attestation work addresses the long-standing adoption problem.

## The Concept

### Model Cards (Mitchell et al. 2019)

Sections:
- Model details.
- Intended use.
- Factors (relevant demographic or environmental factors for evaluation).
- Metrics.
- Evaluation data.
- Training data.
- Quantitative analyses (disaggregated by factors).
- Ethical considerations.
- Caveats and recommendations.

Adoption problem: Oreamuno et al. 2023 audit of Hugging Face model cards found only 0.3% document ethical considerations.

### Datasheets for Datasets (Gebru et al. 2018)

Electronics-datasheet analogy. Sections:
- Motivation (why was the dataset created).
- Composition (what is in it).
- Collection process (how was it assembled).
- Labeling (if applicable).
- Uses (intended, prohibited, risks).
- Distribution.
- Maintenance.

Published in CACM 2021. The datasheet is the upstream documentation; the model card depends on the datasheet being accurate.

### Data Cards (Pushkarna et al., Google 2022)

Modular layered detail. Three zoom levels:
- **Telescopic.** High-level summary for non-experts.
- **Periscopic.** Middle-level overview for ML practitioners.
- **Microscopic.** Detailed feature-level documentation for auditors.

Boundary-object framing: different readers extract different information from the same document.

### System Cards

Scope: end-to-end AI system including model + safety stack + deployment context. Sections typically include:
- Security capabilities.
- Prompt-injection protection.
- Data-exfiltration detection.
- Alignment with stated human values.
- Incident response.

Sidhpurwala 2024 and Meta system-level transparency work. "Blueprints of Trust" (arXiv:2509.20394) formalizes the System Card as the deployment-layer complement to Model Cards.

### 2024-2025 developments

- **[CardGen (Liu et al. 2024)](https://arxiv.org/abs/2405.06258).** Automated model- and data-card generation with retrieval; evaluate completeness, objectivity, and faithfulness separately.
- **Adoption metrics.** Correlation between documentation detail and downloads is not evidence that a card is accurate; do not optimize card quality for popularity alone.
- **Laminator (Duddu et al. 2024).** Verifiable attestations via hardware TEE / cryptographic signatures — allows the model card to carry a proof-of-claim, not just a claim.
- **Sustainability (Jouneaux et al. July 2025).** Additions for carbon, water, and compute-energy footprint; emerging ISO standards.
- **Regulatory cards.** EU AI Act (Lesson 24) GPAI Code of Practice Transparency chapter requires model cards as a compliance artifact.

### Where this fits in Phase 18

Lessons 24-25 are regulatory and CVE layers. Lesson 26 is the documentation layer. Lesson 27 is training-data governance, which is the datasheet's upstream. Lesson 28 is the research ecosystem that produces evaluations referenced in cards.



## Further Reading

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) — the canonical model card
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) — datasheet paper
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) — layered data documentation
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) — System Card formalization

## Exercises

1. **Establish a baseline.** Run the lesson demo, then capture the inputs, outputs, and one invariant that demonstrates this objective: Describe the original Mitchell et al. 2019 model card and the Gebru et al. 2018 datasheet.
2. **Change one variable.** Modify a single input or parameter and use the resulting evidence to investigate this objective: Describe Data Cards' telescopic/periscopic/microscopic layering.
3. **Probe an edge case.** Predict the result before running it, compare prediction with observation, and explain the discrepancy while applying this objective: Describe System Cards and their end-to-end coverage.

## Reference Solution

Use the canonical [main.py](../code/main.py) as the executable baseline. A complete solution records a successful run, identifies the invariant tied to “Describe the original Mitchell et al. 2019 model card and the Gebru et al. 2018 datasheet,” and changes only one variable for the comparison. The edge-case result must distinguish the prediction from the observation, explain the cause using “Describe System Cards and their end-to-end coverage,” and cite a repeatable check rather than relying on visual inspection alone.
