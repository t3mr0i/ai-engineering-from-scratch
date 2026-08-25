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

  validateStaffing(catalog, courseIds, issues);

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

const SESSION_STATUSES = ["planned", "confirmed", "full", "cancelled", "done"];
const DELIVERY_MODES = ["onsite", "remote", "hybrid"];

function parseMoment(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value)) return null;
  const stamp = Date.parse(value.length === 10 ? `${value}T00:00` : value);
  return Number.isNaN(stamp) ? null : stamp;
}

function monthKey(value) {
  return String(value || "").slice(0, 7);
}

/**
 * Trainer roster, course responsibility, and scheduled sessions. Kept in one
 * pass so cross references (session → course → trainer pool) are checked
 * against the same set of known ids.
 */
function validateStaffing(catalog, courseIds, issues) {
  const courses = Array.isArray(catalog.courses) ? catalog.courses : [];
  const trainers = Array.isArray(catalog.trainers) ? catalog.trainers : [];
  const sessions = Array.isArray(catalog.sessions) ? catalog.sessions : [];
  if (catalog.trainers != null && !Array.isArray(catalog.trainers)) {
    issues.push(issue("error", "trainers.shape", "catalog.trainers", "Trainer müssen eine Liste sein."));
  }
  if (catalog.sessions != null && !Array.isArray(catalog.sessions)) {
    issues.push(issue("error", "sessions.shape", "catalog.sessions", "Termine müssen eine Liste sein."));
  }

  const trainerById = new Map();
  for (const [index, trainer] of trainers.entries()) {
    const at = `catalog.trainers[${index}]`;
    if (!trainer || typeof trainer !== "object") {
      issues.push(issue("error", "trainer.shape", at, "Der Trainereintrag ist ungültig."));
      continue;
    }
    if (!/^TR-\d{2}$/.test(trainer.id || "")) {
      issues.push(issue("error", "trainer.id", `${at}.id`, "Trainer-IDs müssen TR-NN entsprechen."));
    } else if (trainerById.has(trainer.id)) {
      issues.push(issue("error", "trainer.duplicate", `${at}.id`, `Die Trainer-ID ${trainer.id} ist doppelt.`));
    } else {
      trainerById.set(trainer.id, trainer);
    }
    if (!String(trainer.name || "").trim()) {
      issues.push(issue("error", "trainer.name", `${at}.name`, "Der Trainername fehlt."));
    }
    if (trainer.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trainer.email)) {
      issues.push(issue("warning", "trainer.email", `${at}.email`, "Die E-Mail-Adresse sieht nicht gültig aus."));
    }
    if (!Array.isArray(trainer.languages) || trainer.languages.length === 0) {
      issues.push(issue("warning", "trainer.languages", `${at}.languages`, "Für den Trainer ist keine Sprache hinterlegt."));
    }
    if (trainer.status && trainer.status !== "active" && trainer.status !== "inactive") {
      issues.push(issue("warning", "trainer.status", `${at}.status`, "Der Trainerstatus muss active oder inactive sein."));
    }
  }

  for (const [index, course] of courses.entries()) {
    if (!course || typeof course !== "object") continue;
    const at = `catalog.courses[${index}]`;
    const owner = course.ownerTrainerId;
    if (!owner) {
      // Solange kein einziger Trainer gepflegt ist, ist die Trainerverwaltung
      // schlicht noch nicht in Benutzung — dann wäre diese Warnung für jeden
      // Kurs reines Rauschen und würde den Qualitätswert verfälschen.
      if (trainerById.size > 0) {
        issues.push(issue("warning", "course.owner.missing", `${at}.ownerTrainerId`, `Für ${course.id} ist keine verantwortliche Person hinterlegt.`));
      }
    } else if (!trainerById.has(owner)) {
      issues.push(issue("error", "course.owner.unknown", `${at}.ownerTrainerId`, `${course.id} verweist auf den unbekannten Trainer ${owner}.`));
    } else if (trainerById.get(owner).status === "inactive") {
      issues.push(issue("warning", "course.owner.inactive", `${at}.ownerTrainerId`, `Die verantwortliche Person für ${course.id} ist inaktiv.`));
    }
    const pool = Array.isArray(course.trainerIds) ? course.trainerIds : [];
    const seen = new Set();
    for (const [poolIndex, trainerId] of pool.entries()) {
      if (!trainerById.has(trainerId)) {
        issues.push(issue("error", "course.trainer.unknown", `${at}.trainerIds[${poolIndex}]`, `${course.id} verweist auf den unbekannten Trainer ${trainerId}.`));
      } else if (trainerById.get(trainerId).status === "inactive") {
        issues.push(issue("warning", "course.trainer.inactive", `${at}.trainerIds[${poolIndex}]`, `${trainerId} ist inaktiv, steht aber im Trainerpool von ${course.id}.`));
      }
      if (seen.has(trainerId)) {
        issues.push(issue("warning", "course.trainer.duplicate", `${at}.trainerIds[${poolIndex}]`, `${trainerId} steht mehrfach im Trainerpool von ${course.id}.`));
      }
      seen.add(trainerId);
    }
  }

  const poolByCourse = new Map(courses.filter((course) => course && course.id).map((course) => [course.id, new Set(Array.isArray(course.trainerIds) ? course.trainerIds : [])]));
  const sessionIds = new Set();
  const bookings = new Map();
  const perTrainerMonth = new Map();
  for (const [index, session] of sessions.entries()) {
    const at = `catalog.sessions[${index}]`;
    if (!session || typeof session !== "object") {
      issues.push(issue("error", "session.shape", at, "Der Termineintrag ist ungültig."));
      continue;
    }
    if (!/^SES-\d{4}-\d{3}$/.test(session.id || "")) {
      issues.push(issue("error", "session.id", `${at}.id`, "Termin-IDs müssen SES-JJJJ-NNN entsprechen."));
    } else if (sessionIds.has(session.id)) {
      issues.push(issue("error", "session.duplicate", `${at}.id`, `Die Termin-ID ${session.id} ist doppelt.`));
    }
    sessionIds.add(session.id);

    if (!courseIds.has(session.courseId)) {
      issues.push(issue("error", "session.course.unknown", `${at}.courseId`, `Der Termin verweist auf den unbekannten Kurs ${session.courseId}.`));
    }

    const start = parseMoment(session.start);
    const end = parseMoment(session.end);
    if (start == null) {
      issues.push(issue("error", "session.start", `${at}.start`, "Der Beginn fehlt oder hat nicht das Format JJJJ-MM-TT oder JJJJ-MM-TTTHH:MM."));
    }
    if (end == null) {
      issues.push(issue("error", "session.end", `${at}.end`, "Das Ende fehlt oder hat nicht das Format JJJJ-MM-TT oder JJJJ-MM-TTTHH:MM."));
    }
    if (start != null && end != null && end < start) {
      issues.push(issue("error", "session.range", `${at}.end`, "Das Ende liegt vor dem Beginn."));
    }

    if (!String(session.language || "").trim()) {
      issues.push(issue("warning", "session.language", `${at}.language`, "Für den Termin ist keine Sprache hinterlegt."));
    }
    if (session.delivery && !DELIVERY_MODES.includes(session.delivery)) {
      issues.push(issue("warning", "session.delivery", `${at}.delivery`, `Das Format muss ${DELIVERY_MODES.join(", ")} sein.`));
    }
    if (session.delivery === "onsite" && !String(session.location || "").trim()) {
      issues.push(issue("warning", "session.location", `${at}.location`, "Für einen Präsenztermin fehlt der Ort."));
    }
    if (session.status && !SESSION_STATUSES.includes(session.status)) {
      issues.push(issue("warning", "session.status", `${at}.status`, `Der Terminstatus muss ${SESSION_STATUSES.join(", ")} sein.`));
    }
    const seats = Number(session.seats);
    const taken = Number(session.seatsTaken);
    if (session.seats != null && (!Number.isFinite(seats) || seats < 0)) {
      issues.push(issue("error", "session.seats", `${at}.seats`, "Die Platzzahl muss eine nicht negative Zahl sein."));
    }
    if (session.seatsTaken != null && (!Number.isFinite(taken) || taken < 0)) {
      issues.push(issue("error", "session.seatsTaken", `${at}.seatsTaken`, "Die Zahl belegter Plätze muss eine nicht negative Zahl sein."));
    }
    if (Number.isFinite(seats) && Number.isFinite(taken) && taken > seats) {
      issues.push(issue("error", "session.overbooked", `${at}.seatsTaken`, "Es sind mehr Plätze belegt als vorhanden."));
    }

    const assigned = Array.isArray(session.trainerIds) ? session.trainerIds : [];
    if (assigned.length === 0 && session.status !== "cancelled") {
      issues.push(issue("warning", "session.trainer.missing", `${at}.trainerIds`, "Dem Termin ist kein Trainer zugeordnet."));
    }
    for (const [assignedIndex, trainerId] of assigned.entries()) {
      const trainer = trainerById.get(trainerId);
      if (!trainer) {
        issues.push(issue("error", "session.trainer.unknown", `${at}.trainerIds[${assignedIndex}]`, `Der Termin verweist auf den unbekannten Trainer ${trainerId}.`));
        continue;
      }
      const pool = poolByCourse.get(session.courseId);
      if (pool && !pool.has(trainerId)) {
        issues.push(issue("warning", "session.trainer.outside_pool", `${at}.trainerIds[${assignedIndex}]`, `${trainerId} gehört nicht zum Trainerpool von ${session.courseId}.`));
      }
      if (trainer.status === "inactive") {
        issues.push(issue("warning", "session.trainer.inactive", `${at}.trainerIds[${assignedIndex}]`, `${trainerId} ist inaktiv, führt den Termin aber durch.`));
      }
      if (session.language && Array.isArray(trainer.languages) && trainer.languages.length && !trainer.languages.includes(session.language)) {
        issues.push(issue("warning", "session.trainer.language", `${at}.trainerIds[${assignedIndex}]`, `${trainerId} ist nicht für ${session.language} hinterlegt.`));
      }
      if (session.status === "cancelled" || start == null || end == null) continue;
      const booked = bookings.get(trainerId) || [];
      for (const slot of booked) {
        if (start < slot.end && end > slot.start) {
          issues.push(issue("warning", "session.trainer.overlap", `${at}.trainerIds[${assignedIndex}]`, `${trainerId} hat zeitgleich bereits den Termin ${slot.id}.`));
          break;
        }
      }
      booked.push({ id: session.id, start, end });
      bookings.set(trainerId, booked);
      const key = `${trainerId}|${monthKey(session.start)}`;
      perTrainerMonth.set(key, (perTrainerMonth.get(key) || 0) + 1);
    }
  }

  for (const [key, count] of perTrainerMonth) {
    const [trainerId, month] = key.split("|");
    const limit = Number(trainerById.get(trainerId) && trainerById.get(trainerId).capacity && trainerById.get(trainerId).capacity.sessionsPerMonth);
    if (Number.isFinite(limit) && limit > 0 && count > limit) {
      issues.push(issue("warning", "trainer.capacity", `catalog.trainers.${trainerId}.capacity`, `${trainerId} hat im Monat ${month} ${count} Termine bei einer Kapazität von ${limit}.`));
    }
  }
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
  validateStaffing,
  loadBaseCurriculum,
  validateCurriculum,
  curriculumStats,
  structuralSignature,
  requiresCurriculumGrill,
};
