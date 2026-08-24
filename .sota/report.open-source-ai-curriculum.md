# SOTA Remediation Rescan — ai-engineering-from-scratch

Mode: **remediation-rescan** gegen dasselbe Feld und dieselbe Rubrik v2 wie im Standard-Scan vom 24. August 2026.

> **Verdict:** Die sechs ursprünglichen Table-Stakes-Lücken und alle vorgeschlagenen Ausbaupunkte sind inhaltlich umgesetzt. Das Curriculum steigt von 57% auf 93% und von LAGGING auf COMPETITIVE. Der einzige verbleibende Table-Stakes-Abzug ist ein bewusst nicht manuell behobener, CI-verwalteter README-Zählstand; alle blockierenden Quality Gates sind grün.

**Tier:** COMPETITIVE · **Coverage:** █████████░ 93% (13/14) · **Field:** 5 direkte Peers + 5 Referenzen · **Lessons:** 600

## Ergebnis

| Bereich | Vorher | Jetzt | Nachweis |
|---|---:|---:|---|
| Lesson-Contract | 385/598 mit Objectives; inkonsistente Felder | 600/600, 0 Fehler | `scripts/check_lesson_contract.py` |
| Assessments | 396 Quizze; 10 Exercises | 600 Quizze, Exercises, separate Lösungen, ≥5 Tests | `scripts/check_assessments.py` |
| Reusable outputs | 534/598 | 600/600 gültig oder expliziter Reference-Opt-out | `scripts/check_output_contract.py` |
| Content-Verifizierbarkeit | 61 unbelegte quantitative Claims | 23/23 Content-Checks grün; Threshold 0 | `scripts/ci-content-check.js` |
| Site-Verhalten | 4 fehlschlagende Tests | 77/77 grün und in Curriculum-CI verdrahtet | `node --test site/*.test.mjs site/lrn/test.mjs` |
| Reproduzierbarkeit | kein einheitliches 4-Runtime-Setup | gepinnte Python-Deps, gelockte Devcontainer-Features, Bootstrap | `.devcontainer/`, `scripts/bootstrap.sh` |
| Lokalisierung | 0 übersetzte Lessons | vollständiger deutscher 5-Lesson-AI-Literacy-Slice | fünf `docs/de.md` |
| Guided demos | kein konsistenter Layer | 24 geführte Demos für tragende Lessons | `docs/guided-demos.md` |
| Cross-cluster content | keine dedizierten GP-/Recommender-Lessons | zwei vollständige Lessons mit Code, Tests, Quiz und Artifact | Phase 01/23 und Phase 02/19 |
| Capstone-Verifikation | nur Projektverzeichnisse | neun Tracks, sichere Submission-Prüfung, Receipt und Tests | `challenges/verified-capstone/` |

Der vollständige Devcontainer wurde auf ARM64 mit `@devcontainers/cli 0.88.0` gebaut und gestartet. Dabei wurde ein echter Julia-Empty-Reduction-Fehler gefunden und behoben. Danach liefen der betroffene Lesson-Test und der Bootstrap mit Python, TypeScript, Rust und Julia jeweils mit Exit 0.

## Capability matrix

| Capability | Status | Lokaler Nachweis |
|---|---|---|
| Structured curriculum and prerequisites | ✅ | `README.md`, `ROADMAP.md`, 20 Phasen |
| Multi-language runnable code | ✅ | `main.{py,ts,rs,jl}`; realer 4-Runtime-Smoke |
| LLM, RAG and agents | ✅ | Phasen 11, 14 und 19 |
| MCP track | ✅ | Phase 13 und MCP-Capstones |
| From scratch → production library | ✅ | Build-It/Use-It-Spine |
| Browser execution | ✅ | Pyodide-Lesson-Runner; IDE-Doku ohne JupyterLite-Überversprechen |
| Placement and personalized paths | ✅ | Assessment, Prerequisite-Graph, Level-Skill |
| Reusable artifact contract | ✅ | 600/600, 0 Fehler |
| Public learning site | ✅ | statische Site und Deployment-Workflow |
| Assessment per lesson | ✅ | 600/600, 0 Fehler |
| Lesson-contract consistency | ✅ | 600/600, 0 Fehler |
| Green repository gates | ⚠️ | alle blockierenden Gates grün; vier advisory README-Count-Drifts bis Main-CI |
| Reproducible environment | ✅ | Devcontainer tatsächlich gebaut; Bootstrap Exit 0 |
| Source-verifiable claims | ✅ | 23/23 Content-Checks |
| Progress tracking | ✅ edge | Progress, Badges, Skills |
| Automated execution in CI | ⚠️ edge | Contracts, Content, Capstone, Script- und Site-Tests; nicht jedes Demo/Notebook je PR |
| Installable shared-code package | ❌ edge | Skills installierbar; kein gemeinsames pip/npm-Codepaket |
| Root environment guide | ✅ edge | `docs/getting-started.md` |
| Exercise solutions | ✅ edge | separate Lösung für alle 600 Lessons |
| Translation/localization | ✅ edge | kompletter deutscher 5-Lesson-Track |
| Guided demonstrations | ✅ edge | 24 strukturierte Walkthroughs |

