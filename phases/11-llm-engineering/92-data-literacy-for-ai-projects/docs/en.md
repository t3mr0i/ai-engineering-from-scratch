# Data Readiness for AI Projects: Assess Before You Build (2026)

> A 2024 McKinsey survey found that data quality problems — not model limitations — were the top reason AI pilots failed to reach production. By 2026 the gap has narrowed but not closed: RAG systems surface stale data, fine-tuned models carry licensing debt, and evaluation sets drawn from the training corpus produce inflated benchmarks. Frontier models (Claude Sonnet 4.x, GPT-4o, Gemini 2.x) have dramatically reduced the need for task-specific training data, yet they amplify data problems rather than hide them — a retrieval pipeline built on unvetted internal documents returns confidently wrong answers at frontier-model quality. The discipline of checking data before building is not due diligence theatre; it is the cheapest way to avoid a six-week production incident.

**Type:** Learn
**Languages:** Python (stdlib — data source scoring + readiness decision engine)
**Prerequisites:** Phase 18 · 27 (Data provenance and training governance), Phase 11 · 10 (Evaluation)
**Time:** ~45 minutes

## The Problem

A consulting team scoping an AI pilot typically receives a dataset from the client, asks "can we use this?" and gets back "yes, it is all there." The dataset may be complete in row count while being systematically wrong in quality: labels assigned by a process that no longer exists, documents whose access rights were never audited, freshness assumptions built into the model that the data silently violates. The team builds on it, the demo works, the pilot launches, and the incident happens in week seven of production.

The engineering question is not whether the data looks usable — it is whether the data passes a structured gate across five dimensions: quality, freshness, sensitivity, provenance, and evaluation coverage. Each dimension can kill a deployment independently. A dataset that is fresh, licensed, and privacy-clean still fails if its label accuracy is 61% for a task that requires 95%. A dataset with 98% label accuracy still fails if it contains PII that was never consented for model training. The gate must be applied to every data source, not just the primary one.

## The Concept

### The five data readiness dimensions

| Dimension | The question | Minimum bar (RAG/retrieval) | Minimum bar (fine-tuning) |
|---|---|---|---|
| **Quality** | Are labels, values, and structure correct enough for the task? | Sufficient for retrieval; errors surface as bad retrievals, not model weights | Label accuracy commensurate with target task performance; audit a random sample |
| **Freshness** | Is the data current enough for the query distribution? | Staleness measured in expected query lag; TTL policy in place | Training cutoff documented; update cadence set before training starts |
| **Sensitivity** | Does the data contain PII, confidential, or legally restricted content? | All personally identifiable information either removed or consent-verified | Legal review of training corpus; data processing agreement in place |
| **Provenance** | Is the origin, chain of custody, and license known? | Source documented; web-scraped data has robots.txt/ToS review | Licensing cleared for model weights (not just display); model card drafted |
| **Evaluation coverage** | Does the held-out evaluation set match the production query distribution? | Eval set drawn from production logs or realistic synthetic queries | Eval set never overlaps training; distribution shift budget defined |

### Quality: beyond row counts

Clients report data quality as completeness ("we have 2.3 million records"). The operationally relevant measure is **task-relevant accuracy**: what fraction of records are correct for the decisions the model will make? A practical audit samples 100-200 records, has a subject-matter expert label them independently, and computes the agreement rate.

Two structural failure modes to name explicitly in every scoping call:

- **Label drift**: the labeling process changed (policy update, new annotator pool, automated label replacement) but the label field shows no discontinuity. A model trained across the discontinuity learns inconsistent signal. Detection: stratify the sample by time; check whether agreement rate drops in a particular window.
- **Proxy collapse**: the feature the model is actually learning is a proxy for the target (e.g., a "high-priority ticket" label is strongly predicted by ticket source system rather than actual content). Detection: run a feature importance audit; check whether any categorical feature predicts the label at > 0.9 precision on the validation set alone.

### Freshness: TTL and query lag

Every AI system has an implicit freshness assumption. RAG pipelines retrieve documents; if those documents have a 90-day update cycle and the product SLA is real-time, any query that touches a changed fact returns a stale answer with high confidence. Freshness planning requires:

1. **Document TTL**: the maximum age at which a document is still trustworthy for the query type.
2. **Ingestion lag**: the delay between a document update in the source system and its availability in the vector store.
3. **Query lag budget**: the acceptable combined staleness (TTL + ingestion lag) that keeps the system within its accuracy target.

