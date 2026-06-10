window.LrnData = {
  levels: [
    { id: 0, label: "Nicht relevant", short: "n. a." },
    { id: 1, label: "Acquire", short: "Grundlagen" },
    { id: 2, label: "Deepen", short: "Anwenden" },
    { id: 3, label: "Create", short: "Gestalten" }
  ],
  dimensions: [
    {
      id: "literacy",
      label: "Grundverständnis & AI Literacy",
      cluster: "Foundation",
      short: "Begriffe, Rollenbild, AI-Systeme erklären"
    },
    {
      id: "prompting",
      label: "Applied Skills & Prompting",
      cluster: "Foundation / Advisory",
      short: "Tools nutzen, Prompts verbessern, Outputs prüfen"
    },
    {
      id: "business",
      label: "Business & Use Cases",
      cluster: "Product and Process / Advisory",
      short: "Use Cases erkennen, Business Value bewerten, Projekte strukturieren"
    },
    {
      id: "data",
      label: "Daten & Compliance",
      cluster: "Foundation",
      short: "Datenqualität, GDPR, Ethik und Leitplanken berücksichtigen"
    },
    {
      id: "change",
      label: "Change & Innovation",
      cluster: "Leadership and Strategy",
      short: "Human-in-the-loop, Team-Enablement, Wissenstransfer"
    }
  ],
  questions: [
    {
      id: "q1",
      dimension: "literacy",
      text: "Wie klar ist Ihnen, welche AI-bezogenen Erwartungen an Ihre aktuelle Rolle bei LHIND gestellt werden?"
    },
    {
      id: "q2",
      dimension: "literacy",
      text: "Wie sicher können Sie klassische Softwarelösungen, Machine Learning und Generative AI verständlich voneinander abgrenzen?"
    },
    {
      id: "q3",
      dimension: "prompting",
      text: "Wie häufig und zielführend setzen Sie AI-Tools bereits für Recherche, Text, Code, Analysen oder Konzeptarbeit ein?"
    },
    {
      id: "q4",
      dimension: "prompting",
      text: "Wie gut können Sie Prompts strukturieren, iterativ verbessern und AI-Ergebnisse kritisch auf Fehler, Bias und Lücken prüfen?"
    },
    {
      id: "q5",
      dimension: "business",
      text: "Wie sicher identifizieren und priorisieren Sie sinnvolle AI-Use-Cases mit erkennbarem Business Value?"
    },
    {
      id: "q6",
      dimension: "data",
      text: "Wie gut können Sie einschätzen, welche Datenquellen, Datenqualität und Datenmengen ein AI-Use-Case benötigt?"
    },
    {
      id: "q7",
      dimension: "data",
      text: "Wie gut kennen und berücksichtigen Sie die relevanten Leitplanken zu Datenschutz, IT-Sicherheit, Ethik und verantwortungsvollem AI-Einsatz?"
    },
    {
      id: "q8",
      dimension: "change",
      text: "Wie sicher binden Sie AI-Systeme so in Prozesse und Teams ein, dass Menschen verantwortlich bleiben und Rollen klar sind?"
    },
    {
      id: "q9",
      dimension: "business",
      text: "Wie routiniert strukturieren Sie AI-Initiativen mit Scope, Risiken, Stakeholdern, Pilotierung und Roll-out?"
    },
    {
      id: "q10",
      dimension: "change",
      text: "In welchem Maß gestalten Sie neue AI-basierte Lösungen, Workflows oder Services aktiv mit und teilen Ihre Erfahrungen?"
    }
  ],
  profiles: [
    {
      id: "bsc",
      label: "Business & Strategy Consulting",
      segment: "BSC",
      description: "Consulting, Business Analyse, Strategie, Prozess- und Kundenkontext.",
      targets: { literacy: 2, prompting: 3, business: 3, data: 2, change: 3 }
    },
    {
      id: "pvs",
      label: "Products & Value Streams",
      segment: "PVS",
      description: "Product Management, Product Sales, Value Streams und produktnahe Beratung.",
      targets: { literacy: 2, prompting: 2, business: 2, data: 2, change: 2 }
    },
    {
      id: "tc",
      label: "Technology Consulting",
      segment: "TC",
      description: "Engineering, Architektur, Security, Cloud, IoT, Data und technische Umsetzung.",
      targets: { literacy: 3, prompting: 2, business: 2, data: 3, change: 1 }
    },
    {
      id: "am",
      label: "Application Management",
      segment: "AM",
      description: "Service Technology, Service Management, Betrieb und Operations-nahe Rollen.",
      targets: { literacy: 2, prompting: 2, business: 1, data: 3, change: 1 }
    },
    {
      id: "pma",
      label: "Project Management & Agility",
      segment: "PMA",
      description: "Project Management, Product Ownership, Agility und Transformation Delivery.",
      targets: { literacy: 2, prompting: 3, business: 3, data: 2, change: 3 }
    },
    {
      id: "corp",
      label: "Corporate Functions",
      segment: "CF",
      description: "HR, Finance, Legal, Communications, Procurement und interne Fachfunktionen.",
      targets: { literacy: 2, prompting: 2, business: 1, data: 2, change: 3 }
    },
    {
      id: "lead",
      label: "Leadership",
      segment: "Leadership",
      description: "People Leadership, Portfolio-Entscheidungen und strategische AI-Transformation.",
      targets: { literacy: 2, prompting: 3, business: 3, data: 3, change: 3 }
    }
  ],
  interests: [
    { id: "foundation", label: "AI Literacy", hint: "Begriffe, Tool-Überblick", dimensions: ["literacy"] },
    { id: "productivity", label: "Produktivität", hint: "Prompts, Assistants, Office", dimensions: ["prompting"] },
    { id: "consulting", label: "Consulting", hint: "Use Cases, Requirements", dimensions: ["business", "prompting"] },
    { id: "engineering", label: "Engineering", hint: "Agents, Architektur, QA", dimensions: ["business", "data"] },
    { id: "governance", label: "Governance", hint: "GDPR, Responsible AI", dimensions: ["data"] },
    { id: "leadership", label: "Leadership", hint: "Change, Workforce, Strategie", dimensions: ["change", "business"] }
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
    { id: 16, cluster: "Advisory and Business Consulting", title: "AI Ecosystem Knowledge", targets: { bsc: "Create", pvs: "Deepen", tc: "Create", am: "Acquire", pma: "Acquire", corp: "Acquire", lead: "Deepen", all: "Acquire" } },
    { id: 17, cluster: "Leadership and Strategy", title: "Managing AI Transformations", targets: { bsc: "Create", pvs: "Deepen", tc: "Acquire", am: "Acquire", pma: "Create", corp: "Acquire", lead: "Deepen", all: "n. a." } },
    { id: 18, cluster: "Leadership and Strategy", title: "AI Workforce Strategy", targets: { bsc: "Deepen", pvs: "Acquire", tc: "Acquire", am: "Acquire", pma: "Acquire", corp: "Create", lead: "Create", all: "n. a." } },
    { id: 19, cluster: "Leadership and Strategy", title: "Decision Making with AI", targets: { bsc: "Deepen", pvs: "Deepen", tc: "Acquire", am: "Acquire", pma: "Deepen", corp: "Deepen", lead: "Create", all: "n. a." } }
  ],
  courses: [
    {
      id: "AI-09",
      title: "AI Fundamentals / AI for Everyone",
      status: "SharePoint gepflegt",
      source: "trainings.xlsx",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["literacy", "data"],
      interests: ["foundation", "governance"],
      levels: ["Acquire"],
      format: "Self-paced online, text-based LRN module plus knowledge checks",
      summary: "Grundlagen zu AI, Generative AI, realistischen Grenzen, Business Use Cases und Responsible AI.",
      modules: ["AI for Everyone", "Generative KI für alle"]
    },
    {
      id: "AI-06",
      title: "AI: Concepts and Tools for Personal Productivity",
      status: "SharePoint gepflegt / LHIND tool part to build",
      source: "trainings.xlsx",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["prompting", "literacy"],
      interests: ["productivity", "foundation"],
      levels: ["Acquire", "Deepen"],
      format: "Text lesson, interactive prompt lab, LHIND tool checklist",
      summary: "Produktive Nutzung genehmigter AI-Tools im Alltag: Schreiben, Zusammenfassen, Analysieren, Ideation und sichere Toolauswahl.",
      modules: ["Microsoft AI Fluency", "Google AI Fundamentals", "LHIND tools and best practices"]
    },
    {
      id: "RESP-01",
      title: "Responsible & Trustworthy AI / GDPR & AI",
      status: "aus DOCX-Vorlage abzuleiten",
      source: "DOCX",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data"],
      interests: ["governance"],
      levels: ["Acquire", "Deepen"],
      format: "Compliance scenario, risk checklist, certificate quiz",
      summary: "GDPR, Ethik-Leitplanken, IT-Sicherheit, Bias, Fairness und verantwortungsvoller AI-Einsatz.",
      modules: ["GDPR decision tree", "Responsible AI risk cases"]
    },
    {
      id: "PROMPT-01",
      title: "Hands-on Prompt Engineering Workshop",
      status: "in Entwicklung",
      source: "DOCX",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["prompting"],
      interests: ["productivity", "consulting"],
      levels: ["Deepen"],
      format: "Prompt clinic, before/after exercises, peer review rubric",
      summary: "Prompt-Strategien, iterative Verbesserung, Qualitätsprüfung von AI-Outputs und tool-spezifische Best Practices.",
      modules: ["Prompt patterns", "Output critique", "Role-based prompt cases"]
    },
    {
      id: "AI-04",
      title: "AI: Requirement Engineering with AI",
      status: "angefragt / in progress",
      source: "trainings.xlsx",
      profileIds: ["bsc", "pvs", "pma", "lead"],
      dimensions: ["business", "prompting"],
      interests: ["consulting", "leadership"],
      levels: ["Deepen", "Create"],
      format: "Case study, requirement rewrite, acceptance-criteria lab",
      summary: "AI-gestützte Requirements, Enterprise-AI-Strategie, Stakeholder-Kontext und strategische Umsetzung.",
      modules: ["How to Build an Enterprise AI Strategy", "AI for Managers", "AI Strategy for Business Leaders"]
    },
    {
      id: "USECASE-01",
      title: "AI Use Case Identification & Business Value Assessment",
      status: "aus DOCX-Vorlage abzuleiten",
      source: "DOCX",
      profileIds: ["bsc", "pvs", "pma", "lead", "tc"],
      dimensions: ["business"],
      interests: ["consulting", "leadership", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Interactive prioritization board and ROI worksheet",
      summary: "Use-Case-Identifikation, Business Value, Priorisierung, Quick Wins und strategische Projekte.",
      modules: ["Use case canvas", "Value/risk matrix", "Pilot-to-scale checklist"]
    },
    {
      id: "AI-05",
      title: "AI for Project Managers and Product Owners",
      status: "SharePoint gepflegt / intern in Ausarbeitung",
      source: "trainings.xlsx",
      profileIds: ["pma", "pvs", "bsc", "lead"],
      dimensions: ["business", "change", "prompting"],
      interests: ["leadership", "consulting", "productivity"],
      levels: ["Acquire", "Deepen"],
      format: "Planning simulator, prompt cards, project risk exercises",
      summary: "AI für Projektplanung, Roadmap, Stakeholder-Kommunikation, agile Delivery und PM-spezifische Prompts.",
      modules: ["Generative AI Overview for PMs", "Prompt Engineering for Project Managers", "Project Leadership in the Age of AI"]
    },
    {
      id: "CHANGE-01",
      title: "AI Change Management & Team Integration",
      status: "aus DOCX-Vorlage abzuleiten",
      source: "DOCX",
      profileIds: ["pma", "lead", "bsc", "pvs", "corp"],
      dimensions: ["change"],
      interests: ["leadership"],
      levels: ["Deepen", "Create"],
      format: "Role-mapping exercise, adoption plan, team intervention cases",
      summary: "Human-in-the-loop, Rollenklärung in AI-Projekten, Change-Prozesse und Team-Enablement.",
      modules: ["Human accountability map", "Team adoption scenarios"]
    },
    {
      id: "AI-01",
      title: "AI for Software Engineers / GitHub Copilot",
      status: "SharePoint gepflegt",
      source: "trainings.xlsx",
      profileIds: ["tc", "am", "pvs"],
      dimensions: ["prompting", "business"],
      interests: ["engineering", "productivity"],
      levels: ["Acquire", "Deepen"],
      format: "Code task lab, review checklist, guided tool practice",
      summary: "AI im Entwicklungsalltag, Pair Programming, AI App Grundlagen, Architekturbezug und verantwortliche Code-Nutzung.",
      modules: ["Generative AI for Software Development", "Get started with AI apps and agents on Azure", "Integrating AI into the Product Architecture"]
    },
    {
      id: "AI-03",
      title: "AI: Introduction to Architecture for AI-Systems",
      status: "SharePoint gepflegt",
      source: "trainings.xlsx",
      profileIds: ["tc", "pvs"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance"],
      levels: ["Deepen", "Create"],
      format: "Architecture cards, trade-off cases, integration worksheet",
      summary: "AI-Systemarchitektur, Azure, GenAI-Application-Design, LLM-Architektur, Data Preparation und Skalierung.",
      modules: ["Artificial Intelligence on Microsoft Azure", "Generative AI Architecture and Application Development", "Architecture of AI Solutions"]
    },
    {
      id: "AI-02",
      title: "AI: Agentic Software Engineering",
      status: "SharePoint gepflegt",
      source: "trainings.xlsx",
      profileIds: ["tc", "am"],
      dimensions: ["business", "prompting"],
      interests: ["engineering"],
      levels: ["Deepen", "Create"],
      format: "Agent workflow lab, verification rubric, sandboxed implementation task",
      summary: "Agentic AI, Tool-Nutzung, Orchestrierung, Reflection, agentische Workflows und Engineering-Verifikation.",
      modules: ["Building AI Agents and Agentic Workflows", "Agentic AI Engineering", "Building Agentic AI Systems for Developers"]
    },
    {
      id: "AI-07",
      title: "AI: Introduction to Data-driven Decision Making",
      status: "SharePoint gepflegt",
      source: "trainings.xlsx",
      profileIds: ["lead", "corp", "bsc", "pma"],
      dimensions: ["data", "change"],
      interests: ["leadership", "governance"],
      levels: ["Deepen", "Create"],
      format: "Decision case, bias check, forecast scenario",
      summary: "AI-gestützte Entscheidungen, Forecasting, Bias, Unsicherheit, Ethik und Leadership Accountability.",
      modules: ["AI-Augmented Decision-Making for Business Leaders", "AI Powered Decision Making"]
    },
    {
      id: "AI-08",
      title: "AI for Leaders",
      status: "SharePoint gepflegt",
      source: "trainings.xlsx",
      profileIds: ["lead", "bsc", "pma", "pvs", "corp"],
      dimensions: ["change", "business", "data"],
      interests: ["leadership", "governance"],
      levels: ["Deepen", "Create"],
      format: "Executive scenario, operating-model canvas, governance checklist",
      summary: "AI-Adoption, Governance, Workforce Transformation, Human-in-the-loop und AI Operating Models.",
      modules: ["Microsoft AI Foundations for Business Leaders", "Introduction to GenAI for Executives", "Applied Agentic AI for Organizational Transformation"]
    },
    {
      id: "CHAMP-01",
      title: "AI Champion / Community Lead",
      status: "Rollenformat aus DOCX",
      source: "DOCX",
      profileIds: ["bsc", "pvs", "tc", "pma", "lead", "corp"],
      dimensions: ["change", "business", "prompting"],
      interests: ["leadership", "consulting", "engineering"],
      levels: ["Create"],
      format: "Mentoring plan, brown-bag kit, community contribution backlog",
      summary: "Multiplikatorenrolle für Wissenstransfer, Brown Bags, Communities of Practice und Pilotierung neuer AI-Ansätze.",
      modules: ["Mentoring checklist", "Brown-bag template", "Community contribution rubric"]
    }
  ],
  tracks: [
    {
      id: "baseline",
      label: "Basis für alle Rollen",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06", "RESP-01"] },
        { label: "Deepen", courses: ["PROMPT-01"] }
      ]
    },
    {
      id: "consulting",
      label: "Consulting & Value Path",
      profileIds: ["bsc", "pvs", "pma"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06"] },
        { label: "Deepen", courses: ["AI-04", "USECASE-01", "AI-05"] },
        { label: "Create", courses: ["CHAMP-01"] }
      ]
    },
    {
      id: "technology",
      label: "Technology Path",
      profileIds: ["tc", "am"],
      stages: [
        { label: "Acquire", courses: ["AI-01", "RESP-01"] },
        { label: "Deepen", courses: ["AI-03", "AI-02"] },
        { label: "Create", courses: ["CHAMP-01"] }
      ]
    },
    {
      id: "leadership",
      label: "Leadership & Transformation Path",
      profileIds: ["lead", "corp", "pma", "bsc"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06"] },
        { label: "Deepen", courses: ["AI-07", "AI-08", "CHANGE-01"] },
        { label: "Create", courses: ["CHAMP-01"] }
      ]
    }
  ]
};
