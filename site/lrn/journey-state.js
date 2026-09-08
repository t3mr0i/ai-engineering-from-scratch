/**
 * Browser adapter for the shared learner journey. Existing stores remain the
 * source of truth: cockpit selection, assessment, personal plan and progress.
 * All learning surfaces take the same snapshot; reading it has no side effects.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.LrnJourneyState = api; api.init(); }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";
  var COCKPIT = "lhind:lrn-cockpit:v3";
  var PLAN = "aifs:personal-plan:v1";
  var ASSESSMENT = "aifs:assessment";
  var initialized = false;
  var queued = false;

  function read(key, fallback) {
    try { var value = JSON.parse(root.localStorage.getItem(key)); return value == null ? fallback : value; }
    catch (_) { return fallback; }
  }
  function locale() { return root.SiteLang && root.SiteLang.get ? root.SiteLang.get() : root.document && root.document.documentElement.lang || "en"; }
  function roleId(value, catalog) {
    var lowered = String(value || "").toLowerCase();
    var role = (catalog.roles || []).find(function (row) {
      return [row.id, row.label, row.code, row.segment].some(function (name) { return String(name || "").toLowerCase() === lowered; });
    });
    return role && role.id || null;
  }
  function inputs(options) {
    options = options || {};
    var catalog = root.LrnData || { roles: [], capabilities: [], courses: [] };
    var cockpit = read(COCKPIT, {});
    var assessment = read(ASSESSMENT, {});
    var importer = root.AIFSAssessmentImport || root.AssessmentImport;
    var imported = null;
    try { imported = importer && importer.load ? importer.load() : null; } catch (_) {}
    var selectedRole = roleId(options.roleId || cockpit.profileId || cockpit.roleId, catalog) || roleId(assessment.roleId || assessment.role, catalog) || roleId(imported && imported.profileId, catalog);
    var progressState = { lessons: {} };
    try { progressState = root.AIFSProgress && root.AIFSProgress.getState ? root.AIFSProgress.getState() : read("aifs:progress:v1", { lessons: {} }); } catch (_) {}
    var curriculum = root.LrnCurriculumMap || {};
    var mastery = root.LrnMastery ? root.LrnMastery.summarize({ progressState: progressState, curriculumMap: curriculum }) : { courses: [], dueReviews: [] };
    var saved = Object.prototype.hasOwnProperty.call(options, "savedPlan") ? options.savedPlan : read(PLAN, null);
    var assignments = read("aifs:team-assignments:v1", {});
    return {
      catalog: catalog, roleId: selectedRole || "tc", roleSelected: !!selectedRole,
      assessment: assessment, assessmentImport: imported,
      capabilityEvidence: root.AIFSCapabilityEvidence || {},
      progressState: progressState, courseMaps: curriculum.courseMaps || {}, visibleCourseIds: curriculum.visibleCourseIds,
      mastery: mastery, savedPlan: saved, assignments: assignments.assignments || [],
      locale: locale(), focusDimensionId: cockpit.journeyFocus || null,
      goal: options.goal != null ? options.goal : saved && saved.learner && saved.learner.roleId === (selectedRole || "tc") && saved.learner.goal || ""
    };
  }
  function rawPlan(input, cadence) {
    if (!root.LrnLearningPlan) return null;
    var completed = [], inProgress = [];
    (input.catalog.courses || []).forEach(function (course) {
      var paths = root.LrnLearningJourney.lessonPaths(course.id, input.courseMaps);
      if (!paths.length) return;
      var rows = paths.map(function (path) { return input.progressState.lessons && input.progressState.lessons[path] || {}; });
      if (rows.every(function (row) { return row.completedAt; })) completed.push(course.id);
      else if (rows.some(function (row) { return row.visitedAt || row.readPct || row.completedAt || Object.keys(row.answers || {}).length; })) inProgress.push(course.id);
    });
    var assessment = input.assessment;
    var selected = (input.catalog.roles || []).find(function (role) { return role.id === input.roleId; });
    if (assessment.role && assessment.role !== input.roleId && assessment.role !== (selected && selected.label)) assessment = { ratings: {} };
    var cleanRatings = {};
    Object.keys(assessment.ratings || {}).forEach(function (id) {
      var rank = root.LrnLearningJourney.rank(assessment.ratings[id]);
      if (rank > 0) cleanRatings[id] = rank;
    });
    return root.LrnLearningPlan.buildPlan({
      catalog: input.catalog, capabilityEvidence: input.capabilityEvidence,
      learner: { roleId: input.roleId, currentLevel: 1, goal: String(input.goal || "").slice(0, 500), assessment: { ratings: cleanRatings }, assessmentImport: input.assessmentImport, progress: { completedCourseIds: completed, inProgressCourseIds: inProgress }, mastery: input.mastery, assignments: input.assignments },
      durationWeeks: cadence && cadence.durationWeeks || 8,
      sessionsPerWeek: cadence && cadence.sessionsPerWeek || 2
    });
  }
  function relativeHref(href) {
    var path = root.location && root.location.pathname || "/";
    return /\/lrn\/[^/]*$/.test(path) ? "../" + href : href;
  }
  function snapshot(options) {
    if (!root.LrnLearningJourney) return null;
    var input = inputs(options);
    try { var ranked = rawPlan(input); input.rankedSteps = ranked && ranked.steps || []; } catch (_) { input.rankedSteps = []; }
    var model = root.LrnLearningJourney.createModel(input);
    model.steps.forEach(function (step) { step.href = relativeHref(step.href); if (step.activityHref) step.activityHref = relativeHref(step.activityHref); });
    model.externalRecommendations.forEach(function (step) { step.href = relativeHref(step.href); });
    model.links = { home: relativeHref("index.html"), assessment: relativeHref("assessment.html"), plan: relativeHref("personal-plan.html"), skills: relativeHref("skills.html"), catalog: relativeHref("index.html#trainingCatalogTitle") };
    return model;
  }
  function buildPlan(options, existing) {
    options = options || {};
    var input = inputs({ goal: options.goal, savedPlan: existing || null });
    var cadence = { durationWeeks: Number(options.durationWeeks) || 8, sessionsPerWeek: Number(options.sessionsPerWeek) || 2 };
    var plan = rawPlan(input, cadence);
    if (!plan) throw new Error("Learning plan is unavailable");
    input.rankedSteps = plan.steps;
    var journey = root.LrnLearningJourney.createModel(input);
    var oldIds = existing && Array.isArray(existing.steps) ? existing.steps.map(function (step) { return step.courseId; }) : [];
    var selected = journey.steps.filter(function (step) { return step.status !== "completed" && step.status !== "unavailable"; }).slice(0, plan.capacity.focusCourseSlots);
    plan.steps = selected.map(function (step, index) {
      return {
        courseId: step.courseId, title: step.title, position: index + 1,
        status: step.status === "in-progress" ? "in_progress" : "planned",
        journeyStatus: step.status, journeyReason: step.reason,
        dimension: step.dimension, capability: step.capability, targetLevel: step.targetLevel,
        currentLevel: step.currentLevel, prerequisiteCourseIds: step.prerequisiteCourseIds,
        targetWeek: Math.min(cadence.durationWeeks, Math.floor(index * cadence.durationWeeks / Math.max(1, selected.length)) + 1),
        rationale: step.reason,
        signals: step.matches.map(function (match) { return { type: "journey_capability", capabilityId: match.capabilityId, dimension: match.dimension, targetLevel: match.targetLevel, currentLevel: match.currentLevel }; }),
        sources: [{ type: "catalog_course", id: step.courseId }, { type: journey.targetSource, roleId: journey.roleId }]
      };
    });
    plan.capacity.selectedCourses = plan.steps.length;
    plan.algorithmVersion = "dimension-journey-v1";
    plan.learner.targetSource = journey.targetSource;
    plan.excludedCourseIds = existing && existing.excludedCourseIds || [];
    if (existing) {
      plan.customized = !!existing.customized;
      plan.createdAt = existing.createdAt;
      plan.updatedAt = Date.now();
      plan.revision = { reason: "journey-progress-update", addedCourseIds: plan.steps.map(function (step) { return step.courseId; }).filter(function (id) { return oldIds.indexOf(id) < 0; }), removedCourseIds: oldIds.filter(function (id) { return !plan.steps.some(function (step) { return step.courseId === id; }); }), reviewCount: (plan.reviewQueue || []).length };
    }
    return plan;
  }
  function refresh() {
    if (queued || !root.document) return;
    queued = true;
    (root.setTimeout || setTimeout)(function () {
      queued = false;
      root.document.dispatchEvent(new root.CustomEvent("lrn:journey-change"));
    }, 0);
  }
  function setFocus(dimensionId) {
    if (!root.LrnLearningJourney.dimensions.some(function (row) { return row.id === dimensionId; }) && dimensionId !== "") return false;
    var cockpit = read(COCKPIT, {});
    cockpit.journeyFocus = dimensionId || null;
    try { root.localStorage.setItem(COCKPIT, JSON.stringify(cockpit)); } catch (_) { return false; }
    refresh(); return true;
  }
  function init() {
    if (initialized || !root.document) return;
    initialized = true;
    ["assessment-import:change", "sitelang:change", "aifs:assessment-change", "assessment-change"].forEach(function (event) { root.document.addEventListener(event, refresh); });
    ["aifs:personal-plan-change", "aifs:team-assignment-change", "storage"].forEach(function (event) { root.addEventListener(event, refresh); });
    root.document.addEventListener("change", function (event) {
      if (["roleSelect", "capabilityProfileSelect", "keyAreaSelect", "specializationSelect"].indexOf(event.target.id) >= 0) refresh();
    });
    if (root.AIFSProgress && root.AIFSProgress.onChange) root.AIFSProgress.onChange(refresh);
  }
  return { snapshot: snapshot, buildPlan: buildPlan, refresh: refresh, init: init, setFocus: setFocus, inputs: inputs };
});
