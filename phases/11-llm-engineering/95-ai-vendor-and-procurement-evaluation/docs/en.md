# AI Vendor Evaluation: A Scoring Framework for Procurement Decisions (2026)

> The AI vendor market bifurcated sharply in 2025-2026: a small tier of frontier labs (Anthropic, Google DeepMind, OpenAI, Meta, Mistral) compete on model capability, while a broader tier of infrastructure vendors (AWS Bedrock, Azure AI Foundry, Google Vertex AI, Hugging Face Inference Endpoints) compete on data handling, compliance posture, and commercial terms. Procurement teams that evaluate only on benchmark scores are picking the wrong variable — by the time a contract closes, the lead model has typically been superseded by a newer checkpoint. The durable evaluation dimensions are the ones that are hard to change: where your data is processed, who holds the keys, what the exit path looks like, and how operating cost scales with real traffic. In 2026, the combination of EU AI Act tier-one obligations, cross-border data residency pressure from LHIND's GDPR context, and aggressive per-token pricing competition makes this a decision with meaningful downside risk if done casually.

**Type:** Learn
**Languages:** Python (stdlib — vendor scorecard engine + portfolio comparison)
**Prerequisites:** Phase 17 · 26 (Compliance frameworks), Phase 17 · 27 (FinOps for LLMs)
**Time:** ~45 minutes

## The Problem

Most AI procurement decisions in consulting contexts are made on two inputs: a live demo and a price-per-token comparison run in a spreadsheet against current traffic estimates. Both inputs are misleading. The demo uses a handpicked prompt set that does not represent production load; the cost model ignores context window growth, caching dynamics, and the latency-cost tradeoff that becomes material at scale. Six months after go-live, the team discovers that their vendor's data processing agreement forbids fine-tuning on customer data, that the audit logs required for their SOC 2 review are behind a paid add-on, or that moving to a different provider would require a six-month re-integration effort because they built against a proprietary tool-calling format.

The engineering question is not "which model scores highest on MMLU today." It is: for the specific combination of data classification, regulatory exposure, integration architecture, and expected traffic curve this client operates under, which vendor-and-deployment-model combination minimizes long-term risk while remaining commercially viable? That question has at least six independent dimensions, and collapsing them to one score is the failure mode.

## The Concept

### The six evaluation dimensions

A rigorous vendor evaluation decomposes into six dimensions that each require a separate evidence-gathering step. Weighting varies by engagement context, but none can be skipped entirely.

| Dimension | Core question | Evidence to collect |
|---|---|---|
| **Model capability** | Does the model meet the task's accuracy bar at acceptable latency? | Evals on representative production prompts; latency p50/p95 under realistic concurrency |
| **Data handling and residency** | Where is data processed, stored, and used for training? | Data Processing Agreement; DPA annex on subprocessors; region availability map |
| **Security posture** | What controls protect data in transit and at rest? | SOC 2 Type II report; ISO 27001 cert; pen-test summary; encryption key management documentation |
| **Compliance certifications** | Does the vendor's certification coverage match the client's regulatory exposure? | Cert matrix (GDPR, HIPAA, BSI C5, EU AI Act Annex III classification) |
| **Integration and lock-in risk** | How deeply does the integration couple to vendor-specific interfaces? | API surface analysis; tool-calling format compatibility; fine-tuned model portability |
| **Economics and exit planning** | What does total cost look like at 2x and 10x current traffic? | Token pricing ladder; batch vs. real-time discount; egress cost; cost of switching |

### Capability: what evals actually tell you

Benchmark scores (MMLU, HumanEval, MATH) are useful for rough positioning but should never be the primary evaluation signal in a procurement context. The reasons:

- Frontier model rankings rotate quarterly. The leader on a given benchmark in Q1 is often third or fourth by Q3.
- Production task distributions differ from benchmark distributions. A model that leads on coding benchmarks may underperform on structured extraction from German-language documents — which is what your engagement actually needs.
- Latency is a first-class dimension that benchmarks omit. Claude Sonnet 4.6 running at 40-60 tokens/second has a materially different UX from a slower model with a slightly higher accuracy score.

The right evaluation artifact is a **task-representative eval set**: 50-200 real prompts drawn from the client's actual use case, scored by a domain expert, run against the shortlisted models under realistic concurrency. This takes two to four days to build but survives vendor model updates because you re-run it, not rebuild it.

### Data handling: the GDPR and EU AI Act layer

For LHIND engagements, two frameworks shape the data handling evaluation:

