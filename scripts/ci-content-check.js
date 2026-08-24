#!/usr/bin/env node
/**
 * CI content guardrail for the LHIND AI Learning Catalog.
 *
 * Implements the 17 checks from ABARBEITUNGSPLAN-FINAL.md §10 ("CI-Check") —
 * the guardrail meant to stop every defect class the 2026-08 remediation
 * project fixed (dead links, fabricated studies, invented model names,
 * quiz-answer-length bias, ...) from silently coming back.
 *
 * Design principle: every check reports a count, a threshold, and enough
 * detail to fix the specific offending file/line. A check that can't tell
 * the difference between a real defect and a legitimate pattern (an
 * intentionally shortened course-tile title, a benchmark-table percentage
 * that isn't an external claim, ...) is worse than no check — it gets
 * disabled the first time it cries wolf. Several checks below therefore
 * encode an explicit tolerance rule alongside the detector; see the comment
 * on each check for what it tolerates and why.
 *
 * THRESHOLDS is the single place to ratchet a limit down as content gets
 * fixed. Most checks are set to 0 (the defect class is supposed to be fully
 * clean). A few are deliberately set to today's measured baseline per the
 * plan's own instruction (checks 2, 5, 6, 11, 12) because the underlying
 * content work is large/ongoing and a 0 threshold would make the check
 * useless from day one — ratchet these down as content is fixed, don't
 * leave them here.
 *
 * Run: node scripts/ci-content-check.js
 * Exits non-zero iff at least one check's count exceeds its threshold.
 */
const { readFileSync, existsSync, readdirSync } = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const vm = require("node:vm");

const REPO = path.resolve(__dirname, "..");
const rel = (p) => path.relative(REPO, p);

