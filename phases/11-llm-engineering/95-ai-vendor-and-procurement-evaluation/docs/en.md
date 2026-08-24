# AI Vendor Evaluation: Procurement Evidence That Bites (2026)

> In 2026 the AI vendor market is a two-tier system: a small frontier-lab tier (Anthropic, Google DeepMind, OpenAI, Meta, Mistral, DeepSeek) where capability and pricing move monthly, and a wider infrastructure tier (AWS Bedrock, Azure AI Foundry, Google Vertex AI, self-hosted) where data handling, compliance posture, and commercial terms are what change between proposals. The trap is evaluating on the variable that moves. By the time a procurement paper is signed, the lead model has typically been superseded by a newer checkpoint; the dimensions that survive a contract cycle are the hard-to-change ones: data residency, key custody, exit path, and how operating cost scales with real production traffic. In an LHIND GDPR context layered with EU AI Act tier-one obligations, a casual evaluation is a decision with a six-figure downside — not because the model was wrong, but because the procurement evidence was thin.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 17 · 26 (Compliance frameworks), Phase 17 · 27 (FinOps for LLMs)
**Time:** ~50 minutes

## Learning Objectives

- Explain the production problem addressed by AI Vendor Evaluation: Procurement Evidence That Bites (2026)
- Apply the lesson's decision or implementation workflow to a concrete case
- Measure quality, cost, latency, and risk with explicit acceptance criteria
- Identify failure modes and define a safe rollback or review path

## What the 2026 market actually looks like

The market has settled into a working topology that you should be able to price from memory at the start of an evaluation. The figures below are approximate as of early 2026 and drift monthly; re-quote at the start of every engagement.

- **Illustrative assumptions — replace every figure with dated vendor quotes before procurement. Frontier API, real-time, input**: roughly $3-4 per million tokens (Sonnet 4.6-class, GPT-4o-class). Cheaper "mini" tiers at roughly $0.20-0.40.
- **Frontier API, real-time, output**: roughly $15-18 per million tokens. Output is 4-6x input across the frontier tier.
- **Self-hosted open weights, marginal cost at scale**: roughly $0.50-1.50 per million tokens once you include amortised GPU, networking, and ops; the upfront GPU bill is the real cost (eight H100s for a production-grade deployment sit in the $250-400K capex range, depending on vendor and memory configuration).
- **Batch inference discount**: 50-80% off the real-time list, with an SLA measured in hours (typically 4-24 hours; tightening in 2026). Not a candidate for interactive workloads.
- **Eval set sizing**: 50 prompts catches roughly 80% of the capability gap in our experience; 200 prompts catches roughly 95%. Below 50 you are ranking noise; above 200 you are in diminishing returns unless the task distribution is bimodal.
- **Cert currency**: SOC 2 Type II reports cover 6-12 month audit windows. A report older than 12 months needs a bridge letter to be procurement-grade; a Type I report (point-in-time design review) is not sufficient for regulated engagements.

The procurement trap is not that the numbers are wrong; the numbers are roughly right. The trap is that the spreadsheet you build the comparison in is allowed to assume a workload the deployment will not have.

## The Problem

Most AI procurement decisions in consulting contexts are made on two inputs: a live demo and a price-per-token comparison run in a spreadsheet against current traffic estimates. Both inputs are misleading. The demo uses a handpicked prompt set that does not represent production load; the cost model ignores context window growth, caching dynamics, and the latency-cost tradeoff that becomes material at scale. Six months after go-live, the team discovers that their vendor's data processing agreement forbids fine-tuning on customer data, that the audit logs required for their SOC 2 review are behind a paid add-on, or that moving to a different provider would require a six-month re-integration effort because they built against a proprietary tool-calling format.

The engineering question is not "which model scores highest on MMLU today." It is: for the specific combination of data classification, regulatory exposure, integration architecture, and expected traffic curve this client operates under, which vendor-and-deployment-model combination minimizes long-term risk while remaining commercially viable? That question has at least six independent dimensions, and collapsing them to one score is the failure mode.

### The demo-data disqualification