**GDPR**: The data processor/controller distinction matters at the API call level. When your application sends a prompt containing personal data to a model API, the vendor is acting as a data processor. The vendor must provide a signed DPA, must name all subprocessors (GPU cloud providers, inference infrastructure), must commit to not training on your data by default, and must support data subject rights (deletion, access) through documented mechanisms. AWS Bedrock, Azure AI Foundry, and Anthropic's Enterprise API all provide compliant DPAs. Some smaller vendors do not.

**EU AI Act (in force August 2024, obligations phasing through 2026)**: General-purpose AI models with over 10^25 FLOPs of training compute are subject to Annex XI transparency obligations. Providers of these models must publish technical documentation, maintain incident registers, and implement copyright policies. When a client's application falls into a high-risk AI system category (Annex III: employment decisions, credit scoring, biometric systems, law enforcement), additional conformity assessment and human oversight requirements apply to the deploying organization — meaning your client, not just the model vendor.

The practical procurement implication: ask vendors for their EU AI Act readiness documentation, not just their GDPR compliance status. In 2026, this is a differentiator — most major providers have it; some mid-tier providers do not yet.

### Security posture: what the reports actually say

| Certification | What it covers | What it does not cover |
|---|---|---|
| SOC 2 Type II | Controls in operation over an audit period (typically 6-12 months) | Does not cover the underlying GPU cloud provider's physical security |
| ISO 27001 | Information security management system | Certificate scope matters: check whether inference APIs are in scope |
| BSI C5 | German Federal Office standard; required for German public-sector cloud | Providers: AWS, Azure, Google Cloud have C5; model API vendors vary |
| ISO 42001 | AI management system standard (2023); increasingly required | Very few model API vendors have this yet in 2026 |

The critical verification step is checking **certificate scope**. An ISO 27001 certificate for a vendor's internal IT organization does not cover the model inference API you are using. Ask for the Statement of Applicability, not just the certificate number.

For high-sensitivity deployments, also evaluate:

- **Customer-managed encryption keys (CMEK)**: Does the vendor support bringing your own key to the KMS? Required for some financial-sector clients.
- **VPC/Private Link ingress**: Can you route inference traffic over a private network endpoint rather than the public internet? AWS Bedrock and Azure AI Foundry support this; not all providers do.
- **Audit log completeness**: Does every inference call produce an audit log entry? What is the retention period? Is it exportable to your SIEM? This is the non-negotiable for any regulated client.

### Integration and lock-in

The core integration risk is building against a vendor's proprietary surface and then needing to move. The 2026 mitigation strategy is an **OpenAI-compatible API abstraction layer** — most major providers now expose an endpoint that accepts the OpenAI Chat Completions schema. Claude via `claude-3-7-sonnet-20250219` can be called through AWS Bedrock's OpenAI-compatible endpoint, reducing the blast radius of a vendor switch from "rewrite the integration" to "update the base URL and auth header."

Lock-in risk by tier:

