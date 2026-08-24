# AI-X curriculum integration

This document records how the source package `OneDrive_1_24.8.2026` was incorporated into the LRN curriculum on 2026-08-24. It is the durable source-accounting record; the executable definitions live in `site/lrn/manifests/catalog.json` and `site/lrn/manifests/curriculum-map.json`.

## Integration policy

- Preserve the repository's existing lesson implementations and reuse them when they satisfy a source objective.
- Extend existing LRN courses when the source materially widens their outcomes or activity coverage.
- Add a dedicated LRN course only when no existing course provides a coherent container.
- Represent each supplied AI-X offering as an ordered Academy learning path without exposing raw curriculum phase or lesson numbers in the learner UI.
- Use schedules, trainer meetings, and transcripts to shape sequence, facilitation, dependencies, and quality gates. Do not publish attendee names, bookings, or other operational personal data as learner content.
- Treat dated or renamed copies of the same workshop deck as source versions, not as separate courses.

## Academy learning paths

| Academy course | Path title | LRN journey |
|---|---|---|
| AI-01 | Introduction to GitHub Copilot | Acquire: LRN-06<br>Deepen: LRN-22, LRN-20<br>Create: LRN-19 |
| AI-02 | Agentic Software Engineering | Acquire: LRN-06<br>Deepen: LRN-24, LRN-18, LRN-28<br>Create: LRN-26, LRN-25 |
| AI-03 | AI Systems and Architecture | Acquire: LRN-01<br>Deepen: LRN-25, LRN-18, LRN-24<br>Create: LRN-42, LRN-36 |
| AI-04 | Requirement Engineering with AI | Acquire: LRN-23<br>Deepen: LRN-21, LRN-30, LRN-31<br>Create: LRN-38 |
| AI-06 | Introduction to Concepts and Tools for Personal Productivity | Acquire: LRN-01, LRN-02<br>Deepen: LRN-02, LRN-22<br>Create: LRN-02, LRN-26 |
| AI-07 | Data-Driven Decision Making with AI | Acquire: LRN-01, LRN-05<br>Deepen: LRN-40<br>Create: LRN-40, LRN-32 |
| AI-08 | AI for Leaders | Acquire: LRN-01<br>Deepen: LRN-16, LRN-40<br>Create: LRN-43, LRN-44 |
| AI-09 | AI Fundamentals for Everyone - Focus Copilot | Acquire: LRN-01, LRN-02<br>Deepen: LRN-22, LRN-10 |
| AI-10 | AI for Pre-Sales and Sales | Acquire: LRN-01<br>Deepen: LRN-45, LRN-23, LRN-21<br>Create: LRN-11, LRN-32 |
| AI-12 | AI Infrastructure Basics for Software Developers | Acquire: LRN-01<br>Deepen: LRN-46, LRN-24, LRN-18, LRN-25<br>Create: LRN-26, LRN-28, LRN-36 |

AI-05 and AI-11 are not listed because the source package contains no training definition for those identifiers.

## Course changes driven by the sources

| LRN course | Integration |
|---|---|
| LRN-02 / AI-06 | Expanded to the LHIND tool landscape, a six-move file workflow, persistent context, reusable skills, agent harnesses, privacy, and human review. |
| LRN-06 / AI-01 | Added source-specific outcomes for Copilot modes, context, verification, and responsible use. |
| LRN-24 / AI-02 | Added outcomes for agent loops, retrieval, tool protocols, software-quality gates, security, and governance. |
| LRN-25 / AI-03 | Expanded to layered AI architecture, RAG, routing and adaptation, multi-agent patterns, platform evolution, LLMOps, evaluation, observability, and governance. |
| LRN-16 / AI-08 | Refocused on leadership, workforce roles, culture, accountable decisions, operating models, and transformation roadmaps. |
| LRN-40 / AI-07 | Expanded to clustering, forecasting, Monte Carlo simulation, optimization, human review, and decision communication. |
| LRN-45 / AI-10 | Added as the dedicated pre-sales and sales container: market/account intelligence, challenge-to-use-case mapping, pitches, briefings, and trusted-advisor practice. |
| LRN-46 / AI-12 | Added as the dedicated developer infrastructure container: ML foundations, production RAG, agent patterns, MCP, evaluation, observability, security, and cost control. |

AI-04 and AI-09 reuse existing course containers because their requirements and fundamentals objectives were already represented; their Academy paths make the source-specific sequence explicit.

## Source accounting

All 33 supplied files were reviewed and assigned an integration role.

