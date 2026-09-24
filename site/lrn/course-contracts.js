// Course-specific learning contracts for the LRN course detail page.
// Keep English and German copy together so the language toggle selects one complete contract.
window.LrnCourseContracts = {
  "PRIMER-01": {
    "en": {
      "promise": "By the end, you can explain how tokens, context, sampling, retrieval, and tools shape an LLM response, and choose what to inspect when an answer is weak.",
      "projectScenario": {
        "title": "Diagnose a weak LLM answer",
        "description": "Work through a short interactive exchange where the answer misses the task. Check whether the cause is the prompt, available context, retrieved material, sampling, or a missing tool, then choose a fitting next step."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "See what shapes a response",
          "description": "Build an intuitive picture of tokens and context windows, then connect prompting, retrieval, tools, and sampling to the answer an LLM produces."
        },
        {
          "kind": "guided",
          "title": "Trace the failure",
          "description": "Use the primer's interactive cases to locate where useful information enters or is lost and to distinguish a context problem from a tool-boundary problem."
        },
        {
          "kind": "hands-on",
          "title": "Choose the next move",
          "description": "Complete the mini-games, select prompting, retrieval, or tool use for a small task, and use the quiz result to identify a topic to revisit."
        }
      ],
      "evidence": [
        "A concise explanation of how tokenization and the context window affect a response",
        "A diagnosis that distinguishes prompt, context, retrieval, sampling, and tool causes",
        "A justified choice between prompting, retrieval, and tool use for a concrete task",
        "Completed interactive scenarios and a quiz result linked to a next learning gap"
      ]
    },
    "de": {
      "promise": "Am Ende kannst du erklären, wie Tokens, Kontext, Sampling, Retrieval und Tools eine LLM-Antwort beeinflussen, und bei einer schwachen Antwort gezielt nach der Ursache suchen.",
      "projectScenario": {
        "title": "Eine schwache LLM-Antwort diagnostizieren",
        "description": "In einer kurzen interaktiven Unterhaltung verfehlt die Antwort die Aufgabe. Prüfe, ob Prompt, verfügbarer Kontext, abgerufene Inhalte, Sampling oder eine fehlende Tool-Funktion die Ursache sind, und wähle einen passenden nächsten Schritt."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Einflussfaktoren einer Antwort verstehen",
          "description": "Entwickle ein anschauliches Verständnis von Tokens und Kontextfenstern und ordne Prompting, Retrieval, Tools und Sampling in die Entstehung einer LLM-Antwort ein."
        },
        {
          "kind": "guided",
          "title": "Den Fehler zurückverfolgen",
          "description": "Nutze die interaktiven Fälle, um nachzuvollziehen, wo relevante Informationen hinzukommen oder verloren gehen und woran sich ein Kontextproblem von fehlendem Tool-Zugriff unterscheidet."
        },
        {
          "kind": "hands-on",
          "title": "Den nächsten Schritt wählen",
          "description": "Bearbeite die Mini-Games, entscheide dich für Prompting, Retrieval oder Tool-Nutzung bei einer kleinen Aufgabe und leite aus dem Quiz-Ergebnis ein nächstes Lernthema ab."
        }
      ],
      "evidence": [
        "Eine knappe Erklärung, wie Tokenisierung und Kontextfenster eine Antwort beeinflussen",
        "Eine Diagnose, die Prompt-, Kontext-, Retrieval-, Sampling- und Tool-Ursachen unterscheidet",
        "Eine begründete Wahl zwischen Prompting, Retrieval und Tool-Nutzung für eine konkrete Aufgabe",
        "Abgeschlossene interaktive Szenarien und ein Quiz-Ergebnis mit nächster Lernlücke"
      ]
    }
  },
  "LRN-01": {
    "en": {
      "promise": "You will be able to distinguish AI, machine learning, and generative AI in practical terms, judge where they fit, and review outputs against evidence, limits, and responsible-use basics.",
      "projectScenario": {
        "title": "Assess a proposed document-summary use case",
        "description": "Consider a team proposal to use generative AI to summarize a set of work documents. Decide what AI can realistically contribute, what quality or bias checks are needed, and what responsible-use conditions apply.",
        "guardrail": "Use a fictional or approved example; do not place restricted work documents into an unapproved AI tool."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Name the kind of AI",
          "description": "Clarify the practical differences among AI, machine learning, and generative models, and recognize what a generated answer can and cannot establish."
        },
        {
          "kind": "guided",
          "title": "Weigh fit and limitations",
          "description": "Compare everyday business tasks with realistic AI capabilities; examine output evidence, quality, bias, and uncertainty before recommending a use."
        },
        {
          "kind": "hands-on",
          "title": "Make a responsible-use decision",
          "description": "Apply the course's baseline to the document-summary scenario and state where a person must check or own the result."
        }
      ],
      "evidence": [
        "A practical distinction among AI, machine learning, and generative AI for the scenario",
        "A use-case assessment that names expected value and a relevant limitation",
        "A reviewed AI output with evidence, quality, bias, or uncertainty concerns identified",
        "A short responsible-use decision that identifies needed human review"
      ]
    },
    "de": {
      "promise": "Du kannst KI, Machine Learning und Generative AI praktisch voneinander abgrenzen, ihre Eignung einschätzen und Ergebnisse anhand von Belegen, Grenzen und Grundsätzen für verantwortungsvolle Nutzung prüfen.",
      "projectScenario": {
        "title": "Einen Vorschlag zur Dokumentzusammenfassung bewerten",
        "description": "Prüfe den Vorschlag eines Teams, Arbeitsdokumente mit Generative AI zusammenzufassen. Entscheide, welchen Beitrag KI realistisch leisten kann, welche Qualitäts- oder Bias-Prüfungen nötig sind und welche Bedingungen für eine verantwortungsvolle Nutzung gelten.",
        "guardrail": "Verwende ein fiktives oder freigegebenes Beispiel; gib keine vertraulichen Arbeitsdokumente in ein nicht freigegebenes KI-Tool ein."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "KI-Begriffe einordnen",
          "description": "Kläre die praktischen Unterschiede zwischen KI, Machine Learning und generativen Modellen und erkenne, was eine generierte Antwort belegen kann und was nicht."
        },
        {
          "kind": "guided",
          "title": "Eignung und Grenzen abwägen",
          "description": "Vergleiche typische Geschäftsaufgaben mit den realistischen Fähigkeiten von KI und prüfe Belege, Qualität, Bias und Unsicherheit, bevor du einen Einsatz empfiehlst."
        },
        {
          "kind": "hands-on",
          "title": "Verantwortungsvoll entscheiden",
          "description": "Wende die Grundregeln des Kurses auf das Zusammenfassungsszenario an und benenne, wo eine Person das Ergebnis prüfen oder verantworten muss."
        }
      ],
      "evidence": [
        "Eine praktische Abgrenzung von KI, Machine Learning und Generative AI im Szenario",
        "Eine Use-Case-Bewertung mit erwartetem Nutzen und einer relevanten Grenze",
        "Ein geprüftes KI-Ergebnis mit benannten Fragen zu Belegen, Qualität, Bias oder Unsicherheit",
        "Eine kurze Entscheidung zur verantwortungsvollen Nutzung mit erforderlicher menschlicher Prüfung"
      ]
    }
  },
  "LRN-02": {
    "en": {
      "promise": "You will be able to choose an approved LHIND AI tool for a task, preserve sources and constraints in a repeatable workflow, and reuse context or skills safely when they add value.",
      "projectScenario": {
        "title": "Turn source notes into a reviewed work artifact",
        "description": "Start with a transcript or source note, choose an appropriate LHIND tool, retain the source and task context in files, and produce a checked artifact that can be reused through a skill or documented workflow.",
        "guardrail": "Use only tools approved for the data classification; exclude credentials and restricted content, and verify claims against the source."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Choose the right tool and level of structure",
          "description": "Map internal retrieval, M365 work, general drafting, coding, and file-based agent workflows to their intended uses; learn when chat prompting is enough."
        },
        {
          "kind": "guided",
          "title": "Build a source-grounded workflow",
          "description": "Structure a prompt and persistent context around the task, source material, constraints, conventions, and output format, then turn source notes into a reviewed artifact."
        },
        {
          "kind": "hands-on",
          "title": "Reuse the workflow safely",
          "description": "Apply or evaluate a reusable skill, check its result against the source, and decide whether the task warrants context engineering or an agent harness."
        }
      ],
      "evidence": [
        "A tool choice tied to task type, data classification, and intended source access",
        "A prompt or context file that preserves task constraints, sources, conventions, and output format",
        "A source-checked artifact derived from a transcript or note, with unsupported claims removed or flagged",
        "A reusable skill assessment that records its fit and any data or credential boundary"
      ]
    },
    "de": {
      "promise": "Du kannst für eine Aufgabe ein freigegebenes LHIND-KI-Tool auswählen, Quellen und Vorgaben in einem wiederholbaren Ablauf erhalten und Kontext oder Skills sicher wiederverwenden, wenn es sinnvoll ist.",
      "projectScenario": {
        "title": "Aus Quellenotizen ein geprüftes Arbeitsergebnis erstellen",
        "description": "Beginne mit einem Transkript oder einer Quellenotiz, wähle ein passendes LHIND-Tool, halte Quelle und Aufgabenkontext in Dateien fest und erstelle ein geprüftes Ergebnis, das sich über einen Skill oder dokumentierten Ablauf wiederverwenden lässt.",
        "guardrail": "Verwende nur für die Datenklasse freigegebene Tools; schließe Zugangsdaten und gesperrte Inhalte aus und gleiche Aussagen mit der Quelle ab."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Tool und passende Struktur auswählen",
          "description": "Ordne interne Suche, M365-Aufgaben, allgemeine Textarbeit, Coding und dateibasierte Agenten-Workflows ihrem Zweck zu und erkenne, wann ein einfacher Chat-Prompt genügt."
        },
        {
          "kind": "guided",
          "title": "Einen quellenbasierten Ablauf aufbauen",
          "description": "Strukturiere Prompt und persistenten Kontext anhand von Aufgabe, Quellen, Vorgaben, Konventionen und Ausgabeformat und erstelle aus Notizen ein geprüftes Arbeitsergebnis."
        },
        {
          "kind": "hands-on",
          "title": "Den Ablauf sicher wiederverwenden",
          "description": "Wende einen wiederverwendbaren Skill an oder bewerte ihn, prüfe das Ergebnis anhand der Quelle und entscheide, ob Context Engineering oder ein Agent Harness nötig ist."
        }
      ],
      "evidence": [
        "Eine Tool-Auswahl passend zu Aufgabentyp, Datenklassifizierung und gewünschtem Quellenzugriff",
        "Ein Prompt oder eine Kontextdatei, die Vorgaben, Quellen, Konventionen und Ausgabeformat erhält",
        "Ein anhand der Quelle geprüftes Ergebnis aus einem Transkript oder einer Notiz, mit entfernten oder markierten unbelegten Aussagen",
        "Eine Bewertung eines wiederverwendbaren Skills mit Passung und relevanten Daten- oder Zugangsdaten-Grenzen"
      ]
    }
  },
  "LRN-03": {
    "en": {
      "promise": "You will be able to assess an AI use against GDPR, security, fairness, and policy guardrails, then document the controls and decide when human review or escalation is needed.",
      "projectScenario": {
        "title": "Review an AI workflow that uses personal data",
        "description": "Use the GDPR decision tree and responsible-AI risk cases to examine a proposed workflow that processes personal data. Identify the applicable concerns, required checks, and conditions for proceeding or escalating.",
        "guardrail": "Treat the exercise as a risk assessment, not legal approval; escalate unresolved legal or policy questions to the responsible owners."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Recognize the control areas",
          "description": "Relate GDPR and security requirements to purpose, data provenance, fairness, accountability, and the guardrails that limit AI behavior."
        },
        {
          "kind": "guided",
          "title": "Work through the decision and risk cases",
          "description": "Follow the GDPR decision tree, identify bias or fairness concerns, and determine where human review or escalation is required before acting."
        },
        {
          "kind": "hands-on",
          "title": "Record a reviewable decision",
          "description": "For the scenario, document the controls, evidence, review owner, and unresolved risks so another person can understand the decision."
        }
      ],
      "evidence": [
        "A use-case review linking purpose and data to relevant GDPR, security, and policy guardrails",
        "A risk note identifying a fairness, bias, or accountability concern and its impact",
        "A decision on whether human review or escalation is required, with the reason",
        "A control record naming evidence and remaining questions for later review"
      ]
    },
    "de": {
      "promise": "Du kannst einen KI-Einsatz anhand von DSGVO, IT-Sicherheit, Fairness und geltenden Leitplanken bewerten, Kontrollen dokumentieren und entscheiden, wann menschliche Prüfung oder Eskalation nötig ist.",
      "projectScenario": {
        "title": "Einen KI-Ablauf mit personenbezogenen Daten prüfen",
        "description": "Untersuche mit dem DSGVO-Entscheidungsbaum und den Risikofällen für verantwortungsvolle KI einen vorgeschlagenen Ablauf, der personenbezogene Daten verarbeitet. Benenne relevante Risiken, nötige Prüfungen und Bedingungen für Fortsetzung oder Eskalation.",
        "guardrail": "Behandle die Übung als Risikoprüfung, nicht als rechtliche Freigabe; kläre offene Rechts- oder Richtlinienfragen mit den zuständigen Stellen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die relevanten Kontrollbereiche erkennen",
          "description": "Ordne DSGVO und Sicherheitsanforderungen den Zwecken, der Datenherkunft, Fairness, Verantwortlichkeit und den Grenzen des KI-Verhaltens zu."
        },
        {
          "kind": "guided",
          "title": "Entscheidungsbaum und Risikofälle bearbeiten",
          "description": "Gehe den DSGVO-Entscheidungsbaum durch, erkenne Bias- und Fairnessfragen und bestimme, wann vor einer Handlung menschliche Prüfung oder Eskalation nötig ist."
        },
        {
          "kind": "hands-on",
          "title": "Eine nachvollziehbare Entscheidung festhalten",
          "description": "Dokumentiere für das Szenario Kontrollen, Belege, Prüfverantwortung und offene Risiken so, dass eine andere Person die Entscheidung nachvollziehen kann."
        }
      ],
      "evidence": [
        "Eine Use-Case-Prüfung, die Zweck und Daten mit DSGVO-, Sicherheits- und Richtlinienanforderungen verknüpft",
        "Ein Risikohinweis zu Fairness, Bias oder Verantwortlichkeit mit benannter Auswirkung",
        "Eine begründete Entscheidung über menschliche Prüfung oder Eskalation",
        "Ein Kontrollnachweis mit Belegen und offenen Fragen für eine spätere Prüfung"
      ]
    }
  },
  "LRN-22": {
    "en": {
      "promise": "You will be able to design prompts with explicit context and success criteria, improve them through testable iterations, specify structured outputs, and review the answer for unsupported claims.",
      "projectScenario": {
        "title": "Improve a prompt for a structured work brief",
        "description": "Start with an underspecified request for a role-specific brief. Add context, constraints, and success criteria, define a structured output contract, and compare iterations against the same task."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Make prompt structure explicit",
          "description": "Study prompt patterns that clarify role, context, task, constraints, and success criteria, including when examples and output contracts help."
        },
        {
          "kind": "guided",
          "title": "Iterate against a fixed task",
          "description": "Revise a weak prompt one change at a time, inspect the resulting answers, and define a schema or format that a downstream process could validate."
        },
        {
          "kind": "hands-on",
          "title": "Run a prompt clinic",
          "description": "Apply a chosen pattern to a role-based case, review the output for accuracy and gaps, and retain the version that meets the stated criteria."
        }
      ],
      "evidence": [
        "A prompt that states role, context, constraints, and measurable success criteria",
        "A before-and-after comparison showing what changed and how the answer responded",
        "A structured output contract with fields or schema rules that can be checked",
        "An output critique identifying inaccuracies, omissions, or unsupported claims"
      ]
    },
    "de": {
      "promise": "Du kannst Prompts mit klarem Kontext und Erfolgskriterien gestalten, sie in überprüfbaren Schritten verbessern, strukturierte Ausgaben festlegen und Antworten auf unbelegte Aussagen prüfen.",
      "projectScenario": {
        "title": "Einen Prompt für ein strukturiertes Arbeitsbriefing verbessern",
        "description": "Ausgangspunkt ist eine ungenaue Anfrage für ein rollenbezogenes Briefing. Ergänze Kontext, Vorgaben und Erfolgskriterien, definiere ein strukturiertes Ausgabeformat und vergleiche die Iterationen anhand derselben Aufgabe."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Prompt-Struktur klar festlegen",
          "description": "Lerne Prompt-Muster kennen, die Rolle, Kontext, Aufgabe, Vorgaben und Erfolgskriterien klären, und erkenne, wann Beispiele oder Ausgabeformate helfen."
        },
        {
          "kind": "guided",
          "title": "An einer festen Aufgabe iterieren",
          "description": "Überarbeite einen schwachen Prompt schrittweise, prüfe die Antworten und definiere ein Schema oder Format, das ein nachgelagerter Prozess validieren könnte."
        },
        {
          "kind": "hands-on",
          "title": "Eine Prompt-Clinic durchführen",
          "description": "Wende ein passendes Muster auf einen rollenbezogenen Fall an, prüfe das Ergebnis auf Richtigkeit und Lücken und behalte die Version, die die Kriterien erfüllt."
        }
      ],
      "evidence": [
        "Ein Prompt mit Rolle, Kontext, Vorgaben und messbaren Erfolgskriterien",
        "Ein Vorher-Nachher-Vergleich mit den Änderungen und ihrer Wirkung auf die Antwort",
        "Ein strukturiertes Ausgabeformat mit prüfbaren Feldern oder Schemaregeln",
        "Eine Kritik der Ausgabe mit benannten Fehlern, Auslassungen oder unbelegten Aussagen"
      ]
    }
  },
  "LRN-23": {
    "en": {
      "promise": "You will be able to turn process pain into a prioritized AI use-case backlog by weighing value, feasibility, risk, and data readiness, then define measurable pilot gates.",
      "projectScenario": {
        "title": "Prioritize candidates from a process pain point",
        "description": "Use a real or example process problem to generate candidate use cases. Compare a quick win with a more strategic option using the use-case canvas and value/risk matrix, then define what a pilot must prove before scaling."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Separate problems from solutions",
          "description": "Learn to discover opportunities from user needs and process pain, and distinguish an AI opportunity from an attractive but unsupported technology idea."
        },
        {
          "kind": "guided",
          "title": "Compare value, risk, and feasibility",
          "description": "Score candidates for business value, feasibility, risk, and data readiness, then make the trade-offs behind a defensible backlog visible."
        },
        {
          "kind": "hands-on",
          "title": "Define a pilot-to-scale decision",
          "description": "Select a candidate, name baseline and success measures, and set decision gates that determine whether the pilot should stop, change, or scale."
        }
      ],
      "evidence": [
        "A use-case canvas connecting a process pain point to a user need and candidate intervention",
        "A value/risk comparison that includes feasibility and data readiness",
        "A prioritized backlog distinguishing a quick win from a strategic bet",
        "A pilot brief with measures and explicit scale or stop decision gates"
      ]
    },
    "de": {
      "promise": "Du kannst aus Prozessproblemen ein priorisiertes KI-Use-Case-Backlog entwickeln, Nutzen, Umsetzbarkeit, Risiko und Datenreife abwägen und messbare Pilot-Entscheidungspunkte festlegen.",
      "projectScenario": {
        "title": "Kandidaten aus einem Prozessproblem priorisieren",
        "description": "Leite aus einem realen oder beispielhaften Prozessproblem mögliche Use Cases ab. Vergleiche mit Use-Case-Canvas und Nutzen-Risiko-Matrix einen schnellen Erfolg mit einer strategischen Option und lege fest, was ein Pilot vor einer Skalierung belegen muss."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Probleme von Lösungen trennen",
          "description": "Lerne, Chancen aus Nutzerbedarf und Prozessproblemen abzuleiten und einen tragfähigen KI-Use-Case von einer bloß attraktiven Technologieidee zu unterscheiden."
        },
        {
          "kind": "guided",
          "title": "Nutzen, Risiko und Machbarkeit vergleichen",
          "description": "Bewerte Kandidaten nach Geschäftsnutzen, Umsetzbarkeit, Risiko und Datenreife und mache die Abwägungen für ein belastbares Backlog sichtbar."
        },
        {
          "kind": "hands-on",
          "title": "Die Entscheidung vom Pilot zur Skalierung vorbereiten",
          "description": "Wähle einen Kandidaten, benenne Ausgangswert und Erfolgsmaß und lege Entscheidungspunkte fest, an denen der Pilot gestoppt, angepasst oder skaliert wird."
        }
      ],
      "evidence": [
        "Ein Use-Case-Canvas, das Prozessproblem, Nutzerbedarf und möglichen Ansatz verbindet",
        "Ein Nutzen-Risiko-Vergleich mit Machbarkeit und Datenreife",
        "Ein priorisiertes Backlog mit einem schnellen Erfolg und einer strategischen Option",
        "Ein Pilotbrief mit Messgrößen sowie klaren Skalierungs- oder Abbruchentscheidungen"
      ]
    }
  },
  "LRN-06": {
    "en": {
      "promise": "Complete the course with a repeatable workflow for turning one scoped project ticket into a tested, review-ready change without delegating engineering accountability.",
      "projectScenario": {
        "title": "LCAG-style project transfer: safe booking synchronization",
        "description": "Start with a sanitized ticket from the learner's current project. The built-in fallback asks for idempotent retry handling in a booking synchronization service while preserving the public API and existing error semantics.",
        "guardrail": "Use anonymized code, tickets, logs, and identifiers only; never send secrets, personal data, or restricted project material to an unapproved assistant."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Understand the control model",
          "description": "Learn the Copilot capability ladder, context sources, trust boundaries, and why task ambiguity determines blast radius."
        },
        {
          "kind": "guided",
          "title": "Trace a worked engineering case",
          "description": "Turn the fallback ticket into a bounded brief, compare Copilot modes, and inspect a proposed change against explicit acceptance criteria."
        },
        {
          "kind": "hands-on",
          "title": "Transfer it to project work",
          "description": "Repeat the workflow with an anonymized real ticket, review the diff, run the relevant checks, and prepare a human-owned pull-request handoff."
        }
      ],
      "evidence": [
        "A bounded task brief naming the goal, allowed files, forbidden changes, and acceptance checks",
        "A repository-context packet with the relevant instructions, files, and sanitized ticket details",
        "An annotated diff review covering correctness, security, privacy, maintainability, and scope",
        "Captured test and verification output, including one deliberate failure or boundary case",
        "A pull-request handoff that names the human owner, residual risks, and merge decision"
      ]
    },
    "de": {
      "promise": "Schließe den Kurs mit einem wiederholbaren Ablauf ab, der aus einem klar begrenzten Projektticket eine getestete, reviewfähige Änderung macht und die technische Verantwortung beim Menschen belässt.",
      "projectScenario": {
        "title": "Projekttransfer nach LCAG-Muster: sichere Buchungssynchronisierung",
        "description": "Beginne mit einem bereinigten Ticket aus deinem Projekt. Der integrierte Beispielfall ergänzt idempotente Wiederholungen in einem Dienst zur Buchungssynchronisierung, ohne die öffentliche API oder bestehende Fehlersemantik zu verändern.",
        "guardrail": "Verwende nur anonymisierten Code, Tickets, Logs und Kennungen. Gib keine Geheimnisse, personenbezogenen Daten oder eingeschränktes Projektmaterial an einen nicht freigegebenen Assistenten weiter."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Das Kontrollmodell verstehen",
          "description": "Lerne die Copilot-Modi, Kontextquellen und Vertrauensgrenzen kennen und erkenne, wie unklare Aufgaben den Umfang möglicher Änderungen vergrößern."
        },
        {
          "kind": "guided",
          "title": "Einen Entwicklungsfall nachvollziehen",
          "description": "Formuliere aus dem Beispielfall einen begrenzten Auftrag, vergleiche Copilot-Modi und prüfe eine vorgeschlagene Änderung gegen konkrete Akzeptanzkriterien."
        },
        {
          "kind": "hands-on",
          "title": "Auf die Projektarbeit übertragen",
          "description": "Wiederhole den Ablauf mit einem anonymisierten echten Ticket, prüfe den Diff, führe relevante Tests aus und bereite die Übergabe für einen von Menschen verantworteten Pull Request vor."
        }
      ],
      "evidence": [
        "Ein begrenzter Arbeitsauftrag mit Ziel, erlaubten Dateien, ausgeschlossenen Änderungen und Akzeptanzprüfungen",
        "Ein Kontextpaket mit Repository-Anweisungen, relevanten Dateien und bereinigten Ticketdaten",
        "Ein kommentierter Diff-Review zu Korrektheit, Sicherheit, Datenschutz, Wartbarkeit und Umfang",
        "Dokumentierte Test- und Prüfergebnisse einschließlich eines Fehler- oder Grenzfalls",
        "Eine Pull-Request-Übergabe mit verantwortlicher Person, Restrisiken und Merge-Entscheidung"
      ]
    }
  },
  "LRN-25": {
    "en": {
      "promise": "You will be able to choose and explain an AI system architecture for a concrete use case, including retrieval, routing, tools, agents, governance, and production observability, with a reason to keep it simple.",
      "projectScenario": {
        "title": "Shape an internal knowledge assistant",
        "description": "Design a system that answers questions from a maintained internal knowledge collection. Compare a retrieval-backed application with workflow or agent patterns, choose integration and routing boundaries, and specify production controls and trade-offs.",
        "guardrail": "Treat data access, security, and compliance choices as design constraints requiring confirmation by the responsible owners."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map the architecture layers",
          "description": "Relate data and semantic layers to models, applications, agents, governance, and observability; distinguish classical ML, LLM, RAG, workflow, and agent shapes."
        },
        {
          "kind": "guided",
          "title": "Choose patterns for the use case",
          "description": "Work through retrieval, model routing, tools, memory, orchestration, and MCP integration options, comparing their fit and operational costs for the knowledge assistant."
        },
        {
          "kind": "hands-on",
          "title": "Document production trade-offs",
          "description": "Create an architecture proposal with versioning, evaluation, tracing, rollout, and governance controls, and justify where a simpler workflow is sufficient."
        }
      ],
      "evidence": [
        "A system diagram or layer map identifying data, model, application, integration, and control boundaries",
        "A comparison of RAG, deterministic workflow, and agent options tied to the stated use case",
        "A justified choice of retrieval, routing, tool, and orchestration patterns",
        "A trade-off record covering security, governance, latency, cost, scale, and operations"
      ]
    },
    "de": {
      "promise": "Du kannst für einen konkreten Anwendungsfall eine KI-Systemarchitektur auswählen und begründen, einschließlich Retrieval, Routing, Tools, Agenten, Governance und Produktionsbeobachtung, und erklären, warum sie einfach genug bleibt.",
      "projectScenario": {
        "title": "Einen internen Wissensassistenten entwerfen",
        "description": "Entwirf ein System, das Fragen anhand einer gepflegten internen Wissenssammlung beantwortet. Vergleiche eine Retrieval-Anwendung mit Workflow- oder Agentenmustern, wähle Integrations- und Routing-Grenzen und beschreibe Produktionskontrollen und Zielkonflikte.",
        "guardrail": "Behandle Datenzugriff, Sicherheit und Compliance als Architekturvorgaben, die von den zuständigen Stellen bestätigt werden müssen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Architekturschichten einordnen",
          "description": "Ordne Daten- und semantische Schichten Modellen, Anwendungen, Agenten, Governance und Observability zu und unterscheide klassische ML-, LLM-, RAG-, Workflow- und Agentenarchitekturen."
        },
        {
          "kind": "guided",
          "title": "Muster für den Anwendungsfall auswählen",
          "description": "Prüfe Optionen für Retrieval, Model-Routing, Tools, Memory, Orchestrierung und MCP-Integration und vergleiche deren Eignung und Betriebsaufwand für den Wissensassistenten."
        },
        {
          "kind": "hands-on",
          "title": "Zielkonflikte für den Produktivbetrieb dokumentieren",
          "description": "Erstelle einen Architekturvorschlag mit Versionierung, Evaluation, Tracing, Rollout und Governance-Kontrollen und begründe, wo ein einfacher Workflow ausreicht."
        }
      ],
      "evidence": [
        "Ein Systemdiagramm oder Schichtenplan mit Daten-, Modell-, Anwendungs-, Integrations- und Kontrollgrenzen",
        "Ein Vergleich von RAG, deterministischem Workflow und Agentenmustern für den beschriebenen Anwendungsfall",
        "Eine begründete Wahl von Retrieval-, Routing-, Tool- und Orchestrierungsmustern",
        "Eine Abwägung zu Sicherheit, Governance, Latenz, Kosten, Skalierung und Betrieb"
      ]
    }
  },
  "LRN-24": {
    "en": {
      "promise": "You will be able to design a bounded engineering agent loop with explicit tools, state, and stopping conditions, then verify its behavior and decide when a deterministic workflow is safer.",
      "projectScenario": {
        "title": "Constrain an agent around a small code task",
        "description": "Define an agent that receives a bounded engineering task, can inspect selected files and run specified checks, and must stop with a reviewable proposal. Specify the tool boundary, state, verification, and human decision point.",
        "guardrail": "Keep changes in a sandbox and require a person to review code and authorize any consequential action."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Understand the agent loop",
          "description": "Connect planning, tool use, state, reflection, and stopping conditions; compare agent strategies and identify where autonomy can add risk without value."
        },
        {
          "kind": "guided",
          "title": "Design orchestration and boundaries",
          "description": "Trace how function calling, RAG, MCP, and orchestration patterns constrain an agent's access and keep a coding task reproducible."
        },
        {
          "kind": "hands-on",
          "title": "Verify a bounded agent workflow",
          "description": "Specify or implement the loop, exercise it with fixtures and verification gates, and decide whether the agent should stop, ask for review, or hand off."
        }
      ],
      "evidence": [
        "An agent loop contract naming task state, allowed tools, limits, and stop conditions",
        "A tool or orchestration boundary with validated inputs and an explicit human control point",
        "Test cases or fixtures covering expected behavior and a failure or boundary case",
        "A reasoned decision comparing the agent workflow with a deterministic alternative"
      ]
    },
    "de": {
      "promise": "Du kannst einen begrenzten Engineering-Agenten mit klaren Tools, Zuständen und Abbruchbedingungen entwerfen, sein Verhalten überprüfen und entscheiden, wann ein deterministischer Ablauf sicherer ist.",
      "projectScenario": {
        "title": "Einen Agenten für eine kleine Code-Aufgabe begrenzen",
        "description": "Definiere einen Agenten für eine klar eingegrenzte Engineering-Aufgabe. Er darf ausgewählte Dateien prüfen und festgelegte Tests ausführen und muss mit einem prüfbaren Vorschlag stoppen. Lege Tool-Grenzen, Zustand, Verifikation und menschlichen Entscheidungspunkt fest.",
        "guardrail": "Führe Änderungen in einer Sandbox aus und verlange eine menschliche Prüfung des Codes sowie die Freigabe folgenreicher Aktionen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Agentenschleife verstehen",
          "description": "Ordne Planung, Tool-Nutzung, Zustand, Reflexion und Abbruchbedingungen ein, vergleiche Agentenstrategien und erkenne Autonomie ohne ausreichenden Nutzen als zusätzliches Risiko."
        },
        {
          "kind": "guided",
          "title": "Orchestrierung und Grenzen entwerfen",
          "description": "Verfolge, wie Function Calling, RAG, MCP und Orchestrierung den Zugriff eines Agenten begrenzen und eine Coding-Aufgabe reproduzierbar halten."
        },
        {
          "kind": "hands-on",
          "title": "Einen begrenzten Agentenablauf verifizieren",
          "description": "Spezifiziere oder implementiere die Schleife, prüfe sie mit Fixtures und Verifikationsgates und entscheide, ob der Agent stoppt, eine Prüfung anfordert oder übergibt."
        }
      ],
      "evidence": [
        "Ein Vertrag für die Agentenschleife mit Aufgabenstatus, erlaubten Tools, Grenzen und Abbruchbedingungen",
        "Eine Tool- oder Orchestrierungsgrenze mit validierten Eingaben und einem klaren menschlichen Kontrollpunkt",
        "Testfälle oder Fixtures für erwartetes Verhalten sowie einen Fehler- oder Grenzfall",
        "Eine begründete Entscheidung zwischen Agentenablauf und deterministischer Alternative"
      ]
    }
  },
  "LRN-04": {
    "en": {
      "promise": "You will be able to take a proposed AI use through policy intake, risk triage, owner identification, and a documented decision with explicit approval or escalation conditions.",
      "projectScenario": {
        "title": "Prepare an AI use case for an approval decision",
        "description": "Assess a proposed AI workflow by its purpose, data sensitivity, legal basis, and internal policy. Identify the business, security, privacy, or compliance owners needed and record the decision conditions and review date.",
        "guardrail": "Do not route an unclear or non-compliant use around an approval gate; escalate it to the responsible owner."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Structure the policy intake",
          "description": "Learn which facts about purpose, data, and intended use are needed to classify an AI proposal and identify relevant internal controls."
        },
        {
          "kind": "guided",
          "title": "Triage risks and owners",
          "description": "Use a risk register to surface data, security, privacy, and compliance questions, then identify who must review the proposal before a pilot."
        },
        {
          "kind": "hands-on",
          "title": "Write the compliance decision record",
          "description": "Capture the evidence, approval status, conditions, open questions, owner, and review date in a record that supports a later audit."
        }
      ],
      "evidence": [
        "A completed intake classifying purpose, data sensitivity, legal basis, and applicable policy",
        "A risk register with named owners for unresolved security, privacy, or compliance questions",
        "A decision record with evidence, conditions, approval or escalation status, and review date",
        "A clear stop or escalation recommendation where approval requirements are not met"
      ]
    },
    "de": {
      "promise": "Du kannst einen vorgeschlagenen KI-Einsatz durch Richtlinienaufnahme, Risikoprüfung und Klärung der Zuständigkeiten führen und eine Entscheidung mit klaren Freigabe- oder Eskalationsbedingungen dokumentieren.",
      "projectScenario": {
        "title": "Einen KI-Use-Case für eine Freigabeentscheidung vorbereiten",
        "description": "Bewerte einen vorgeschlagenen KI-Ablauf nach Zweck, Sensibilität der Daten, Rechtsgrundlage und internen Richtlinien. Ermittle, welche Verantwortlichen aus Business, Security, Datenschutz oder Compliance gebraucht werden, und halte Entscheidungsbedingungen und Prüfdatum fest.",
        "guardrail": "Umgehe keine Freigabe, wenn ein Einsatz unklar oder nicht regelkonform ist; eskaliere ihn an die zuständige Stelle."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Richtlinienaufnahme strukturieren",
          "description": "Lerne, welche Angaben zu Zweck, Daten und geplanter Nutzung nötig sind, um einen KI-Vorschlag einzuordnen und relevante interne Kontrollen zu erkennen."
        },
        {
          "kind": "guided",
          "title": "Risiken und Zuständigkeiten klären",
          "description": "Mache mit einem Risikoregister Fragen zu Daten, Sicherheit, Datenschutz und Compliance sichtbar und bestimme, wer den Vorschlag vor einem Pilot prüfen muss."
        },
        {
          "kind": "hands-on",
          "title": "Den Compliance-Entscheid dokumentieren",
          "description": "Halte Belege, Freigabestatus, Bedingungen, offene Fragen, Zuständigkeit und Prüfdatum so fest, dass der Entscheid später nachvollziehbar ist."
        }
      ],
      "evidence": [
        "Eine ausgefüllte Aufnahme mit Zweck, Datenempfindlichkeit, Rechtsgrundlage und geltender Richtlinie",
        "Ein Risikoregister mit Zuständigkeiten für offene Sicherheits-, Datenschutz- oder Compliance-Fragen",
        "Ein Entscheidungsnachweis mit Belegen, Bedingungen, Freigabe- oder Eskalationsstatus und Prüfdatum",
        "Eine klare Empfehlung zum Stoppen oder Eskalieren, falls Freigabeanforderungen nicht erfüllt sind"
      ]
    }
  },
  "LRN-19": {
    "en": {
      "promise": "You will be able to turn LLM feature requirements and failure risks into a compact evaluation set, compare results with explicit thresholds, and make a defensible release-gate decision.",
      "projectScenario": {
        "title": "Set a quality gate for an LLM feature",
        "description": "Evaluate a feature that answers questions from supplied material. Build representative, boundary, and adversarial fixtures, compare the current or proposed behavior against regression evidence, and define when release is blocked.",
        "guardrail": "Treat evaluation scores as evidence for review; they do not replace the human release decision."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Translate risk into observable quality",
          "description": "Connect requirements and likely failure modes to testable evaluation criteria, including the difference between a plausible answer and a supported one."
        },
        {
          "kind": "guided",
          "title": "Build a compact evaluation set",
          "description": "Create representative, boundary, and adversarial cases, use AI-assisted test generation critically, and organize fixtures so results can be repeated."
        },
        {
          "kind": "hands-on",
          "title": "Apply the release gate",
          "description": "Compare results with explicit quality thresholds and regression evidence, then record whether the feature may progress, needs changes, or must be blocked."
        }
      ],
      "evidence": [
        "A set of evaluation cases linked to requirements and named failure risks",
        "Fixtures covering representative, boundary, and adversarial inputs with expected review criteria",
        "A results comparison against quality thresholds and prior regression evidence",
        "A release-gate record with a human decision and the reason to proceed, revise, or block"
      ]
    },
    "de": {
      "promise": "Du kannst Anforderungen und Fehlerrisiken eines LLM-Features in ein kompaktes Evaluationsset überführen, Ergebnisse mit klaren Schwellenwerten vergleichen und eine begründete Release-Entscheidung treffen.",
      "projectScenario": {
        "title": "Ein Qualitätsgate für ein LLM-Feature festlegen",
        "description": "Bewerte ein Feature, das Fragen zu bereitgestellten Inhalten beantwortet. Erstelle repräsentative, grenzwertige und adversariale Fixtures, vergleiche aktuelles oder vorgeschlagenes Verhalten mit Regressionsergebnissen und lege fest, wann ein Release blockiert wird.",
        "guardrail": "Behandle Evaluationswerte als Prüfbelege; sie ersetzen nicht die menschliche Release-Entscheidung."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Risiken in prüfbare Qualität übersetzen",
          "description": "Verknüpfe Anforderungen und wahrscheinliche Fehler mit testbaren Evaluationskriterien und unterscheide eine plausibel klingende von einer belegten Antwort."
        },
        {
          "kind": "guided",
          "title": "Ein kompaktes Evaluationsset aufbauen",
          "description": "Erstelle repräsentative, grenzwertige und adversariale Fälle, nutze KI-generierte Testideen kritisch und strukturiere Fixtures für wiederholbare Ergebnisse."
        },
        {
          "kind": "hands-on",
          "title": "Das Release-Gate anwenden",
          "description": "Vergleiche Ergebnisse mit Qualitätsschwellen und Regressionsevidenz und dokumentiere, ob das Feature fortfahren darf, überarbeitet werden muss oder blockiert wird."
        }
      ],
      "evidence": [
        "Ein Evaluationsset, das Testfälle mit Anforderungen und benannten Fehlerrisiken verknüpft",
        "Fixtures für repräsentative, grenzwertige und adversariale Eingaben mit Prüfkriterien",
        "Ein Ergebnisvergleich anhand von Qualitätsschwellen und bisherigen Regressionsergebnissen",
        "Ein Release-Entscheid mit menschlicher Freigabe und Begründung für Fortsetzung, Überarbeitung oder Blockade"
      ]
    }
  },
  "LRN-20": {
    "en": {
      "promise": "You will be able to understand a legacy component before changing it, split modernization into behavior-preserving slices, and review AI proposals with tests, rollback points, and residual risks.",
      "projectScenario": {
        "title": "Plan a safe modernization slice",
        "description": "Take one legacy component with identifiable responsibilities and dependencies. Map its current behavior and tests, propose a small refactoring slice, and prepare the evidence needed to review and roll it back if necessary.",
        "guardrail": "Preserve observable behavior unless a change is explicitly in scope; do not treat generated code as verified."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Understand the legacy boundary",
          "description": "Learn to map component responsibilities, dependencies, tests, and operational risks before asking AI to analyze or change the code."
        },
        {
          "kind": "guided",
          "title": "Shape bounded refactoring slices",
          "description": "Turn a modernization goal into small ordered changes with preserved behavior, verification points, and rollback options; challenge proposals for hidden coupling or scope drift."
        },
        {
          "kind": "hands-on",
          "title": "Prepare a reviewable change",
          "description": "Build a focused modernization proposal or change with tests, migration notes, a rollback point, and explicit residual risks for reviewer assessment."
        }
      ],
      "evidence": [
        "A component map of responsibilities, dependencies, existing tests, and operational risks",
        "A prioritized modernization backlog of bounded slices with preserved-behavior criteria",
        "A review of an AI proposal for hidden coupling, scope drift, or weakened guarantees",
        "A change handoff with test evidence, migration or rollback notes, and residual risks"
      ]
    },
    "de": {
      "promise": "Du kannst eine Legacy-Komponente vor Änderungen verstehen, die Modernisierung in verhaltenswahrende Schritte zerlegen und KI-Vorschläge anhand von Tests, Rücksetzpunkten und Restrisiken prüfen.",
      "projectScenario": {
        "title": "Einen sicheren Modernisierungsschritt planen",
        "description": "Wähle eine Legacy-Komponente mit erkennbaren Aufgaben und Abhängigkeiten. Erfasse aktuelles Verhalten und vorhandene Tests, schlage einen kleinen Refactoring-Schritt vor und bereite die Belege für Prüfung und nötigenfalls Rücknahme vor.",
        "guardrail": "Erhalte beobachtbares Verhalten, solange eine Änderung nicht ausdrücklich zum Umfang gehört; behandle generierten Code nicht als verifiziert."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Grenzen der Legacy-Komponente verstehen",
          "description": "Lerne, Aufgaben, Abhängigkeiten, Tests und Betriebsrisiken einer Komponente zu erfassen, bevor KI den Code analysiert oder ändert."
        },
        {
          "kind": "guided",
          "title": "Begrenzte Refactoring-Schritte planen",
          "description": "Zerlege ein Modernisierungsziel in kleine, geordnete Änderungen mit erhaltenem Verhalten, Prüfpunkten und Rücksetzoptionen und hinterfrage versteckte Kopplung oder eine Ausweitung des Umfangs."
        },
        {
          "kind": "hands-on",
          "title": "Eine prüfbare Änderung vorbereiten",
          "description": "Erstelle einen fokussierten Modernisierungsvorschlag oder eine Änderung mit Tests, Migrationshinweisen, Rücksetzpunkt und benannten Restrisiken für die Prüfung."
        }
      ],
      "evidence": [
        "Eine Komponentenübersicht zu Aufgaben, Abhängigkeiten, vorhandenen Tests und Betriebsrisiken",
        "Ein priorisiertes Modernisierungs-Backlog mit begrenzten Schritten und Kriterien zum Verhaltenserhalt",
        "Eine Prüfung eines KI-Vorschlags auf versteckte Kopplung, Umfangsausweitung oder geschwächte Garantien",
        "Eine Änderungsübergabe mit Testbelegen, Migrations- oder Rücksetznotizen und Restrisiken"
      ]
    }
  },
  "LRN-11": {
    "en": {
      "promise": "You will be able to turn verified project evidence into architecture, operations, compliance, or handover documentation while separating facts from judgment and assigning review and update ownership.",
      "projectScenario": {
        "title": "Draft a source-grounded handover document",
        "description": "Use a small set of verified project artifacts to draft an architecture or operations handover. Keep facts linked to sources, mark assumptions and open questions, and identify who reviews and maintains the document.",
        "guardrail": "Use approved, sanitized project evidence and remove secrets or personal data before sharing it with an AI tool."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Ground documentation in evidence",
          "description": "Learn how context and source references support accurate architecture, operations, compliance, and handover documents without turning guesses into facts."
        },
        {
          "kind": "guided",
          "title": "Draft and review an artifact",
          "description": "Use verified inputs to draft a focused document, then label sourced facts, engineering judgments, assumptions, and unresolved questions using the review rubric."
        },
        {
          "kind": "hands-on",
          "title": "Prepare a maintainable handoff",
          "description": "Complete a reusable document pack with source links, named reviewers, ownership, and triggers for future updates."
        }
      ],
      "evidence": [
        "A draft architecture, operations, compliance, or handover document grounded in supplied evidence",
        "Source links or references attached to factual statements, with assumptions and open questions marked",
        "A review for accuracy, sensitive information, ownership, and maintenance triggers",
        "A handoff record naming the reviewer and the person responsible for updates"
      ]
    },
    "de": {
      "promise": "Du kannst verifizierte Projektbelege in Architektur-, Betriebs-, Compliance- oder Übergabedokumentation überführen, Fakten von Einschätzungen trennen und Prüfung sowie Aktualisierung klar zuordnen.",
      "projectScenario": {
        "title": "Ein quellenbasiertes Übergabedokument erstellen",
        "description": "Nutze eine kleine Auswahl verifizierter Projektartefakte für einen Architektur- oder Betriebshandover. Verknüpfe Fakten mit Quellen, kennzeichne Annahmen und offene Fragen und benenne Prüfung und Pflege des Dokuments.",
        "guardrail": "Verwende freigegebene, bereinigte Projektbelege und entferne Geheimnisse oder personenbezogene Daten, bevor du sie einem KI-Tool zur Verfügung stellst."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Dokumentation auf Belege stützen",
          "description": "Lerne, wie Kontext und Quellenverweise genaue Architektur-, Betriebs-, Compliance- und Übergabedokumente unterstützen, ohne Vermutungen als Fakten darzustellen."
        },
        {
          "kind": "guided",
          "title": "Ein Dokument entwerfen und prüfen",
          "description": "Erstelle aus verifizierten Informationen einen fokussierten Entwurf und kennzeichne mit der Prüfrubrik belegte Fakten, technische Einschätzungen, Annahmen und offene Fragen."
        },
        {
          "kind": "hands-on",
          "title": "Eine pflegbare Übergabe vorbereiten",
          "description": "Vervollständige ein wiederverwendbares Dokumentpaket mit Quellenlinks, benannten Prüfenden, Zuständigkeit und Auslösern für spätere Aktualisierungen."
        }
      ],
      "evidence": [
        "Ein auf bereitgestellte Belege gestützter Architektur-, Betriebs-, Compliance- oder Übergabeentwurf",
        "Quellenangaben an Fakten sowie gekennzeichnete Annahmen und offene Fragen",
        "Eine Prüfung auf Richtigkeit, sensible Informationen, Zuständigkeit und Aktualisierungsbedarf",
        "Eine Übergabenotiz mit prüfender und für Aktualisierungen verantwortlicher Person"
      ]
    }
  },
  "LRN-08": {
    "en": {
      "promise": "You will be able to compare software or AI options using resource and operating measures, design a controlled efficiency experiment, and explain the trade-off with user value and reliability.",
      "projectScenario": {
        "title": "Compare efficiency options for an AI workload",
        "description": "Use an example workload to compare a baseline with one focused change, such as routing suitable requests to a smaller model or reducing repeated work through caching. Track latency, utilization, cost, and emissions proxies alongside quality and reliability.",
        "guardrail": "Label emissions proxies as estimates; do not present them as direct measurements without supporting data."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Find the resource drivers",
          "description": "Trace how compute, storage, network, and model choices affect a workload, and connect sustainable design to measurable operating behavior."
        },
        {
          "kind": "guided",
          "title": "Compare architecture and runtime choices",
          "description": "Review right-sizing, model routing, caching, and runtime metrics; examine their effects on latency, utilization, cost, quality, and footprint proxies."
        },
        {
          "kind": "hands-on",
          "title": "Design a controlled efficiency experiment",
          "description": "Set a baseline, change one factor, define an observable target, and document the trade-off among environmental impact, user value, reliability, and effort."
        }
      ],
      "evidence": [
        "A workload map naming relevant compute, storage, network, or model resource drivers",
        "A comparison of baseline and alternative using latency, utilization, cost, and emissions proxies",
        "An experiment plan with one controlled change, a baseline, and an observable target",
        "A decision note explaining quality, reliability, user-value, and engineering-effort trade-offs"
      ]
    },
    "de": {
      "promise": "Du kannst Software- oder KI-Optionen anhand von Ressourcen- und Betriebskennzahlen vergleichen, ein kontrolliertes Effizienzexperiment entwerfen und Zielkonflikte mit Nutzerwert und Zuverlässigkeit erklären.",
      "projectScenario": {
        "title": "Effizienzoptionen für eine KI-Last vergleichen",
        "description": "Vergleiche für eine Beispiel-Workload den Ausgangszustand mit einer gezielten Änderung, etwa geeignete Anfragen an ein kleineres Modell zu routen oder Wiederholungen durch Caching zu verringern. Beobachte Latenz, Auslastung, Kosten und Emissions-Proxies gemeinsam mit Qualität und Zuverlässigkeit.",
        "guardrail": "Kennzeichne Emissions-Proxies als Schätzwerte; stelle sie ohne entsprechende Daten nicht als direkte Messungen dar."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Ressourcentreiber erkennen",
          "description": "Verfolge, wie Compute-, Speicher-, Netzwerk- und Modellentscheidungen eine Workload beeinflussen, und verbinde nachhaltiges Design mit messbarem Betriebsverhalten."
        },
        {
          "kind": "guided",
          "title": "Architektur- und Laufzeitoptionen vergleichen",
          "description": "Prüfe bedarfsgerechte Dimensionierung, Model-Routing, Caching und Laufzeitmetriken und betrachte deren Wirkung auf Latenz, Auslastung, Kosten, Qualität und Footprint-Proxies."
        },
        {
          "kind": "hands-on",
          "title": "Ein kontrolliertes Effizienzexperiment planen",
          "description": "Lege einen Ausgangswert fest, ändere einen Faktor, definiere ein beobachtbares Ziel und dokumentiere den Zielkonflikt zwischen Umweltwirkung, Nutzerwert, Zuverlässigkeit und Aufwand."
        }
      ],
      "evidence": [
        "Eine Workload-Übersicht mit relevanten Compute-, Speicher-, Netzwerk- oder Modelltreibern",
        "Ein Vergleich von Ausgangszustand und Alternative anhand von Latenz, Auslastung, Kosten und Emissions-Proxies",
        "Ein Experimentplan mit einer kontrollierten Änderung, Ausgangswert und beobachtbarem Ziel",
        "Eine Entscheidungsnotiz zu Qualität, Zuverlässigkeit, Nutzerwert und Engineering-Aufwand"
      ]
    }
  },
  "LRN-17": {
    "en": {
      "promise": "You will be able to prepare de-identified research for AI assistance, synthesize patterns while preserving source evidence and minority signals, and turn findings into hypotheses that can be validated.",
      "projectScenario": {
        "title": "Synthesize interview evidence into a testable hypothesis",
        "description": "Work from de-identified interview excerpts. Cluster recurring and contradictory observations with source references, note what the material cannot establish, and propose a product hypothesis with a validation step.",
        "guardrail": "Remove identifying details and do not infer sensitive traits or participant intent beyond what the evidence supports."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set boundaries for research assistance",
          "description": "Define what an AI assistant may summarize and what it must not infer, and learn why sampling, context, and traceability matter in user research."
        },
        {
          "kind": "guided",
          "title": "Synthesize without flattening the evidence",
          "description": "Cluster observations while retaining source references, contradictory accounts, and minority signals; separate what participants said from an interpretation."
        },
        {
          "kind": "hands-on",
          "title": "Prepare a validatable product decision",
          "description": "Turn a grounded pattern into a falsifiable hypothesis, name a way to validate it, and review the synthesis for bias or invented evidence."
        }
      ],
      "evidence": [
        "A de-identification and inference boundary for the research material",
        "A synthesis with source references that preserves contradictory and minority observations",
        "A falsifiable product hypothesis separated from direct participant evidence",
        "A validation step and review notes on sampling bias, missing context, or unsupported claims"
      ]
    },
    "de": {
      "promise": "Du kannst bereinigte Forschungsdaten für KI-Unterstützung vorbereiten, Muster mit Quellenbelegen und Minderheitensignalen zusammenfassen und daraus überprüfbare Hypothesen ableiten.",
      "projectScenario": {
        "title": "Interviewbelege zu einer überprüfbaren Hypothese verdichten",
        "description": "Arbeite mit anonymisierten Interviewauszügen. Gruppiere wiederkehrende und widersprüchliche Beobachtungen mit Quellenverweisen, halte fest, was das Material nicht belegt, und formuliere eine Produkthypothese mit einem Validierungsschritt.",
        "guardrail": "Entferne identifizierende Angaben und leite keine sensiblen Merkmale oder Absichten der Teilnehmenden ab, die nicht durch Belege gestützt sind."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Grenzen für KI-Unterstützung festlegen",
          "description": "Bestimme, was ein KI-Assistent zusammenfassen darf und was er nicht ableiten soll, und lerne die Bedeutung von Stichprobe, Kontext und Nachvollziehbarkeit in der User Research kennen."
        },
        {
          "kind": "guided",
          "title": "Zusammenfassen, ohne Belege einzuebnen",
          "description": "Gruppiere Beobachtungen mit Quellenverweisen und erhalte widersprüchliche Aussagen sowie Minderheitensignale; trenne Aussagen der Teilnehmenden von deren Interpretation."
        },
        {
          "kind": "hands-on",
          "title": "Eine überprüfbare Produktentscheidung vorbereiten",
          "description": "Leite aus einem belegten Muster eine falsifizierbare Hypothese ab, benenne einen Validierungsweg und prüfe die Synthese auf Bias oder erfundene Belege."
        }
      ],
      "evidence": [
        "Eine Festlegung zur Anonymisierung und zu zulässigen Schlussfolgerungen aus dem Forschungsmaterial",
        "Eine Synthese mit Quellenverweisen, die widersprüchliche Aussagen und Minderheitensignale erhält",
        "Eine falsifizierbare Produkthypothese, klar getrennt von direkten Aussagen der Teilnehmenden",
        "Ein Validierungsschritt und Prüfhinweise zu Stichprobenverzerrung, fehlendem Kontext oder unbelegten Aussagen"
      ]
    }
  },
  "LRN-07": {
    "en": {
      "promise": "You will be able to map a process before proposing technology, distinguish deterministic automation from assistive AI and autonomy, and define a prioritized pilot with measurable stop and review conditions.",
      "projectScenario": {
        "title": "Find a bounded opportunity in a recurring process",
        "description": "Map a process with actors, decisions, handoffs, exceptions, data, and pain points. Identify where deterministic automation, assistive AI, or autonomous behavior fits, then turn one candidate into a measured pilot brief.",
        "guardrail": "Keep the pilot reversible and name the human owner for decisions that affect the process or its users."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Observe the process and its friction",
          "description": "Learn a structured opportunity scan that captures actors, handoffs, decisions, exceptions, data, and the pain experienced in the current process."
        },
        {
          "kind": "guided",
          "title": "Match the intervention and rank candidates",
          "description": "For each opportunity, distinguish deterministic automation, assistive AI, and autonomy, then compare value, feasibility, data readiness, operational risk, and reversibility."
        },
        {
          "kind": "hands-on",
          "title": "Write a bounded pilot brief",
          "description": "Select a candidate and state its owner, baseline, success measure, stop condition, and review gate so the pilot can be evaluated before any scale-up."
        }
      ],
      "evidence": [
        "A process map with actors, decisions, handoffs, exceptions, data, and current pain points",
        "A rationale for using deterministic automation, assistive AI, or autonomy at each candidate step",
        "A ranked opportunity list covering value, feasibility, data readiness, risk, and reversibility",
        "A pilot hypothesis with owner, baseline, success measure, stop condition, and review gate"
      ]
    },
    "de": {
      "promise": "Du kannst einen Prozess vor einem Technologievorschlag abbilden, deterministische Automatisierung von unterstützender KI und Autonomie unterscheiden und einen priorisierten Pilot mit messbaren Abbruch- und Prüfkriterien definieren.",
      "projectScenario": {
        "title": "Eine begrenzte Chance in einem wiederkehrenden Prozess finden",
        "description": "Erfasse Akteure, Entscheidungen, Übergaben, Ausnahmen, Daten und Probleme eines Prozesses. Bestimme, wo deterministische Automatisierung, unterstützende KI oder autonomes Verhalten passt, und überführe einen Kandidaten in einen messbaren Pilotbrief.",
        "guardrail": "Halte den Pilot reversibel und benenne die menschliche Verantwortung für Entscheidungen, die den Prozess oder seine Nutzenden betreffen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Prozess und Reibungspunkte erfassen",
          "description": "Lerne eine strukturierte Opportunity-Analyse kennen, die Akteure, Übergaben, Entscheidungen, Ausnahmen, Daten und Probleme im aktuellen Ablauf sichtbar macht."
        },
        {
          "kind": "guided",
          "title": "Ansatz zuordnen und Kandidaten priorisieren",
          "description": "Unterscheide für jede Chance deterministische Automatisierung, unterstützende KI und Autonomie und vergleiche Nutzen, Machbarkeit, Datenreife, Betriebsrisiko und Umkehrbarkeit."
        },
        {
          "kind": "hands-on",
          "title": "Einen begrenzten Pilotbrief schreiben",
          "description": "Wähle einen Kandidaten und benenne Zuständigkeit, Ausgangswert, Erfolgsmaß, Abbruchbedingung und Prüfgate, damit der Pilot vor einer Skalierung bewertet werden kann."
        }
      ],
      "evidence": [
        "Eine Prozesskarte mit Akteuren, Entscheidungen, Übergaben, Ausnahmen, Daten und aktuellen Problemen",
        "Eine Begründung für deterministische Automatisierung, unterstützende KI oder Autonomie je Prozessschritt",
        "Eine priorisierte Chancenliste nach Nutzen, Machbarkeit, Datenreife, Risiko und Umkehrbarkeit",
        "Eine Pilothypothese mit Zuständigkeit, Ausgangswert, Erfolgsmaß, Abbruchbedingung und Prüfgate"
      ]
    }
  },
  "LRN-33": {
    "en": {
      "promise": "Build a cost and value case that shows whether an AI use case remains viable at realistic operating scale.",
      "projectScenario": {
        "title": "Stress-test an AI unit-economics case",
        "description": "Estimate model, retrieval, storage, integration, evaluation, and support costs for a workflow at expected and peak volumes; compare architecture options against its value hypothesis.",
        "guardrail": "Make token, caching, retry, volume, and support assumptions visible so a low pilot bill cannot disguise an uneconomic rollout."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map cost to value",
          "description": "Separate one-time integration from recurring model, retrieval, storage, evaluation, and operating costs; connect each to the use case's value hypothesis."
        },
        {
          "kind": "guided",
          "title": "Model realistic workloads",
          "description": "Calculate unit costs under volume, token, caching, retry, and support assumptions, then compare architecture or vendor choices by value, risk, and scale behavior."
        },
        {
          "kind": "hands-on",
          "title": "Set economic guardrails",
          "description": "Produce a cost model with scale scenarios, a value comparison, and monitoring signals that reveal when the pilot is becoming uneconomic."
        }
      ],
      "evidence": [
        "A workload assumption sheet covering expected and peak usage",
        "Cost breakdown per unit and at realistic operating volumes",
        "Architecture comparison that records value, risk, and scale trade-offs",
        "Cost limits and monitoring signals tied to a scale decision"
      ]
    },
    "de": {
      "promise": "Erstelle eine Kosten- und Wertbetrachtung, die zeigt, ob ein AI-Use-Case auch bei realistischer Nutzung wirtschaftlich bleibt.",
      "projectScenario": {
        "title": "Die Wirtschaftlichkeit eines AI-Use-Cases prüfen",
        "description": "Schätze Modell-, Retrieval-, Speicher-, Integrations-, Evaluations- und Betriebskosten bei üblicher und hoher Auslastung und vergleiche Architekturvarianten mit der erwarteten Wertschöpfung.",
        "guardrail": "Lege Annahmen zu Tokens, Caching, Wiederholungen, Volumen und Support offen, damit ein günstiger Pilot keine unwirtschaftliche Skalierung verdeckt."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Kosten und Wert einordnen",
          "description": "Trenne einmalige Integration von laufenden Modell-, Retrieval-, Speicher-, Evaluations- und Betriebskosten und verknüpfe sie mit der Wertannahme des Use Cases."
        },
        {
          "kind": "guided",
          "title": "Realistische Nutzung modellieren",
          "description": "Berechne Stückkosten mit Annahmen zu Volumen, Tokens, Caching, Wiederholungen und Support. Vergleiche Architektur- oder Anbieteroptionen nach Wert, Risiko und Skalierung."
        },
        {
          "kind": "hands-on",
          "title": "Wirtschaftliche Leitplanken festlegen",
          "description": "Erstelle ein Kostenmodell mit Skalierungsszenarien, Wertvergleich und Signalen, die eine unwirtschaftliche Entwicklung des Piloten früh anzeigen."
        }
      ],
      "evidence": [
        "Annahmenblatt zur erwarteten und hohen Nutzung",
        "Kostenaufschlüsselung pro Einheit und für realistische Betriebsvolumen",
        "Architekturvergleich mit dokumentierten Wert-, Risiko- und Skalierungskompromissen",
        "Kostengrenzen und Überwachungssignale für die Skalierungsentscheidung"
      ]
    }
  },
  "LRN-21": {
    "en": {
      "promise": "Turn a consulting question into prompts that produce decision-relevant, critically reviewed outputs.",
      "projectScenario": {
        "title": "Prompt for a consulting decision",
        "description": "Frame a client or internal consulting question with its decision context, evidence boundaries, stakeholder perspectives, and output criteria; iterate toward a usable recommendation.",
        "guardrail": "Keep generated claims distinct from sourced evidence and flag assumptions that still need validation."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Build a consulting brief",
          "description": "Specify the decision, audience, known evidence, open hypotheses, and the form a useful answer must take."
        },
        {
          "kind": "guided",
          "title": "Iterate and critique prompts",
          "description": "Use stakeholder, hypothesis, and counterargument prompts; inspect outputs for missing evidence, weak assumptions, bias, and relevance to the decision."
        },
        {
          "kind": "hands-on",
          "title": "Package a reusable pattern",
          "description": "Create a prompt pattern with a realistic example input, output criteria, a review checklist, and a failure case for future consulting work."
        }
      ],
      "evidence": [
        "A consulting brief with decision context and evidence boundaries",
        "Prompt versions annotated with what changed and why",
        "An output critique covering evidence gaps, assumptions, and stakeholder bias",
        "A reusable prompt pattern with example input and review checklist"
      ]
    },
    "de": {
      "promise": "Übersetze eine Beratungsfrage in Prompts, die entscheidungsrelevante und kritisch geprüfte Ergebnisse liefern.",
      "projectScenario": {
        "title": "Einen Prompt für eine Beratungsentscheidung entwickeln",
        "description": "Formuliere eine Kunden- oder interne Beratungsfrage mit Entscheidungskontext, Evidenzgrenzen, Stakeholder-Perspektiven und Ergebniskriterien und verbessere den Prompt schrittweise.",
        "guardrail": "Trenne generierte Aussagen klar von belegten Fakten und kennzeichne Annahmen, die noch geprüft werden müssen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Ein Beratungsbriefing strukturieren",
          "description": "Beschreibe Entscheidung, Zielgruppe, verfügbare Belege, offene Hypothesen und die Form eines brauchbaren Ergebnisses."
        },
        {
          "kind": "guided",
          "title": "Prompts iterieren und Ergebnisse prüfen",
          "description": "Nutze Prompts zu Stakeholdern, Hypothesen und Gegenargumenten. Prüfe Ergebnisse auf fehlende Belege, schwache Annahmen, Verzerrungen und Entscheidungsrelevanz."
        },
        {
          "kind": "hands-on",
          "title": "Ein wiederverwendbares Muster erstellen",
          "description": "Erstelle ein Prompt-Muster mit realistischem Beispieleingang, Ergebniskriterien, Prüfliste und einem typischen Fehlfall für künftige Beratungsarbeit."
        }
      ],
      "evidence": [
        "Beratungsbriefing mit Entscheidungskontext und Evidenzgrenzen",
        "Prompt-Versionen mit Begründung der Änderungen",
        "Ergebniskritik zu Beleglücken, Annahmen und Stakeholder-Verzerrungen",
        "Wiederverwendbares Prompt-Muster mit Beispieleingabe und Prüfliste"
      ]
    }
  },
  "LRN-15": {
    "en": {
      "promise": "Make a defensible AI ecosystem choice by matching platforms, models, and tools to organizational needs.",
      "projectScenario": {
        "title": "Compare options for an AI architecture",
        "description": "Map relevant model, platform, agent, and tool options, then recommend a fit for a defined use case and its integration, security, cost, and capability needs.",
        "guardrail": "Tie vendor claims to dated evidence and keep assumptions visible in the recommendation."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Read the ecosystem map",
          "description": "Distinguish model providers, AI platforms, agent frameworks, and supporting tools by their roles and capabilities."
        },
        {
          "kind": "guided",
          "title": "Compare fit and trade-offs",
          "description": "Apply capability, integration, security, and cost criteria to candidate options and test how organizational constraints change the fit."
        },
        {
          "kind": "hands-on",
          "title": "Write a vendor decision brief",
          "description": "Recommend an architecture direction for a concrete need and explain the trade-offs in terms stakeholders can act on."
        }
      ],
      "evidence": [
        "A categorized map of relevant ecosystem options",
        "A comparison against stated capability, integration, security, and cost needs",
        "An architecture recommendation linked to organizational constraints",
        "A decision brief that explains vendor trade-offs and evidence"
      ]
    },
    "de": {
      "promise": "Vergleiche Plattformen, Modelle und Tools mit den Anforderungen deiner Organisation und triff eine nachvollziehbare Wahl im AI-Ökosystem.",
      "projectScenario": {
        "title": "Optionen für eine AI-Architektur vergleichen",
        "description": "Ordne relevante Modelle, Plattformen, Agent-Frameworks und Tools ein und empfiehl eine passende Lösung für einen Use Case mit konkreten Integrations-, Sicherheits-, Kosten- und Funktionsanforderungen.",
        "guardrail": "Belege Anbieterangaben mit datierten Quellen und mach Annahmen in der Empfehlung sichtbar."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Landschaft einordnen",
          "description": "Unterscheide Modellanbieter, AI-Plattformen, Agent-Frameworks und unterstützende Tools nach Funktion und Fähigkeiten."
        },
        {
          "kind": "guided",
          "title": "Eignung und Kompromisse vergleichen",
          "description": "Vergleiche Optionen anhand von Fähigkeiten, Integration, Sicherheit und Kosten und prüfe, wie organisatorische Rahmenbedingungen die Eignung verändern."
        },
        {
          "kind": "hands-on",
          "title": "Eine Entscheidungsvorlage erstellen",
          "description": "Empfiehl eine Architektur für einen konkreten Bedarf und erkläre die Abwägungen so, dass Stakeholder damit entscheiden können."
        }
      ],
      "evidence": [
        "Strukturierte Übersicht relevanter Optionen im AI-Ökosystem",
        "Vergleich anhand konkreter Anforderungen an Fähigkeiten, Integration, Sicherheit und Kosten",
        "Architekturempfehlung mit Bezug zu organisatorischen Rahmenbedingungen",
        "Entscheidungsvorlage mit nachvollziehbaren Anbieterabwägungen und Belegen"
      ]
    }
  },
  "LRN-16": {
    "en": {
      "promise": "Turn an AI transformation priority into accountable changes to roles, operating practices, and adoption.",
      "projectScenario": {
        "title": "Shape a leadership area's AI transition",
        "description": "Assess a transformation opportunity, map effects on work and skills, choose a priority initiative, and lay out owners, milestones, and adoption measures.",
        "guardrail": "Keep human accountability explicit and address role and culture impacts alongside expected value."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Assess AI and transformation dynamics",
          "description": "Judge generative and agentic AI capabilities, limits, maturity, and risks, then connect them to changes in value creation and ways of working."
        },
        {
          "kind": "guided",
          "title": "Map workforce and operating-model impact",
          "description": "Trace how a candidate initiative changes roles, responsibilities, skills, and culture; select priorities for a leadership area."
        },
        {
          "kind": "hands-on",
          "title": "Make adoption accountable",
          "description": "Define human ownership, adoption measures, cultural guardrails, milestones, evidence, and next actions for the chosen transformation."
        }
      ],
      "evidence": [
        "Assessment of relevant AI capabilities, limits, maturity, and risks",
        "Role, responsibility, and skill impact map",
        "Prioritized leadership initiatives with adoption measures",
        "Roadmap naming owners, milestones, evidence, and next actions"
      ]
    },
    "de": {
      "promise": "Überführe eine AI-Transformationspriorität in konkrete Veränderungen an Rollen und Arbeitsweisen mit klaren Verantwortlichen.",
      "projectScenario": {
        "title": "Den AI-Wandel in einem Führungsbereich gestalten",
        "description": "Bewerte eine Transformationschance, erfasse Auswirkungen auf Arbeit und Kompetenzen, wähle eine prioritäre Initiative und plane Verantwortliche, Meilensteine und Adoptionskennzahlen.",
        "guardrail": "Mach menschliche Verantwortung sichtbar und berücksichtige Rollen- und Kulturfolgen neben dem erwarteten Nutzen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "AI und Transformation einordnen",
          "description": "Bewerte Fähigkeiten, Grenzen, Reifegrad und Risiken generativer und agentischer AI und leite Auswirkungen auf Wertschöpfung und Arbeitsweisen ab."
        },
        {
          "kind": "guided",
          "title": "Auswirkungen auf Workforce und Betriebsmodell erfassen",
          "description": "Untersuche, wie eine Initiative Rollen, Verantwortlichkeiten, Kompetenzen und Kultur verändert, und setze Prioritäten für einen Führungsbereich."
        },
        {
          "kind": "hands-on",
          "title": "Einführung verbindlich planen",
          "description": "Lege menschliche Verantwortung, Adoptionskennzahlen, kulturelle Leitplanken, Meilensteine, Nachweise und nächste Schritte für die gewählte Transformation fest."
        }
      ],
      "evidence": [
        "Bewertung relevanter AI-Fähigkeiten, Grenzen, Reifegrade und Risiken",
        "Übersicht der Auswirkungen auf Rollen, Verantwortung und Kompetenzen",
        "Priorisierte Führungsinitiativen mit Adoptionskennzahlen",
        "Roadmap mit Verantwortlichen, Meilensteinen, Nachweisen und nächsten Schritten"
      ]
    }
  },
  "LRN-40": {
    "en": {
      "promise": "Use quantitative AI-supported methods to inform decisions while making uncertainty and human accountability explicit.",
      "projectScenario": {
        "title": "Prepare an evidence-based decision",
        "description": "Frame a consequential work decision, analyze relevant data with methods such as clustering, forecasting, Monte Carlo simulation, or optimization, and compare scenarios before recommending action.",
        "guardrail": "Record uncertainty, bias checks, the accountable approver, and the rationale for the final decision."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Frame the decision and evidence",
          "description": "Define the objective, decision owner, evidence needed, and the difference between a model result and a justified choice."
        },
        {
          "kind": "guided",
          "title": "Explore quantitative methods and scenarios",
          "description": "Apply clustering, forecasting, simulation, or optimization and interpret ranges, assumptions, and alternative outcomes."
        },
        {
          "kind": "hands-on",
          "title": "Document a human-owned decision",
          "description": "Review bias and weak assumptions, select a course of action, and record approval, rationale, and follow-up with peers."
        }
      ],
      "evidence": [
        "Decision frame with explicit objective and accountable owner",
        "Quantitative analysis with scenarios and uncertainty explained",
        "Bias and assumption review tied to the evidence used",
        "Decision record with human approval, rationale, and follow-up"
      ]
    },
    "de": {
      "promise": "Nutze quantitative, AI-gestützte Methoden für Entscheidungen und mach Unsicherheit und menschliche Verantwortung sichtbar.",
      "projectScenario": {
        "title": "Eine evidenzbasierte Entscheidung vorbereiten",
        "description": "Untersuche eine relevante Arbeitsentscheidung mit passenden Daten und Methoden wie Clustering, Prognosen, Monte-Carlo-Simulation oder Optimierung und vergleiche Szenarien vor einer Empfehlung.",
        "guardrail": "Dokumentiere Unsicherheit, Bias-Prüfungen, die entscheidungsverantwortliche Person und die Begründung der Entscheidung."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Entscheidung und Evidenz rahmen",
          "description": "Definiere Ziel, Entscheidungsverantwortung und benötigte Belege und unterscheide ein Modellergebnis von einer begründeten Wahl."
        },
        {
          "kind": "guided",
          "title": "Quantitative Methoden und Szenarien untersuchen",
          "description": "Nutze Clustering, Prognosen, Simulation oder Optimierung und interpretiere Bandbreiten, Annahmen und alternative Ergebnisse."
        },
        {
          "kind": "hands-on",
          "title": "Eine menschlich verantwortete Entscheidung dokumentieren",
          "description": "Prüfe Bias und schwache Annahmen, wähle eine Handlungsoption und halte Freigabe, Begründung und Nachverfolgung mit Peers fest."
        }
      ],
      "evidence": [
        "Entscheidungsrahmen mit klarem Ziel und verantwortlicher Person",
        "Quantitative Analyse mit erläuterten Szenarien und Unsicherheiten",
        "Bias- und Annahmenprüfung anhand der verwendeten Evidenz",
        "Entscheidungsprotokoll mit menschlicher Freigabe, Begründung und Nachverfolgung"
      ]
    }
  },
  "LRN-05": {
    "en": {
      "promise": "Decide whether the data for an AI pilot is ready, and turn gaps into owned, measurable work.",
      "projectScenario": {
        "title": "Review data readiness before a pilot",
        "description": "Trace a proposed use case to its data sources, owners, lineage, permissions, refresh behavior, quality, and evaluation sample, then decide what blocks a pilot.",
        "guardrail": "Check sensitive fields, retention limits, leakage paths, and whether evaluation data contaminates the test."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Inventory data sources and access",
          "description": "Identify the required sources, owners, lineage, permissions, and refresh behavior for the AI use case."
        },
        {
          "kind": "guided",
          "title": "Profile quality and evaluation data",
          "description": "Check completeness, consistency, freshness, representativeness, labels, and risks that could invalidate evaluation."
        },
        {
          "kind": "hands-on",
          "title": "Make a readiness decision",
          "description": "Document blocking gaps, remediation owners, and measurable acceptance criteria for proceeding with a pilot."
        }
      ],
      "evidence": [
        "Source inventory with owners, lineage, permissions, and refresh behavior",
        "Quality profile covering completeness, freshness, representativeness, and labels",
        "Sensitivity, leakage, retention, and evaluation-contamination review",
        "Readiness decision with blockers, owners, and acceptance criteria"
      ]
    },
    "de": {
      "promise": "Entscheide, ob die Daten für einen AI-Piloten bereit sind, und weise Lücken zuständigen Personen zur messbaren Behebung zu.",
      "projectScenario": {
        "title": "Datenbereitschaft vor einem Piloten prüfen",
        "description": "Verfolge die Daten eines geplanten Use Cases bis zu Quellen, Verantwortlichen, Herkunft, Berechtigungen, Aktualität, Qualität und Evaluationsstichprobe zurück und bestimme, welche Lücken den Piloten blockieren.",
        "guardrail": "Prüfe sensible Felder, Aufbewahrungsgrenzen, mögliche Datenabflüsse und eine Verunreinigung der Evaluationsdaten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Datenquellen und Zugriff erfassen",
          "description": "Bestimme die benötigten Quellen, Verantwortlichen, Herkunft, Berechtigungen und Aktualisierungsrhythmen des AI-Use-Cases."
        },
        {
          "kind": "guided",
          "title": "Qualität und Evaluationsdaten prüfen",
          "description": "Untersuche Vollständigkeit, Konsistenz, Aktualität, Repräsentativität, Labels und Risiken, die eine Evaluation ungültig machen könnten."
        },
        {
          "kind": "hands-on",
          "title": "Eine Bereitschaftsentscheidung treffen",
          "description": "Dokumentiere blockierende Lücken, Zuständigkeiten für die Behebung und messbare Kriterien für den Start eines Piloten."
        }
      ],
      "evidence": [
        "Quelleninventar mit Verantwortlichen, Herkunft, Berechtigungen und Aktualisierung",
        "Qualitätsprofil zu Vollständigkeit, Aktualität, Repräsentativität und Labels",
        "Prüfung von Sensibilität, Datenabfluss, Aufbewahrung und Evaluationsverunreinigung",
        "Bereitschaftsentscheidung mit Blockern, Zuständigkeiten und Akzeptanzkriterien"
      ]
    }
  },
  "LRN-28": {
    "en": {
      "promise": "Find and control prompt-injection and data-leakage paths before an AI workflow goes live.",
      "projectScenario": {
        "title": "Threat-review an AI workflow",
        "description": "Map trust boundaries from user prompts through retrieved data, models, and tools; trace injection or exfiltration paths and define the launch controls they require.",
        "guardrail": "Grant tools only the permissions needed for their approved task."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map trust boundaries",
          "description": "Identify where users, prompts, data sources, models, and connected tools cross trust boundaries and where control can be lost."
        },
        {
          "kind": "guided",
          "title": "Trace injection and leakage paths",
          "description": "Examine how untrusted content could steer a workflow, expose data, or misuse a tool; review tool approval and least-privilege controls."
        },
        {
          "kind": "hands-on",
          "title": "Define launch and audit gates",
          "description": "Turn the threat review into approval checks and evidence that teams can use before release and during audit."
        }
      ],
      "evidence": [
        "Trust-boundary map spanning prompts, data, models, tools, and users",
        "Prompt-injection and data-exfiltration paths with their controls",
        "Tool approval matrix showing required least-privilege permissions",
        "Launch-gate checklist with auditable evidence"
      ]
    },
    "de": {
      "promise": "Erkenne und kontrolliere Prompt-Injection- und Datenabflusswege, bevor ein AI-Workflow live geht.",
      "projectScenario": {
        "title": "Einen AI-Workflow auf Bedrohungen prüfen",
        "description": "Kartiere Vertrauensgrenzen von Nutzereingaben über abgerufene Daten und Modelle bis zu Tools, verfolge mögliche Injection- oder Exfiltrationswege und leite Startkontrollen ab.",
        "guardrail": "Gib Tools nur die Berechtigungen, die sie für ihre freigegebene Aufgabe brauchen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Vertrauensgrenzen kartieren",
          "description": "Bestimme, wo Nutzer, Prompts, Datenquellen, Modelle und angebundene Tools Vertrauensgrenzen überschreiten und Kontrolle verloren gehen kann."
        },
        {
          "kind": "guided",
          "title": "Injection- und Datenabflusswege verfolgen",
          "description": "Untersuche, wie nicht vertrauenswürdige Inhalte einen Workflow steuern, Daten offenlegen oder Tools missbrauchen könnten, und prüfe Toolfreigaben und Minimalberechtigungen."
        },
        {
          "kind": "hands-on",
          "title": "Freigabe- und Auditkontrollen festlegen",
          "description": "Überführe die Bedrohungsprüfung in Freigabekriterien und Nachweise, die Teams vor einem Release und bei Audits verwenden können."
        }
      ],
      "evidence": [
        "Karte der Vertrauensgrenzen für Prompts, Daten, Modelle, Tools und Nutzer",
        "Injection- und Datenexfiltrationswege samt Kontrollen",
        "Freigabematrix für Tools mit erforderlichen Minimalberechtigungen",
        "Checkliste für den Produktivstart mit auditierbaren Nachweisen"
      ]
    }
  },
  "LRN-18": {
    "en": {
      "promise": "Plan an internal knowledge assistant whose answers respect source ownership, access, and evidence quality.",
      "projectScenario": {
        "title": "Plan a source-grounded knowledge assistant",
        "description": "Select an internal knowledge collection, assess its quality and access rules, then design retrieval, citations, answer checks, and a fallback for missing evidence.",
        "guardrail": "Respect source permissions and make the assistant abstain or route the question when evidence is missing."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Check source readiness",
          "description": "Assess source quality, coverage, ownership, permissions, and freshness before relying on documents for retrieval-augmented answers."
        },
        {
          "kind": "guided",
          "title": "Design retrieval and access boundaries",
          "description": "Plan how sources are retrieved, cited, and filtered by access, including what the assistant should do when retrieval is weak."
        },
        {
          "kind": "hands-on",
          "title": "Evaluate answer quality",
          "description": "Review sample answers for grounding, relevance, and unsafe omissions, then define source ownership and follow-up for the planned assistant."
        }
      ],
      "evidence": [
        "Source inventory with coverage, owner, freshness, quality, and permissions",
        "Retrieval plan with citations, access boundaries, and fallback behavior",
        "Answer review for grounding, relevance, and unsafe omissions",
        "Assistant plan naming accountable source owners"
      ]
    },
    "de": {
      "promise": "Plane einen internen Wissensassistenten, dessen Antworten auf verantworteten Quellen beruhen und Zugriffsrechte sowie Evidenzqualität berücksichtigen.",
      "projectScenario": {
        "title": "Einen quellenbasierten Wissensassistenten planen",
        "description": "Wähle einen internen Wissensbestand aus, prüfe Qualität und Zugriffsregeln und entwirf Retrieval, Quellenangaben, Antwortprüfung und einen Rückfallweg bei fehlenden Belegen.",
        "guardrail": "Beachte Quellenberechtigungen und lass den Assistenten bei fehlender Evidenz die Antwort zurückstellen oder weiterleiten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Quellenbereitschaft prüfen",
          "description": "Bewerte Qualität, Abdeckung, Verantwortung, Berechtigungen und Aktualität der Quellen, bevor Dokumente für Retrieval-Augmented Generation genutzt werden."
        },
        {
          "kind": "guided",
          "title": "Retrieval und Zugriffsgrenzen planen",
          "description": "Lege fest, wie Quellen abgerufen, zitiert und nach Zugriff gefiltert werden und wie der Assistent bei schwachem Retrieval reagiert."
        },
        {
          "kind": "hands-on",
          "title": "Antwortqualität bewerten",
          "description": "Prüfe Beispielantworten auf Belegbarkeit, Relevanz und riskante Auslassungen und benenne Quellenverantwortliche für den geplanten Assistenten."
        }
      ],
      "evidence": [
        "Quelleninventar mit Abdeckung, Verantwortung, Aktualität, Qualität und Berechtigungen",
        "Retrieval-Plan mit Quellenangaben, Zugriffsgrenzen und Rückfallverhalten",
        "Antwortprüfung auf Belegbarkeit, Relevanz und riskante Auslassungen",
        "Assistentenplan mit benannten Quellenverantwortlichen"
      ]
    }
  },
  "LRN-41": {
    "en": {
      "promise": "Recommend an AI procurement choice using workload evidence, risk review, and a credible exit path.",
      "projectScenario": {
        "title": "Evaluate vendors for a defined workload",
        "description": "Compare candidate AI vendors against value, security, data handling, integration, operating costs, and lock-in; design a realistic trial and review how to exit.",
        "guardrail": "Check data and contract terms alongside product capability, including what happens to data and service access at exit."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set procurement criteria",
          "description": "Build a vendor scorecard around the use case's value, risk, security, data handling, integration, and operating needs."
        },
        {
          "kind": "guided",
          "title": "Design an informative trial",
          "description": "Set measurable acceptance criteria and compare vendors using realistic workloads rather than demonstrations alone."
        },
        {
          "kind": "hands-on",
          "title": "Recommend and plan the exit",
          "description": "Identify contract, data, lock-in, and cost risks; present a procurement recommendation with evidence, trade-offs, and an exit plan."
        }
      ],
      "evidence": [
        "Vendor scorecard tied to the defined workload",
        "Trial plan with realistic workload and measurable acceptance criteria",
        "Review of data, contract, security, lock-in, and operating-cost risks",
        "Procurement recommendation with evidence, trade-offs, and exit plan"
      ]
    },
    "de": {
      "promise": "Begründe eine AI-Beschaffungsentscheidung mit Evidenz aus dem Workload, einer Risikoprüfung und einem tragfähigen Ausstiegspfad.",
      "projectScenario": {
        "title": "Anbieter für einen konkreten Workload bewerten",
        "description": "Vergleiche AI-Anbieter nach Nutzen, Sicherheit, Datenverarbeitung, Integration, Betriebskosten und Abhängigkeiten. Plane einen realistischen Test und prüfe den Ausstieg.",
        "guardrail": "Prüfe Daten- und Vertragsbedingungen zusammen mit den Produktfähigkeiten, einschließlich Daten und Zugängen beim Ausstieg."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Beschaffungskriterien festlegen",
          "description": "Erstelle ein Anbieter-Scoring für Nutzen, Risiko, Sicherheit, Datenverarbeitung, Integration und Betriebsanforderungen des Use Cases."
        },
        {
          "kind": "guided",
          "title": "Einen aussagekräftigen Test planen",
          "description": "Lege messbare Akzeptanzkriterien fest und vergleiche Anbieter mit realistischen Workloads statt nur mit Produktdemos."
        },
        {
          "kind": "hands-on",
          "title": "Empfehlung und Ausstieg planen",
          "description": "Identifiziere Vertrags-, Daten-, Abhängigkeits- und Kostenrisiken und formuliere eine evidenzbasierte Beschaffungsempfehlung mit Abwägungen und Ausstiegsplan."
        }
      ],
      "evidence": [
        "Anbieter-Scoring passend zum definierten Workload",
        "Testplan mit realistischem Workload und messbaren Akzeptanzkriterien",
        "Prüfung von Daten-, Vertrags-, Sicherheits-, Abhängigkeits- und Betriebskostenrisiken",
        "Beschaffungsempfehlung mit Evidenz, Abwägungen und Ausstiegsplan"
      ]
    }
  },
  "LRN-36": {
    "en": {
      "promise": "Respond to production AI incidents with clear signals, ownership, recovery steps, and learning.",
      "projectScenario": {
        "title": "Prepare for an AI service incident",
        "description": "Create a runbook for an AI feature whose quality, latency, cost, or safety signal degrades; rehearse triage, escalation, rollback, and post-incident updates.",
        "guardrail": "Preserve diagnostic evidence through rollback and recovery."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Monitor production behavior",
          "description": "Choose quality, cost, latency, and safety signals that can reveal harmful changes in a deployed AI feature."
        },
        {
          "kind": "guided",
          "title": "Triage and escalate incidents",
          "description": "Set severity, ownership, and escalation paths for incident signals and practice deciding when to contain or roll back."
        },
        {
          "kind": "hands-on",
          "title": "Close the postmortem loop",
          "description": "Document recovery steps, update the runbook from postmortem findings, and turn those findings into release-gate improvements."
        }
      ],
      "evidence": [
        "Monitoring signals for quality, cost, latency, and safety",
        "Incident severity and escalation map with named ownership",
        "Rollback and recovery steps that retain diagnostic evidence",
        "Runbook and release-gate updates linked to postmortem findings"
      ]
    },
    "de": {
      "promise": "Reagiere auf AI-Vorfälle im Produktivbetrieb mit klaren Signalen, Zuständigkeiten, Wiederherstellungsschritten und Lerneffekten.",
      "projectScenario": {
        "title": "Auf einen AI-Servicevorfall vorbereitet sein",
        "description": "Erstelle ein Runbook für ein AI-Feature, dessen Qualität, Latenz, Kosten oder Sicherheitssignal sich verschlechtert. Übe Triage, Eskalation, Rollback und Nachbereitung.",
        "guardrail": "Sichere Diagnosebelege während Rollback und Wiederherstellung."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Verhalten im Produktivbetrieb überwachen",
          "description": "Wähle Signale zu Qualität, Kosten, Latenz und Sicherheit, die schädliche Änderungen eines laufenden AI-Features sichtbar machen."
        },
        {
          "kind": "guided",
          "title": "Vorfälle triagieren und eskalieren",
          "description": "Lege Schweregrad, Zuständigkeiten und Eskalationswege für Vorfallsignale fest und übe Entscheidungen zu Eindämmung oder Rollback."
        },
        {
          "kind": "hands-on",
          "title": "Erkenntnisse aus dem Postmortem umsetzen",
          "description": "Dokumentiere Wiederherstellungsschritte, aktualisiere das Runbook anhand der Nachbereitung und verbessere damit Release-Kriterien."
        }
      ],
      "evidence": [
        "Überwachungssignale zu Qualität, Kosten, Latenz und Sicherheit",
        "Vorfallsmatrix mit Schweregraden, Eskalationswegen und Zuständigkeiten",
        "Rollback- und Wiederherstellungsschritte mit gesicherten Diagnosebelegen",
        "Runbook- und Release-Kriterien, die aus Postmortem-Erkenntnissen folgen"
      ]
    }
  },
  "LRN-09": {
    "en": {
      "promise": "Design a support workflow that uses AI within clear service boundaries and measures its effect on resolution quality.",
      "projectScenario": {
        "title": "Redesign a support-ticket workflow",
        "description": "Plan AI-assisted ticket triage, knowledge retrieval, or response drafting and classify each action as safe assistance, approval-required, or prohibited automation.",
        "guardrail": "Ground support responses in approved sources and review customer impact, data exposure, accuracy, and escalation needs."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set service boundaries",
          "description": "Separate tasks that can be assisted safely from actions that need approval or must not be automated."
        },
        {
          "kind": "guided",
          "title": "Design a grounded support flow",
          "description": "Connect ticket triage, knowledge retrieval, and response drafts to approved sources, confidence thresholds, and escalation paths."
        },
        {
          "kind": "hands-on",
          "title": "Review and measure support quality",
          "description": "Check sample outputs and define measures for resolution quality, handoff accuracy, containment, and rework."
        }
      ],
      "evidence": [
        "Service-action classification across assistance, approval, and prohibited automation",
        "Support workflow showing sources, confidence threshold, and escalation",
        "Output review covering accuracy, customer impact, and data exposure",
        "Measurement plan for resolution quality, handoff accuracy, containment, and rework"
      ]
    },
    "de": {
      "promise": "Gestalte einen Support-Workflow, der AI innerhalb klarer Servicegrenzen einsetzt und die Wirkung auf die Lösungsqualität misst.",
      "projectScenario": {
        "title": "Einen Support-Ticket-Workflow neu gestalten",
        "description": "Plane AI-Unterstützung für Ticket-Triage, Wissensabruf oder Antwortentwürfe und ordne jede Aktion als sichere Assistenz, freigabepflichtig oder unzulässige Automatisierung ein.",
        "guardrail": "Stütze Supportantworten auf freigegebene Quellen und prüfe Kundenauswirkungen, Datenoffenlegung, Richtigkeit und Eskalationsbedarf."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Servicegrenzen festlegen",
          "description": "Unterscheide Aufgaben, die sicher unterstützt werden können, von freigabepflichtigen oder nicht zu automatisierenden Aktionen."
        },
        {
          "kind": "guided",
          "title": "Einen quellenbasierten Supportablauf entwerfen",
          "description": "Verbinde Ticket-Triage, Wissensabruf und Antwortentwürfe mit freigegebenen Quellen, Konfidenzschwellen und Eskalationswegen."
        },
        {
          "kind": "hands-on",
          "title": "Supportqualität prüfen und messen",
          "description": "Bewerte Beispielausgaben und lege Messgrößen für Lösungsqualität, Übergabegenauigkeit, direkte Falllösung und Nacharbeit fest."
        }
      ],
      "evidence": [
        "Einordnung von Serviceaktionen in Assistenz, Freigabe und unzulässige Automatisierung",
        "Supportablauf mit Quellen, Konfidenzschwelle und Eskalationsweg",
        "Ausgabeprüfung zu Richtigkeit, Kundenauswirkung und Datenoffenlegung",
        "Messplan für Lösungsqualität, Übergabegenauigkeit, direkte Falllösung und Nacharbeit"
      ]
    }
  },
  "LRN-10": {
    "en": {
      "promise": "Use AI to prepare and follow through on meetings that produce clear decisions, owners, and next steps.",
      "projectScenario": {
        "title": "Design a decision-focused workshop",
        "description": "Turn a workshop objective into an agenda and facilitation plan, prepare questions and alternatives with AI, then produce a reviewed decision and action record from approved notes.",
        "guardrail": "Do not invent stakeholder positions; separate commitments from suggestions and generated material."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Set the agenda contract",
          "description": "Define the meeting outcome, decisions, needed inputs, participant roles, and time boxes before asking AI to prepare material."
        },
        {
          "kind": "guided",
          "title": "Prepare facilitation material",
          "description": "Generate and refine questions, alternatives, and workshop content without attributing unsupported views to participants."
        },
        {
          "kind": "hands-on",
          "title": "Publish a reviewed follow-up",
          "description": "Use approved notes to capture decisions, dissent, owners, deadlines, and open questions in a follow-up package."
        }
      ],
      "evidence": [
        "Agenda contract with outcome, decision, input, role, and timing",
        "Facilitation script with questions and alternatives",
        "Decision log that records dissent, owners, deadlines, and unresolved questions",
        "Reviewed action tracker distinguishing commitments, suggestions, and generated content"
      ]
    },
    "de": {
      "promise": "Nutze AI für Vorbereitung und Nachbereitung von Meetings, die klare Entscheidungen, Zuständigkeiten und nächste Schritte hervorbringen.",
      "projectScenario": {
        "title": "Einen entscheidungsorientierten Workshop planen",
        "description": "Überführe ein Workshopziel in Agenda und Moderationsplan, bereite mit AI Fragen und Alternativen vor und erstelle aus freigegebenen Notizen ein geprüftes Entscheidungs- und Maßnahmenprotokoll.",
        "guardrail": "Erfinde keine Stakeholder-Positionen und trenne Zusagen von Vorschlägen und generierten Inhalten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den Agenda-Auftrag klären",
          "description": "Definiere Ergebnis, Entscheidungen, benötigte Beiträge, Teilnehmerrollen und Zeitfenster, bevor AI Materialien vorbereitet."
        },
        {
          "kind": "guided",
          "title": "Moderationsmaterial vorbereiten",
          "description": "Erstelle und verbessere Fragen, Alternativen und Workshopmaterial, ohne Teilnehmenden unbelegte Ansichten zuzuschreiben."
        },
        {
          "kind": "hands-on",
          "title": "Geprüfte Nachbereitung veröffentlichen",
          "description": "Halte anhand freigegebener Notizen Entscheidungen, abweichende Meinungen, Zuständigkeiten, Fristen und offene Fragen fest."
        }
      ],
      "evidence": [
        "Agenda-Auftrag mit Ergebnis, Entscheidung, Beiträgen, Rollen und Zeitplan",
        "Moderationsskript mit Fragen und Alternativen",
        "Entscheidungsprotokoll mit abweichenden Meinungen, Zuständigkeiten, Fristen und offenen Fragen",
        "Geprüfter Maßnahmen-Tracker, der Zusagen, Vorschläge und generierte Inhalte unterscheidet"
      ]
    }
  },
  "LRN-32": {
    "en": {
      "promise": "Turn verified project information into a steering pack that makes risks, choices, and decision requests clear.",
      "projectScenario": {
        "title": "Prepare an evidence-based steering update",
        "description": "Build a project status and steering pack from a verified source snapshot, check its measures and risks, and frame the decision the steering group needs to make.",
        "guardrail": "Label facts, forecasts, and assumptions separately and retain references to their source data."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Build a source snapshot",
          "description": "Identify the project data that supports status, forecast, dependencies, risks, and requested decisions."
        },
        {
          "kind": "guided",
          "title": "Check status and risk signals",
          "description": "Review RAG status, metrics, confidence, and delivery risks for unsupported claims, inconsistent measures, or hidden dependencies."
        },
        {
          "kind": "hands-on",
          "title": "Frame the steering ask",
          "description": "Present options, trade-offs, dependencies, evidence, owners, and an explicit decision question in a reproducible update."
        }
      ],
      "evidence": [
        "Status narrative with facts, forecasts, and assumptions separated",
        "Risk and metric review with source references",
        "Steering question framed with options, trade-offs, dependencies, and evidence",
        "Reusable pack with named owners and an update cadence"
      ]
    },
    "de": {
      "promise": "Überführe verifizierte Projektinformationen in eine Steuerungsvorlage, die Risiken, Optionen und Entscheidungsbedarf klar macht.",
      "projectScenario": {
        "title": "Ein evidenzbasiertes Steering-Update vorbereiten",
        "description": "Erstelle Statusbericht und Steering-Unterlage aus einem verifizierten Projekt-Datenstand, prüfe Kennzahlen und Risiken und formuliere die benötigte Entscheidung.",
        "guardrail": "Kennzeichne Fakten, Prognosen und Annahmen getrennt und verweise auf die jeweiligen Quelldaten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Einen Quelldatenstand erstellen",
          "description": "Bestimme die Projektdaten, die Status, Prognose, Abhängigkeiten, Risiken und anstehende Entscheidungen belegen."
        },
        {
          "kind": "guided",
          "title": "Status und Risikosignale prüfen",
          "description": "Untersuche Ampelstatus, Kennzahlen, Sicherheit der Aussagen und Lieferrisiken auf unbelegte Behauptungen, widersprüchliche Messwerte und verborgene Abhängigkeiten."
        },
        {
          "kind": "hands-on",
          "title": "Die Steuerungsfrage formulieren",
          "description": "Stelle Optionen, Abwägungen, Abhängigkeiten, Evidenz und Zuständigkeiten in einem reproduzierbaren Update dar und nenne die konkrete Entscheidungsfrage."
        }
      ],
      "evidence": [
        "Statusdarstellung mit getrennter Kennzeichnung von Fakten, Prognosen und Annahmen",
        "Prüfung von Risiken und Kennzahlen mit Quellenbezug",
        "Steuerungsfrage mit Optionen, Abwägungen, Abhängigkeiten und Evidenz",
        "Wiederverwendbare Vorlage mit benannten Verantwortlichen und Aktualisierungsrhythmus"
      ]
    }
  },
  "LRN-12": {
    "en": {
      "promise": "Find master-data weaknesses that could degrade an AI workflow and assign practical remediation and monitoring.",
      "projectScenario": {
        "title": "Trace AI quality issues to master data",
        "description": "Map an AI workflow to the master and reference data it relies on, sample records against business-critical quality rules, and prioritize fixes by downstream impact.",
        "guardrail": "Define monitoring and escalation that prevent the workflow from amplifying data once it falls below agreed thresholds."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Trace data ownership and dependencies",
          "description": "Identify master data, reference data, accountable owners, and quality rules that feed the AI workflow."
        },
        {
          "kind": "guided",
          "title": "Test quality on a sample",
          "description": "Measure duplicate, missing, stale, inconsistent, and invalid records against business-critical thresholds."
        },
        {
          "kind": "hands-on",
          "title": "Prioritize remediation and controls",
          "description": "Rank data-quality issues by impact, recurrence, ownership, and control effectiveness, then define monitoring and escalation."
        }
      ],
      "evidence": [
        "Dependency map linking the AI workflow to master data, reference data, and owners",
        "Sample check with counts for duplicates, missing, stale, inconsistent, and invalid records",
        "Remediation backlog prioritized by downstream impact and accountable owner",
        "Monitoring and escalation rules tied to quality thresholds"
      ]
    },
    "de": {
      "promise": "Finde Schwächen in Stammdaten, die einen AI-Workflow beeinträchtigen können, und plane konkrete Korrekturen samt Überwachung.",
      "projectScenario": {
        "title": "AI-Qualitätsprobleme auf Stammdaten zurückführen",
        "description": "Ordne einem AI-Workflow die benötigten Stamm- und Referenzdaten zu, prüfe Stichproben anhand geschäftskritischer Qualitätsregeln und priorisiere Korrekturen nach Folgewirkung.",
        "guardrail": "Definiere Überwachung und Eskalation, damit der Workflow Daten unterhalb vereinbarter Schwellenwerte nicht weiter verstärkt."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Datenverantwortung und Abhängigkeiten verfolgen",
          "description": "Bestimme Stammdaten, Referenzdaten, Verantwortliche und Qualitätsregeln, von denen der AI-Workflow abhängt."
        },
        {
          "kind": "guided",
          "title": "Qualität an einer Stichprobe prüfen",
          "description": "Ermittle anhand geschäftskritischer Schwellenwerte die Zahl doppelter, fehlender, veralteter, widersprüchlicher und ungültiger Datensätze."
        },
        {
          "kind": "hands-on",
          "title": "Korrekturen und Kontrollen priorisieren",
          "description": "Ordne Qualitätsprobleme nach Folgewirkung, Wiederauftreten, Zuständigkeit und Kontrollwirksamkeit und lege Überwachung und Eskalation fest."
        }
      ],
      "evidence": [
        "Abhängigkeitsübersicht zwischen AI-Workflow, Stamm- und Referenzdaten sowie Verantwortlichen",
        "Stichprobenprüfung mit Zahlen zu Duplikaten, fehlenden, veralteten, widersprüchlichen und ungültigen Datensätzen",
        "Nacharbeits-Backlog nach Folgewirkung und zuständiger Person priorisiert",
        "Überwachungs- und Eskalationsregeln mit Bezug zu Qualitätsgrenzwerten"
      ]
    }
  },
  "LRN-30": {
    "en": {
      "promise": "Design a bounded AI automation pilot from a clear process map, exception analysis, and measurable controls.",
      "projectScenario": {
        "title": "Select a process step for an automation pilot",
        "description": "Map decisions, queues, handoffs, systems, controls, and exceptions in a current process, then decide where rules, human judgment, or probabilistic AI fit.",
        "guardrail": "Include human review, fallback behavior, observability, and stop conditions in the pilot design."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Understand the current process",
          "description": "Model the work as it runs today, including decisions, queues, handoffs, systems, controls, and exception paths."
        },
        {
          "kind": "guided",
          "title": "Match work to the right method",
          "description": "Compare deterministic rules, human judgment, and probabilistic AI against process steps and exceptions; test the value of the proposed automation."
        },
        {
          "kind": "hands-on",
          "title": "Bound and evaluate the pilot",
          "description": "Design review, fallback, observability, and stop conditions, then judge evidence on cycle time, quality, exception load, risk, and ownership."
        }
      ],
      "evidence": [
        "Current-state process map with decisions, handoffs, systems, and controls",
        "Exception log and rationale for using rules, people, or AI at each step",
        "Pilot design with human fallback, observability, and stop conditions",
        "Evaluation plan for cycle time, quality, exception load, risk, and ownership"
      ]
    },
    "de": {
      "promise": "Entwirf einen klar abgegrenzten AI-Automatisierungspiloten auf Basis einer Prozessübersicht, Ausnahmeanalyse und messbarer Kontrollen.",
      "projectScenario": {
        "title": "Einen Prozessschritt für einen Automatisierungspiloten auswählen",
        "description": "Kartiere Entscheidungen, Warteschlangen, Übergaben, Systeme, Kontrollen und Ausnahmen eines bestehenden Prozesses und bestimme, wo Regeln, menschliches Urteil oder probabilistische AI passen.",
        "guardrail": "Plane menschliche Prüfung, Rückfallverhalten, Beobachtbarkeit und Abbruchkriterien ausdrücklich ein."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den bestehenden Prozess verstehen",
          "description": "Modelliere den heutigen Ablauf mit Entscheidungen, Warteschlangen, Übergaben, Systemen, Kontrollen und Ausnahmewegen."
        },
        {
          "kind": "guided",
          "title": "Die passende Methode zuordnen",
          "description": "Vergleiche deterministische Regeln, menschliches Urteilsvermögen und probabilistische AI für einzelne Prozessschritte und Ausnahmen und prüfe den Nutzen der Automatisierung."
        },
        {
          "kind": "hands-on",
          "title": "Den Piloten begrenzen und bewerten",
          "description": "Definiere Prüfung, Rückfall, Beobachtbarkeit und Abbruchkriterien und bewerte Evidenz zu Durchlaufzeit, Qualität, Ausnahmen, Risiko und Zuständigkeit."
        }
      ],
      "evidence": [
        "Ist-Prozesskarte mit Entscheidungen, Übergaben, Systemen und Kontrollen",
        "Ausnahmeprotokoll mit Begründung für Regeln, Menschen oder AI je Prozessschritt",
        "Pilotdesign mit menschlichem Rückfall, Beobachtbarkeit und Abbruchkriterien",
        "Evaluationsplan zu Durchlaufzeit, Qualität, Ausnahmeaufkommen, Risiko und Zuständigkeit"
      ]
    }
  },
  "LRN-39": {
    "en": {
      "promise": "Make AI risks and internal controls traceable through owners, tests, approvals, and audit evidence.",
      "projectScenario": {
        "title": "Test controls for an AI use case",
        "description": "Build a risk register for a defined AI workflow, test whether its controls reduce material risks, and trace approvals, exceptions, and residual risk to evidence.",
        "guardrail": "Treat a control as effective only when its operation is supported by test evidence."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Assign risk and control ownership",
          "description": "Describe material AI risks, their owners, existing controls, required evidence, and review dates in a risk register."
        },
        {
          "kind": "guided",
          "title": "Test control effectiveness",
          "description": "Examine how controls work in practice and whether they reduce the risks they are meant to address."
        },
        {
          "kind": "hands-on",
          "title": "Trace decisions and close policy gaps",
          "description": "Record approvals, exceptions, residual risk, and audit evidence; escalate policy gaps before they become unmanaged operational debt."
        }
      ],
      "evidence": [
        "AI risk register with owners, controls, evidence, and review dates",
        "Control-test record showing observed results and remaining risk",
        "Audit trail for approvals, exceptions, and residual-risk decisions",
        "Escalation item for a policy gap with accountable follow-up"
      ]
    },
    "de": {
      "promise": "Mach AI-Risiken und interne Kontrollen durch Zuständigkeiten, Tests, Freigaben und Auditnachweise nachvollziehbar.",
      "projectScenario": {
        "title": "Kontrollen für einen AI-Use-Case testen",
        "description": "Erstelle ein Risikoregister für einen konkreten AI-Workflow, prüfe die tatsächliche Risikominderung durch Kontrollen und belege Freigaben, Ausnahmen und Restrisiken.",
        "guardrail": "Bewerte eine Kontrolle erst dann als wirksam, wenn ihre Anwendung durch Testergebnisse belegt ist."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Risiken und Kontrollen zuordnen",
          "description": "Beschreibe wesentliche AI-Risiken, Verantwortliche, bestehende Kontrollen, erforderliche Nachweise und Prüftermine in einem Risikoregister."
        },
        {
          "kind": "guided",
          "title": "Kontrollwirksamkeit testen",
          "description": "Untersuche, wie Kontrollen in der Praxis funktionieren und ob sie die vorgesehenen Risiken tatsächlich senken."
        },
        {
          "kind": "hands-on",
          "title": "Entscheidungen nachverfolgen und Richtlinienlücken schließen",
          "description": "Dokumentiere Freigaben, Ausnahmen, Restrisiken und Auditnachweise und eskaliere Richtlinienlücken, bevor daraus unkontrollierter Betriebsaufwand wird."
        }
      ],
      "evidence": [
        "AI-Risikoregister mit Verantwortlichen, Kontrollen, Nachweisen und Prüfterminen",
        "Kontrolltest mit beobachteten Ergebnissen und verbleibendem Risiko",
        "Audit-Trail zu Freigaben, Ausnahmen und Entscheidungen über Restrisiken",
        "Eskalationspunkt für eine Richtlinienlücke mit verantworteter Nachverfolgung"
      ]
    }
  },
  "LRN-13": {
    "en": {
      "promise": "Finish with a governed content lifecycle that keeps internal AI search grounded in owned, current, authoritative sources while preserving access rules.",
      "projectScenario": {
        "title": "Prepare a knowledge base for internal AI search",
        "description": "Review a mixed collection of policy and how-to documents. Record each source's owner, authority, audience, sensitivity, freshness, and retention; decide what can be ingested, needs review, or should be retired; define how corrections reach the indexed content.",
        "guardrail": "Ingestion must preserve source permissions: retrieval must not expose a document to people who could not access it at its source."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "See how retrieval amplifies source quality",
          "description": "Connect source authority, freshness, duplication, access, and retention to the answers an internal assistant can retrieve."
        },
        {
          "kind": "guided",
          "title": "Triage a source collection",
          "description": "Classify example sources, flag stale or conflicting material, and choose whether to ingest, review, restrict, or retire each one."
        },
        {
          "kind": "hands-on",
          "title": "Define the content lifecycle",
          "description": "Draft owner checks, ingestion and versioning rules, review cadence, access controls, and an auditable correction path for one knowledge collection."
        }
      ],
      "evidence": [
        "A source inventory with owner, authority, audience, sensitivity, freshness, and retention fields",
        "Triage decisions for duplicate, stale, conflicting, and low-authority content, each with a reason",
        "Ingestion, review, versioning, access, and retirement rules with accountable owners",
        "A correction record showing how a source change is reviewed and propagated to retrieval"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem geregelten Inhaltslebenszyklus ab, der die interne KI-Suche auf von klar zuständigen Stellen gepflegte, aktuelle und verlässliche Quellen stützt und Zugriffsrechte wahrt.",
      "projectScenario": {
        "title": "Eine Wissensbasis für die interne KI-Suche vorbereiten",
        "description": "Prüfe eine gemischte Sammlung aus Richtlinien und Anleitungen. Erfasse je Quelle verantwortliche Stelle, Verbindlichkeit, Zielgruppe, Schutzbedarf, Aktualität und Aufbewahrung. Entscheide über Aufnahme, Prüfung oder Aussonderung und lege fest, wie Korrekturen in die Suche gelangen.",
        "guardrail": "Bei der Aufnahme müssen die ursprünglichen Berechtigungen erhalten bleiben: Die Suche darf Inhalte niemandem zugänglich machen, der sie an der Quelle nicht lesen dürfte."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Verstehen, wie Suche die Quellenqualität verstärkt",
          "description": "Ordne Verbindlichkeit, Aktualität, Dubletten, Zugriff und Aufbewahrung den Antworten zu, die ein interner Assistent abrufen kann."
        },
        {
          "kind": "guided",
          "title": "Eine Quellensammlung einordnen",
          "description": "Klassifiziere Beispielquellen, markiere veraltete oder widersprüchliche Inhalte und entscheide je Quelle über Aufnahme, Prüfung, Einschränkung oder Aussonderung."
        },
        {
          "kind": "hands-on",
          "title": "Den Inhaltslebenszyklus festlegen",
          "description": "Entwirf für eine Wissenssammlung Zuständigkeiten, Regeln für Aufnahme und Versionierung, Prüfrhythmus, Zugriffsschutz und einen nachvollziehbaren Korrekturweg."
        }
      ],
      "evidence": [
        "Ein Quellenverzeichnis mit Zuständigkeit, Verbindlichkeit, Zielgruppe, Schutzbedarf, Aktualität und Aufbewahrung",
        "Begründete Entscheidungen zu Dubletten, veralteten, widersprüchlichen und wenig verlässlichen Inhalten",
        "Regeln für Aufnahme, Prüfung, Versionierung, Zugriff und Aussonderung mit klaren Verantwortlichen",
        "Ein Korrekturprotokoll, das zeigt, wie eine Quellenänderung geprüft und in die Suche übernommen wird"
      ]
    }
  },
  "LRN-42": {
    "en": {
      "promise": "Complete the course with a traceable AI architecture decision that compares meaningful alternatives and names the evidence, consequences, and conditions for review.",
      "projectScenario": {
        "title": "Record an architecture decision for an AI assistant",
        "description": "Frame a proposed assistant around its data, model or vendor, integrations, security boundary, observability, and operating cost. Compare viable alternatives against quality attributes, then record the decision and what would cause the team to revisit it.",
        "guardrail": "Separate measured evidence from assumptions; a cost or security estimate must not be presented as a verified fact without supporting evidence."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Frame the decision",
          "description": "Turn an architecture question into context, constraints, alternatives, quality attributes, and a decision owner."
        },
        {
          "kind": "guided",
          "title": "Compare the trade-offs",
          "description": "Work through model, vendor, data, integration, security, observability, and cost considerations, including a threat and cost view."
        },
        {
          "kind": "hands-on",
          "title": "Write and govern the decision",
          "description": "Create an ADR with evidence, assumptions, consequences, owners, and a review trigger tied to a change in usage, risk, performance, regulation, or vendor conditions."
        }
      ],
      "evidence": [
        "A decision brief with context, constraints, alternatives, and measurable quality attributes",
        "A comparison of model, vendor, data, integration, security, observability, and cost trade-offs",
        "A threat and cost assessment that distinguishes evidence from assumptions",
        "An ADR naming the decision owner, consequences, open assumptions, and review trigger"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einer nachvollziehbaren Architekturentscheidung für KI ab, die tragfähige Alternativen vergleicht und Belege, Folgen sowie Prüfanlässe festhält.",
      "projectScenario": {
        "title": "Eine Architekturentscheidung für einen KI-Assistenten dokumentieren",
        "description": "Beschreibe einen geplanten Assistenten mit Blick auf Daten, Modell oder Anbieter, Integrationen, Sicherheitsgrenzen, Beobachtbarkeit und Betriebskosten. Vergleiche geeignete Alternativen anhand messbarer Qualitätsmerkmale und halte fest, wann das Team die Entscheidung neu bewerten sollte.",
        "guardrail": "Trenne belegte Erkenntnisse von Annahmen. Kosten- oder Sicherheitsabschätzungen gelten ohne Nachweis nicht als bestätigte Fakten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Entscheidung sauber abgrenzen",
          "description": "Arbeite eine Architekturfrage mit Kontext, Randbedingungen, Alternativen, Qualitätsmerkmalen und einer entscheidungsverantwortlichen Person aus."
        },
        {
          "kind": "guided",
          "title": "Abwägungen vergleichen",
          "description": "Betrachte Modell, Anbieter, Daten, Integration, Sicherheit, Beobachtbarkeit und Kosten einschließlich Bedrohungs- und Kostenbild."
        },
        {
          "kind": "hands-on",
          "title": "Entscheidung festhalten und steuern",
          "description": "Erstelle einen ADR mit Belegen, Annahmen, Folgen, Zuständigkeiten und einem Prüfanlass bei veränderter Nutzung, Risiken, Leistung, Regulierung oder Anbieterlage."
        }
      ],
      "evidence": [
        "Eine Entscheidungsvorlage mit Kontext, Randbedingungen, Alternativen und messbaren Qualitätsmerkmalen",
        "Ein Vergleich der Abwägungen zu Modell, Anbieter, Daten, Integration, Sicherheit, Beobachtbarkeit und Kosten",
        "Eine Bedrohungs- und Kostenbetrachtung, die Belege von Annahmen trennt",
        "Ein ADR mit entscheidungsverantwortlicher Person, Folgen, offenen Annahmen und Prüfanlass"
      ]
    }
  },
  "LRN-31": {
    "en": {
      "promise": "Finish with a transparent backlog and roadmap decision that uses AI to surface gaps and trade-offs while keeping prioritization accountable to people.",
      "projectScenario": {
        "title": "Prioritize a backlog of AI product ideas",
        "description": "Take a mixed backlog with overlapping requests, uneven evidence, dependencies, and different risk levels. Normalize the items, compare them with an explicit scoring model, and prepare a roadmap recommendation that explains both selections and deferrals.",
        "guardrail": "Treat AI suggestions and scores as decision support; a product owner must validate evidence, weights, and the final priority."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Make backlog items comparable",
          "description": "Define a useful item structure for problem, outcome, evidence, dependencies, and acceptance criteria before ranking work."
        },
        {
          "kind": "guided",
          "title": "Surface gaps and trade-offs",
          "description": "Use AI to find duplicates, missing assumptions, sequencing conflicts, and stakeholder tensions, then test an explicit value, effort, risk, learning, and strategy model."
        },
        {
          "kind": "hands-on",
          "title": "Prepare a roadmap decision",
          "description": "Score a backlog, check dependencies, and write a recommendation that records the rationale and ownership for selected and deferred items."
        }
      ],
      "evidence": [
        "Normalized backlog items with problem, outcome, evidence, dependencies, and acceptance criteria",
        "A review note identifying duplicates, unsupported assumptions, or sequencing conflicts",
        "A prioritization rubric with stated weights for value, effort, risk, learning, and strategic fit",
        "A roadmap decision log explaining selections, deferrals, and the human decision owner"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einer transparenten Backlog- und Roadmap-Entscheidung ab, bei der KI Lücken und Zielkonflikte sichtbar macht und Menschen die Priorisierung verantworten.",
      "projectScenario": {
        "title": "Einen Backlog mit KI-Produktideen priorisieren",
        "description": "Arbeite mit einem gemischten Backlog aus überlappenden Wünschen, unterschiedlich belastbaren Belegen, Abhängigkeiten und verschiedenen Risikostufen. Vereinheitliche die Einträge, vergleiche sie anhand eines expliziten Bewertungsmodells und begründe Auswahl und Zurückstellung in einer Roadmap-Empfehlung.",
        "guardrail": "KI-Vorschläge und Punktwerte dienen der Entscheidungsunterstützung. Product Owner prüfen Belege und Gewichtung und verantworten die endgültige Priorität."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Backlog-Einträge vergleichbar machen",
          "description": "Lege vor der Priorisierung eine gemeinsame Struktur für Problem, Ergebnis, Belege, Abhängigkeiten und Akzeptanzkriterien fest."
        },
        {
          "kind": "guided",
          "title": "Lücken und Zielkonflikte erkennen",
          "description": "Lass Dubletten, fehlende Annahmen, Reihenfolgekonflikte und Stakeholder-Spannungen sichtbar machen und prüfe ein Modell für Wert, Aufwand, Risiko, Lerngewinn und Strategie."
        },
        {
          "kind": "hands-on",
          "title": "Eine Roadmap-Entscheidung vorbereiten",
          "description": "Bewerte einen Backlog, prüfe Abhängigkeiten und formuliere eine Empfehlung mit Begründung und Zuständigkeit für ausgewählte wie zurückgestellte Punkte."
        }
      ],
      "evidence": [
        "Vereinheitlichte Backlog-Einträge mit Problem, Ergebnis, Belegen, Abhängigkeiten und Akzeptanzkriterien",
        "Ein Prüfvermerk zu Dubletten, unbelegten Annahmen oder Reihenfolgekonflikten",
        "Ein Priorisierungsraster mit ausgewiesener Gewichtung für Wert, Aufwand, Risiko, Lerngewinn und strategische Passung",
        "Ein Roadmap-Entscheidungsprotokoll mit Begründungen für Auswahl und Zurückstellung sowie menschlicher Zuständigkeit"
      ]
    }
  },
  "LRN-29": {
    "en": {
      "promise": "Complete the course with a governed test-data choice that balances privacy, test utility, coverage, realism, and leakage risk.",
      "projectScenario": {
        "title": "Choose safe data for an AI test suite",
        "description": "Review a proposed test dataset and representative test cases. Classify sensitive fields, decide whether masking, generation, sampling, or simulation fits each need, and assess whether the resulting data covers behavior without exposing source records.",
        "guardrail": "Do not treat masked or synthetic records as safe by default; check re-identification, memorization, and leakage risks against the source."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Balance privacy and test utility",
          "description": "Relate field sensitivity, permitted transformation, retention, and required behavior to the choice of test-data method."
        },
        {
          "kind": "guided",
          "title": "Select and inspect a data method",
          "description": "Compare masking, generation, sampling, and simulation for example test needs, then review coverage, realism, bias, memorization, and leakage."
        },
        {
          "kind": "hands-on",
          "title": "Govern a reusable test dataset",
          "description": "Document provenance, approval, known limitations, expiry, and safe reuse rules for a dataset and its evaluation checks."
        }
      ],
      "evidence": [
        "A field classification covering sensitivity, utility, retention, and allowed transformation",
        "A rationale for selecting masking, generation, sampling, or simulation for each test need",
        "A coverage and risk review for realism, bias, memorization, and leakage against source records",
        "A dataset record with provenance, approval, limitations, expiry, and reuse conditions"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einer nachvollziehbar dokumentierten Testdatenwahl ab, die Datenschutz, Testnutzen, Abdeckung, Realitätsnähe und Offenlegungsrisiken abwägt.",
      "projectScenario": {
        "title": "Sichere Daten für eine KI-Testsuite auswählen",
        "description": "Prüfe einen vorgeschlagenen Testdatensatz und passende Testfälle. Klassifiziere schutzbedürftige Felder, wähle je nach Testzweck Maskierung, Generierung, Stichprobe oder Simulation und beurteile, ob die Daten benötigtes Verhalten abdecken, ohne Quelldatensätze offenzulegen.",
        "guardrail": "Maskierte oder synthetische Datensätze gelten nicht automatisch als sicher. Prüfe Reidentifizierung, Memorierung und Datenabfluss anhand der Quelldaten."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Datenschutz und Testnutzen abwägen",
          "description": "Ordne Feldsensibilität, zulässige Transformation, Aufbewahrung und benötigtes Verhalten der passenden Testdatenmethode zu."
        },
        {
          "kind": "guided",
          "title": "Eine Datenmethode auswählen und prüfen",
          "description": "Vergleiche Maskierung, Generierung, Stichprobe und Simulation für Beispieltests und prüfe Abdeckung, Realitätsnähe, Verzerrungen, Memorierung und Datenabfluss."
        },
        {
          "kind": "hands-on",
          "title": "Einen wiederverwendbaren Testdatensatz steuern",
          "description": "Dokumentiere Herkunft, Freigabe, bekannte Grenzen, Ablaufdatum und Regeln zur sicheren Wiederverwendung sowie passende Prüfungen."
        }
      ],
      "evidence": [
        "Eine Feldklassifikation zu Schutzbedarf, Testnutzen, Aufbewahrung und zulässiger Transformation",
        "Eine begründete Wahl von Maskierung, Generierung, Stichprobe oder Simulation je Testzweck",
        "Eine Prüfung von Abdeckung und Risiken für Realitätsnähe, Verzerrung, Memorierung und Datenabfluss gegenüber der Quelle",
        "Ein Datensatzsteckbrief mit Herkunft, Freigabe, Grenzen, Ablaufdatum und Wiederverwendungsbedingungen"
      ]
    }
  },
  "LRN-34": {
    "en": {
      "promise": "Finish with a bounded ERP or CRM pilot design that connects AI value to process boundaries, data ownership, integrations, and exception handling.",
      "projectScenario": {
        "title": "Assess an AI use case across CRM and ERP",
        "description": "Map a customer-process use case from the CRM interaction through its system of record and any ERP handoff. Compare an embedded vendor feature with a custom extension, then define a pilot that reflects real process cases and exceptions.",
        "guardrail": "Keep transaction controls, authorizations, and audit requirements intact; the AI step must not bypass the ERP or CRM system of record."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Locate the use case in the business system",
          "description": "Trace process steps, systems of record, data owners, and integration boundaries across SAP, Salesforce, Microsoft business solutions, or other ERP and CRM contexts."
        },
        {
          "kind": "guided",
          "title": "Compare fit and integration paths",
          "description": "Assess embedded features and custom extensions for business value, data flow, lock-in, operational effort, and control implications."
        },
        {
          "kind": "hands-on",
          "title": "Specify a representative pilot",
          "description": "Set pilot scope, process cases, exceptions, accountable owners, and measurable business outcomes for the chosen ERP or CRM workflow."
        }
      ],
      "evidence": [
        "A process map naming the system of record, data owner, and integration boundary",
        "A control check showing where transaction authorization and audit requirements apply",
        "A comparison of an embedded feature and a custom extension across value, data flow, lock-in, and operations effort",
        "A pilot brief with representative cases, exception paths, owners, and measurable outcomes"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem klar abgegrenzten Pilotkonzept für ERP oder CRM ab, das den KI-Nutzen mit Prozessgrenzen, Datenverantwortung, Integrationen und Ausnahmefällen verknüpft.",
      "projectScenario": {
        "title": "Einen KI-Anwendungsfall über CRM und ERP hinweg bewerten",
        "description": "Zeichne einen Anwendungsfall im Kundenprozess vom CRM-Kontakt über das führende System bis zu einer möglichen ERP-Übergabe nach. Vergleiche eine eingebettete Herstellerfunktion mit einer individuellen Erweiterung und entwirf einen Pilot mit realistischen Prozessfällen und Ausnahmen.",
        "guardrail": "Transaktionskontrollen, Berechtigungen und Auditvorgaben bleiben erhalten. Der KI-Schritt darf das führende ERP- oder CRM-System nicht umgehen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Den Anwendungsfall im Geschäftssystem verorten",
          "description": "Verfolge Prozessschritte, führende Systeme, Datenverantwortliche und Integrationsgrenzen in SAP, Salesforce, Microsoft-Geschäftslösungen oder anderen ERP- und CRM-Umgebungen."
        },
        {
          "kind": "guided",
          "title": "Eignung und Integrationswege vergleichen",
          "description": "Bewerte eingebettete Funktionen und individuelle Erweiterungen nach Geschäftswert, Datenfluss, Bindung an Anbieter, Betriebsaufwand und Auswirkungen auf Kontrollen."
        },
        {
          "kind": "hands-on",
          "title": "Einen repräsentativen Pilot festlegen",
          "description": "Bestimme Umfang, Prozessfälle, Ausnahmen, Verantwortliche und messbare Geschäftsergebnisse für den gewählten ERP- oder CRM-Prozess."
        }
      ],
      "evidence": [
        "Eine Prozessübersicht mit führendem System, Datenverantwortung und Integrationsgrenze",
        "Eine Kontrollprüfung mit den geltenden Transaktionsberechtigungen und Auditvorgaben",
        "Ein Vergleich von Herstellerfunktion und individueller Erweiterung nach Wert, Datenfluss, Anbieterbindung und Betriebsaufwand",
        "Ein Pilotbrief mit repräsentativen Fällen, Ausnahmewegen, Verantwortlichen und messbaren Ergebnissen"
      ]
    }
  },
  "LRN-35": {
    "en": {
      "promise": "Complete the course with an architecture sketch that places an AI workload across device, data platform, cloud, and consuming systems according to explicit constraints.",
      "projectScenario": {
        "title": "Place an AI workload for device telemetry",
        "description": "Trace telemetry from its source through ingestion, storage, processing, model inference, and a consuming system. Compare edge, cloud, batch, and streaming placement against latency, availability, sovereignty, security, quality, and operating-cost needs.",
        "guardrail": "State the assumptions behind latency, volume, and availability estimates; do not present an unmeasured platform choice as a proven fit."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Follow data from source to decision",
          "description": "Understand the path from device or source through platform layers to a model and its consuming system, with ownership and boundaries visible."
        },
        {
          "kind": "guided",
          "title": "Choose a processing placement",
          "description": "Compare edge, cloud, batch, and streaming approaches against workload latency, scale, sovereignty, security, data quality, and observability needs."
        },
        {
          "kind": "hands-on",
          "title": "Sketch the operating architecture",
          "description": "Draw the data flow, name owners, failure paths, test signals, and scale assumptions, then explain why the chosen placement fits."
        }
      ],
      "evidence": [
        "A data-flow sketch from device or source through ingestion, storage, processing, model, and consumer",
        "A requirement note for latency, availability, sovereignty, security, data quality, and observability",
        "A placement comparison covering edge, cloud, batch, and streaming trade-offs",
        "An architecture sketch with owners, failure paths, test signals, and stated scale assumptions"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einer Architekturübersicht ab, die eine KI-Anwendung anhand expliziter Randbedingungen auf Gerät, Datenplattform, Cloud und Zielsystem platziert.",
      "projectScenario": {
        "title": "Eine KI-Verarbeitung für Gerätetelemetrie platzieren",
        "description": "Verfolge Telemetriedaten von der Quelle über Aufnahme, Speicherung und Verarbeitung bis zur Modellinferenz und zum Zielsystem. Vergleiche Edge, Cloud, Batch und Streaming anhand von Latenz, Verfügbarkeit, Datenhoheit, Sicherheit, Datenqualität und Betriebskosten.",
        "guardrail": "Mache Annahmen zu Latenz, Datenvolumen und Verfügbarkeit kenntlich. Eine nicht gemessene Plattformwahl ist kein nachgewiesener Architekturfit."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Daten von der Quelle bis zur Entscheidung verfolgen",
          "description": "Verstehe den Weg vom Gerät oder Ursprung über Plattformschichten bis zum Modell und Zielsystem; Zuständigkeiten und Grenzen bleiben sichtbar."
        },
        {
          "kind": "guided",
          "title": "Den Verarbeitungsort abwägen",
          "description": "Vergleiche Edge, Cloud, Batch und Streaming anhand von Latenz, Skalierung, Datenhoheit, Sicherheit, Datenqualität und Beobachtbarkeit."
        },
        {
          "kind": "hands-on",
          "title": "Die Betriebsarchitektur skizzieren",
          "description": "Zeichne Datenfluss und Zuständigkeiten ein, benenne Fehlerpfade, Prüfsignale und Skalierungsannahmen und begründe die gewählte Platzierung."
        }
      ],
      "evidence": [
        "Eine Datenflussskizze von Gerät oder Quelle über Aufnahme, Speicherung, Verarbeitung und Modell bis zum Zielsystem",
        "Eine Anforderungsliste zu Latenz, Verfügbarkeit, Datenhoheit, Sicherheit, Datenqualität und Beobachtbarkeit",
        "Ein Vergleich der Platzierungsoptionen Edge, Cloud, Batch und Streaming",
        "Eine Architekturübersicht mit Zuständigkeiten, Fehlerpfaden, Prüfsignalen und benannten Skalierungsannahmen"
      ]
    }
  },
  "LRN-38": {
    "en": {
      "promise": "Finish with a human review workflow that assigns real decision authority, sets approval and escalation paths, and makes review quality measurable.",
      "projectScenario": {
        "title": "Design review for an AI-supported decision",
        "description": "Take a workflow where AI summarizes evidence or drafts a recommendation. Decide which cases require review using impact, uncertainty, reversibility, and policy; give reviewers the context and time to approve, revise, reject, or escalate.",
        "guardrail": "A reviewer must make an independent decision; a click-through approval or an AI confidence score alone is not a review."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Match review to decision impact",
          "description": "Use impact, uncertainty, reversibility, and policy to identify where human review is needed and what authority the reviewer must hold."
        },
        {
          "kind": "guided",
          "title": "Build the approval and escalation paths",
          "description": "Assign review roles, required evidence, service levels, and approve, revise, reject, and escalate outcomes."
        },
        {
          "kind": "hands-on",
          "title": "Instrument review quality",
          "description": "Draft a workflow and checklist, then choose signals for disagreement, overrides, rework, delay, and downstream harm."
        }
      ],
      "evidence": [
        "A case classification tied to impact, uncertainty, reversibility, and policy",
        "A reviewer role with stated decision authority, context, and time expectations",
        "A workflow for approve, revise, reject, and escalate decisions with audit records",
        "A quality measure set covering disagreement, overrides, rework, delay, and downstream harm"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem menschlichen Prüfablauf ab, der echte Entscheidungsbefugnisse zuordnet, Freigabe- und Eskalationswege festlegt und Prüfqualität messbar macht.",
      "projectScenario": {
        "title": "Eine Prüfung für eine KI-gestützte Entscheidung entwerfen",
        "description": "Betrachte einen Ablauf, in dem KI Belege zusammenfasst oder eine Empfehlung entwirft. Lege anhand von Auswirkung, Unsicherheit, Umkehrbarkeit und Richtlinien fest, welche Fälle geprüft werden. Stelle sicher, dass Prüfende den nötigen Kontext und ausreichend Zeit haben, um freizugeben, zu überarbeiten, abzulehnen oder zu eskalieren.",
        "guardrail": "Prüfende müssen eigenständig entscheiden. Ein Bestätigungsklick oder ein KI-Konfidenzwert allein ist keine Prüfung."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Prüfung an der Entscheidungswirkung ausrichten",
          "description": "Nutze Auswirkung, Unsicherheit, Umkehrbarkeit und Richtlinien, um Prüfbedarf und erforderliche Befugnisse zu bestimmen."
        },
        {
          "kind": "guided",
          "title": "Freigabe- und Eskalationswege aufbauen",
          "description": "Lege Prüfrollen, erforderliche Belege, Servicezeiten und die Pfade für Freigabe, Überarbeitung, Ablehnung und Eskalation fest."
        },
        {
          "kind": "hands-on",
          "title": "Prüfqualität messbar machen",
          "description": "Entwirf Ablauf und Checkliste und wähle Signale für Abweichungen, Übersteuerungen, Nacharbeit, Verzögerungen und Folgeschäden."
        }
      ],
      "evidence": [
        "Eine Fallklassifikation anhand von Auswirkung, Unsicherheit, Umkehrbarkeit und Richtlinien",
        "Eine Prüfrolle mit festgehaltener Entscheidungsbefugnis, Kontext und Zeiterwartung",
        "Ein Ablauf für Freigabe, Überarbeitung, Ablehnung und Eskalation mit Prüfprotokoll",
        "Ein Kennzahlenset zu abweichenden Einschätzungen, Übersteuerungen, Nacharbeit, Verzögerungen und Folgeschäden"
      ]
    }
  },
  "LRN-43": {
    "en": {
      "promise": "Complete the course with an operating-model blueprint that lets multiple teams scale AI through clear decision rights, reusable standards, support, and review cadence.",
      "projectScenario": {
        "title": "Set up an AI operating model for several teams",
        "description": "Design how product, engineering, data, security, compliance, and business teams share responsibilities as AI work grows. Define the center or community's services, standards backlog, reusable asset registry, intake and portfolio cadence, and adoption measures.",
        "guardrail": "Make decision rights explicit so a shared center enables consistent practice without obscuring who owns each product and risk decision."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Clarify roles and decision rights",
          "description": "Map responsibilities across product, engineering, data, security, compliance, and business, including what belongs centrally and what stays with teams."
        },
        {
          "kind": "guided",
          "title": "Shape shared services and governance",
          "description": "Work through standards, review gates, platforms, reusable assets, and an intake cadence that balances experimentation, reuse, risk, and value."
        },
        {
          "kind": "hands-on",
          "title": "Plan the operating-model rollout",
          "description": "Create a roadmap with owners, capability gaps, adoption measures, and review milestones for the proposed AI operating model or Center of Excellence."
        }
      ],
      "evidence": [
        "A role charter with decision rights across business, product, engineering, data, security, and compliance",
        "A standards and shared-services backlog with review gates and reusable assets",
        "An intake and portfolio cadence showing how experiments, reuse, risk, and value are considered",
        "An operating-model roadmap with owners, capability gaps, adoption measures, and milestones"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem Betriebsmodell ab, das mehreren Teams ermöglicht, KI mit klaren Entscheidungsrechten, wiederverwendbaren Standards, Unterstützungsangeboten und festen Prüfrhythmen auszubauen.",
      "projectScenario": {
        "title": "Ein Betriebsmodell für mehrere KI-Teams aufsetzen",
        "description": "Gestalte die Zusammenarbeit von Produkt, Engineering, Data, Security, Compliance und Fachbereichen, wenn KI-Vorhaben wachsen. Definiere Leistungen des Centers oder Netzwerks, einen Backlog für Standards, ein Verzeichnis wiederverwendbarer Bausteine, einen Rhythmus für Anfragen und Portfolioentscheidungen sowie Kennzahlen zur Einführung und Nutzung.",
        "guardrail": "Mache Entscheidungsrechte transparent: Eine gemeinsame Stelle fördert einheitliche Arbeitsweisen, ohne die Verantwortung für Produkt- und Risikoentscheidungen zu verwischen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Rollen und Entscheidungsrechte klären",
          "description": "Ordne Verantwortlichkeiten in Produkt, Engineering, Data, Security, Compliance und Fachbereichen zu und grenze zentrale von teamnahen Aufgaben ab."
        },
        {
          "kind": "guided",
          "title": "Gemeinsame Leistungen und Governance gestalten",
          "description": "Arbeite Standards, Prüftore, Plattformen, wiederverwendbare Bausteine und einen Rhythmus für neue Anfragen aus, der Experimente, Wiederverwendung, Risiko und Wert abwägt."
        },
        {
          "kind": "hands-on",
          "title": "Die Einführung planen",
          "description": "Erstelle für das Betriebsmodell oder Center of Excellence eine Roadmap mit Verantwortlichen, Kompetenzlücken, Adoptionsmaßen und Prüfterminen."
        }
      ],
      "evidence": [
        "Ein Rollenauftrag mit Entscheidungsrechten für Fachbereich, Produkt, Engineering, Data, Security und Compliance",
        "Ein Backlog für Standards und gemeinsame Leistungen mit Prüftoren und wiederverwendbaren Bausteinen",
        "Ein Intake- und Portfoliorhythmus, der Experimente, Wiederverwendung, Risiken und Wert berücksichtigt",
        "Eine Roadmap mit Verantwortlichen, Kompetenzlücken, Adoptionsmaßen und Meilensteinen"
      ]
    }
  },
  "LRN-37": {
    "en": {
      "promise": "Finish with an AI-assisted service-desk flow grounded in approved support knowledge, with explicit confidence thresholds, handoffs, and operating measures.",
      "projectScenario": {
        "title": "Automate a recurring support-ticket pattern",
        "description": "Review a recurring ticket category with a known resolution and meaningful exceptions. Turn approved knowledge into a source-grounded runbook, then design where AI can guide resolution, where it must stop, and when a person takes over.",
        "guardrail": "Use approved support sources and defined stop conditions; do not let an uncertain answer trigger an unreviewed privileged change."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Find support patterns worth assisting",
          "description": "Analyze tickets by intent, root cause, known resolution, exception rate, and automation risk."
        },
        {
          "kind": "guided",
          "title": "Turn knowledge into safe runbook steps",
          "description": "Write source-grounded steps with prerequisites and stop conditions, then set confidence thresholds, human handoff, logging, and rollback for the support flow."
        },
        {
          "kind": "hands-on",
          "title": "Evaluate the support workflow",
          "description": "Define checks for resolution accuracy, containment, escalation quality, rework, and knowledge freshness, including cases that must hand off."
        }
      ],
      "evidence": [
        "A ticket-pattern analysis covering intent, root cause, resolution, exceptions, and automation risk",
        "A runbook with source references, prerequisites, and explicit stop conditions",
        "A flow design with confidence thresholds, human handoff, logging, and rollback",
        "An evaluation plan for accuracy, containment, escalation quality, rework, and knowledge freshness"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem KI-gestützten Service-Desk-Ablauf ab, der auf freigegebenem Supportwissen beruht und Konfidenzschwellen, Übergaben und Betriebskennzahlen klar festlegt.",
      "projectScenario": {
        "title": "Ein wiederkehrendes Support-Ticketmuster automatisiert unterstützen",
        "description": "Prüfe eine wiederkehrende Ticketkategorie mit bekannter Lösung und relevanten Ausnahmen. Überführe freigegebenes Wissen in ein quellengebundenes Runbook und lege fest, wobei KI die Lösung unterstützen kann, wann sie stoppen muss und wann ein Mensch übernimmt.",
        "guardrail": "Verwende freigegebene Supportquellen und eindeutige Abbruchbedingungen. Eine unsichere Antwort darf keine ungeprüfte privilegierte Änderung auslösen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Geeignete Supportmuster erkennen",
          "description": "Analysiere Tickets nach Absicht, Ursache, bekannter Lösung, Ausnahmequote und Automatisierungsrisiko."
        },
        {
          "kind": "guided",
          "title": "Wissen in sichere Runbook-Schritte überführen",
          "description": "Formuliere quellenbasierte Schritte mit Voraussetzungen und Abbruchbedingungen. Ergänze Konfidenzschwellen, menschliche Übergabe, Protokollierung und Rücknahme für den Supportablauf."
        },
        {
          "kind": "hands-on",
          "title": "Den Supportablauf bewerten",
          "description": "Lege Prüfungen für Lösungsgenauigkeit, eigenständige Lösungsquote, Eskalationsqualität, Nacharbeit und Aktualität des Wissens fest – einschließlich zwingender Übergaben."
        }
      ],
      "evidence": [
        "Eine Ticketmusteranalyse zu Absicht, Ursache, Lösung, Ausnahmen und Automatisierungsrisiko",
        "Ein Runbook mit Quellenangaben, Voraussetzungen und eindeutigen Abbruchbedingungen",
        "Ein Ablaufentwurf mit Konfidenzschwellen, menschlicher Übergabe, Protokollierung und Rücknahme",
        "Ein Evaluationsplan zu Genauigkeit, eigenständiger Lösung, Eskalationsqualität, Nacharbeit und Aktualität des Wissens"
      ]
    }
  },
  "LRN-14": {
    "en": {
      "promise": "Complete the course with a security-triage package that maps an AI idea's trust boundaries, likely abuse paths, owners, evidence gaps, and escalation priority.",
      "projectScenario": {
        "title": "Triage a business team's AI proposal",
        "description": "Review a proposal that uses business data, an external AI service, and one or more connected tools. Map the data, identities, untrusted inputs, outputs, and privileged actions; identify likely abuse and leakage paths; package the questions that need specialist review.",
        "guardrail": "Use sanitized or hypothetical details for triage; do not include live credentials, sensitive records, or instructions to test an attack against a real system."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Map the AI security boundary",
          "description": "Trace data, identities, external services, untrusted inputs, outputs, and privileged actions across the proposed workflow."
        },
        {
          "kind": "guided",
          "title": "Recognize common abuse paths",
          "description": "Check for prompt injection, data leakage, excessive permissions, supply-chain exposure, and retention risks, then identify immediate containment needs."
        },
        {
          "kind": "hands-on",
          "title": "Prepare a review-ready triage",
          "description": "Record risk owners, evidence, unanswered questions, mitigations, and escalation priority for security specialists."
        }
      ],
      "evidence": [
        "A boundary map covering data, identities, services, inputs, outputs, and privileged actions",
        "Abuse cases for prompt injection, leakage, excessive permissions, supply chain, and retention",
        "A short list of immediate containment and safe-design requirements",
        "A triage handoff with risk owners, evidence, open questions, and escalation priority"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem Sicherheitstriage-Paket ab, das Vertrauensgrenzen, mögliche Missbrauchswege, Verantwortliche, Beleglücken und Eskalationspriorität eines KI-Vorhabens erfasst.",
      "projectScenario": {
        "title": "Einen KI-Vorschlag aus einem Fachteam triagieren",
        "description": "Prüfe einen Vorschlag, der Geschäftsdaten, einen externen KI-Dienst und angebundene Werkzeuge nutzt. Zeichne Daten, Identitäten, nicht vertrauenswürdige Eingaben, Ausgaben und privilegierte Aktionen nach. Ermittle mögliche Missbrauchs- und Abflusswege und bündle offene Fragen für die Fachprüfung.",
        "guardrail": "Verwende bei der Triage anonymisierte oder hypothetische Angaben. Keine echten Zugangsdaten, sensiblen Datensätze oder Anleitungen zum Angriff auf ein reales System einbringen."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Sicherheitsgrenze der KI-Lösung erfassen",
          "description": "Verfolge Daten, Identitäten, externe Dienste, nicht vertrauenswürdige Eingaben, Ausgaben und privilegierte Aktionen im geplanten Ablauf."
        },
        {
          "kind": "guided",
          "title": "Typische Missbrauchswege erkennen",
          "description": "Prüfe Prompt-Injection, Datenabfluss, übermäßige Berechtigungen, Risiken in der Lieferkette und Aufbewahrung und bestimme sofort nötige Eindämmung."
        },
        {
          "kind": "hands-on",
          "title": "Eine prüffähige Triage erstellen",
          "description": "Halte Risikoverantwortliche, Belege, offene Fragen, Schutzmaßnahmen und Eskalationspriorität für die Sicherheitsprüfung fest."
        }
      ],
      "evidence": [
        "Eine Grenzenskizze zu Daten, Identitäten, Diensten, Eingaben, Ausgaben und privilegierten Aktionen",
        "Missbrauchsfälle zu Prompt-Injection, Datenabfluss, übermäßigen Berechtigungen, Lieferkette und Aufbewahrung",
        "Eine kurze Liste sofort nötiger Eindämmungs- und Gestaltungsmaßnahmen",
        "Eine Triage-Übergabe mit Risikoverantwortlichen, Belegen, offenen Fragen und Eskalationspriorität"
      ]
    }
  },
  "LRN-27": {
    "en": {
      "promise": "Finish with a reusable prompt entry that has a clear owner, approved inputs, output contract, evaluation examples, and rules for change or retirement.",
      "projectScenario": {
        "title": "Govern a shared prompt for meeting briefs",
        "description": "Package a prompt used to draft concise meeting briefs from approved project material. Specify its purpose, required context, permitted inputs, output shape, limitations, representative examples, and how feedback or regressions lead to revision or retirement.",
        "guardrail": "Keep access and source permissions attached to the material used; publishing a reusable prompt does not approve every input or output for sharing."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Treat prompts as owned reusable patterns",
          "description": "Define the purpose, input boundaries, context requirements, output contract, and known limitations that make a prompt safe to reuse."
        },
        {
          "kind": "guided",
          "title": "Add examples and quality checks",
          "description": "Attach representative inputs and expected outputs, then choose checks that expose quality or safety regressions."
        },
        {
          "kind": "hands-on",
          "title": "Set the library lifecycle",
          "description": "Assign an owner, version, approval and access rules, change history, usage feedback, and criteria to update, restrict, merge, or retire the prompt."
        }
      ],
      "evidence": [
        "A prompt card with purpose, approved inputs, context needs, output contract, and limitations",
        "Representative examples with evaluation checks for quality and safety",
        "An ownership and version record with approval, access, and change history",
        "A review rule for feedback, regression, restriction, merging, and retirement"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem wiederverwendbaren Prompt-Eintrag ab, der Zuständigkeit, freigegebene Eingaben, Ausgabeformat, Bewertungsbeispiele und Regeln für Änderungen oder Aussonderung festhält.",
      "projectScenario": {
        "title": "Einen gemeinsamen Prompt für Meeting-Briefings steuern",
        "description": "Bereite einen Prompt für kompakte Meeting-Briefings aus freigegebenem Projektmaterial als wiederverwendbaren Bibliothekseintrag auf. Beschreibe Zweck, erforderlichen Kontext, erlaubte Eingaben, Ausgabeform, Grenzen und repräsentative Beispiele. Lege auch fest, wie Rückmeldungen oder Qualitätsrückgänge zu Anpassung oder Aussonderung führen.",
        "guardrail": "Zugriffsrechte und Quellenberechtigungen gelten auch für die verwendeten Inhalte. Ein wiederverwendbarer Prompt gibt nicht jede Eingabe und Ausgabe zur Weitergabe frei."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Prompts als verantwortete Muster behandeln",
          "description": "Lege Zweck, Eingabegrenzen, Kontextbedarf, Ausgabeformat und bekannte Grenzen fest, die eine sichere Wiederverwendung ermöglichen."
        },
        {
          "kind": "guided",
          "title": "Beispiele und Qualitätsprüfungen ergänzen",
          "description": "Hinterlege repräsentative Eingaben und erwartete Ergebnisse und wähle Prüfungen, die Qualitäts- oder Sicherheitsrückschritte sichtbar machen."
        },
        {
          "kind": "hands-on",
          "title": "Den Lebenszyklus der Bibliothek festlegen",
          "description": "Bestimme Zuständigkeit, Version, Freigabe- und Zugriffsregeln, Änderungshistorie, Nutzungsfeedback und Kriterien für Anpassung, Einschränkung, Zusammenführung oder Aussonderung."
        }
      ],
      "evidence": [
        "Eine Prompt-Karte mit Zweck, freigegebenen Eingaben, Kontextbedarf, Ausgabeformat und Grenzen",
        "Repräsentative Beispiele mit Qualitäts- und Sicherheitsprüfungen",
        "Ein Zuständigkeits- und Versionsnachweis mit Freigabe, Zugriff und Änderungshistorie",
        "Eine Prüfroutine für Feedback, Qualitätsrückschritte, Einschränkung, Zusammenführung und Aussonderung"
      ]
    }
  },
  "LRN-26": {
    "en": {
      "promise": "Complete the course with a task-scoped delivery harness that carries state and runtime evidence across sessions and blocks readiness when scope, verification, or review is incomplete.",
      "projectScenario": {
        "title": "Coordinate an agent across one repository change",
        "description": "Set up a coding-agent workflow for one bounded repository task. Make repository instructions, durable state, allowed scope, runtime feedback, verification, independent review, and the next handoff visible in a report; choose a bounded loop or explicit graph for coordination.",
        "guardrail": "A readiness report can support human approval, but it does not authorize an automatic merge, release, or production change."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Understand the reliability gap",
          "description": "Separate instructions, persisted state, task scope, feedback, verification, review, and handoff so a prompt alone does not stand in for control."
        },
        {
          "kind": "guided",
          "title": "Assemble the workbench",
          "description": "Trace one change through repository structure, session continuity, scope checks, runtime evidence, fail-closed verification, and review."
        },
        {
          "kind": "hands-on",
          "title": "Choose and inspect the coordination flow",
          "description": "Build a small report around a bounded loop or explicit graph, test an incomplete candidate, and make the next human or session handoff actionable."
        }
      ],
      "evidence": [
        "A task contract with allowed scope and required checks",
        "A report carrying instructions, persisted state, scope results, runtime feedback, verification, and independent review",
        "A failure case showing readiness blocked when required evidence or review is missing",
        "A handoff that names the next owner and action without implying automatic deployment"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem verlässlichen Arbeitsrahmen für eine klar begrenzte Agentenaufgabe ab. Er erhält Status und Laufzeitbelege über Sitzungen hinweg und verhindert eine Freigabe, solange Umfang, Verifikation oder unabhängige Prüfung unvollständig sind.",
      "projectScenario": {
        "title": "Einen Agenten bei einer Repository-Änderung koordinieren",
        "description": "Richte einen Coding-Agent-Ablauf für eine klar abgegrenzte Repository-Aufgabe ein. Mache Repository-Anweisungen, dauerhaften Status, erlaubten Umfang, Laufzeitfeedback, Verifikation, unabhängige Prüfung und nächste Übergabe in einem Bericht sichtbar. Wähle dafür eine begrenzte Schleife oder einen expliziten Graphen.",
        "guardrail": "Ein Freigabereife-Bericht kann eine menschliche Freigabe unterstützen, autorisiert aber weder automatisches Mergen noch Release oder Änderung im Produktivbetrieb."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Zuverlässigkeitslücke verstehen",
          "description": "Trenne Anweisungen, gespeicherten Status, Aufgabenumfang, Feedback, Verifikation, Prüfung und Übergabe, damit Eingabeaufforderungen die nötigen Kontrollen nicht ersetzen."
        },
        {
          "kind": "guided",
          "title": "Die Workbench zusammensetzen",
          "description": "Verfolge eine Änderung durch Repository-Struktur, Sitzungskontinuität, Umfangsprüfungen, Laufzeitbelege, Verifikation mit sicherem Abbruch und Prüfung."
        },
        {
          "kind": "hands-on",
          "title": "Den Koordinationsablauf auswählen und prüfen",
          "description": "Erstelle einen kleinen Bericht für eine begrenzte Schleife oder einen expliziten Graphen, teste einen unvollständigen Kandidaten und formuliere eine umsetzbare Übergabe an Mensch oder Folgesitzung."
        }
      ],
      "evidence": [
        "Ein Aufgabenvertrag mit erlaubtem Umfang und erforderlichen Prüfungen",
        "Ein Bericht mit Anweisungen, gespeichertem Status, Umfangsprüfung, Laufzeitfeedback, Verifikation und unabhängiger Prüfung",
        "Ein Fehlerfall, der die gesperrte Freigabereife bei fehlenden Belegen oder Prüfungen zeigt",
        "Eine Übergabe mit nächster zuständiger Person und Aktion, ohne automatische Bereitstellung zu unterstellen"
      ]
    }
  },
  "LRN-45": {
    "en": {
      "promise": "Finish with a source-checked account brief and a defensible customer use-case pitch tailored to a defined audience, with claims reviewed before sharing.",
      "projectScenario": {
        "title": "Prepare for a customer discovery meeting",
        "description": "Research an account, its industry, competitors, and technology signals; map a customer challenge to a portfolio-aligned solution hypothesis; then draft a concise briefing and pitch for the meeting audience.",
        "guardrail": "Keep source evidence attached to customer claims; remove unsupported statements and confidential material before anything is shared externally."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Build a reliable account view",
          "description": "Use market and account signals with explicit source checks, distinguishing observed facts from hypotheses about customer needs."
        },
        {
          "kind": "guided",
          "title": "Map customer challenges to use cases",
          "description": "Connect a customer signal to a relevant solution hypothesis and assess business logic, evidence, value, risk, and stakeholder fit."
        },
        {
          "kind": "hands-on",
          "title": "Draft and review customer materials",
          "description": "Create a pitch, one-pager, or meeting briefing for a defined audience and review every claim for evidence, confidentiality, and tone."
        }
      ],
      "evidence": [
        "An account and market brief with source checks for industry, competitor, and technology signals",
        "A customer-challenge map linking pain points to solution hypotheses and portfolio fit",
        "A use-case assessment covering business logic, evidence, value, risk, and stakeholder fit",
        "A reviewed pitch, one-pager, or meeting brief with unsupported and confidential claims removed"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem quellengeprüften Kundenbriefing und einem begründeten, auf eine Zielgruppe zugeschnittenen Use-Case-Pitch ab, dessen Aussagen vor der Weitergabe geprüft wurden.",
      "projectScenario": {
        "title": "Ein Kundengespräch zur Bedarfsermittlung vorbereiten",
        "description": "Recherchiere Unternehmen, Branche, Wettbewerb und Technologiesignale. Ordne eine Kundenherausforderung einer passenden Lösungshypothese aus dem Portfolio zu und erstelle ein kompaktes Briefing sowie einen Pitch für die Gesprächszielgruppe.",
        "guardrail": "Belege bleiben den Kundenaussagen zugeordnet. Unbelegte Aussagen und vertrauliche Inhalte werden vor einer externen Weitergabe entfernt."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Ein belastbares Kundenbild erstellen",
          "description": "Nutze Markt- und Kundensignale mit expliziter Quellenprüfung und trenne beobachtete Fakten von Hypothesen zum Bedarf."
        },
        {
          "kind": "guided",
          "title": "Kundenherausforderungen Use Cases zuordnen",
          "description": "Verbinde ein Kundensignal mit einer passenden Lösungshypothese und prüfe Geschäftslogik, Belege, Wert, Risiko und Stakeholder-Passung."
        },
        {
          "kind": "hands-on",
          "title": "Kundenmaterial erstellen und prüfen",
          "description": "Erstelle für eine definierte Zielgruppe einen Pitch, One-Pager oder Gesprächstermin-Brief und prüfe Aussagen auf Belege, Vertraulichkeit und Ton."
        }
      ],
      "evidence": [
        "Ein Kunden- und Marktbriefing mit Quellenprüfung zu Branche, Wettbewerb und Technologiesignalen",
        "Eine Zuordnung von Kundenherausforderungen zu Lösungshypothesen und Portfolio-Passung",
        "Eine Use-Case-Bewertung zu Geschäftslogik, Belegen, Wert, Risiko und Stakeholder-Passung",
        "Ein geprüfter Pitch, One-Pager oder Gesprächstermin-Brief ohne unbelegte oder vertrauliche Aussagen"
      ]
    }
  },
  "LRN-46": {
    "en": {
      "promise": "Complete the course with a small Python AI application whose model, retrieval, agent, MCP, evaluation, security, and production choices are explicit and testable.",
      "projectScenario": {
        "title": "Build a bounded knowledge assistant in Python",
        "description": "Develop a small LLM application that answers from a defined knowledge set, uses a bounded agent workflow where useful, and connects an external tool or data source through an MCP client or server. Add evaluation and operational controls before proposing deployment.",
        "guardrail": "Use approved sample data and validated tool schemas; keep credentials out of prompts and require human approval for consequential external actions."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Choose the engineering building blocks",
          "description": "Review the ML and LLM concepts needed to make implementation choices about models, retrieval, application flow, and agent boundaries."
        },
        {
          "kind": "guided",
          "title": "Build the application and tool path",
          "description": "Connect model integration and retrieval to explicit Python state and control flow, then expose an external tool or data source through MCP with validated schemas."
        },
        {
          "kind": "hands-on",
          "title": "Evaluate and prepare for operation",
          "description": "Add evaluation, observability, security, and optimization checks; document deployment assumptions and production controls for the system."
        }
      ],
      "evidence": [
        "A Python application design naming model, retrieval, state, and control-flow choices",
        "A bounded agent workflow with explicit tools and reasons for using its pattern",
        "An MCP connection with validated input and output schemas",
        "An evaluation and operations plan covering quality, observability, security, optimization, and deployment controls"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einer kleinen Python-KI-Anwendung ab, deren Entscheidungen zu Modell, Retrieval, Agent, MCP, Evaluation, Sicherheit und Betrieb explizit und prüfbar sind.",
      "projectScenario": {
        "title": "Einen begrenzten Wissensassistenten in Python bauen",
        "description": "Entwickle eine kleine LLM-Anwendung, die aus einer abgegrenzten Wissensbasis antwortet, bei Bedarf einen begrenzten Agentenablauf nutzt und ein externes Werkzeug oder eine Datenquelle über einen MCP-Client oder -Server anbindet. Ergänze Evaluation und Betriebskontrollen, bevor du eine Bereitstellung vorschlägst.",
        "guardrail": "Verwende freigegebene Beispieldaten und validierte Werkzeugschemata. Zugangsdaten gehören nicht in Prompts; folgenreiche externe Aktionen brauchen menschliche Freigabe."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die passenden Engineering-Bausteine wählen",
          "description": "Behandle ML- und LLM-Grundlagen, die Implementierungsentscheidungen zu Modellen, Retrieval, Anwendungsablauf und Agentengrenzen ermöglichen."
        },
        {
          "kind": "guided",
          "title": "Anwendung und Werkzeugpfad bauen",
          "description": "Verbinde Modellintegration und Retrieval mit explizitem Python-Zustand und Kontrollfluss. Binde anschließend ein externes Werkzeug oder eine Datenquelle über MCP mit validierten Schemata an."
        },
        {
          "kind": "hands-on",
          "title": "Evaluieren und den Betrieb vorbereiten",
          "description": "Ergänze Prüfungen für Evaluation, Beobachtbarkeit, Sicherheit und Optimierung und dokumentiere Bereitstellungsannahmen und Kontrollen für den Produktivbetrieb."
        }
      ],
      "evidence": [
        "Ein Python-Anwendungsentwurf mit Entscheidungen zu Modell, Retrieval, Zustand und Kontrollfluss",
        "Ein begrenzter Agentenablauf mit expliziten Werkzeugen und begründeter Musterwahl",
        "Eine MCP-Anbindung mit validierten Ein- und Ausgabeschemata",
        "Ein Evaluations- und Betriebskonzept zu Qualität, Beobachtbarkeit, Sicherheit, Optimierung und Bereitstellungskontrollen"
      ]
    }
  },
  "LRN-44": {
    "en": {
      "promise": "Finish with a practical champion plan that transfers AI know-how through mentoring and community practice and turns a bounded pilot into reusable, reviewed guidance.",
      "projectScenario": {
        "title": "Run a team learning session and bounded pilot",
        "description": "Plan a focused brown-bag or mentoring session around a real team question, capture questions and patterns for the community, then outline a small volunteer pilot with a sponsor, guardrails, measures, and a stop condition.",
        "guardrail": "A champion builds understanding and shares learning; the role does not itself approve tools, data access, or changes to team policy."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Define the multiplier role",
          "description": "Connect mentoring, knowledge transfer, communities of practice, and bounded experimentation to clear ownership and escalation channels."
        },
        {
          "kind": "guided",
          "title": "Prepare a useful learning session",
          "description": "Choose a target behavior, practical example, follow-up resource, and facilitation approach; plan how community questions and evidence will be captured."
        },
        {
          "kind": "hands-on",
          "title": "Turn learning into a governed pilot",
          "description": "Draft a volunteer pilot with an accountable sponsor, approved guardrails, measures, stop condition, and a route for turning results into reusable guidance."
        }
      ],
      "evidence": [
        "A mentoring or brown-bag plan with target behavior, practical example, and follow-up resource",
        "A community contribution backlog that captures questions, useful patterns, evidence, and unresolved risks",
        "A bounded pilot brief with volunteers, sponsor, guardrails, measures, and stop condition",
        "Reusable guidance with an owner, review path, and escalation channel"
      ]
    },
    "de": {
      "promise": "Du schließt den Kurs mit einem praxisnahen Champion-Plan ab, der KI-Wissen durch Mentoring und Community-Arbeit weitergibt und aus einem begrenzten Pilotversuch geprüfte, wiederverwendbare Orientierung macht.",
      "projectScenario": {
        "title": "Eine Lerneinheit und einen begrenzten Pilot gestalten",
        "description": "Plane einen fokussierten Brown Bag oder eine Mentoring-Einheit zu einer konkreten Teamfrage. Halte Fragen und Muster für die Community fest und skizziere anschließend einen kleinen Pilot mit Freiwilligen, Sponsor, Leitplanken, Messgrößen und Abbruchbedingung.",
        "guardrail": "Ein Champion vermittelt Wissen und teilt Erkenntnisse. Die Rolle erteilt für sich genommen keine Freigabe für Werkzeuge, Datenzugriff oder Änderungen an Teamregeln."
      },
      "stages": [
        {
          "kind": "theory",
          "title": "Die Multiplikatorrolle einordnen",
          "description": "Verknüpfe Mentoring, Wissenstransfer, Communities of Practice und begrenztes Experimentieren mit klaren Zuständigkeiten und Eskalationswegen."
        },
        {
          "kind": "guided",
          "title": "Eine hilfreiche Lerneinheit vorbereiten",
          "description": "Lege Zielverhalten, Praxisbeispiel, Anschlussmaterial und Moderation fest und plane, wie Fragen und Belege in der Community festgehalten werden."
        },
        {
          "kind": "hands-on",
          "title": "Lernen in einen gesteuerten Pilot überführen",
          "description": "Entwirf einen Pilot mit Freiwilligen, verantwortlichem Sponsor, freigegebenen Leitplanken, Messgrößen und Abbruchbedingung sowie einem Weg zu wiederverwendbarer Orientierung."
        }
      ],
      "evidence": [
        "Ein Mentoring- oder Brown-Bag-Plan mit Zielverhalten, Praxisbeispiel und Anschlussmaterial",
        "Ein Community-Backlog mit Fragen, hilfreichen Mustern, Belegen und offenen Risiken",
        "Ein begrenzter Pilotbrief mit Freiwilligen, Sponsor, Leitplanken, Messgrößen und Abbruchbedingung",
        "Wiederverwendbare Orientierung mit Zuständigkeit, Prüfweg und Eskalationskanal"
      ]
    }
  }
};
