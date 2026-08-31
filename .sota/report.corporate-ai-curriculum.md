# SOTA Scan — AI-native Corporate Learning Platform

Mode: **standard** · Recherchiert am **30. August 2026** bis zur leichten Sättigung.

## Verdict

Die Plattform ist nach diesem Umsetzungsschnitt **FRONTIER**: Alle 19 Table-Stakes des direkten Enterprise-AI-Learning-Clusters sind belegt. PAN ist curriculum-grounded und evaluiert, persönliche Pläne reagieren auf beobachtete Mastery und Team-Zuweisungen, und angewandte Evidenz kann als eng begrenzter, prüfbarer Kompetenznachweis ausgegeben werden.

**Tier:** FRONTIER · **Table-stakes coverage:** 100% (19/19) · **Field:** 6 direkte Peers + 4 breitere Referenzen

## Since last scan

Der vorherige gespeicherte Scan vom 24. August 2026 bewertete die andere Domäne `open-source-ai-curriculum`. Ein domänenübergreifender Prozentvergleich wäre daher irreführend. Innerhalb dieses Corporate-Scans stieg die belegte Abdeckung durch die Umsetzung von 89% auf 100%: `plan-assignment-and-reporting` und `applied-skills-assessment` sind neu erfüllt; außerdem wurden die Edge-Capabilities `concept-mastery-and-replanning`, `credential-verification` und `tutor-evaluation-harness` geschlossen.

## Field framing

Primärer Cluster ist eine **enterprise AI learning platform**: rollenbezogene Curricula, Governance, Fortschritt und AI-Coaching im selben Produkt. Als breitere Referenzen dienen curriculum-native Tutor-Systeme, adaptive Open-Source-Tutoren und Learning Agents im Arbeitsfluss. Reine Content-Repositories oder allgemeine Chatbots sind kein direkter Vergleich.

## Why these benchmarks

Sana und 360Learning setzen den aktuellen Maßstab für source-grounded Tutor-Flows und kontextbewusste Next-best-actions. Degreed, Docebo und Cornerstone prüfen Enterprise-Skills, Coaching und Talent-Workflows; Coursera zeigt den kursnahen Tutor im großen Maßstab. Khanmigo ist die didaktische Referenz für hint-first und Assessment-Schutz. Open edX und Oppia liefern überprüfbare Open-Source-Muster für Unit-Kontext, Telemetrie, Prerequisites und Mastery. Go1 zeigt den Transfer in Teams und Slack.

## In diesem Schnitt umgesetzt

1. **Concept Mastery + adaptive Neuplanung:** BKT-artige Mastery nutzt wiederholte Quiz-Evidenz, terminiert Spaced Reviews und repriorisiert gespeicherte Pläne mit nachvollziehbarer Revision und Undo.
2. **Manager-Zuweisung + Skill-Nachweis:** Admins erstellen Teampläne mit Kursen und Fälligkeit; Lernende treten pseudonym per Code bei. Ein Receipt setzt Quiz-Mastery und einen bestandenen, nicht aufgedeckten Runnable Self-Check voraus.
3. **Tutor-Evaluation:** das offline und live ausführbare Golden Set bewertet Groundedness, Zitate, Pädagogik, Quiz-Leakage, Prompt Injection, Latenz und Tokenbudget; Runtime Safety blockiert unsichere Antworten fail-closed.

Nächste strategische Ausbaustufe außerhalb der direkten Table-Stakes: adaptive Rollenspiele, Teams-/Slack-Integration, xAPI/SCORM und externe bzw. proktorierte Credentials.

## Field

