# SOTA Scan — AI-native Corporate Learning Platform

Mode: **standard** · Recherchiert am **30. August 2026** bis zur leichten Sättigung.

## Verdict

Die Plattform ist nach diesem Umsetzungsschnitt **COMPETITIVE**: Curriculum, Cockpit und Lernfortschritt waren bereits stark; neu hinzugekommen sind ein quellengebundener PAN-Tutor und ein learner-owned, editierbarer Plan. Für Top-Tier fehlen vor allem ein belastbares Mastery-Modell mit adaptiver Neuplanung sowie Manager-Zuweisung und verifizierbare Skill-Nachweise.

**Tier:** COMPETITIVE · **Table-stakes coverage:** 89% (17/19) · **Field:** 6 direkte Peers + 4 breitere Referenzen

## Since last scan

Der vorherige gespeicherte Scan vom 24. August 2026 bewertete die andere Domäne `open-source-ai-curriculum`. Ein Prozentvergleich wäre daher irreführend. Für die bereits vorhandene Corporate-Rubrik wurde die Messlatte transparent von v1 auf v2 angehoben: vier im aktuellen Markt wiederkehrende AI-Table-Stakes und fünf Edge-Capabilities kamen hinzu; bestehende Kriterien und Gewichte wurden nicht still verändert.

## Field framing

Primärer Cluster ist eine **enterprise AI learning platform**: rollenbezogene Curricula, Governance, Fortschritt und AI-Coaching im selben Produkt. Als breitere Referenzen dienen curriculum-native Tutor-Systeme, adaptive Open-Source-Tutoren und Learning Agents im Arbeitsfluss. Reine Content-Repositories oder allgemeine Chatbots sind kein direkter Vergleich.

## Why these benchmarks

Sana und 360Learning setzen den aktuellen Maßstab für source-grounded Tutor-Flows und kontextbewusste Next-best-actions. Degreed, Docebo und Cornerstone prüfen Enterprise-Skills, Coaching und Talent-Workflows; Coursera zeigt den kursnahen Tutor im großen Maßstab. Khanmigo ist die didaktische Referenz für hint-first und Assessment-Schutz. Open edX und Oppia liefern überprüfbare Open-Source-Muster für Unit-Kontext, Telemetrie, Prerequisites und Mastery. Go1 zeigt den Transfer in Teams und Slack.

## Do next

1. **Concept Mastery + adaptive Neuplanung:** Quiz-Evidenz stärker gewichten als Lesen/Selbstrating, Capstone-BKT produktisieren und Spaced Review auslösen.
2. **Manager-Zuweisung + Skill-Nachweis:** persönliche Pläne in zuweisbare Team-Pläne überführen und Applied Assessments mit verifizierbarem Receipt verbinden.
3. **Tutor-Evaluation:** feste Testsets für Groundedness, Zitatgültigkeit, Quiz-Leakage, Prompt Injection, pädagogische Qualität, Latenz und Kosten ergänzen.

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
| Plan assignment and reporting | ⚠️ | aggregiertes Reporting vorhanden, aber keine Manager-Zuweisung persönlicher Pläne |
| Applied skills assessment | ⚠️ | Labs und Capstone-Verifikation vorhanden, aber kein allgemein verifizierbares Skill Credential |
| Role outcome statements | ✅ | Course Outcomes und rollenbezogene Beschreibungen |
| Curriculum-grounded AI tutor | ✅ | `server/learner-ai.js`, `site/pan.js`; freigegebene Course-/Lesson-Quellen und Deep Links |
| Learner-owned goal plan | ✅ | `learning-plan.js` + `plan-builder.js`; Rolle, Ziel, Rhythmus, Assessment und Fortschritt |
| Progress-aware next action | ✅ | deterministische Priorisierung plus PAN-Retrieval aus Progress/Plan/Context |
| AI trust and assessment guards | ✅ | Gate, Rate Limit, serverseitiger Key, Allowlisting, Source-Normalisierung, Untrusted-Data-Grenze und Hint-first-/Quiz-Schutz |
| LLM crawler discoverability | ✅ edge | `site/llms.txt` |
| Industry-recognized certificate | ❌ edge | kein externer oder partnergestützter Abschluss |
| Credential verification | ⚠️ edge | Capstone-Receipt, noch nicht als allgemeines Skill Credential integriert |
| SCORM/xAPI export | ❌ edge | kein LMS-Exportpfad |
| AI-assisted plan authoring | ✅ edge | bestehender Admin-Copilot für Curriculum-Proposals |
| Translation/localization | ⚠️ edge | zweisprachige UI und Teilübersetzung, keine Vollabdeckung |
| Consultant case library | ⚠️ edge | Use-Case-Inhalte, aber keine kuratierte anonymisierte Engagement-Library |
| Facilitator toolkit | ❌ edge | kein vollständiges Delivery-Pack je Blended Course |
| Compliance evidence bundle | ❌ edge | kein exportierbares Assurance-Paket |
| Persistent tutor threads | ✅ edge | begrenzte lokale PAN-History mit sichtbarer Retention und Clear-Aktion |
| Adaptive practice and roleplay | ❌ edge | Quick Action vorhanden, noch kein antwortabhängiger Practice-State |
| Concept mastery and replanning | ❌ edge | Capstone-BKT existiert isoliert, nicht im Learner Model |
| Flow-of-work learning agent | ❌ edge | keine Teams-/Slack-Integration |
| Tutor evaluation harness | ⚠️ edge | Quellen-, Input-, Prompt- und Route-Tests vorhanden; noch kein pädagogisches Eval-Set |

## Gaps

### Direct-peer gaps

- Manager/L&D können persönliche Pläne noch nicht zuweisen, genehmigen oder teamweit auswerten.
- Applied Assessments erzeugen noch keinen überall prüfbaren Skill-Nachweis.

### Maturity gaps

- PAN ist nicht streamingfähig und hat noch keine produktionsgemessenen Latenz-/Kostenbudgets.
- Tutor-Groundedness und Quiz-Leakage werden strukturell getestet, aber noch nicht gegen ein festes Golden Set bewertet.

### Onboarding gaps

- Der Planer arbeitet sofort lokal; ein kurzer erster Diagnostic Check wäre belastbarer als reine Selbsteinschätzung.
- Zeitplanung nutzt Fokus-Sessions, weil der Katalog keine verlässlichen Kursdauern trägt. Das wird ehrlich ausgewiesen, verhindert aber kalendergenaue Zusagen.

### Cross-cluster transfer gaps

- Oppias Concept-Mastery und OpenTutor-/OATutor-artige BKT-/Spaced-Review-Mechanik sind noch nicht produktisiert.
- Go1s Flow-of-Work-Pattern in Teams/Slack fehlt.
- Adaptive Roleplays wie bei Degreed Maestro fehlen.

## What we already match

- Rollen- und Level-Cockpit, kuratierte Academy Paths, 600 auditierte Lessons, Browser-Ausführung, Quizze und lokaler Fortschritt bilden eine ungewöhnlich starke Basis.
- PAN ist kein frei formulierter Chat-Proxy: Er minimiert Learner-Daten, rankt freigegebene Inhalte deterministisch, bindet echte Lesson-Auszüge ein und lässt nur serverseitig aufgelöste Quellen/Aktionen durch.
- Der persönliche Plan ist learner-owned, transparent und editierbar. Das Modell erklärt seine Signale und erfindet keine Kursstunden.
- Der bestehende Admin-Copilot deckt AI-assisted Curriculum Authoring bereits mit auditierten Proposals ab.