### Overarching package: 14 files

| Source | Integration role |
|---|---|
| `AI-01_AI Introduction to GitHub CoPilot.docx` | AI-01 objectives, audience, prerequisites, and staged journey. |
| `AI-02_Agentic Software Engineering.docx` | AI-02 outcomes and engineering quality/governance scope. |
| `AI-03_AI Systems and Architecture.docx` | AI-03 course definition and architecture layers. |
| `AI-04_Requirement Engineering with AI.docx` | AI-04 discovery, structuring, prioritization, traceability, and human quality gates. |
| `AI-06-04 LHIND AI Introduction - Modul 1.docx` | AI-06 tool-landscape and access module. |
| `AI-06-04 LHIND AI Introduction - Modul 2.docx` | AI-06 hands-on file workflow. |
| `AI-06-04 LHIND AI Introduction - Modul 3.docx` | AI-06 context engineering, skills, harnesses, and advanced practice. |
| `AI-07 Einführung in Datengetreibene Entscheidungsfindung.docx` | AI-07 quantitative methods and transfer objectives. |
| `AI-08 AI for Leaders.docx` | AI-08 leadership, workforce, culture, value, and roadmap objectives. |
| `AI-09-06 AI Fundamentals_AI for Everyone-Focus Copilot.docx` | AI-09 foundations, Copilot focus, moderated use cases, and peer exchange. |
| `AI-10 AI for Pre-Sals & Sales.docx` | AI-10 audience, sales workflow, artifacts, and trusted-advisor outcomes. |
| `AI-12_Infrastructure_Basics_for_Software_Developers_Trainingsinhalte.docx` | AI-12 developer path and production topics. |
| `2026-08-13 AI Literacy TtT Meeting.pptx` | Trainer enablement, facilitation consistency, and delivery-quality context. |
| `2026-19-08 AI Training Plan.xlsx` | Offering coverage and rollout cross-check. Person, trainer, date, and booking data are intentionally excluded from learner-facing manifests. |

### AI-03 workshop package: 13 files

| Source group | Integration role |
|---|---|
| `2026-07-10 Agenda.docx`, `2026-08-14 Agenda.docx`, both `agenda.xlsx` files | Workshop sequence and coverage cross-check: classic ML to production, semantic layer, RAG, LLMOps, multi-agent systems, observability, platform vision, and hands-on discussion. |
| `GenAI_Architecture_DBX_WS.pdf`, `GenAI_Architecture_DBX_WS.pptx` | Databricks-oriented platform and production architecture content. The PDF and deck are two representations of the same workshop source. |
| `LHIND_AI_Platform_Evolution_Vision.pptx` | Platform evolution, gateway, governance, and target-state context. |
| `Multi-Agenten-Systeme.pptx`, `Iuliia Gauch - Multi-Agenten-Systeme.pptx` | Multi-agent patterns and dated presenter copy; consolidated into one activity sequence. |
| `Workshop_AI_GR_1.pptx`, `Georg Reuber - Workshop_AI_GR_1.pptx` | Architecture workshop material and dated presenter copy; consolidated into the AI-03 architecture units. |
| `observability-traceability-llm-vortrag.pptx`, `Kai Detmers​ - observability-traceability-llm-vortrag.pptx` | Tracing, evaluations, versioning, and LLM observability; consolidated into the production unit. |

### AI-06 delivery package: 6 files

| Source | Integration role |
|---|---|
| `LHIND AI Skills — Toollandschaft _ Modul 1.pdf` | Detailed tool landscape and selection boundaries. |
| `LHIND AI Skills — Hands-on _ Modul 2.pdf` | Step-by-step transcript-to-artifact workflow and review points. |
| `ai-06-trainer-briefing.md` | Timing, dependencies, trainer setup, and module handoffs. |
| `BLOCKER Onboarding AI Enablement Training - Trainer (1).vtt` | Trainer onboarding constraints, open questions, and delivery risks. |
| `BLOCKER Onboarding AI Enablement Training - Trainer (2).vtt` | Follow-up facilitation, access, and readiness context. |
| `AI-06-04 LHIND AI Introduction.url` | SharePoint launch point for the three-module source definition. It is accounted for as a pointer to the supplied module documents, not introduced as a public runtime dependency. |

## Validation contract

`scripts/build_lrn_manifests.js` generates the browser data from the two manifests. `site/lrn/test.mjs` verifies that the ten AI-X paths are unique, ordered, reference valid tracks and courses, and that the source-driven course expansions resolve to real curriculum activities.