| Comparator | Rolle | Bestätigte Capability |
|---|---|---|
| [Sana Learn](https://help.sana.ai/en/articles/376861-sana-s-tutor-mode-in-search) | direkt · technisch fortgeschritten | Mehrstufige Tutor-Pfade aus freigegebenen Quellen, persistente Threads, Übungen und Source-Auswahl |
| [360Learning](https://360learning.com/blog/product-update-ai-companion-coach-mode/) | direkt · technisch fortgeschritten | Coach Mode nutzt Rolle, Pläne, Historie und Deadlines und liefert eine einzelne beste Empfehlung |
| [Degreed Maestro](https://degreed.com/experience/artificial-intelligence/) | direkt · populär | Coaching, Roleplay, Skill Reviews und automatisierte Pathway-Kuration aus Skill-Profil und Historie |
| [Docebo AI](https://help.docebo.com/hc/en-us/articles/360020125779-FAQs-on-Docebo-artificial-intelligence-features) | direkt · populär | Verlaufsgestützte Empfehlungen, AI Authoring und Virtual Coaching mit Enterprise-Privacy |
| [Cornerstone Galaxy AI](https://www.cornerstoneondemand.com/resources/article/where-adaptive-learning-accelerates-talent-growth/) | direkt · kanonisch | Adaptive Learning Agent, Course Assistant und Development Plans verbinden Skills, Ziele und Lernen |
| [Coursera Coach](https://blog.coursera.org/coursera-coach-leveraging-genai-to-empower-learners/) | direkt · kanonisch | Kursmaterial-gebundener Side-Chat, Erklärungen, Übungsfragen und Bezug zu persönlichen Zielen |
| [Khanmigo](https://support.khanacademy.org/hc/en-us/articles/13982530363533-Where-can-I-access-Khanmigo-while-working-on-Khan-Academy) | Referenz · curriculum-nativ | Seitenkontext, persistente History und bewusste Deaktivierung in Tests/Mastery Challenges |
| [Open edX AI Extensions](https://docs.openedx.org/en/latest/community/release_notes/verawood/ai_extension_framework.html) | Referenz · Open Source | Unit-Chat, Multi-Turn, Provider-Abstraktion, Prompt-Templates, xAPI und grounded-only Guardrails |
| [Oppia](https://github.com/oppia/oppia/blob/develop/core/controllers/skill_mastery.py) | Referenz · adaptiv | Persistente Skill-Mastery, diagnostische Fragen, explizite Prerequisites und Gap-Empfehlungen |
| [Go1 Morgan](https://www.go1.com/product/morgan) | Referenz · Flow of Work | Rollenbezogene Lernempfehlungen, Digests und Fortschritt direkt in Teams und Slack |

GitHub-Metadaten am Scan-Tag: `openedx/openedx-platform` 8.175 Stars, letzter Push 2026-08-29; `openedx/openedx-ai-extensions` 16 Stars, letzter Push 2026-07-08; `oppia/oppia` 6.784 Stars, letzter Push 2026-08-30. Keines war archiviert. Für geschlossene Produkte sind Stars nicht anwendbar.

## Capability matrix

| Capability | Status | Repo-Nachweis |
|---|---|---|
| Role-based learning plans | ✅ | `site/lrn/lrn.js`, Rollen und Academy Paths |
| Plan milestones | ✅ | Academy-Stages plus versionierte persönliche Plan-Schritte |
| Curated course maps | ✅ | `catalog.json` und `curriculum-map.json` |
| Consultant framing | ✅ | Rollen- und Use-Case-orientierte LRN-Kurse |
| Compliance coverage | ✅ | LRN-03/04 und Ethics/Safety-Phase |
| LRN cockpit | ✅ | `site/index.html` |
| Progress tracking | ✅ | `site/progress.js`, Kurs- und Capability-Aggregation |
| Placement assessment | ✅ | `site/assessment.html`; Gaps fließen nun in den Planer |
| Per-phase and lesson quiz | ✅ | kanonische 6-Fragen-Quizze mit persistierten Antworten |
| Open lesson pool | ✅ | 600 auditierte Lessons |
| In-browser execution | ✅ | Pyodide-Runtime in `site/lesson.html` |
| Static deployment | ✅ | statisches Frontend; geschützte Node-API für interne Funktionen |
| Plan assignment and reporting | ✅ | `site/admin.js`, `server/admin-api.js`, `server/team-learning-store.js`: Teampläne, Join Codes, Fälligkeit und anonymes Completion-/Mastery-Reporting |
| Applied skills assessment | ✅ | `site/lesson.html`, `site/progress.js`: bestandener Runnable Self-Check ohne Reveal plus Quiz-Mastery; signiertes Receipt über `server/team-learning-store.js` |
| Role outcome statements | ✅ | Course Outcomes und rollenbezogene Beschreibungen |
| Curriculum-grounded AI tutor | ✅ | `server/learner-ai.js`, `site/pan.js`; freigegebene Course-/Lesson-Quellen und Deep Links |
| Learner-owned goal plan | ✅ | `learning-plan.js` + `plan-builder.js`; Rolle, Ziel, Rhythmus, Assessment und Fortschritt |
| Progress-aware next action | ✅ | deterministische Priorisierung plus PAN-Retrieval aus Progress/Plan/Context |
| AI trust and assessment guards | ✅ | Gate, Rate Limit, serverseitiger Key, Allowlisting, Source-Normalisierung, Untrusted-Data-Grenze und Hint-first-/Quiz-Schutz |
| LLM crawler discoverability | ✅ edge | `site/llms.txt` |
| Industry-recognized certificate | ❌ edge | kein externer oder partnergestützter Abschluss |
| Credential verification | ✅ edge | `site/credential.html` und `/api/lrn/credentials/:id`: HMAC-Prüfung mit explizit begrenzter Aussage zu Selbststudium statt Identität/Proctoring |
| SCORM/xAPI export | ❌ edge | kein LMS-Exportpfad |
| AI-assisted plan authoring | ✅ edge | bestehender Admin-Copilot für Curriculum-Proposals |
| Translation/localization | ⚠️ edge | zweisprachige UI und Teilübersetzung, keine Vollabdeckung |
| Consultant case library | ⚠️ edge | Use-Case-Inhalte, aber keine kuratierte anonymisierte Engagement-Library |
| Facilitator toolkit | ❌ edge | kein vollständiges Delivery-Pack je Blended Course |
| Compliance evidence bundle | ❌ edge | kein exportierbares Assurance-Paket |
| Persistent tutor threads | ✅ edge | begrenzte lokale PAN-History mit sichtbarer Retention und Clear-Aktion |
| Adaptive practice and roleplay | ❌ edge | Quick Action vorhanden, noch kein antwortabhängiger Practice-State |
| Concept mastery and replanning | ✅ edge | `site/lrn/mastery.js`, `learning-plan.js`, `plan-builder.js`: Quiz-Mastery, Review Queue, adaptive Revision und Undo |
| Flow-of-work learning agent | ❌ edge | keine Teams-/Slack-Integration |
| Tutor evaluation harness | ✅ edge | `server/pan-eval.js`, `server/evals/pan-golden.json`: offline/live Golden Set und Kategorien für Qualität, Safety, Latenz und Tokenbudget |

## Gaps

### Direct-peer gaps

- Keine offenen Table-Stakes im gescannten direkten Peer-Cluster.

### Maturity gaps

- PAN misst Latenz und Tokenverbrauch im Live-Eval, aber noch ohne langfristige Produktions-SLO-Zeitreihe.
- Streaming bleibt eine optionale UX-Verbesserung; es ist kein Table-Stake des gescannten Clusters.

### Onboarding gaps

- Der Planer kann vorhandene Quiz-Mastery sofort adaptiv nutzen; für neue Nutzer wäre ein kurzer Performance-Diagnostic vor dem ersten Plan weiterhin stärker als reine Selbsteinschätzung.
- Zeitplanung nutzt Fokus-Sessions, weil der Katalog keine verlässlichen Kursdauern trägt. Das wird ehrlich ausgewiesen, verhindert aber kalendergenaue Zusagen.

### Cross-cluster transfer gaps

- Go1s Flow-of-Work-Pattern in Teams/Slack fehlt.
- Adaptive Roleplays wie bei Degreed Maestro fehlen.
- Externe oder proktorierte Partner-Credentials und xAPI/SCORM bleiben Integrationsoptionen.

## What we already match

- Rollen- und Level-Cockpit, kuratierte Academy Paths, 600 auditierte Lessons, Browser-Ausführung, Quizze und lokaler Fortschritt bilden eine ungewöhnlich starke Basis.
- PAN ist kein frei formulierter Chat-Proxy: Er minimiert Learner-Daten, rankt freigegebene Inhalte deterministisch, bindet echte Lesson-Auszüge ein und lässt nur serverseitig aufgelöste Quellen/Aktionen durch.
- Der persönliche Plan ist learner-owned, transparent und editierbar. Er reagiert auf Quiz-Mastery, fällige Wiederholungen und Team-Zuweisungen; die vorige Revision bleibt wiederherstellbar.
- Team-Reporting bleibt pseudonym und aggregiert. Der prüfbare Kompetenznachweis belegt ausschließlich Signatur und synchronisierte Selbststudiums-Evidenz, ausdrücklich nicht Identität oder Proctoring.
- PANs Golden Set hält Groundedness, Zitierbarkeit, Pädagogik und Assessment-Schutz als reproduzierbare Regression fest.
- Der bestehende Admin-Copilot deckt AI-assisted Curriculum Authoring bereits mit auditierten Proposals ab.