The contract reviewer at a mid-sized insurer evaluated three vendors for a claims-triage RAG in 2025. Vendor C scored highest on a custom eval set the team built from 200 anonymized claims — 87% accuracy, 12% over Vendor A, 6% over Vendor B. The recommendation memo went to procurement. The legal team then read the DPA. Vendor C's DPA included a clause permitting the vendor to use customer prompts for model improvement unless the customer explicitly opted out via a paid enterprise add-on (roughly 30% above the quoted price). The insurer's data classification policy forbids that class of opt-out by default — the only acceptable answer was "no training on customer data, period, in the DPA." Vendor C was disqualified eight hours before contract signing. The fallback to Vendor A cost six weeks of project delay and approximately 180,000 EUR in unbilled consulting time. The lesson: capability is the visible layer; the disqualification lives in the documents that scorecards do not read.

## The Concept

### The six evaluation dimensions

A rigorous vendor evaluation decomposes into six dimensions that each require a separate evidence-gathering step. Weighting varies by engagement context, but none can be skipped entirely.

| Dimension | Core question | Evidence to collect |
|---|---|---|
| **Model capability** | Does the model meet the task's accuracy bar at acceptable latency? | Evals on representative production prompts; latency p50/p95 under realistic concurrency |
| **Data handling and residency** | Where is data processed, stored, and used for training? | Signed Data Processing Agreement; DPA annex on subprocessors; region availability map |
| **Security posture** | What controls protect data in transit and at rest? | SOC 2 Type II report; ISO 27001 cert; pen-test summary; encryption key management documentation |
| **Compliance certifications** | Does the vendor's certification coverage match the client's regulatory exposure? | Cert matrix (GDPR, HIPAA, BSI C5, EU AI Act Annex III classification) |
| **Integration and lock-in risk** | How deeply does the integration couple to vendor-specific interfaces? | API surface analysis; tool-calling format compatibility; fine-tuned model portability |
| **Economics and exit planning** | What does total cost look like at 2x and 10x current traffic? | Token pricing ladder; batch vs. real-time discount; egress cost; cost of switching |

The hard-gate layer sits *above* the scorecard. A vendor that scores 4/4 on capability but fails to provide a signed DPA is disqualified, not penalised. Scorecards rank; gates filter.

### Capability: what evals actually tell you

Benchmark scores (MMLU, HumanEval, MATH) are useful for rough positioning but should never be the primary evaluation signal in a procurement context. The reasons:

- Frontier model rankings rotate quarterly. The leader on a given benchmark in Q1 is often third or fourth by Q3. In 2026, the same vendor can release three checkpoints in a procurement window, so any scorecard locked to a model name is a moving target.
- Production task distributions differ from benchmark distributions. A model that leads on coding benchmarks may underperform on structured extraction from German-language documents — which is what your engagement actually needs.
- Latency is a first-class dimension that benchmarks omit. Sonnet 4.6 running at 40-60 tokens/second has a materially different UX from a slower model with a slightly higher accuracy score. For interactive chat the latency ceiling is roughly 300 ms to first token; for batch document processing it is hours.

The right evaluation artefact is a **task-representative eval set**: 50-200 real prompts drawn from the client's actual use case, scored by a domain expert, run against the shortlisted models under realistic concurrency. This takes two to four days to build but survives vendor model updates because you re-run it, not rebuild it. In our experience, the 50-prompt eval set catches roughly 80% of the capability gap; the additional 150 prompts are diminishing returns unless the task distribution is bimodal.

### Data handling: the GDPR and EU AI Act layer

For LHIND engagements, two frameworks shape the data handling evaluation:

**GDPR**: The data processor/controller distinction matters at the API call level. When your application sends a prompt containing personal data to a model API, the vendor is acting as a data processor. The vendor must provide a signed DPA, must name all subprocessors (GPU cloud providers, inference infrastructure), must commit to not training on your data by default, and must support data subject rights (deletion, access) through documented mechanisms. AWS Bedrock, Azure AI Foundry, and the major frontier-lab Enterprise APIs all provide compliant DPAs. Some smaller vendors do not. A signed DPA is a hard gate for any non-anonymized call.

**EU AI Act (in force August 2024, high-risk obligations phasing through 2028 per Regulation (EU) 2026/1744)**: All general-purpose AI model providers must publish the Annex XI technical documentation and implement copyright policies (Art. 53). Models trained with more than 10^25 FLOPs of compute are presumed to carry systemic risk (Art. 51(2)), and their providers take on additional obligations — model evaluation, serious-incident tracking, and cybersecurity measures (Art. 55). When a client's application falls into a high-risk AI system category (Annex III: employment decisions, credit scoring, biometric systems, law enforcement), additional conformity assessment and human oversight requirements apply to the deploying organization — meaning your client, not just the model vendor.

