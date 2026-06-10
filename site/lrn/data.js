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
      code: "R01-BSC",
      label: "Business & Strategy Consulting",
      segment: "BSC",
      description: "Consulting, Business Analyse, Strategie, Prozess- und Kundenkontext.",
      targets: { literacy: 2, prompting: 3, business: 3, data: 2, change: 3 }
    },
    {
      id: "pvs",
      code: "R02-PVS",
      label: "Products & Value Streams",
      segment: "PVS",
      description: "Product Management, Product Sales, Value Streams und produktnahe Beratung.",
      targets: { literacy: 2, prompting: 2, business: 2, data: 2, change: 2 }
    },
    {
      id: "tc",
      code: "R03-TC",
      label: "Technology Consulting",
      segment: "TC",
      description: "Engineering, Architektur, Security, Cloud, IoT, Data und technische Umsetzung.",
      targets: { literacy: 3, prompting: 2, business: 2, data: 3, change: 1 }
    },
    {
      id: "am",
      code: "R04-AM",
      label: "Application Management",
      segment: "AM",
      description: "Service Technology, Service Management, Betrieb und Operations-nahe Rollen.",
      targets: { literacy: 2, prompting: 2, business: 1, data: 3, change: 1 }
    },
    {
      id: "pma",
      code: "R05-PMA",
      label: "Project Management & Agility",
      segment: "PMA",
      description: "Project Management, Product Ownership, Agility und Transformation Delivery.",
      targets: { literacy: 2, prompting: 3, business: 3, data: 2, change: 3 }
    },
    {
      id: "corp",
      code: "R06-CF",
      label: "Corporate Functions",
      segment: "CF",
      description: "HR, Finance, Legal, Communications, Procurement und interne Fachfunktionen.",
      targets: { literacy: 2, prompting: 2, business: 1, data: 2, change: 3 }
    },
    {
      id: "lead",
      code: "R07-LEAD",
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
      id: "AI-10",
      title: "Corporate Ethics & Compliance for AI",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data", "change"],
      interests: ["governance", "leadership"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Policy scenario, risk triage, escalation checklist",
      summary: "AI-Nutzung gegen GDPR, interne Policies, Sicherheitsleitplanken und dokumentierte Freigaben prüfen.",
      modules: ["Policy intake", "Risk register", "Compliance decision record"]
    },
    {
      id: "AI-11",
      title: "AI-Driven Testing & QA",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["pvs", "tc", "am"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "QA lab, eval rubric, regression checklist",
      summary: "AI-gestützte Testideen, Evaluationssets, QA-Gates und Review-Schleifen für LLM-Features.",
      modules: ["Eval design", "Test generation", "Release gate"]
    },
    {
      id: "AI-12",
      title: "AI-Supported Code Modernization",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am"],
      dimensions: ["business", "data"],
      interests: ["engineering", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Legacy case, modernization plan, review checklist",
      summary: "Legacy-Code mit AI analysieren, Refactoring-Slices schneiden, Risiken kontrollieren und Reviews vorbereiten.",
      modules: ["Legacy intake", "Modernization backlog", "Risk-controlled refactor"]
    },
    {
      id: "AI-13",
      title: "AI-Assisted Documentation",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "corp", "lead"],
      dimensions: ["prompting", "data"],
      interests: ["productivity", "engineering", "governance"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Documentation sprint, source-grounding checklist, quality review",
      summary: "AI für Architektur-, Betriebs-, Compliance- und Übergabedokumentation nutzen, ohne Quellen und Verantwortung zu verlieren.",
      modules: ["Source-grounded docs", "Review rubric", "Reusable doc pack"]
    },
    {
      id: "AI-14",
      title: "Sustainable Software & Green Coding",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "lead"],
      dimensions: ["business", "data"],
      interests: ["engineering", "leadership"],
      levels: ["Acquire", "Deepen"],
      format: "Efficiency case, metric worksheet, architecture trade-off",
      summary: "AI- und Softwareentscheidungen auf Effizienz, Kosten, Emissionen und messbare Betriebswirkung prüfen.",
      modules: ["Efficiency metrics", "Model-routing trade-offs", "Green release checklist"]
    },
    {
      id: "AI-15",
      title: "AI-Enhanced User Research",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "pma", "corp", "lead"],
      dimensions: ["business", "prompting"],
      interests: ["consulting", "productivity"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Research synthesis, persona check, insight review",
      summary: "User-Research mit AI clustern, Hypothesen strukturieren, Bias prüfen und validierbare Produktentscheidungen vorbereiten.",
      modules: ["Research intake", "Insight synthesis", "Validation plan"]
    },
    {
      id: "AI-16",
      title: "AI & Automation Use Case Spotting",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["business", "change"],
      interests: ["consulting", "leadership", "engineering"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Process walk-through, opportunity canvas, prioritization board",
      summary: "Automatisierungs- und AI-Potenziale in Prozessen erkennen, nach Wert und Risiko sortieren und als Pilot formulieren.",
      modules: ["Opportunity scan", "Value-risk scoring", "Pilot brief"]
    },
    {
      id: "AI-17",
      title: "AI Cost & Value Economics",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["business", "data"],
      interests: ["consulting", "leadership", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Cost model, value case, operating metric review",
      summary: "Token-, Modell-, Plattform- und Betriebskosten gegen Nutzen, Risiko und Skalierbarkeit bewerten.",
      modules: ["Unit economics", "Value hypothesis", "FinOps controls"]
    },
    {
      id: "AI-18",
      title: "Consultative Prompting",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["prompting", "business"],
      interests: ["consulting", "productivity", "leadership"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Client-case prompt clinic, output critique, reusable prompt pack",
      summary: "Prompts für Beratungssituationen, Stakeholder-Kontext, Hypothesenarbeit und belastbare Ergebnisprüfung aufbauen.",
      modules: ["Consulting brief", "Prompt iteration", "Client-ready output"]
    },
    {
      id: "AI-19",
      title: "AI Ecosystem & Vendor Landscape",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["literacy", "business"],
      interests: ["foundation", "engineering", "leadership"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Landscape map, vendor-fit checklist, architecture comparison",
      summary: "AI-Plattformen, Agent Frameworks, Tool-Ökosysteme und Vendor-Trade-offs für reale Entscheidungen einordnen.",
      modules: ["Platform map", "Framework comparison", "Vendor decision brief"]
    },
    {
      id: "AI-20",
      title: "AI Workforce Strategy",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["change", "business"],
      interests: ["leadership", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Role impact map, capability plan, adoption roadmap",
      summary: "Rollen, Skills, Verantwortlichkeiten und Enablement-Maßnahmen für AI-Transformation systematisch planen.",
      modules: ["Role impact", "Skill matrix", "Enablement roadmap"]
    },
    {
      id: "AI-21",
      title: "Decision Making with AI",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data", "change"],
      interests: ["leadership", "governance", "consulting"],
      levels: ["Deepen", "Create"],
      format: "Decision case, uncertainty review, accountability checklist",
      summary: "AI-Empfehlungen mit Metriken, Unsicherheit, Bias und menschlicher Verantwortung in bessere Entscheidungen übersetzen.",
      modules: ["Decision brief", "Uncertainty check", "Accountability review"]
    },
    {
      id: "AI-22",
      title: "Data Literacy for AI Projects",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data", "literacy"],
      interests: ["foundation", "governance", "consulting"],
      levels: ["Acquire", "Deepen"],
      format: "Source inventory, quality triage, data-readiness worksheet",
      summary: "Datenquellen, Qualität, Aktualität, Sensitivität und Evaluation prüfen, bevor ein AI-Pilot startet.",
      modules: ["Source inventory", "Quality and freshness", "Evaluation sample"]
    },
    {
      id: "AI-23",
      title: "AI Security and Prompt Injection Defense",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["pvs", "tc", "am", "corp", "lead"],
      dimensions: ["data", "business"],
      interests: ["governance", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Threat triage, trust-boundary map, launch-gate checklist",
      summary: "Prompt Injection, Datenabfluss, Tool-Risiken und Audit-Gaps in AI-Workflows erkennen und kontrollieren.",
      modules: ["Trust boundaries", "Tool approval", "Audit controls"]
    },
    {
      id: "AI-24",
      title: "Internal Knowledge Assistants with RAG",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["prompting", "data"],
      interests: ["productivity", "governance", "engineering"],
      levels: ["Acquire", "Deepen"],
      format: "Source inventory, RAG intake, answer-quality review",
      summary: "Interne Wissensassistenten mit Quellenverantwortung, Berechtigungen, Evaluation und Fallback-Pfad planen.",
      modules: ["Source readiness", "Access boundary", "Answer evaluation"]
    },
    {
      id: "AI-25",
      title: "AI Vendor and Procurement Evaluation",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["business", "data"],
      interests: ["consulting", "governance", "leadership", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Vendor scorecard, trial criteria, exit-plan review",
      summary: "AI-Anbieter nach Nutzen, Datenhandling, Security, Integration, Lock-in und Betriebskosten bewerten.",
      modules: ["Vendor scorecard", "Trial criteria", "Exit plan"]
    },
    {
      id: "AI-26",
      title: "AI Operations and Incident Response",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["pvs", "tc", "am", "pma"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance"],
      levels: ["Deepen", "Create"],
      format: "Incident runbook, escalation drill, postmortem update",
      summary: "AI-Features im Betrieb überwachen, Incident-Signale triagieren und Runbooks für Qualität, Kosten, Tools und Safety pflegen.",
      modules: ["AI incident triage", "Rollback path", "Postmortem loop"]
    },
    {
      id: "AI-27",
      title: "AI Portfolio and Roadmap Management",
      status: "neu aus Capability-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "pma", "corp", "lead"],
      dimensions: ["business", "change"],
      interests: ["leadership", "consulting"],
      levels: ["Deepen", "Create"],
      format: "Portfolio board, steering cadence, kill-criteria exercise",
      summary: "AI-Initiativen nach Wert, Risiko, Abhängigkeiten, Kapazität und Lernfortschritt steuern.",
      modules: ["Portfolio board", "Review cadence", "Scaling decision"]
    },
    {
      id: "AI-28",
      title: "AI for HR and People Processes",
      status: "neu aus Rollen-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["corp", "lead", "pma"],
      dimensions: ["data", "change"],
      interests: ["governance", "leadership"],
      levels: ["Deepen", "Create"],
      format: "People-process triage, fairness check, communication script",
      summary: "AI in HR-Workflows mit Datenschutz, Fairness, Mitarbeiterwirkung und menschlicher Entscheidungshoheit einsetzen.",
      modules: ["People-process triage", "Fairness review", "Human decision owner"]
    },
    {
      id: "AI-29",
      title: "AI for Finance and Controlling",
      status: "neu aus Rollen-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["corp", "lead", "bsc"],
      dimensions: ["data", "business"],
      interests: ["governance", "leadership", "consulting"],
      levels: ["Deepen", "Create"],
      format: "Finance review sheet, variance check, assumption log",
      summary: "AI für Finanzkommentare, Forecasts und Controlling nutzen, ohne Quellen, Annahmen und Freigaben zu verlieren.",
      modules: ["Source trace", "Assumption log", "Approval owner"]
    },
    {
      id: "AI-30",
      title: "AI for Legal, Procurement, and Compliance",
      status: "neu aus Rollen-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["corp", "lead", "bsc", "pma"],
      dimensions: ["data", "business"],
      interests: ["governance", "consulting", "leadership"],
      levels: ["Deepen", "Create"],
      format: "Clause triage, vendor-term review, decision record",
      summary: "AI zur Vorbereitung juristischer, Procurement- und Compliance-Arbeit nutzen, mit klarer menschlicher Prüfung.",
      modules: ["Clause register", "Legal reviewer", "Decision record"]
    },
    {
      id: "AI-31",
      title: "AI for Service Management and Support",
      status: "neu aus Rollen-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["am", "tc", "pma", "lead"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance", "productivity"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Support triage, confidence threshold, escalation checklist",
      summary: "AI für Ticket-Triage, Wissensartikel, Supportantworten und Incident-Handoffs mit Service-Kontrollen einsetzen.",
      modules: ["Service scope", "Confidence threshold", "Escalation path"]
    },
    {
      id: "AI-32",
      title: "AI for Sales and Product Consulting",
      status: "neu aus Rollen-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["pvs", "bsc", "lead"],
      dimensions: ["business", "prompting"],
      interests: ["consulting", "productivity", "leadership"],
      levels: ["Deepen", "Create"],
      format: "Customer-context prep, value-story review, follow-up plan",
      summary: "AI für Discovery, Product Consulting, Angebotsvorbereitung und Follow-up nutzen, ohne Kundensignale zu erfinden.",
      modules: ["Customer signal", "Value story", "Stakeholder review"]
    },
    {
      id: "AI-33",
      title: "AI for Corporate Communications and Marketing",
      status: "neu aus Rollen-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["corp", "lead", "bsc", "pma", "pvs"],
      dimensions: ["change", "prompting", "business"],
      interests: ["leadership", "productivity", "consulting"],
      levels: ["Deepen", "Create"],
      format: "Message review, tone check, source pack, approval workflow",
      summary: "AI für interne und externe Kommunikation nutzen, ohne Quellen, Tonalität, Freigaben und Markenwirkung zu verlieren.",
      modules: ["Source pack", "Tone check", "Approval owner"]
    },
    {
      id: "AI-34",
      title: "AI Learning Design and Knowledge Transfer",
      status: "neu aus Enablement-Gap",
      source: "DOCX/XLSX enablement gap",
      profileIds: ["corp", "lead", "pma", "bsc"],
      dimensions: ["change", "prompting"],
      interests: ["leadership", "productivity"],
      levels: ["Deepen", "Create"],
      format: "Learning objective check, practice design, knowledge check, transfer plan",
      summary: "AI nutzen, um rollenbasierte Trainings, Job Aids, Workshops und Transferchecks schneller und wirksamer zu bauen.",
      modules: ["Role outcome", "Practice task", "Knowledge check"]
    },
    {
      id: "AI-35",
      title: "AI Meeting Facilitation and Workshop Design",
      status: "neu aus Produktivitäts-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["change", "business", "prompting"],
      interests: ["productivity", "leadership", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Agenda contract, facilitation script, decision log, action tracker",
      summary: "AI für bessere Meetings und Workshops einsetzen: klare Outcomes, Entscheidungen und Follow-up statt nur Zusammenfassungen.",
      modules: ["Agenda contract", "Decision log", "Action tracker"]
    },
    {
      id: "AI-36",
      title: "AI Project Reporting and Steering",
      status: "neu aus Delivery-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["pma", "lead", "bsc", "pvs", "corp", "tc", "am"],
      dimensions: ["business", "change", "data"],
      interests: ["leadership", "consulting", "governance"],
      levels: ["Deepen", "Create"],
      format: "Status evidence, RAG check, risk owner, steering question",
      summary: "AI für Projektstatus, Steering Packs und Entscheidungsunterlagen nutzen, mit klarer Evidenz und Entscheidungsfrage.",
      modules: ["Source snapshot", "RAG status", "Steering ask"]
    },
    {
      id: "AI-37",
      title: "AI Data Quality and Master Data Processes",
      status: "neu aus Daten-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["tc", "am", "corp", "lead", "bsc", "pma"],
      dimensions: ["data", "business"],
      interests: ["governance", "engineering", "consulting"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Data owner, quality rule, sample check, issue backlog",
      summary: "Datenqualitäts- und Stammdatenlücken erkennen, bevor AI-Workflows schlechte Quellen skalieren.",
      modules: ["Data owner", "Quality rule", "Sample check"]
    },
    {
      id: "AI-38",
      title: "AI Process Analysis and Automation Design",
      status: "neu aus Prozess-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["bsc", "pvs", "pma", "am", "tc", "corp", "lead"],
      dimensions: ["business", "change"],
      interests: ["consulting", "leadership", "engineering"],
      levels: ["Deepen", "Create"],
      format: "Process map, exception log, value check, human fallback",
      summary: "AI-Automatisierungsideen erst nach Prozessverständnis, Exception-Analyse und Pilotkontrollen bewerten.",
      modules: ["Process map", "Exception log", "Automation pilot"]
    },
    {
      id: "AI-39",
      title: "AI Risk Management and Internal Controls",
      status: "neu aus Governance-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["corp", "lead", "bsc", "pma", "tc", "am"],
      dimensions: ["data", "business", "change"],
      interests: ["governance", "leadership", "consulting"],
      levels: ["Deepen", "Create"],
      format: "Risk register, control test, audit trail, approval owner",
      summary: "AI-Risiken mit Ownern, Kontrollen, Audit-Evidence und Policy-Exception-Review steuerbar machen.",
      modules: ["Risk register", "Control test", "Audit evidence"]
    },
    {
      id: "AI-40",
      title: "AI Knowledge Management and Content Governance",
      status: "neu aus Knowledge-Gap",
      source: "DOCX/XLSX capability gap",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      dimensions: ["data", "prompting", "change"],
      interests: ["governance", "productivity", "engineering"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Content owner, freshness check, source ranking, access rule",
      summary: "Wissensquellen für AI Search und interne Assistenten kuratieren, bevor Retrieval falsche Quellen verstärkt.",
      modules: ["Source owner", "Freshness check", "Access rule"]
    },
    {
      id: "AI-41",
      title: "AI Customer Communication and Service Quality",
      status: "neu aus Service-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["am", "pvs", "bsc", "corp", "lead"],
      dimensions: ["business", "prompting", "change"],
      interests: ["productivity", "consulting", "leadership"],
      levels: ["Acquire", "Deepen", "Create"],
      format: "Response source, empathy check, confidence threshold, escalation path",
      summary: "AI-assistierte Kundenantworten mit Quellen, Empathie, Confidence und Eskalationspfad absichern.",
      modules: ["Response source", "Empathy check", "Escalation path"]
    },
    {
      id: "AI-42",
      title: "AI Architecture Decision Governance",
      status: "neu aus Architektur-Gap",
      source: "DOCX/XLSX role gap",
      profileIds: ["tc", "pvs", "am", "lead", "bsc", "pma"],
      dimensions: ["business", "data"],
      interests: ["engineering", "governance", "leadership"],
      levels: ["Deepen", "Create"],
      format: "ADR, threat model, cost model, architecture review",
      summary: "AI-Architekturentscheidungen zu Modellen, Vendoren, Security Boundaries und Kosten nachvollziehbar festhalten.",
      modules: ["ADR", "Threat model", "Cost tradeoff"]
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
      code: "LP01",
      label: "Core AI Foundation Path",
      profileIds: ["all", "bsc", "pvs", "tc", "am", "pma", "corp", "lead"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06", "RESP-01", "AI-10", "AI-22", "AI-24", "AI-35", "AI-37", "AI-40", "AI-41"] },
        { label: "Deepen", courses: ["PROMPT-01", "AI-18", "AI-23", "AI-33", "AI-39"] }
      ]
    },
    {
      id: "consulting",
      code: "LP02",
      label: "Consulting & Value Creation Path",
      profileIds: ["bsc", "pvs", "pma"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06"] },
        { label: "Deepen", courses: ["AI-04", "USECASE-01", "AI-05", "AI-15", "AI-16", "AI-17", "AI-18", "AI-25", "AI-35", "AI-36", "AI-38", "AI-39", "AI-41"] },
        { label: "Create", courses: ["AI-19", "AI-27", "AI-32", "AI-33", "AI-42", "CHAMP-01"] }
      ]
    },
    {
      id: "technology",
      code: "LP03",
      label: "Technology & Engineering Delivery Path",
      profileIds: ["tc", "am"],
      stages: [
        { label: "Acquire", courses: ["AI-01", "RESP-01", "AI-14"] },
        { label: "Deepen", courses: ["AI-03", "AI-02", "AI-11", "AI-12", "AI-13", "AI-23", "AI-24", "AI-26", "AI-31", "AI-36", "AI-37", "AI-38", "AI-40", "AI-41"] },
        { label: "Create", courses: ["AI-19", "AI-25", "AI-42", "CHAMP-01"] }
      ]
    },
    {
      id: "leadership",
      code: "LP04",
      label: "Leadership & Transformation Path",
      profileIds: ["lead", "corp", "pma", "bsc"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06"] },
        { label: "Deepen", courses: ["AI-07", "AI-08", "CHANGE-01", "AI-17", "AI-20", "AI-21", "AI-25", "AI-27", "AI-28", "AI-29", "AI-30", "AI-33", "AI-34", "AI-35", "AI-36", "AI-37", "AI-38", "AI-39", "AI-40", "AI-41"] },
        { label: "Create", courses: ["AI-19", "AI-42", "CHAMP-01"] }
      ]
    },
    {
      id: "corporate-functions",
      code: "LP05",
      label: "Corporate Functions Enablement Path",
      profileIds: ["corp"],
      stages: [
        { label: "Acquire", courses: ["AI-09", "AI-06", "AI-22", "AI-24", "AI-35", "AI-37", "AI-40", "AI-41"] },
        { label: "Deepen", courses: ["AI-10", "AI-28", "AI-29", "AI-30", "AI-33", "AI-34", "AI-36", "AI-38", "AI-39"] },
        { label: "Create", courses: ["AI-20", "AI-21", "CHAMP-01"] }
      ]
    }
  ]
};
