window.LrnData = {
  levels: [
    { id: 0, label: "Not relevant", short: "n. a." },
    { id: 1, label: "Acquire", short: "Basics" },
    { id: 2, label: "Deepen", short: "Apply" },
    { id: 3, label: "Create", short: "Create" }
  ],
  dimensions: [
    {
      id: "literacy",
      label: "Core Understanding & AI Literacy",
      cluster: "Foundation",
      short: "Explain terms, role expectations, and AI systems"
    },
    {
      id: "prompting",
      label: "Applied Skills & Prompting",
      cluster: "Foundation / Advisory",
      short: "Use tools, improve prompts, and review outputs"
    },
    {
      id: "business",
      label: "Business & Use Cases",
      cluster: "Product and Process / Advisory",
      short: "Identify use cases, assess business value, and structure projects"
    },
    {
      id: "data",
      label: "Data & Compliance",
      cluster: "Foundation",
      short: "Account for data quality, GDPR, ethics, and guardrails"
    },
    {
      id: "change",
      label: "Change & Innovation",
      cluster: "Leadership and Strategy",
      short: "Human-in-the-loop, team enablement, and knowledge transfer"
    }
  ],
  questions: [
    {
      id: "q1",
      dimension: "literacy",
      text: "How clear are the AI-related expectations for your current role at LHIND?"
    },
    {
      id: "q2",
      dimension: "literacy",
      text: "How confidently can you explain the differences between classic software solutions, machine learning, and generative AI?"
    },
    {
      id: "q3",
      dimension: "prompting",
      text: "How often and effectively do you already use AI tools for research, text, code, analysis, or concept work?"
    },
    {
      id: "q4",
      dimension: "prompting",
      text: "How well can you structure prompts, improve them iteratively, and critically review AI results for errors, bias, and gaps?"
    },
    {
      id: "q5",
      dimension: "business",
      text: "How confidently can you identify and prioritize meaningful AI use cases with visible business value?"
    },
    {
      id: "q6",
      dimension: "data",
      text: "How well can you assess which data sources, data quality, and data volumes an AI use case needs?"
    },
    {
      id: "q7",
      dimension: "data",
      text: "How well do you know and apply the relevant guardrails for data protection, IT security, ethics, and responsible AI use?"
    },
    {
      id: "q8",
      dimension: "change",
      text: "How confidently can you integrate AI systems into processes and teams while keeping humans accountable and roles clear?"
    },
    {
      id: "q9",
      dimension: "business",
      text: "How routinely do you structure AI initiatives with scope, risks, stakeholders, pilots, and rollout?"
    },
    {
      id: "q10",
      dimension: "change",
      text: "To what extent do you actively shape new AI-based solutions, workflows, or services and share your experience?"
    }
  ],
  // LRN cockpit currently exposes only the Technology Consulting profile.
  // To restore the other six profiles, paste them back here and revert the
  // fallback/reset defaults in site/lrn/lrn.js from "tc" to "bsc".
  profiles: [
    {
      id: "tc",
      code: "R03-TC",
      label: "Technology Consulting",
      segment: "TC",
      description: "Architecture, integration, security, evaluation, delivery.",
      targets: { literacy: 2, prompting: 3, business: 2, data: 3, change: 2 }
    }
  ],
  interests: [
    { id: "foundation", label: "Foundations", dimensions: ["literacy"] },
    { id: "productivity", label: "Productivity", hint: "Prompts, assistants, office", dimensions: ["prompting"] },
    { id: "consulting", label: "Consulting", hint: "Use Cases, Requirements", dimensions: ["business", "prompting"] },
    { id: "engineering", label: "Engineering", hint: "Agents, architecture, QA", dimensions: ["business", "data"] },
    { id: "governance", label: "Governance", hint: "GDPR, Responsible AI", dimensions: ["data"] },
    { id: "leadership", label: "Leadership", hint: "Change, workforce, strategy", dimensions: ["change", "business"] }
  ],
  capabilities: [
    { id: 1, cluster: "Foundation", title: "Digital & AI Terminology, AI Concepts, Tool overviews", targets: { bsc: "Acquire", pvs: "Deepen", tc: "Create", am: "Deepen", pma: "Deepen", corp: "Deepen", lead: "Deepen", all: "Acquire" } },
    { id: 2, cluster: "Foundation", title: "Data Literacy", targets: { bsc: "Create", pvs: "Create", tc: "Create", am: "Deepen", pma: "Deepen", corp: "Deepen", lead: "Deepen", all: "Acquire" } },
    { id: 3, cluster: "Foundation", title: "Personal AI Productivity", targets: { bsc: "Create", pvs: "Create", tc: "Create", am: "Acquire", pma: "Create", corp: "Deepen", lead: "Create", all: "Acquire" } },
    { id: 4, cluster: "Foundation", title: "Corporate Ethics & Compliance", targets: { bsc: "Deepen", pvs: "Deepen", tc: "Create", am: "Create", pma: "Deepen", corp: "Deepen", lead: "Create", all: "Acquire" } },
    { id: 5, cluster: "Engineering", title: "AI Systems and Architecture", targets: { bsc: "n. a.", pvs: "Acquire", tc: "Create", am: "n. a.", pma: "n. a.", corp: "n. a.", lead: "n. a.", all: "n. a." } },
    { id: 6, cluster: "Engineering", title: "Agentic Software Development", targets: { bsc: "Acquire", pvs: "Acquire", tc: "Create", am: "Acquire", pma: "n. a.", corp: "n. a.", lead: "n. a.", all: "n. a." } },
    { id: 7, cluster: "Engineering", title: "AI-Driven Testing & QA", targets: { bsc: "n. a.", pvs: "Acquire", tc: "Create", am: "Deepen", pma: "n. a.", corp: "n. a.", lead: "n. a.", all: "n. a." } },
    { id: 8, cluster: "Engineering", title: "AI-Supported Code Modernization", targets: { bsc: "Acquire", pvs: "Acquire", tc: "Create", am: "Create", pma: "n. a.", corp: "n. a.", lead: "n. a.", all: "n. a." } },
    { id: 9, cluster: "Engineering", title: "AI-Assisted Documentation", targets: { bsc: "Deepen", pvs: "Deepen", tc: "Create", am: "Create", pma: "n. a.", corp: "Deepen", lead: "Acquire", all: "Acquire" } },
    { id: 10, cluster: "Engineering", title: "Sustainable Software & Green Coding", targets: { bsc: "Deepen", pvs: "Deepen", tc: "Deepen", am: "Acquire", pma: "n. a.", corp: "n. a.", lead: "Acquire", all: "n. a." } },
    { id: 11, cluster: "Product and Process", title: "AI-Augmented Requirement Engineering", targets: { bsc: "Create", pvs: "Create", tc: "Deepen", am: "Acquire", pma: "Acquire", corp: "Acquire", lead: "Acquire", all: "n. a." } },
    { id: 12, cluster: "Product and Process", title: "AI-Enhanced User Research", targets: { bsc: "Create", pvs: "Create", tc: "Acquire", am: "n. a.", pma: "Acquire", corp: "Acquire", lead: "Acquire", all: "n. a." } },
    { id: 13, cluster: "Advisory and Business Consulting", title: "AI & Automation Use Case Spotting", targets: { bsc: "Create", pvs: "Deepen", tc: "Deepen", am: "Acquire", pma: "Create", corp: "Acquire", lead: "Deepen", all: "Acquire" } },
    { id: 14, cluster: "Advisory and Business Consulting", title: "AI Cost & Value Economics", targets: { bsc: "Create", pvs: "Deepen", tc: "Deepen", am: "Acquire", pma: "Deepen", corp: "Acquire", lead: "Create", all: "n. a." } },
    { id: 15, cluster: "Advisory and Business Consulting", title: "Consultative Prompting", targets: { bsc: "Create", pvs: "Deepen", tc: "Deepen", am: "Deepen", pma: "Create", corp: "Acquire", lead: "Create", all: "Acquire" } },
    { id: 16, cluster: "Advisory and Business Consulting", title: "AI Ecosystem Knowledge", targets: { bsc: "Create", pvs: "Deepen", tc: "Deepen", am: "Acquire", pma: "Acquire", corp: "Acquire", lead: "Deepen", all: "Acquire" } },
    { id: 17, cluster: "Leadership and Strategy", title: "Managing AI Transformations", targets: { bsc: "Create", pvs: "Deepen", tc: "Acquire", am: "Acquire", pma: "Create", corp: "Acquire", lead: "Deepen", all: "n. a." } },
    { id: 18, cluster: "Leadership and Strategy", title: "AI Workforce Strategy", targets: { bsc: "Deepen", pvs: "Acquire", tc: "Acquire", am: "Acquire", pma: "Acquire", corp: "Create", lead: "Create", all: "n. a." } },
    { id: 19, cluster: "Leadership and Strategy", title: "Decision Making with AI", targets: { bsc: "Deepen", pvs: "Deepen", tc: "Acquire", am: "Acquire", pma: "Deepen", corp: "Deepen", lead: "Create", all: "n. a." } }
  ],
  courses: [
    {
      id: "PRIMER-01",
      title: "Interactive LLM Primer",
      status: "Available",
      source: "llm-primer",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["literacy"],
      interests: ["foundation"],
      levels: ["Acquire"],
      format: "Interactive mini-games, real GPT tokenizer, glossary, quiz",
      summary: "~75-minute hands-on primer on how large language models work: tokens, context, prompting, tool use, RAG, and limits, through 20 mini-games and a quiz.",
      outcomes: [],
      modules: ["Interactive LLM Primer"]
    },
    {
      id: "AI-09",
      title: "AI Fundamentals / AI for Everyone",
      status: "Maintained in SharePoint",
      source: "trainings.xlsx",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["literacy", "data"],
      interests: ["foundation", "governance"],
      levels: ["Acquire"],
      format: "Self-paced online, text-based LRN module plus knowledge checks",
      summary: "Foundations of AI, generative AI, realistic limitations, business use cases, and responsible AI.",
      outcomes: [
        "Explain how AI, machine learning, and generative models differ in practice",
        "Identify realistic AI use cases and limitations before committing resources",
        "Assess AI outputs for evidence, quality, bias, and uncertainty",
        "Apply a responsible-AI baseline to everyday workplace decisions"
      ],
      modules: ["AI for Everyone", "Generative AI for Everyone"]
    },
    {
      id: "AI-06",
      title: "AI: Concepts and Tools for Personal Productivity",
      status: "Maintained in SharePoint / LHIND tool part to build",
      source: "trainings.xlsx",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["prompting", "literacy"],
      interests: ["productivity", "foundation"],
      levels: ["Acquire", "Deepen"],
      format: "Text lesson, interactive prompt lab, LHIND tool checklist",
      summary: "Productive everyday use of approved AI tools: writing, summarizing, analysis, ideation, and safe tool selection.",
      outcomes: [
        "Select approved AI tools for writing, analysis, ideation, and research",
        "Structure prompts that preserve task context, constraints, and desired format",
        "Iterate on AI outputs with a repeatable quality-review routine",
        "Protect sensitive information when using AI in daily work"
      ],
      modules: ["Microsoft AI Fluency", "Google AI Fundamentals", "LHIND tools and best practices"]
    },
    {
      id: "RESP-01",
      title: "Responsible & Trustworthy AI / GDPR & AI",
      status: "To derive from DOCX template",
      source: "DOCX",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data"],
      interests: ["governance"],
      levels: ["Acquire", "Deepen"],
      format: "Compliance scenario, risk checklist, certificate quiz",
      summary: "GDPR, ethics guardrails, IT security, bias, fairness, and responsible AI use.",
      outcomes: [
        "Apply GDPR, security, and policy guardrails to AI use cases",
        "Identify bias, fairness, and accountability risks in AI-supported work",
        "Decide when human review or escalation is required before acting",
        "Document responsible-AI controls and evidence for later review"
      ],
      modules: ["GDPR decision tree", "Responsible AI risk cases"]
    },
    {
      id: "PROMPT-01",
      title: "Hands-on Prompt Engineering Workshop",
      status: "In development",
      source: "DOCX",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["prompting"],
      interests: ["productivity", "consulting"],
      levels: ["Deepen"],
      format: "Prompt clinic, before/after exercises, peer review rubric",
      summary: "Prompt strategies, iterative improvement, quality review of AI outputs, and tool-specific best practices.",
      outcomes: [
        "Design prompts with clear roles, context, constraints, and success criteria",
        "Improve weak prompts through deliberate, testable iterations",
        "Specify structured output contracts that downstream tools can validate",
        "Review generated answers for accuracy, gaps, and unsupported claims"
      ],
      modules: ["Prompt patterns", "Output critique", "Role-based prompt cases"]
    },
    {
      id: "USECASE-01",
      title: "AI Use Case Identification & Business Value Assessment",
      status: "To derive from DOCX template",
      source: "DOCX",
      profileIds: ["bsc", "pvs", "pma", "lead", "tc"],
      dimensions: ["business"],
      interests: ["consulting", "leadership", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Interactive prioritization board and ROI worksheet",
      summary: "Use case identification, business value, prioritization, quick wins, and strategic projects.",
      outcomes: [
        "Discover AI opportunities from real process pain and user needs",
        "Compare use cases by business value, feasibility, risk, and data readiness",
        "Prioritize a defensible backlog of quick wins and strategic bets",
        "Define pilot measures and decision gates for scaling successful work"
      ],
      modules: ["Use case canvas", "Value/risk matrix", "Pilot-to-scale checklist"]
    },
    {
      id: "AI-01",
      title: "AI for Software Engineers / GitHub Copilot",
      status: "Maintained in SharePoint",
      source: "trainings.xlsx",
      profileIds: ["tc", "am", "pvs"],
      dimensions: ["prompting", "business"],
      interests: ["engineering", "productivity"],
      levels: ["Acquire", "Deepen"],
      format: "Code task lab, review checklist, guided tool practice",
      summary: "AI in daily development work, pair programming, AI app basics, architecture context, and responsible code use.",
      outcomes: [],
      modules: ["Generative AI for Software Development", "Get started with AI apps and agents on Azure", "Integrating AI into the Product Architecture"]
    },
    {
      id: "AI-03",
      title: "AI: Introduction to Architecture for AI-Systems",
      status: "Maintained in SharePoint",
      source: "trainings.xlsx",
      profileIds: ["tc", "pvs"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance"],
      levels: ["Deepen", "Create"],
      format: "Architecture cards, trade-off cases, integration worksheet",
      summary: "AI system architecture, Azure, generative AI application design, LLM architecture, data preparation, and scaling.",
      outcomes: [],
      modules: ["Artificial Intelligence on Microsoft Azure", "Generative AI Architecture and Application Development", "Architecture of AI Solutions"]
    },
    {
      id: "AI-02",
      title: "AI: Agentic Software Engineering",
      status: "Maintained in SharePoint",
      source: "trainings.xlsx",
      profileIds: ["tc", "am"],
      dimensions: ["business", "prompting"],
      interests: ["engineering"],
      levels: ["Deepen", "Create"],
      format: "Agent workflow lab, verification rubric, sandboxed implementation task",
      summary: "Agentic AI, tool use, orchestration, reflection, agentic workflows, and engineering verification.",
      outcomes: [],
      modules: ["Building AI Agents and Agentic Workflows", "Agentic AI Engineering", "Building Agentic AI Systems for Developers"]
    },
    {
      id: "AI-10",
      title: "Corporate Ethics & Compliance for AI",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data", "change"],
      interests: ["governance", "leadership"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Policy scenario, risk triage, escalation checklist",
      summary: "Review AI use against GDPR, internal policies, security guardrails, and documented approvals.",
      outcomes: [],
      modules: ["Policy intake", "Risk register", "Compliance decision record"]
    },
    {
      id: "AI-11",
      title: "AI-Driven Testing & QA",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["pvs", "tc", "am"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "QA lab, eval rubric, regression checklist",
      summary: "AI-supported test ideas, evaluation sets, QA gates, and review loops for LLM features.",
      outcomes: [],
      modules: ["Eval design", "Test generation", "Release gate"]
    },
    {
      id: "AI-12",
      title: "AI-Supported Code Modernization",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am"],
      dimensions: ["business", "data"],
      interests: ["engineering", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Legacy case, modernization plan, review checklist",
      summary: "Use AI to analyze legacy code, define refactoring slices, control risks, and prepare reviews.",
      outcomes: [],
      modules: ["Legacy intake", "Modernization backlog", "Risk-controlled refactor"]
    },
    {
      id: "AI-13",
      title: "AI-Assisted Documentation",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "corp", "lead"],
      dimensions: ["prompting", "data"],
      interests: ["productivity", "engineering", "governance"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Documentation sprint, source-grounding checklist, quality review",
      summary: "Use AI for architecture, operations, compliance, and handover documentation without losing sources or accountability.",
      outcomes: [],
      modules: ["Source-grounded docs", "Review rubric", "Reusable doc pack"]
    },
    {
      id: "AI-14",
      title: "Sustainable Software & Green Coding",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "lead"],
      dimensions: ["business", "data"],
      interests: ["engineering", "leadership"],
      levels: ["Acquire", "Deepen"],
      format: "Efficiency case, metric worksheet, architecture trade-off",
      summary: "Review AI and software decisions for efficiency, cost, emissions, and measurable operational impact.",
      outcomes: [],
      modules: ["Efficiency metrics", "Model-routing trade-offs", "Green release checklist"]
    },
    {
      id: "AI-15",
      title: "AI-Enhanced User Research",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "pma", "corp", "lead"],
      dimensions: ["business", "prompting"],
      interests: ["consulting", "productivity"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Research synthesis, persona check, insight review",
      summary: "Use AI to cluster user research, structure hypotheses, check bias, and prepare validatable product decisions.",
      outcomes: [],
      modules: ["Research intake", "Insight synthesis", "Validation plan"]
    },
    {
      id: "AI-16",
      title: "AI & Automation Use Case Spotting",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["business", "change"],
      interests: ["consulting", "leadership", "engineering"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Process walk-through, opportunity canvas, prioritization board",
      summary: "Identify automation and AI opportunities in processes, sort them by value and risk, and formulate pilots.",
      outcomes: [],
      modules: ["Opportunity scan", "Value-risk scoring", "Pilot brief"]
    },
    {
      id: "AI-17",
      title: "AI Cost & Value Economics",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["business", "data"],
      interests: ["consulting", "leadership", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Cost model, value case, operating metric review",
      summary: "Evaluate token, model, platform, and operating costs against value, risk, and scalability.",
      outcomes: [],
      modules: ["Unit economics", "Value hypothesis", "FinOps controls"]
    },
    {
      id: "AI-18",
      title: "Consultative Prompting",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["prompting", "business"],
      interests: ["consulting", "productivity", "leadership"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Client-case prompt clinic, output critique, reusable prompt pack",
      summary: "Build prompts for consulting situations, stakeholder context, hypothesis work, and robust output review.",
      outcomes: [],
      modules: ["Consulting brief", "Prompt iteration", "Client-ready output"]
    },
    {
      id: "AI-19",
      title: "AI Ecosystem & Vendor Landscape",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["literacy", "business"],
      interests: ["foundation", "engineering", "leadership"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Landscape map, vendor-fit checklist, architecture comparison",
      summary: "Classify AI platforms, agent frameworks, tool ecosystems, and vendor trade-offs for real decisions.",
      outcomes: [
        "Classify major model, platform, agent, and tool ecosystem options",
        "Compare vendors against capability, integration, security, and cost needs",
        "Match an AI architecture choice to organizational constraints and goals",
        "Communicate vendor trade-offs in a decision-ready recommendation"
      ],
      modules: ["Platform map", "Framework comparison", "Vendor decision brief"]
    },
    {
      id: "AI-20",
      title: "AI Workforce Strategy",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["tc", "bsc", "pvs", "am", "pma", "corp", "lead"],
      dimensions: ["change", "business"],
      interests: ["leadership", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Role impact map, capability plan, adoption roadmap",
      summary: "Systematically plan roles, skills, responsibilities, and enablement measures for AI transformation.",
      outcomes: [],
      modules: ["Role impact", "Skill matrix", "Enablement roadmap"]
    },
    {
      id: "AI-21",
      title: "Decision Making with AI",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["tc", "bsc", "pvs", "am", "pma", "corp", "lead"],
      dimensions: ["data", "change"],
      interests: ["leadership", "governance", "consulting"],
      levels: ["Deepen", "Create"],
      format: "Decision case, uncertainty review, accountability checklist",
      summary: "Translate AI recommendations into better decisions using metrics, uncertainty, bias checks, and human accountability.",
      outcomes: [
        "Frame AI-assisted decisions with explicit objectives and accountable owners",
        "Interpret model recommendations alongside uncertainty and relevant evidence",
        "Detect bias, automation bias, and weak assumptions before deciding",
        "Document human approval, rationale, and follow-up for consequential decisions"
      ],
      modules: ["Decision brief", "Uncertainty check", "Accountability review"]
    },
    {
      id: "AI-22",
      title: "Data Literacy for AI Projects",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data", "literacy"],
      interests: ["foundation", "governance", "consulting"],
      levels: ["Acquire", "Deepen"],
      format: "Source inventory, quality triage, data-readiness worksheet",
      summary: "Check data sources, quality, freshness, sensitivity, and evaluation before an AI pilot starts.",
      outcomes: [],
      modules: ["Source inventory", "Quality and freshness", "Evaluation sample"]
    },
    {
      id: "AI-23",
      title: "AI Security and Prompt Injection Defense",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["pvs", "tc", "am", "corp", "lead"],
      dimensions: ["data", "business"],
      interests: ["governance", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Threat triage, trust-boundary map, launch-gate checklist",
      summary: "Identify and control prompt injection, data leakage, tool risks, and audit gaps in AI workflows.",
      outcomes: [
        "Map trust boundaries across prompts, data, models, tools, and users",
        "Detect prompt injection and data-exfiltration paths in AI workflows",
        "Approve tools and permissions according to least-privilege controls",
        "Define launch gates and audit evidence for secure AI delivery"
      ],
      modules: ["Trust boundaries", "Tool approval", "Audit controls"]
    },
    {
      id: "AI-24",
      title: "Internal Knowledge Assistants with RAG",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["prompting", "data"],
      interests: ["productivity", "governance", "engineering"],
      levels: ["Acquire", "Deepen"],
      format: "Source inventory, RAG intake, answer-quality review",
      summary: "Plan internal knowledge assistants with source accountability, permissions, evaluation, and fallback paths.",
      outcomes: [
        "Assess source quality, permissions, freshness, and coverage for RAG",
        "Design retrieval workflows with citations, fallbacks, and access boundaries",
        "Evaluate assistant answers for grounding, relevance, and unsafe omissions",
        "Plan an internal knowledge assistant that remains accountable to owners"
      ],
      modules: ["Source readiness", "Access boundary", "Answer evaluation"]
    },
    {
      id: "AI-25",
      title: "AI Vendor and Procurement Evaluation",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["business", "data"],
      interests: ["consulting", "governance", "leadership", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Vendor scorecard, trial criteria, exit-plan review",
      summary: "Evaluate AI vendors by value, data handling, security, integration, lock-in, and operating costs.",
      outcomes: [
        "Build a vendor scorecard covering value, risk, security, and integration",
        "Compare trials with measurable acceptance criteria and realistic workloads",
        "Identify data, contract, lock-in, exit, and operating-cost risks",
        "Recommend a procurement decision with evidence and explicit trade-offs"
      ],
      modules: ["Vendor scorecard", "Trial criteria", "Exit plan"]
    },
    {
      id: "AI-26",
      title: "AI Operations and Incident Response",
      status: "New from capability gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["pvs", "tc", "am", "pma"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance"],
      levels: ["Deepen", "Create"],
      format: "Incident runbook, escalation drill, postmortem update",
      summary: "Monitor AI features in production, triage incident signals, and maintain runbooks for quality, cost, tools, and safety.",
      outcomes: [
        "Monitor production AI features for quality, cost, latency, and safety signals",
        "Triage incidents with clear severity, ownership, and escalation paths",
        "Execute rollback and recovery steps without losing diagnostic evidence",
        "Improve runbooks and release gates from postmortem findings"
      ],
      modules: ["AI incident triage", "Rollback path", "Postmortem loop"]
    },
    {
      id: "AI-31",
      title: "AI for Service Management and Support",
      status: "New from role gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["am", "tc", "pma", "lead"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance", "productivity"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Support triage, confidence threshold, escalation checklist",
      summary: "Use AI for ticket triage, knowledge articles, support responses, and incident handoffs with service controls.",
      outcomes: [],
      modules: ["Service scope", "Confidence threshold", "Escalation path"]
    },
    {
      id: "AI-35",
      title: "AI Meeting Facilitation and Workshop Design",
      status: "New from productivity gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["change", "business", "prompting"],
      interests: ["productivity", "leadership", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Agenda contract, facilitation script, decision log, action tracker",
      summary: "Use AI for better meetings and workshops: clear outcomes, decisions, and follow-up instead of only summaries.",
      outcomes: [],
      modules: ["Agenda contract", "Decision log", "Action tracker"]
    },
    {
      id: "AI-36",
      title: "AI Project Reporting and Steering",
      status: "New from delivery gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["pma", "lead", "bsc", "pvs", "corp", "tc", "am"],
      dimensions: ["business", "change", "data"],
      interests: ["leadership", "consulting", "governance"],
      levels: ["Deepen", "Create"],
      format: "Status evidence, RAG check, risk owner, steering question",
      summary: "Use AI for project status, steering packs, and decision materials with clear evidence and decision questions.",
      outcomes: [],
      modules: ["Source snapshot", "RAG status", "Steering ask"]
    },
    {
      id: "AI-37",
      title: "AI Data Quality and Master Data Processes",
      status: "New from data gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["tc", "am", "corp", "lead", "bsc", "pma"],
      dimensions: ["data", "business"],
      interests: ["governance", "engineering", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Data owner, quality rule, sample check, issue backlog",
      summary: "Identify data quality and master data gaps before AI workflows scale poor sources.",
      outcomes: [],
      modules: ["Data owner", "Quality rule", "Sample check"]
    },
    {
      id: "AI-38",
      title: "AI Process Analysis and Automation Design",
      status: "New from process gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "pma", "am", "tc", "corp", "lead"],
      dimensions: ["business", "change"],
      interests: ["consulting", "leadership", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Process map, exception log, value check, human fallback",
      summary: "Evaluate AI automation ideas only after process understanding, exception analysis, and pilot controls.",
      outcomes: [],
      modules: ["Process map", "Exception log", "Automation pilot"]
    },
    {
      id: "AI-39",
      title: "AI Risk Management and Internal Controls",
      status: "New from governance gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["corp", "lead", "bsc", "pma", "tc", "am"],
      dimensions: ["data", "business", "change"],
      interests: ["governance", "leadership", "consulting"],
      levels: ["Deepen", "Create"],
      format: "Risk register, control test, audit trail, approval owner",
      summary: "Make AI risks manageable with owners, controls, audit evidence, and policy exception review.",
      outcomes: [
        "Build an AI risk register with owners, controls, evidence, and review dates",
        "Test whether controls actually reduce material AI risks in practice",
        "Trace approvals, exceptions, and residual risk through an audit trail",
        "Escalate policy gaps before they become unmanaged operational debt"
      ],
      modules: ["Risk register", "Control test", "Audit evidence"]
    },
    {
      id: "AI-40",
      title: "AI Knowledge Management and Content Governance",
      status: "New from knowledge gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data", "prompting", "change"],
      interests: ["governance", "productivity", "engineering"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Content owner, freshness check, source ranking, access rule",
      summary: "Curate knowledge sources for AI search and internal assistants before retrieval amplifies poor sources.",
      outcomes: [],
      modules: ["Source owner", "Freshness check", "Access rule"]
    },
    {
      id: "AI-42",
      title: "AI Architecture Decision Governance",
      status: "New from architecture gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["tc", "pvs", "am", "lead", "bsc", "pma"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance", "leadership"],
      levels: ["Deepen", "Create"],
      format: "ADR, threat model, cost model, architecture review",
      summary: "Document AI architecture decisions for models, vendors, security boundaries, and costs in a traceable way.",
      outcomes: [],
      modules: ["ADR", "Threat model", "Cost tradeoff"]
    },
    {
      id: "AI-43",
      title: "AI Product Backlog and Prioritization",
      status: "New from product gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["pvs", "pma", "bsc", "lead", "tc"],
      dimensions: ["business", "change"],
      interests: ["consulting", "leadership"],
      levels: ["Deepen", "Create"],
      format: "Evidence note, scoring rubric, dependency check, decision log",
      summary: "Use AI to structure backlog and roadmap decisions more transparently by value, effort, risk, and dependencies.",
      outcomes: [],
      modules: ["Evidence note", "Scoring rubric", "Decision log"]
    },
    {
      id: "AI-45",
      title: "AI Test Data and Synthetic Data Governance",
      status: "New from QA/data gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["tc", "am", "pvs", "corp"],
      dimensions: ["data"],
      interests: ["governance", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Data classification, coverage matrix, drift check, leakage test",
      summary: "Use synthetic and masked test data for AI and software tests with privacy, coverage, and leakage controls.",
      outcomes: [],
      modules: ["Classification", "Coverage", "Leakage test"]
    },
    {
      id: "AI-48",
      title: "AI Business Applications, ERP, and CRM Consulting",
      status: "New from role/capability gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["bsc", "pvs", "corp", "tc", "lead"],
      dimensions: ["business", "data"],
      interests: ["consulting", "governance", "engineering"],
      levels: ["Deepen", "Create"],
      format: "System boundary, data owner, exception rule, integration note",
      summary: "Evaluate AI use cases in SAP, Salesforce, Microsoft business solutions, and ERP/CRM workflows with system boundaries, data ownership, and integration context.",
      outcomes: [],
      modules: ["System boundary", "Data owner", "Integration note"]
    },
    {
      id: "AI-49",
      title: "AI Cloud, Data Platform, and IoT Use Case Design",
      status: "New from platform/data gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["tc", "am", "pvs", "lead"],
      dimensions: ["data", "business"],
      interests: ["engineering", "governance"],
      levels: ["Deepen", "Create"],
      format: "Architecture sketch, data boundary, streaming fit, platform decision",
      summary: "Design AI use cases with cloud, data platform, and IoT context around data flows, latency, ownership, and platform boundaries.",
      outcomes: [],
      modules: ["Architecture sketch", "Data boundary", "Platform decision"]
    },
    {
      id: "AI-51",
      title: "AI Human Review and Approval Workflow Design",
      status: "New from governance/compliance gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["tc", "corp", "lead", "bsc", "pma", "am"],
      dimensions: ["data", "change"],
      interests: ["governance", "leadership"],
      levels: ["Deepen", "Create"],
      format: "Review role, approval gate, quality checklist, appeal path",
      summary: "Design human-in-the-loop review, approval gates, escalation, and quality checklists for AI-supported decisions and content.",
      outcomes: [],
      modules: ["Review role", "Approval gate", "Appeal path"]
    },
    {
      id: "AI-52",
      title: "AI Operating Model and Center of Excellence",
      status: "New from leadership/operating model gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["tc", "lead", "pma", "corp", "bsc", "pvs"],
      dimensions: ["change", "business"],
      interests: ["leadership", "consulting", "engineering"],
      levels: ["Create"],
      format: "Role charter, standards backlog, asset registry, governance cadence",
      summary: "Operationalize AI scaling through clear roles, standards, reusable assets, a champion network, and governance cadence.",
      outcomes: [],
      modules: ["Role charter", "Asset registry", "Governance cadence"]
    },
    {
      id: "AI-53",
      title: "AI Service Desk Runbook and Knowledge Automation",
      status: "New from application management gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["am", "tc", "corp", "lead"],
      dimensions: ["business", "data", "change"],
      interests: ["engineering", "governance", "productivity"],
      levels: ["Deepen", "Create"],
      format: "Ticket pattern, runbook step, source article, handoff trigger",
      summary: "Evaluate recurring service desk tickets, known fixes, runbooks, and knowledge base gaps for AI-supported support automation.",
      outcomes: [],
      modules: ["Ticket pattern", "Runbook step", "Handoff trigger"]
    },
    {
      id: "AI-54",
      title: "AI Security Review and Threat Triage for Business Teams",
      status: "New from security/governance gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["tc", "corp", "lead", "bsc", "pvs"],
      dimensions: ["data", "business"],
      interests: ["governance", "engineering", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Data boundary, tool approval, access check, abuse case",
      summary: "Triage business AI ideas for sensitive data, external tools, identity risks, and untrusted inputs before security review starts.",
      outcomes: [],
      modules: ["Data boundary", "Tool approval", "Abuse case"]
    },
    {
      id: "AI-57",
      title: "AI Prompt Library Governance and Reuse",
      status: "New from prompt/knowledge gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["corp", "lead", "tc", "bsc", "pvs", "pma"],
      dimensions: ["prompting", "change", "data"],
      interests: ["governance", "productivity", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Pattern owner, version note, evaluation example, retirement rule",
      summary: "Manage shared prompts as reusable patterns with an owner, version, evaluation example, and retirement rule.",
      outcomes: [],
      modules: ["Pattern owner", "Version note", "Retirement rule"]
    },
    {
      id: "HARNESS-TC-01",
      title: "Harness Engineering for Reliable Agent Delivery",
      status: "New curriculum course",
      source: "Phase 14 agent workbench track",
      profileIds: ["tc"],
      dimensions: ["business", "prompting", "data"],
      interests: ["consulting", "engineering"],
      levels: ["Deepen", "Create"],
      format: "14 lecture activities, 8 project labs, reusable workbench artifacts",
      summary: "Design the repository, state, scope, feedback, verification, review, loops, and graphs that make AI-assisted delivery reliable across sessions.",
      outcomes: [
        "Design a task-scoped harness around an AI coding workflow",
        "Persist state and runtime evidence across independent sessions",
        "Verify agent artifacts with fail-closed checks and review gates",
        "Choose bounded loops or explicit graphs for delivery coordination"
      ],
      modules: [
        "See the reliability gap",
        "Structure the repository",
        "Connect sessions",
        "Feedback and scope",
        "Verification",
        "Put the harness together",
        "Automate the loop",
        "Structure the system"
      ]
    },
    {
      id: "CHAMP-01",
      title: "AI Champion / Community Lead",
      status: "Role format from DOCX",
      source: "DOCX",
      profileIds: ["tc", "bsc", "pvs", "pma", "lead", "corp"],
      dimensions: ["change", "business", "prompting"],
      interests: ["leadership", "consulting", "engineering"],
      levels: ["Create"],
      format: "Mentoring plan, brown-bag kit, community contribution backlog",
      summary: "Multiplier role for knowledge transfer, brown bags, communities of practice, and piloting new AI approaches.",
      outcomes: [],
      modules: ["Mentoring checklist", "Brown-bag template", "Community contribution rubric"]
    }
  ],
  tracks: [
    {
      id: "baseline",
      code: "LP01",
      label: "Core AI Foundation",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      stages: [
        { label: "Acquire", courses: ["PRIMER-01", "AI-09", "AI-06", "RESP-01", "AI-10", "AI-22", "AI-24", "AI-35", "AI-37", "AI-40"] },
        { label: "Deepen", courses: ["AI-06", "AI-22", "PROMPT-01", "AI-18", "AI-23", "AI-39", "AI-51", "AI-54", "AI-57"] }
      ]
    },
    {
      id: "consulting",
      code: "LP02",
      label: "Consulting & Value Creation",
      profileIds: ["bsc", "pvs", "pma"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06"] },
        { label: "Deepen", courses: ["USECASE-01", "AI-15", "AI-16", "AI-17", "AI-18", "AI-25", "AI-35", "AI-36", "AI-38", "AI-39", "AI-43", "AI-48", "AI-51", "AI-54", "AI-57"] },
        { label: "Create", courses: ["AI-19", "AI-42", "AI-52", "CHAMP-01"] }
      ]
    },
    {
      id: "technology",
      code: "LP03",
      label: "Technology & Engineering Delivery",
      profileIds: ["tc", "am"],
      stages: [
        { label: "Acquire", courses: ["AI-01", "RESP-01", "AI-14"] },
        { label: "Deepen", courses: ["AI-03", "AI-02", "AI-11", "AI-12", "AI-13", "AI-23", "AI-24", "AI-26", "AI-31", "AI-36", "AI-37", "AI-38", "AI-40", "AI-43", "AI-45", "AI-49", "AI-51", "AI-53", "AI-54", "AI-57", "HARNESS-TC-01"] },
        { label: "Create", courses: ["AI-19", "AI-25", "AI-42", "AI-52", "AI-53", "CHAMP-01", "HARNESS-TC-01"] }
      ]
    },
    {
      id: "leadership",
      code: "LP04",
      label: "Leadership & Transformation",
      profileIds: ["lead", "corp", "pma", "bsc"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06"] },
        { label: "Deepen", courses: ["AI-17", "AI-20", "AI-21", "AI-25", "AI-35", "AI-36", "AI-37", "AI-38", "AI-39", "AI-40", "AI-43", "AI-48", "AI-49", "AI-51", "AI-54", "AI-57"] },
        { label: "Create", courses: ["AI-19", "AI-42", "AI-52", "CHAMP-01"] }
      ]
    },
    {
      id: "corporate-functions",
      code: "LP05",
      label: "Corporate Functions Enablement",
      profileIds: ["corp"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06", "AI-22", "AI-24", "AI-35", "AI-37", "AI-40"] },
        { label: "Deepen", courses: ["AI-10", "AI-36", "AI-38", "AI-39", "AI-45", "AI-48", "AI-51", "AI-53", "AI-54", "AI-57"] },
        { label: "Create", courses: ["AI-20", "AI-21", "AI-52", "AI-57", "CHAMP-01"] }
      ]
    }
  ]
};
