# Data Quality Assessment Checklist — AI Workflow Go/No-Go

One-page decision aid for technology consultants and data engineers. Run this
assessment before any AI workflow (RAG, fine-tuning, structured prediction)
goes into design, not after.

---

## Step 1 — Enumerate master data domains the use case touches

For each AI workflow, list every master data domain that appears in the
training data, retrieval corpus, or inference context.

| Use case type | Typical domains |
|---|---|
| Customer-facing assistant | Customer/party, product, order history |
| Spend / procurement analytics | Supplier/vendor, financial instrument, product |
| Internal knowledge RAG | Document metadata, organisational unit, location |
| Risk / compliance model | Customer, financial instrument, counterparty, regulation |

If a domain is missing from this list, stop. Find it before proceeding.

---

## Step 2 — Profile each domain on four dimensions

Run SQL or a profiling tool (Great Expectations, dbt tests, Soda Core) against
the source system. Record the following per domain:

| Metric | How to measure | Flag threshold |
|---|---|---|
| Null rate | `COUNT(field IS NULL) / COUNT(*)` per required field | > 5% on any field the AI will encode or retrieve |
| Duplicate rate | Entity resolution similarity score; compare to golden record count | > 5% surviving duplicates after blocking |
| Stale rate | `COUNT(modified_at < NOW() - interval) / COUNT(*)` | > 10% records not updated within expected refresh cycle |
| Format variance | Histogram of distinct formats per structured field | > 1% minority format on a field used as a join key or filter |

---

## Step 3 — Score each domain

Use the weighted formula (AI-adjusted weights):

```
score = 0.30 * (1 - null_rate)
      + 0.45 * (1 - duplicate_rate)
      + 0.25 * (1 - stale_rate)
```

Uniqueness is weighted highest because duplicate master records inject
contradictory signal into model training and retrieval.

---

## Step 4 — Apply go/no-go thresholds

| Use case criticality | DEPLOY (score >=) | CONDITIONAL (score >=) | BLOCK (score <) |
|---|---|---|---|
| Standard (productivity, internal) | 0.75 | 0.50 | 0.50 |
| High (compliance, financial, medical) | 0.90 | 0.65 | 0.65 |

**DEPLOY**: proceed. Document the scores and recheck at deployment.

**CONDITIONAL**: proceed only if the named inference-time mitigation is
implemented and tested before production traffic.

**BLOCK**: data fix required upstream. Do not start model work until the
score clears the CONDITIONAL threshold and the fix is verified.

---

## Inference-time mitigations for CONDITIONAL verdicts

| Weakest dimension | Required mitigation |
|---|---|
| Uniqueness | Run entity resolution pre-processing before indexing; filter retrieval to golden-record IDs only |
| Completeness | Add null-field filter to retrieval query; surface confidence indicator to downstream users when key fields are absent |
| Timeliness | Apply recency filter at retrieval time (e.g. `modified_at > 90 days`); schedule daily reference data refresh from source system |

---

## Step 5 — Document and gate

- Record domain, score, verdict, and mitigation in the project's data contract
  or architecture decision record.
- Add the profiling checks to CI so the verdict is re-evaluated on each
  pipeline refresh (dbt tests, Great Expectations checkpoints, or Soda scans).
- Review scores again at: (a) first production deployment, (b) any source
  system migration, (c) quarterly if no automated gate exists.

---

## Tooling shortlist

| Task | Fastest open-source option | Enterprise / managed |
|---|---|---|
| Null and format profiling | dbt tests, Great Expectations, ydata-profiling | Ataccama ONE, Informatica IDQ |
| Entity resolution | Splink (DuckDB-native, no infra) | SAP MDG, Reltio, Stibo STEP |
| Freshness audit | SQL `MAX(modified_at)` per partition | Monte Carlo Data, Bigeye |
| Data lineage | OpenLineage, DataHub | Alation, Microsoft Purview |

---

## Red flags that override the score

Even a high aggregate score does not unblock deployment if:

- The duplicate rate for the primary join key used in retrieval exceeds 1%.
- Any field used as a retrieval filter or category label has > 2 distinct
  format variants in production data.
- The source system has had a schema migration or merger in the past 6 months
  with no documented reconciliation run.
- There is no `modified_at` or equivalent timestamp on the master data table
  (freshness cannot be measured).

---

*Phase 11 · 100 — AI Data Quality and Master Data Processes*