- **Low risk**: Using a provider via an OpenAI-compatible endpoint with no fine-tuned models, no proprietary tool-calling format, no vendor-specific system prompt features.
- **Medium risk**: Fine-tuned or distilled models hosted with the vendor; proprietary tool schemas; heavy use of vendor-specific features (Anthropic's extended thinking, OpenAI Assistants thread state).
- **High risk**: Deep integration with a managed agent platform (OpenAI Assistants API, Anthropic Managed Agents), model hosting with no export path, or persistent vector store with no standard export format.

Cross-link: Phase 17 · 27 covers the cost dimension of these choices in detail. Phase 17 · 26 covers the compliance certification evidence chain.

### Economics: the three traps

Phase 17 · 27 covers FinOps for LLMs in full. Three procurement-specific traps merit attention here:

**The context window trap**: Vendors quote per-input-token and per-output-token prices. At low traffic, the input/output ratio is close to sample prompts. At production scale, system prompts, conversation history, and retrieved document chunks compound the input-token count. A vendor that looks 15% cheaper at quote time can be 40% more expensive at scale if your average context window is 4x larger than the benchmark prompt.

**The batch discount trap**: Most vendors offer significant discounts (50-80%) for batch inference with multi-hour SLAs. This is appropriate for document processing pipelines; it is not appropriate for interactive chat. Procurement proposals sometimes use batch pricing to hit a target number, then deploy to real-time endpoints at full price.

**The switching cost trap**: Migrating a fine-tuned model, a customized embedding index, and a multi-turn conversation history to a new vendor typically takes two to six months of engineering. This is not a hard cost but it is a real cost that should be factored into the TCO comparison.

### Building the scorecard

The output of a vendor evaluation should be a structured scorecard, not a prose comparison. Each dimension gets a weight (summing to 1.0) set by the client's risk profile. Each vendor gets a score (0-4) on each dimension based on documented evidence. The weighted total drives the recommendation, but the individual dimension scores surface the trade-offs transparently for stakeholder discussion.

For a regulated financial-sector client: data handling and security posture each get higher weight. For a rapid-prototype consulting internal tool: model capability and economics dominate. The code in this lesson makes this explicit and executable.

## Use It

`code/main.py` is a deterministic, stdlib-only vendor scorecard engine. It models two concepts from this lesson:

1. A **scorecard evaluator** that takes a set of vendors (with scores on the six dimensions) and a client weight profile (set by engagement context), computes weighted totals, and identifies the dimension where each vendor most diverges from the leader.
2. A **portfolio comparison** that runs the same vendors against three different client profiles (regulated enterprise, consulting internal tool, startup) and shows how the ranking shifts — making the "the right answer depends on the context" point explicit and verifiable.

The vendors and scores in the driver are illustrative but grounded in publicly available information as of early 2026.

## Ship It

`outputs/skill-vendor-scorecard.md` is a one-page decision aid: a ready-to-paste scorecard template, weight profiles for common engagement types, and a go/no-go checklist for each of the six evaluation dimensions. Bring it to the first vendor evaluation working session.

## Exercises

1. Run `code/main.py`. Which vendor leads for the regulated-enterprise profile, and which leads for the startup profile? Find the single dimension score that drives the ranking reversal between those two profiles.

2. Run `code/main.py` and examine the "divergence" output. For the regulated-enterprise winner, which dimension is its weakest relative to the second-place vendor? What evidence-gathering step would you run to close that gap before a final recommendation?

3. Your client is a German public-sector agency. Add BSI C5 certification as a hard gate (any vendor without C5 is automatically eliminated) to the scorecard logic in `code/main.py`. Which vendors survive? What does this tell you about the shortlist for that engagement type?

4. A vendor salesperson quotes you a price that looks 20% cheaper than AWS Bedrock. They used batch-inference pricing in their quote. Sketch the three questions you ask in the next five minutes to determine whether the comparison is apples-to-apples.

5. Your client's application sends customer support tickets (which may contain names and account numbers) to a model API. List the four specific documents you need from the vendor before the first non-anonymized API call is permitted under GDPR.

## Key Terms

| Term | What people say | What it actually means |
|---|---|---|
| DPA | "Data agreement" | Data Processing Agreement — the legal contract defining a vendor's obligations as a GDPR data processor |
| SOC 2 Type II | "They're SOC 2 certified" | Controls were audited in operation over a period; Type II is meaningfully stronger than Type I (design-only review) |
| BSI C5 | "German cloud standard" | Bundesamt für Sicherheit in der Informationstechnik Cloud Computing Compliance Criteria Catalogue; required for German public sector |
| EU AI Act Annex III | "High-risk AI" | Eight categories of AI systems (employment, credit, biometrics, etc.) subject to conformity assessment obligations |
| CMEK | "Bring your own key" | Customer-managed encryption keys; the customer holds the KMS key material, not the vendor |
| OpenAI-compatible endpoint | "Drop-in replacement" | An inference endpoint that accepts the OpenAI Chat Completions request schema; reduces switching cost but not lock-in from fine-tuned models |
| Subprocessor | "Third-party vendor" | An entity the primary vendor uses to process your data; must be listed in the DPA and subject to equivalent data protection obligations |
| Task-representative eval | "Custom benchmark" | An evaluation set built from real production prompts for the client's use case; the only eval that survives vendor model updates |

## Further Reading

- [Anthropic — API reference and model documentation](https://docs.claude.com) — canonical source for Claude model capabilities, pricing, and data handling terms.
- [EU AI Act official text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — the regulation itself; Annex III lists high-risk categories, Annex XI covers GPAI model transparency obligations.
- [AWS Bedrock — compliance documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html) — covers DPA, supported regions, CMEK, PrivateLink, and audit logging for the Bedrock inference API.
- [Azure AI Foundry — responsible AI and compliance](https://learn.microsoft.com/en-us/azure/ai-foundry/) — Microsoft's compliance posture, including GDPR DPA, BSI C5 coverage, and Azure OpenAI data handling commitments.
- [NIST AI RMF 1.0](https://airc.nist.gov/) — the AI Risk Management Framework; the closest US equivalent to the EU AI Act's risk categorization and the basis of many enterprise AI procurement checklists.
