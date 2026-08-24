/**
 * Read-only repository lesson access plus draft validation. The admin never
 * writes source files in place; lesson edits live in a change set until the
 * GitLab publisher turns each lesson directory into its own commit.
 */

const fs = require("node:fs");
const path = require("node:path");

const LESSON_PATH = /^phases\/(\d{2})-[a-z0-9-]+\/(\d{2})-[a-z0-9-]+$/;
const FILE_ALLOW = /^(?:docs\/(?:en|de)\.md|quiz\.json|code\/main\.(?:py|ts|rs|jl)|code\/tests\/[a-zA-Z0-9._-]+|outputs\/[a-zA-Z0-9._-]+)$/;
const MAX_LESSON_BYTES = 1_500_000;

class LessonError extends Error {
  constructor(code, message, status = 400, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function assertLessonPath(value) {
  const lessonPath = String(value || "");
  if (!LESSON_PATH.test(lessonPath)) throw new LessonError("lesson.path.invalid", "Der Lesson-Pfad ist ungültig.", 400);
  return lessonPath;
}

function titleFromMarkdown(source, fallback) {
  const match = /^#\s+(.+)$/m.exec(source || "");
  return match ? match[1].trim() : fallback;
}

function listLessons(repoRoot) {
  const phasesRoot = path.join(repoRoot, "phases");
  if (!fs.existsSync(phasesRoot)) return [];
  const lessons = [];
  for (const phase of fs.readdirSync(phasesRoot).sort()) {
    if (!/^\d{2}-[a-z0-9-]+$/.test(phase)) continue;
    const phaseRoot = path.join(phasesRoot, phase);
    if (!fs.statSync(phaseRoot).isDirectory()) continue;
    for (const lesson of fs.readdirSync(phaseRoot).sort()) {
      if (!/^\d{2}-[a-z0-9-]+$/.test(lesson)) continue;
      const relative = `phases/${phase}/${lesson}`;
      const lessonRoot = path.join(phaseRoot, lesson);
      if (!fs.statSync(lessonRoot).isDirectory()) continue;
      const english = path.join(lessonRoot, "docs", "en.md");
      const source = fs.existsSync(english) ? fs.readFileSync(english, "utf8") : "";
      const main = fs.existsSync(path.join(lessonRoot, "code"))
        ? fs.readdirSync(path.join(lessonRoot, "code")).find((file) => /^main\.(?:py|ts|rs|jl)$/.test(file))
        : null;
      lessons.push({
        path: relative,
        phase,
        slug: lesson,
        title: titleFromMarkdown(source, lesson),
        language: main ? ({ py: "Python", ts: "TypeScript", rs: "Rust", jl: "Julia" })[main.split(".").at(-1)] : "—",
        hasGerman: fs.existsSync(path.join(lessonRoot, "docs", "de.md")),
      });
    }
  }
  return lessons;
}

function walkAllowed(root, current = root, files = {}) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      walkAllowed(root, absolute, files);
      continue;
    }
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (!FILE_ALLOW.test(relative)) continue;
    const size = fs.statSync(absolute).size;
    if (size > MAX_LESSON_BYTES) throw new LessonError("lesson.file.too_large", `${relative} ist zu groß für den Admin.`, 413);
    files[relative] = fs.readFileSync(absolute, "utf8");
  }
  return files;
}

function loadLesson(repoRoot, lessonPath) {
  const safePath = assertLessonPath(lessonPath);
  const absolute = path.join(repoRoot, safePath);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
    throw new LessonError("lesson.not_found", "Die Lesson wurde nicht gefunden.", 404);
  }
  return { path: safePath, mode: "edit", files: walkAllowed(absolute) };
}