The concrete output of a freshness audit is a `max_lag_days` value per data source. If ingestion + TTL exceeds that budget, the source either needs faster refresh or must be gated out of the retrieval pool for time-sensitive queries. See Phase 11 · 10 (Evaluation) for how to construct a freshness-specific eval that measures whether lag causes measurable accuracy degradation.

### Sensitivity: data classification before any model touches it

The GDPR Art. 4 definition of personal data is broad enough to cover IP addresses, device IDs, pseudonymised health records, and behavioral sequences that are re-identifiable in combination. In 2026 EU AI Act Articles 10 and 53 add a separate requirement: training data for general-purpose AI models must document the source, the copyright status, and any opt-out claims filed before training.

A sensitivity audit for an AI project uses three passes:

1. **Automated scan** — run a PII detector (spaCy NER, Presidio, or a fine-tuned classifier) over a random sample. Flag any document with a hit rate above a threshold; manual review determines whether the hit is a true positive.
2. **Schema audit** — for structured data, map every column to a data classification level (public / internal / confidential / restricted). Any `restricted`-classified column requires legal sign-off before it enters a training pipeline.
3. **Access lineage check** — verify that the data processing agreement between the data controller and the AI processor covers the intended use. "We use this data for reporting" does not imply consent for model training, even internally.

Phase 18 · 27 covers the provenance governance framework in full detail. This lesson focuses on the pre-build assessment gate.

### Provenance and licensing

The 2025 "training data liability" cases (Getty v. Stability AI settled; NYT v. OpenAI ongoing as of 2026) made clear that the licensing question for model training is distinct from the licensing question for display. A data source may be freely readable and yet have a terms-of-service clause that prohibits use in machine-learning training. The standard check is:

- For web-scraped data: verify `robots.txt` disallow rules at scrape time, and check the ToS for an explicit ML/training prohibition.
- For licensed databases: obtain written confirmation from the licensor that model training is a permitted use.
- For internal enterprise data: verify the data processing agreement covers model training; check whether any employee-generated content falls under collective bargaining clauses that restrict automated processing.

Document the result in a provenance record per source. The record is required input to a model card (Phase 18 · 27) and to any AI Act compliance assessment.

### Evaluation coverage: the distribution mismatch trap

The most expensive evaluation failure is the one where offline metrics look good but production accuracy typically degrades within the first one to four weeks of launch as the real query distribution diverges from the eval set. The cause is almost always **distribution mismatch**: the evaluation set was constructed from historical data that does not represent the query distribution the model actually receives.

The 2026 best practice for RAG and retrieval systems:

- Reserve a random sample from **production logs** as the gold eval set; if no production logs exist, generate synthetic queries from a stratified sample of the document corpus using a frontier model, then have a subject-matter expert validate a random subset.
- Never construct the eval set from the same document corpus the retrieval index was built on without a held-out split. A retrieval system that was indexed on document A will retrieve document A for any query that partially matches it; this is not the same as correctly answering the user's question.
- Track **eval set drift**: re-sample production queries quarterly and compare the query distribution (embedding centroid distance, topic model divergence) to the current eval set. If drift exceeds a threshold, the eval set must be refreshed before the next model update.

Phase 11 · 10 (Evaluation) covers the full evaluation framework. The specific contribution of this lesson is the **pre-build** check: before writing any retrieval code, does the data you have produce an eval set that would catch a broken system?

### The five-dimension readiness gate

Scoring each dimension on a 0-2 scale (0 = fail, 1 = pass with caveats, 2 = pass) gives a structured output from the assessment:

- A total score below 6 out of 10: **stop**. Remediation is required before any prototype work begins.
- A total score of 6-7: **conditional proceed**. Name the failing dimension explicitly; agree a remediation plan and timeline before the sprint starts.
- A total score of 8-10: **proceed**. Document the assessment in the project brief; re-run at every major data change.

The scoring function in `code/main.py` makes this gate explicit and runnable.

## Use It

`code/main.py` models the five-dimension data readiness assessment as a deterministic scoring engine. It defines a `DataSource` dataclass with one field per dimension, a `score_source()` function that maps each field to 0/1/2 and returns the verdict (STOP / CONDITIONAL / PROCEED), and a `main()` driver that runs three representative sources through the gate — a clean internal knowledge base, a web-scraped corpus with open licensing questions, and a structured CRM export with PII present. The printed output names the blocking dimension for each failing source, which is exactly the output a scoping call produces.

## Ship It

`outputs/skill-data-readiness-assessment.md` is a one-page, paste-and-use checklist for a data readiness assessment workshop. It contains the five-dimension scoring table, a per-dimension audit checklist, and the decision gate — formatted for use as a shared document in a client scoping session.

