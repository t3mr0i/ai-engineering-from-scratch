/**
 * Anonymous progress reporting for the LRN cockpit. Sends the current
 * profile/level selection and completed-course list to /api/lrn/report,
 * keyed by a random per-browser id — never a login. See
 * docs/superpowers/specs/2026-08-26-anonymous-progress-reporting-design.md.
 */
(function () {
  "use strict";

  var ANON_ID_KEY = "aifs:anon-id:v1";
  var LRN_STORE_KEY = "lhind:lrn-cockpit:v3";
  var REPORT_ENDPOINT = "/api/lrn/report";
  var ASSIGNMENT_STORE_KEY = "aifs:team-assignments:v1";
  var DEBOUNCE_MS = 2000;

  function readLrnSelection(storage) {
    try {
      var saved = JSON.parse(storage.getItem(LRN_STORE_KEY));
      if (!saved || typeof saved.profileId !== "string" || typeof saved.externalLevel !== "number") return null;
      return { profileId: saved.profileId, externalLevel: saved.externalLevel };
    } catch (error) {
      return null;
    }
  }

  function getOrCreateAnonId(storage, randomUuid) {
    var existing = storage.getItem(ANON_ID_KEY);
    if (typeof existing === "string" && existing) return existing;
    var id = randomUuid();
    try { storage.setItem(ANON_ID_KEY, id); } catch (error) { /* best effort */ }
    return id;
  }

  function courseLessonPaths(courseMaps, courseId) {
    var units = (courseMaps && courseMaps[courseId]) || [];
    var seen = {};
    units.forEach(function (unit) {
      (unit.lessons || []).forEach(function (lesson) {
        if (lesson.path) seen[lesson.path] = true;
      });
    });
    return Object.keys(seen);
  }

  function isCourseComplete(courseMaps, courseId, progressState) {
    var paths = courseLessonPaths(courseMaps, courseId);
    if (!paths.length) return false;
    var lessons = (progressState && progressState.lessons) || {};
    return paths.every(function (path) {
      return Boolean(lessons[path] && lessons[path].completedAt);
    });
  }

  function computeCompletedCourseIds(courses, courseMaps, progressState) {
    return (courses || [])
      .map(function (course) { return course.id; })
      .filter(function (courseId) { return isCourseComplete(courseMaps, courseId, progressState); });
  }

  function buildPayload(anonId, selection, completedCourseIds, assignmentCodes, capabilityMastery) {
    return {
      anonId: anonId,
      profileId: selection.profileId,
      externalLevel: selection.externalLevel,
      completedCourses: completedCourseIds,
      assignmentCodes: Array.isArray(assignmentCodes) ? assignmentCodes.slice(0, 16) : [],
      capabilityMastery: Array.isArray(capabilityMastery) ? capabilityMastery.slice(0, 64).map(function (row) {
        return { capabilityId: row.capabilityId, percent: row.percent, evidenceCount: row.evidenceCount, appliedEvidenceCount: row.appliedEvidenceCount || 0 };
      }) : [],
    };
  }

  function readAssignments(storage) {
    try {
      var saved = JSON.parse(storage.getItem(ASSIGNMENT_STORE_KEY));
      return Array.isArray(saved && saved.assignments) ? saved.assignments : [];
    } catch (_) { return []; }
  }

  function mount() {
    if (typeof window === "undefined" || !window.document || typeof fetch === "undefined") return;

    var timer = null;

    function sendNow(progressState) {
      var selection = readLrnSelection(window.localStorage);
      if (!selection) return; // learner has never opened the LRN cockpit yet
      var data = window.LrnData;
      var curriculum = window.LrnCurriculumMap;
      if (!data || !data.courses || !curriculum || !curriculum.courseMaps) return;
      var state = progressState || (window.AIFSProgress && window.AIFSProgress.getState());
      if (!state) return;
      var anonId = getOrCreateAnonId(window.localStorage, function () { return crypto.randomUUID(); });
      var completedCourseIds = computeCompletedCourseIds(data.courses, curriculum.courseMaps, state);
      var assignments = readAssignments(window.localStorage);
      var mastery = window.LrnMastery ? window.LrnMastery.summarize({ progressState: state, curriculumMap: curriculum }) : { courses: [] };
      var capabilityMastery = window.LrnMastery && window.AIFSCapabilityEvidence
        ? window.LrnMastery.capabilitySummary(mastery, window.AIFSCapabilityEvidence)
        : [];
      var payload = buildPayload(
        anonId,
        selection,
        completedCourseIds,
        assignments.map(function (assignment) { return assignment.code; }).filter(Boolean),
        capabilityMastery
      );
      fetch(REPORT_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(function () { /* best effort, no retry */ });
    }

    function scheduleSync(progressState) {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () { sendNow(progressState); }, DEBOUNCE_MS);
    }

    if (window.AIFSProgress && window.AIFSProgress.onChange) {
      window.AIFSProgress.onChange(function (state) { scheduleSync(state); });
    }

    scheduleSync();

    window.LrnReportSync = {
      sync: function () { scheduleSync(); },
      computeCompletedCourseIds: computeCompletedCourseIds,
      buildPayload: buildPayload,
      readLrnSelection: readLrnSelection,
      getOrCreateAnonId: getOrCreateAnonId,
      readAssignments: readAssignments,
    };
  }

  mount();
})();
