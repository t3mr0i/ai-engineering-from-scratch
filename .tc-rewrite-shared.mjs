// Shared spec for both the top-12 deep rewrite and the 30 light-touch upcycles.
// Imported by both workflow scripts.

export const TOP12 = [
  { id: 'AI-09',  dir: 'phases/11-llm-engineering/73-ai-fundamentals',                              focus: 'consultant framing of the 4 layers' },
  { id: 'AI-06',  dir: 'phases/11-llm-engineering/74-ai-concepts-and-tools-for-personal',          focus: 'daily productivity, tool choice, attention cost' },
  { id: 'RESP-01',dir: 'phases/11-llm-engineering/75-responsible-and-trustworthy-ai',              focus: 'EU AI Act in a client room' },
  { id: 'PROMPT-01',dir:'phases/11-llm-engineering/76-hands-on-prompt-engineering-workshop',        focus: 'prompts that hold up in production' },
  { id: 'USECASE-01',dir:'phases/11-llm-engineering/77-ai-use-case-identification-and-business',   focus: 'use case triage that survives contact with reality' },
  { id: 'AI-23',  dir: 'phases/11-llm-engineering/93-ai-security-and-prompt-injection-defense',     focus: 'injection failure shapes; security review checklist' },
  { id: 'AI-24',  dir: 'phases/11-llm-engineering/94-internal-knowledge-assistants-with-rag',       focus: 'RAG projects that returned the wrong doc confidently' },
  { id: 'AI-19',  dir: 'phases/11-llm-engineering/89-ai-ecosystem-and-vendor-landscape',           focus: 'vendor decision with exit costs in view' },
  { id: 'AI-26',  dir: 'phases/11-llm-engineering/96-ai-operations-and-incident-response',         focus: 'when the AI feature breaks in production' },
  { id: 'AI-21',  dir: 'phases/11-llm-engineering/91-decision-making-with-ai',                      focus: 'decisions, not outputs' },
  { id: 'AI-25',  dir: 'phases/11-llm-engineering/95-ai-vendor-and-procurement-evaluation',        focus: 'procurement evidence that bites' },
  { id: 'AI-39',  dir: 'phases/11-llm-engineering/102-ai-risk-management-and-internal-controls',    focus: 'controls an auditor will accept' },
]

// The remaining 30 (all TC courses except AI-01 + the 12 above)
export const LIGHT30_DIRS = [
  'phases/11-llm-engineering/78-ai-introduction-to-architecture-for-ai',
  'phases/11-llm-engineering/79-ai-agentic-software-engineering',
  'phases/11-llm-engineering/80-corporate-ethics-and-compliance-for-ai',
  'phases/11-llm-engineering/81-ai-driven-testing-and-qa',
  'phases/11-llm-engineering/82-ai-supported-code-modernization',
  'phases/11-llm-engineering/83-ai-assisted-documentation',
  'phases/11-llm-engineering/84-sustainable-software-and-green-coding',
  'phases/11-llm-engineering/85-ai-enhanced-user-research',
  'phases/11-llm-engineering/86-ai-and-automation-use-case-spotting',
  'phases/11-llm-engineering/87-ai-cost-and-value-economics',
  'phases/11-llm-engineering/88-consultative-prompting',
  'phases/11-llm-engineering/90-ai-workforce-strategy',
  'phases/11-llm-engineering/92-data-literacy-for-ai-projects',
  'phases/11-llm-engineering/97-ai-for-service-management-and-support',
  'phases/11-llm-engineering/98-ai-meeting-facilitation-and-workshop-design',
  'phases/11-llm-engineering/99-ai-project-reporting-and-steering',
  'phases/11-llm-engineering/100-ai-data-quality-and-master-data',
  'phases/11-llm-engineering/101-ai-process-analysis-and-automation-design',
  'phases/11-llm-engineering/103-ai-knowledge-management-and-content-governance',
  'phases/11-llm-engineering/104-ai-architecture-decision-governance',
  'phases/11-llm-engineering/105-ai-product-backlog-and-prioritization',
  'phases/11-llm-engineering/106-ai-test-data-and-synthetic-data',
  'phases/11-llm-engineering/107-ai-business-applications-erp-and-crm',
  'phases/11-llm-engineering/108-ai-cloud-data-platform-and-iot',
  'phases/11-llm-engineering/109-ai-human-review-and-approval-workflow',
  'phases/11-llm-engineering/110-ai-operating-model-and-center-of',
  'phases/11-llm-engineering/111-ai-service-desk-runbook-and-knowledge',
  'phases/11-llm-engineering/112-ai-security-review-and-threat-triage',
  'phases/11-llm-engineering/113-ai-prompt-library-governance-and-reuse',
  'phases/11-llm-engineering/114-ai-champion',
]

export const HOUSE_STYLE = `Match the repo's house style (look at phases/11-llm-engineering/70-github-copilot-daily-workflow/docs/en.md as the gold standard). Measured, direct, no emoji, no em-dash overuse, no "rule of three", no "in today's fast-paced world". English. Specific 2026 facts and numbers where honest; say "approximately" or "in our experience" if you must estimate, never invent.`

export const LESSON_GOLD_STD_REF = `phases/11-llm-engineering/70-github-copilot-daily-workflow/docs/en.md`
export const LESSON_GOLD_STD_CODE = `phases/11-llm-engineering/70-github-copilot-daily-workflow/code/main.py`