## Ein verbleibender Table-Stakes-Abzug

`python3 scripts/check_readme_counts.py` meldet vier Drifts: Der aktuelle Katalog enthält 600 Lessons, 443 Skills und 101 Prompts, während die aggregierten README-Zahlen noch den vorherigen Stand zeigen. Das ist kein übersehener Fix: Der Repo-Vertrag verbietet manuelle Änderungen dieser Count-Surfaces und weist die Regeneration ausdrücklich der Main-Branch-CI zu. Der Check ist im PR advisory; alle blockierenden Gates sind bereits grün. Unter der unveränderten, strengeren Rubrik bleibt der Status deshalb ehrlich auf **partial**, bis Main-CI die generierten Zahlen synchronisiert.

## Verbleibende Edge-Arbeit

Zwei Punkte sind bewusst nicht als SOTA-Blocker behandelt:

- CI prüft alle Verträge und die Site, führt aber nicht jedes der 600 Demos und jedes Notebook in allen vier Runtimes bei jedem PR aus. Die lokal generierten Behavioral-Suites wurden vollständig nach Sprache validiert.
- Die Curriculum-Skills haben einen Installationsweg, gemeinsamer Lesson-Code wird aber nicht als stabiles pip- oder npm-Paket veröffentlicht. Für dieses Curriculum ist das eine optionale Produktentscheidung, kein still fehlender Build-Schritt.

Die deutsche Abdeckung ist ein qualitativ vollständiger Pilot-Slice, keine behauptete Vollübersetzung: 170 der gemappten englischen Lessons haben weiterhin kein `docs/de.md`.

## Vergleichsfeld

Direkte Peers: [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners), [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners), [GokuMohandas/Made-With-ML](https://github.com/GokuMohandas/Made-With-ML), [the-full-stack/the-full-stack-website](https://github.com/the-full-stack/the-full-stack-website), [PavanMudigonda/zero-to-ai](https://github.com/PavanMudigonda/zero-to-ai).

Breitere Referenzen: [d2l-ai/d2l-en](https://github.com/d2l-ai/d2l-en), [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch), [huggingface/course](https://github.com/huggingface/course), [huggingface/agents-course](https://github.com/huggingface/agents-course), [stanford-cs336/lectures](https://github.com/stanford-cs336/lectures).

Die Feldmetadaten stammen aus dem Standard-Scan desselben Tages. Der Rescan verändert weder Peer-Auswahl noch Rubrik; er bewertet ausschließlich den remediated Worktree neu.

## Abschlussnachweis

- `python3 scripts/audit_lessons.py`: 600 Lessons, 0 Probleme.
- `python3 scripts/check_lesson_contract.py`: 600, 0.
- `python3 scripts/check_assessments.py`: 600, 0.
- `python3 scripts/check_output_contract.py`: 600, 0.
- `python3 scripts/verify_capstone.py --self-check`: Exit 0.
- `python3 -m unittest discover scripts/tests -v`: 30/30 grün.
- `node scripts/ci-content-check.js`: 23/23 grün.
- `node --test site/*.test.mjs site/lrn/test.mjs`: 77/77 grün.
- `npx -y @devcontainers/cli up --workspace-folder .`: success.
- `bash scripts/bootstrap.sh` im Container: vier Sprachen grün.
- `python3 scripts/check_readme_counts.py`: vier erwartete advisory Drifts; Main-CI synchronisiert sie.
