# Data Readiness Assessment — Decision Aid

**Use this in:** AI project scoping sessions, pilot kick-offs, and data provider reviews.
**Time required:** 60-90 minutes with the data owner + legal/privacy representative.

---

## Step 1 — Identify all data sources

List every data source the pilot will touch: primary training/retrieval corpus, evaluation data, metadata feeds, and any third-party enrichment. A source is anything that will be indexed, embedded, fine-tuned on, or used to construct an eval set.

| # | Source name | Type (internal / licensed / scraped / synthetic) | Owner |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## Step 2 — Score each source (0 / 1 / 2 per dimension)

Apply to each source separately. Record the score and a one-line justification.

### Quality

| Score | Condition |
|---|---|
| 2 | Random sample audit: label/value accuracy >= 95% for the task |
| 1 | Accuracy 80-94%; known gaps documented; remediation plan agreed |
| 0 | Accuracy < 80%, or no audit performed, or label drift present |

Audit method: sample 100-200 records, have a subject-matter expert label independently, compute agreement rate. Stratify by time to detect label drift.

### Freshness

| Score | Condition |
|---|---|
| 2 | TTL + ingestion lag within the query-lag budget for the product SLA |
| 1 | Lag is marginal; TTL policy exists; refresh cadence agreed |
| 0 | No TTL policy; lag exceeds budget; update cadence unknown |

Calculate: `max_lag_days = SLA_hours / 24`. If `document_age_days + ingestion_lag_days > max_lag_days`, score is 0.

### Sensitivity

| Score | Condition |
|---|---|
| 2 | Automated PII scan clean; no confidential/restricted columns without sign-off |
| 1 | Indirect re-identification risk; pseudonymised; legal review in progress |
| 0 | PII present; or restricted columns without sign-off; or no scan run |

Tools: Microsoft Presidio, spaCy NER, or a commercial DLP scanner. Scan a random 5% sample; flag sources with any hit rate > 1%.

### Provenance

| Score | Condition |
|---|---|
| 2 | Origin documented; chain of custody intact; license explicitly permits ML training |
| 1 | Origin known; license unconfirmed for training use; legal review started |
| 0 | Origin unknown; ToS prohibits ML training; robots.txt disallowed; no DPA |

Check: web-scraped sources require explicit ToS review and robots.txt audit at scrape time. Licensed databases require written licensor confirmation that model training is a permitted use.

### Evaluation Coverage

| Score | Condition |
|---|---|
| 2 | Eval set sampled from production logs, or validated synthetic queries with SME review |
| 1 | Expert-authored queries not drawn from production logs |
| 0 | No eval set; or eval set overlaps training corpus; or constructed from same documents as retrieval index |

---

## Step 3 — Apply the readiness gate

Sum scores across all five dimensions (max 10).

| Total | Verdict | Action |
|---|---|---|
| 8-10 | **PROCEED** | Document assessment in project brief; re-run at every major data change |
| 6-7 | **CONDITIONAL** | Name the failing dimension; agree remediation plan and timeline before sprint starts |
| 0-5 | **STOP** | Remediation required before any prototype work; identify blocking dimension |

A single zero-scored dimension blocks regardless of total — identify the blocking dimension explicitly.

---

## Step 4 — Remediation paths by dimension

| Dimension | Common root cause | Fastest resolution |
|---|---|---|
| Quality | No audit run; labels from defunct process | Run 100-record sample audit this week; contact original label source |
| Freshness | No TTL policy; ingestion lag unknown | Measure lag on 10 recent documents; agree refresh SLA with data owner |
| Sensitivity | Raw export includes PII | Anonymise with Presidio; update data processing agreement; re-scan |
| Provenance | Web-scraped; ToS not reviewed | Obtain licensed alternative, or get written licensor clearance |
| Eval Coverage | Eval set from same corpus as index | Sample 200 production queries (or generate validated synthetics); rebuild |

---

## Step 5 — Output

Produce one record per source:

```
Source: <name>
Assessment date: YYYY-MM-DD
Assessed by: <name>, <role>

Quality:        [score]  [justification]
Freshness:      [score]  [justification]
Sensitivity:    [score]  [justification]
Provenance:     [score]  [justification]
Eval coverage:  [score]  [justification]

Total: [X]/10    Verdict: PROCEED / CONDITIONAL / STOP
Blocking dimension: [dimension or none]
Remediation owner: [name]    Target date: [date]
```

Attach this record to the project brief. Re-run the assessment at every major data change, at fine-tuning time, and before production launch.

---

## Quick reference — what each dimension can kill

- **Quality alone** kills: a model trained on 61% accurate labels cannot reach a 90% production accuracy target regardless of architecture.
- **Freshness alone** kills: a RAG assistant returning 18-month-old policy documents causes compliance incidents in regulated industries.
- **Sensitivity alone** kills: undisclosed PII in training data triggers GDPR enforcement and can require model retraction.
- **Provenance alone** kills: ToS-violating training data creates legal liability that surfaces at launch, not at build time.
- **Eval coverage alone** kills: a contaminated eval set produces false confidence; the production degradation is discovered only after user complaints.