The practical procurement implication: ask vendors for their EU AI Act readiness documentation, not just their GDPR compliance status. In 2026, this is a differentiator — most major providers have it; some mid-tier providers do not yet.

### Security posture: what the reports actually say

| Certification | What it covers | What it does not cover |
|---|---|---|
| **SOC 2 Type II** | Controls in operation over an audit period (typically 6-12 months) | Does not cover the underlying GPU cloud provider's physical security |
| **ISO 27001** | Information security management system | Certificate scope matters: check whether inference APIs are in scope |
| **BSI C5** | German Federal Office standard; required for German public-sector cloud | Some mid-tier model vendors are not certified even if the cloud they sit on is |
| **ISO 42001** | AI management system standard (2023); increasingly required | Very few model API vendors have this yet in 2026 |

### The Statement of Applicability gap

The mid-sized logistics firm shortlisting for a CRM RAG had an ISO 27001-certified vendor on the list. The procurement paper cited the certification. The privacy officer then read the Statement of Applicability (SoA): the certificate covered the vendor's internal IT, payroll, and corporate SaaS use. The SoA explicitly excluded the model inference API because that service line had launched nine months after the most recent audit. The vendor was technically accurate in claiming ISO 27001 certification and substantively wrong in implying that the certification covered the API the client would actually call. The fix was a six-week re-audit commitment from the vendor; the client accepted a bridge letter instead and added a contractual obligation to deliver the refreshed certificate within twelve months.

The critical verification step is checking **certificate scope**. An ISO 27001 certificate for a vendor's internal IT organization does not cover the model inference API you are using. Ask for the Statement of Applicability, not just the certificate number. For high-sensitivity deployments, also evaluate:

- **Customer-managed encryption keys (CMEK)**: Does the vendor support bringing your own key to the KMS? Required for some financial-sector clients.
- **VPC/Private Link ingress**: Can you route inference traffic over a private network endpoint rather than the public internet? AWS Bedrock and Azure AI Foundry support this; not all providers do.
- **Audit log completeness**: Does every inference call produce an audit log entry? What is the retention period? Is it exportable to your SIEM? This is the non-negotiable for any regulated client.

### Integration and lock-in

The core integration risk is building against a vendor's proprietary surface and then needing to move. The 2026 mitigation strategy is an **OpenAI-compatible API abstraction layer** — most major providers now expose an endpoint that accepts the OpenAI Chat Completions schema. Claude can be called through AWS Bedrock's OpenAI-compatible endpoint, reducing the blast radius of a vendor switch from "rewrite the integration" to "update the base URL and auth header."

Lock-in risk by tier:

- **Low risk**: Using a provider via an OpenAI-compatible endpoint with no fine-tuned models, no proprietary tool-calling format, no vendor-specific system prompt features.
- **Medium risk**: Fine-tuned or distilled models hosted with the vendor; proprietary tool schemas; heavy use of vendor-specific features (extended thinking, Assistants thread state).
- **High risk**: Deep integration with a managed agent platform, model hosting with no export path, or persistent vector store with no standard export format.

### Switching cost: the number, not the platitude

"We can always switch later" is the sentence that costs projects. A working estimate for an LHIND-scale engagement, in our experience:

- **Low-risk switch (OpenAI-compatible endpoint, no fine-tuning)**: 2-4 weeks of engineering. Re-integration is config; re-eval is the new model run against the existing eval set; data export is a standard dump.
- **Medium-risk switch (fine-tuned model, proprietary tool schema, vendor-specific features in production)**: 8-16 weeks. Re-integration touches the call sites that used the proprietary schema; re-eval must rebuild the prompt-template variant of the eval set; fine-tuned weights need export, re-validation, and possibly re-fine-tuning on the new platform.
- **High-risk switch (managed agent platform, vendor-locked vector store, or no standard export path)**: 20-30 weeks. Architecture-level changes; data export may need bespoke engineering; eval set may need to be rebuilt because the old prompts were tuned to the old platform's quirks.

These ranges are why the fine-tuning tax story above is not a hypothetical. A team that fine-tunes for an 8-12 point accuracy lift, then needs to switch, is making a 3-6 month engineering commitment they did not budget for at the time the fine-tune was approved.

### The fine-tuning tax

