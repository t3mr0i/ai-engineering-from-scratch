/**
 * Curriculum snapshot loading, validation, and summary functions. These
 * functions are deliberately independent from HTTP and persistence so the
 * same checks can run in the admin, tests, and publishing pipeline.
 */

const fs = require("node:fs");
const path = require("node:path");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadBaseCurriculum(webRoot) {
  const root = path.join(webRoot, "lrn", "manifests");
  return {
    catalog: JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8")),
    curriculumMap: JSON.parse(fs.readFileSync(path.join(root, "curriculum-map.json"), "utf8")),
  };
}

function issue(severity, code, at, message) {
  return { severity, code, path: at, message };
}

function validateCurriculum(snapshot) {
  const issues = [];
  const catalog = snapshot && snapshot.catalog;
  const curriculumMap = snapshot && snapshot.curriculumMap;
  if (!catalog || typeof catalog !== "object") {
    return [issue("error", "catalog.missing", "catalog", "Der Kurskatalog fehlt.")];
  }
  if (!curriculumMap || typeof curriculumMap !== "object") {
    return [issue("error", "map.missing", "curriculumMap", "Die Curriculum-Zuordnung fehlt.")];
  }

  const courses = Array.isArray(catalog.courses) ? catalog.courses : [];
  const tracks = Array.isArray(catalog.tracks) ? catalog.tracks : [];
  const maps = curriculumMap.courseMaps && typeof curriculumMap.courseMaps === "object"
    ? curriculumMap.courseMaps
    : {};
  if (!Array.isArray(catalog.courses)) {
    issues.push(issue("error", "courses.shape", "catalog.courses", "Kurse müssen eine Liste sein."));
  }
  if (!Array.isArray(catalog.tracks)) {
    issues.push(issue("error", "tracks.shape", "catalog.tracks", "Lernpfade müssen eine Liste sein."));
  }

  const courseIds = new Set();
  const prerequisites = new Map();
  const sequences = new Set();
  for (const [index, course] of courses.entries()) {
    const at = `catalog.courses[${index}]`;
    if (!course || typeof course !== "object") {
      issues.push(issue("error", "course.shape", at, "Der Kurseintrag ist ungültig."));
      continue;
    }
    if (!/^(?:LRN-\d{2}|PRIMER-\d{2})$/.test(course.id || "")) {
      issues.push(issue("error", "course.id", `${at}.id`, "Kurs-IDs müssen LRN-NN oder PRIMER-NN entsprechen."));
    } else if (courseIds.has(course.id)) {
      issues.push(issue("error", "course.duplicate", `${at}.id`, `Die Kurs-ID ${course.id} ist doppelt.`));
    } else {
      courseIds.add(course.id);
    }
    if (!String(course.title || "").trim()) {
      issues.push(issue("error", "course.title", `${at}.title`, "Der Kurstitel fehlt."));
    }
    if (!String(course.summary || "").trim()) {
      issues.push(issue("warning", "course.summary", `${at}.summary`, "Die Kurszusammenfassung fehlt."));
    }
    if (!Array.isArray(course.outcomes) || course.outcomes.length === 0) {
      issues.push(issue("warning", "course.outcomes", `${at}.outcomes`, "Mindestens ein Lernziel wird empfohlen."));
    }
    if (!Array.isArray(course.profileIds) || course.profileIds.length === 0) {
      issues.push(issue("warning", "course.profiles", `${at}.profileIds`, "Der Kurs ist keinem Profil zugeordnet."));
    }
    if (course.sequence != null) {
      if (sequences.has(course.sequence)) {
        issues.push(issue("warning", "course.sequence", `${at}.sequence`, `Die Reihenfolge ${course.sequence} wird mehrfach verwendet.`));
      }
      sequences.add(course.sequence);
    }
    prerequisites.set(course.id, Array.isArray(course.prerequisites) ? course.prerequisites : []);
  }

  for (const [courseId, required] of prerequisites) {
    for (const dependency of required) {
      if (!courseIds.has(dependency)) issues.push(issue("error", "course.prerequisite.unknown", `catalog.courses.${courseId}.prerequisites`, `${courseId} benötigt den unbekannten Kurs ${dependency}.`));
      if (dependency === courseId) issues.push(issue("error", "course.prerequisite.self", `catalog.courses.${courseId}.prerequisites`, `${courseId} kann nicht seine eigene Voraussetzung sein.`));
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(courseId, chain = []) {
    if (visiting.has(courseId)) {
      issues.push(issue("error", "course.prerequisite.cycle", `catalog.courses.${courseId}.prerequisites`, `Zyklische Voraussetzung: ${[...chain, courseId].join(" → ")}.`));
      return;
    }
    if (visited.has(courseId)) return;
    visiting.add(courseId);
    for (const dependency of prerequisites.get(courseId) || []) if (courseIds.has(dependency)) visit(dependency, [...chain, courseId]);
    visiting.delete(courseId);
    visited.add(courseId);
  }
  for (const courseId of courseIds) visit(courseId);

  const trackIds = new Set();
  const trackCodes = new Set();
  for (const [index, track] of tracks.entries()) {
    const at = `catalog.tracks[${index}]`;
    if (!track || typeof track !== "object") continue;
    if (!track.id || trackIds.has(track.id)) {
      issues.push(issue("error", "track.id", `${at}.id`, "Die Lernpfad-ID fehlt oder ist doppelt."));
    }
    if (!/^LP\d{2}$/.test(track.code || "") || trackCodes.has(track.code)) {
      issues.push(issue("error", "track.code", `${at}.code`, "Der Lernpfad-Code muss eindeutig LPxx entsprechen."));
    }
    trackIds.add(track.id);
    trackCodes.add(track.code);
    if (!String(track.label || "").trim()) {
      issues.push(issue("error", "track.label", `${at}.label`, "Der Lernpfadname fehlt."));
    }
    const trackCourses = new Set();
    for (const [stageIndex, stage] of (track.stages || []).entries()) {
      for (const [courseIndex, courseId] of (stage.courses || []).entries()) {
        if (!courseIds.has(courseId)) {
          issues.push(issue(
            "error",
            "track.course.unknown",
            `${at}.stages[${stageIndex}].courses[${courseIndex}]`,
            `Der Lernpfad referenziert den unbekannten Kurs ${courseId}.`,
          ));
        }
        if (trackCourses.has(courseId)) issues.push(issue("warning", "track.course.duplicate", `${at}.stages[${stageIndex}].courses[${courseIndex}]`, `${courseId} ist im Lernpfad mehrfach enthalten.`));
        trackCourses.add(courseId);
      }
    }
    const coveredRoles = new Set(courses.filter((course) => trackCourses.has(course.id)).flatMap((course) => (course.ase || []).map((entry) => entry.role)));
    for (const role of catalog.aseRoles || []) {
      if (!coveredRoles.has(role.id)) issues.push(issue("warning", "track.role.gap", at, `${track.code} deckt die ASE-Rolle ${role.labelDe || role.label} nicht ab.`));
    }
  }

  for (const courseId of Object.keys(maps)) {
    if (!courseIds.has(courseId)) {
      issues.push(issue("error", "map.course.unknown", `curriculumMap.courseMaps.${courseId}`, `Die Zuordnung gehört zu keinem Kurs: ${courseId}.`));
    }
    const units = maps[courseId];
    if (!Array.isArray(units) || units.length === 0) {
      issues.push(issue("warning", "map.units.empty", `curriculumMap.courseMaps.${courseId}`, "Der Kurs hat keine Units."));
      continue;
    }
    const courseLessons = new Set();
    for (const [unitIndex, unit] of units.entries()) {
      const at = `curriculumMap.courseMaps.${courseId}[${unitIndex}]`;
      if (!String(unit.title || "").trim()) {
        issues.push(issue("warning", "unit.title", `${at}.title`, "Der Unit-Titel fehlt."));
      }
      if (!Array.isArray(unit.lessons) || unit.lessons.length === 0) {
        issues.push(issue("warning", "unit.lessons.empty", `${at}.lessons`, "Die Unit enthält keine Activities."));
      }
      const seen = new Set();
      for (const [lessonIndex, lesson] of (unit.lessons || []).entries()) {
        if (!String(lesson.path || "").trim() || !String(lesson.title || "").trim()) {
          issues.push(issue("error", "lesson.reference", `${at}.lessons[${lessonIndex}]`, "Activity benötigt Pfad und Titel."));
        } else if (seen.has(lesson.path)) {
          issues.push(issue("warning", "lesson.duplicate", `${at}.lessons[${lessonIndex}]`, `Activity ${lesson.path} ist in dieser Unit doppelt.`));
        }
        if (courseLessons.has(lesson.path)) issues.push(issue("warning", "lesson.course.duplicate", `${at}.lessons[${lessonIndex}]`, `Activity ${lesson.path} ist im Kurs mehrfach enthalten.`));
        seen.add(lesson.path);
        courseLessons.add(lesson.path);
      }
    }
  }

  for (const course of courses) {
    if (!Object.prototype.hasOwnProperty.call(maps, course.id)) {
      issues.push(issue("warning", "course.map.missing", `curriculumMap.courseMaps.${course.id}`, `Für ${course.id} fehlt eine Unit-Zuordnung.`));
    }
  }
  return issues;
}

function curriculumStats(snapshot) {
  const courses = snapshot.catalog.courses || [];
  const tracks = snapshot.catalog.tracks || [];
  const maps = snapshot.curriculumMap.courseMaps || {};
  const units = Object.values(maps).reduce((sum, value) => sum + value.length, 0);
  const activities = Object.values(maps).reduce(
    (sum, value) => sum + value.reduce((inner, unit) => inner + (unit.lessons || []).length, 0),
    0,
  );
  return { courses: courses.length, tracks: tracks.length, units, activities };
}

function structuralSignature(snapshot) {
  const catalog = snapshot && snapshot.catalog ? snapshot.catalog : {};
  const maps = snapshot && snapshot.curriculumMap && snapshot.curriculumMap.courseMaps
    ? snapshot.curriculumMap.courseMaps
    : {};
  return JSON.stringify({
    courses: (catalog.courses || []).map((course) => ({ id: course.id, sequence: course.sequence })),
    tracks: (catalog.tracks || []).map((track) => ({
      id: track.id,
      code: track.code,
      profileIds: track.profileIds || [],
      stages: (track.stages || []).map((stage) => ({ label: stage.label, courses: stage.courses || [] })),
    })),
    courseMaps: Object.fromEntries(Object.entries(maps).sort(([left], [right]) => left.localeCompare(right)).map(([courseId, units]) => [
      courseId,
      (units || []).map((unit) => ({
        title: unit.title || "",
        decision: unit.decision || "",
        lessons: (unit.lessons || []).map((lesson) => lesson.path || ""),
      })),
    ])),
  });
}

function requiresCurriculumGrill(base, candidate) {
  return structuralSignature(base) !== structuralSignature(candidate);
}

module.exports = {
  clone,
  loadBaseCurriculum,
  validateCurriculum,
  curriculumStats,
  structuralSignature,
  requiresCurriculumGrill,
};