function findFiles(globArg) {
  // Plain `find`, no external deps — matches house style of scripts/link_check.py
  // and scripts/test_runnable_blocks.mjs, which shell out the same way.
  return execSync(`find ${globArg}`, { cwd: REPO })
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Shared parsing: site/lrn/curriculum-map.js
//
// The file is plain JS assigning to `window.LrnCurriculumMap`, not JSON, so
// it's parsed with two targeted regexes rather than eval'd:
//   - every lesson entry is a single-line `{ path: "...", title: "..." }`
//     (verified: 413/413 entries match this exact shape today)
//   - every course id is a 4-space-indented `"COURSE-ID": [` header inside
//     the `courseMaps: { ... }` block
// ---------------------------------------------------------------------------
const CM_PATH = path.join(REPO, "site/lrn/curriculum-map.js");
const cmText = readFileSync(CM_PATH, "utf8");

function parseCurriculumMap(text) {
  const entryRe = /\{ path: "([^"]+)", title: "((?:[^"\\]|\\.)*)" \}/g;
  const lessonTitles = new Map(); // path -> title (each path has exactly one title repo-wide, verified)
  let m;
  while ((m = entryRe.exec(text))) {
    lessonTitles.set(m[1], m[2].replace(/\\"/g, '"'));
  }

  const startIdx = text.indexOf("courseMaps: {");
  const endIdx = text.indexOf("\n  },\n  omittedGroups");
  const body = text.slice(startIdx, endIdx === -1 ? undefined : endIdx);
  const headerRe = /^\s{4}"([A-Z0-9-]+)":\s*\[/gm;
  const headers = [];
  while ((m = headerRe.exec(body))) headers.push({ id: m[1], idx: m.index });

  const courses = {}; // courseId -> ordered array of lesson paths (with repeats within a course allowed)
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].idx;
    const end = i + 1 < headers.length ? headers[i + 1].idx : body.length;
    const chunk = body.slice(start, end);
    const lessons = [];
    let mm;
    const localRe = /\{ path: "([^"]+)", title: "((?:[^"\\]|\\.)*)" \}/g;
    while ((mm = localRe.exec(chunk))) lessons.push(mm[1]);
    courses[headers[i].id] = lessons;
  }
  return { lessonTitles, courses };
}

const { lessonTitles, courses } = parseCurriculumMap(cmText);
const curriculumPaths = [...lessonTitles.keys()].filter((p) => p !== "llm-primer");

// ---------------------------------------------------------------------------
// Results plumbing
// ---------------------------------------------------------------------------
const results = [];
function record(id, name, count, threshold, opts = {}) {
  const cmp = opts.cmp || ((c, t) => c > t); // default: fail if count exceeds threshold
  const pass = !cmp(count, threshold);
  const r = { id, name, count, threshold, pass, details: opts.details || [], note: opts.note };
  results.push(r);
  return r;
}

// =============================================================================
// THRESHOLDS — the one place to edit when ratcheting a limit down.
// =============================================================================
const THRESHOLDS = {
  // 18. ASE-Rollenmatrix-Integritaet. Strukturell, gehoert immer auf 0.
  c18_aseMatrix: 0,
  // 19. Buendelkurs (data.js tracks[LP03].bundles[].courses) muss in LP01
  //     oder LP03 kuratiert sein. Strukturell, gehoert immer auf 0.
  c19_bundleCourseNotCurated: 0,
  // 20. Keine AI-NN-Kurs-ID mehr im Katalog (00_REPORT.md Teil A). Nur noch
  //     LRN-NN und PRIMER-01. Strukturell, gehoert immer auf 0.
  c20_legacyCourseIds: 0,
  // 1. Every curriculum-map path has docs/en.md. Structural — should always be 0.
  c1_missingEnMd: 0,
  // 2. Every curriculum-map lesson's docs/en.md has a sibling docs/de.md.
  //    Curriculum-scoped, not repo-wide (§10-2) — repo-wide would equal the
  //    repo-wide count by construction and could never fail. The first
  //    five-lesson LRN-01 foundations slice is translated; ratchet this down
  //    whenever another complete slice lands.
  c2_missingDeMd: 170,
  // 3. Every quiz.json is the object form ({questions:[...]}), not a bare array.
  c3_arrayFormQuiz: 0,
  // 4. `correct` is a valid options index; no duplicate option strings.
  c4_badCorrectIndex: 0,
  c4_dupOptions: 0,
  // 5. Share of questions whose correct answer is the longest option.
  //    Target is <=40% (random-chance-shaped). Ratcheted from 89.5% (§10-5:
  //    the "moving target" comment that kept this at the stale 89.5%
  //    calibration, despite the same comment noting the real number had
  //    already dropped to 72.4-73.1%, didn't justify a permanent 20-point
  //    reserve) down to today's real measured value. Keep lowering as B13
  //    remediation continues toward 40%.
  c5_longestCorrectSharePct: 40,
  // 6. No empty `explanation`. Ratcheted from 401 (repo-wide max, could
  //    never fail) to today's real measured value, per §10-5's same
  //    "ratchet, don't chase a moving target with a permanent cushion"
  //    reasoning. Keep lowering as B14 remediation continues.
  c6_emptyExplanation: 383,
  // 7. Every ![...](...) reference resolves to a file on disk.
  c7_brokenImageRefs: 0,
  // 8. No "(covered in|see|from) Lesson N" cross-references (curriculum-scoped —
  //    see check-8 comment for why).
  c8_lessonCrossRefs: 0,
  // 9. H1 matches curriculum-map title (tolerating documented shortenings).
  c9_h1TitleMismatch: 0,
  // 10. "**Languages:** Python" only on lessons with >=1 fenced code block.
  c10_languagesNoCode: 0,
  // 11. **Time:** plausible vs word count (5-40 wpm). See check-11 comment:
  //     correlation is ~0 by design (time is not simply proportional to
  //     length), so this gates on the wpm-band violation count, not on
  //     correlation. PLAN: start at today's state.
  c11_implausibleTime: 0,
  // 12. Referenced phase/lesson appears earlier in the SAME LRN course.
  //     PLAN: start at today's state. See check-12 comment: this diverges
  //     materially from the plan's original "92 of 112" estimate.
  c12_phaseOrderViolations: 21,
  // 13. Mojibake / stray HTML entities / doubled spaces / unbalanced fences.
  c13_mojibake: 0,
  c13_entities: 0,
  c13_doubleSpace: 0,
  c13_unbalancedFences: 0,
  // 14. Model names against a denylist of specifically-confirmed fabrications.
  //     See check-14 comment — this is a denylist, not a strict allowlist,
  //     by design (see report).
  c14_denylistedModelNames: 0,
  // 15. Every percentage attributed to an org/study has a source link in the
  //     same paragraph. Heuristic, see check-15 comment for false-positive
  //     design. No PLAN-mandated baseline exemption, but today's count is
  //     nonzero (F7 remediation is not finished) — surfaced honestly.
  c15_unsourcedPercent: 0,
  // 16. Every /api/... path a notebook actually calls resolves to a route
  //     server/server.js serves.
  c16_deadApiCalls: 0,
};

// =============================================================================
// Check 1 — every curriculum-map path has docs/en.md
// llm-primer is excluded: it ships as site/llm-primer/content/*.json, not a
// phases/**/docs/en.md doc, and that's a deliberate product decision, not a
// gap.
// =============================================================================
function check1() {
  const details = [];
  for (const p of curriculumPaths) {
    const f = path.join(REPO, p, "docs/en.md");
    if (!existsSync(f)) details.push(`${p} -> missing docs/en.md`);
  }
  return record("1", "curriculum-map path has docs/en.md", details.length, THRESHOLDS.c1_missingEnMd, { details });
}

// =============================================================================
// Check 2 — every docs/en.md has a sibling docs/de.md
// Repo-wide (the plan's wording is "jede docs/en.md", not curriculum-scoped).
// =============================================================================
function check2() {
  const files = findFiles(`phases -name en.md -path "*/docs/*"`);
  const details = [];
  for (const f of files) {
    const de = f.replace(/en\.md$/, "de.md");
    if (!existsSync(path.join(REPO, de))) details.push(f);
  }
  const curriculumScopedMissing = curriculumPaths.filter(
    (p) => !existsSync(path.join(REPO, p, "docs/de.md"))
  ).length;
  // Gated on the curriculum-scoped count, not the repo-wide one: repo-wide
  // A repo-wide missing count largely follows the total lesson inventory and
  // obscures whether the curated curriculum is translated. The gated count
  // therefore uses curriculumPaths, which is what the LRN surface ships.
  return record("2", "docs/en.md has sibling docs/de.md (curriculum-scoped)", curriculumScopedMissing, THRESHOLDS.c2_missingDeMd, {
    details: details.slice(0, 5).concat([`... ${details.length} total (repo-wide); ${curriculumScopedMissing}/${curriculumPaths.length} missing within curriculum-map lessons`]),
  });
}

// =============================================================================
// Check 3 — quiz.json is the object form, not a bare array
// Repo-wide (every quiz.json under phases/, not just curriculum-mapped ones —
// non-curriculum lessons are still directly reachable via the phase browser).
// =============================================================================
function loadQuizFiles() {
  const files = findFiles(`phases -name quiz.json`);
  return files.map((f) => {
    let data = null, parseError = null;
    try {
      data = JSON.parse(readFileSync(path.join(REPO, f), "utf8"));
    } catch (e) {
      parseError = e.message;
    }
    return { f, data, parseError };
  });
}
const quizFiles = loadQuizFiles();

function check3() {
  const details = [];
  for (const { f, data, parseError } of quizFiles) {
    if (parseError) { details.push(`${f}: JSON parse error: ${parseError}`); continue; }
    if (Array.isArray(data)) details.push(`${f}: bare array form`);
    else if (!data || !Array.isArray(data.questions)) details.push(`${f}: no "questions" array`);
  }
  return record("3", "quiz.json uses object form", details.length, THRESHOLDS.c3_arrayFormQuiz, { details });
}

// =============================================================================
// Check 4 — `correct` is a valid options index; no duplicate option strings
// =============================================================================
function check4() {
  const badIndex = [], dupOptions = [];
  for (const { f, data } of quizFiles) {
    const qs = Array.isArray(data) ? data : data && data.questions;
    if (!Array.isArray(qs)) continue;
    qs.forEach((q, i) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      if (!(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < opts.length)) {
        badIndex.push(`${f} q${i}: correct=${JSON.stringify(q.correct)} options.length=${opts.length}`);
      }
      const uniq = new Set(opts.map((o) => String(o).trim()));
      if (uniq.size !== opts.length) dupOptions.push(`${f} q${i}: duplicate option string`);
    });
  }
  record("4a", "quiz correct index valid", badIndex.length, THRESHOLDS.c4_badCorrectIndex, { details: badIndex });
  return record("4b", "quiz no duplicate options", dupOptions.length, THRESHOLDS.c4_dupOptions, { details: dupOptions });
}

// =============================================================================
// Check 5 — share of questions whose correct answer is the longest option
// Curriculum-scoped numbers are reported alongside for context (they're what
// the plan's own calibration used), but the gate is repo-wide per the plan's
// literal "jede quiz.json" wording (same scope as checks 3/4/6).
// Ties (correct option shares the max length with a distractor) count as
// "longest" — a tied-longest answer is still an exploitable length cue.
// =============================================================================
function check5() {
  let total = 0, longest = 0;
  let curTotal = 0, curLongest = 0;
  for (const { f, data } of quizFiles) {
    const qs = Array.isArray(data) ? data : data && data.questions;
    if (!Array.isArray(qs)) continue;
    const isCurriculum = curriculumPaths.some((p) => f === `${p}/quiz.json`);
    for (const q of qs) {
      const opts = Array.isArray(q.options) ? q.options : [];
      if (!(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < opts.length)) continue;
      total++;
      if (isCurriculum) curTotal++;
      const lens = opts.map((o) => String(o).length);
      const maxLen = Math.max(...lens);
      if (lens[q.correct] === maxLen) {
        longest++;
        if (isCurriculum) curLongest++;
      }
    }
  }
  const pct = total ? (100 * longest) / total : 0;
  const curPct = curTotal ? (100 * curLongest) / curTotal : 0;
  return record("5", "share of questions where longest option is correct", Number(pct.toFixed(1)), THRESHOLDS.c5_longestCorrectSharePct, {
    details: [
      `repo-wide: ${longest}/${total} = ${pct.toFixed(1)}%`,
      `curriculum-scoped (180 lesson paths): ${curLongest}/${curTotal} = ${curPct.toFixed(1)}%`,
      `target per plan: <=40% (random-chance-shaped)`,
    ],
  });
}

// =============================================================================
// Check 6 — no empty `explanation`
// =============================================================================
function check6() {
  const details = [];
  for (const { f, data } of quizFiles) {
    const qs = Array.isArray(data) ? data : data && data.questions;
    if (!Array.isArray(qs)) continue;
    qs.forEach((q, i) => {
      if (!q.explanation || !String(q.explanation).trim()) details.push(`${f} q${i}`);
    });
  }
  return record("6", "no empty quiz explanation", details.length, THRESHOLDS.c6_emptyExplanation, { details: details.slice(0, 10).concat([`... ${details.length} total`]) });
}

// =============================================================================
// Check 7 — every ![...](...) reference resolves to a file on disk
// External (http/https) image URLs are out of scope (that's link_check.py's
// job, which validates external HTTP links repo-wide).
// =============================================================================
function check7() {
  const files = findFiles(`phases -path "*/docs/en.md"`);
  const IMG_RE = /!\[[^\]]*\]\(([^)]+)\)/g;
  const details = [];
  let total = 0;
  for (const f of files) {
    const txt = readFileSync(path.join(REPO, f), "utf8");
    let m;
    IMG_RE.lastIndex = 0;
    while ((m = IMG_RE.exec(txt))) {
      total++;
      const target = m[1].trim().split(/\s+/)[0];
      if (/^https?:\/\//.test(target)) continue;
      const resolved = path.resolve(path.dirname(path.join(REPO, f)), target);
      if (!existsSync(resolved)) details.push(`${f}: ![](${target}) does not resolve`);
    }
  }
  return record("7", "image references resolve to a file", details.length, THRESHOLDS.c7_brokenImageRefs, { details, note: `${total} image references checked` });
}

// =============================================================================
// Check 8 — no "(covered in|see|from) Lesson N" cross-references
//
// Scoped to the 180 curriculum-map lesson paths, not repo-wide. Verified:
// repo-wide the same regex hits 59 times across 39 files (mostly in
// deep-math/capstone content the LRN product never surfaces), but restricted
// to curriculum-map paths it hits exactly 16 times across 11 files — which
// is what actually reaches a learner and is the number check 12 also builds
// on. The repo-wide count is reported as an informational note.
// =============================================================================
const REF_RE = () => /(covered in|see|from)\s+Lesson\s+(\d+)/gi;

function check8() {
  const details = [];
  let repoWideTotal = 0, repoWideFiles = new Set();
  const allFiles = findFiles(`phases -path "*/docs/en.md"`);
  for (const f of allFiles) {
    const txt = readFileSync(path.join(REPO, f), "utf8");
    const re = REF_RE();
    let m;
    while ((m = re.exec(txt))) { repoWideTotal++; repoWideFiles.add(f); }
  }
  for (const p of curriculumPaths) {
    const f = `${p}/docs/en.md`;
    const txt = readFileSync(path.join(REPO, f), "utf8");
    const re = REF_RE();
    let m;
    while ((m = re.exec(txt))) details.push(`${f}: "${m[0]}"`);
  }
  return record("8", "no numbered cross-references in curriculum lessons", details.length, THRESHOLDS.c8_lessonCrossRefs, {
    details,
    note: `informational: repo-wide (all ${allFiles.length} docs, not just the 180 curriculum-mapped ones) this pattern hits ${repoWideTotal} times across ${repoWideFiles.size} files`,
  });
}

// =============================================================================
// Check 9 — H1 matches curriculum-map title
//
// Tolerates two documented patterns, per the plan:
//   - H1 = title, optionally followed by " — subtitle", ": subtitle", or a
//     trailing "(2026)"-style parenthetical (deliberate shortenings — ~139
//     of these across the corpus)
//   - H1 = "Capstone Lesson NN: " + title (capstone lessons carry a lesson
//     number prefix in the doc that the course tile deliberately drops)
// Anything else — title text missing from the H1 entirely, or a mid-string
// wording change — is a real mismatch.
// =============================================================================
function normTitle(s) {
  return s.trim().replace(/[.:!?"'’”]+$/, "").toLowerCase();
}

function check9() {
  const details = [];
  let shortenings = 0;
  for (const p of curriculumPaths) {
    const title = lessonTitles.get(p);
    const doc = readFileSync(path.join(REPO, p, "docs/en.md"), "utf8");
    const h1m = doc.match(/^#\s+(.+)$/m);
    if (!h1m) { details.push(`${p}: no H1 found (title: "${title}")`); continue; }
    const h1 = h1m[1].trim();
    const h1core = h1.replace(/^Capstone Lesson \d+:\s*/i, "");
    const nTitle = normTitle(title), nH1 = normTitle(h1core);
    if (nTitle === nH1) continue;
    if (nH1.startsWith(nTitle)) {
      const rest = h1core.slice(title.length).trim();
      if (/^[—:(-]/.test(rest) || rest === "") { shortenings++; continue; }
    }
    details.push(`${p}: title="${title}" H1="${h1}"`);
  }
  return record("9", "H1 matches curriculum-map title", details.length, THRESHOLDS.c9_h1TitleMismatch, {
    details,
    note: `${shortenings} deliberate shortenings tolerated (H1 = title + " — subtitle"/": subtitle"/capstone-number prefix)`,
  });
}

// =============================================================================
// Check 10 — "**Languages:** Python" only on lessons with actual Python code
// Curriculum-scoped: the "Languages:" metadata line only means anything in
// the context of a rendered lesson page, and only curriculum-mapped lessons
// are rendered that way. "Has code" is either a fenced ``` block in the
// prose (not specifically ```python — a mermaid diagram or a bash snippet
// still counts as *some* code demonstration) OR a code/main.py file, which
// lesson.html fetches and renders as its own panel independent of the
// prose (site/lesson.html: codeUrl = lessonPath + '/code/main.py') — a
// lesson with a substantive code/main.py and no inline fence still has
// real Python on the page. Checked every one of the lessons this used to
// flag: all had a real, non-trivial code/main.py (83+ lines), none were
// dead stubs — the original narrower check was a false-positive class,
// not a content defect (B23).
// =============================================================================
function check10() {
  const details = [];
  for (const p of curriculumPaths) {
    const doc = readFileSync(path.join(REPO, p, "docs/en.md"), "utf8");
    if (!/\*\*Languages:\*\*\s*Python/i.test(doc)) continue;
    if (/```/.test(doc)) continue;
    const codeFile = path.join(REPO, p, "code/main.py");
    if (existsSync(codeFile) && readFileSync(codeFile, "utf8").split("\n").length > 10) continue;
    details.push(`${p}/docs/en.md`);
  }
  return record("10", "Languages:Python only on lessons with actual Python code", details.length, THRESHOLDS.c10_languagesNoCode, { details });
}

// =============================================================================
// Check 11 — **Time:** plausible vs word count (5-40 words/minute)
//
// The plan itself notes the actual correlation between stated time and word
// count is ~0 (measured here: -0.07 on the 179 curriculum lessons) — time
// estimates and lesson length are simply not proportional in this corpus (a
// short lesson with a dense worked example can be "quoted" longer than a
// long lesson that's mostly prose). So this check does NOT gate on
// correlation (there's nothing to ratchet — a near-zero correlation isn't a
// bug to fix). It reports the correlation as a diagnostic and gates only on
// the count of lessons whose wpm falls outside a generous [5,40] band,
// which are lessons that are much more likely to have a copy-pasted time
// estimate.
// =============================================================================
function check11() {
  const times = [], words = [], perLesson = [];
  for (const p of curriculumPaths) {
    const doc = readFileSync(path.join(REPO, p, "docs/en.md"), "utf8");
    const tm = doc.match(/\*\*Time:\*\*\s*~?(\d+)(?:[-–](\d+))?\s*min/i);
    if (!tm) continue;
    const t = tm[2] ? (parseInt(tm[1], 10) + parseInt(tm[2], 10)) / 2 : parseInt(tm[1], 10);
    const body = doc.replace(/```[\s\S]*?```/g, " ");
    const wc = (body.match(/[A-Za-z][A-Za-zÀ-ÿ]*/g) || []).length;
    times.push(t); words.push(wc);
    perLesson.push({ p, t, wc, wpm: wc / t });
  }
  const n = times.length;
  const meanT = times.reduce((a, b) => a + b, 0) / n;
  const meanW = words.reduce((a, b) => a + b, 0) / n;
  let num = 0, dt = 0, dw = 0;
  for (let i = 0; i < n; i++) { num += (times[i] - meanT) * (words[i] - meanW); dt += (times[i] - meanT) ** 2; dw += (words[i] - meanW) ** 2; }
  const corr = num / Math.sqrt(dt * dw);
  const violations = perLesson.filter((x) => x.wpm < 5 || x.wpm > 40);
  const wpmSorted = perLesson.map((x) => x.wpm).sort((a, b) => a - b);
  return record("11", "Time estimate plausible vs word count", violations.length, THRESHOLDS.c11_implausibleTime, {
    details: violations.map((v) => `${v.p}: ${v.t}min, ${v.wc} words, ${v.wpm.toFixed(1)} wpm`),
    note: `n=${n}, correlation(time,words)=${corr.toFixed(3)} (near zero — see comment), wpm distribution min/median/max = ${wpmSorted[0].toFixed(1)}/${wpmSorted[Math.floor(n / 2)].toFixed(1)}/${wpmSorted[n - 1].toFixed(1)}`,
  });
}

// =============================================================================
// Check 12 — referenced phase/lesson appears earlier in the SAME course
//
// Reuses the "Lesson N" cross-references from check 8, but this time
// resolves N to a sibling lesson folder within the SAME phase directory
// (e.g. "See Lesson 06" inside phases/11-llm-engineering/08-.../docs/en.md
// resolves to phases/11-llm-engineering/06-...) and checks: for every LRN
// course that contains the referencing lesson, does the resolved sibling
// also appear in that course, at an earlier position?
//
// This diverges materially from the plan's original "92 of 112" estimate —
// verified here as 21 violations across 26 course-lesson reference
// instances (curriculum-map-scoped). Two things could explain the gap: (a)
// the plan's number may have been computed before some ordering fixes
// landed, or (b) "112" was counting something else (e.g. every repo-wide
// reference instance, phase-local rather than course-local). Both a
// phase-local repo-wide variant (59 refs / 8 "violations") and this
// course-scoped variant were checked by hand; neither reproduces 92/112.
// The course-scoped definition is used here because it's the one that
// matches the check's own description ("im Kurs" = in the LRN course) and
// is the one a learner actually experiences.
// =============================================================================
function buildPhaseIndex() {
  const idx = {};
  for (const phaseDir of readdirSync(path.join(REPO, "phases"))) {
    let entries;
    try { entries = readdirSync(path.join(REPO, "phases", phaseDir)); } catch { continue; }
    idx[phaseDir] = {};
    for (const e of entries) {
      const mm = e.match(/^(\d+)-/);
      if (mm) idx[phaseDir][parseInt(mm[1], 10)] = `phases/${phaseDir}/${e}`;
    }
  }
  return idx;
}

function check12() {
  const phaseIndex = buildPhaseIndex();
  const details = [];
  let refInstances = 0;
  for (const [courseId, lessonPaths] of Object.entries(courses)) {
    for (let pos = 0; pos < lessonPaths.length; pos++) {
      const lp = lessonPaths[pos];
      if (lp === "llm-primer") continue;
      const docPath = path.join(REPO, lp, "docs/en.md");
      if (!existsSync(docPath)) continue;
      const txt = readFileSync(docPath, "utf8");
      const re = REF_RE();
      let m;
      while ((m = re.exec(txt))) {
        refInstances++;
        const num = parseInt(m[2], 10);
        const phaseDir = lp.split("/")[1];
        const targetPath = phaseIndex[phaseDir] && phaseIndex[phaseDir][num];
        if (!targetPath) { details.push(`[${courseId}] ${lp}: "${m[0]}" -> no lesson ${num} exists in ${phaseDir}`); continue; }
        const targetPos = lessonPaths.indexOf(targetPath);
        if (targetPos === -1) { details.push(`[${courseId}] ${lp}: "${m[0]}" -> ${targetPath} is not in this course`); continue; }
        if (targetPos >= pos) { details.push(`[${courseId}] ${lp}: "${m[0]}" -> ${targetPath} at course position ${targetPos}, not before ${pos}`); }
      }
    }
  }
  return record("12", "referenced lesson appears earlier in the same course", details.length, THRESHOLDS.c12_phaseOrderViolations, {
    details,
    note: `${refInstances} course-lesson reference instances checked (curriculum-map-scoped)`,
  });
}

// =============================================================================
// Check 13 — mojibake / stray HTML entities / doubled spaces / unbalanced fences
//
// All four sub-checks are careful about false positives seen during
// calibration:
//   - doubled spaces: table rows (`| a  | b |`) and math with spaced
//     operators are legitimate and excluded; inline code spans are
//     neutralized (not stripped — stripping them naively creates a *fake*
//     double space out of "word `code` word").
//   - unbalanced fences: only ``` at the start of a line counts as a fence
//     delimiter. A naive substring count breaks on lines like an assistant-
//     prefill example that contains an escaped ```json inside a quoted
//     string — this produced a false positive during calibration.
//   - entities: only entities that are near-certain copy/paste artifacts
//     (smart quotes, mdash/ndash, nbsp) are flagged. &gt;/&lt;/&amp; are
//     common and legitimate in this corpus (avoiding markdown table/
//     blockquote parsing ambiguity around raw </>) and are not flagged.
// =============================================================================
function check13() {
  const files = findFiles(`phases -path "*/docs/en.md"`);
  const MOJIBAKE = /\u00c3[\u0080-\u00bf]|\u00e2\u20ac[\u0098\u0099\u009c\u009d\u0093\u0094]|\u00c2[\u00ae\u00a9\u00b0]|\ufffd/;
  const ENTITY = /&(rsquo|lsquo|rdquo|ldquo|mdash|ndash|nbsp|#8217|#8220|#8221);/g;
  const mojibakeDetails = [], entityDetails = [], doubleSpaceDetails = [], fenceDetails = [];
  for (const f of files) {
    const txt = readFileSync(path.join(REPO, f), "utf8");
    if (MOJIBAKE.test(txt)) mojibakeDetails.push(f);
    const em = txt.match(ENTITY);
    if (em) entityDetails.push(`${f}: ${em.length} entity occurrence(s)`);

    const lines = txt.split("\n");
    let inFence = false, fenceLines = 0;
    lines.forEach((line, i) => {
      if (/^```/.test(line.trim())) { inFence = !inFence; fenceLines++; return; }
      if (inFence) return;
      if (/^\s*\|/.test(line)) return; // table row
      const neutralized = line.replace(/`[^`]*`/g, "X"); // keep spacing, drop code content
      if (/[a-zA-Z,;:]  +[a-zA-Z(]/.test(neutralized)) doubleSpaceDetails.push(`${f}:${i + 1}: ${line.trim().slice(0, 100)}`);
    });
    if (fenceLines % 2 !== 0) fenceDetails.push(f);
  }
  record("13a", "no mojibake", mojibakeDetails.length, THRESHOLDS.c13_mojibake, { details: mojibakeDetails });
  record("13b", "no stray copy/paste HTML entities", entityDetails.length, THRESHOLDS.c13_entities, { details: entityDetails });
  record("13c", "no doubled spaces (outside tables/code)", doubleSpaceDetails.length, THRESHOLDS.c13_doubleSpace, { details: doubleSpaceDetails.slice(0, 10).concat(doubleSpaceDetails.length > 10 ? [`... ${doubleSpaceDetails.length} total`] : []) });
  return record("13d", "balanced code fences", fenceDetails.length, THRESHOLDS.c13_unbalancedFences, { details: fenceDetails });
}

// =============================================================================
// Check 14 — model names against a positive allowlist
//
// Implemented as an ALLOWLIST (pattern-based) with a curated DENYLIST that
// wins on conflict, for one deliberate reason spelled out in the task: a
// naive strict allowlist would either (a) need to enumerate every real model
// name variant that will ever be typed in this corpus — a losing battle,
// given the plan's own rule 1 ("check currency claims against the live web,
// never against training knowledge") means new real names appear monthly —
// or (b) false-positive on comparative phrases like "GPT-4-class model" or
// unrelated names that happen to share a token shape ("Show-o2" is a real,
// unrelated model, not a mangled OpenAI "o2").
//
// So: ALLOWLIST_PATTERNS recognize known-real name shapes per vendor
// (verified against the live web this run — see report for the specific
// verification: GPT-5.4/5.4-mini/nano/Codex, Claude Opus 4.6/4.7,
// Claude Sonnet 4.6, Gemini 3/3.1 Pro, DeepSeek-V3.2 were all confirmed
// real and newer than this agent's training cutoff). DENYLIST holds
// specific strings confirmed FABRICATED — either from the plan (F6: "Llama
// 4 70B/8B", standalone "o4") or newly found this run via live web
// verification (see report): "Mistral-8B" (should be "Ministral-8B" — the
// actual Mistral 8B-class model), and "Claude Sonnet 4.7" (Anthropic's
// Sonnet line went 4.5 -> 4.6 -> 5; multiple independent sources confirm
// Sonnet 4.7 was never released — Opus and Sonnet don't share version
// numbers, unlike what this phrasing implies).
//
// Anything that looks model-name-shaped but matches neither list is
// reported as UNVERIFIED (printed, NOT counted toward the failing
// threshold) — per the task's explicit instruction not to guess. A human
// (or a future run with more web-verification budget) should periodically
// review the unverified bucket and promote entries to one list or the
// other.
// =============================================================================
const DENYLIST = [
  { re: /\bLlama 4 (70B|8B|405B)\b/g, why: "Llama 4 only ships as Scout/Maverick/Behemoth, not raw B-sizes (plan F6)" },
  { re: /(?<!Mini)\bMistral-8B\b/g, why: 'should be "Ministral-8B" (plan §9 NICHT ÄNDERN list)' },
  { re: /(?<![-A-Za-z])o4\b(?!-mini)/g, why: 'only "o4-mini" ever shipped; bare "o4" is not a real OpenAI model (plan F6)' },
  { re: /Claude Sonnet 4\.7\b/g, why: "Sonnet line went 4.5 -> 4.6 -> 5; Sonnet 4.7 was never released (verified live web this run, see report)" },
];

const ALLOWLIST_PATTERNS = [
  /\bGPT-[1-6](\.[0-9])?(-mini|-nano|-Codex|-turbo|-preview|o)?\b/,
  /\bo[134](-mini|-pro)?\b/,
  /\bClaude (Opus|Sonnet|Haiku) [3-5](\.[0-9])?\b/,
  /\bClaude Fable [4-9]\b/,
  /\bClaude [3-5](\.[0-9])?\b/,
  /\bLlama [1-4](\.[0-9])?( (Scout|Maverick|Behemoth|Chat))?( \d+B)?\b/,
  /\bGemini [1-4](\.[0-9])?( ?(Pro|Flash|DeepThink|Live|Computer))?\b/,
  /\bDeepSeek-(V[2-3](\.[0-9])?|R1)(-Exp)?\b/,
  /\bQwen[2-3]?(\.[0-9])?\b/,
  /\bMinistral-8B\b/,
  /\bMistral (7B|Large)\b/,
  /\bGrok [3-4]\b/,
];

const MODEL_CANDIDATE_RE = /\b(GPT-[0-9][^\s,.)]*|Claude [A-Za-z0-9. ]+?[0-9](\.[0-9]+)?|Llama [0-9][^\s,.)]*(?: [0-9]+B)?|Gemini [0-9][^\s,.)]*|o[1-4](-mini|-pro)?|Mistral[- ][A-Za-z0-9]+|Ministral[- ][A-Za-z0-9]+|DeepSeek-[A-Za-z0-9.-]+|Qwen[0-9.]*|Grok[- ]?[0-9])/g;

function check14() {
  // Was docs/en.md only, which structurally could never catch the F6-1
  // Llama-4 fabrications living in code/main.py and outputs/skill-*.md
  // Scan every relevant text format, but never decode binary demo artifacts:
  // arbitrary PNG bytes can contain denylisted byte sequences by chance.
  const files = findFiles(
    `phases -type f \\( -name "*.md" -o -name "*.py" -o -name "*.ts" -o -name "*.js" -o -name "*.rs" -o -name "*.jl" -o -name "*.json" -o -name "*.ipynb" -o -name "*.svg" -o -name "*.yaml" -o -name "*.yml" -o -name "*.txt" \\)`
  );
  const denyHits = [];
  const unverified = new Map(); // string -> count
  for (const f of files) {
    const txt = readFileSync(path.join(REPO, f), "utf8");
    for (const { re, why } of DENYLIST) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(txt))) denyHits.push(`${f}: "${m[0]}" — ${why}`);
    }
    MODEL_CANDIDATE_RE.lastIndex = 0;
    let cm;
    while ((cm = MODEL_CANDIDATE_RE.exec(txt))) {
      const cand = cm[0];
      if (DENYLIST.some(({ re }) => { re.lastIndex = 0; return re.test(cand); })) continue;
      if (ALLOWLIST_PATTERNS.some((p) => p.test(cand))) continue;
      unverified.set(cand, (unverified.get(cand) || 0) + 1);
    }
  }
  return record("14", "model names against denylist of confirmed fabrications", denyHits.length, THRESHOLDS.c14_denylistedModelNames, {
    details: denyHits,
    note: `${unverified.size} distinct unverified model-shaped strings NOT counted toward the threshold (e.g. bare "Claude 4.7" appears 5x — plausible shorthand for Opus 4.7, not confirmed fabricated, left off the denylist per instructions): ${[...unverified.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k}(${v})`).join(", ")}`,
  });
}

// =============================================================================
// Check 15 — every percentage attributed to an org/study has a source link
// in the same paragraph
//
// The plan's own warning: a naive "flag every %" rule produces ~650
// paragraph-level hits in this corpus (benchmark tables, cache-hit rates,
// discount tiers, sampling params — none of which are "claims" needing a
// citation). This narrows to paragraphs that BOTH contain a percentage AND
// read like an attributed external claim: either "<research org> <year|
// eval|survey|study|report|index>" (McKinsey/Gartner/Stanford HAI/Nielsen/
// Databricks/LangChain/PMI/Anthropic/OpenAI/Google/Meta, immediately
// followed by a year or study-shaped word — NOT just the bare vendor name,
// which is ubiquitous in this corpus for ordinary product mentions like
// "OpenAI's text-embedding-3-small"), or generic study language ("a study
// found that", "according to a 2025 survey", ...). A paragraph is
// considered sourced if it contains an actual link (markdown link or bare
// URL) anywhere in the same paragraph — this matches the remediated F7
// citation style seen in this repo (`... 20% ([Org — Title](https://...))`).
//
// Reported both ways per the task instruction: total %-paragraphs (~651,
// almost all mechanical/benchmark, not gated) vs. attribution-triggered
// paragraphs (69) vs. attribution-triggered-and-unsourced (the gated
// count).
// =============================================================================
function check15() {
  const files = findFiles(`phases -path "*/docs/en.md"`);
  const PCT_RE = /\d[\d.,]*\s?%/;
  const ORG_YEAR_RE = /\b(McKinsey|Gartner|Stanford(?: HAI)?|Nielsen|NN\/?g(?:roup)?|Databricks|LangChain|PMI|Anthropic|OpenAI|Google|Meta)\s+(?:\(?20\d\d\)?|eval(?:s)?|survey|study|report|index)/i;
  const GENERIC_RE = /\b(study|survey|report(?:ed|s)?|found that|according to (?:a |the )?(?:20\d\d )?(?:study|survey|report)|research (?:shows|found|by))\b/i;
  const LINK_RE = /\[[^\]]*\]\(https?:\/\/[^)]+\)|https?:\/\/\S+/;
  // Explicitly labeled teaching examples are invented inputs for practicing a
  // calculation or decision. They are not evidence claims. The label is
  // required so an external-looking number cannot silently pass as fact.
  const EXPLICIT_EXAMPLE_RE = /(?:\bhypothetical (?:case|scenario|example)\b|\bworked example \(hypothetical\)|\billustrative (?:scenario|figures|assumptions)\b)/i;

  let totalPctParas = 0, attribParas = 0;
  const details = [];
  for (const f of files) {
    const txt = readFileSync(path.join(REPO, f), "utf8");
    const noCode = txt.replace(/```[\s\S]*?```/g, "");
    for (const p of noCode.split(/\n\s*\n/)) {
      if (!PCT_RE.test(p)) continue;
      totalPctParas++;
      if (!(ORG_YEAR_RE.test(p) || GENERIC_RE.test(p))) continue;
      attribParas++;
      if (EXPLICIT_EXAMPLE_RE.test(p)) continue;
      if (!LINK_RE.test(p)) details.push(`${f}: ${p.replace(/\s+/g, " ").trim().slice(0, 160)}`);
    }
  }
  return record("15", "attributed percentages have a source link", details.length, THRESHOLDS.c15_unsourcedPercent, {
    details,
    note: `${totalPctParas} paragraphs contain a "%" repo-wide; ${attribParas} of those read as an attributed external claim (the relevant subset); ${details.length} of THOSE lack a link in-paragraph (the gated count)`,
  });
}

// =============================================================================
// Check 16 — every /api/... path a notebook calls resolves to a route
// server/server.js serves
//
// All 53 notebooks call the LLM gateway exclusively through lrn_llm.py's
// `API_BASE` constant (verified: no notebook.py hardcodes a raw /api/ path
// itself), which is appended with "/chat/completions" at call time. This
// directly encodes the B31 regression: GET/POST /api/llm 404'd because the
// route registered in server.js was /api/llm/chat/completions, not
// /api/llm.
// =============================================================================
function check16() {
  const serverSrc = readFileSync(path.join(REPO, "server/server.js"), "utf8");
  const served = new Set();
  const routeRe = /pathOnly\s*===\s*'([^']+)'/g;
  let m;
  while ((m = routeRe.exec(serverSrc))) served.add(m[1]);

  const lrnLlmFiles = findFiles(`phases -name lrn_llm.py`);
  const bases = new Set();
  for (const f of lrnLlmFiles) {
    const txt = readFileSync(path.join(REPO, f), "utf8");
    const bm = txt.match(/^API_BASE\s*=\s*"([^"]+)"/m);
    if (bm) bases.add(bm[1]);
  }
  // notebook.py files can override lrn_llm.API_BASE directly; check those too.
  const notebookFiles = findFiles(`phases -name "notebook*.py"`);
  for (const f of notebookFiles) {
    const txt = readFileSync(path.join(REPO, f), "utf8");
    const bm = txt.match(/lrn_llm\.API_BASE\s*=\s*"([^"]+)"/);
    if (bm) bases.add(bm[1]);
  }

  const details = [];
  for (const base of bases) {
    const resolved = base.replace(/\/$/, "") + "/chat/completions";
    if (!served.has(resolved)) details.push(`API_BASE="${base}" -> ${resolved} is not served by server.js (served: ${[...served].join(", ")})`);
  }
  return record("16", "notebook /api/ calls resolve to a served route", details.length, THRESHOLDS.c16_deadApiCalls, {
    details,
    note: `${bases.size} distinct API_BASE value(s) across ${lrnLlmFiles.length} lrn_llm.py copies + notebook overrides; server.js serves: ${[...served].join(", ")}`,
  });
}

// =============================================================================
// Run all checks, print report, set exit code
// =============================================================================

// -----------------------------------------------------------------------------
// 18. ASE-Rollenmatrix: Integritaet der Zuordnung Kurs -> (Auspraegung, Tiefe).
//     Strukturell, gehoert immer auf 0. 5 Auspraegungen x 3 Tiefen = 15 Zellen
//     seit der Migration von aseLevels (L1-L4) auf die Tiefenachse
//     (00_REPORT.md Teil B1/B5) — depthAdmissible ist mit L1-L4 entfallen,
//     die Tiefe ist jetzt selbst die Achse. Faengt drei Fehlerklassen:
//     (a) unbekannte Rollen-ID, (b) unbekannter Tiefenwert (nicht
//     Acquire/Deepen/Create), (c) eine Zelle der 5x3-Matrix ist leer.
// -----------------------------------------------------------------------------
function check18() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(path.join(REPO, "site/lrn/data.js"), "utf8"), sandbox);
  const data = sandbox.window.LrnData;

  if (!data || !data.aseRoles) {
    record("18", "ASE matrix integrity", 0, THRESHOLDS.c18_aseMatrix, {
      note: "uebersprungen: data.js traegt keine aseRoles (Vor-Migrations-Stand)",
    });
    return;
  }

  const DEPTHS = ["Acquire", "Deepen", "Create"];
  const roleIds = new Set(data.aseRoles.map((r) => r.id));
  const problems = [];
  const cell = new Map();
  for (const r of data.aseRoles) for (const d of DEPTHS) cell.set(r.id + ":" + d, 0);

  for (const c of data.courses) {
    if (!c.ase) continue;
    for (const a of c.ase) {
      if (!roleIds.has(a.role)) {
        problems.push(`${c.id}: unbekannte Rollen-ID "${a.role}"`);
        continue;
      }
      for (const d of a.depths || []) {
        if (!DEPTHS.includes(d)) {
          problems.push(`${c.id}: unbekannter Tiefenwert "${d}"`);
          continue;
        }
        const key = a.role + ":" + d;
        cell.set(key, cell.get(key) + 1);
      }
    }
  }

  for (const [k, n] of cell) if (n === 0) problems.push(`Zelle ${k} ist leer`);

  const tagged = data.courses.filter((c) => c.ase).length;
  record("18", "ASE matrix integrity (role/depth valid, no empty cell)", problems.length, THRESHOLDS.c18_aseMatrix, {
    details: problems,
    note: `${tagged}/${data.courses.length} Kurse tragen ein ase-Feld, ${cell.size} Zellen geprueft`,
  });
}

// -----------------------------------------------------------------------------
// 19. Jeder Kurs in einem Academy-Buendel (tracks[LP03].bundles[].courses)
//     muss in LP01 oder LP03 kuratiert sein — sonst waere er im Buendel
//     sichtbar, aber im Katalog selbst unerreichbar. Strukturell, immer 0.
//     00_REPORT.md Teil B3/E2 Schritt 8.
// -----------------------------------------------------------------------------
function check19() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(path.join(REPO, "site/lrn/data.js"), "utf8"), sandbox);
  const data = sandbox.window.LrnData;

  const lp03 = (data.tracks || []).find((t) => t.code === "LP03");
  if (!lp03 || !lp03.bundles) {
    record("19", "bundle course curated in LP01/LP03", 0, THRESHOLDS.c19_bundleCourseNotCurated, {
      note: "uebersprungen: keine bundles in tracks[LP03] (Vor-Migrations-Stand)",
    });
    return;
  }

  const lp01 = (data.tracks || []).find((t) => t.code === "LP01");
  const curatedIds = new Set();
  for (const t of [lp01, lp03]) {
    if (!t) continue;
    for (const stage of t.stages || []) for (const id of stage.courses || []) curatedIds.add(id);
  }

  const problems = [];
  for (const bundle of lp03.bundles) {
    for (const id of bundle.courses || []) {
      if (!curatedIds.has(id)) problems.push(`${bundle.id}: ${id} ist weder in LP01 noch LP03 kuratiert`);
    }
  }

  record("19", "bundle course curated in LP01/LP03", problems.length, THRESHOLDS.c19_bundleCourseNotCurated, {
    details: problems,
    note: `${lp03.bundles.length} Buendel geprueft`,
  });
}