function validateLessonDraft(draft) {
  const issues = [];
  try { assertLessonPath(draft && draft.path); } catch (error) {
    return [{ severity: "error", code: error.code, path: "path", message: error.message }];
  }
  const files = draft && draft.files && typeof draft.files === "object" ? draft.files : {};
  for (const [file, content] of Object.entries(files)) {
    if (!FILE_ALLOW.test(file) || typeof content !== "string") {
      issues.push({ severity: "error", code: "lesson.file.invalid", path: file, message: "Datei oder Inhalt ist für eine Lesson nicht zulässig." });
    }
  }
  if (!String(files["docs/en.md"] || "").trim()) issues.push({ severity: "error", code: "lesson.docs.missing", path: "docs/en.md", message: "Die englische Lesson-Dokumentation fehlt." });
  const english = String(files["docs/en.md"] || "");
  for (const field of ["Type", "Languages", "Prerequisites", "Time"]) {
    if (!new RegExp(`^\\*\\*${field}:\\*\\*\\s+.+$`, "m").test(english)) {
      issues.push({ severity: "error", code: "lesson.docs.contract", path: "docs/en.md", message: `Das Pflichtfeld ${field} fehlt.` });
    }
  }
  const objectiveSection = /## Learning Objectives\s*\n([\s\S]*?)(?=\n## |$)/.exec(english);
  const objectiveCount = objectiveSection ? (objectiveSection[1].match(/^-\s+\S.+$/gm) || []).length : 0;
  if (objectiveCount < 4 || objectiveCount > 6) issues.push({ severity: "error", code: "lesson.objectives.count", path: "docs/en.md", message: "Learning Objectives benötigen 4 bis 6 Bullet Points." });
  if (/^```\s*$/m.test(english)) issues.push({ severity: "error", code: "lesson.fence.language", path: "docs/en.md", message: "Jeder Code-Block benötigt einen Language-Tag." });
  if (/\[TODO\]/i.test(Object.values(files).join("\n"))) issues.push({ severity: "error", code: "lesson.todo", path: "lesson", message: "Vor dem Review müssen alle [TODO]-Marker aufgelöst sein." });
  const mains = Object.keys(files).filter((file) => /^code\/main\.(?:py|ts|rs|jl)$/.test(file));
  if (mains.length !== 1) issues.push({ severity: "error", code: "lesson.main.count", path: "code", message: "Genau eine main.*-Implementierung ist erforderlich." });
  if (!Object.keys(files).some((file) => file.startsWith("code/tests/"))) issues.push({ severity: "error", code: "lesson.tests.missing", path: "code/tests", message: "Mindestens eine Testdatei ist erforderlich." });
  try {
    const quiz = JSON.parse(files["quiz.json"] || "null");
    const questions = quiz && Array.isArray(quiz.questions) ? quiz.questions : [];
    const stages = questions.map((question) => question.stage);
    if (questions.length !== 6 || stages.filter((stage) => stage === "pre").length !== 1 || stages.filter((stage) => stage === "check").length !== 3 || stages.filter((stage) => stage === "post").length !== 2) {
      issues.push({ severity: "error", code: "lesson.quiz.schema", path: "quiz.json", message: "Das Quiz benötigt exakt 1 pre-, 3 check- und 2 post-Fragen." });
    }
    if (questions.some((question) => !Array.isArray(question.options) || question.options.length !== 4 || !Number.isInteger(question.correct) || question.correct < 0 || question.correct > 3 || !String(question.explanation || "").trim())) {
      issues.push({ severity: "error", code: "lesson.quiz.question", path: "quiz.json", message: "Jede Quizfrage benötigt vier Optionen, einen gültigen zero-based Index und eine Erklärung." });
    }
  } catch (_) {
    issues.push({ severity: "error", code: "lesson.quiz.json", path: "quiz.json", message: "quiz.json ist kein gültiges JSON." });
  }
  const testSource = Object.entries(files).filter(([file]) => file.startsWith("code/tests/")).map(([, content]) => content).join("\n");
  const testCount = (testSource.match(/(?:def\s+test_|\btest\s*\(|#\[test\]|@test\b)/g) || []).length;
  if (testCount < 5) issues.push({ severity: "error", code: "lesson.tests.count", path: "code/tests", message: "Mindestens fünf Unit Tests sind erforderlich." });
  return issues;
}

module.exports = { LessonError, LESSON_PATH, FILE_ALLOW, assertLessonPath, listLessons, loadLesson, validateLessonDraft };
