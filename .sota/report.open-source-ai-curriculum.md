# SOTA Standing — ai-engineering-from-scratch

Mode: **standard** (10 comparators; light saturation across broad curriculum, project-first, notebook, certification, and university-assignment search angles).

> **Verdict:** Inhaltlich ist das Repo bereits außergewöhnlich breit und bei AI-native Lernartefakten sogar vor dem Feld. Es ist noch nicht SOTA, weil der dokumentierte Lesson-Contract, Assessments, Reproduzierbarkeit und die eigenen Quality Gates nicht zuverlässig eingehalten werden.

**Tier:** LAGGING (6 table-stakes gaps) · **Coverage** ██████░░░░ 57% (8/14 table-stakes met) · **Field scanned:** 10 repos

> **Since last scan:** 100% → 57%, FRONTIER → LAGGING. Rubrik v1 → v2: Der neue Wert ist überwiegend ein härterer, qualitätsorientierter Maßstab. `reusable-artifact-per-lesson` wurde nach Dateiprüfung von met auf partial korrigiert; das Testsystem wurde wegen aktueller Fehlschläge von met auf partial korrigiert. Das Vergleichsfeld wurde von einer schwachen Ein-Peer-Auswahl auf fünf direkte Peers plus fünf breitere Referenzen umgestellt.

## Field framing

Detected domain: open-source AI engineering curriculum  
Detected cluster: project-based AI-engineering curriculum (confidence high) — das Repo verbindet Theorie, ausführbaren Code, Artefakte und Produktionsprojekte in einem selbstgesteuerten Pfad.  
Adjacent considered: interactive AI textbooks, hosted certificate courses, university assignment tracks  
Excluded: reine Roadmaps, Framework-Repos, Cookbook-Sammlungen und kommerzielle Bootcamps — sie liefern keinen fairen End-to-End-Curriculum-Vergleich.  
Benchmark assumption: SOTA bedeutet hier nicht „die meisten Themen“, sondern ein nachweisbar lernwirksames, reproduzierbares und aktuell korrektes Curriculum für Engineers.

## Why these benchmarks

Clusters found: project-based curriculum (5), interactive textbook (2), hosted course platform (2), university assignment track (1).