A public-sector team in the LHIND portfolio built a German-language classification model fine-tuned against a vendor's hosted offering in 2024. The fine-tuning improved task accuracy by roughly 11 percentage points and looked defensible at the time. In 2026 they needed to switch providers for data residency reasons. The vendor confirmed that fine-tuned weights would be exported, but the export arrived in a non-standard format, the new provider's serving stack required re-validation, and the eval set that originally scored the model had drifted out of relevance. The "two-week migration" the team had budgeted became a five-month project with an estimated cost of approximately 320,000 EUR. The lesson: estimate switching cost *before* the fine-tune, using a real integration abstraction layer, not after.

### Economics: the three traps

Phase 17 · 27 covers FinOps for LLMs in full. Three procurement-specific traps merit attention here:

**The context window trap**: Vendors quote per-input-token and per-output-token prices. At low traffic, the input/output ratio is close to sample prompts. At production scale, system prompts, conversation history, and retrieved document chunks compound the input-token count. A vendor that looks 15% cheaper at quote time can be 40% more expensive at scale if your average context window is 4x larger than the benchmark prompt. As a working number: Sonnet 4.6-class real-time input pricing sits in the $3-4 per million tokens range, output around $15-18; closed-weight GPT-4o-class is comparable; open-weight self-hosted at scale can land in the $0.50-1.50 range once you include infra, but the upfront GPU cost is real. These figures drift monthly — always re-quote.

**The batch discount trap**: Most vendors offer significant discounts (50-80%) for batch inference with multi-hour SLAs. This is appropriate for document processing pipelines; it is not appropriate for interactive chat. Procurement proposals sometimes use batch pricing to hit a target number, then deploy to real-time endpoints at full price. The batch discount is also a moving target; in 2026 several vendors tightened batch SLAs from 24 hours to 4-6 hours, narrowing the use case.

**The switching cost trap**: Migrating a fine-tuned model, a customized embedding index, and a multi-turn conversation history to a new vendor typically takes two to six months of engineering. This is not a hard cost but it is a real cost that should be factored into the TCO comparison.

### Building the scorecard

The output of a vendor evaluation should be a structured scorecard, not a prose comparison. Each dimension gets a weight (summing to 1.0) set by the client's risk profile. Each vendor gets a score (0-4) on each dimension based on documented evidence. The weighted total drives the recommendation, but the individual dimension scores surface the trade-offs transparently for stakeholder discussion. A scorecard without a hard-gate step is not a procurement artefact; it is a benchmark.

For a regulated financial-sector client: data handling and security posture each get higher weight. For a rapid-prototype consulting internal tool: model capability and economics dominate. The code in this lesson makes this explicit and executable — and demonstrates what happens when the gate step is skipped.

### What goes in the procurement paper

A defensible procurement paper has four sections, in order, each answering one question:

1. **The gate log** — which vendors were disqualified, at which gate, with the document that proved or disproved the gate. This is the section that protects you when the disqualified vendor's salesperson calls your CIO. Without it, the conversation is opinion.
2. **The scorecard** — completed with weights, raw scores, weighted totals, and the per-vendor divergence from the leader. Include the profile used and the rationale for the weights; the profile is the most contestable part of the paper, so it has to be defensible in a stakeholder meeting.
3. **The cost-trap re-quote** — each shortlisted vendor's quoted monthly cost vs the effective monthly cost at the production traffic profile. Include context-window growth and the deployment SLA. The trap rows are the most important cells in the paper.
4. **The recommendation memo** — recommended vendor, profile used, top three risks, switching-cost estimate. A good memo is one page; a long memo is a sign that the author is hedging.

A paper that leads with the scorecard and treats the gate log as an appendix has the analysis backwards. The gate log is the section that survives a compliance audit; the scorecard is the section that survives a stakeholder meeting.



## Further Reading

- [Anthropic — API reference and model documentation](https://docs.claude.com) — canonical source for Claude model capabilities, pricing, and data handling terms.
- [EU AI Act official text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) — the regulation itself; Annex III lists high-risk categories, Annex XI covers GPAI model transparency obligations.
- [AWS Bedrock — compliance documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html) — covers DPA, supported regions, CMEK, PrivateLink, and audit logging for the Bedrock inference API.
- [Azure AI Foundry — responsible AI and compliance](https://learn.microsoft.com/en-us/azure/ai-foundry/) — Microsoft's compliance posture, including GDPR DPA, BSI C5 coverage, and Azure OpenAI data handling commitments.
- [NIST AI RMF 1.0](https://airc.nist.gov/) — the AI Risk Management Framework; the closest US equivalent to the EU AI Act's risk categorization and the basis of many enterprise AI procurement checklists.
