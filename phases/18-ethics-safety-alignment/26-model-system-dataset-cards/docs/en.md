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



## Build It

Reconstruct **Model, System, and Dataset Cards** by following `model_card` on the text "red fox". Run `python3 main.py` and verify that the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text.

## Use It

Call `model_card` from a small caller with the text "red fox". Compare its result with the demo output, and record the input contract and the one field a downstream user should rely on.

## Ship It

Hand off `outputs/skill-card-audit.md` with the command `python3 main.py`, the accepted input shape (the text "red fox"), the expected observable result, and a failure note for malformed inputs.

## Further Reading

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) — the canonical model card
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) — datasheet paper
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) — layered data documentation
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) — System Card formalization

## Exercises

Keep two runs side by side for **Model, System, and Dataset Cards**. The important evidence is the named field, shape, or status—not a polished paragraph about the run.

1. **Read the first result.** From `code/`, run `python3 main.py` using the text "red fox". Follow `model_card`, `datasheet`, `system_card`. Expect the tokenizer/retriever reports zero or a clear empty-input result, rather than borrowing a result from the previous text; capture the first printed shape, metric, status, or summary field and state which part supports **Describe the original Mitchell et al. 2019 model card and the Gebru et al. 2018 datasheet.**.
2. **Run a two-value comparison.** Repeat the command after changing only the input text: use the text "red fox runs". Predict the direction of the change, then compare the two output values. Explain why **Describe Data Cards' telescopic/periscopic/microscopic layering.** says the other inputs should stay fixed.
3. **Try an adversarial fixture.** Feed the implementation an empty string. Before running it, write down whether the relevant function should return an empty value, a zero-sized result, or a validation error. Check the observed status against **Describe System Cards and their end-to-end coverage.** and record the exception text if the code rejects the case.
4. **Write the operator note.** Open `outputs/skill-card-audit.md` and add a worked example using the text "red fox". Include the input contract, one expected output field, and a named acceptance check for **State three 2024-2025 developments (automated generation, verifiable attestations, sustainability reporting).**; note what the demo cannot establish.

## Reference Solution

A checkable result for **Model, System, and Dataset Cards** should contain:

- the `python3 main.py` output for the text "red fox", with `model_card`, `datasheet`, `system_card` traced to the value or shape that supports **Describe the original Mitchell et al. 2019 model card and the Gebru et al. 2018 datasheet.**;
- a before/after comparison for the input text, where the text "red fox runs" changes the observation in the direction predicted by **Describe Data Cards' telescopic/periscopic/microscopic layering.**;
- a recorded result for an empty string that matches the implementation’s validation or empty-result contract and explains the evidence for **Describe System Cards and their end-to-end coverage.**; and
- an updated `outputs/skill-card-audit.md` example with a concrete input, expected output field, and acceptance check tied to **State three 2024-2025 developments (automated generation, verifiable attestations, sustainability reporting).**.

Run the lesson tests after the demo. If the boundary behaves differently from the prediction, keep the actual exception or output and explain the implementation path that produced it.