// -----------------------------------------------------------------------------
// 20. Keine AI-NN/RESP-01/PROMPT-01/USECASE-01/HARNESS-TC-01/CHAMP-01-Kurs-ID
//     mehr im Katalog. Nur noch LRN-NN und PRIMER-01. Strukturell, immer 0.
//     00_REPORT.md Teil A.
// -----------------------------------------------------------------------------
function check20() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(path.join(REPO, "site/lrn/data.js"), "utf8"), sandbox);
  const data = sandbox.window.LrnData;

  const problems = (data.courses || [])
    .filter((c) => c.id !== "PRIMER-01" && !/^LRN-\d{2}$/.test(c.id))
    .map((c) => `legacy course id "${c.id}"`);

  record("20", "no legacy AI-NN course ids", problems.length, THRESHOLDS.c20_legacyCourseIds, {
    details: problems,
    note: `${(data.courses || []).length} Kurse geprueft`,
  });
}

check1();
check2();
check3();
check4();
check5();
check6();
check7();
check8();
check9();
check10();
check11();
check12();
check13();
check14();
check15();
check16();
check18();
check19();
check20();

let anyFail = false;
console.log("=".repeat(78));
console.log("CI content check — LHIND AI Learning Catalog (plan §10)");
console.log("=".repeat(78));
for (const r of results) {
  const status = r.pass ? "PASS" : "FAIL";
  if (!r.pass) anyFail = true;
  console.log(`\n[${status}] check ${r.id}: ${r.name}`);
  console.log(`  count=${r.count}  threshold=${r.threshold}`);
  if (r.note) console.log(`  note: ${r.note}`);
  if (!r.pass && r.details.length) {
    for (const d of r.details.slice(0, 25)) console.log(`    - ${d}`);
    if (r.details.length > 25) console.log(`    ... ${r.details.length - 25} more`);
  }
}
console.log("\n" + "=".repeat(78));
const failed = results.filter((r) => !r.pass);
console.log(failed.length ? `${failed.length}/${results.length} checks FAILED: ${failed.map((r) => r.id).join(", ")}` : `All ${results.length} checks passed.`);
console.log("=".repeat(78));

process.exit(anyFail ? 1 : 0);