## Exercises

1. Run `code/main.py`. Which of the three sample data sources gets a STOP verdict, and which dimension is the blocking one? Modify the PII field of that source to `"none detected"` and re-run — does the verdict change, and if not, why not?

2. Run `code/main.py` again and find the source that receives a CONDITIONAL verdict. Add a fourth source to the `SOURCES` list in `main()` representing a real dataset from a project you work on. Assign values for each dimension as honestly as you can, and record the verdict.

3. A client provides a knowledge base of 50,000 internal PDF documents for a RAG-based assistant. The documents were last bulk-updated 18 months ago. Write the three-line freshness check you would run in a scoping call: what is the TTL, what is the ingestion lag, and what is the max-lag budget for the client's stated SLA?

4. Using the provenance checklist from Phase 18 · 27, identify one data source in your current or recent project that you could not yet issue a clean provenance record for. What single step would resolve it?

5. An evaluation set for a document Q&A system was built by having five employees write questions against the same documents that form the retrieval index. Identify two specific ways this produces an inflated offline metric, and describe how to reconstruct the eval set to remove each bias.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| Data readiness | "Is the data good enough?" | A structured five-dimension gate: quality, freshness, sensitivity, provenance, evaluation coverage |
| Label drift | "The labels changed" | A systematic shift in how a label was assigned, with no discontinuity in the label field — produces inconsistent training signal |
| Proxy collapse | "The model is learning the right thing" | A categorical feature (e.g. source system) predicts the target at high precision on validation alone, masking the actual decision logic |
| Document TTL | "How fresh does the data need to be?" | The maximum age at which a document is still trustworthy for a given query type |
| Distribution mismatch | "The eval looked fine" | The offline evaluation set does not represent the production query distribution, producing inflated benchmark scores |
| PII scan | "We checked for personal data" | An automated + manual audit for GDPR Art. 4 personal data, including re-identifiable combinations, not just obvious fields |
| Provenance record | "We know where the data came from" | A per-source document covering origin, chain of custody, license, and opt-out status — required input to a model card |
| Data processing agreement | "The legal contract" | The GDPR-required agreement between data controller and processor; does not automatically cover model training as a use case |

## Consultant field notes

Five patterns a senior consultant recognises in week one of an AI scoping engagement:

- **The RAG that returned the right doc but the wrong paragraph.** The retrieval hit was correct; the chunking strategy split the answer across a boundary the embedder could not bridge. Lesson: document-level retrieval score hides paragraph-level recall failure. Always include a chunk-level eval.

- **The vendor pilot that never made it past the security review.** The data processing agreement covered display, not training; the procurement team caught it in week four. Lesson: provenance is a procurement artefact, not a data-team artefact. Loop legal in at scoping, not at pilot close.

- **The use case everyone approved but nobody wanted.** The steering committee signed off; the operational users were never asked. Adoption stalled at month three with no failure mode visible in the metrics. Lesson: a stakeholder map is not a user map. Name the daily operator before the steering committee signs anything.

- **The AI feature that hit a cost ceiling in month two.** Per-query LLM cost was acceptable at pilot volume; at production volume it exceeded the unit economics of the feature it was attached to. Lesson: cost per inference x expected query volume x gross margin defines the ceiling before any accuracy discussion.

- **The eval set that scored 94% in the lab and 67% in week one.** Employees wrote questions against the same documents they indexed; the retrieval trivially returned the source. Lesson: a held-out split must separate query author from indexed document author. Otherwise the eval measures memorisation, not retrieval.

## Further Reading

- [EU AI Act — Article 10 (Training, validation and testing data)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — the binding data governance requirements for general-purpose AI models under EU law.
- [Microsoft Presidio](https://microsoft.github.io/presidio/) — open-source PII detection and anonymisation library; the practical tool for automated sensitivity scans.
- [Google — Data Cards Playbook](https://sites.research.google/datacardsplaybook/) — structured methodology for documenting dataset provenance, intended use, and limitations; the closest thing to an industry standard for model cards.
- [ACM FAccT — Datasheets for Datasets (Gebru et al., 2018)](https://dl.acm.org/doi/10.1145/3458723) — the foundational paper defining what provenance documentation should contain; still the reference most practitioners cite.
- [NIST AI RMF — Govern 1.6 and Map 2.3](https://airc.nist.gov/) — the NIST AI Risk Management Framework sections on data quality and bias in training data; relevant for US federal and regulated-industry projects.
