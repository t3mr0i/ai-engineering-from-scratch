// Course-specific learning contracts for the LRN course detail page.
// Keep English and German copy together so the language toggle selects one complete contract.
window.LrnCourseContracts = {
  "PRIMER-01": {
    "en": {
      "headline": "What Shapes an LLM Answer",
      "promise": "You will be able to trace how tokens, context, sampling, retrieval, and tools shape an answer, then choose what to inspect when a small task goes wrong.",
      "projectScenario": {
        "title": "Find why an interactive answer missed the task",
        "description": "Use a primer scenario where an LLM answer is weak. Check the prompt, context window, retrieved passage, sampling, and tool boundary, then pick the smallest useful correction."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Follow the path from input to answer",
          "description": "See how text becomes tokens, how the context window limits what the model can use, and how sampling affects the wording of a response."
        },
        {
          "kind": "guided",
          "title": "Trace the failure through the system",
          "description": "Work through the primer's cases and locate whether the prompt, available context, retrieved material, or a missing tool explains the weak answer."
        },
        {
          "kind": "hands-on",
          "title": "Choose a fitting next step",
          "description": "Complete the mini-games, decide whether prompting, retrieval, or a tool fits a small task, and use the quiz to pick a topic to revisit."
        }
      ],
      "evidence": [
        "An explanation of how tokenization and context-window limits affect the available information",
        "A diagnosis that points to the prompt, context, retrieval, sampling, or tool boundary in a scenario",
        "A justified choice among prompting, retrieval, and tool use for one concrete task",
        "Completed interactive cases and a quiz result tied to a next learning gap"
      ]
    },
    "de": {
      "headline": "Was eine LLM-Antwort prägt",
      "promise": "Du kannst nachvollziehen, wie Tokens, Kontext, Sampling, Retrieval und Tools eine Antwort prägen, und bei einer kleinen Aufgabe gezielt nach der Ursache suchen.",
      "projectScenario": {
        "title": "Die Ursache einer verfehlten Antwort finden",
        "description": "Bearbeite ein Primer-Szenario, in dem eine LLM-Antwort schwach ausfällt. Prüfe Prompt, Kontextfenster, abgerufenen Text, Sampling und Tool-Grenze und wähle die kleinste passende Korrektur."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den Weg von der Eingabe zur Antwort verstehen",
          "description": "Sieh dir an, wie Text zu Tokens wird, wie das Kontextfenster die verfügbaren Informationen begrenzt und wie Sampling die Formulierung einer Antwort beeinflusst."
        },
        {
          "kind": "guided",
          "title": "Den Fehler im Ablauf zurückverfolgen",
          "description": "Bearbeite die Fälle des Primers und ordne die schwache Antwort dem Prompt, verfügbaren Kontext, abgerufenen Material oder einem fehlenden Tool zu."
        },
        {
          "kind": "hands-on",
          "title": "Einen passenden nächsten Schritt wählen",
          "description": "Schließe die Mini-Games ab, wähle für eine kleine Aufgabe Prompting, Retrieval oder ein Tool und nutze das Quiz, um ein nächstes Lernthema zu bestimmen."
        }
      ],
      "evidence": [
        "Eine Erklärung, wie Tokenisierung und Grenzen des Kontextfensters verfügbare Informationen beeinflussen",
        "Eine Diagnose, die in einem Szenario Prompt, Kontext, Retrieval, Sampling oder Tool-Grenze als Ursache benennt",
        "Eine begründete Wahl zwischen Prompting, Retrieval und Tool-Nutzung für eine konkrete Aufgabe",
        "Abgeschlossene interaktive Fälle und ein Quiz-Ergebnis mit einer nächsten Lernlücke"
      ]
    }
  },
  "LRN-01": {
    "en": {
      "headline": "Classify the AI Before Scoping the Work",
      "promise": "You will be able to distinguish AI, machine learning, and generative models, classify a request by the system it needs, and weigh capability against data, cost, evidence, and risk.",
      "projectScenario": {
        "title": "Triage a request to flag contract risks",
        "description": "A stakeholder asks for an AI system that reads contracts and flags risks. Compare a keyword rule, a trained classifier, a retrieval-backed generator, and an agent; identify what each needs and where its limits or failure modes matter.",
        "guardrail": "Treat the result as a system-fit assessment, not legal contract advice; a qualified reviewer owns any interpretation of clauses."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Separate the system types",
          "description": "Connect AI and machine learning to foundation models and generative systems, and distinguish a rule, classifier, RAG application, and agent in practical terms."
        },
        {
          "kind": "guided",
          "title": "Compare what the request actually needs",
          "description": "For the contract-risk request, compare data requirements, build effort, cost, failure modes, and governance burden instead of assuming the most autonomous option is best."
        },
        {
          "kind": "hands-on",
          "title": "Make a fit and quality recommendation",
          "description": "Classify the request, name the simplest sufficient approach, and review a sample output for evidence, uncertainty, bias, and the human check it still needs."
        }
      ],
      "evidence": [
        "A system classification that distinguishes a rule, trained model, RAG generator, and agent",
        "A fit note comparing the chosen approach's data needs, effort, cost, and limits",
        "An output review that marks supported claims, uncertainty, and possible bias",
        "A recommendation that names the required human review and responsible-use conditions"
      ]
    },
    "de": {
      "headline": "KI einordnen, bevor du den Einsatz planst",
      "promise": "Du kannst KI, Machine Learning und generative Modelle unterscheiden, einen Auftrag dem passenden Systemtyp zuordnen und Fähigkeiten gegen Datenbedarf, Kosten, Belege und Risiken abwägen.",
      "projectScenario": {
        "title": "Einen Auftrag zur Erkennung von Vertragsrisiken einordnen",
        "description": "Ein Stakeholder wünscht sich ein KI-System, das Verträge liest und Risiken markiert. Vergleiche eine Schlüsselwortregel, einen trainierten Klassifikator, einen RAG-Generator und einen Agenten; benenne jeweils Datenbedarf, Grenzen und mögliche Fehler.",
        "guardrail": "Bewerte die Systempassung, nicht den Vertrag rechtlich; die Auslegung von Klauseln bleibt bei einer qualifizierten prüfenden Person."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Systemtypen voneinander abgrenzen",
          "description": "Ordne KI und Machine Learning zu Foundation Models und generativen Systemen und unterscheide praktisch zwischen Regel, Klassifikator, RAG-Anwendung und Agent."
        },
        {
          "kind": "guided",
          "title": "Den tatsächlichen Bedarf vergleichen",
          "description": "Vergleiche für den Auftrag Datenbedarf, Entwicklungsaufwand, Kosten, Fehlerbilder und Governance-Aufwand, statt automatisch die autonomste Option zu wählen."
        },
        {
          "kind": "hands-on",
          "title": "Eine begründete Empfehlung abgeben",
          "description": "Ordne den Auftrag ein, benenne den einfachsten ausreichenden Ansatz und prüfe eine Beispielantwort auf Belege, Unsicherheit, Bias und nötige menschliche Prüfung."
        }
      ],
      "evidence": [
        "Eine Einordnung, die Regel, trainiertes Modell, RAG-Generator und Agent unterscheidet",
        "Eine Passungsbewertung zu Datenbedarf, Aufwand, Kosten und Grenzen des gewählten Ansatzes",
        "Eine Prüfung einer Antwort mit markierten Belegen, Unsicherheiten und möglichen Bias-Risiken",
        "Eine Empfehlung mit nötiger menschlicher Prüfung und Bedingungen für verantwortungsvolle Nutzung"
      ]
    }
  },
  "LRN-02": {
    "en": {
      "headline": "From Source Notes to a Reviewed Workflow",
      "promise": "You will be able to select an approved LHIND tool for a work task, preserve its sources and constraints in files, and turn the result into a reusable, reviewed workflow or skill.",
      "projectScenario": {
        "title": "Turn a meeting transcript into a reusable work artifact",
        "description": "Choose an LHIND tool for a transcript-to-action-note task, carry source links and task rules into a file-based workflow, review the note, then decide whether a reusable skill adds value.",
        "guardrail": "Use a tool approved for the transcript's data classification; remove credentials and restricted content, and verify each action item against the source."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Route the task to an approved tool",
          "description": "Distinguish internal retrieval, M365 work, general drafting, coding assistance, and file-based agent workflows; match the tool to both the task and its data class."
        },
        {
          "kind": "guided",
          "title": "Keep source and task context in the workflow",
          "description": "Use a transcript or source note to build a file-based workflow with explicit constraints, conventions, source references, and an output format, using the course's OpenCode, Obsidian, Copilot, and skill-manager practice where appropriate."
        },
        {
          "kind": "hands-on",
          "title": "Review and reuse the result",
          "description": "Check the action note against its source, evaluate a reusable skill before sharing it, and decide whether ordinary prompting, persistent context, or an agent harness is warranted."
        }
      ],
      "evidence": [
        "A tool-selection note connecting task type, data classification, and source access",
        "A context file or prompt that preserves the transcript source, task constraints, and output format",
        "A reviewed action note whose items trace back to the transcript",
        "A skill evaluation or reuse note that states its fit and data or credential boundaries"
      ]
    },
    "de": {
      "headline": "Von Quellenotizen zu einem geprüften Ablauf",
      "promise": "Du kannst für eine Arbeitsaufgabe ein freigegebenes LHIND-Tool wählen, Quellen und Vorgaben in Dateien erhalten und daraus einen geprüften, wiederverwendbaren Ablauf oder Skill machen.",
      "projectScenario": {
        "title": "Ein Meeting-Transkript in ein wiederverwendbares Arbeitsergebnis überführen",
        "description": "Wähle ein LHIND-Tool für eine Aufgabe vom Transkript zur Maßnahmenliste. Übernimm Quellenlinks und Aufgabenregeln in einen dateibasierten Ablauf, prüfe die Liste und entscheide, ob ein wiederverwendbarer Skill einen Mehrwert bietet.",
        "guardrail": "Nutze ein Tool, das für die Datenklasse des Transkripts freigegeben ist; entferne Zugangsdaten und gesperrte Inhalte und gleiche jede Maßnahme mit der Quelle ab."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Aufgabe einem freigegebenen Tool zuordnen",
          "description": "Unterscheide interne Suche, M365-Aufgaben, allgemeine Textarbeit, Coding-Unterstützung und dateibasierte Agenten-Workflows und berücksichtige dabei Aufgabe und Datenklasse."
        },
        {
          "kind": "guided",
          "title": "Quelle und Aufgabenkontext im Ablauf erhalten",
          "description": "Baue aus einem Transkript oder einer Quellenotiz einen dateibasierten Ablauf mit klaren Vorgaben, Konventionen, Quellenverweisen und Ausgabeformat auf; nutze bei Bedarf die Übungen mit OpenCode, Obsidian, Copilot und Skill Manager."
        },
        {
          "kind": "hands-on",
          "title": "Ergebnis prüfen und wiederverwenden",
          "description": "Gleiche die Maßnahmenliste mit der Quelle ab, bewerte einen Skill vor dem Teilen und entscheide, ob ein einfacher Prompt, persistenter Kontext oder ein Agent Harness nötig ist."
        }
      ],
      "evidence": [
        "Eine Tool-Auswahl mit Bezug zu Aufgabentyp, Datenklasse und Quellenzugriff",
        "Eine Kontextdatei oder ein Prompt mit Transkriptquelle, Aufgabenregeln und Ausgabeformat",
        "Eine geprüfte Maßnahmenliste, deren Punkte auf das Transkript zurückgehen",
        "Eine Bewertung zur Wiederverwendung eines Skills mit Passung sowie Daten- und Zugangsdaten-Grenzen"
      ]
    }
  },
  "LRN-03": {
    "en": {
      "headline": "Check the Data Tier and the Use-Case Tier",
      "promise": "You will be able to assess GDPR and security controls separately from the AI use-case risk, check fairness and oversight, and record when a human review or escalation blocks action.",
      "projectScenario": {
        "title": "Review an applicant-screening assistant",
        "description": "Assess a proposed CV-shortlisting assistant even if its CV text has been anonymized. Classify the data and the consequential employment use separately, then examine proxy bias, logging, and meaningful human oversight.",
        "guardrail": "Use the exercise to identify controls and escalation points, not to grant legal approval; route unresolved interpretations to privacy or legal owners."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Classify data before it enters the system",
          "description": "Check purpose, lawful basis, minimization, retention, vendor handling, and security controls for prompts, retrieval context, and logs."
        },
        {
          "kind": "guided",
          "title": "Assess use-case risk and fairness",
          "description": "Apply the AI Act use-case tier independently of the data tier; test whether proxy attributes such as postcode can skew results and identify the oversight a consequential decision requires."
        },
        {
          "kind": "hands-on",
          "title": "Record a blocking or review decision",
          "description": "Write down the risk verdict, evidence, required controls, human owner, and unresolved questions; escalate instead of proceeding when a gate is not met."
        }
      ],
      "evidence": [
        "A data-tier record covering purpose, lawful basis, minimization, retention, and logging",
        "A separate use-case classification with a fairness or proxy-bias check",
        "A control list for meaningful human oversight, security, and escalation",
        "A review record that states the evidence, decision owner, and any blocking condition"
      ]
    },
    "de": {
      "headline": "Datenrisiko und Use-Case-Risiko getrennt prüfen",
      "promise": "Du kannst DSGVO- und Sicherheitskontrollen getrennt vom KI-Use-Case-Risiko bewerten, Fairness und menschliche Aufsicht prüfen und festhalten, wann eine Prüfung oder Eskalation die Nutzung stoppt.",
      "projectScenario": {
        "title": "Eine Assistenz zur Vorauswahl von Bewerbungen prüfen",
        "description": "Bewerte einen Vorschlag zur Vorauswahl von Lebensläufen auch dann, wenn der CV-Text anonymisiert wurde. Ordne Daten und folgenreiche Personalentscheidung getrennt ein und prüfe Proxy-Bias, Protokollierung und wirksame menschliche Aufsicht.",
        "guardrail": "Nutze die Übung, um Kontrollen und Eskalationspunkte zu bestimmen, nicht um eine rechtliche Freigabe zu erteilen; kläre offene Fragen mit Datenschutz oder Recht."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Daten vor der Verarbeitung einordnen",
          "description": "Prüfe Zweck, Rechtsgrundlage, Datenminimierung, Aufbewahrung, Anbieterumgang und Sicherheitskontrollen für Prompts, Retrieval-Kontext und Logs."
        },
        {
          "kind": "guided",
          "title": "Use-Case-Risiko und Fairness bewerten",
          "description": "Ordne den Use-Case unabhängig von der Datenklasse nach dem AI Act ein, prüfe mögliche Verzerrungen durch Proxy-Merkmale wie Postleitzahl und bestimme die nötige Aufsicht bei folgenreichen Entscheidungen."
        },
        {
          "kind": "hands-on",
          "title": "Eine Sperr- oder Prüfentscheidung dokumentieren",
          "description": "Halte Risikoeinstufung, Belege, Kontrollen, verantwortliche Person und offene Fragen fest; eskaliere, statt fortzufahren, wenn eine Voraussetzung nicht erfüllt ist."
        }
      ],
      "evidence": [
        "Ein Dateneinordnungsnachweis zu Zweck, Rechtsgrundlage, Minimierung, Aufbewahrung und Protokollierung",
        "Eine getrennte Use-Case-Einstufung mit Prüfung auf Fairness oder Proxy-Bias",
        "Eine Kontrollliste zu wirksamer menschlicher Aufsicht, Sicherheit und Eskalation",
        "Ein Prüfvermerk mit Belegen, Entscheidungsverantwortung und möglichen Sperrbedingungen"
      ]
    }
  },
  "LRN-22": {
    "en": {
      "headline": "Make Prompts Testable and Handoff-Ready",
      "promise": "You will be able to turn a one-off prompt into a versioned pattern with an explicit output contract, then test its answer quality and behavior on task variants.",
      "projectScenario": {
        "title": "Turn a one-off brief into a reusable prompt pattern",
        "description": "Create a role-specific prompt that returns an answer, confidence level, and source list. Specify which fields are required, validate the shape, and test what happens when a source or input field is missing.",
        "guardrail": "A valid schema only proves the output shape; compare claims with their sources before treating the brief as accurate."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Build the five prompt layers",
          "description": "Use role, task statement, scope constraints, output contract, and a worked example where each layer improves control or reduces a known failure mode."
        },
        {
          "kind": "guided",
          "title": "Specify and validate the output",
          "description": "Convert the requested answer into required fields and value constraints, then compare a prompt template with a schema-based contract that a downstream tool can check."
        },
        {
          "kind": "hands-on",
          "title": "Version and test the prompt",
          "description": "Run the pattern against a small set of task variants, including missing input; record changes as prompt infrastructure and define graceful behavior when the contract cannot be met."
        }
      ],
      "evidence": [
        "A versioned prompt with its role, task, scope, output contract, and any worked example",
        "A schema or template that defines required fields and value constraints",
        "Test results for a normal task and a missing-input variant, including the observed fallback",
        "A review note connecting each prompt change to an output-quality or contract check"
      ]
    },
    "de": {
      "headline": "Prompts prüfbar und übergabefähig machen",
      "promise": "Du kannst aus einem Einzelprompt ein versioniertes Muster mit klarem Ausgabeformat machen und Antwortqualität sowie Verhalten bei Varianten testen.",
      "projectScenario": {
        "title": "Aus einem Einzelprompt ein wiederverwendbares Muster machen",
        "description": "Entwickle einen rollenbezogenen Prompt, der Antwort, Vertrauensstufe und Quellenliste ausgibt. Lege Pflichtfelder fest, validiere die Struktur und teste, was bei einer fehlenden Quelle oder Eingabe passiert.",
        "guardrail": "Ein gültiges Schema belegt nur die Ausgabeform; gleiche Aussagen mit den Quellen ab, bevor du das Briefing als korrekt behandelst."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die fünf Prompt-Schichten einsetzen",
          "description": "Nutze Rolle, Aufgabenstellung, Umfangsgrenzen, Ausgabeformat und ein ausgearbeitetes Beispiel dort, wo die jeweilige Schicht Kontrolle schafft oder ein bekanntes Fehlerbild verhindert."
        },
        {
          "kind": "guided",
          "title": "Die Ausgabe festlegen und validieren",
          "description": "Überführe die gewünschte Antwort in Pflichtfelder und Wertgrenzen und vergleiche eine Prompt-Vorlage mit einem Schema, das ein nachgelagertes Tool prüfen kann."
        },
        {
          "kind": "hands-on",
          "title": "Den Prompt versionieren und testen",
          "description": "Prüfe das Muster mit mehreren Aufgabenvarianten einschließlich fehlender Eingaben, dokumentiere Änderungen wie an Infrastruktur und lege ein sinnvolles Verhalten bei unerfüllbarem Ausgabeformat fest."
        }
      ],
      "evidence": [
        "Ein versionierter Prompt mit Rolle, Aufgabe, Umfang, Ausgabeformat und gegebenenfalls Beispiel",
        "Ein Schema oder eine Vorlage mit Pflichtfeldern und Wertgrenzen",
        "Testergebnisse für eine normale Aufgabe und eine Variante mit fehlender Eingabe samt beobachtetem Fallback",
        "Ein Prüfvermerk, der Promptänderungen mit Qualitäts- oder Vertragsprüfungen verknüpft"
      ]
    }
  },
  "LRN-23": {
    "en": {
      "headline": "Prioritize Use Cases Worth Building",
      "promise": "You will be able to filter ideas by LLM fit, back-of-the-envelope value, feasibility, and risk, then present a ranked backlog that separates quick wins from strategic work.",
      "projectScenario": {
        "title": "Prepare a decision-ready use-case backlog",
        "description": "Take a short list from a discovery workshop and test each idea in sequence: does it need an LLM, is the rough value worth pursuing, can the available data and infrastructure support it, and can it pass the risk screen? Rank the survivors for a sponsor decision.",
        "guardrail": "Keep estimates explicit and provisional; the ranking informs the sponsor's decision and is not a funding or compliance approval."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Fail fast on poor-fit ideas",
          "description": "Apply the lesson's triage funnel: capture candidates, check whether language capability is needed, estimate value, and avoid detailed scoring before ideas pass the early filters."
        },
        {
          "kind": "guided",
          "title": "Estimate value and feasibility",
          "description": "Compare rough annual value and cost, check data access, evaluability, latency, labeling, and prototype path, then screen regulatory and data risks."
        },
        {
          "kind": "hands-on",
          "title": "Rank quick wins and strategic bets",
          "description": "Score the surviving candidates, document blockers and risk, and produce a prioritized backlog with the evidence and next decision each candidate needs."
        }
      ],
      "evidence": [
        "A triage record showing which ideas pass or fail the LLM-fit questions and why",
        "A back-of-the-envelope value and cost estimate with its assumptions visible",
        "A feasibility and risk screen covering data, evaluation, infrastructure, and approvals",
        "A ranked backlog that separates quick wins, strategic proposals, and deferred ideas"
      ]
    },
    "de": {
      "headline": "Use Cases priorisieren, die sich zu bauen lohnen",
      "promise": "Du kannst Ideen nach LLM-Eignung, grobem Nutzen, Machbarkeit und Risiko filtern und ein priorisiertes Backlog mit schnellen Erfolgen und strategischen Vorhaben erstellen.",
      "projectScenario": {
        "title": "Ein entscheidungsreifes Use-Case-Backlog vorbereiten",
        "description": "Prüfe eine kurze Liste aus einem Discovery-Workshop der Reihe nach: Braucht die Aufgabe ein LLM, lohnt sich der grob geschätzte Nutzen, passen Daten und Infrastruktur, und besteht der Use Case die Risikoprüfung? Ordne die verbleibenden Kandidaten für eine Entscheidung des Sponsors.",
        "guardrail": "Kennzeichne Schätzungen und Annahmen; das Ranking unterstützt die Entscheidung des Sponsors, ersetzt aber weder Budget- noch Compliance-Freigabe."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Ungeeignete Ideen früh aussortieren",
          "description": "Wende den Triage-Funnel an: Erfasse Kandidaten, prüfe den Bedarf an Sprachverarbeitung, schätze den Nutzen grob ein und vermeide detaillierte Bewertungen, bevor eine Idee die ersten Filter besteht."
        },
        {
          "kind": "guided",
          "title": "Nutzen und Machbarkeit schätzen",
          "description": "Vergleiche groben Jahresnutzen und Kosten, prüfe Datenzugriff, Evaluierbarkeit, Latenz, Labeling und Prototypweg und untersuche regulatorische sowie datenbezogene Risiken."
        },
        {
          "kind": "hands-on",
          "title": "Schnelle Erfolge und strategische Vorhaben ordnen",
          "description": "Bewerte die verbleibenden Kandidaten, dokumentiere Blocker und Risiken und erstelle ein priorisiertes Backlog mit den nötigen Belegen und nächsten Entscheidungen."
        }
      ],
      "evidence": [
        "Ein Triage-Nachweis mit Begründung, welche Ideen die LLM-Eignungsfragen bestehen oder nicht",
        "Eine grobe Nutzen- und Kostenschätzung mit sichtbaren Annahmen",
        "Eine Machbarkeits- und Risikoprüfung zu Daten, Evaluation, Infrastruktur und Freigaben",
        "Ein priorisiertes Backlog mit schnellen Erfolgen, strategischen Vorschlägen und zurückgestellten Ideen"
      ]
    }
  },
  "LRN-06": {
    "en": {
      "headline": "From Ticket to a Human-Owned Pull Request",
      "promise": "You will be able to route a bounded engineering task to the right Copilot surface, give it a verifiable brief, and hand off a tested diff without handing away merge accountability.",
      "projectScenario": {
        "title": "Make booking synchronization retries idempotent",
        "description": "Use the course fallback ticket: a repeated delivery event must not create a second status update. Limit changes to src/booking_sync.py and tests/test_booking_sync.py; preserve the handler signature and validation error, and do not add dependencies or log booking identifiers.",
        "guardrail": "Use the sanitized fallback or anonymized project material only; remove client names, credentials, personal data, production logs, proprietary identifiers, and restricted code before using an approved assistant."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Choose a Copilot rung by ambiguity and blast radius",
          "description": "Compare completion, chat, multi-file edits, in-IDE agent mode, and the coding agent; curate repository context and keep the human responsible for architecture and merge decisions."
        },
        {
          "kind": "guided",
          "title": "Constrain the fallback ticket",
          "description": "Build a brief with the two allowed files, forbidden changes, observable acceptance checks, and review gate; predict and explain why this cross-file test loop selects agent mode."
        },
        {
          "kind": "hands-on",
          "title": "Transfer the workflow to a project ticket",
          "description": "Replace the fallback only with an anonymized ticket, inspect the diff including changed tests, run checks, and prepare the pull-request handoff with residual risks and a named merge owner."
        }
      ],
      "evidence": [
        "A bounded ticket brief with the selected Copilot rung, allowed files, forbidden changes, and acceptance checks",
        "A repository-context packet and annotated diff review covering correctness, security, privacy, maintainability, and scope",
        "Test output for repeated and new event identifiers plus malformed input, with no weakened assertions",
        "A reproducible pull-request handoff naming residual risks and the human merge owner"
      ]
    },
    "de": {
      "headline": "Vom Ticket zum verantworteten Pull Request",
      "promise": "Du kannst eine begrenzte Engineering-Aufgabe der passenden Copilot-Funktion zuordnen, mit prüfbaren Vorgaben versehen und einen getesteten Diff übergeben, ohne die Verantwortung für den Merge abzugeben.",
      "projectScenario": {
        "title": "Retries in der Buchungssynchronisierung idempotent machen",
        "description": "Nutze das Fallback-Ticket des Kurses: Ein wiederholtes Zustellereignis darf kein zweites Statusupdate erzeugen. Begrenze Änderungen auf src/booking_sync.py und tests/test_booking_sync.py; erhalte Handler-Signatur und Validierungsfehler und ergänze weder Abhängigkeiten noch Buchungskennungen in Logs.",
        "guardrail": "Nutze nur das bereinigte Fallback oder anonymisiertes Projektmaterial; entferne Kundennamen, Zugangsdaten, personenbezogene Daten, Produktionslogs, proprietäre Kennungen und gesperrten Code, bevor du ein freigegebenes Assistenztool verwendest."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Copilot-Funktion nach Unklarheit und Auswirkung wählen",
          "description": "Vergleiche Autovervollständigung, Chat, Mehrdatei-Edits, Agent Mode in der IDE und Coding Agent. Stelle passenden Repository-Kontext bereit und behalte Architektur- und Merge-Entscheidungen beim Menschen."
        },
        {
          "kind": "guided",
          "title": "Das Fallback-Ticket eingrenzen",
          "description": "Formuliere ein Briefing mit den zwei erlaubten Dateien, ausgeschlossenen Änderungen, beobachtbaren Abnahmekriterien und Prüfgate. Erkläre, warum der dateiübergreifende Testablauf Agent Mode erfordert."
        },
        {
          "kind": "hands-on",
          "title": "Den Ablauf auf ein Projektticket übertragen",
          "description": "Ersetze das Fallback nur durch ein anonymisiertes Ticket, prüfe den Diff einschließlich geänderter Tests, führe die Checks aus und bereite die Übergabe mit Restrisiken und menschlicher Merge-Verantwortung vor."
        }
      ],
      "evidence": [
        "Ein begrenztes Ticket-Briefing mit Copilot-Funktion, erlaubten Dateien, ausgeschlossenen Änderungen und Abnahmekriterien",
        "Ein Repository-Kontextpaket und eine kommentierte Diff-Prüfung zu Korrektheit, Sicherheit, Datenschutz, Wartbarkeit und Umfang",
        "Testergebnisse für wiederholte und neue Ereigniskennungen sowie fehlerhafte Eingaben, ohne abgeschwächte Assertions",
        "Eine reproduzierbare Pull-Request-Übergabe mit Restrisiken und benannter menschlicher Merge-Verantwortung"
      ]
    }
  },
  "LRN-25": {
    "en": {
      "headline": "Choose the Layers the Requirement Earns",
      "promise": "You will be able to map a production AI requirement to the model, context, orchestration, tool, and deployment layers it needs, then justify the trade-offs and the layers you leave out.",
      "projectScenario": {
        "title": "Design internal knowledge Q&A without overbuilding",
        "description": "A service team needs answers grounded in maintained internal documents. Decide whether retrieval is needed, how context is assembled, whether a workflow or agent is justified, and which gateway, deployment, and observability controls the requirements actually call for.",
        "guardrail": "Treat access, residency, security, and compliance as requirements to confirm with the responsible platform and governance owners."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map the five architecture layers",
          "description": "Place the model, context assembly, orchestration, tool execution, and deployment layers, and distinguish a single model call from RAG, workflow, and agent designs."
        },
        {
          "kind": "guided",
          "title": "Match patterns to requirements",
          "description": "Choose retrieval and reranking for proprietary knowledge where needed; weigh routing, memory, MCP or API tools, and hosted versus self-managed serving against latency, data, scale, and cost."
        },
        {
          "kind": "hands-on",
          "title": "Record the smallest production-ready design",
          "description": "Draw the active layers, leave unnecessary layers at platform defaults, and document prompt/index versions, evaluations, traces, rollout, and governance controls for the chosen design."
        }
      ],
      "evidence": [
        "A five-layer map marking which layers are active and which remain at platform defaults",
        "A comparison of single-turn, retrieval-backed, workflow, and agent options for the stated knowledge need",
        "A decision record for model, context, tool, orchestration, and deployment patterns with cost and risk trade-offs",
        "A production-control list covering versioning, evaluation, observability, rollout, and governance"
      ]
    },
    "de": {
      "headline": "Nur die Schichten einplanen, die die Anforderung braucht",
      "promise": "Du kannst eine Produktionsanforderung den nötigen Schichten für Modell, Kontext, Orchestrierung, Tools und Deployment zuordnen und begründen, welche Zielkonflikte entstehen und was entfallen kann.",
      "projectScenario": {
        "title": "Interne Wissensfragen ohne unnötigen Architekturaufwand beantworten",
        "description": "Ein Serviceteam braucht Antworten auf Basis gepflegter interner Dokumente. Entscheide, ob Retrieval nötig ist, wie Kontext entsteht, ob ein Workflow oder Agent gerechtfertigt ist und welche Gateway-, Deployment- und Observability-Kontrollen die Anforderungen tatsächlich verlangen.",
        "guardrail": "Kläre Zugriffsrechte, Datenresidenz, Sicherheit und Compliance als Anforderungen mit den zuständigen Plattform- und Governance-Verantwortlichen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die fünf Architekturschichten abbilden",
          "description": "Ordne Modell, Kontextaufbau, Orchestrierung, Tool-Ausführung und Deployment ein und unterscheide einen einzelnen Modellaufruf von RAG, Workflow und Agent."
        },
        {
          "kind": "guided",
          "title": "Muster den Anforderungen zuordnen",
          "description": "Wähle bei Bedarf Retrieval und Reranking für proprietäres Wissen; wäge Routing, Memory, MCP- oder API-Tools sowie gehostetes oder selbst betriebenes Serving gegen Latenz, Daten, Skalierung und Kosten ab."
        },
        {
          "kind": "hands-on",
          "title": "Das kleinste produktionsreife Design festhalten",
          "description": "Zeichne die aktiven Schichten ein, belasse unnötige Schichten bei den Plattformstandards und dokumentiere für den Entwurf Versionen von Prompts und Indizes, Evaluation, Traces, Rollout und Governance-Kontrollen."
        }
      ],
      "evidence": [
        "Eine Karte der fünf Schichten mit aktiven Bereichen und Bereichen auf Plattformstandard",
        "Ein Vergleich von Einzelaufruf, RAG, Workflow und Agent für den beschriebenen Wissensbedarf",
        "Ein Entscheid zu Modell-, Kontext-, Tool-, Orchestrierungs- und Deployment-Mustern samt Kosten- und Risikoabwägung",
        "Eine Liste der Produktionskontrollen zu Versionierung, Evaluation, Observability, Rollout und Governance"
      ]
    }
  },
  "LRN-24": {
    "en": {
      "headline": "Engineer the Loop Around Its Blast Radius",
      "promise": "You will be able to design a bounded agent loop with explicit state, tool contracts, retries, verification, and human confirmation, and choose a decomposition pattern that fits the task's blast radius.",
      "projectScenario": {
        "title": "Build a coding agent that stops at the right gate",
        "description": "Give an agent a small, multi-step code task with read, test, and write tools. Define what it can inspect or change, make any retryable side effect safe, and require confirmation before a high-impact action or an unverifiable handoff.",
        "guardrail": "Keep write tools sandboxed and make high-blast-radius or irreversible actions wait for explicit human confirmation."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Select the loop structure",
          "description": "Trace observe, plan, act, verify, and state update; compare sequential, planner-executor, parallel, reflection, and human-in-the-loop patterns by task length and failure risk."
        },
        {
          "kind": "guided",
          "title": "Design tools and confirmation points",
          "description": "Separate read and write effects, return structured tool errors, define idempotent retry behavior, and place verification gates where an action's blast radius changes."
        },
        {
          "kind": "hands-on",
          "title": "Exercise the harness against failures",
          "description": "Run a bounded task with fixtures for a successful path, tool error, repeated action, and human pause; inspect whether state and stop conditions prevent unsafe continuation."
        }
      ],
      "evidence": [
        "An agent-loop contract naming state, completion conditions, limits, retries, and stop rules",
        "Tool schemas that separate effects and make errors and retry semantics explicit",
        "Fixtures for success, tool failure, repeated side effect, and confirmation-gated action",
        "A rationale for the chosen decomposition pattern and its verification or rollback gates"
      ]
    },
    "de": {
      "headline": "Die Agentenschleife an ihrer Auswirkung ausrichten",
      "promise": "Du kannst eine begrenzte Agentenschleife mit klaren Zuständen, Tool-Verträgen, Retries, Verifikation und menschlicher Bestätigung entwerfen und ein Zerlegungsmuster passend zum Auswirkungsradius wählen.",
      "projectScenario": {
        "title": "Einen Coding-Agenten am richtigen Prüftor stoppen lassen",
        "description": "Gib einem Agenten eine kleine mehrstufige Code-Aufgabe mit Lese-, Test- und Schreibtools. Lege fest, was er untersuchen oder ändern darf, sichere wiederholbare Nebenwirkungen ab und verlange eine Bestätigung vor folgenreichen Aktionen oder einer nicht verifizierbaren Übergabe.",
        "guardrail": "Führe Schreib-Tools in einer Sandbox aus und verlange für irreversible Aktionen oder solche mit großem Auswirkungsradius eine ausdrückliche menschliche Bestätigung."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die passende Schleifenstruktur wählen",
          "description": "Verfolge Beobachtung, Planung, Aktion, Prüfung und Zustandsaktualisierung; vergleiche sequenzielle Abläufe, Planner-Executor, Parallelisierung, Reflexion und Human-in-the-Loop nach Aufgabenlänge und Fehlerrisiko."
        },
        {
          "kind": "guided",
          "title": "Tools und Bestätigungspunkte entwerfen",
          "description": "Trenne Lese- und Schreibwirkungen, gib strukturierte Tool-Fehler zurück, definiere idempotentes Retry-Verhalten und setze Prüfgates dort, wo sich der Auswirkungsradius einer Aktion ändert."
        },
        {
          "kind": "hands-on",
          "title": "Den Harness an Fehlerfällen prüfen",
          "description": "Führe eine begrenzte Aufgabe mit Fixtures für Erfolgsweg, Tool-Fehler, wiederholte Aktion und menschliche Pause aus und prüfe, ob Zustand und Abbruchregeln ein unsicheres Fortfahren verhindern."
        }
      ],
      "evidence": [
        "Ein Vertrag für die Agentenschleife mit Zustand, Abschlusskriterien, Grenzen, Retries und Abbruchregeln",
        "Tool-Schemas mit getrennten Wirkungen und klaren Fehler- und Retry-Semantiken",
        "Fixtures für Erfolg, Tool-Fehler, wiederholte Nebenwirkung und bestätigungspflichtige Aktion",
        "Eine Begründung für das Zerlegungsmuster und die zugehörigen Prüf- oder Rücksetzpunkte"
      ]
    }
  },
  "LRN-04": {
    "en": {
      "headline": "Make Compliance Intake an Early Design Input",
      "promise": "You will be able to turn an AI idea into an approval-ready intake by classifying data and use-case risk, checking vendor and internal gates, and naming the owners and conditions before a PoC starts.",
      "projectScenario": {
        "title": "Screen a customer-support assistant before its first model call",
        "description": "A proposed assistant summarizes customer support requests using a cloud model. Record the data purpose and tier, AI Act use-case tier, DPA status, and internal policy controls; identify any requirement that blocks a proof of concept or changes its architecture.",
        "guardrail": "Do not send production data or call a model until the applicable privacy, security, and internal approval gates are resolved by their owners."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Collect the decision facts",
          "description": "Structure intake around purpose, data fields, data tier, model/vendor, deployment context, and the decision the output may influence; keep GDPR, AI Act, and internal-policy questions distinct."
        },
        {
          "kind": "guided",
          "title": "Classify risk and route the review",
          "description": "Assess personal-data handling, AI Act use-case tier, DPA and transfer needs, security controls, and accountable business, privacy, security, and compliance owners."
        },
        {
          "kind": "hands-on",
          "title": "Write the approval-ready record",
          "description": "Capture evidence, risk verdict, required architecture controls, owners, approvals, open questions, and a review date before the proposed PoC proceeds."
        }
      ],
      "evidence": [
        "An intake record with purpose, data categories, model/vendor, and affected decision or workflow",
        "Separate data, AI Act, and internal-policy classifications with reasons",
        "A review route naming business, privacy, security, and compliance owners plus DPA status",
        "An approval record listing blocking conditions, required controls, evidence, and review date"
      ]
    },
    "de": {
      "headline": "Compliance früh in die Gestaltung einbeziehen",
      "promise": "Du kannst eine KI-Idee in eine freigabefähige Aufnahme überführen, Daten- und Use-Case-Risiken einstufen, Anbieter- und interne Gates prüfen und vor einem PoC Zuständigkeiten und Bedingungen benennen.",
      "projectScenario": {
        "title": "Einen Support-Assistenten vor dem ersten Modellaufruf prüfen",
        "description": "Ein vorgeschlagener Assistent fasst Supportanfragen mit einem Cloud-Modell zusammen. Halte Zweck und Datenklasse, AI-Act-Einstufung, DPA-Status und interne Richtlinienkontrollen fest; benenne Anforderungen, die einen Proof of Concept blockieren oder seine Architektur verändern.",
        "guardrail": "Übermittle keine Produktivdaten und rufe kein Modell auf, bevor die zuständigen Personen Datenschutz-, Sicherheits- und interne Freigaben geklärt haben."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die nötigen Entscheidungsdaten sammeln",
          "description": "Strukturiere die Aufnahme nach Zweck, Datenfeldern, Datenklasse, Modell oder Anbieter, Deployment-Kontext und möglichem Einfluss der Ausgabe; trenne DSGVO-, AI-Act- und interne Richtlinienfragen."
        },
        {
          "kind": "guided",
          "title": "Risiko einstufen und Prüfung zuordnen",
          "description": "Bewerte personenbezogene Daten, AI-Act-Use-Case, DPA- und Transferbedarf sowie Security-Kontrollen und benenne verantwortliche Personen aus Business, Datenschutz, Security und Compliance."
        },
        {
          "kind": "hands-on",
          "title": "Den freigabefähigen Nachweis schreiben",
          "description": "Dokumentiere Belege, Risikoeinstufung, nötige Architekturkontrollen, Zuständigkeiten, Freigaben, offene Fragen und Prüfdatum, bevor der PoC startet."
        }
      ],
      "evidence": [
        "Eine Use-Case-Aufnahme mit Zweck, Datenkategorien, Modell oder Anbieter und betroffener Entscheidung oder Prozess",
        "Getrennte Einstufungen zu Daten, AI Act und interner Richtlinie mit Begründung",
        "Ein Prüfpfad mit Business-, Datenschutz-, Security- und Compliance-Zuständigkeiten sowie DPA-Status",
        "Ein Freigabenachweis mit Sperrbedingungen, nötigen Kontrollen, Belegen und Prüfdatum"
      ]
    }
  },
  "LRN-19": {
    "en": {
      "headline": "Build Three Eval Layers Before Release",
      "promise": "You will be able to turn LLM-feature risks into structural, behavioral, and adversarial evaluations, compare results with a versioned baseline, and define a human-owned release gate.",
      "projectScenario": {
        "title": "Gate a source-grounded answer feature",
        "description": "Evaluate a feature that answers questions from supplied material. Check output shape in every PR, score grounding and task completion on model or prompt changes, and probe injection and misleading names or dates before production.",
        "guardrail": "A green schema or judge score is evidence for review, not an automatic release approval; retain human disposition for material failures."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Separate the three test layers",
          "description": "Distinguish structural checks such as schema and bounds, behavioral evaluation of quality and grounding, and adversarial probes for injection, jailbreaks, and poisoned output."
        },
        {
          "kind": "guided",
          "title": "Build an eval set that covers failure modes",
          "description": "Pair representative, boundary, and adversarial inputs with golden answers or rubrics; choose metrics such as task completion, faithfulness, coherence, and latency that reflect the feature's requirements."
        },
        {
          "kind": "hands-on",
          "title": "Apply a regression gate",
          "description": "Compare the candidate prompt or model with the versioned baseline, check absolute and relative thresholds, and record whether to promote, revise, or block the change."
        }
      ],
      "evidence": [
        "A requirement-to-failure map with structural, behavioral, and adversarial checks",
        "An eval set with representative and boundary fixtures plus injection or misleading-content probes",
        "A result sheet comparing quality and regression metrics with the stored baseline and thresholds",
        "A release-gate record with a human decision and any blocking failure or follow-up"
      ]
    },
    "de": {
      "headline": "Drei Evaluationsschichten vor dem Release aufbauen",
      "promise": "Du kannst Risiken eines LLM-Features strukturell, verhaltensbezogen und adversarial evaluieren, Ergebnisse mit einer versionierten Baseline vergleichen und ein menschlich verantwortetes Release-Gate definieren.",
      "projectScenario": {
        "title": "Ein quellenbasiertes Antwort-Feature absichern",
        "description": "Bewerte ein Feature, das Fragen anhand bereitgestellter Inhalte beantwortet. Prüfe die Ausgabeform bei jedem PR, bewerte Belegtreue und Aufgabenerfüllung bei Prompt- oder Modelländerungen und teste vor dem Produktiveinsatz Injection sowie irreführende Namen oder Datumsangaben.",
        "guardrail": "Ein grünes Schema oder Judge-Ergebnis ist ein Prüfbeleg, keine automatische Freigabe; dokumentiere bei relevanten Fehlern die menschliche Entscheidung."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die drei Testschichten trennen",
          "description": "Unterscheide strukturelle Prüfungen wie Schema und Grenzen, verhaltensbezogene Bewertung von Qualität und Belegtreue sowie adversariale Tests auf Injection, Jailbreaks und manipulierte Ausgaben."
        },
        {
          "kind": "guided",
          "title": "Ein Evaluationsset nach Fehlerrisiken bauen",
          "description": "Kombiniere repräsentative, grenzwertige und adversariale Eingaben mit Musterantworten oder Bewertungsrubriken und wähle passende Kennzahlen für Aufgabenerfüllung, Faithfulness, Kohärenz und Latenz."
        },
        {
          "kind": "hands-on",
          "title": "Ein Regressions-Gate anwenden",
          "description": "Vergleiche den neuen Prompt oder das Modell mit der versionierten Baseline, prüfe absolute und relative Schwellenwerte und dokumentiere, ob du die Änderung freigibst, überarbeitest oder blockierst."
        }
      ],
      "evidence": [
        "Eine Zuordnung von Anforderungen zu strukturellen, verhaltensbezogenen und adversarialen Prüfungen",
        "Ein Evaluationsset mit repräsentativen und grenzwertigen Fixtures sowie Injection- oder Irreführungsproben",
        "Ein Ergebnisblatt mit Qualitäts- und Regressionsmetriken im Vergleich zu Baseline und Schwellenwerten",
        "Ein Release-Entscheid mit menschlicher Freigabe und benanntem Blocker oder Folgeschritt"
      ]
    }
  },
  "LRN-20": {
    "en": {
      "headline": "Modernize Legacy Code in Reviewable Slices",
      "promise": "You will be able to audit a legacy module's structure, risk, and test coverage before change, then choose bounded refactoring slices with explicit verification and rollback points.",
      "projectScenario": {
        "title": "Turn a legacy-module audit into a safe slice plan",
        "description": "Use AI to inspect one legacy module in four passes: map its public API and callers, identify risks, find untested paths, and rank small slice candidates. Score readiness before choosing the first change.",
        "guardrail": "Do not authorize an atomic rewrite from a model summary; preserve observable behavior and review each slice before moving to the next."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Audit before asking for a rewrite",
          "description": "Learn the structure, risk, coverage, and slice-candidate passes; see why each pass must use actual source and tests and why coverage is needed before claiming a slice is safe."
        },
        {
          "kind": "guided",
          "title": "Rank readiness and slice candidates",
          "description": "Review the proposed dependency graph, risk list, and coverage gaps, then score coupling, tests, secret/config hygiene, dependency age, and change frequency before sequencing slices."
        },
        {
          "kind": "hands-on",
          "title": "Prepare the first gated refactor",
          "description": "Select a reviewable slice, state its implicit contract and affected call sites, add or identify the verification needed, and document migration or rollback and residual risk."
        }
      ],
      "evidence": [
        "A structure map with public API, dependencies, callers, and dead-code candidates",
        "A risk and coverage audit that points to evidence in source and tests",
        "A readiness score and ranked slice backlog with rationale and verification gates",
        "A first-slice handoff with preserved-behavior criteria, tests, rollback point, and residual risks"
      ]
    },
    "de": {
      "headline": "Legacy-Code in prüfbaren Schritten modernisieren",
      "promise": "Du kannst Struktur, Risiken und Testabdeckung eines Legacy-Moduls vor Änderungen prüfen und begrenzte Refactoring-Schritte mit klaren Verifikations- und Rücksetzpunkten auswählen.",
      "projectScenario": {
        "title": "Aus einem Legacy-Audit einen sicheren Schrittplan ableiten",
        "description": "Lass ein Legacy-Modul in vier Durchgängen mit KI untersuchen: öffentliche API und Aufrufer erfassen, Risiken finden, ungetestete Pfade markieren und kleine Änderungsschritte priorisieren. Bewerte die Bereitschaft, bevor du die erste Änderung auswählst.",
        "guardrail": "Leite aus einer Modellzusammenfassung keine Komplettumschreibung ab; erhalte beobachtbares Verhalten und prüfe jeden Schritt, bevor der nächste beginnt."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Erst prüfen, dann umbauen",
          "description": "Lerne die Durchgänge für Struktur, Risiko, Abdeckung und Schrittvorschläge kennen. Nutze dafür Quellcode und Tests und behaupte erst nach der Abdeckungsprüfung, ein Schritt sei sicher."
        },
        {
          "kind": "guided",
          "title": "Bereitschaft und Änderungsschritte bewerten",
          "description": "Prüfe Abhängigkeitsgraph, Risikoliste und Testlücken und bewerte Kopplung, Tests, Umgang mit Secrets und Konfiguration, Abhängigkeitsalter und Änderungshäufigkeit, bevor du die Schritte ordnest."
        },
        {
          "kind": "hands-on",
          "title": "Das erste abgesicherte Refactoring vorbereiten",
          "description": "Wähle einen prüfbaren Schritt, benenne implizite Verträge und betroffene Aufrufer, bestimme nötige Tests und dokumentiere Migration oder Rücksetzung samt Restrisiken."
        }
      ],
      "evidence": [
        "Eine Strukturkarte mit öffentlicher API, Abhängigkeiten, Aufrufern und Kandidaten für toten Code",
        "Ein Risiko- und Abdeckungsaudit mit Belegen aus Quellcode und Tests",
        "Eine Bereitschaftsbewertung und priorisierte Schritteliste mit Begründung und Prüfgates",
        "Eine Übergabe für den ersten Schritt mit Verhaltenserhalt, Tests, Rücksetzpunkt und Restrisiken"
      ]
    }
  },
  "LRN-11": {
    "en": {
      "headline": "Make Every Documentation Claim Traceable",
      "promise": "You will be able to draft architecture, operations, compliance, or handover documentation where each non-trivial claim points to a current source artifact and has a named reviewer and maintainer.",
      "projectScenario": {
        "title": "Update a service handover from code and decision records",
        "description": "Draft a handover using verified repository files, a ticket, and a decision record. Give each material claim an artifact reference, label assumptions and open questions, and make a renamed or missing source fail the grounding check.",
        "guardrail": "Use approved, sanitized artifacts; do not pass credentials or personal data to an AI tool, and do not publish claims whose sources cannot be verified."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Define source and claim boundaries",
          "description": "Choose a document type and audience, identify the artifacts it may rely on, and separate sourced facts from engineering judgment, assumptions, and unresolved questions."
        },
        {
          "kind": "guided",
          "title": "Draft with artifact references",
          "description": "Use retrieved project context to draft the document, attach an artifact ID to each non-trivial claim, and check whether the evidence actually supports the wording."
        },
        {
          "kind": "hands-on",
          "title": "Verify and hand over the document",
          "description": "Run a grounding review that catches missing or renamed sources, then name the reviewer, update owner, and events that should trigger maintenance."
        }
      ],
      "evidence": [
        "A source manifest listing the code, ticket, decision record, or other artifacts used",
        "A draft with claim-to-artifact references and clearly marked assumptions and open questions",
        "A grounding-check result, including the behavior when a referenced artifact is missing or changed",
        "A handover record naming the reviewer, maintainer, and update triggers"
      ]
    },
    "de": {
      "headline": "Jede Dokumentationsaussage auf Quellen zurückführen",
      "promise": "Du kannst Architektur-, Betriebs-, Compliance- oder Übergabedokumentation erstellen, in der jede wesentliche Aussage auf ein aktuelles Quellartefakt verweist und prüfende sowie pflegende Personen benannt sind.",
      "projectScenario": {
        "title": "Einen Service-Handover aus Code und Entscheidungsnachweisen aktualisieren",
        "description": "Erstelle einen Handover aus geprüften Repository-Dateien, einem Ticket und einem Entscheidungsnachweis. Verknüpfe jede wesentliche Aussage mit einem Artefaktverweis, kennzeichne Annahmen und offene Fragen und sorge dafür, dass eine umbenannte oder fehlende Quelle die Quellenprüfung nicht besteht.",
        "guardrail": "Nutze freigegebene, bereinigte Artefakte; gib keine Zugangsdaten oder personenbezogenen Daten an ein KI-Tool und veröffentliche keine Aussage ohne verifizierbare Quelle."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Quellen und Aussagen abgrenzen",
          "description": "Wähle Dokumenttyp und Zielgruppe, bestimme zulässige Quellen und trenne belegte Fakten von technischer Einschätzung, Annahmen und offenen Fragen."
        },
        {
          "kind": "guided",
          "title": "Mit Artefaktverweisen entwerfen",
          "description": "Nutze abgerufenen Projektkontext für den Entwurf, verknüpfe jede wesentliche Aussage mit einer Artefakt-ID und prüfe, ob der Beleg die Formulierung tatsächlich stützt."
        },
        {
          "kind": "hands-on",
          "title": "Prüfen und übergeben",
          "description": "Führe eine Quellenprüfung aus, die fehlende oder umbenannte Quellen erkennt, und benenne danach prüfende Person, Pflegeverantwortung und Auslöser für Aktualisierungen."
        }
      ],
      "evidence": [
        "Ein Quellenverzeichnis mit verwendeten Code-, Ticket-, Entscheidungs- und weiteren Artefakten",
        "Ein Entwurf mit Verknüpfungen von Aussagen zu Artefakten und markierten Annahmen sowie offenen Fragen",
        "Das Ergebnis einer Quellenprüfung einschließlich des Verhaltens bei fehlenden oder geänderten Artefakten",
        "Ein Handover mit prüfender Person, Pflegeverantwortung und Aktualisierungsauslösern"
      ]
    }
  },
  "LRN-08": {
    "en": {
      "headline": "Quantify the Footprint and Payback of AI Changes",
      "promise": "You will be able to compare model, prompt, region, and call-volume levers using operational measures, then recommend an efficiency change with estimated savings and payback alongside quality and reliability.",
      "projectScenario": {
        "title": "Reduce an LLM workload's footprint without losing quality",
        "description": "Establish a baseline for a repeated LLM task, then compare task-fit model routing, prompt-token reduction, serving-region carbon intensity, and right-sizing or caching. Estimate savings per lever and its payback period while tracking latency and output quality.",
        "guardrail": "Label footprint figures as estimates or proxies unless they come from direct measurements; keep quality and reliability thresholds visible in the recommendation."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Locate the four footprint levers",
          "description": "Connect resource use to serving region, model tier, prompt efficiency, and call volume or caching; distinguish what can change by configuration from what needs task validation."
        },
        {
          "kind": "guided",
          "title": "Estimate the trade-off for each lever",
          "description": "Compare latency, utilization, token use, cost, and regional carbon intensity; estimate how model routing, shorter context, caching, or right-sized serving affect the same functional unit."
        },
        {
          "kind": "hands-on",
          "title": "Test one change and make a recommendation",
          "description": "Change one lever against a measured baseline, check quality and reliability, and present per-lever savings, implementation cost, and payback period."
        }
      ],
      "evidence": [
        "A workload baseline with its functional unit, token or call volume, latency, utilization, and cost",
        "A four-lever comparison for region, model tier, prompt efficiency, and call volume or caching",
        "A controlled experiment changing one lever with an observable quality and operating target",
        "A recommendation with estimated savings and payback alongside reliability and user-value trade-offs"
      ]
    },
    "de": {
      "headline": "Footprint und Amortisation von KI-Änderungen beziffern",
      "promise": "Du kannst Modell-, Prompt-, Regions- und Anfragevolumen-Hebel anhand von Betriebskennzahlen vergleichen und eine Effizienzänderung mit geschätzter Einsparung und Amortisation bei erhaltener Qualität empfehlen.",
      "projectScenario": {
        "title": "Den Footprint einer LLM-Workload senken, ohne Qualität zu verlieren",
        "description": "Ermittle einen Ausgangswert für eine wiederkehrende LLM-Aufgabe. Vergleiche dann aufgabengerechtes Model-Routing, weniger Prompt-Tokens, die CO₂-Intensität der Serving-Region sowie bedarfsgerechte Dimensionierung oder Caching. Schätze je Hebel Einsparung und Amortisation und beobachte Latenz und Ausgabequalität.",
        "guardrail": "Kennzeichne Footprint-Werte als Schätzungen oder Proxies, wenn sie nicht direkt gemessen wurden; führe Qualitäts- und Zuverlässigkeitsschwellen in der Empfehlung mit."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die vier Footprint-Hebel finden",
          "description": "Verknüpfe Ressourcenverbrauch mit Serving-Region, Modellgröße, Prompt-Effizienz und Anfragevolumen oder Caching. Unterscheide Konfigurationsänderungen von solchen, die eine Validierung der Aufgabe brauchen."
        },
        {
          "kind": "guided",
          "title": "Zielkonflikte je Hebel schätzen",
          "description": "Vergleiche Latenz, Auslastung, Tokenverbrauch, Kosten und regionale CO₂-Intensität und schätze den Effekt von Model-Routing, kürzerem Kontext, Caching oder passender Dimensionierung pro Funktionseinheit."
        },
        {
          "kind": "hands-on",
          "title": "Eine Änderung testen und empfehlen",
          "description": "Ändere einen Hebel gegenüber dem gemessenen Ausgangswert, prüfe Qualität und Zuverlässigkeit und stelle Einsparung, Umsetzungskosten und Amortisationszeit dar."
        }
      ],
      "evidence": [
        "Ein Workload-Ausgangswert mit Funktionseinheit, Token- oder Anfragevolumen, Latenz, Auslastung und Kosten",
        "Ein Vergleich der vier Hebel Region, Modellgröße, Prompt-Effizienz und Anfragevolumen oder Caching",
        "Ein kontrolliertes Experiment mit einer Änderung und beobachtbarem Qualitäts- und Betriebsziel",
        "Eine Empfehlung mit geschätzter Einsparung und Amortisation sowie Abwägung zu Zuverlässigkeit und Nutzerwert"
      ]
    }
  },
  "LRN-17": {
    "en": {
      "headline": "Keep Research Synthesis Traceable, Falsifiable, and Representative",
      "promise": "You will be able to synthesize de-identified research without losing snippet provenance, write hypotheses with explicit falsification criteria, and flag when participant or segment coverage weakens a finding.",
      "projectScenario": {
        "title": "Turn interview snippets into a testable product hypothesis",
        "description": "Tag de-identified interview snippets with pseudonymous participant ID, segment, and session; cluster evidence without flattening contradictory or minority signals; then test whether a proposed product hypothesis is falsifiable and representative enough to guide a decision.",
        "guardrail": "Remove direct identifiers but retain controlled pseudonymous IDs needed to trace clusters; do not infer participant traits or intent beyond the recorded evidence."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set up a traceable synthesis pipeline",
          "description": "Follow ingestion and tagging, clustering, hypothesis generation, and bias review; keep participant, segment, session, and snippet references so later checks remain possible."
        },
        {
          "kind": "guided",
          "title": "Cluster evidence and score a hypothesis",
          "description": "Require cluster membership lists and at least two distinct participant IDs; shape a claim with linked snippets, calibrated confidence, coverage, and a criterion that could disprove it."
        },
        {
          "kind": "hands-on",
          "title": "Run the coverage and bias review",
          "description": "Check whether one segment dominates a cluster, flag coverage gaps against the course gate, and state what additional research would validate or overturn the product hypothesis."
        }
      ],
      "evidence": [
        "Tagged research snippets with pseudonymous source, segment, and session references",
        "A cluster map with snippet membership, participant counts, representative evidence, and contradictions",
        "A hypothesis record with claim, evidence links, confidence, coverage, and a falsification criterion",
        "A representational-coverage review that flags skew and names the next validation step"
      ]
    },
    "de": {
      "headline": "Forschungssynthesen nachvollziehbar und widerlegbar halten",
      "promise": "Du kannst bereinigte Forschung auswerten, ohne die Herkunft einzelner Aussagen zu verlieren, Hypothesen mit Widerlegungskriterium formulieren und unzureichende Abdeckung nach Personen oder Segmenten erkennen.",
      "projectScenario": {
        "title": "Aus Interviewausschnitten eine prüfbare Produkthypothese entwickeln",
        "description": "Versehe bereinigte Interviewausschnitte mit pseudonymer Personenkennung, Segment und Sitzung. Gruppiere Belege, ohne Widersprüche oder Minderheitensignale einzuebnen, und prüfe dann, ob eine Produkthypothese widerlegbar und repräsentativ genug für eine Entscheidung ist.",
        "guardrail": "Entferne direkte Identifikatoren, erhalte aber kontrollierte pseudonyme Kennungen für die Nachverfolgung von Clustern; leite keine Merkmale oder Absichten ab, die nicht belegt sind."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Eine nachvollziehbare Synthesepipeline aufsetzen",
          "description": "Folge den Schritten Aufnahme und Tagging, Clustering, Hypothesenbildung und Bias-Prüfung. Erhalte Personen-, Segment-, Sitzungs- und Ausschnittverweise für spätere Kontrollen."
        },
        {
          "kind": "guided",
          "title": "Belege clustern und Hypothesen bewerten",
          "description": "Verlange Mitgliederlisten je Cluster und mindestens zwei verschiedene Personenkennungen. Formuliere eine Aussage mit verknüpften Ausschnitten, kalibrierter Konfidenz, Abdeckung und einem Kriterium, das sie widerlegen könnte."
        },
        {
          "kind": "hands-on",
          "title": "Abdeckung und Bias prüfen",
          "description": "Prüfe, ob ein Segment ein Cluster dominiert, markiere Lücken anhand der Kurskriterien und benenne die nächste Forschung, die die Produkthypothese bestätigen oder widerlegen könnte."
        }
      ],
      "evidence": [
        "Getaggte Forschungsausschnitte mit pseudonymen Quellen-, Segment- und Sitzungskennungen",
        "Eine Clusterkarte mit Mitgliederausschnitten, Zahl verschiedener Personen, repräsentativen Belegen und Widersprüchen",
        "Ein Hypothesennachweis mit Aussage, Belegverweisen, Konfidenz, Abdeckung und Widerlegungskriterium",
        "Eine Prüfung der repräsentativen Abdeckung mit markierter Verzerrung und nächstem Validierungsschritt"
      ]
    }
  },
  "LRN-07": {
    "en": {
      "headline": "Gate Process Opportunities Before Choosing a Model",
      "promise": "You will be able to surface automation-rich process candidates, score value density and readiness, apply a risk overlay, and defer candidates whose data or controls are not ready.",
      "projectScenario": {
        "title": "Triage manual document re-entry as a process candidate",
        "description": "Use structured process questions to examine a recurring flow where information from email or PDF is re-entered into a system. Classify the task, score value and automation readiness, apply the regulatory, blast-radius, and data-preparation risk overlay, and decide whether it enters a pilot backlog.",
        "guardrail": "A high value score cannot override an unready data gate; defer the candidate when required data, risk review, or process ownership is missing."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Discover the high-volume process seam",
          "description": "Use structured interviews to find repetitive, data-rich work and classify it as extraction, triage, constrained generation, decision support, or orchestration before proposing a model."
        },
        {
          "kind": "guided",
          "title": "Score value, readiness, and risk",
          "description": "Place each candidate on the 1–5 value-density and automation-readiness axes, then apply the risk overlay for regulated decisions, large blast radius, and data that takes too long to prepare."
        },
        {
          "kind": "hands-on",
          "title": "Make a pilot or defer decision",
          "description": "Rank candidates that pass the gates, name a process owner and first verifiable milestone, and record a sponsor-ready go/no-go recommendation."
        }
      ],
      "evidence": [
        "A candidate list grounded in structured process observations and a named process owner",
        "A 1–5 value-density and automation-readiness score with the evidence behind each score",
        "A risk overlay showing human-review needs or a DEFER decision for data-readiness blockers",
        "A ranked pilot brief with sponsor, value case, first milestone, and go/no-go rationale"
      ]
    },
    "de": {
      "headline": "Prozesschancen prüfen, bevor du ein Modell auswählst",
      "promise": "Du kannst automatisierungsgeeignete Prozesse finden, Nutzen und Bereitschaft bewerten, Risiken einbeziehen und Kandidaten mit ungeklärten Daten- oder Kontrollfragen zurückstellen.",
      "projectScenario": {
        "title": "Manuelle Dokumentübertragung als Prozesskandidaten prüfen",
        "description": "Untersuche mit strukturierten Prozessfragen einen wiederkehrenden Ablauf, bei dem Informationen aus E-Mails oder PDFs in ein System übertragen werden. Ordne die Aufgabe ein, bewerte Nutzen und Automatisierungsbereitschaft, wende den Risikoaufschlag für Regulierung, Auswirkungsradius und Datenaufbereitung an und entscheide über einen Pilot.",
        "guardrail": "Ein hoher Nutzenscore überstimmt keine fehlende Datenreife; stelle den Kandidaten zurück, wenn Daten, Risikoprüfung oder Prozessverantwortung fehlen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den wiederkehrenden Prozessabschnitt finden",
          "description": "Finde durch strukturierte Interviews repetitive, datenreiche Aufgaben und ordne sie Extraktion, Triage, begrenzter Generierung, Entscheidungsunterstützung oder Orchestrierung zu, bevor du ein Modell vorschlägst."
        },
        {
          "kind": "guided",
          "title": "Nutzen, Bereitschaft und Risiko bewerten",
          "description": "Bewerte jeden Kandidaten auf den Achsen Nutzendichte und Automatisierungsbereitschaft von 1 bis 5 und wende den Risikoaufschlag für regulierte Entscheidungen, großen Auswirkungsradius und aufwendige Datenaufbereitung an."
        },
        {
          "kind": "hands-on",
          "title": "Pilot- oder Zurückstellungsentscheidung treffen",
          "description": "Priorisiere Kandidaten, die die Gates bestehen, benenne Prozessverantwortung und ersten überprüfbaren Meilenstein und formuliere eine entscheidungsreife Go/No-go-Empfehlung."
        }
      ],
      "evidence": [
        "Eine Kandidatenliste aus strukturierten Prozessbeobachtungen mit benannter Prozessverantwortung",
        "Eine Bewertung von Nutzendichte und Automatisierungsbereitschaft von 1 bis 5 samt Belegen",
        "Ein Risikoaufschlag mit nötiger menschlicher Prüfung oder Zurückstellung wegen fehlender Datenreife",
        "Ein priorisierter Pilotbrief mit Sponsor, Nutzenbegründung, erstem Meilenstein und Go/No-go-Grund"
      ]
    }
  },
  "LRN-33": {
    "en": {
      "headline": "Follow the value behind the token bill",
      "promise": "You can judge whether an AI use case pays off at production scale by modeling its full operating cost against the value it delivers.",
      "projectScenario": {
        "title": "Stress-test an AI workload's economics",
        "description": "Model an AI workflow at expected and peak traffic. Include model calls, retrieval, storage, integration, evaluation, caching, routing, retries, observability, and human review; compare the resulting cost per useful output with a finance-ready value measure.",
        "guardrail": "Use dated prices and explicit traffic assumptions. Apply cache-read discounts only to cached prompt tokens, not to user turns or generated output."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Separate the cost layers",
          "description": "Distinguish model-tier pricing from cache economics, routing overhead, retries, evaluation, observability, and human review; relate each cost to net time saved, decision quality, or risk reduction."
        },
        {
          "kind": "guided",
          "title": "Model traffic and value",
          "description": "Work through mixed task complexity, growing context, cache-hit assumptions, and p50/p99 usage. Compare model routing and caching choices, then calculate cost per useful output rather than only per query."
        },
        {
          "kind": "hands-on",
          "title": "Set a scale decision",
          "description": "Build an expected- and peak-volume case with monitoring signals and cost guardrails that show when the pilot should be reviewed before scale-up."
        }
      ],
      "evidence": [
        "Cost model separating token, cache, routing, and operating overhead at expected and peak volume",
        "Value worksheet using a defensible measure such as net time saved, improved decisions, or reduced risk",
        "Architecture comparison that shows assumptions and cost per useful output",
        "Scale guardrails and monitoring signals tied to the case's economics"
      ]
    },
    "de": {
      "headline": "Den Wert hinter der Tokenrechnung erkennen",
      "promise": "Du kannst beurteilen, ob sich ein KI-Use-Case im Produktivbetrieb rechnet, indem du die gesamten Betriebskosten dem erzielten Nutzen gegenüberstellst.",
      "projectScenario": {
        "title": "Die Wirtschaftlichkeit eines KI-Workloads prüfen",
        "description": "Modelliere einen KI-Workflow bei erwarteter und hoher Auslastung. Berücksichtige Modellaufrufe, Retrieval, Speicher, Integration, Evaluation, Caching, Routing, Wiederholungen, Observability und menschliche Prüfung. Vergleiche dann die Kosten pro brauchbarem Ergebnis mit einem belastbaren Nutzenmaß.",
        "guardrail": "Nutze datierte Preise und transparente Annahmen zum Traffic. Cache-Rabatte gelten nur für gecachte Prompt-Tokens, nicht für Nutzereingaben oder generierte Antworten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Kostenbestandteile auseinanderhalten",
          "description": "Unterscheide Modellpreise von Cache- und Routingkosten sowie Wiederholungen, Evaluation, Observability und menschlicher Prüfung. Ordne die Kosten messbarem Nutzen wie Nettozeitersparnis, besseren Entscheidungen oder geringerem Risiko zu."
        },
        {
          "kind": "guided",
          "title": "Traffic und Nutzen modellieren",
          "description": "Betrachte unterschiedliche Aufgabenkomplexität, wachsenden Kontext, Cache-Hitrate und p50/p99-Nutzung. Vergleiche Routing- und Caching-Optionen und berechne die Kosten pro brauchbarem Ergebnis statt nur pro Anfrage."
        },
        {
          "kind": "hands-on",
          "title": "Eine Skalierungsentscheidung vorbereiten",
          "description": "Erstelle eine Wirtschaftlichkeitsbetrachtung für erwartetes und hohes Volumen. Lege Signale und Kostengrenzen fest, die vor einer Skalierung eine Überprüfung auslösen."
        }
      ],
      "evidence": [
        "Kostenmodell für Token, Cache, Routing und Betriebsaufwand bei erwarteter und hoher Auslastung",
        "Nutzenrechnung mit einem belastbaren Maß wie Nettozeitersparnis, besseren Entscheidungen oder geringerem Risiko",
        "Architekturvergleich mit offengelegten Annahmen und Kosten pro brauchbarem Ergebnis",
        "Skalierungsgrenzen und Überwachungssignale passend zur Wirtschaftlichkeitsbetrachtung"
      ]
    }
  },
  "LRN-21": {
    "en": {
      "headline": "Brief the model before asking for advice",
      "promise": "You can turn a consulting question into an audience-aware prompt and review its reasoning before anyone treats the output as advice.",
      "projectScenario": {
        "title": "Prepare a stakeholder-ready recommendation",
        "description": "Take a client question and specify the decision, audience and belief state, working hypothesis, evidence boundary, counterargument, and required output. Choose a prompt shape suited to a board, skeptical senior audience, or operational team, then refine it into a reviewable recommendation.",
        "guardrail": "Keep generated claims separate from sourced evidence; label assumptions and do not attribute positions to stakeholders without support."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Write the consulting brief",
          "description": "Define who is deciding, what choice is on the table, what the audience believes, what evidence is available, and what would make the answer useful to that audience."
        },
        {
          "kind": "guided",
          "title": "Choose and stress-test a prompt pattern",
          "description": "Select an audience-fit structure, state the hypothesis, and ask for the strongest counterposition. Review the response for missing evidence, weak assumptions, stakeholder bias, and decision relevance."
        },
        {
          "kind": "hands-on",
          "title": "Package a reusable consulting prompt",
          "description": "Prepare a client-ready output and turn the framing into a reusable pattern with an owner, example input, review checklist, and a failure case."
        }
      ],
      "evidence": [
        "Consulting brief naming the decision, audience belief state, evidence, and output criteria",
        "Audience-matched prompt with a stated hypothesis and counterargument request",
        "Output review marking unsupported claims, evidence gaps, assumptions, and bias",
        "Reusable prompt pattern with an owner, example input, review checklist, and failure case"
      ]
    },
    "de": {
      "headline": "Erst das Briefing, dann der Prompt",
      "promise": "Du kannst eine Beratungsfrage in einen zielgruppengerechten Prompt übersetzen und die Argumentation prüfen, bevor jemand das Ergebnis als Empfehlung nutzt.",
      "projectScenario": {
        "title": "Eine Empfehlung für Stakeholder vorbereiten",
        "description": "Nimm eine Kundenfrage und bestimme Entscheidung, Zielgruppe und deren Kenntnis- oder Skepsisstand, Arbeitshypothese, Evidenzgrenzen, Gegenargument und gewünschtes Ergebnis. Wähle eine passende Form für Board, skeptische Führungskräfte oder ein operatives Team und entwickle daraus eine prüfbare Empfehlung.",
        "guardrail": "Trenne generierte Aussagen von belegten Fakten, kennzeichne Annahmen und schreibe Stakeholdern keine unbelegten Positionen zu."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Das Beratungsbriefing formulieren",
          "description": "Kläre, wer entscheidet, welche Frage ansteht, was die Zielgruppe bereits glaubt, welche Belege vorliegen und was eine für sie brauchbare Antwort ausmacht."
        },
        {
          "kind": "guided",
          "title": "Ein Promptmuster auswählen und prüfen",
          "description": "Wähle eine passende Struktur, formuliere die Hypothese und fordere das stärkste Gegenargument an. Prüfe die Antwort auf Beleglücken, schwache Annahmen, Stakeholder-Bias und Entscheidungsrelevanz."
        },
        {
          "kind": "hands-on",
          "title": "Ein wiederverwendbares Beratungsprompt erstellen",
          "description": "Erstelle ein kundenfähiges Ergebnis und überführe das Vorgehen in ein wiederverwendbares Muster mit Zuständigkeit, Beispieleingabe, Prüfliste und Fehlerszenario."
        }
      ],
      "evidence": [
        "Beratungsbriefing mit Entscheidung, Kenntnisstand der Zielgruppe, Evidenz und Ergebniskriterien",
        "Zielgruppengerechter Prompt mit Hypothese und angefordertem Gegenargument",
        "Ergebnisprüfung mit unbelegten Aussagen, Beleglücken, Annahmen und Bias",
        "Wiederverwendbares Promptmuster mit Zuständigkeit, Beispieleingabe, Prüfliste und Fehlerszenario"
      ]
    }
  },
  "LRN-15": {
    "en": {
      "headline": "Choose the stack with an exit path in view",
      "promise": "You can compare models, platforms, gateways, and agent frameworks against an enterprise use case, including the cost of changing course later.",
      "projectScenario": {
        "title": "Select an AI architecture for a defined workload",
        "description": "Map candidate model providers, managed platforms, gateways, and agent frameworks to one workload. Apply residency, latency, security, and audit constraints first, then compare capability, integration, operating cost, and migration or exit cost.",
        "guardrail": "Treat mandatory compliance and residency needs as pass-or-fail gates before scoring. Support vendor claims with dated sources rather than a current benchmark snapshot alone."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map the AI ecosystem",
          "description": "Distinguish model providers, managed inference platforms, gateways, agent frameworks, and tool registries by the architectural role each fills."
        },
        {
          "kind": "guided",
          "title": "Apply gates before scoring",
          "description": "Rule out options that miss hard constraints, then compare remaining choices for capability fit, integration, security, governance, cost, and exit friction."
        },
        {
          "kind": "hands-on",
          "title": "Write a decision brief",
          "description": "Recommend a model and platform direction for the workload, explain the trade-offs to stakeholders, and show what data, assets, or workflows would make a future move costly."
        }
      ],
      "evidence": [
        "Ecosystem map separating models, platforms, gateways, frameworks, and tools",
        "Pass-or-fail record for residency, latency, security, and audit constraints",
        "Comparison of eligible options that includes integration, operating cost, and exit friction",
        "Architecture recommendation with dated evidence and a documented path to leave or migrate"
      ]
    },
    "de": {
      "headline": "Den Stack mit Ausstiegspfad auswählen",
      "promise": "Du kannst Modelle, Plattformen, Gateways und Agent-Frameworks an einem Unternehmens-Use-Case messen und auch die Kosten eines späteren Wechsels einbeziehen.",
      "projectScenario": {
        "title": "Eine KI-Architektur für einen Workload auswählen",
        "description": "Ordne Modellanbieter, verwaltete Plattformen, Gateways und Agent-Frameworks einem konkreten Workload zu. Prüfe zuerst Anforderungen an Datenstandort, Latenz, Sicherheit und Auditierbarkeit. Vergleiche anschließend Fähigkeiten, Integration, Betriebskosten sowie Migrations- und Ausstiegskosten.",
        "guardrail": "Behandle zwingende Compliance- und Standortanforderungen als Muss-Kriterien vor jeder Bewertung. Belege Anbieterangaben mit datierten Quellen statt nur mit einem aktuellen Benchmark."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Das KI-Ökosystem einordnen",
          "description": "Unterscheide Modellanbieter, verwaltete Inferenzplattformen, Gateways, Agent-Frameworks und Tool-Registries nach ihrer Rolle in der Architektur."
        },
        {
          "kind": "guided",
          "title": "Erst prüfen, dann bewerten",
          "description": "Schließe Optionen aus, die Muss-Kriterien verfehlen. Vergleiche die übrigen nach Funktionsumfang, Integration, Sicherheit, Governance, Kosten und Wechselaufwand."
        },
        {
          "kind": "hands-on",
          "title": "Eine Entscheidungsvorlage schreiben",
          "description": "Empfiehl eine Modell- und Plattformrichtung für den Workload, erläutere die Abwägungen und zeige, welche Daten, Assets oder Abläufe einen späteren Wechsel teuer machen würden."
        }
      ],
      "evidence": [
        "Übersicht zu Modellen, Plattformen, Gateways, Frameworks und Tools",
        "Prüfung der Muss-Kriterien zu Datenstandort, Latenz, Sicherheit und Auditierbarkeit",
        "Vergleich geeigneter Optionen zu Integration, Betriebskosten und Wechselaufwand",
        "Architekturempfehlung mit datierten Belegen und dokumentiertem Migrations- oder Ausstiegspfad"
      ]
    }
  },
  "LRN-16": {
    "en": {
      "headline": "Plan the workforce changes behind AI adoption",
      "promise": "You can turn an AI transformation priority into role-level changes, skill building, accountable adoption, and an operating-model roadmap.",
      "projectScenario": {
        "title": "Shape an AI transition for a leadership area",
        "description": "Assess an AI-enabled change for one leadership area. Map affected roles and AI interaction points, decide what people in each role must do or verify, identify enablement gaps, and select a transformation priority with owners and adoption measures.",
        "guardrail": "Keep decision accountability with named people and assess role and culture impacts alongside expected value; tool access alone does not establish readiness."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Assess capabilities and limits",
          "description": "Judge the maturity, capabilities, and risks of generative and agentic AI, then connect them to changes in value creation and ways of working without requiring implementation detail."
        },
        {
          "kind": "guided",
          "title": "Map roles, skills, and impact",
          "description": "For each affected role, identify where people prompt, review, or govern AI, what they must be able to verify, who is accountable, and which skills need enablement."
        },
        {
          "kind": "hands-on",
          "title": "Set a transformation roadmap",
          "description": "Choose initiatives for the leadership area and define owners, milestones, adoption measures, cultural guardrails, evidence, and next actions."
        }
      ],
      "evidence": [
        "Role-impact map showing changed interactions, responsibilities, and skills",
        "Role-capability matrix with prioritized enablement gaps and proposed support",
        "Transformation priorities linked to accountable owners and adoption measures",
        "Operating-model roadmap with milestones, evidence, cultural guardrails, and next actions"
      ]
    },
    "de": {
      "headline": "Die Veränderungen für Mitarbeitende mitplanen",
      "promise": "Du kannst eine AI-Transformationspriorität in konkrete Rollenveränderungen, Kompetenzaufbau, verantwortete Einführung und eine Roadmap fürs Betriebsmodell übersetzen.",
      "projectScenario": {
        "title": "Den AI-Wandel für einen Führungsbereich gestalten",
        "description": "Bewerte eine AI-gestützte Veränderung für einen Führungsbereich. Erfasse betroffene Rollen und AI-Kontaktpunkte, kläre, was Menschen je Rolle tun oder prüfen müssen, identifiziere Befähigungslücken und wähle eine prioritäre Initiative mit Verantwortlichen und Adoptionskennzahlen.",
        "guardrail": "Lass Entscheidungsverantwortung bei benannten Personen und berücksichtige Rollen- und Kulturfolgen neben dem erwarteten Nutzen. Der Zugang zu Tools belegt noch keine Einsatzbereitschaft."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Fähigkeiten und Grenzen einschätzen",
          "description": "Bewerte Reifegrad, Fähigkeiten und Risiken generativer und agentischer AI und leite daraus Veränderungen bei Wertschöpfung und Arbeitsweisen ab, ohne technische Umsetzung vorauszusetzen."
        },
        {
          "kind": "guided",
          "title": "Rollen, Kompetenzen und Auswirkungen erfassen",
          "description": "Bestimme je betroffener Rolle, wo Mitarbeitende AI nutzen, prüfen oder steuern, was sie verifizieren müssen, wer Verantwortung trägt und welche Kompetenzen aufgebaut werden sollten."
        },
        {
          "kind": "hands-on",
          "title": "Eine Transformationsroadmap festlegen",
          "description": "Wähle Initiativen für den Führungsbereich und definiere Verantwortliche, Meilensteine, Adoptionskennzahlen, kulturelle Leitplanken, Nachweise und nächste Schritte."
        }
      ],
      "evidence": [
        "Rollenübersicht mit veränderten Kontaktpunkten, Verantwortlichkeiten und Kompetenzen",
        "Kompetenzmatrix mit priorisierten Befähigungslücken und passenden Maßnahmen",
        "Transformationsprioritäten mit klaren Verantwortlichen und Adoptionskennzahlen",
        "Roadmap fürs Betriebsmodell mit Meilensteinen, Nachweisen, kulturellen Leitplanken und nächsten Schritten"
      ]
    }
  },
  "LRN-40": {
    "en": {
      "headline": "Turn quantitative signals into accountable choices",
      "promise": "You can combine quantitative methods with AI-supported evidence while making uncertainty, bias, and the human decision owner explicit.",
      "projectScenario": {
        "title": "Compare options for a consequential work decision",
        "description": "Frame a real work decision with a clear objective and owner. Use an appropriate combination of clustering, forecasting, Monte Carlo scenarios, or optimization to compare options, then review the evidence and uncertainty before recording the decision.",
        "guardrail": "Do not treat a confidence score or aggregate result as a verdict. Check for subgroup bias and retain a named human approver and rationale."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Frame decision quality",
          "description": "State the objective, accountable owner, evidence needed, and consequences of acting. Separate a model result from the decision process that makes an action defensible and reversible."
        },
        {
          "kind": "guided",
          "title": "Use quantitative methods and scenarios",
          "description": "Select clustering, forecasting, Monte Carlo simulation, or optimization for the question. Compare scenarios and interpret assumptions, calibration, and uncertainty rather than reporting a single point estimate."
        },
        {
          "kind": "hands-on",
          "title": "Review bias and document the choice",
          "description": "Check subgroup outcomes, automation bias, and weak assumptions; record human approval, rationale, and follow-up, then explain the method to peers."
        }
      ],
      "evidence": [
        "Decision frame with objective, accountable owner, and relevant consequences",
        "Quantitative comparison of options with assumptions and uncertainty stated",
        "Bias review that includes subgroup outcomes and automation-bias risks",
        "Decision record with human approval, rationale, follow-up, and a peer-transfer note"
      ]
    },
    "de": {
      "headline": "Quantitative Signale in verantwortete Entscheidungen übersetzen",
      "promise": "Du kannst quantitative Methoden mit AI-gestützter Evidenz verbinden und Unsicherheit, Bias sowie die menschliche Entscheidungsverantwortung sichtbar machen.",
      "projectScenario": {
        "title": "Optionen für eine folgenreiche Arbeitsentscheidung vergleichen",
        "description": "Rahme eine konkrete Arbeitsentscheidung mit klarem Ziel und verantwortlicher Person. Vergleiche Optionen mit passenden Methoden wie Clustering, Prognosen, Monte-Carlo-Szenarien oder Optimierung. Prüfe danach Evidenz und Unsicherheit und dokumentiere die Entscheidung.",
        "guardrail": "Behandle weder einen Konfidenzwert noch ein aggregiertes Ergebnis als Urteil. Prüfe mögliche Verzerrungen zwischen Gruppen und halte die Freigabe durch eine benannte Person samt Begründung fest."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Entscheidungsqualität rahmen",
          "description": "Formuliere Ziel, verantwortliche Person, benötigte Evidenz und Folgen einer Entscheidung. Unterscheide ein Modellergebnis von einem Entscheidungsprozess, der eine Handlung nachvollziehbar und umkehrbar macht."
        },
        {
          "kind": "guided",
          "title": "Quantitative Methoden und Szenarien einsetzen",
          "description": "Wähle Clustering, Prognosen, Monte-Carlo-Simulation oder Optimierung passend zur Frage. Vergleiche Szenarien und erläutere Annahmen, Kalibrierung und Unsicherheit statt nur einen Punktwert zu nennen."
        },
        {
          "kind": "hands-on",
          "title": "Bias prüfen und die Wahl dokumentieren",
          "description": "Prüfe Gruppenergebnisse, Automation Bias und schwache Annahmen. Halte menschliche Freigabe, Begründung und Nachverfolgung fest und erkläre die Methode anschließend Peers."
        }
      ],
      "evidence": [
        "Entscheidungsrahmen mit Ziel, verantwortlicher Person und relevanten Folgen",
        "Quantitativer Vergleich der Optionen mit benannten Annahmen und Unsicherheiten",
        "Bias-Prüfung mit Gruppenergebnissen und Risiken durch Automation Bias",
        "Entscheidungsprotokoll mit menschlicher Freigabe, Begründung, Nachverfolgung und Peer-Transfer"
      ]
    }
  },
  "LRN-05": {
    "en": {
      "headline": "Check every source before the pilot builds on it",
      "promise": "You can decide whether the sources an AI pilot touches are usable, permitted, and sufficient for both the workflow and its evaluation.",
      "projectScenario": {
        "title": "Run a data-readiness gate for an AI pilot",
        "description": "Inventory each source the proposed use case will retrieve from, train on, or use for evaluation. Trace its owner, lineage, permissions, refresh behavior, quality, sensitive fields, and evaluation coverage, then identify what blocks the pilot.",
        "guardrail": "Assess readiness per source. Check permissions, retention, leakage, and evaluation overlap; a good row count cannot make an unpermitted or contaminated source ready."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Trace sources and provenance",
          "description": "List source systems, owners, lineage, access rights, and refresh behavior, including retrieval corpora, metadata feeds, and evaluation data."
        },
        {
          "kind": "guided",
          "title": "Profile five readiness dimensions",
          "description": "Review quality, freshness, sensitivity, provenance, and evaluation coverage for each source; check labels and representativeness as well as missing or inconsistent data."
        },
        {
          "kind": "hands-on",
          "title": "Issue a readiness decision",
          "description": "Apply a use-case-appropriate gate, record blocking gaps and remediation owners, and set measurable acceptance criteria for proceeding."
        }
      ],
      "evidence": [
        "Per-source inventory with owner, lineage, permissions, and refresh behavior",
        "Readiness profile covering quality, freshness, sensitivity, provenance, and evaluation coverage",
        "Evaluation-sample review for label quality, representativeness, leakage, and overlap",
        "Pilot gate decision with blockers, remediation owners, and measurable acceptance criteria"
      ]
    },
    "de": {
      "headline": "Jede Quelle vor dem Piloten prüfen",
      "promise": "Du kannst entscheiden, ob die Quellen eines AI-Piloten nutzbar, freigegeben und für Workflow und Evaluation ausreichend sind.",
      "projectScenario": {
        "title": "Eine Datenbereitschaftsprüfung für den AI-Piloten durchführen",
        "description": "Erfasse alle Quellen, aus denen der Use Case Daten abruft, mit denen er trainiert oder die er zur Evaluation nutzt. Verfolge Verantwortliche, Herkunft, Berechtigungen, Aktualisierung, Qualität, sensible Felder und Evaluationsabdeckung und benenne, was den Piloten blockiert.",
        "guardrail": "Prüfe die Bereitschaft für jede Quelle einzeln. Berücksichtige Berechtigungen, Aufbewahrung, Datenabfluss und Überschneidungen in der Evaluation; viele Datensätze machen eine unzulässige oder verunreinigte Quelle nicht einsatzbereit."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Quellen und Herkunft nachverfolgen",
          "description": "Erfasse Quellsysteme, Verantwortliche, Herkunft, Zugriffsrechte und Aktualisierung. Berücksichtige Retrieval-Korpus, Metadaten und Evaluationsdaten."
        },
        {
          "kind": "guided",
          "title": "Fünf Bereitschaftsdimensionen prüfen",
          "description": "Bewerte Qualität, Aktualität, Sensibilität, Herkunft und Evaluationsabdeckung für jede Quelle. Prüfe Labels und Repräsentativität ebenso wie fehlende oder widersprüchliche Daten."
        },
        {
          "kind": "hands-on",
          "title": "Eine Bereitschaftsentscheidung treffen",
          "description": "Wende eine zum Use Case passende Prüfschwelle an, dokumentiere Blocker und zuständige Personen und lege messbare Kriterien für das weitere Vorgehen fest."
        }
      ],
      "evidence": [
        "Quelleninventar mit Verantwortlichen, Herkunft, Berechtigungen und Aktualisierung",
        "Profil zu Qualität, Aktualität, Sensibilität, Herkunft und Evaluationsabdeckung je Quelle",
        "Prüfung der Evaluationsstichprobe auf Labelqualität, Repräsentativität, Datenabfluss und Überschneidungen",
        "Pilotentscheidung mit Blockern, Zuständigkeiten und messbaren Akzeptanzkriterien"
      ]
    }
  },
  "LRN-28": {
    "en": {
      "headline": "Defend the boundary the attack actually crosses",
      "promise": "You can trace prompt injection, data leakage, and tool misuse across an AI workflow and choose controls for the exposed surfaces.",
      "projectScenario": {
        "title": "Threat-review a retrieval-enabled assistant",
        "description": "Map a workflow that reads user or retrieved content and can call tools. Trace how direct or indirect instructions could redirect the model, extract data, reveal system prompts, or trigger an unintended tool action; choose controls at each boundary.",
        "guardrail": "Treat retrieved and user-supplied content as untrusted, scope tools to least privilege, and validate outputs; a stronger system prompt alone does not close these paths."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map the attack surface",
          "description": "Identify trust boundaries among users, prompts, retrieved sources, models, tools, and outputs, including who controls each input."
        },
        {
          "kind": "guided",
          "title": "Classify failure shapes",
          "description": "Trace direct and indirect injection, tool misuse, data leakage, and system-prompt extraction; relate each path to its realistic impact and exposure."
        },
        {
          "kind": "hands-on",
          "title": "Set proportional controls and gates",
          "description": "Choose input-boundary, tool-scope, output-validation, and audit controls for the mapped risks, then record the launch checks and evidence needed for review."
        }
      ],
      "evidence": [
        "Trust-boundary map naming sources, controllers, tools, and exposed surfaces",
        "Threat paths for injection, tool misuse, data leakage, or prompt extraction with likely impact",
        "Least-privilege tool approval and permission decisions",
        "Launch-gate checklist linked to control and audit evidence"
      ]
    },
    "de": {
      "headline": "Die tatsächlich angegriffene Vertrauensgrenze absichern",
      "promise": "Du kannst Prompt-Injection, Datenabfluss und Tool-Missbrauch im AI-Workflow nachverfolgen und passende Kontrollen für die offenen Angriffsflächen wählen.",
      "projectScenario": {
        "title": "Einen RAG-Assistenten auf Bedrohungen prüfen",
        "description": "Kartiere einen Workflow, der Nutzereingaben oder abgerufene Inhalte verarbeitet und Tools aufrufen kann. Verfolge, wie direkte oder indirekte Anweisungen das Modell umlenken, Daten offenlegen, System-Prompts preisgeben oder unerwünschte Tool-Aktionen auslösen könnten. Leite für jede Grenze passende Kontrollen ab.",
        "guardrail": "Behandle abgerufene und vom Nutzer gelieferte Inhalte als nicht vertrauenswürdig, begrenze Tool-Rechte auf das Nötige und prüfe Ausgaben. Ein stärkerer System-Prompt schließt diese Wege allein nicht."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Angriffsfläche kartieren",
          "description": "Bestimme Vertrauensgrenzen zwischen Nutzenden, Prompts, abgerufenen Quellen, Modellen, Tools und Ausgaben. Halte fest, wer die jeweiligen Eingaben kontrolliert."
        },
        {
          "kind": "guided",
          "title": "Fehlerbilder einordnen",
          "description": "Verfolge direkte und indirekte Injection, Tool-Missbrauch, Datenabfluss und das Auslesen von System-Prompts. Ordne jeden Pfad seiner möglichen Wirkung und Reichweite zu."
        },
        {
          "kind": "hands-on",
          "title": "Angemessene Kontrollen und Freigaben festlegen",
          "description": "Wähle für die erkannten Risiken Kontrollen an Eingabegrenzen, Tool-Rechten, Ausgabeprüfung und Audit-Trail. Dokumentiere Startprüfungen und benötigte Nachweise."
        }
      ],
      "evidence": [
        "Karte der Vertrauensgrenzen mit Quellen, Verantwortlichen, Tools und Angriffsflächen",
        "Bedrohungspfade für Injection, Tool-Missbrauch, Datenabfluss oder Prompt-Auslesen samt möglicher Wirkung",
        "Freigabe- und Berechtigungsentscheidungen nach dem Prinzip der geringsten Rechte",
        "Start-Checkliste mit Bezug zu Kontrollen und Auditnachweisen"
      ]
    }
  },
  "LRN-18": {
    "en": {
      "headline": "Make the retrieved document earn its answer",
      "promise": "You can plan an internal RAG assistant that checks source authority, freshness, scope, access, and answer quality instead of trusting a plausible citation.",
      "projectScenario": {
        "title": "Review a knowledge answer that cites the wrong document",
        "description": "Plan an assistant for an internal knowledge collection where a highly similar but stale or mis-tagged document could win retrieval. Define source and chunk metadata for freshness, authority, scope match, and agreement, then specify citations, access filters, evaluation, and fallback behavior.",
        "guardrail": "Respect source-system permissions. A citation or high retrieval score does not prove the document is current, authoritative, or in scope; abstain or route the question when evidence is weak."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Establish source readiness",
          "description": "Assess coverage, owner, authority, permissions, quality, and freshness before indexing documents for a knowledge assistant."
        },
        {
          "kind": "guided",
          "title": "Design retrieval checks",
          "description": "Specify chunk metadata and retrieval checks for recency, scope, authority, and agreement; preserve access boundaries and define what happens when no suitable source is found."
        },
        {
          "kind": "hands-on",
          "title": "Evaluate answers against failure cases",
          "description": "Review sample answers for grounding and relevance, including wrong-but-similar, stale, or mis-tagged sources; define citation, abstention, and owner follow-up paths."
        }
      ],
      "evidence": [
        "Source inventory with coverage, owner, authority, freshness, permissions, and quality",
        "Chunk-metadata and retrieval plan for recency, scope match, and source agreement",
        "Answer-evaluation cases for wrong-but-similar, stale, and mis-tagged documents",
        "Access-aware citation and fallback plan with accountable source owners"
      ]
    },
    "de": {
      "headline": "Die abgerufene Quelle muss die Antwort tragen",
      "promise": "Du kannst einen internen RAG-Assistenten so planen, dass er Autorität, Aktualität, Geltungsbereich, Zugriff und Antwortqualität prüft, statt einem plausiblen Zitat zu vertrauen.",
      "projectScenario": {
        "title": "Eine Antwort mit dem falschen Dokument prüfen",
        "description": "Plane einen Assistenten für einen internen Wissensbestand, in dem ein ähnliches, aber veraltetes oder falsch verschlagwortetes Dokument beim Retrieval gewinnen könnte. Lege Metadaten zu Aktualität, Quellenautorität, Geltungsbereich und Übereinstimmung fest und beschreibe Quellenangaben, Zugriffsfilter, Evaluation und Rückfallverhalten.",
        "guardrail": "Beachte die Berechtigungen des Quellsystems. Ein Zitat oder hoher Retrieval-Score beweist nicht, dass ein Dokument aktuell, maßgeblich oder relevant ist. Lass den Assistenten bei schwacher Evidenz zurückstellen oder weiterleiten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Quellenbereitschaft sicherstellen",
          "description": "Prüfe Abdeckung, Verantwortliche, Quellenautorität, Berechtigungen, Qualität und Aktualität, bevor Dokumente für den Wissensassistenten indexiert werden."
        },
        {
          "kind": "guided",
          "title": "Retrieval-Prüfungen entwerfen",
          "description": "Definiere Chunk-Metadaten und Prüfungen zu Aktualität, Geltungsbereich, Autorität und Quellenübereinstimmung. Erhalte Zugriffsgrenzen und lege das Verhalten bei fehlender passender Quelle fest."
        },
        {
          "kind": "hands-on",
          "title": "Antworten an Fehlerfällen evaluieren",
          "description": "Prüfe Beispielantworten auf Belegbarkeit und Relevanz, auch bei ähnlichen, veralteten oder falsch verschlagworteten Dokumenten. Lege Quellenangaben, Zurückhaltung und Nachverfolgung durch Verantwortliche fest."
        }
      ],
      "evidence": [
        "Quelleninventar mit Abdeckung, Zuständigkeit, Autorität, Aktualität, Berechtigungen und Qualität",
        "Metadaten- und Retrieval-Plan für Aktualität, Geltungsbereich und Quellenübereinstimmung",
        "Evaluationsfälle zu ähnlichen, veralteten und falsch verschlagworteten Dokumenten",
        "Zugriffsgeprüfter Plan für Quellenangaben und Rückfallverhalten mit benannten Quellenverantwortlichen"
      ]
    }
  },
  "LRN-41": {
    "en": {
      "headline": "Buy on evidence, then price the exit",
      "promise": "You can make a procurement recommendation that stands up to capability, contract, security, data, and cost review and includes a credible exit plan.",
      "projectScenario": {
        "title": "Evaluate vendors for a real workload",
        "description": "Compare candidate AI vendors for one defined workload. Apply hard gates, collect dated evidence for a six-dimension scorecard, test with realistic traffic and measurable acceptance criteria, then estimate contract, operating, lock-in, and exit risks.",
        "guardrail": "Treat demos and marketing claims as leads, not evidence. Use current quotes and document references, including data-handling terms, service commitments, and what can be exported at exit."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Define gates and scorecard dimensions",
          "description": "Set the use-case requirements and disqualifying gates, then evaluate model capability, data handling and residency, security, compliance, integration and lock-in, and economics and exit planning."
        },
        {
          "kind": "guided",
          "title": "Run an evidence-based trial",
          "description": "Choose a realistic workload and measurable acceptance criteria; size the evaluation to produce useful evidence and compare dated vendor quotes rather than demo impressions."
        },
        {
          "kind": "hands-on",
          "title": "Recommend a purchase with an exit path",
          "description": "Record evidence and trade-offs, identify contract and operating risks, calculate the practical cost of changing provider, and present a procurement decision with an explicit exit plan."
        }
      ],
      "evidence": [
        "Vendor scorecard with hard-gate results and references for each scored dimension",
        "Trial plan using realistic workload, measurable criteria, and an evidence-appropriate sample",
        "Risk review covering data handling, security, compliance, contracts, integration, and operating cost",
        "Procurement recommendation that includes trade-offs, dated quotes, and exit steps"
      ]
    },
    "de": {
      "headline": "Mit Evidenz beschaffen und den Ausstieg mitrechnen",
      "promise": "Du kannst eine Beschaffungsempfehlung begründen, die Fähigkeiten, Vertrag, Sicherheit, Daten und Kosten berücksichtigt und einen tragfähigen Ausstiegsplan enthält.",
      "projectScenario": {
        "title": "Anbieter für einen konkreten Workload bewerten",
        "description": "Vergleiche AI-Anbieter für einen klar umrissenen Workload. Wende Muss-Kriterien an, sammle datierte Belege für ein Scoring in sechs Dimensionen und teste mit realistischem Traffic und messbaren Akzeptanzkriterien. Schätze anschließend Vertrags-, Betriebs-, Abhängigkeits- und Ausstiegsrisiken ein.",
        "guardrail": "Behandle Demos und Marketingaussagen als Hinweise, nicht als Belege. Nutze aktuelle Angebote und dokumentierte Quellen, einschließlich Datenverarbeitung, Servicezusagen und möglicher Datenexporte beim Ausstieg."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Muss-Kriterien und Scoring festlegen",
          "description": "Leite Anforderungen und Ausschlusskriterien aus dem Use Case ab. Bewerte danach Modellfähigkeiten, Datenverarbeitung und -standort, Sicherheit, Compliance, Integration und Abhängigkeit sowie Wirtschaftlichkeit und Ausstieg."
        },
        {
          "kind": "guided",
          "title": "Einen evidenzbasierten Test durchführen",
          "description": "Wähle einen realistischen Workload und messbare Akzeptanzkriterien. Bemesse die Evaluation so, dass sie aussagekräftige Belege liefert, und vergleiche datierte Angebote statt bloßer Demos."
        },
        {
          "kind": "hands-on",
          "title": "Beschaffung und Ausstieg empfehlen",
          "description": "Dokumentiere Belege und Abwägungen, prüfe Vertrags- und Betriebsrisiken, schätze die praktischen Wechselkosten und formuliere eine Beschaffungsentscheidung mit konkretem Ausstiegsplan."
        }
      ],
      "evidence": [
        "Anbieter-Scoring mit Ergebnissen der Muss-Kriterien und Quellen für jede Dimension",
        "Testplan mit realistischem Workload, messbaren Kriterien und aussagekräftiger Stichprobe",
        "Risikoprüfung zu Datenverarbeitung, Sicherheit, Compliance, Vertrag, Integration und Betriebskosten",
        "Beschaffungsempfehlung mit Abwägungen, datierten Angeboten und Ausstiegsschritten"
      ]
    }
  },
  "LRN-36": {
    "en": {
      "headline": "Catch quality incidents before the dashboard looks red",
      "promise": "You can recognize AI-specific production failures, route them to the right runbook, and recover without losing diagnostic evidence.",
      "projectScenario": {
        "title": "Triage a silent AI quality regression",
        "description": "Work through a production change where transport latency and error rates look normal but output length, refusal rate, or format quality shifts. Classify the incident, assign severity and ownership, and follow the validated containment or rollback path.",
        "guardrail": "Check AI-quality signals alongside standard SRE metrics. Treat safety incidents as the highest priority and preserve diagnostic evidence during rollback and recovery."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Monitor signals beyond transport health",
          "description": "Separate infrastructure measures from AI-quality signals such as output length, refusal rate, and format drift, and connect quality, cost, tool-use, and safety changes to incident categories."
        },
        {
          "kind": "guided",
          "title": "Classify and escalate within the response window",
          "description": "Use severity, ownership, and escalation rules to identify the right category runbook quickly, including the safety override when signals conflict."
        },
        {
          "kind": "hands-on",
          "title": "Recover and improve the runbook",
          "description": "Follow a validated rollback and recovery path while retaining evidence; use the postmortem to update runbooks, monitoring, or release gates."
        }
      ],
      "evidence": [
        "AI-quality panel alongside latency, error, and cost signals",
        "Incident record with category, severity, owner, and escalation path",
        "Rollback and recovery steps that retain diagnostic evidence",
        "Postmortem changes linked to the runbook, monitoring, or release gate"
      ]
    },
    "de": {
      "headline": "Qualitätsvorfälle erkennen, bevor das Dashboard rot wird",
      "promise": "Du kannst AI-spezifische Produktionsfehler erkennen, dem passenden Runbook zuordnen und die Wiederherstellung mit gesicherten Diagnosebelegen durchführen.",
      "projectScenario": {
        "title": "Eine unauffällige AI-Qualitätsregression triagieren",
        "description": "Untersuche eine Produktionsänderung, bei der Latenz und Fehlerrate normal wirken, aber Antwortlänge, Ablehnungsrate oder Ausgabeformat kippen. Ordne den Vorfall ein, bestimme Schweregrad und Zuständigkeit und nutze den validierten Eindämmungs- oder Rollback-Pfad.",
        "guardrail": "Prüfe AI-Qualitätssignale zusätzlich zu üblichen SRE-Kennzahlen. Sicherheitsvorfälle haben Vorrang; sichere Diagnosebelege während Rollback und Wiederherstellung."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Signale jenseits der Transportgesundheit überwachen",
          "description": "Unterscheide Infrastrukturwerte von AI-Qualitätssignalen wie Antwortlänge, Ablehnungsrate und Formatabweichung. Ordne Änderungen bei Qualität, Kosten, Tool-Nutzung und Sicherheit Vorfallskategorien zu."
        },
        {
          "kind": "guided",
          "title": "Innerhalb des Reaktionsfensters triagieren",
          "description": "Nutze Regeln für Schweregrad, Zuständigkeit und Eskalation, um schnell das passende Kategorie-Runbook zu wählen. Berücksichtige den Vorrang von Sicherheit, wenn Signale kollidieren."
        },
        {
          "kind": "hands-on",
          "title": "Wiederherstellen und Runbook verbessern",
          "description": "Folge einem validierten Rollback- und Wiederherstellungspfad und erhalte die Diagnosebelege. Leite aus dem Postmortem Aktualisierungen für Runbook, Überwachung oder Release-Kriterien ab."
        }
      ],
      "evidence": [
        "AI-Qualitätsübersicht neben Latenz-, Fehler- und Kostensignalen",
        "Vorfallsprotokoll mit Kategorie, Schweregrad, Zuständigkeit und Eskalationsweg",
        "Rollback- und Wiederherstellungsschritte mit gesicherten Diagnosebelegen",
        "Postmortem-Maßnahmen mit Bezug zu Runbook, Monitoring oder Release-Kriterien"
      ]
    }
  },
  "LRN-09": {
    "en": {
      "headline": "Route support on verified service evidence",
      "promise": "You can design a support pipeline that uses AI only when ticket context and knowledge coverage justify it, and measure whether service quality improves.",
      "projectScenario": {
        "title": "Route a support ticket from intake to resolution",
        "description": "For a ticket, extract intent, product and version, urgency, and prior contact; verify that an approved knowledge article covers the same context; then decide whether AI may assist, a person must approve, or the issue needs escalation and structured handoff.",
        "guardrail": "Do not draft from stale or version-mismatched knowledge. Escalate urgent signals immediately and route low-confidence or uncovered cases to a person."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set the service boundary",
          "description": "Classify support actions as safe assistance, approval-required, or prohibited automation, and identify urgency and customer-impact signals that change the route."
        },
        {
          "kind": "guided",
          "title": "Build a grounded ticket pipeline",
          "description": "Connect field extraction, knowledge coverage, answer drafting, confidence thresholds, and escalation so retrieval quality is checked before a model response reaches an agent or customer."
        },
        {
          "kind": "hands-on",
          "title": "Review handoffs and service measures",
          "description": "Check drafted responses for accuracy, data exposure, and customer impact; package incident context for escalation and define measures such as reopen rate, handoff accuracy, containment, and rework."
        }
      ],
      "evidence": [
        "Service-action map separating assistance, approval, and prohibited automation",
        "Ticket-field and knowledge-coverage checks that include product version and urgency",
        "Confidence-based routing and escalation rules with a structured incident handoff",
        "Service-quality measures covering resolution, reopens, handoffs, containment, and rework"
      ]
    },
    "de": {
      "headline": "Supportfälle anhand geprüfter Service-Evidenz routen",
      "promise": "Du kannst einen Supportablauf gestalten, in dem AI nur bei passendem Ticketkontext und belegter Wissensabdeckung hilft, und die Wirkung auf den Service messen.",
      "projectScenario": {
        "title": "Ein Support-Ticket vom Eingang bis zur Lösung steuern",
        "description": "Erfasse bei einem Ticket Anliegen, Produkt und Version, Dringlichkeit sowie vorherige Kontakte. Prüfe, ob ein freigegebener Wissensartikel genau diesen Kontext abdeckt. Entscheide dann, ob AI unterstützen darf, eine Person freigeben muss oder eine Eskalation mit strukturierter Übergabe nötig ist.",
        "guardrail": "Erstelle keine Antwort auf Basis veralteter oder versionsfalscher Wissensartikel. Eskaliere dringende Signale sofort und leite Fälle mit geringer Sicherheit oder fehlender Abdeckung an eine Person weiter."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Servicegrenze festlegen",
          "description": "Ordne Supportaktionen als sichere Assistenz, freigabepflichtig oder unzulässige Automatisierung ein. Bestimme Dringlichkeits- und Kundenauswirkungssignale, die den Ablauf verändern."
        },
        {
          "kind": "guided",
          "title": "Eine quellenbasierte Ticket-Pipeline aufbauen",
          "description": "Verbinde Felderkennung, Wissensabdeckung, Antwortentwurf, Konfidenzschwellen und Eskalation. Prüfe die Retrieval-Qualität, bevor eine Modellausgabe Servicepersonal oder Kundschaft erreicht."
        },
        {
          "kind": "hands-on",
          "title": "Übergaben und Servicequalität prüfen",
          "description": "Bewerte Antwortentwürfe auf Richtigkeit, Datenoffenlegung und Kundenauswirkung. Bündele Kontext für Eskalationen und lege Kennzahlen wie Wiedereröffnungen, Übergabegenauigkeit, Fallabschluss und Nacharbeit fest."
        }
      ],
      "evidence": [
        "Serviceaktionsplan für Assistenz, Freigabe und unzulässige Automatisierung",
        "Prüfung von Ticketfeldern und Wissensabdeckung einschließlich Produktversion und Dringlichkeit",
        "Konfidenzbasierte Routing- und Eskalationsregeln mit strukturierter Vorfallsübergabe",
        "Servicekennzahlen zu Lösung, Wiedereröffnungen, Übergaben, Fallabschluss und Nacharbeit"
      ]
    }
  },
  "LRN-10": {
    "en": {
      "headline": "Leave with decisions, owners, and a usable record",
      "promise": "You can use AI to shape a meeting or workshop around a real decision and turn approved notes into accountable follow-up, not just a summary.",
      "projectScenario": {
        "title": "Facilitate a decision-focused workshop",
        "description": "Start with a workshop objective and prepare an agenda, roles, inputs, time boxes, questions, and alternatives. After the session, use approved notes to capture the decision and rationale, actions with owners and deadlines, open questions with reopen triggers, and parking-lot items with a disposition.",
        "guardrail": "Check consent and data sensitivity before using a transcript with AI. Do not invent participant positions or turn generated suggestions into commitments."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Define the agenda contract",
          "description": "Specify the outcome, decision, required inputs, participants, roles, and time boxes so the session has a clear purpose beyond producing a summary."
        },
        {
          "kind": "guided",
          "title": "Prepare and facilitate the discussion",
          "description": "Use AI to develop questions, alternatives, and workshop material; during review, distinguish what participants actually said from model-generated prompts or interpretations."
        },
        {
          "kind": "hands-on",
          "title": "Extract typed meeting artifacts",
          "description": "Quality-check the approved notes and publish linked decision, action, open-question, and parking-lot records with rationale, owners, deadlines, triggers, or disposition as appropriate."
        }
      ],
      "evidence": [
        "Agenda contract and facilitation script with outcome, decision, roles, inputs, and time boxes",
        "Prepared questions and alternatives that do not assert unsupported stakeholder positions",
        "Reviewed decision and action records with rationale, owner, and deadline",
        "Follow-up package with open-question triggers, parking-lot disposition, and commitments separated from suggestions"
      ]
    },
    "de": {
      "headline": "Mit Entscheidungen, Zuständigkeiten und einem nutzbaren Protokoll enden",
      "promise": "Du kannst ein Meeting oder einen Workshop mit AI auf eine konkrete Entscheidung ausrichten und aus freigegebenen Notizen verbindliche nächste Schritte statt nur einer Zusammenfassung machen.",
      "projectScenario": {
        "title": "Einen entscheidungsorientierten Workshop moderieren",
        "description": "Beginne mit einem Workshopziel und bereite Agenda, Rollen, Beiträge, Zeitfenster, Fragen und Alternativen vor. Halte nach dem Termin anhand freigegebener Notizen Entscheidung und Begründung, Maßnahmen mit Zuständigkeiten und Fristen, offene Fragen mit Wiederaufnahme-Auslösern sowie geparkte Themen mit nächstem Umgang fest.",
        "guardrail": "Prüfe Einwilligung und Vertraulichkeit, bevor du ein Transkript mit AI verarbeitest. Erfinde keine Positionen und mache aus generierten Vorschlägen keine Zusagen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den Agenda-Auftrag festlegen",
          "description": "Bestimme Ergebnis, Entscheidung, benötigte Beiträge, Teilnehmende, Rollen und Zeitfenster, damit der Termin mehr leistet als eine Zusammenfassung zu erzeugen."
        },
        {
          "kind": "guided",
          "title": "Diskussion vorbereiten und moderieren",
          "description": "Nutze AI für Fragen, Alternativen und Workshopmaterial. Unterscheide bei der Prüfung, was Teilnehmende tatsächlich gesagt haben und was vom Modell als Impuls oder Deutung stammt."
        },
        {
          "kind": "hands-on",
          "title": "Typisierte Meeting-Ergebnisse extrahieren",
          "description": "Prüfe freigegebene Notizen und veröffentliche verknüpfte Einträge für Entscheidungen, Maßnahmen, offene Fragen und geparkte Themen – jeweils mit passender Begründung, Zuständigkeit, Frist, Auslöser oder Festlegung."
        }
      ],
      "evidence": [
        "Agenda-Auftrag und Moderationsskript mit Ergebnis, Entscheidung, Rollen, Beiträgen und Zeitfenstern",
        "Vorbereitete Fragen und Alternativen ohne unbelegte Stakeholder-Positionen",
        "Geprüfte Entscheidungs- und Maßnahmenprotokolle mit Begründung, Zuständigkeit und Frist",
        "Nachbereitung mit Wiederaufnahme-Auslösern, Umgang mit geparkten Themen und getrennten Zusagen und Vorschlägen"
      ]
    }
  },
  "LRN-32": {
    "en": {
      "headline": "Make every steering section answer a decision question",
      "promise": "You can turn verified project data into a steering pack with traceable, fresh signals and a clear decision request or status conclusion.",
      "projectScenario": {
        "title": "Prepare a source-checked steering update",
        "description": "Build one steering-pack section from project signals. Record each value with its source, age, and signal tier; remove stale evidence, check whether metrics and RAG status agree, and end with the decision question or status closing the evidence supports.",
        "guardrail": "Separate facts, forecasts, and assumptions; do not invent numbers or smooth conflicting signals into a confident status. Label source and age for every cited signal."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Classify signals and freshness",
          "description": "Distinguish measured outcomes, delivery metrics, qualitative assessments, and proxy signals. Record source and age, then exclude evidence that exceeds its tier's staleness limit."
        },
        {
          "kind": "guided",
          "title": "Apply section quality gates",
          "description": "Check traceability, admissible signal coverage, consistency between RAG and evidence, freshness, and whether a blocker or threshold breach requires escalation."
        },
        {
          "kind": "hands-on",
          "title": "Frame the steering ask",
          "description": "Choose a status confirmation, risk escalation, or decision request that the verified signals support; state options, trade-offs, dependencies, owner, and decision date where relevant."
        }
      ],
      "evidence": [
        "Signal table with value, named source, age, and evidence tier",
        "Reviewed status section with stale or unsupported signals removed and facts separated from forecasts",
        "Quality-gate results for traceability, freshness, consistency, and decision-question presence",
        "Steering closing that matches the evidence: status confirmation, risk escalation, or decision request"
      ]
    },
    "de": {
      "headline": "Jeder Steering-Abschnitt muss eine Entscheidungsfrage beantworten",
      "promise": "Du kannst verifizierte Projektdaten in ein Steering-Paket mit nachvollziehbaren, aktuellen Signalen und einer klaren Entscheidungs- oder Statusaussage überführen.",
      "projectScenario": {
        "title": "Ein quellengeprüftes Steering-Update vorbereiten",
        "description": "Erstelle einen Abschnitt für ein Steering-Paket aus Projektsignalen. Halte jeden Wert mit Quelle, Alter und Signalebene fest. Entferne veraltete Belege, prüfe, ob Kennzahlen und Ampelstatus zusammenpassen, und schließe mit der durch die Evidenz gestützten Entscheidungsfrage oder Statusaussage.",
        "guardrail": "Trenne Fakten, Prognosen und Annahmen. Erfinde keine Zahlen und glätte widersprüchliche Signale nicht zu einem sicheren Status. Kennzeichne Quelle und Alter für jedes verwendete Signal."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Signale und Aktualität einordnen",
          "description": "Unterscheide gemessene Ergebnisse, Lieferkennzahlen, qualitative Einschätzungen und Proxy-Signale. Erfasse Quelle und Alter und schließe Belege aus, die die Aktualitätsgrenze ihrer Ebene überschreiten."
        },
        {
          "kind": "guided",
          "title": "Qualitätskriterien anwenden",
          "description": "Prüfe Nachvollziehbarkeit, zulässige Signale, Übereinstimmung von Ampelstatus und Evidenz sowie Aktualität. Kläre, ob Blocker oder Grenzwertüberschreitungen eine Eskalation verlangen."
        },
        {
          "kind": "hands-on",
          "title": "Die Steuerungsfrage formulieren",
          "description": "Wähle eine Statusaussage, Risikoeskalation oder Entscheidungsbitte, die von den geprüften Signalen getragen wird. Benenne bei Bedarf Optionen, Abwägungen, Abhängigkeiten, Zuständigkeit und Entscheidungsfrist."
        }
      ],
      "evidence": [
        "Signaltabelle mit Wert, benannter Quelle, Alter und Evidenzebene",
        "Geprüfter Statusabschnitt ohne veraltete oder unbelegte Signale und mit getrennten Fakten und Prognosen",
        "Ergebnisse der Qualitätsprüfung zu Quellenbezug, Aktualität, Konsistenz und Entscheidungsfrage",
        "Steering-Abschluss passend zur Evidenz: Statusaussage, Risikoeskalation oder Entscheidungsbitte"
      ]
    }
  },
  "LRN-12": {
    "en": {
      "headline": "Find the master-data defects an AI workflow would amplify",
      "promise": "You can trace an AI workflow to the master data it depends on, measure business-critical quality defects, and decide whether to remediate or gate the workflow.",
      "projectScenario": {
        "title": "Assess a master-data domain before scale-up",
        "description": "Choose a data domain used in retrieval, model context, or structured prediction. Trace its owner and quality rules, profile duplicate, missing, stale, inconsistent, or invalid records, and assess how those defects would affect downstream AI outputs.",
        "guardrail": "Set thresholds by use-case criticality and downstream impact. Do not let an acceptable aggregate score hide a blocking defect in a key identifier, join, or retrieval field."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Trace domains and ownership",
          "description": "Identify the master and reference data domains in the workflow, the accountable owners, and the business rules that define a valid record."
        },
        {
          "kind": "guided",
          "title": "Profile quality against thresholds",
          "description": "Measure nulls, duplicates, stale records, and format variance in business-critical fields; prioritize uniqueness and trace how defects could propagate into retrieval or model context."
        },
        {
          "kind": "hands-on",
          "title": "Issue a go, conditional, or block decision",
          "description": "Score quality by domain and use-case criticality, name any mitigation or upstream fix, and define monitoring and escalation before poor data is amplified at scale."
        }
      ],
      "evidence": [
        "Dependency map linking AI workflow, master-data domains, owners, and quality rules",
        "Quality profile for missing, duplicate, stale, inconsistent, and invalid records",
        "Criticality-aware quality decision with blocking defects and named remediation or mitigation",
        "Monitoring and escalation rules tied to business-critical thresholds"
      ]
    },
    "de": {
      "headline": "Stammdatenmängel finden, die ein AI-Workflow verstärken würde",
      "promise": "Du kannst einen AI-Workflow zu seinen Stammdaten zurückverfolgen, geschäftskritische Qualitätsmängel messen und über Korrektur oder Sperre entscheiden.",
      "projectScenario": {
        "title": "Eine Stammdatendomäne vor der Skalierung bewerten",
        "description": "Wähle eine Datendomäne, die in Retrieval, Modellkontext oder strukturierter Vorhersage verwendet wird. Ermittle Verantwortliche und Qualitätsregeln, prüfe doppelte, fehlende, veraltete, widersprüchliche oder ungültige Datensätze und bewerte die Folgen für nachgelagerte AI-Ausgaben.",
        "guardrail": "Leite Schwellenwerte aus Kritikalität und Folgewirkung des Use Cases ab. Lass einen guten Gesamtscore keinen blockierenden Fehler in Kennungen, Verknüpfungen oder Retrieval-Feldern verdecken."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Datendomänen und Zuständigkeit verfolgen",
          "description": "Bestimme Stamm- und Referenzdaten im Workflow, die zuständigen Personen und die Geschäftsregeln für gültige Datensätze."
        },
        {
          "kind": "guided",
          "title": "Qualität anhand von Schwellenwerten profilieren",
          "description": "Miss Nullwerte, Duplikate, veraltete Datensätze und Formatabweichungen in geschäftskritischen Feldern. Priorisiere Eindeutigkeit und verfolge, wie Mängel Retrieval oder Modellkontext verfälschen können."
        },
        {
          "kind": "hands-on",
          "title": "Go-, Bedingt- oder Stopp-Entscheidung treffen",
          "description": "Bewerte Qualität je Domäne und Use-Case-Kritikalität, benenne nötige Korrekturen oder Gegenmaßnahmen und lege Überwachung und Eskalation fest, bevor mangelhafte Daten skaliert werden."
        }
      ],
      "evidence": [
        "Abhängigkeitsübersicht zu AI-Workflow, Stammdatendomänen, Zuständigkeiten und Qualitätsregeln",
        "Qualitätsprofil zu fehlenden, doppelten, veralteten, widersprüchlichen und ungültigen Datensätzen",
        "Kritikalitätsgerechte Qualitätsentscheidung mit Blockern und benannter Korrektur oder Gegenmaßnahme",
        "Überwachungs- und Eskalationsregeln für geschäftskritische Schwellenwerte"
      ]
    }
  },
  "LRN-30": {
    "en": {
      "headline": "Prove process readiness before choosing automation",
      "promise": "You can decide whether a process is ready for AI automation by observing how it runs, mapping exceptions, and testing the value and risk before committing to a pilot.",
      "projectScenario": {
        "title": "Run the readiness gate for an automation candidate",
        "description": "Map a live process's decisions, queues, handoffs, systems, controls, and exception paths. Assemble the four inputs for a recommendation: manual error modes, exception distribution, downstream output sensitivity, and cost structure; then determine whether the candidate is ready, conditional, or not ready.",
        "guardrail": "Base the map on observed work, not only the written procedure. Do not recommend automation when exception coverage, output consequences, volume evidence, or cost assumptions are missing."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "See the process as it operates",
          "description": "Trace the actual flow through decisions, queues, handoffs, systems, controls, and exceptions; identify where the documented procedure differs from practice."
        },
        {
          "kind": "guided",
          "title": "Test the four readiness inputs",
          "description": "Document manual error modes and exception distribution, assess the downstream sensitivity of wrong outputs, and profile volume and cost before selecting rules, human judgment, or probabilistic AI."
        },
        {
          "kind": "hands-on",
          "title": "Record the gate and pilot handoff",
          "description": "Issue a pass, conditional, or fail verdict with evidence. If ready, define bounded pilot controls, human fallback, observability, and stop conditions; if not, name the evidence or process work still needed."
        }
      ],
      "evidence": [
        "Observed current-state process map with decisions, handoffs, systems, controls, and exceptions",
        "Exception and manual-error profile with the coverage behind the recommendation",
        "Output-sensitivity assessment plus a peak-aware volume and cost view",
        "Readiness verdict with evidence and, where appropriate, a bounded pilot handoff and fallback"
      ]
    },
    "de": {
      "headline": "Prozessreife vor der Automatisierung belegen",
      "promise": "Du kannst entscheiden, ob ein Prozess für AI-Automatisierung bereit ist, indem du den tatsächlichen Ablauf beobachtest, Ausnahmen erfasst und Nutzen und Risiko vor einem Piloten prüfst.",
      "projectScenario": {
        "title": "Die Bereitschaft eines Automatisierungskandidaten prüfen",
        "description": "Kartiere Entscheidungen, Warteschlangen, Übergaben, Systeme, Kontrollen und Ausnahmewege im gelebten Prozess. Ermittle die vier Grundlagen einer Empfehlung: manuelle Fehlerbilder, Verteilung der Ausnahmen, Folgen falscher Ausgaben und Kostenstruktur. Entscheide anschließend, ob der Kandidat bereit, bedingt bereit oder noch nicht bereit ist.",
        "guardrail": "Stütze die Prozesskarte auf beobachtete Arbeit und nicht nur auf die Verfahrensbeschreibung. Empfiehl keine Automatisierung, wenn Ausnahmen, Folgen, Volumenbelege oder Kostenannahmen ungeklärt sind."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den tatsächlichen Prozessverlauf verstehen",
          "description": "Verfolge Entscheidungen, Warteschlangen, Übergaben, Systeme, Kontrollen und Ausnahmen im laufenden Prozess und erkenne Abweichungen zur dokumentierten Vorgehensweise."
        },
        {
          "kind": "guided",
          "title": "Die vier Voraussetzungen prüfen",
          "description": "Dokumentiere manuelle Fehler und Ausnahmeverteilung, bewerte die Folgen falscher Ausgaben und ermittle Volumen und Kosten, bevor du Regeln, menschliches Urteil oder probabilistische AI auswählst."
        },
        {
          "kind": "hands-on",
          "title": "Prüfergebnis und Pilotübergabe festhalten",
          "description": "Triff mit Belegen eine Pass-, Bedingt- oder Fail-Entscheidung. Lege bei ausreichender Reife begrenzte Pilotkontrollen, menschlichen Rückfall, Beobachtbarkeit und Abbruchkriterien fest; andernfalls benenne die fehlenden Nachweise oder Prozessarbeiten."
        }
      ],
      "evidence": [
        "Beobachtete Ist-Prozesskarte mit Entscheidungen, Übergaben, Systemen, Kontrollen und Ausnahmen",
        "Profil der Ausnahmen und manuellen Fehler mit belegter Abdeckung",
        "Bewertung der Folgen falscher Ausgaben sowie volumen- und kostenbewusste Einschätzung",
        "Bereitschaftsentscheidung mit Evidenz und gegebenenfalls begrenzter Pilotübergabe samt Rückfallweg"
      ]
    }
  },
  "LRN-39": {
    "en": {
      "headline": "Make risk ownership and control evidence auditable",
      "promise": "You can turn an AI risk into an assigned, testable control with evidence, approval, and a traceable exception path.",
      "projectScenario": {
        "title": "Review the controls for one AI use case",
        "description": "Classify the consequence of an AI output, assign a named risk owner, state the review control and its evidence artifact, then test whether the control operates as described. Record any policy exception, residual risk, and expiry in an audit trail.",
        "guardrail": "Classify by the output's downstream effect and use the highest applicable consequence level; human review alone does not prove a control works. Never leave an exception without an owner and expiry."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Classify risk and set review gates",
          "description": "Assess whether outputs are informational, client-facing, financial, irreversible, or safety-adjacent; connect consequence level to the minimum human review and approval evidence."
        },
        {
          "kind": "guided",
          "title": "Assign and test control ownership",
          "description": "For each material risk, name one owner, a specific operating control, a queryable evidence artifact, and a review date. Test that the control reduces the intended risk in practice."
        },
        {
          "kind": "hands-on",
          "title": "Build the audit and exception trail",
          "description": "Record approvals, residual-risk decisions, and any exception's control, rationale, owner, and expiry; identify policy gaps that require escalation before deployment."
        }
      ],
      "evidence": [
        "Risk-register entry with consequence level, named owner, control, evidence location, and review date",
        "Control-test record showing what ran, who reviewed it, and the observed result",
        "Policy-exception record with the relaxed control, rationale, residual risk, owner, and expiry",
        "Audit trail that can retrieve approvals and evidence for a specified use case and period"
      ]
    },
    "de": {
      "headline": "Risikoverantwortung und Kontrollnachweise auditierbar machen",
      "promise": "Du kannst ein AI-Risiko in eine zugewiesene und prüfbare Kontrolle mit Nachweisen, Freigabe und nachvollziehbarem Ausnahmeweg überführen.",
      "projectScenario": {
        "title": "Kontrollen für einen AI-Use-Case prüfen",
        "description": "Ordne die Folgen einer AI-Ausgabe ein, benenne eine verantwortliche Person, beschreibe die Prüfschranke und ihren Nachweis und teste, ob die Kontrolle wie vorgesehen wirkt. Halte Richtlinienausnahmen, Restrisiko und Ablaufdatum in einem Audit-Trail fest.",
        "guardrail": "Ordne das Risiko nach der Wirkung der Ausgabe auf nachgelagerte Entscheidungen ein und nutze die höchste zutreffende Stufe. Menschliche Prüfung allein belegt keine wirksame Kontrolle. Lass Ausnahmen nie ohne Zuständigkeit und Ablaufdatum offen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Risiken einstufen und Prüfschranken setzen",
          "description": "Bewerte, ob Ausgaben informieren, an Kunden gehen, finanzielle Folgen haben oder unumkehrbar beziehungsweise sicherheitsrelevant sind. Verknüpfe die Folgenstufe mit erforderlicher menschlicher Prüfung und Freigabenachweis."
        },
        {
          "kind": "guided",
          "title": "Kontrollverantwortung zuweisen und testen",
          "description": "Benenne für jedes wesentliche Risiko eine verantwortliche Person, eine konkrete Betriebskontrolle, einen abrufbaren Nachweistyp und einen Prüftermin. Teste, ob die Kontrolle das vorgesehene Risiko in der Praxis senkt."
        },
        {
          "kind": "hands-on",
          "title": "Audit- und Ausnahmepfad dokumentieren",
          "description": "Halte Freigaben, Entscheidungen zum Restrisiko und bei Ausnahmen die gelockerte Kontrolle, Begründung, Zuständigkeit und Befristung fest. Eskaliere Richtlinienlücken vor dem Einsatz."
        }
      ],
      "evidence": [
        "Risikoregistereintrag mit Folgenstufe, benannter Verantwortung, Kontrolle, Nachweisort und Prüftermin",
        "Kontrolltest mit ausgeführtem Prüfschritt, prüfender Person und beobachtetem Ergebnis",
        "Ausnahmeeintrag mit gelockerter Kontrolle, Begründung, Restrisiko, Zuständigkeit und Ablaufdatum",
        "Audit-Trail, der Freigaben und Nachweise für einen Use Case und Zeitraum abrufbar macht"
      ]
    }
  },
  "LRN-13": {
    "en": {
      "headline": "Govern the knowledge behind AI search",
      "promise": "You will be able to decide which knowledge sources belong in an internal AI search, how their quality and access are checked, and how corrections reach the index.",
      "projectScenario": {
        "title": "Prepare an internal knowledge corpus",
        "description": "Review a collection of policy pages, process notes, team wikis, and older project material for an internal assistant. Classify each candidate by owner, authority, currency, consistency, scope, audience, sensitivity, and retention, then record whether it should be admitted, reviewed, deferred, or retired.",
        "guardrail": "Keep the source permission boundary intact: indexing content must not make it visible to people who could not access the original source."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set quality gates before retrieval",
          "description": "Connect authority, freshness, consistency, and scope fit to retrieval quality; see why search can amplify stale or low-authority material instead of correcting it."
        },
        {
          "kind": "guided",
          "title": "Triage candidate sources",
          "description": "Compare a current policy with an older process page and an ownerless wiki entry. Choose a disposition for each and explain which evidence supports the decision."
        },
        {
          "kind": "hands-on",
          "title": "Define the governance log and correction loop",
          "description": "Specify source ownership, index metadata, access rules, review cadence, supersession handling, and the record needed to trace a correction from source to assistant."
        }
      ],
      "evidence": [
        "A source register with owner, authority tier, review date, audience, sensitivity, and retention",
        "A documented admit, defer, or retire decision using authority, currency, consistency, and scope fit",
        "An index policy that carries source permissions and review metadata into retrieval",
        "A correction or supersession record showing who updates the source and how the index is refreshed"
      ]
    },
    "de": {
      "headline": "KI-Suche auf gepflegte Quellen stützen",
      "promise": "Nach dem Kurs kannst du entscheiden, welche Wissensquellen in eine interne KI-Suche gehören, wie Qualität und Zugriff geprüft werden und wie Korrekturen den Suchindex erreichen.",
      "projectScenario": {
        "title": "Einen internen Wissensbestand vorbereiten",
        "description": "Prüfe Richtlinien, Prozessnotizen, Team-Wikis und ältere Projektunterlagen für einen internen Assistenten. Ordne jede Quelle nach Zuständigkeit, Verbindlichkeit, Aktualität, Widerspruchsfreiheit, Themenpassung, Zielgruppe, Schutzbedarf und Aufbewahrung ein. Halte fest, ob sie aufgenommen, geprüft, zurückgestellt oder ausgesondert wird.",
        "guardrail": "Wahre die Berechtigungen der Quelle: Durch die Indexierung dürfen Inhalte nicht für Personen sichtbar werden, die am Original keinen Zugriff hätten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Qualitätsprüfungen vor der Suche festlegen",
          "description": "Ordne Verbindlichkeit, Aktualität, Widerspruchsfreiheit und Themenpassung der Retrieval-Qualität zu. Verstehe, warum eine Suche veraltete oder wenig verlässliche Inhalte verstärken kann, statt sie zu korrigieren."
        },
        {
          "kind": "guided",
          "title": "Quellen vor der Aufnahme einordnen",
          "description": "Vergleiche eine aktuelle Richtlinie mit einer älteren Prozessseite und einem Wiki ohne klare Zuständigkeit. Entscheide je Quelle über die Aufnahme und begründe die Entscheidung mit konkreten Belegen."
        },
        {
          "kind": "hands-on",
          "title": "Governance-Protokoll und Korrekturweg definieren",
          "description": "Lege Zuständigkeiten, Index-Metadaten, Zugriffsregeln, Prüfrhythmus und Umgang mit abgelösten Inhalten fest. Beschreibe, wie eine Korrektur von der Quelle bis zum Assistenten nachvollziehbar bleibt."
        }
      ],
      "evidence": [
        "Ein Quellenverzeichnis mit Zuständigkeit, Verbindlichkeitsstufe, Prüfdatum, Zielgruppe, Schutzbedarf und Aufbewahrung",
        "Eine begründete Aufnahme-, Zurückstellungs- oder Aussonderungsentscheidung anhand von Verbindlichkeit, Aktualität, Widerspruchsfreiheit und Themenpassung",
        "Eine Indexierungsregel, die Quellenberechtigungen und Prüfmetadaten in der Suche erhält",
        "Ein Korrektur- oder Ablöseprotokoll mit Zuständigkeit und Aktualisierung des Suchindex"
      ]
    }
  },
  "LRN-42": {
    "en": {
      "headline": "Make AI architecture decisions traceable",
      "promise": "Leave with an AI architecture decision record that compares model, vendor, data, security, integration, operations, and cost choices and names the conditions for revisiting the decision.",
      "projectScenario": {
        "title": "Choose an architecture for an internal assistant",
        "description": "Frame an assistant that retrieves internal material and may call a business tool. Compare viable model and vendor options alongside data residency, integration boundaries, security, observability, and expected operating cost; capture the option selected and the evidence behind it.",
        "guardrail": "Label estimates and assumptions as such. Do not present a model score, security position, or cost projection as verified without supporting evidence."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Frame the architecture decision",
          "description": "State the decision context, constraints, alternatives, measurable quality attributes, owner, and the factors that could make today's choice obsolete."
        },
        {
          "kind": "guided",
          "title": "Compare the AI-specific trade-offs",
          "description": "Work through model substitutability, vendor boundary, data classification and residency, tool integration, threat exposure, observability, cost ceiling, and operational effort."
        },
        {
          "kind": "hands-on",
          "title": "Write the ADR and its review trigger",
          "description": "Record the accepted choice, rejected alternatives, evidence, assumptions, consequences, accountable owner, and events that require re-evaluation, such as a model change or boundary shift."
        }
      ],
      "evidence": [
        "A decision brief with context, constraints, alternatives, and measurable quality attributes",
        "A comparison matrix covering model, vendor, data, integration, security, observability, cost, and operational trade-offs",
        "A threat and cost note that separates measured evidence from assumptions",
        "An ADR with decision owner, consequences, review date or trigger, and a record of evaluated alternatives"
      ]
    },
    "de": {
      "headline": "KI-Architektur nachvollziehbar entscheiden",
      "promise": "Du erstellst einen Architekturentscheid für KI, der Modell, Anbieter, Daten, Sicherheit, Integration, Betrieb und Kosten vergleicht und festhält, wann die Entscheidung neu geprüft werden muss.",
      "projectScenario": {
        "title": "Die Architektur für einen internen Assistenten wählen",
        "description": "Grenze einen Assistenten ab, der interne Inhalte abruft und möglicherweise ein Geschäftswerkzeug aufruft. Vergleiche geeignete Modell- und Anbieteroptionen sowie Datenresidenz, Integrationsgrenzen, Sicherheit, Beobachtbarkeit und erwartete Betriebskosten. Halte die gewählte Option und ihre Belege fest.",
        "guardrail": "Kennzeichne Schätzungen und Annahmen. Stelle Modellwerte, Sicherheitsbewertungen und Kostenprognosen ohne Beleg nicht als bestätigte Fakten dar."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Architekturfrage abgrenzen",
          "description": "Formuliere Kontext, Randbedingungen, Alternativen, messbare Qualitätsmerkmale und Zuständigkeit. Benenne außerdem Faktoren, durch die die heutige Wahl überholt sein könnte."
        },
        {
          "kind": "guided",
          "title": "KI-spezifische Abwägungen vergleichen",
          "description": "Prüfe Austauschbarkeit von Modellen, Anbietergrenzen, Datenklassifikation und -residenz, Werkzeuganbindung, Bedrohungen, Beobachtbarkeit, Kostengrenze und Betriebsaufwand."
        },
        {
          "kind": "hands-on",
          "title": "ADR und Prüfanlass festhalten",
          "description": "Dokumentiere die Entscheidung, verworfene Alternativen, Belege, Annahmen, Folgen, verantwortliche Person und Ereignisse, die eine Neubewertung auslösen, etwa Modellwechsel oder veränderte Datengrenzen."
        }
      ],
      "evidence": [
        "Eine Entscheidungsvorlage mit Kontext, Randbedingungen, Alternativen und messbaren Qualitätsmerkmalen",
        "Eine Vergleichsmatrix zu Modell, Anbieter, Daten, Integration, Sicherheit, Beobachtbarkeit, Kosten und Betriebsaufwand",
        "Eine Bedrohungs- und Kostenbetrachtung, die Messwerte von Annahmen trennt",
        "Ein ADR mit Zuständigkeit, Folgen, Prüftermin oder Auslöser und dokumentierten Alternativen"
      ]
    }
  },
  "LRN-31": {
    "en": {
      "headline": "Make backlog priorities auditable",
      "promise": "Turn an uneven AI product backlog into comparable work items and a defensible roadmap choice, with visible value, effort, risk, dependencies, and reasons for deferring work.",
      "projectScenario": {
        "title": "Prioritize a mixed backlog of AI ideas",
        "description": "Start with requests that overlap, depend on different teams, and have uneven customer evidence. Normalize each item, use AI to surface missing assumptions or sequencing conflicts, then prepare a recommendation that explains what moves forward and what waits.",
        "guardrail": "AI-generated summaries and scores are inputs to discussion; the product owner validates evidence and criteria and owns the final priority decision."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Normalize the backlog before scoring",
          "description": "Give each item a comparable problem, outcome, evidence, dependency, and acceptance-criteria structure so apparent priority does not hide missing information."
        },
        {
          "kind": "guided",
          "title": "Test the scoring model",
          "description": "Inspect AI-flagged duplicates, weak assumptions, stakeholder trade-offs, and sequencing conflicts; compare items with explicit value, effort, risk, learning, and strategic-fit criteria."
        },
        {
          "kind": "hands-on",
          "title": "Explain the roadmap choice",
          "description": "Check dependencies, record the human decision owner, and make the rationale for selected and deferred items clear enough to revisit after new evidence arrives."
        }
      ],
      "evidence": [
        "Comparable backlog records with problem, outcome, evidence, dependencies, and acceptance criteria",
        "A review note listing duplicates, unsupported assumptions, and sequencing conflicts found or ruled out",
        "A scoring rubric with stated criteria and weights for value, effort, risk, learning, and strategic alignment",
        "A roadmap decision log that records selected work, deferred work, rationale, and accountable owner"
      ]
    },
    "de": {
      "headline": "Backlog-Entscheidungen nachvollziehbar priorisieren",
      "promise": "Du machst ungleich belegte KI-Produktideen vergleichbar und bereitest eine begründete Roadmap-Entscheidung vor, die Wert, Aufwand, Risiko, Abhängigkeiten und Zurückstellungen sichtbar macht.",
      "projectScenario": {
        "title": "Einen gemischten Backlog mit KI-Ideen priorisieren",
        "description": "Arbeite mit Wünschen, die sich überschneiden, von verschiedenen Teams abhängen und unterschiedlich gut durch Kundensignale belegt sind. Vereinheitliche die Einträge, lasse fehlende Annahmen oder Reihenfolgekonflikte sichtbar machen und begründe anschließend, was vorgezogen und was zurückgestellt wird.",
        "guardrail": "KI-Zusammenfassungen und Punktwerte sind Diskussionsgrundlagen. Der Product Owner prüft Belege und Kriterien und verantwortet die endgültige Priorisierung."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den Backlog vor der Bewertung vereinheitlichen",
          "description": "Gib jedem Eintrag dieselbe Struktur für Problem, Ergebnis, Belege, Abhängigkeiten und Akzeptanzkriterien, damit fehlende Informationen die Priorität nicht verdecken."
        },
        {
          "kind": "guided",
          "title": "Das Bewertungsmodell erproben",
          "description": "Prüfe gefundene Dubletten, unbelegte Annahmen, Stakeholder-Zielkonflikte und Reihenfolgeprobleme. Vergleiche Einträge anhand expliziter Kriterien für Wert, Aufwand, Risiko, Lerngewinn und strategische Passung."
        },
        {
          "kind": "hands-on",
          "title": "Die Roadmap-Entscheidung begründen",
          "description": "Prüfe Abhängigkeiten, benenne die entscheidungsverantwortliche Person und dokumentiere, warum Einträge ausgewählt oder zurückgestellt wurden und wann neue Belege eine Neubewertung auslösen."
        }
      ],
      "evidence": [
        "Vergleichbare Backlog-Einträge mit Problem, Ergebnis, Belegen, Abhängigkeiten und Akzeptanzkriterien",
        "Ein Prüfvermerk zu gefundenen oder ausgeschlossenen Dubletten, unbelegten Annahmen und Reihenfolgekonflikten",
        "Ein Bewertungsraster mit Kriterien und Gewichtung für Wert, Aufwand, Risiko, Lerngewinn und strategische Passung",
        "Ein Roadmap-Entscheidungsprotokoll mit Auswahl, Zurückstellung, Begründung und verantwortlicher Person"
      ]
    }
  },
  "LRN-29": {
    "en": {
      "headline": "Test with data you can trust",
      "promise": "Choose test data by its sensitivity and test value, then show that it covers the needed behaviors without exposing source records or confusing memorized examples with model capability.",
      "projectScenario": {
        "title": "Prepare data for an AI evaluation suite",
        "description": "Review a set of realistic test cases and candidate data drawn from masked records, generated examples, samples, or public benchmarks. Decide which transformation fits each test need, then check coverage, realism, bias, memorization, and leakage against the source material.",
        "guardrail": "Do not assume masking or synthetic generation makes data anonymous; keep real user records out of unapproved test, logging, and evaluation systems."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Classify data before choosing a method",
          "description": "Relate field sensitivity, permitted transformation, retention, and required test behavior to masking, generation, sampling, or simulation."
        },
        {
          "kind": "guided",
          "title": "Check coverage and leakage",
          "description": "Compare candidate datasets against representative cases, including edge behavior. Look for unrealistic distributions, bias, source memorization, and benchmark contamination."
        },
        {
          "kind": "hands-on",
          "title": "Document a governed test set",
          "description": "Record provenance, approvals, limitations, expiry, reuse conditions, and the checks that must pass before the dataset supports model evaluation."
        }
      ],
      "evidence": [
        "A field classification for sensitivity, utility, retention, and allowed transformation",
        "A method choice for each test need, with a reason for masking, generation, sampling, or simulation",
        "Coverage results and checks for realism, bias, memorization, re-identification, or leakage",
        "A test-data record with source, approval, known limits, expiry, and conditions for safe reuse"
      ]
    },
    "de": {
      "headline": "Mit verlässlichen Testdaten prüfen",
      "promise": "Du wählst Testdaten nach Schutzbedarf und Testnutzen aus und zeigst, dass sie die benötigten Fälle abdecken, ohne Quelldaten offenzulegen oder auswendig gelernte Beispiele mit Modellfähigkeit zu verwechseln.",
      "projectScenario": {
        "title": "Daten für eine KI-Evaluationssuite vorbereiten",
        "description": "Prüfe repräsentative Testfälle und mögliche Datenquellen: maskierte Datensätze, generierte Beispiele, Stichproben oder öffentliche Benchmarks. Entscheide je Testzweck über die passende Methode und prüfe Abdeckung, Realitätsnähe, Verzerrung, Memorierung und Datenabfluss gegenüber dem Ausgangsmaterial.",
        "guardrail": "Maskierung und synthetische Generierung machen Daten nicht automatisch anonym. Echte Nutzerdaten gehören nicht in ungeprüfte Test-, Protokollierungs- oder Evaluationssysteme."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Daten vor der Methodenwahl klassifizieren",
          "description": "Ordne Feldsensibilität, zulässige Transformation, Aufbewahrung und benötigtes Testverhalten der passenden Methode zu: Maskierung, Generierung, Stichprobe oder Simulation."
        },
        {
          "kind": "guided",
          "title": "Abdeckung und Datenabfluss prüfen",
          "description": "Vergleiche Kandidaten mit repräsentativen Testfällen einschließlich Randfällen. Achte auf unrealistische Verteilungen, Verzerrungen, Memorierung von Quelldaten und kontaminierte Benchmarks."
        },
        {
          "kind": "hands-on",
          "title": "Einen geregelten Testdatensatz dokumentieren",
          "description": "Halte Herkunft, Freigaben, Grenzen, Ablaufdatum, Wiederverwendung und notwendige Prüfungen fest, bevor der Datensatz zur Modellevaluation dient."
        }
      ],
      "evidence": [
        "Eine Feldklassifikation zu Schutzbedarf, Testnutzen, Aufbewahrung und zulässiger Transformation",
        "Eine begründete Wahl von Maskierung, Generierung, Stichprobe oder Simulation je Testzweck",
        "Abdeckungsnachweise und Prüfungen zu Realitätsnähe, Verzerrung, Memorierung, Reidentifizierung oder Datenabfluss",
        "Ein Datensatzsteckbrief mit Herkunft, Freigabe, bekannten Grenzen, Ablaufdatum und Bedingungen zur sicheren Wiederverwendung"
      ]
    }
  },
  "LRN-34": {
    "en": {
      "headline": "Fit AI into real ERP and CRM workflows",
      "promise": "Assess an ERP or CRM use case from business value through system boundaries and data ownership to a pilot that respects transaction controls and real exceptions.",
      "projectScenario": {
        "title": "Trace a customer-service case across CRM and ERP",
        "description": "Use a case such as reducing service-case handling time. Map the CRM interaction to the system of record and any ERP order-history handoff, compare an embedded vendor feature with a custom extension, and scope a pilot around representative cases and exceptions.",
        "guardrail": "Do not let an AI step bypass the system of record, transaction authorization, or audit trail; identify the data owner and approved integration boundary first."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map the process and its systems",
          "description": "Locate where SAP, Salesforce, Microsoft business solutions, or another ERP/CRM system owns the transaction, data, and user authorization."
        },
        {
          "kind": "guided",
          "title": "Compare embedded and custom options",
          "description": "Follow the data flow and compare business value, platform fit, vendor lock-in, operating effort, and control implications for each option."
        },
        {
          "kind": "hands-on",
          "title": "Scope a pilot around exceptions",
          "description": "Choose representative process cases, define exception and handoff paths, assign owners, and set observable business outcomes for the pilot."
        }
      ],
      "evidence": [
        "A process map that names the system of record, data owner, and integration boundary",
        "A control map showing where authorization, transaction integrity, and auditability apply",
        "A comparison of native business-application AI and a custom extension across value, data flow, lock-in, and operations",
        "A pilot brief with representative cases, exceptions, owners, and measurable outcomes"
      ]
    },
    "de": {
      "headline": "KI passend in ERP- und CRM-Prozesse einbetten",
      "promise": "Du bewertest einen ERP- oder CRM-Anwendungsfall vom Geschäftswert über Systemgrenzen und Datenverantwortung bis zum Pilot, der Transaktionskontrollen und echte Ausnahmefälle berücksichtigt.",
      "projectScenario": {
        "title": "Einen Servicefall über CRM und ERP verfolgen",
        "description": "Nimm etwa die Verkürzung der Bearbeitungszeit für Servicefälle als Beispiel. Verfolge den CRM-Kontakt bis zum führenden System und einer möglichen ERP-Übergabe mit Bestellhistorie. Vergleiche eine eingebaute Herstellerfunktion mit einer individuellen Erweiterung und grenze einen Pilot mit repräsentativen Fällen und Ausnahmen ab.",
        "guardrail": "Die KI darf weder das führende System noch Transaktionsberechtigungen oder Audit-Spuren umgehen. Kläre zuerst Datenverantwortung und freigegebene Integrationsgrenzen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Prozess und Systeme abbilden",
          "description": "Bestimme, wo SAP, Salesforce, Microsoft-Geschäftslösungen oder ein anderes ERP-/CRM-System Transaktion, Daten und Benutzerberechtigung verantworten."
        },
        {
          "kind": "guided",
          "title": "Eingebaute und individuelle Lösungen vergleichen",
          "description": "Verfolge den Datenfluss und vergleiche Geschäftswert, Plattformpassung, Anbieterbindung, Betriebsaufwand und Auswirkungen auf Kontrollen."
        },
        {
          "kind": "hands-on",
          "title": "Einen Pilot mit Ausnahmefällen abgrenzen",
          "description": "Wähle repräsentative Prozessfälle, beschreibe Ausnahme- und Übergabewege, ordne Verantwortliche zu und lege beobachtbare Geschäftsergebnisse fest."
        }
      ],
      "evidence": [
        "Eine Prozessübersicht mit führendem System, Datenverantwortung und Integrationsgrenze",
        "Eine Kontrollübersicht zu Berechtigungen, Transaktionsintegrität und Auditierbarkeit",
        "Ein Vergleich von eingebauter Geschäfts-KI und individueller Erweiterung nach Wert, Datenfluss, Anbieterbindung und Betrieb",
        "Ein Pilotbrief mit repräsentativen Fällen, Ausnahmen, Verantwortlichen und messbaren Ergebnissen"
      ]
    }
  },
  "LRN-35": {
    "en": {
      "headline": "Plan AI across cloud, data, and IoT boundaries",
      "promise": "Design an AI use case by tracing its data and ownership boundaries, then place processing at the edge, in the cloud, or in batch/streaming paths against stated operational constraints.",
      "projectScenario": {
        "title": "Design a factory telemetry and maintenance flow",
        "description": "Consider AI that summarizes fault reports from factory-floor sensors, enriches them with ERP maintenance history, and presents recommendations through a cloud interface. Map the OT boundary, data owners, residency constraints, and separate latency needs for real-time fault detection and periodic summaries.",
        "guardrail": "Do not assume sensor data can leave an isolated OT network or that a cloud region can host every source; make owner approval, residency, security, and latency constraints explicit."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Trace the use case across boundaries",
          "description": "Follow device or business data through ingestion, storage, processing, model inference, and the consuming system, naming the owner and trust boundary at each handoff."
        },
        {
          "kind": "guided",
          "title": "Place each workload",
          "description": "Separate latency-sensitive detection from slower analysis; compare edge, cloud, batch, and streaming choices against availability, sovereignty, security, data quality, observability, and cost."
        },
        {
          "kind": "hands-on",
          "title": "Sketch the deployable platform path",
          "description": "Draw the data path and failure points, state scale and latency assumptions, and identify which platform decision needs an owner or security review."
        }
      ],
      "evidence": [
        "A boundary-aware flow from sensor or source through platform, model, and consuming application",
        "A requirements note separating latency, availability, sovereignty, security, quality, and observability needs",
        "A placement comparison for edge, cloud, batch, and streaming with stated assumptions",
        "An architecture sketch with data owners, failure paths, scale assumptions, and review points"
      ]
    },
    "de": {
      "headline": "KI über Cloud-, Daten- und IoT-Grenzen planen",
      "promise": "Du entwirfst einen KI-Anwendungsfall, indem du Daten- und Zuständigkeitsgrenzen nachverfolgst und die Verarbeitung anhand betrieblicher Anforderungen an Edge, Cloud, Batch oder Streaming ausrichtest.",
      "projectScenario": {
        "title": "Telemetrie und Instandhaltung im Werk verbinden",
        "description": "Betrachte eine KI, die Störungsmeldungen von Sensoren in der Fertigung zusammenfasst, mit ERP-Instandhaltungsdaten anreichert und Empfehlungen über eine Cloud-Oberfläche bereitstellt. Zeichne OT-Grenze, Datenverantwortliche, Datenresidenz und unterschiedliche Latenzanforderungen für Echtzeit-Erkennung und regelmäßige Auswertungen ein.",
        "guardrail": "Nimm nicht an, dass Sensordaten ein isoliertes OT-Netz verlassen dürfen oder jede Quelle in einer Cloud-Region liegen kann. Mache Freigaben, Datenresidenz, Sicherheit und Latenzanforderungen explizit."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den Anwendungsfall über Grenzen verfolgen",
          "description": "Verfolge Geräte- und Geschäftsdaten über Aufnahme, Speicherung, Verarbeitung, Modellinferenz und Zielsystem und benenne an jeder Übergabe Zuständigkeit und Vertrauensgrenze."
        },
        {
          "kind": "guided",
          "title": "Verarbeitung passend platzieren",
          "description": "Trenne latenzkritische Erkennung von langsamerer Analyse. Vergleiche Edge, Cloud, Batch und Streaming anhand von Verfügbarkeit, Datenhoheit, Sicherheit, Datenqualität, Beobachtbarkeit und Kosten."
        },
        {
          "kind": "hands-on",
          "title": "Den Plattformpfad skizzieren",
          "description": "Zeichne Datenfluss und Fehlerpunkte, benenne Skalierungs- und Latenzannahmen und markiere Architekturentscheidungen, die eine Zuständigkeit oder Sicherheitsprüfung brauchen."
        }
      ],
      "evidence": [
        "Ein grenzbewusster Datenfluss von Sensor oder Quelle über Plattform und Modell bis zur Zielanwendung",
        "Eine Anforderungsliste zu Latenz, Verfügbarkeit, Datenhoheit, Sicherheit, Qualität und Beobachtbarkeit",
        "Ein Vergleich von Edge, Cloud, Batch und Streaming mit ausgewiesenen Annahmen",
        "Eine Architekturübersicht mit Datenverantwortlichen, Fehlerpfaden, Skalierungsannahmen und Prüfpunkten"
      ]
    }
  },
  "LRN-38": {
    "en": {
      "headline": "Design human review that has real authority",
      "promise": "Create an AI review workflow where the right person has enough context and authority to approve, revise, reject, or escalate, and where review quality can be measured.",
      "projectScenario": {
        "title": "Review an AI-drafted customer recommendation",
        "description": "Design a workflow in which AI summarizes case evidence and proposes a next step. Set review levels according to impact, uncertainty, reversibility, and policy, then define who can make each decision and what evidence they need.",
        "guardrail": "A human review step must allow an independent judgment and a meaningful override; a click-through approval or model confidence score alone is not review."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set review by consequence",
          "description": "Distinguish low-impact assistance from decisions that affect customers or operations; connect uncertainty and reversibility to the required review authority."
        },
        {
          "kind": "guided",
          "title": "Give reviewers a workable decision path",
          "description": "Assign reviewer roles, context, evidence, and service expectations, then map approve, revise, reject, and escalate outcomes with an audit record."
        },
        {
          "kind": "hands-on",
          "title": "Measure the review loop",
          "description": "Choose signals for disagreement, override, rework, delay, and downstream harm, and use them to refine review thresholds and checklists."
        }
      ],
      "evidence": [
        "A case-tiering rule based on impact, uncertainty, reversibility, and policy",
        "A reviewer-role definition with decision authority, required context, and service expectations",
        "An approval flow with approve, revise, reject, and escalation paths plus an audit record",
        "A review-quality measure set for disagreement, override, rework, delay, and downstream harm"
      ]
    },
    "de": {
      "headline": "Menschliche Prüfung mit echter Befugnis gestalten",
      "promise": "Du entwickelst einen KI-Prüfablauf, in dem die zuständige Person genug Kontext und Befugnis hat, um freizugeben, zu ändern, abzulehnen oder zu eskalieren – und dessen Qualität messbar ist.",
      "projectScenario": {
        "title": "Eine KI-Empfehlung für einen Kundenfall prüfen",
        "description": "Gestalte einen Ablauf, in dem KI Belege zu einem Fall zusammenfasst und einen nächsten Schritt vorschlägt. Lege Prüfstufen anhand von Auswirkung, Unsicherheit, Umkehrbarkeit und Richtlinien fest. Bestimme, wer welche Entscheidung treffen darf und welche Belege dafür nötig sind.",
        "guardrail": "Die menschliche Prüfung muss ein eigenständiges Urteil und eine wirksame Übersteuerung ermöglichen. Ein Bestätigungsklick oder ein KI-Konfidenzwert allein reicht nicht."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Prüfung an der möglichen Auswirkung ausrichten",
          "description": "Unterscheide einfache Unterstützung von Entscheidungen mit Folgen für Kundschaft oder Betrieb und leite aus Unsicherheit und Umkehrbarkeit die nötige Prüfbefugnis ab."
        },
        {
          "kind": "guided",
          "title": "Einen praktikablen Entscheidungsweg schaffen",
          "description": "Ordne Prüfrollen, Kontext, Belege und Bearbeitungszeiten zu. Zeichne anschließend Freigabe, Überarbeitung, Ablehnung und Eskalation samt Prüfprotokoll nach."
        },
        {
          "kind": "hands-on",
          "title": "Den Prüfkreislauf messen",
          "description": "Wähle Kennzahlen zu abweichenden Einschätzungen, Übersteuerungen, Nacharbeit, Verzögerungen und Folgeschäden und nutze sie, um Prüfschwellen und Checklisten weiterzuentwickeln."
        }
      ],
      "evidence": [
        "Eine Fallklassifikation nach Auswirkung, Unsicherheit, Umkehrbarkeit und Richtlinien",
        "Eine Rollenbeschreibung mit Entscheidungsbefugnis, erforderlichem Kontext und Bearbeitungserwartung",
        "Ein Freigabeablauf mit Pfaden für Freigabe, Änderung, Ablehnung und Eskalation samt Prüfprotokoll",
        "Ein Kennzahlenset zu abweichenden Einschätzungen, Übersteuerungen, Nacharbeit, Verzögerungen und Folgeschäden"
      ]
    }
  },
  "LRN-43": {
    "en": {
      "headline": "Scale AI through shared services and champions",
      "promise": "Design an operating model that helps teams scale AI through clear decision rights, shared standards and assets, a champion network, and a governance cadence that tracks value and risk.",
      "projectScenario": {
        "title": "Coordinate AI work across several teams",
        "description": "Several business and engineering teams are launching pilots, repeating security reviews, and rebuilding prompts or evaluations. Define what a Center of Excellence provides, how local AI champions spread working practices, which decisions remain with product teams, and how new work enters a shared portfolio cadence.",
        "guardrail": "Shared standards and champion support do not transfer product or risk accountability away from the teams that own each AI solution."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set decision rights across functions",
          "description": "Map responsibilities across product, engineering, data, security, compliance, and business; separate platform-wide standards from decisions owned by each product team."
        },
        {
          "kind": "guided",
          "title": "Design the CoE and champion network",
          "description": "Specify shared services, standards backlog, asset registry, local champion responsibilities, and the intake and portfolio review that balances experimentation, reuse, risk, and measurable value."
        },
        {
          "kind": "hands-on",
          "title": "Plan the operating-model rollout",
          "description": "Lay out capability gaps, accountable owners, adoption measures, and review milestones for bringing teams onto the model and improving it over time."
        }
      ],
      "evidence": [
        "A role charter showing decision rights across business, product, engineering, data, security, and compliance",
        "A champion-network charter with local responsibilities, peer support, and escalation routes",
        "A standards backlog and reusable-asset registry for prompts, evaluations, patterns, and shared services",
        "A portfolio cadence and rollout roadmap with owners, value and risk measures, capability gaps, and review milestones"
      ]
    },
    "de": {
      "headline": "KI mit gemeinsamen Services und Champions skalieren",
      "promise": "Du entwirfst ein Betriebsmodell, das Teams mit klaren Entscheidungsrechten, gemeinsamen Standards und Bausteinen, einem Champion-Netzwerk und festen Governance-Zyklen beim Ausbau von KI unterstützt.",
      "projectScenario": {
        "title": "KI-Arbeit über mehrere Teams hinweg koordinieren",
        "description": "Mehrere Fach- und Engineering-Teams starten Piloten, wiederholen Sicherheitsprüfungen und bauen Prompts oder Evaluationen erneut. Lege fest, welche Leistungen ein Center of Excellence anbietet, wie lokale KI-Champions funktionierende Arbeitsweisen verbreiten, welche Entscheidungen bei den Produktteams bleiben und wie neue Vorhaben in einen gemeinsamen Portfoliorhythmus gelangen.",
        "guardrail": "Gemeinsame Standards und Unterstützung durch Champions verlagern die Verantwortung für Produkt- und Risikoentscheidungen nicht von den zuständigen Teams weg."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Entscheidungsrechte funktionsübergreifend klären",
          "description": "Ordne Zuständigkeiten in Produkt, Engineering, Data, Security, Compliance und Fachbereichen zu. Trenne unternehmensweite Standards von Entscheidungen der einzelnen Produktteams."
        },
        {
          "kind": "guided",
          "title": "CoE und Champion-Netzwerk gestalten",
          "description": "Definiere gemeinsame Services, Standardisierungs-Backlog, Asset-Verzeichnis, Aufgaben lokaler Champions sowie Intake- und Portfolioprüfungen für Experimente, Wiederverwendung, Risiko und messbaren Wert."
        },
        {
          "kind": "hands-on",
          "title": "Die Einführung des Betriebsmodells planen",
          "description": "Beschreibe Kompetenzlücken, Verantwortliche, Adoptionskennzahlen und Prüftermine, mit denen Teams das Modell einführen und fortlaufend verbessern."
        }
      ],
      "evidence": [
        "Ein Rollenauftrag mit Entscheidungsrechten für Fachbereich, Produkt, Engineering, Data, Security und Compliance",
        "Ein Auftrag für das Champion-Netzwerk mit lokalen Aufgaben, kollegialer Unterstützung und Eskalationswegen",
        "Ein Backlog für Standards und ein Verzeichnis wiederverwendbarer Prompts, Evaluationen, Muster und gemeinsamer Services",
        "Ein Portfoliorhythmus und eine Einführungsroadmap mit Verantwortlichen, Wert- und Risikomaßen, Kompetenzlücken und Prüfterminen"
      ]
    }
  },
  "LRN-37": {
    "en": {
      "headline": "Ground service automation in runbooks",
      "promise": "Turn a recurring service-desk pattern into source-grounded runbook assistance, with clear stop conditions, human handoffs, and measures for accuracy and knowledge freshness.",
      "projectScenario": {
        "title": "Assist with a recurring service-ticket category",
        "description": "Analyze frequent tickets with a known resolution and exceptions that require an analyst. Turn approved support material into steps an assistant can retrieve, identify missing or stale knowledge, and design when the flow answers, stops, or hands the case to a person.",
        "guardrail": "Use approved knowledge and explicit stop conditions; an uncertain generated step must not trigger an unreviewed privileged change."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Separate repeatable tickets from exceptions",
          "description": "Group tickets by intent and root cause, then examine known resolution, exception rate, missing knowledge, and risk before automating assistance."
        },
        {
          "kind": "guided",
          "title": "Rewrite support knowledge as a runbook",
          "description": "Make prerequisites, source references, decision steps, and stop conditions explicit; add confidence thresholds, human handoff, logging, and rollback to the proposed flow."
        },
        {
          "kind": "hands-on",
          "title": "Evaluate the support loop",
          "description": "Measure resolution accuracy, containment, escalation quality, rework, and source freshness, including whether the flow hands off the cases it should."
        }
      ],
      "evidence": [
        "A ticket-pattern analysis with intent, root cause, resolution, exceptions, and knowledge gaps",
        "A source-linked runbook with prerequisites, branching steps, and stop conditions",
        "A support-flow design with confidence thresholds, human handoff, logging, and rollback",
        "An evaluation plan for accuracy, containment, escalation quality, rework, and knowledge freshness"
      ]
    },
    "de": {
      "headline": "Support-Automatisierung auf Runbooks stützen",
      "promise": "Du überführst ein wiederkehrendes Service-Desk-Muster in quellenbasierte Runbook-Unterstützung mit klaren Abbruchbedingungen, menschlichen Übergaben und Kennzahlen zu Genauigkeit und Wissensaktualität.",
      "projectScenario": {
        "title": "Eine wiederkehrende Ticketkategorie unterstützen",
        "description": "Analysiere häufige Tickets mit bekannter Lösung und Ausnahmen, die eine Fachkraft übernehmen muss. Überführe freigegebenes Supportwissen in abrufbare Schritte, erkenne fehlende oder veraltete Inhalte und lege fest, wann der Assistent antwortet, stoppt oder an eine Person übergibt.",
        "guardrail": "Nutze freigegebenes Wissen und eindeutige Abbruchbedingungen. Ein unsicherer KI-Schritt darf keine ungeprüfte privilegierte Änderung auslösen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Wiederholbare Tickets von Ausnahmen trennen",
          "description": "Gruppiere Tickets nach Absicht und Ursache und prüfe bekannte Lösung, Ausnahmequote, Wissenslücken und Risiko, bevor du Support automatisiert unterstützt."
        },
        {
          "kind": "guided",
          "title": "Supportwissen als Runbook formulieren",
          "description": "Mache Voraussetzungen, Quellen, Entscheidungsschritte und Abbruchbedingungen explizit. Ergänze Konfidenzschwellen, menschliche Übergabe, Protokollierung und Rücknahme für den Ablauf."
        },
        {
          "kind": "hands-on",
          "title": "Den Supportkreislauf bewerten",
          "description": "Miss Lösungsgenauigkeit, eigenständige Lösungsquote, Eskalationsqualität, Nacharbeit und Aktualität der Quellen. Prüfe dabei auch, ob die vorgesehenen Fälle tatsächlich übergeben werden."
        }
      ],
      "evidence": [
        "Eine Ticketmusteranalyse zu Absicht, Ursache, Lösung, Ausnahmen und Wissenslücken",
        "Ein quellengebundenes Runbook mit Voraussetzungen, Verzweigungen und Abbruchbedingungen",
        "Ein Supportablauf mit Konfidenzschwellen, menschlicher Übergabe, Protokollierung und Rücknahme",
        "Ein Evaluationsplan zu Genauigkeit, eigenständiger Lösung, Eskalationsqualität, Nacharbeit und Wissensaktualität"
      ]
    }
  },
  "LRN-14": {
    "en": {
      "headline": "Spot security risks before an AI proposal hardens",
      "promise": "Give a business AI proposal an early security triage by mapping its data, identities, untrusted inputs, external services, tools, and privileged actions before detailed review begins.",
      "projectScenario": {
        "title": "Triage an AI proposal that uses business data and tools",
        "description": "Review a proposal that sends business documents to an external model and lets the assistant call connected tools. Map where data and identity cross boundaries, identify prompt-injection, leakage, over-permission, and retention paths, then prepare the issues that need security-team attention.",
        "guardrail": "Use hypothetical or sanitized details. Do not include live credentials or sensitive records, and do not test an abuse path against a real system as part of this business-team triage."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map the proposal's trust boundaries",
          "description": "Trace data sources, user and service identities, external vendors, untrusted inputs, outputs, and any privileged actions the AI workflow could initiate."
        },
        {
          "kind": "guided",
          "title": "Turn threats into triage decisions",
          "description": "Write abuse cases for prompt injection, data leakage, excessive permissions, tool chains, supply-chain exposure, and retention; identify immediate containment or safe-design needs."
        },
        {
          "kind": "hands-on",
          "title": "Prepare a security handoff",
          "description": "Rank open risks, name their owners, attach available evidence, and route questions that need architecture, security, or vendor review."
        }
      ],
      "evidence": [
        "A boundary map for data, identities, external services, inputs, outputs, and privileged actions",
        "Abuse cases for injection, leakage, excessive permissions, tool chains, supply chain, and retention",
        "A short list of immediate containment steps and safe-design requirements",
        "A triage handoff with risk owners, evidence, open questions, and escalation priority"
      ]
    },
    "de": {
      "headline": "Sicherheitsrisiken früh in KI-Vorhaben erkennen",
      "promise": "Du führst für einen geschäftlichen KI-Vorschlag eine frühe Sicherheitstriage durch und zeichnest Daten, Identitäten, nicht vertrauenswürdige Eingaben, externe Dienste, Werkzeuge und privilegierte Aktionen nach.",
      "projectScenario": {
        "title": "Einen KI-Vorschlag mit Geschäftsdaten und Werkzeugen triagieren",
        "description": "Prüfe einen Vorschlag, bei dem Geschäftsdokumente an ein externes Modell gehen und der Assistent angebundene Werkzeuge aufrufen kann. Zeichne Daten- und Identitätsgrenzen ein, finde mögliche Wege für Prompt-Injection, Datenabfluss, übermäßige Berechtigungen und zu lange Aufbewahrung und bereite die Fragen für das Security-Team auf.",
        "guardrail": "Arbeite mit hypothetischen oder anonymisierten Angaben. Verwende keine echten Zugangsdaten oder sensiblen Datensätze und teste in dieser fachlichen Triage keinen Missbrauchsweg an einem realen System."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Vertrauensgrenzen im Vorschlag erfassen",
          "description": "Verfolge Datenquellen, Benutzer- und Dienstidentitäten, externe Anbieter, nicht vertrauenswürdige Eingaben, Ausgaben und mögliche privilegierte Aktionen."
        },
        {
          "kind": "guided",
          "title": "Bedrohungen in Triage-Entscheidungen übersetzen",
          "description": "Formuliere Missbrauchsfälle zu Prompt-Injection, Datenabfluss, übermäßigen Berechtigungen, Werkzeugketten, Lieferkette und Aufbewahrung. Bestimme sofort nötige Eindämmungs- und Gestaltungsmaßnahmen."
        },
        {
          "kind": "hands-on",
          "title": "Eine Sicherheitsübergabe vorbereiten",
          "description": "Ordne offene Risiken nach Priorität, benenne Verantwortliche, füge vorhandene Belege bei und leite Fragen an Architektur, Security oder Anbieterprüfung weiter."
        }
      ],
      "evidence": [
        "Eine Grenzenskizze zu Daten, Identitäten, externen Diensten, Eingaben, Ausgaben und privilegierten Aktionen",
        "Missbrauchsfälle zu Injection, Datenabfluss, übermäßigen Berechtigungen, Werkzeugketten, Lieferkette und Aufbewahrung",
        "Eine Liste sofort nötiger Eindämmungs- und Gestaltungsmaßnahmen",
        "Eine Triage-Übergabe mit Risikoverantwortlichen, Belegen, offenen Fragen und Eskalationspriorität"
      ]
    }
  },
  "LRN-27": {
    "en": {
      "headline": "Reuse prompts without losing control",
      "promise": "Package a prompt as a governed team asset with an owner, version, approved input boundary, output contract, evaluation anchor, and a rule for retirement.",
      "projectScenario": {
        "title": "Govern a shared prompt for meeting briefs",
        "description": "Take a prompt that turns approved project notes into a concise customer-meeting brief. Specify the intended user and context, allowed inputs, required output sections, limitations, one representative input/output anchor, and how a change is reviewed before reuse.",
        "guardrail": "A prompt's approval does not approve every source document or authorize sharing its output; keep access rights and review responsibility with the content owner."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Specify the reusable pattern",
          "description": "Define prompt purpose, approved inputs, context requirements, output contract, intended audience, and known limitations so callers know what the pattern does."
        },
        {
          "kind": "guided",
          "title": "Anchor quality before sharing",
          "description": "Attach a representative input and expected result, choose quality and safety checks, and decide what must be re-evaluated after a prompt or model change."
        },
        {
          "kind": "hands-on",
          "title": "Operate the prompt lifecycle",
          "description": "Set ownership, versioning, review states, change history, access, usage feedback, and the conditions to update, restrict, replace, or retire the entry."
        }
      ],
      "evidence": [
        "A prompt card with owner, purpose, approved inputs, context, output contract, audience, and limitations",
        "A canonical input/output evaluation anchor with checks for quality and safety",
        "A version and review record that shows who can change or approve a shared prompt",
        "A retirement rule tied to a model sunset, quality regression, replacement, or no-longer-valid context"
      ]
    },
    "de": {
      "headline": "Prompts sicher wiederverwenden und pflegen",
      "promise": "Du machst einen Prompt zu einem gesteuerten Team-Baustein mit Zuständigkeit, Version, freigegebenen Eingaben, Ausgabeformat, Bewertungsbeispiel und Aussonderungsregel.",
      "projectScenario": {
        "title": "Einen gemeinsamen Prompt für Meeting-Briefings steuern",
        "description": "Nimm einen Prompt, der aus freigegebenen Projektnotizen ein kompaktes Kundenbriefing erstellt. Lege Zielgruppe, erforderlichen Kontext, erlaubte Eingaben, Ausgabeabschnitte, Grenzen und ein repräsentatives Ein-/Ausgabebeispiel fest. Beschreibe, wie Änderungen vor der Wiederverwendung geprüft werden.",
        "guardrail": "Die Freigabe eines Prompts gibt nicht jedes Quelldokument oder Ergebnis zur Weitergabe frei. Zugriffsrechte und Prüfverantwortung bleiben beim Inhaltsverantwortlichen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Das wiederverwendbare Muster spezifizieren",
          "description": "Lege Zweck, freigegebene Eingaben, Kontextbedarf, Ausgabeformat, Zielgruppe und bekannte Grenzen fest, damit klar ist, wofür der Prompt geeignet ist."
        },
        {
          "kind": "guided",
          "title": "Qualität vor der Weitergabe verankern",
          "description": "Hinterlege eine repräsentative Eingabe mit erwartetem Ergebnis, wähle Qualitäts- und Sicherheitsprüfungen und bestimme, was nach Prompt- oder Modelländerungen neu bewertet werden muss."
        },
        {
          "kind": "hands-on",
          "title": "Den Prompt-Lebenszyklus steuern",
          "description": "Regle Zuständigkeit, Versionierung, Prüfstatus, Änderungshistorie, Zugriff, Nutzungsfeedback und Bedingungen für Anpassung, Einschränkung, Ersatz oder Aussonderung."
        }
      ],
      "evidence": [
        "Eine Prompt-Karte mit Zuständigkeit, Zweck, freigegebenen Eingaben, Kontext, Ausgabeformat, Zielgruppe und Grenzen",
        "Ein kanonisches Ein-/Ausgabebeispiel mit Qualitäts- und Sicherheitsprüfungen",
        "Ein Versions- und Prüfprotokoll mit den Befugnissen zur Änderung und Freigabe",
        "Eine Aussonderungsregel für Modellablösung, Qualitätsrückgang, Ersatz oder ungültigen Kontext"
      ]
    }
  },
  "LRN-26": {
    "en": {
      "headline": "Make agent delivery reliable across sessions",
      "promise": "Shape a task-scoped harness that preserves repository instructions, state, and runtime evidence across sessions and blocks readiness when scope, verification, or independent review is incomplete.",
      "projectScenario": {
        "title": "Coordinate one coding agent change from issue to handoff",
        "description": "Set up an AI-assisted workflow for a bounded repository task. Make the allowed files, acceptance checks, durable state, runtime feedback, verification result, independent review, and next action visible in a report; choose a bounded loop or explicit graph to coordinate the work.",
        "guardrail": "The harness can report readiness for a human decision; it must not treat an agent's claim as proof or turn that report into an automatic merge or deployment."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Separate instructions from control surfaces",
          "description": "Distinguish repository guidance, durable memory, task scope, runtime feedback, executable verification, independent review, and handoff so the prompt is not the only safety mechanism."
        },
        {
          "kind": "guided",
          "title": "Trace a change through the workbench",
          "description": "Follow one candidate change from repository setup and session continuity through scope checks, captured command feedback, fail-closed verification, and review."
        },
        {
          "kind": "hands-on",
          "title": "Compose the loop or graph",
          "description": "Produce a report for a complete and an incomplete candidate, show which missing evidence blocks readiness, and write a handoff another person or session can act on."
        }
      ],
      "evidence": [
        "A task contract naming allowed paths, required checks, and forbidden scope changes",
        "A cross-session state record with repository context and the next task action",
        "A candidate report that includes runtime receipts, verification, independent review, and a fail-closed result",
        "A human-readable handoff with owner, unresolved risk, and next action"
      ]
    },
    "de": {
      "headline": "Agentenarbeit über Sitzungen hinweg absichern",
      "promise": "Du richtest einen auf die Aufgabe begrenzten Arbeitsrahmen ein, der Repository-Anweisungen, Status und Laufzeitbelege über Sitzungen erhält und bei fehlendem Umfang, Verifikation oder unabhängiger Prüfung keine Freigabereife meldet.",
      "projectScenario": {
        "title": "Eine Agentenänderung vom Issue bis zur Übergabe koordinieren",
        "description": "Richte einen KI-gestützten Ablauf für eine klar begrenzte Repository-Aufgabe ein. Mache erlaubte Dateien, Akzeptanzprüfungen, dauerhaften Status, Laufzeitfeedback, Verifikation, unabhängige Prüfung und nächsten Schritt in einem Bericht sichtbar. Wähle dafür eine begrenzte Schleife oder einen expliziten Graphen.",
        "guardrail": "Der Harness kann eine menschliche Entscheidung vorbereiten. Eine Behauptung des Agenten gilt nicht als Beleg, und der Bericht darf weder automatisches Mergen noch Bereitstellung auslösen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Anweisungen von Kontrollflächen trennen",
          "description": "Unterscheide Repository-Hinweise, dauerhaften Status, Aufgabenumfang, Laufzeitfeedback, ausführbare Verifikation, unabhängige Prüfung und Übergabe, damit der Prompt nicht die einzige Schutzmaßnahme bleibt."
        },
        {
          "kind": "guided",
          "title": "Eine Änderung durch die Workbench verfolgen",
          "description": "Verfolge einen Änderungskandidaten von Repository-Einrichtung und Sitzungskontinuität über Umfangsprüfungen und Laufzeitprotokolle bis zu sicher abbrechender Verifikation und Review."
        },
        {
          "kind": "hands-on",
          "title": "Schleife oder Graph zusammensetzen",
          "description": "Erstelle einen Bericht für einen vollständigen und einen unvollständigen Kandidaten. Zeige, welche fehlenden Belege die Freigabereife verhindern, und formuliere eine umsetzbare Übergabe."
        }
      ],
      "evidence": [
        "Ein Aufgabenvertrag mit erlaubten Pfaden, erforderlichen Prüfungen und ausgeschlossenen Änderungen",
        "Ein sitzungsübergreifender Status mit Repository-Kontext und nächstem Arbeitsschritt",
        "Ein Änderungskandidaten-Bericht mit Laufzeitprotokollen, Verifikation, unabhängiger Prüfung und sicherem Abbruch",
        "Eine menschlich lesbare Übergabe mit Zuständigkeit, offenem Risiko und nächster Aktion"
      ]
    }
  },
  "LRN-45": {
    "en": {
      "headline": "Prepare customer conversations with evidence",
      "promise": "Move from account signals to a defensible use-case pitch and a repeatable weekly sales workflow, keeping customer claims sourced, reviewed, and tied to a next action.",
      "projectScenario": {
        "title": "Prepare and follow up on a customer discovery meeting",
        "description": "Research an account, its industry, competitors, and technology signals; map a customer challenge to a portfolio-aligned solution hypothesis; draft a meeting brief or pitch; then record the reviewed claims, open questions, and follow-up action for the next account touchpoint.",
        "guardrail": "Keep evidence attached to customer claims, remove unsupported or confidential material before external sharing, and have a human owner review the final wording and follow-up."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Build a sourced account view",
          "description": "Use market and account intelligence without treating AI-generated research as fact; distinguish sourced signals, customer statements, and hypotheses that still need validation."
        },
        {
          "kind": "guided",
          "title": "Translate customer pain into value",
          "description": "Map a customer challenge to a portfolio-fit use case and assess evidence, business logic, value, risk, stakeholders, and the assumptions behind the value story."
        },
        {
          "kind": "hands-on",
          "title": "Produce the pitch and next-week plan",
          "description": "Create a concise pitch, one-pager, or meeting brief; review claims and confidentiality; capture questions, owners, and the follow-up step in a reusable weekly account routine."
        }
      ],
      "evidence": [
        "An account-intelligence brief with sources for industry, competitor, and technology signals",
        "A challenge-to-use-case map with portfolio fit, value hypothesis, evidence, risk, and stakeholder notes",
        "A reviewed audience-specific pitch, one-pager, or customer-meeting brief with unsupported claims removed",
        "A weekly account-preparation and follow-up record with open questions, owner, and next action"
      ]
    },
    "de": {
      "headline": "Kundengespräche mit belastbaren Belegen vorbereiten",
      "promise": "Du führst von Kontosignalen zu einem begründeten Use-Case-Pitch und einer wiederholbaren Wochenroutine im Vertrieb – mit belegten, geprüften Kundenaussagen und einem klaren nächsten Schritt.",
      "projectScenario": {
        "title": "Ein Kundengespräch vorbereiten und nachfassen",
        "description": "Recherchiere ein Unternehmen, seine Branche, Wettbewerber und Technologiesignale. Ordne eine Kundenherausforderung einer passenden Lösungshypothese aus dem Portfolio zu und entwirf Briefing oder Pitch. Halte anschließend geprüfte Aussagen, offene Fragen und die Follow-up-Aktion für den nächsten Kundenkontakt fest.",
        "guardrail": "Ordne Kundenaussagen Belege zu, entferne unbelegte oder vertrauliche Inhalte vor externer Weitergabe und lass Formulierung sowie Nachfassaktion von einer verantwortlichen Person prüfen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Ein quellenbasiertes Kundenbild erstellen",
          "description": "Nutze Markt- und Kontoinformationen, ohne KI-Recherche als Fakt zu behandeln. Trenne belegte Signale, Kundenaussagen und Hypothesen, die noch geprüft werden müssen."
        },
        {
          "kind": "guided",
          "title": "Kundenbedarf in Geschäftswert übersetzen",
          "description": "Ordne eine Kundenherausforderung einem passenden Use Case aus dem Portfolio zu und prüfe Belege, Geschäftslogik, Wert, Risiko, Stakeholder und Annahmen hinter dem Nutzenversprechen."
        },
        {
          "kind": "hands-on",
          "title": "Pitch und Wochenplan erstellen",
          "description": "Erstelle einen kompakten Pitch, One-Pager oder Gesprächstermin-Brief. Prüfe Aussagen und Vertraulichkeit und halte Fragen, Zuständigkeiten und Nachfassaktion in einer wiederverwendbaren Wochenroutine fest."
        }
      ],
      "evidence": [
        "Ein Account-Briefing mit Quellen zu Branche, Wettbewerb und Technologiesignalen",
        "Eine Zuordnung von Kundenbedarf zu Use Case mit Portfolio-Passung, Nutzenhypothese, Belegen, Risiken und Stakeholdern",
        "Ein geprüfter, zielgruppengerechter Pitch, One-Pager oder Gesprächstermin-Brief ohne unbelegte Aussagen",
        "Ein Wochenprotokoll für Vorbereitung und Nachfassen mit offenen Fragen, Zuständigkeit und nächstem Schritt"
      ]
    }
  },
  "LRN-46": {
    "en": {
      "headline": "Build production-minded AI in Python",
      "promise": "Build a small Python AI application and justify its model, retrieval, agent, MCP, evaluation, and production choices against the task and its operating constraints.",
      "projectScenario": {
        "title": "Build a bounded knowledge assistant",
        "description": "Create a Python application that answers from a defined document set and uses an MCP-connected tool or data source for one bounded need. Compare reflection, tool-use, planning, stateful-graph, and multi-agent patterns, adopting only the control flow that fits the task; then prepare the system for evaluation and operation.",
        "guardrail": "Use approved sample data and validated tool schemas, keep secrets out of prompts and logs, and put human approval around consequential external actions."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Choose the right AI building blocks",
          "description": "Connect ML, embeddings, LLM behavior, and application architecture to implementation decisions about model integration, retrieval, and bounded agent control."
        },
        {
          "kind": "guided",
          "title": "Build the application and MCP boundary",
          "description": "Wire a Python LLM flow with explicit state and tools; compare reflection, planning, graph, and multi-agent patterns by their trade-offs, then expose the chosen data or tool through a validated MCP interface."
        },
        {
          "kind": "hands-on",
          "title": "Evaluate and prepare for production",
          "description": "Define quality checks, traces, security controls, cost and performance observations, and a deployment approach such as staged rollout before treating the prototype as operational."
        }
      ],
      "evidence": [
        "A working or clearly specified Python LLM application with model, retrieval, and state boundaries",
        "A bounded agent or workflow design with the pattern choice and its trade-offs explained",
        "An MCP client or server interface with validated schemas for the connected tool or data",
        "An evaluation and operations plan covering quality, observability, security, cost, and deployment controls"
      ]
    },
    "de": {
      "headline": "KI-Anwendungen in Python betriebsgerecht entwickeln",
      "promise": "Du entwickelst eine kleine KI-Anwendung in Python und begründest Modell-, Retrieval-, Agenten-, MCP-, Evaluations- und Betriebsentscheidungen passend zur Aufgabe und ihren Randbedingungen.",
      "projectScenario": {
        "title": "Einen begrenzten Wissensassistenten bauen",
        "description": "Entwickle eine Python-Anwendung, die aus einem abgegrenzten Dokumentensatz antwortet und für einen klar umrissenen Bedarf ein MCP-angebundenes Werkzeug oder eine Datenquelle nutzt. Vergleiche Reflexion, Werkzeugnutzung, Planung, zustandsbehaftete Graphen und Multi-Agenten-Muster und wähle nur den für die Aufgabe passenden Kontrollfluss. Bereite das System anschließend auf Evaluation und Betrieb vor.",
        "guardrail": "Verwende freigegebene Beispieldaten und validierte Werkzeugschemata, halte Geheimnisse aus Prompts und Protokollen heraus und sichere folgenreiche externe Aktionen durch menschliche Freigabe ab."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die passenden KI-Bausteine wählen",
          "description": "Verknüpfe ML, Embeddings, LLM-Verhalten und Anwendungsarchitektur mit Entscheidungen zu Modellintegration, Retrieval und begrenzter Agentensteuerung."
        },
        {
          "kind": "guided",
          "title": "Anwendung und MCP-Grenze bauen",
          "description": "Verbinde einen Python-LLM-Ablauf mit explizitem Zustand und Werkzeugen. Vergleiche Reflexions-, Planungs-, Graph- und Multi-Agenten-Muster nach ihren Zielkonflikten und binde die passende Datenquelle oder das passende Werkzeug über eine validierte MCP-Schnittstelle an."
        },
        {
          "kind": "hands-on",
          "title": "Evaluieren und für den Betrieb vorbereiten",
          "description": "Lege Qualitätsprüfungen, Traces, Sicherheitskontrollen, Kosten- und Leistungsbeobachtung sowie ein Bereitstellungsvorgehen wie einen stufenweisen Roll-out fest, bevor der Prototyp als betriebsbereit gilt."
        }
      ],
      "evidence": [
        "Eine funktionierende oder klar spezifizierte Python-LLM-Anwendung mit Modell-, Retrieval- und Zustandsgrenzen",
        "Ein begrenzter Agenten- oder Workflow-Entwurf mit begründeter Musterwahl und benannten Zielkonflikten",
        "Eine MCP-Client- oder Server-Schnittstelle mit validierten Schemata für Werkzeug oder Datenquelle",
        "Ein Evaluations- und Betriebskonzept zu Qualität, Beobachtbarkeit, Sicherheit, Kosten und Bereitstellungskontrollen"
      ]
    }
  },
  "LRN-44": {
    "en": {
      "headline": "Turn champion work into reusable team capability",
      "promise": "Turn a team's recurring AI question into audience-matched learning, a community artifact, and a bounded pilot with feasibility, quality, and transfer checks.",
      "projectScenario": {
        "title": "Plan a brown bag that leads to reusable practice",
        "description": "A team keeps asking how to apply a new AI pattern. Choose the audience level, plan a brown-bag or mentoring session around one target behavior, and select a useful take-away such as a decision aid, reference implementation, or evaluation fixture. Use the community to capture questions and shape a small pilot that others can repeat.",
        "guardrail": "A champion can teach and coordinate a bounded pilot, but does not approve tools or data access; do not scale beyond the pilot until quality and transfer evidence support that decision."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Match the audience to the artifact",
          "description": "Triage colleagues as awareness, practitioner, or builder audiences and pair their learning need with a decision aid, reference implementation, skill, or evaluation artifact."
        },
        {
          "kind": "guided",
          "title": "Run a session that produces follow-through",
          "description": "Set a target behavior and practical example, facilitate a brown bag or community session, and capture questions, reusable patterns, evidence, and unresolved risks in a shared backlog."
        },
        {
          "kind": "hands-on",
          "title": "Pilot, evaluate, and transfer the learning",
          "description": "Plan feasibility, quality, and transfer gates for a volunteer pilot; define sponsor, guardrails, measures, and a stop condition, then package what another colleague needs to repeat it."
        }
      ],
      "evidence": [
        "A session plan with audience level, target behavior, practical example, and follow-up resource",
        "A take-away artifact matched to the audience, such as a decision aid, reference implementation, or evaluation fixture",
        "A community contribution record for questions, patterns, evidence, unresolved risks, and the next facilitator or owner",
        "A bounded pilot brief with sponsor, volunteers, guardrails, feasibility/quality/transfer checks, measures, and stop condition"
      ]
    },
    "de": {
      "headline": "KI-Wissen als Champion nachhaltig weitergeben",
      "promise": "Du überführst eine wiederkehrende KI-Frage aus dem Team in zielgruppengerechtes Lernen, einen Community-Beitrag und einen begrenzten Pilot mit Prüfungen zu Machbarkeit, Qualität und Wissenstransfer.",
      "projectScenario": {
        "title": "Einen Brown Bag mit nachhaltigem Praxistransfer planen",
        "description": "Ein Team fragt immer wieder, wie sich ein neues KI-Muster einsetzen lässt. Bestimme die Zielgruppe, plane einen Brown Bag oder ein Mentoring zu einem klaren Zielverhalten und wähle ein passendes Ergebnis wie Entscheidungshilfe, Referenzimplementierung oder Evaluationsbeispiel. Halte Fragen in der Community fest und entwickle daraus einen kleinen Pilot, den andere wiederholen können.",
        "guardrail": "Als Champion kannst du Wissen vermitteln und einen begrenzten Pilot koordinieren, aber keine Werkzeuge oder Datenzugriffe freigeben. Skaliere den Ansatz erst, wenn Belege zu Qualität und Wissenstransfer diese Entscheidung tragen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Zielgruppe und Lernartefakt zusammenbringen",
          "description": "Ordne Kolleginnen und Kollegen den Stufen Awareness, Anwender oder Builder zu und passe Entscheidungshilfe, Referenzimplementierung, Skill oder Evaluation an den Lernbedarf an."
        },
        {
          "kind": "guided",
          "title": "Eine Lerneinheit mit Anschluss gestalten",
          "description": "Lege Zielverhalten und Praxisbeispiel fest, moderiere Brown Bag oder Community-Termin und erfasse Fragen, wiederverwendbare Muster, Belege und offene Risiken in einem gemeinsamen Backlog."
        },
        {
          "kind": "hands-on",
          "title": "Pilotieren, prüfen und Wissen weitergeben",
          "description": "Plane für einen Pilot mit Freiwilligen Prüfungen zu Machbarkeit, Qualität und Transfer. Benenne Sponsor, Leitplanken, Messgrößen und Abbruchbedingung und bündele, was eine andere Person zur Wiederholung braucht."
        }
      ],
      "evidence": [
        "Ein Sitzungsplan mit Zielgruppe, Zielverhalten, Praxisbeispiel und Anschlussmaterial",
        "Ein zur Zielgruppe passendes Lernartefakt, etwa eine Entscheidungshilfe, Referenzimplementierung oder Evaluationsvorlage",
        "Ein Community-Protokoll mit Fragen, Mustern, Belegen, offenen Risiken und nächster Moderation oder Zuständigkeit",
        "Ein Pilotbrief mit Sponsor, Freiwilligen, Leitplanken, Prüfungen zu Machbarkeit/Qualität/Transfer, Messgrößen und Abbruchbedingung"
      ]
    }
  }
};