Direct comparators: [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners), [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners), [PavanMudigonda/zero-to-ai](https://github.com/PavanMudigonda/zero-to-ai), [GokuMohandas/Made-With-ML](https://github.com/GokuMohandas/Made-With-ML), [the-full-stack/the-full-stack-website](https://github.com/the-full-stack/the-full-stack-website) — gegen diese wird die Matrix gewertet.

Broader references: [d2l-ai/d2l-en](https://github.com/d2l-ai/d2l-en) [interactive textbook], [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch) [from-scratch textbook], [huggingface/course](https://github.com/huggingface/course) [hosted course], [huggingface/agents-course](https://github.com/huggingface/agents-course) [certificate/challenge course], [stanford-cs336/lectures](https://github.com/stanford-cs336/lectures) [university assignment track] — Kontext, keine Pflichtlücken.

Excluded background: Roadmap-only repos, code-example hubs, stale archives and narrow agent tutorials. Sie wurden in der Suche gesehen, aber nicht als direkte Peers gewertet.

## Do this next

> **Macht zuerst alle bestehenden Gates grün und verdrahtet die Site-Tests in CI.** Editiert `.github/workflows/curriculum.yml`, fügt einen `site-tests`-Job mit `node --test site/*.test.mjs site/lrn/test.mjs` hinzu und behebt anschließend die 20 Lesson-Audit-Probleme, 61 Citation-Fehler, den kaputten README-Count-Checker und die vier Site-Testfehler. Inspiration: [rasbt/LLMs-from-scratch → basic-tests-latest-python.yml](https://github.com/rasbt/LLMs-from-scratch/blob/main/.github/workflows/basic-tests-latest-python.yml). Effort ~2–4d · gap: high · impl: high.

## The field

| Rank | Direct comparator | Type | Stars | Last push | Why included |
|---:|---|---|---:|---|---|
| 1 | [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners) | popular | 118,454 | 2026-08-20 | Global baseline for lesson templates, translations, assignments, devcontainer and code-quality CI |
| 2 | [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners) | canonical | 66,678 | 2026-07-21 | Canonical structured AI curriculum with assignments, quizzes and reproducible setup |
| 3 | [GokuMohandas/Made-With-ML](https://github.com/GokuMohandas/Made-With-ML) | technically advanced | 49,204 | 2026-03-04 | Production ML course with behavioral tests and workload validation |
| 4 | [the-full-stack/the-full-stack-website](https://github.com/the-full-stack/the-full-stack-website) | canonical | 1,347 | 2026-07-28 | Production AI pedagogy with lectures, Colab labs and end-to-end systems work |
| 5 | [PavanMudigonda/zero-to-ai](https://github.com/PavanMudigonda/zero-to-ai) | niche-relevant | 53 | 2026-08-23 | Closest breadth match: large notebook-first zero-to-AI curriculum with notebook validation |

Broader references: [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch) (103,632, technically advanced), [huggingface/agents-course](https://github.com/huggingface/agents-course) (31,312, certificate/challenge), [d2l-ai/d2l-en](https://github.com/d2l-ai/d2l-en) (29,432, canonical but last pushed 2024-08-18), [huggingface/course](https://github.com/huggingface/course) (4,147, hosted multilingual course), [stanford-cs336/lectures](https://github.com/stanford-cs336/lectures) (3,662, rigorous assignment track).

Star and recency values were fetched from the GitHub API on 2026-08-24; none of the ten repos is archived.

## Capability matrix

| Capability | Us | SOTA (who has it) | Gap? | Reference |
|---|---|---|---|---|
| Structured path and prerequisites | ✅ `README.md`, `ROADMAP.md`, `site/prereqs.html` | Microsoft AI curricula, Full Stack |  | [microsoft/AI-For-Beginners](https://github.com/microsoft/AI-For-Beginners) |
| Multi-language runnable code | ✅ `phases/**/code/main.{py,ts,rs,jl}` | Microsoft GenAI uses Python/TS/.NET |  | [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners) |
| Modern LLM/RAG/agent coverage | ✅ `phases/11-*`, `phases/14-*`, `phases/19-*` | Microsoft GenAI, Full Stack |  | [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners) |
| MCP track | ✅ `phases/13-tools-and-protocols/` | Rare in direct peers; ours leads |  | [rohitg00/ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/phases/13-tools-and-protocols) |
| From scratch → production library | ✅ `README.md`, `phases/10-llms-from-scratch/` | Raschka demonstrates the depth bar |  | [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch) |
| Zero-install execution | ✅ `site/lesson.html` Pyodide; ⚠️ `ide/README.md` overclaims missing JupyterLite files | Devcontainers, Colab and Codespaces are common |  | [Microsoft AI devcontainer](https://github.com/microsoft/AI-For-Beginners/blob/main/.devcontainer/devcontainer.json) |
| Placement and personalized path | ✅ `site/assessment.html`, `.claude/skills/find-your-level/SKILL.md` | HF Agents offers path choice; ours is stronger |  | [HF Agents introduction](https://github.com/huggingface/agents-course/blob/main/units/en/unit0/introduction.mdx) |
| Reusable artifact per lesson | ⚠️ 534/598 non-empty `outputs/` | Peers consistently turn lessons into assignments or shareable builds; our own promise is every lesson | **table-stakes** | [Microsoft AI assignment example](https://github.com/microsoft/AI-For-Beginners/blob/main/lessons/1-Intro/assignment.md), [HF Agents share-and-challenge model](https://github.com/huggingface/agents-course/blob/main/units/en/unit0/introduction.mdx) |
| Public learning site | ✅ `site/`, Azure workflow | All serious peers have a web surface or rendered book |  | [Full Stack website](https://github.com/the-full-stack/the-full-stack-website) |
| Formative assessment per lesson | ⚠️ 396/598 `quiz.json`; only 10 docs with Exercises | Microsoft AI has per-unit assignments and interactive quizzes | **table-stakes** | [quiz component](https://github.com/microsoft/AI-For-Beginners/blob/main/etc/quiz-app/src/components/Quiz.vue), [assignment example](https://github.com/microsoft/AI-For-Beginners/blob/main/lessons/1-Intro/assignment.md) |
| Lesson-contract consistency | ⚠️ 385/598 objectives; 566 language fields; 10 Build It; 78 Use It; 6 Ship It | Microsoft GenAI documents a repeatable lesson package | **table-stakes** | [microsoft/generative-ai-for-beginners](https://github.com/microsoft/generative-ai-for-beginners#-each-lesson-includes) |
| Green curriculum gates | ⚠️ 20 audit issues, 61 source failures, broken count checker, 4 site-test failures | Peers run code/notebook validation in PR CI | **table-stakes** | [Microsoft code-quality workflow](https://github.com/microsoft/generative-ai-for-beginners/blob/main/.github/workflows/code-quality.yml), [Zero-to-AI notebook validation](https://github.com/PavanMudigonda/zero-to-ai/blob/main/.github/workflows/validate-notebooks.yml) |
| Reproducible environment | ⚠️ allowlist and quickstart exist; root pinned environment/devcontainer does not | Devcontainer, requirements and pyproject are common | **table-stakes** | [Microsoft AI devcontainer](https://github.com/microsoft/AI-For-Beginners/blob/main/.devcontainer/devcontainer.json), [Made With ML pyproject](https://github.com/GokuMohandas/Made-With-ML/blob/main/pyproject.toml) |
| Source-verifiable claims | ⚠️ CI finds 61 attributed percentages without links | Technical curricula link claims and validate docs | **table-stakes** | [D2L source book](https://github.com/d2l-ai/d2l-en), [Raschka link-check workflow](https://github.com/rasbt/LLMs-from-scratch/blob/main/.github/workflows/check-links.yml) |
| Progress, badges and capability tracking | ✅ `site/progress.js`, `site/badges.js`, `site/skills-progress.js` | HF has hosted course progress/certification |  | [HF Agents introduction](https://github.com/huggingface/agents-course/blob/main/units/en/unit0/introduction.mdx) |
| Reference solutions | ❌ no course-wide solution convention | Microsoft and Raschka ship explicit solutions | _edge_ | [Microsoft assignment solution](https://github.com/microsoft/generative-ai-for-beginners/blob/main/05-advanced-prompts/javascript/solution.js), [Raschka exercise solutions](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch04/01_main-chapter-code/exercise-solutions.ipynb) |
| Content translations | ❌ 0/598 lesson translations; UI only partially bilingual | Microsoft maintains 50+ languages; HF Course has language trees | _edge_ | [Microsoft multilingual support](https://github.com/microsoft/generative-ai-for-beginners#-multi-language-support), [HF Course translations](https://github.com/huggingface/course#-languages-and-translations) |
| Video/guided demonstrations | ❌ no course-wide layer | Microsoft and Full Stack combine written lessons with video | _edge_ | [Full Stack lab with video and Colab](https://github.com/the-full-stack/the-full-stack-website/blob/main/docs/course/2022/lab-5-troubleshooting-and-testing/index.md) |

## Gaps — your to-do list, worst first

### Direct peer gaps

[!] **#2 Enforce the actual Lesson-Contract** — table-stakes · effort ~1–2w for tooling, remediation is a multi-sprint program · gap: high · impl: high  
Why: The product promise is a uniform 598-lesson system, but the stored content does not consistently contain the promised objectives, Build/Use split, quizzes, tests and artifacts.  
Study: [microsoft/generative-ai-for-beginners → repeatable lesson package](https://github.com/microsoft/generative-ai-for-beginners#-each-lesson-includes).  
Step 1: edit `scripts/audit_lessons.py`, add `check_doc_contract(lesson)` with type-aware required fields/sections, make a missing `quiz.json` an error in `check_quiz()`, and add a non-empty-output check for lessons claiming an artifact. Start remediation with Phase 6, where 0/17 quizzes and 0/17 objectives expose the full failure shape.  
Verify: Decide whether `Learn` lessons require Build/Use sections or a distinct approved template before making the gate blocking.

[!] **#3 Complete the practice-and-feedback loop** — table-stakes · effort ~4–8w across 202 missing quizzes and 588 lessons without Exercises · gap: high · impl: medium  
Why: Reading and runnable demos are not enough to prove that a learner can transfer the skill; public feedback also calls out the lack of a solution manual.  
Study: [Microsoft AI quiz component](https://github.com/microsoft/AI-For-Beginners/blob/main/etc/quiz-app/src/components/Quiz.vue), [Microsoft assignment/solution pair](https://github.com/microsoft/generative-ai-for-beginners/tree/main/05-advanced-prompts/javascript), [Raschka exercise solutions](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch04/01_main-chapter-code/exercise-solutions.ipynb).  
Step 1: create `phases/06-speech-and-audio/01-audio-fundamentals/quiz.json` in the six-question schema, add an `## Exercises` transfer task to its `docs/en.md`, and add `code/tests/test_main.py` with at least five behavioral checks; use this as the migration exemplar.  
Verify: Choose one answer policy before scaling: A) separate reference solutions, B) hidden site solutions, or C) tests-only feedback.  
needs-verification: solution visibility and contribution/maintenance burden.

[!] **#4 Ship one reproducible environment** — table-stakes · effort ~3–5d · gap: high · impl: medium  
Why: A clean clone cannot currently reproduce the four-language curriculum from one maintained environment, and `ide/README.md` points to a JupyterLite tree that is not present.  
Study: [Microsoft AI devcontainer](https://github.com/microsoft/AI-For-Beginners/blob/main/.devcontainer/devcontainer.json), [Full Stack Colab lab](https://github.com/the-full-stack/the-full-stack-website/blob/main/docs/course/2022/lab-5-troubleshooting-and-testing/index.md).  
Step 1: create `.devcontainer/devcontainer.json` plus a root `requirements.txt` pinned only to the allowed Python dependencies; add `scripts/bootstrap.sh` that verifies Python 3.12, Node 20, Rust 2021 and Julia, then runs one smoke lesson per language. Repair `ide/README.md` to describe only the execution paths that actually ship, or restore the missing JupyterLite files.  
Verify: Confirm the acceptable image size and whether Julia must be preinstalled or documented as optional before locking the container.  
needs-verification: final multi-language devcontainer footprint.

Remaining table-stakes gap not expanded as a card: close the 64-artifact promise gap. Use [Microsoft's assignment pattern](https://github.com/microsoft/AI-For-Beginners/blob/main/lessons/1-Intro/assignment.md) and [HF's shareable-agent workflow](https://github.com/huggingface/agents-course/blob/main/units/en/unit0/introduction.mdx) as external UX references; extend `scripts/audit_lessons.py` with `check_output_contract()` and define an explicit opt-out for reference-only lessons instead of generating filler artifacts.

### Maturity / quality gaps

[!] **#1 Make all existing gates green and blocking** — table-stakes · effort ~2–4d · gap: high · impl: high  
Why: A curriculum cannot claim SOTA while its own canonical audit and content checks fail on the current tree.  
Study: [Raschka's multi-environment notebook/code CI](https://github.com/rasbt/LLMs-from-scratch/blob/main/.github/workflows/basic-tests-latest-python.yml), [Microsoft GenAI code-quality CI](https://github.com/microsoft/generative-ai-for-beginners/blob/main/.github/workflows/code-quality.yml).  
Step 1: edit `.github/workflows/curriculum.yml`, add a `site-tests` job running `node --test site/*.test.mjs site/lrn/test.mjs`, then fix until these four commands exit 0: `python3 scripts/audit_lessons.py`, `node scripts/ci-content-check.js`, `python3 scripts/check_readme_counts.py`, and the site test command.  
Verify: No new threshold ratchets that merely accept today's failures; counts must fall to zero or have explicit, reviewed exceptions.

[!] **#5 Make quantitative claims source-verifiable** — table-stakes · effort ~2–3d · gap: high · impl: high  
Why: 61 attributed percentage claims lack a same-paragraph link, including time-sensitive model, cost and benchmark claims.  
Study: [Raschka link-check workflow](https://github.com/rasbt/LLMs-from-scratch/blob/main/.github/workflows/check-links.yml) and canonical papers/specs already permitted by the repo rules.  
Step 1: use the exact paths printed by `node scripts/ci-content-check.js`, add primary-source links to each supported claim, remove claims that cannot be verified, and keep check 15 at threshold zero.  
Verify: Pricing/model claims must point to current official docs; academic performance claims to the paper or benchmark, not a secondary summary.

### Documentation / onboarding gaps

- Translation is the clearest reach gap: 0/598 lesson translations versus [Microsoft's 50+ maintained languages](https://github.com/microsoft/generative-ai-for-beginners#-multi-language-support). Treat German as the first complete vertical slice, not 598 machine-translated files at once.
- The root quickstart is too thin for four runtimes. Add a single supported environment matrix, canonical commands, expected outputs, API-key behavior and troubleshooting.
- Videos are an edge, not a blocker. Pilot short walkthroughs only for the 20–30 load-bearing lessons; Full Stack's [video + Colab lab format](https://github.com/the-full-stack/the-full-stack-website/blob/main/docs/course/2022/lab-5-troubleshooting-and-testing/index.md) is the useful reference.

### Optional cross-cluster ideas

- Borrowed from the hosted-course cluster: [Hugging Face Agents](https://github.com/huggingface/agents-course/blob/main/units/en/unit0/introduction.mdx) couples a final benchmark, public leaderboard and certificate. Optional strategic idea: a verified capstone challenge, not a generic completion badge.
- Borrowed from the interactive-textbook cluster: D2L has full chapters for [recommender systems](https://github.com/d2l-ai/d2l-en/tree/master/chapter_recommender-systems) and [Gaussian processes](https://github.com/d2l-ai/d2l-en/tree/master/chapter_gaussian-processes). The local curriculum has no dedicated lesson title for either; add them only after the quality backlog is under control.
- Borrowed from the university-assignment cluster: [Stanford CS336](https://github.com/stanford-cs336) uses fewer, deeper assignments with explicit systems deliverables. Optional strategic idea: consolidate selected Phase 19 micro-capstones into assessed multi-week tracks rather than adding more directories.

## What we already match

✅ 20-phase path · 598 English lesson docs · current LLM/RAG/MCP/agent/safety/production coverage · first-principles-to-library pedagogy · four implementation languages · browser Pyodide · placement/self-assessment · local progress/badges/capability tracking · 85 Phase-19 project/track directories · 534 lessons with reusable outputs · active 2026 maintenance · public site and contributor workflow.

## Evidence notes

- Local evidence was recomputed on 2026-08-24 from the current worktree, not copied from README counts.
- `python3 scripts/audit_lessons.py`: 598 lessons, 20 issues.
- `node scripts/ci-content-check.js`: 1/23 checks failed; 61 unsupported attributed percentage claims.
- `node --test site/*.test.mjs site/lrn/test.mjs`: 72 passed, 4 failed.
- `python3 scripts/check_readme_counts.py`: aborts because an obsolete README pattern no longer matches.
- Inventory: 396 quizzes, 96 `code/tests` directories, 534 non-empty outputs, 565 `.ipynb` files, 0 non-English lesson docs.
- Saturation disclosure: later searches found niche roadmaps and new low-maturity curricula, but no higher-maturity same-cluster comparator beyond the five direct peers retained here.
