window.LrnCurriculumMap = {
  source: "AI Engineering from Scratch curriculum",
  note: "Curated subset: use the lessons that fit LHIND LRN role courses, combine overlapping lessons into subcourses, omit deep model-training or modality-specific material unless it directly supports the role course.",
  courseMaps: {
    "AI-09": [
      {
        title: "AI literacy and terminology",
        decision: "core",
        note: "Shortens broad AI foundations into a business-readable entry path.",
        lessons: [
          { path: "phases/02-ml-fundamentals/01-what-is-machine-learning", title: "What Is Machine Learning" },
          { path: "phases/08-generative-ai/01-generative-models-taxonomy-history", title: "Generative Models — Taxonomy & History" },
          { path: "phases/07-transformers-deep-dive/01-why-transformers", title: "Why Transformers" },
          { path: "phases/10-llms-from-scratch/14-open-models-architecture-walkthroughs", title: "Open Models: Architecture Walkthroughs" }
        ]
      },
      {
        title: "Evidence, limits and quality",
        decision: "core",
        note: "Keeps evaluation literacy without pulling learners into implementation-heavy math.",
        lessons: [
          { path: "phases/02-ml-fundamentals/09-model-evaluation", title: "Model Evaluation" },
          { path: "phases/02-ml-fundamentals/10-bias-variance", title: "Bias-Variance Tradeoff" },
          { path: "phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks", title: "LLM Evaluation — RAGAS, DeepEval, G-Eval" }
        ]
      },
      {
        title: "Responsible AI baseline",
        decision: "core",
        note: "Baseline governance content for all employees.",
        lessons: [
          { path: "phases/11-llm-engineering/12-guardrails", title: "Guardrails, Safety & Content Filtering" },
          { path: "phases/18-ethics-safety-alignment/20-bias-representational-harm", title: "Bias and Representational Harm in LLMs" },
          { path: "phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea", title: "Regulatory Frameworks — EU, US, UK, Korea" },
          { path: "phases/18-ethics-safety-alignment/26-model-system-dataset-cards", title: "Model, System, and Dataset Cards" }
        ]
      }
    ],
    "AI-06": [
      {
        title: "Prompting foundations",
        decision: "core",
        note: "Turns the technical prompting lessons into productivity routines.",
        lessons: [
          { path: "phases/11-llm-engineering/01-prompt-engineering", title: "Prompt Engineering: Techniques & Patterns" },
          { path: "phases/11-llm-engineering/02-few-shot-cot", title: "Few-Shot, Chain-of-Thought, Tree-of-Thought" },
          { path: "phases/11-llm-engineering/03-structured-outputs", title: "Structured Outputs: JSON, Schema Validation, Constrained Decoding" }
        ]
      },
      {
        title: "Context and retrieval for daily work",
        decision: "core",
        note: "Useful for SharePoint, internal knowledge bases and document-heavy workflows.",
        lessons: [
          { path: "phases/11-llm-engineering/05-context-engineering", title: "Context Engineering" },
          { path: "phases/11-llm-engineering/06-rag", title: "RAG (Retrieval-Augmented Generation)" },
          { path: "phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag", title: "Chunking Strategies for RAG" }
        ]
      },
      {
        title: "Tool-assisted productivity",
        decision: "condense",
        note: "Combines tool-use theory into practical assistant usage.",
        lessons: [
          { path: "phases/13-tools-and-protocols/01-the-tool-interface", title: "The Tool Interface" },
          { path: "phases/13-tools-and-protocols/02-function-calling-deep-dive", title: "Function Calling Deep Dive" },
          { path: "phases/11-llm-engineering/09-function-calling", title: "Function Calling & Tool Use" }
        ]
      }
    ],
    "RESP-01": [
      {
        title: "Guardrails and prompt-injection risk",
        decision: "core",
        note: "Relevant for every role using enterprise AI tools.",
        lessons: [
          { path: "phases/11-llm-engineering/18-responsible-ai-compliance-workflow", title: "Responsible AI Compliance Workflow" },
          { path: "phases/11-llm-engineering/12-guardrails", title: "Guardrails, Safety & Content Filtering" },
          { path: "phases/18-ethics-safety-alignment/15-indirect-prompt-injection", title: "Indirect Prompt Injection" },
          { path: "phases/14-agent-engineering/27-prompt-injection-defense", title: "Prompt Injection and the PVE Defense" }
        ]
      },
      {
        title: "Compliance and security controls",
        decision: "core",
        note: "Maps GDPR, auditability and enterprise control language into the LRN course.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/25-security-secrets-audit", title: "Security — Secrets, API Key Rotation, Audit Logs, Guardrails" },
          { path: "phases/17-infrastructure-and-production/26-compliance-frameworks", title: "Compliance — SOC 2, HIPAA, GDPR, PCI-DSS, EU AI Act, ISO 42001" },
          { path: "phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea", title: "Regulatory Frameworks — EU, US, UK, Korea" }
        ]
      },
      {
        title: "Fairness and data governance",
        decision: "core",
        note: "Keeps the governance piece practical and auditable.",
        lessons: [
          { path: "phases/18-ethics-safety-alignment/20-bias-representational-harm", title: "Bias and Representational Harm in LLMs" },
          { path: "phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual", title: "Fairness Criteria" },
          { path: "phases/18-ethics-safety-alignment/27-data-provenance-training-governance", title: "Data Provenance and Training-Data Governance" },
          { path: "phases/18-ethics-safety-alignment/26-model-system-dataset-cards", title: "Model, System, and Dataset Cards" }
        ]
      }
    ],
    "PROMPT-01": [
      {
        title: "Prompt patterns and output contracts",
        decision: "core",
        note: "Hands-on prompt clinic foundation.",
        lessons: [
          { path: "phases/11-llm-engineering/31-hands-on-prompt-clinic", title: "Hands-on Prompt Clinic" },
          { path: "phases/11-llm-engineering/01-prompt-engineering", title: "Prompt Engineering: Techniques & Patterns" },
          { path: "phases/11-llm-engineering/02-few-shot-cot", title: "Few-Shot, Chain-of-Thought, Tree-of-Thought" },
          { path: "phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding", title: "Structured Outputs & Constrained Decoding" }
        ]
      },
      {
        title: "Schemas, tools and validation",
        decision: "core",
        note: "Useful when prompts must produce reliable business artifacts.",
        lessons: [
          { path: "phases/11-llm-engineering/03-structured-outputs", title: "Structured Outputs: JSON, Schema Validation, Constrained Decoding" },
          { path: "phases/13-tools-and-protocols/04-structured-output", title: "Structured Output — JSON Schema, Pydantic, Zod" },
          { path: "phases/13-tools-and-protocols/05-tool-schema-design", title: "Tool Schema Design" }
        ]
      },
      {
        title: "Review and verification",
        decision: "condense",
        note: "Condenses agent-workbench rigor into prompt QA exercises.",
        lessons: [
          { path: "phases/14-agent-engineering/33-instructions-as-executable-constraints", title: "Agent Instructions as Executable Constraints" },
          { path: "phases/14-agent-engineering/38-verification-gates", title: "Verification Gates" },
          { path: "phases/14-agent-engineering/39-reviewer-agent", title: "Reviewer Agent" }
        ]
      }
    ],
    "AI-04": [
      {
        title: "Requirements as structured artifacts",
        decision: "core",
        note: "Maps requirement engineering to structured prompts, schemas and task specs.",
        lessons: [
          { path: "phases/11-llm-engineering/03-structured-outputs", title: "Structured Outputs: JSON, Schema Validation, Constrained Decoding" },
          { path: "phases/13-tools-and-protocols/05-tool-schema-design", title: "Tool Schema Design" },
          { path: "phases/19-capstone-projects/70-task-spec-format", title: "Task Spec Format" }
        ]
      },
      {
        title: "Context, scope and acceptance",
        decision: "core",
        note: "Turns AI-assisted requirements into reviewable delivery inputs.",
        lessons: [
          { path: "phases/11-llm-engineering/05-context-engineering", title: "Context Engineering" },
          { path: "phases/14-agent-engineering/36-scope-contracts", title: "Scope Contracts and Task Boundaries" },
          { path: "phases/14-agent-engineering/38-verification-gates", title: "Verification Gates" },
          { path: "phases/14-agent-engineering/39-reviewer-agent", title: "Reviewer Agent" }
        ]
      },
      {
        title: "Living specifications",
        decision: "optional",
        note: "Advanced continuation for teams moving toward executable specs.",
        lessons: [
          { path: "phases/13-tools-and-protocols/10-mcp-resources-and-prompts", title: "MCP Resources and Prompts" },
          { path: "phases/19-capstone-projects/21-tool-registry-schema-validation", title: "Tool Registry with Schema Validation" },
          { path: "phases/19-capstone-projects/25-verification-gates-observation-budget", title: "Verification Gates and Observation Budget" }
        ]
      }
    ],
    "USECASE-01": [
      {
        title: "Use-case triage and feasibility",
        decision: "core",
        note: "Helps teams separate feasible AI work from automation wish lists.",
        lessons: [
          { path: "phases/11-llm-engineering/32-ai-use-case-identification-workshop", title: "AI Use Case Identification Workshop" },
          { path: "phases/02-ml-fundamentals/01-what-is-machine-learning", title: "What Is Machine Learning" },
          { path: "phases/02-ml-fundamentals/09-model-evaluation", title: "Model Evaluation" },
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" }
        ]
      },
      {
        title: "Cost and value economics",
        decision: "core",
        note: "Maps the business-value side of use-case selection.",
        lessons: [
          { path: "phases/11-llm-engineering/11-caching-cost", title: "Caching, Rate Limiting & Cost Optimization" },
          { path: "phases/17-infrastructure-and-production/14-prompt-semantic-caching", title: "Prompt Caching and Semantic Caching Economics" },
          { path: "phases/17-infrastructure-and-production/16-model-routing", title: "Model Routing as a Cost-Reduction Primitive" },
          { path: "phases/17-infrastructure-and-production/27-finops-llms", title: "FinOps for LLMs" }
        ]
      },
      {
        title: "Pilot, measure, scale",
        decision: "core",
        note: "Keeps pilots accountable and measurable.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/20-shadow-canary-progressive", title: "Shadow Traffic, Canary Rollout, and Progressive Deployment" },
          { path: "phases/17-infrastructure-and-production/21-ab-testing-llm-features", title: "A/B Testing LLM Features" },
          { path: "phases/15-autonomous-systems/13-cost-governors", title: "Action Budgets, Iteration Caps, and Cost Governors" }
        ]
      }
    ],
    "AI-05": [
      {
        title: "AI project planning patterns",
        decision: "core",
        note: "PM/PO path for turning AI work into planned delivery.",
        lessons: [
          { path: "phases/14-agent-engineering/02-rewoo-plan-and-execute", title: "ReWOO and Plan-and-Execute" },
          { path: "phases/14-agent-engineering/12-anthropic-workflow-patterns", title: "Anthropic's Workflow Patterns" },
          { path: "phases/14-agent-engineering/28-orchestration-patterns", title: "Orchestration Patterns" }
        ]
      },
      {
        title: "Quality gates and acceptance",
        decision: "core",
        note: "Replaces manual progress thinking with testable completion criteria.",
        lessons: [
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" },
          { path: "phases/14-agent-engineering/30-eval-driven-agent-development", title: "Eval-Driven Agent Development" },
          { path: "phases/19-capstone-projects/25-verification-gates-observation-budget", title: "Verification Gates and Observation Budget" }
        ]
      },
      {
        title: "Rollout and product learning",
        decision: "core",
        note: "For roadmap, pilots, stakeholder communication and go-live decisions.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/20-shadow-canary-progressive", title: "Shadow Traffic, Canary Rollout, and Progressive Deployment" },
          { path: "phases/17-infrastructure-and-production/21-ab-testing-llm-features", title: "A/B Testing LLM Features" },
          { path: "phases/19-capstone-projects/70-task-spec-format", title: "Task Spec Format" }
        ]
      }
    ],
    "CHANGE-01": [
      {
        title: "Human-in-the-loop operating model",
        decision: "core",
        note: "Change module for accountable adoption rather than blind automation.",
        lessons: [
          { path: "phases/11-llm-engineering/33-ai-change-management-team-integration", title: "AI Change Management and Team Integration" },
          { path: "phases/15-autonomous-systems/15-propose-then-commit", title: "Human-in-the-Loop: Propose-Then-Commit" },
          { path: "phases/15-autonomous-systems/16-checkpoints-rollback", title: "Checkpoints and Rollback" },
          { path: "phases/14-agent-engineering/26-failure-modes-agentic", title: "Failure Modes: Why Agents Break" }
        ]
      },
      {
        title: "Team roles and handoff",
        decision: "core",
        note: "Maps AI adoption to responsibility and team interfaces.",
        lessons: [
          { path: "phases/16-multi-agent-and-swarms/08-role-specialization", title: "Role Specialization" },
          { path: "phases/14-agent-engineering/40-multi-session-handoff", title: "Multi-Session Handoff" },
          { path: "phases/14-agent-engineering/41-workbench-for-real-repos", title: "The Workbench on a Real Repo" }
        ]
      }
    ],
    "AI-01": [
      {
        title: "AI-assisted coding workflow",
        decision: "core",
        note: "Useful for Copilot/Cursor-style workflows without overloading with model internals.",
        lessons: [
          { path: "phases/11-llm-engineering/01-prompt-engineering", title: "Prompt Engineering: Techniques & Patterns" },
          { path: "phases/14-agent-engineering/06-tool-use-and-function-calling", title: "Tool Use and Function Calling" },
          { path: "phases/15-autonomous-systems/09-coding-agent-landscape", title: "The Autonomous Coding Agent Landscape" },
          { path: "phases/15-autonomous-systems/10-claude-code-permission-modes", title: "Claude Code Permission Modes and Auto Mode" }
        ]
      },
      {
        title: "Engineering workbench discipline",
        decision: "core",
        note: "Maps the curriculum's agent-workbench lessons into day-to-day engineering practice.",
        lessons: [
          { path: "phases/14-agent-engineering/31-agent-workbench-why-models-fail", title: "Agent Workbench Engineering" },
          { path: "phases/14-agent-engineering/32-minimal-agent-workbench", title: "The Minimal Agent Workbench" },
          { path: "phases/14-agent-engineering/33-instructions-as-executable-constraints", title: "Agent Instructions as Executable Constraints" },
          { path: "phases/14-agent-engineering/34-repo-memory-and-state", title: "Repo Memory and Durable State" },
          { path: "phases/14-agent-engineering/38-verification-gates", title: "Verification Gates" }
        ]
      },
      {
        title: "Testing AI-assisted code",
        decision: "core",
        note: "Prevents AI-assisted coding from becoming unchecked code generation.",
        lessons: [
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" },
          { path: "phases/14-agent-engineering/39-reviewer-agent", title: "Reviewer Agent" },
          { path: "phases/19-capstone-projects/27-eval-harness-fixture-tasks", title: "Eval Harness with Fixture Tasks" }
        ]
      }
    ],
    "AI-03": [
      {
        title: "AI system architecture",
        decision: "core",
        note: "Core architecture view without forcing everyone through from-scratch model training.",
        lessons: [
          { path: "phases/10-llms-from-scratch/03-data-pipelines", title: "Data Pipelines for Pre-Training" },
          { path: "phases/11-llm-engineering/13-production-app", title: "Building a Production LLM Application" },
          { path: "phases/17-infrastructure-and-production/01-managed-llm-platforms", title: "Managed LLM Platforms" },
          { path: "phases/17-infrastructure-and-production/28-self-hosted-serving-selection", title: "Self-Hosted Serving Selection" }
        ]
      },
      {
        title: "Protocols and integration",
        decision: "core",
        note: "For architects integrating agents, tools and enterprise systems.",
        lessons: [
          { path: "phases/11-llm-engineering/14-model-context-protocol", title: "Model Context Protocol (MCP)" },
          { path: "phases/13-tools-and-protocols/06-mcp-fundamentals", title: "MCP Fundamentals" },
          { path: "phases/13-tools-and-protocols/07-building-an-mcp-server", title: "Building an MCP Server" },
          { path: "phases/13-tools-and-protocols/17-mcp-gateways-and-registries", title: "MCP Gateways and Registries" },
          { path: "phases/17-infrastructure-and-production/19-ai-gateways", title: "AI Gateways" }
        ]
      },
      {
        title: "Production readiness",
        decision: "core",
        note: "Operational pieces needed before enterprise rollout.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/08-inference-metrics-goodput", title: "Inference Metrics" },
          { path: "phases/17-infrastructure-and-production/13-llm-observability", title: "LLM Observability Stack Selection" },
          { path: "phases/17-infrastructure-and-production/25-security-secrets-audit", title: "Security — Secrets, API Key Rotation, Audit Logs, Guardrails" },
          { path: "phases/17-infrastructure-and-production/26-compliance-frameworks", title: "Compliance Frameworks" }
        ]
      }
    ],
    "AI-02": [
      {
        title: "Agent fundamentals",
        decision: "core",
        note: "Primary agentic software engineering path.",
        lessons: [
          { path: "phases/14-agent-engineering/01-the-agent-loop", title: "The Agent Loop" },
          { path: "phases/14-agent-engineering/02-rewoo-plan-and-execute", title: "ReWOO and Plan-and-Execute" },
          { path: "phases/14-agent-engineering/03-reflexion-verbal-rl", title: "Reflexion" },
          { path: "phases/14-agent-engineering/04-tree-of-thoughts-lats", title: "Tree of Thoughts and LATS" },
          { path: "phases/14-agent-engineering/06-tool-use-and-function-calling", title: "Tool Use and Function Calling" }
        ]
      },
      {
        title: "Frameworks and production agent design",
        decision: "core",
        note: "Maps directly to agentic system implementation choices.",
        lessons: [
          { path: "phases/14-agent-engineering/13-langgraph-stateful-graphs", title: "LangGraph: Stateful Graphs and Durable Execution" },
          { path: "phases/14-agent-engineering/16-openai-agents-sdk", title: "OpenAI Agents SDK" },
          { path: "phases/14-agent-engineering/17-claude-agent-sdk", title: "Claude Agent SDK" },
          { path: "phases/14-agent-engineering/29-production-runtimes", title: "Production Runtimes" },
          { path: "phases/15-autonomous-systems/12-durable-execution", title: "Long-Running Background Agents" }
        ]
      },
      {
        title: "Agent harness and verification",
        decision: "condense",
        note: "Condenses the capstone harness lessons into the advanced agentic course.",
        lessons: [
          { path: "phases/19-capstone-projects/20-agent-harness-loop-contract", title: "Agent Harness Loop Contract" },
          { path: "phases/19-capstone-projects/21-tool-registry-schema-validation", title: "Tool Registry with Schema Validation" },
          { path: "phases/19-capstone-projects/23-function-call-dispatcher", title: "Function Call Dispatcher" },
          { path: "phases/19-capstone-projects/24-plan-execute-control-flow", title: "Plan-Execute Control Flow" },
          { path: "phases/19-capstone-projects/29-end-to-end-coding-task-demo", title: "End-to-End Coding Agent on the Harness" }
        ]
      }
    ],
    "AI-07": [
      {
        title: "Decision quality and model evaluation",
        decision: "core",
        note: "Decision-making content grounded in measurement, not AI hype.",
        lessons: [
          { path: "phases/02-ml-fundamentals/09-model-evaluation", title: "Model Evaluation" },
          { path: "phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks", title: "LLM Evaluation — RAGAS, DeepEval, G-Eval" },
          { path: "phases/10-llms-from-scratch/10-evaluation", title: "Evaluation: Benchmarks, Evals, LM Harness" },
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" }
        ]
      },
      {
        title: "Metrics, calibration and uncertainty",
        decision: "core",
        note: "Useful for leaders reading AI performance claims.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/08-inference-metrics-goodput", title: "Inference Metrics" },
          { path: "phases/19-capstone-projects/71-classical-metrics", title: "Classical Metrics" },
          { path: "phases/19-capstone-projects/73-perplexity-calibration", title: "Perplexity and Calibration" },
          { path: "phases/19-capstone-projects/74-leaderboard-aggregation", title: "Leaderboard Aggregation" }
        ]
      },
      {
        title: "Bias-aware decisions",
        decision: "core",
        note: "Required for decision making with AI in business contexts.",
        lessons: [
          { path: "phases/18-ethics-safety-alignment/20-bias-representational-harm", title: "Bias and Representational Harm in LLMs" },
          { path: "phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual", title: "Fairness Criteria" },
          { path: "phases/18-ethics-safety-alignment/26-model-system-dataset-cards", title: "Model, System, and Dataset Cards" }
        ]
      }
    ],
    "AI-08": [
      {
        title: "AI strategy and operating model",
        decision: "core",
        note: "Leadership view across platform, economics and risk.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/01-managed-llm-platforms", title: "Managed LLM Platforms" },
          { path: "phases/17-infrastructure-and-production/02-inference-platform-economics", title: "Inference Platform Economics" },
          { path: "phases/17-infrastructure-and-production/16-model-routing", title: "Model Routing as a Cost-Reduction Primitive" },
          { path: "phases/17-infrastructure-and-production/27-finops-llms", title: "FinOps for LLMs" }
        ]
      },
      {
        title: "Enterprise governance",
        decision: "core",
        note: "Leadership controls and accountability.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/23-sre-for-ai", title: "SRE for AI" },
          { path: "phases/17-infrastructure-and-production/26-compliance-frameworks", title: "Compliance Frameworks" },
          { path: "phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea", title: "Regulatory Frameworks" },
          { path: "phases/18-ethics-safety-alignment/30-dual-use-risk-cyber-bio-chem-nuclear", title: "Dual-Use Risk" }
        ]
      },
      {
        title: "Workforce transformation",
        decision: "core",
        note: "Connects autonomous systems to human leadership and governance.",
        lessons: [
          { path: "phases/15-autonomous-systems/01-long-horizon-agents", title: "The Shift from Chatbots to Long-Horizon Agents" },
          { path: "phases/15-autonomous-systems/15-propose-then-commit", title: "Human-in-the-Loop: Propose-Then-Commit" },
          { path: "phases/16-multi-agent-and-swarms/08-role-specialization", title: "Role Specialization" },
          { path: "phases/14-agent-engineering/26-failure-modes-agentic", title: "Failure Modes: Why Agents Break" }
        ]
      }
    ],
    "AI-10": [
      {
        title: "Compliance intake and controls",
        decision: "core",
        note: "Turns policy expectations into a repeatable intake workflow.",
        lessons: [
          { path: "phases/11-llm-engineering/18-responsible-ai-compliance-workflow", title: "Responsible AI Compliance Workflow" },
          { path: "phases/17-infrastructure-and-production/26-compliance-frameworks", title: "Compliance Frameworks" },
          { path: "phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea", title: "Regulatory Frameworks" }
        ]
      },
      {
        title: "Risk signals and guardrails",
        decision: "core",
        note: "Keeps GDPR, bias, safety and escalation decisions close to the work.",
        lessons: [
          { path: "phases/11-llm-engineering/12-guardrails", title: "Guardrails, Safety & Content Filtering" },
          { path: "phases/18-ethics-safety-alignment/20-bias-representational-harm", title: "Bias and Representational Harm in LLMs" },
          { path: "phases/18-ethics-safety-alignment/26-model-system-dataset-cards", title: "Model, System, and Dataset Cards" }
        ]
      },
      {
        title: "Audit-ready handoff",
        decision: "optional",
        note: "Advanced add-on for teams that need operational evidence.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/25-security-secrets-audit", title: "Security — Secrets, API Key Rotation, Audit Logs, Guardrails" },
          { path: "phases/18-ethics-safety-alignment/27-data-provenance-training-governance", title: "Data Provenance and Training-Data Governance" }
        ]
      }
    ],
    "AI-11": [
      {
        title: "Evaluation design",
        decision: "core",
        note: "Builds the bridge from test ideas to measurable LLM quality.",
        lessons: [
          { path: "phases/11-llm-engineering/19-ai-driven-testing-qa", title: "AI-Driven Testing and QA" },
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" },
          { path: "phases/14-agent-engineering/30-eval-driven-agent-development", title: "Eval-Driven Agent Development" }
        ]
      },
      {
        title: "Regression and fixture harness",
        decision: "core",
        note: "Makes AI-assisted QA reproducible enough for releases.",
        lessons: [
          { path: "phases/19-capstone-projects/27-eval-harness-fixture-tasks", title: "Eval Harness with Fixture Tasks" },
          { path: "phases/14-agent-engineering/38-verification-gates", title: "Verification Gates" },
          { path: "phases/14-agent-engineering/39-reviewer-agent", title: "Reviewer Agent" }
        ]
      },
      {
        title: "Release quality operations",
        decision: "optional",
        note: "For product teams moving from QA design into rollout decisions.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/20-shadow-canary-progressive", title: "Shadow Traffic, Canary Rollout, and Progressive Deployment" },
          { path: "phases/17-infrastructure-and-production/21-ab-testing-llm-features", title: "A/B Testing LLM Features" }
        ]
      }
    ],
    "AI-12": [
      {
        title: "Modernization intake",
        decision: "core",
        note: "Frames legacy modernization as a scoped, reviewable AI-assisted workflow.",
        lessons: [
          { path: "phases/11-llm-engineering/20-code-modernization-with-ai", title: "Code Modernization with AI" },
          { path: "phases/14-agent-engineering/31-agent-workbench-why-models-fail", title: "Agent Workbench Engineering" },
          { path: "phases/14-agent-engineering/34-repo-memory-and-state", title: "Repo Memory and Durable State" }
        ]
      },
      {
        title: "Safe refactor workflow",
        decision: "core",
        note: "Prevents modernization from becoming unchecked code generation.",
        lessons: [
          { path: "phases/14-agent-engineering/38-verification-gates", title: "Verification Gates" },
          { path: "phases/14-agent-engineering/39-reviewer-agent", title: "Reviewer Agent" },
          { path: "phases/19-capstone-projects/70-task-spec-format", title: "Task Spec Format" }
        ]
      },
      {
        title: "Legacy-to-production controls",
        decision: "optional",
        note: "Adds rollout and audit controls for larger modernization efforts.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/20-shadow-canary-progressive", title: "Shadow Traffic, Canary Rollout, and Progressive Deployment" },
          { path: "phases/17-infrastructure-and-production/25-security-secrets-audit", title: "Security — Secrets, API Key Rotation, Audit Logs, Guardrails" }
        ]
      }
    ],
    "AI-13": [
      {
        title: "Source-grounded documentation",
        decision: "core",
        note: "Shows how to create useful docs without losing source traceability.",
        lessons: [
          { path: "phases/11-llm-engineering/21-ai-assisted-documentation", title: "AI-Assisted Documentation" },
          { path: "phases/11-llm-engineering/05-context-engineering", title: "Context Engineering" },
          { path: "phases/13-tools-and-protocols/10-mcp-resources-and-prompts", title: "MCP Resources and Prompts" }
        ]
      },
      {
        title: "Technical and compliance artifacts",
        decision: "core",
        note: "Connects documentation to handoff, compliance and system evidence.",
        lessons: [
          { path: "phases/18-ethics-safety-alignment/26-model-system-dataset-cards", title: "Model, System, and Dataset Cards" },
          { path: "phases/19-capstone-projects/70-task-spec-format", title: "Task Spec Format" },
          { path: "phases/17-infrastructure-and-production/25-security-secrets-audit", title: "Security — Secrets, API Key Rotation, Audit Logs, Guardrails" }
        ]
      },
      {
        title: "Handoff documentation",
        decision: "optional",
        note: "For teams using AI to keep long-running delivery work understandable.",
        lessons: [
          { path: "phases/14-agent-engineering/40-multi-session-handoff", title: "Multi-Session Handoff" },
          { path: "phases/14-agent-engineering/41-workbench-for-real-repos", title: "The Workbench on a Real Repo" }
        ]
      }
    ],
    "AI-14": [
      {
        title: "Sustainable architecture choices",
        decision: "core",
        note: "Makes green coding concrete through right-sizing and architecture trade-offs.",
        lessons: [
          { path: "phases/11-llm-engineering/22-sustainable-software-green-coding", title: "Sustainable Software and Green Coding for AI Systems" },
          { path: "phases/17-infrastructure-and-production/02-inference-platform-economics", title: "Inference Platform Economics" },
          { path: "phases/17-infrastructure-and-production/16-model-routing", title: "Model Routing as a Cost-Reduction Primitive" }
        ]
      },
      {
        title: "Runtime efficiency",
        decision: "core",
        note: "Connects sustainability to measurable runtime and token behavior.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/08-inference-metrics-goodput", title: "Inference Metrics" },
          { path: "phases/11-llm-engineering/11-caching-cost", title: "Caching, Rate Limiting & Cost Optimization" },
          { path: "phases/17-infrastructure-and-production/14-prompt-semantic-caching", title: "Prompt Caching and Semantic Caching Economics" }
        ]
      },
      {
        title: "Operating controls",
        decision: "optional",
        note: "Adds FinOps and governor patterns for sustained production use.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/27-finops-llms", title: "FinOps for LLMs" },
          { path: "phases/15-autonomous-systems/13-cost-governors", title: "Action Budgets, Iteration Caps, and Cost Governors" }
        ]
      }
    ],
    "AI-15": [
      {
        title: "Research intake and synthesis",
        decision: "core",
        note: "Uses AI to accelerate synthesis while keeping research assumptions visible.",
        lessons: [
          { path: "phases/11-llm-engineering/23-ai-enhanced-user-research", title: "AI-Enhanced User Research" },
          { path: "phases/11-llm-engineering/01-prompt-engineering", title: "Prompt Engineering: Techniques & Patterns" },
          { path: "phases/11-llm-engineering/03-structured-outputs", title: "Structured Outputs: JSON, Schema Validation, Constrained Decoding" }
        ]
      },
      {
        title: "Evidence and validation",
        decision: "core",
        note: "Keeps AI-generated research insights tied to measurable evidence.",
        lessons: [
          { path: "phases/02-ml-fundamentals/09-model-evaluation", title: "Model Evaluation" },
          { path: "phases/17-infrastructure-and-production/21-ab-testing-llm-features", title: "A/B Testing LLM Features" },
          { path: "phases/19-capstone-projects/71-classical-metrics", title: "Classical Metrics" }
        ]
      },
      {
        title: "Responsible research review",
        decision: "optional",
        note: "For teams handling sensitive user, employee or customer feedback.",
        lessons: [
          { path: "phases/18-ethics-safety-alignment/20-bias-representational-harm", title: "Bias and Representational Harm in LLMs" },
          { path: "phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual", title: "Fairness Criteria" }
        ]
      }
    ],
    "AI-16": [
      {
        title: "Opportunity discovery",
        decision: "core",
        note: "Turns process observations into concrete AI and automation candidates.",
        lessons: [
          { path: "phases/11-llm-engineering/24-use-case-spotting-automation-discovery", title: "AI Use Case Spotting and Automation Discovery" },
          { path: "phases/02-ml-fundamentals/01-what-is-machine-learning", title: "What Is Machine Learning" },
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" }
        ]
      },
      {
        title: "Value-risk prioritization",
        decision: "core",
        note: "Separates promising use cases from expensive experiments.",
        lessons: [
          { path: "phases/11-llm-engineering/25-ai-cost-value-economics", title: "AI Cost and Value Economics" },
          { path: "phases/17-infrastructure-and-production/27-finops-llms", title: "FinOps for LLMs" },
          { path: "phases/15-autonomous-systems/13-cost-governors", title: "Action Budgets, Iteration Caps, and Cost Governors" }
        ]
      },
      {
        title: "Pilot to scale",
        decision: "core",
        note: "Keeps discovery connected to controlled rollout and measurement.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/20-shadow-canary-progressive", title: "Shadow Traffic, Canary Rollout, and Progressive Deployment" },
          { path: "phases/17-infrastructure-and-production/21-ab-testing-llm-features", title: "A/B Testing LLM Features" }
        ]
      }
    ],
    "AI-17": [
      {
        title: "Cost anatomy",
        decision: "core",
        note: "Makes AI economics explicit before teams scale a solution.",
        lessons: [
          { path: "phases/11-llm-engineering/25-ai-cost-value-economics", title: "AI Cost and Value Economics" },
          { path: "phases/11-llm-engineering/11-caching-cost", title: "Caching, Rate Limiting & Cost Optimization" },
          { path: "phases/17-infrastructure-and-production/02-inference-platform-economics", title: "Inference Platform Economics" }
        ]
      },
      {
        title: "Optimization levers",
        decision: "core",
        note: "Shows how architecture choices change the economics.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/14-prompt-semantic-caching", title: "Prompt Caching and Semantic Caching Economics" },
          { path: "phases/17-infrastructure-and-production/16-model-routing", title: "Model Routing as a Cost-Reduction Primitive" },
          { path: "phases/15-autonomous-systems/13-cost-governors", title: "Action Budgets, Iteration Caps, and Cost Governors" }
        ]
      },
      {
        title: "Value case",
        decision: "core",
        note: "Connects cost control with business outcomes and use-case selection.",
        lessons: [
          { path: "phases/11-llm-engineering/24-use-case-spotting-automation-discovery", title: "AI Use Case Spotting and Automation Discovery" },
          { path: "phases/17-infrastructure-and-production/27-finops-llms", title: "FinOps for LLMs" }
        ]
      }
    ],
    "AI-18": [
      {
        title: "Consulting prompt patterns",
        decision: "core",
        note: "Moves prompt engineering into client and stakeholder work.",
        lessons: [
          { path: "phases/11-llm-engineering/26-consultative-prompting", title: "Consultative Prompting" },
          { path: "phases/11-llm-engineering/01-prompt-engineering", title: "Prompt Engineering: Techniques & Patterns" },
          { path: "phases/11-llm-engineering/02-few-shot-cot", title: "Few-Shot, Chain-of-Thought, Tree-of-Thought" }
        ]
      },
      {
        title: "Structured recommendations",
        decision: "core",
        note: "Produces outputs that can survive review, reuse and handoff.",
        lessons: [
          { path: "phases/11-llm-engineering/03-structured-outputs", title: "Structured Outputs: JSON, Schema Validation, Constrained Decoding" },
          { path: "phases/13-tools-and-protocols/05-tool-schema-design", title: "Tool Schema Design" },
          { path: "phases/19-capstone-projects/70-task-spec-format", title: "Task Spec Format" }
        ]
      },
      {
        title: "Review discipline",
        decision: "core",
        note: "Prevents consultative prompting from producing polished but weak reasoning.",
        lessons: [
          { path: "phases/14-agent-engineering/39-reviewer-agent", title: "Reviewer Agent" },
          { path: "phases/14-agent-engineering/38-verification-gates", title: "Verification Gates" }
        ]
      }
    ],
    "AI-19": [
      {
        title: "Platform landscape",
        decision: "core",
        note: "Maps the main AI platform choices to enterprise architecture questions.",
        lessons: [
          { path: "phases/11-llm-engineering/27-ai-ecosystem-vendor-landscape", title: "AI Ecosystem and Vendor Landscape" },
          { path: "phases/17-infrastructure-and-production/01-managed-llm-platforms", title: "Managed LLM Platforms" },
          { path: "phases/17-infrastructure-and-production/19-ai-gateways", title: "AI Gateways" }
        ]
      },
      {
        title: "Agent framework options",
        decision: "core",
        note: "Keeps framework selection tied to runtime, state and governance needs.",
        lessons: [
          { path: "phases/14-agent-engineering/13-langgraph-stateful-graphs", title: "LangGraph: Stateful Graphs and Durable Execution" },
          { path: "phases/14-agent-engineering/16-openai-agents-sdk", title: "OpenAI Agents SDK" },
          { path: "phases/14-agent-engineering/17-claude-agent-sdk", title: "Claude Agent SDK" }
        ]
      },
      {
        title: "Ecosystem governance",
        decision: "optional",
        note: "For teams standardizing tools, registries and vendor controls.",
        lessons: [
          { path: "phases/13-tools-and-protocols/17-mcp-gateways-and-registries", title: "MCP Gateways and Registries" },
          { path: "phases/13-tools-and-protocols/23-capstone-tool-ecosystem", title: "Capstone — Build a Complete Tool Ecosystem" },
          { path: "phases/17-infrastructure-and-production/26-compliance-frameworks", title: "Compliance Frameworks" }
        ]
      }
    ],
    "AI-20": [
      {
        title: "Role and capability strategy",
        decision: "core",
        note: "Starts workforce planning at the task and capability level.",
        lessons: [
          { path: "phases/11-llm-engineering/28-ai-workforce-strategy", title: "AI Workforce Strategy" },
          { path: "phases/15-autonomous-systems/01-long-horizon-agents", title: "The Shift from Chatbots to Long-Horizon Agents" },
          { path: "phases/16-multi-agent-and-swarms/08-role-specialization", title: "Role Specialization" }
        ]
      },
      {
        title: "Adoption operating model",
        decision: "core",
        note: "Connects skill plans with human accountability and failure-mode awareness.",
        lessons: [
          { path: "phases/15-autonomous-systems/15-propose-then-commit", title: "Human-in-the-Loop: Propose-Then-Commit" },
          { path: "phases/14-agent-engineering/26-failure-modes-agentic", title: "Failure Modes: Why Agents Break" },
          { path: "phases/14-agent-engineering/40-multi-session-handoff", title: "Multi-Session Handoff" }
        ]
      },
      {
        title: "Enablement assets",
        decision: "optional",
        note: "For leaders building communities, champions and reusable enablement packs.",
        lessons: [
          { path: "phases/13-tools-and-protocols/22-skills-and-agent-sdks", title: "Skills and Agent SDKs" },
          { path: "phases/14-agent-engineering/42-agent-workbench-capstone", title: "Capstone: Reusable Agent Workbench Pack" }
        ]
      }
    ],
    "AI-21": [
      {
        title: "Decision quality",
        decision: "core",
        note: "Frames AI-supported decisions around evidence and measurement.",
        lessons: [
          { path: "phases/11-llm-engineering/29-decision-making-with-ai", title: "Decision Making with AI" },
          { path: "phases/02-ml-fundamentals/09-model-evaluation", title: "Model Evaluation" },
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" }
        ]
      },
      {
        title: "Uncertainty and calibration",
        decision: "core",
        note: "Helps leaders avoid false precision in AI outputs.",
        lessons: [
          { path: "phases/19-capstone-projects/73-perplexity-calibration", title: "Perplexity and Calibration" },
          { path: "phases/19-capstone-projects/74-leaderboard-aggregation", title: "Leaderboard Aggregation" },
          { path: "phases/17-infrastructure-and-production/08-inference-metrics-goodput", title: "Inference Metrics" }
        ]
      },
      {
        title: "Bias and accountability",
        decision: "core",
        note: "Keeps decision ownership human even when AI contributes analysis.",
        lessons: [
          { path: "phases/18-ethics-safety-alignment/20-bias-representational-harm", title: "Bias and Representational Harm in LLMs" },
          { path: "phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual", title: "Fairness Criteria" },
          { path: "phases/18-ethics-safety-alignment/26-model-system-dataset-cards", title: "Model, System, and Dataset Cards" }
        ]
      }
    ],
    "AI-22": [
      {
        title: "Data readiness baseline",
        decision: "core",
        note: "Creates a practical data-readiness check before AI pilots start.",
        lessons: [
          { path: "phases/11-llm-engineering/30-data-literacy-for-ai-projects", title: "Data Literacy for AI Projects" },
          { path: "phases/11-llm-engineering/05-context-engineering", title: "Context Engineering" },
          { path: "phases/02-ml-fundamentals/09-model-evaluation", title: "Model Evaluation" }
        ]
      },
      {
        title: "Quality, privacy and provenance",
        decision: "core",
        note: "Connects data literacy to responsible source use and evidence quality.",
        lessons: [
          { path: "phases/18-ethics-safety-alignment/27-data-provenance-training-governance", title: "Data Provenance and Training-Data Governance" },
          { path: "phases/18-ethics-safety-alignment/26-model-system-dataset-cards", title: "Model, System, and Dataset Cards" },
          { path: "phases/17-infrastructure-and-production/26-compliance-frameworks", title: "Compliance Frameworks" }
        ]
      },
      {
        title: "Evaluation sample",
        decision: "optional",
        note: "For teams turning data readiness into a measurable pilot gate.",
        lessons: [
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" },
          { path: "phases/19-capstone-projects/71-classical-metrics", title: "Classical Metrics" }
        ]
      }
    ],
    "AI-23": [
      {
        title: "AI security triage",
        decision: "core",
        note: "Introduces trust-boundary thinking for AI workflows.",
        lessons: [
          { path: "phases/11-llm-engineering/35-ai-security-prompt-injection", title: "AI Security and Prompt Injection Defense" },
          { path: "phases/11-llm-engineering/12-guardrails", title: "Guardrails, Safety & Content Filtering" },
          { path: "phases/14-agent-engineering/27-prompt-injection-defense", title: "Prompt Injection and the PVE Defense" }
        ]
      },
      {
        title: "Tool and data controls",
        decision: "core",
        note: "Connects security decisions to data access, tool use and audit evidence.",
        lessons: [
          { path: "phases/13-tools-and-protocols/05-tool-schema-design", title: "Tool Schema Design" },
          { path: "phases/17-infrastructure-and-production/25-security-secrets-audit", title: "Security — Secrets, API Key Rotation, Audit Logs, Guardrails" },
          { path: "phases/18-ethics-safety-alignment/27-data-provenance-training-governance", title: "Data Provenance and Training-Data Governance" }
        ]
      },
      {
        title: "Launch-gate readiness",
        decision: "optional",
        note: "For teams moving from security awareness into production readiness.",
        lessons: [
          { path: "phases/11-llm-engineering/18-responsible-ai-compliance-workflow", title: "Responsible AI Compliance Workflow" },
          { path: "phases/17-infrastructure-and-production/26-compliance-frameworks", title: "Compliance Frameworks" }
        ]
      }
    ],
    "AI-24": [
      {
        title: "Internal assistant source readiness",
        decision: "core",
        note: "Frames internal knowledge assistants around source ownership and permissions.",
        lessons: [
          { path: "phases/11-llm-engineering/36-internal-knowledge-assistants-rag", title: "Internal Knowledge Assistants with RAG" },
          { path: "phases/11-llm-engineering/06-rag", title: "RAG (Retrieval-Augmented Generation)" },
          { path: "phases/11-llm-engineering/30-data-literacy-for-ai-projects", title: "Data Literacy for AI Projects" }
        ]
      },
      {
        title: "Retrieval quality",
        decision: "core",
        note: "Connects source readiness to chunking, retrieval and answer evaluation.",
        lessons: [
          { path: "phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag", title: "Chunking Strategies for RAG" },
          { path: "phases/11-llm-engineering/07-advanced-rag", title: "Advanced RAG" },
          { path: "phases/11-llm-engineering/10-evaluation", title: "Evaluation & Testing LLM Applications" }
        ]
      },
      {
        title: "Assistant operations",
        decision: "optional",
        note: "For teams preparing support handoff and improvement loops.",
        lessons: [
          { path: "phases/11-llm-engineering/38-ai-operations-incident-response", title: "AI Operations and Incident Response" },
          { path: "phases/17-infrastructure-and-production/13-llm-observability", title: "LLM Observability Stack Selection" }
        ]
      }
    ],
    "AI-25": [
      {
        title: "Vendor-fit scorecard",
        decision: "core",
        note: "Turns vendor selection into an explicit fit and risk comparison.",
        lessons: [
          { path: "phases/11-llm-engineering/37-ai-vendor-procurement-evaluation", title: "AI Vendor and Procurement Evaluation" },
          { path: "phases/11-llm-engineering/27-ai-ecosystem-vendor-landscape", title: "AI Ecosystem and Vendor Landscape" },
          { path: "phases/17-infrastructure-and-production/01-managed-llm-platforms", title: "Managed LLM Platforms" }
        ]
      },
      {
        title: "Security, data and compliance evidence",
        decision: "core",
        note: "Keeps procurement tied to enterprise control evidence.",
        lessons: [
          { path: "phases/11-llm-engineering/35-ai-security-prompt-injection", title: "AI Security and Prompt Injection Defense" },
          { path: "phases/17-infrastructure-and-production/26-compliance-frameworks", title: "Compliance Frameworks" },
          { path: "phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea", title: "Regulatory Frameworks" }
        ]
      },
      {
        title: "Economics and exit planning",
        decision: "optional",
        note: "Adds commercial durability to vendor decisions.",
        lessons: [
          { path: "phases/11-llm-engineering/25-ai-cost-value-economics", title: "AI Cost and Value Economics" },
          { path: "phases/17-infrastructure-and-production/27-finops-llms", title: "FinOps for LLMs" }
        ]
      }
    ],
    "AI-26": [
      {
        title: "AI incident response",
        decision: "core",
        note: "Defines production support for quality, cost, tool and safety failures.",
        lessons: [
          { path: "phases/11-llm-engineering/38-ai-operations-incident-response", title: "AI Operations and Incident Response" },
          { path: "phases/17-infrastructure-and-production/13-llm-observability", title: "LLM Observability Stack Selection" },
          { path: "phases/17-infrastructure-and-production/23-sre-for-ai", title: "SRE for AI" }
        ]
      },
      {
        title: "Release and rollback controls",
        decision: "core",
        note: "Connects incident response to release discipline.",
        lessons: [
          { path: "phases/17-infrastructure-and-production/20-shadow-canary-progressive", title: "Shadow Traffic, Canary Rollout, and Progressive Deployment" },
          { path: "phases/14-agent-engineering/38-verification-gates", title: "Verification Gates" },
          { path: "phases/15-autonomous-systems/16-checkpoints-rollback", title: "Checkpoints and Rollback" }
        ]
      },
      {
        title: "Post-incident learning",
        decision: "optional",
        note: "Shows how incidents update evals, prompts, tools and runbooks.",
        lessons: [
          { path: "phases/11-llm-engineering/19-ai-driven-testing-qa", title: "AI-Driven Testing and QA" },
          { path: "phases/19-capstone-projects/28-observability-otel-traces", title: "Observability with OTel GenAI Spans" }
        ]
      }
    ],
    "AI-27": [
      {
        title: "Portfolio triage",
        decision: "core",
        note: "Helps leaders compare initiatives by value, risk, capacity and evidence.",
        lessons: [
          { path: "phases/11-llm-engineering/39-ai-portfolio-roadmap-management", title: "AI Portfolio and Roadmap Management" },
          { path: "phases/11-llm-engineering/25-ai-cost-value-economics", title: "AI Cost and Value Economics" },
          { path: "phases/11-llm-engineering/29-decision-making-with-ai", title: "Decision Making with AI" }
        ]
      },
      {
        title: "Roadmap and transformation controls",
        decision: "core",
        note: "Connects portfolio steering to workforce and change planning.",
        lessons: [
          { path: "phases/11-llm-engineering/28-ai-workforce-strategy", title: "AI Workforce Strategy" },
          { path: "phases/11-llm-engineering/33-ai-change-management-team-integration", title: "AI Change Management and Team Integration" },
          { path: "phases/17-infrastructure-and-production/21-ab-testing-llm-features", title: "A/B Testing LLM Features" }
        ]
      },
      {
        title: "Scale or stop decisions",
        decision: "optional",
        note: "Adds kill criteria and scaling discipline for leadership steering.",
        lessons: [
          { path: "phases/11-llm-engineering/32-ai-use-case-identification-workshop", title: "AI Use Case Identification Workshop" },
          { path: "phases/17-infrastructure-and-production/20-shadow-canary-progressive", title: "Shadow Traffic, Canary Rollout, and Progressive Deployment" }
        ]
      }
    ],
    "CHAMP-01": [
      {
        title: "Champion delivery discipline",
        decision: "core",
        note: "For multipliers who support teams and keep standards consistent.",
        lessons: [
          { path: "phases/11-llm-engineering/34-ai-champion-enablement", title: "AI Champion Enablement" },
          { path: "phases/14-agent-engineering/30-eval-driven-agent-development", title: "Eval-Driven Agent Development" },
          { path: "phases/14-agent-engineering/39-reviewer-agent", title: "Reviewer Agent" },
          { path: "phases/14-agent-engineering/40-multi-session-handoff", title: "Multi-Session Handoff" },
          { path: "phases/14-agent-engineering/41-workbench-for-real-repos", title: "The Workbench on a Real Repo" },
          { path: "phases/14-agent-engineering/42-agent-workbench-capstone", title: "Capstone: Reusable Agent Workbench Pack" }
        ]
      },
      {
        title: "Reusable assets and enablement",
        decision: "core",
        note: "Maps champion work to reusable skills, templates and tool ecosystems.",
        lessons: [
          { path: "phases/13-tools-and-protocols/22-skills-and-agent-sdks", title: "Skills and Agent SDKs" },
          { path: "phases/13-tools-and-protocols/23-capstone-tool-ecosystem", title: "Capstone — Build a Complete Tool Ecosystem" },
          { path: "phases/19-capstone-projects/27-eval-harness-fixture-tasks", title: "Eval Harness with Fixture Tasks" },
          { path: "phases/19-capstone-projects/28-observability-otel-traces", title: "Observability with OTel GenAI Spans" }
        ]
      }
    ]
  },
  omittedGroups: [
    {
      label: "Deep math/model training",
      reason: "Too deep for LHIND LRN role courses unless someone is explicitly building models from scratch.",
      examples: ["phases/01-math-foundations", "phases/03-deep-learning-core", "phases/10-llms-from-scratch/04-pre-training-mini-gpt"]
    },
    {
      label: "Vision, audio and multimodal specialist tracks",
      reason: "Relevant only for specialist offerings; not pulled into broad AI literacy, PM, consulting or leadership courses.",
      examples: ["phases/04-computer-vision", "phases/06-speech-and-audio", "phases/12-multimodal-ai"]
    },
    {
      label: "Large capstone builds",
      reason: "Useful as advanced references, but too large as LRN subcourses. Smaller capstone lessons are used where they fit.",
      examples: ["phases/19-capstone-projects/01-terminal-native-coding-agent", "phases/19-capstone-projects/10-multi-agent-software-team"]
    }
  ]
};
