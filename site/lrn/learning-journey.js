/**
 * Shared, deterministic journey from a role target to the next learning step.
 * Reference targets: docs/ai-literacy-lhind/zielbilder.json (August 2026).
 * Assessment targets retain their own provenance; course completion is never
 * substituted for a self-assessment or observed competence evidence.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LrnLearningJourney = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var LEVELS = [null, "Acquire", "Deepen", "Create"];
  var DIMENSIONS = [
    { id: "foundation", name: "Foundation", aliases: ["Foundation"] },
    { id: "engineering", name: "Engineering", aliases: ["Engineering", "Engineering Literacy"] },
    { id: "product", name: "Product and Process", aliases: ["Product and Process", "Product and Process Literacy"] },
    { id: "advisory", name: "Advisory and Business Consulting", aliases: ["Advisory and Business Consulting", "Advisory and Biz Literacy"] },
    { id: "leadership", name: "Leadership and Strategy", aliases: ["Leadership and Strategy", "Leadership Strategy"] }
  ];
  // Separate from the catalog's legacy assessment-area targets. These are
  // the reference's five dimension targets, not the unrelated five quiz areas.
  var TARGETS = {
    bsc: [3, 2, 3, 3, 3], tc: [3, 3, 2, 3, 1], am: [3, 3, 1, 2, 1],
    pma: [3, null, 1, 3, 3], corp: [2, 2, 1, 1, 3], lead: [3, 1, 1, 3, 3],
    pvs: [3, 2, 3, 2, 2]
  };

  function array(value) { return Array.isArray(value) ? value : []; }
  function rank(value) {
    if (value == null || value === "") return null;
    var names = { acquire: 1, deepen: 2, create: 3, basic: 1, advanced: 2, expert: 3, none: 0, "not relevant": 0, "n. a.": 0 };
    var key = String(value).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(names, key)) return names[key];
    var n = Number(value);
    return Number.isInteger(n) && n >= 0 && n <= 3 ? n : null;
  }
  function unique(values) { return Array.from(new Set(values)); }
  function canonicalCapabilityTitle(title) {
    return ({ "AI Systems and Architecture": "AI Systems & Architecture", "Managing AI Transformations": "Managing AI Transformation" })[title] || title;
  }
  function matchesDimension(cluster, dimension) {
    return String(cluster || "").split(" / ").some(function (part) {
      return dimension.aliases.indexOf(part.trim()) >= 0;
    });
  }
  function eligible(course, roleId) {
    return !array(course.roleIds).length || course.roleIds.indexOf("all") >= 0 || course.roleIds.indexOf(roleId) >= 0;
  }
  function lessonPaths(courseId, courseMaps) {
    return unique(array(courseMaps && courseMaps[courseId]).flatMap(function (unit) {
      return array(unit.lessons).map(function (lesson) { return lesson.path; }).filter(Boolean);
    }));
  }
  function progressFor(course, input) {
    var paths = lessonPaths(course.id, input.courseMaps);
    var lessons = input.progressState && input.progressState.lessons || {};
    var done = paths.filter(function (path) { return lessons[path] && lessons[path].completedAt; }).length;
    var touched = paths.some(function (path) {
      var row = lessons[path];
      return row && (row.completedAt || row.visitedAt || row.readPct || Object.keys(row.answers || {}).length);
    });
    var completed = paths.length > 0 && done === paths.length;
    var available = input.courseMaps == null || paths.length > 0;
    if (Array.isArray(input.visibleCourseIds) && input.visibleCourseIds.length && input.visibleCourseIds.indexOf(course.id) < 0) available = false;
    return { completed: completed, touched: touched, available: available, percent: paths.length ? Math.round(done / paths.length * 100) : null };
  }
  function assessedRow(record, dimension) {
    var values = record && record.dimensions || {};
    for (var i = 0; i < dimension.aliases.length; i += 1) {
      if (values[dimension.aliases[i]]) return values[dimension.aliases[i]];
    }
    return null;
  }
  function courseEvidencePassed(id, masteryByCourse) {
    var row = masteryByCourse[id];
    return !!row && row.evidenceCount >= 6 && row.appliedEvidenceCount >= 1 && row.probability >= 0.8;
  }
  function usableRegistration(session, now) {
    if (!session || !session.registrationUrl || session.status === "cancelled" || session.status === "done") return null;
    var end = Date.parse(session.end || session.start || "");
    if (isNaN(end) || end < now) return null;
    try {
      var url = new URL(session.registrationUrl);
      return /^https?:$/.test(url.protocol) ? url.href : null;
    } catch (error) {
      return null;
    }
  }

  function createModel(input) {
    input = input || {};
    var catalog = input.catalog || {};
    var role = array(catalog.roles).find(function (row) { return row.id === input.roleId; });
    if (!role) role = array(catalog.roles).find(function (row) { return row.id === "tc"; }) || array(catalog.roles)[0] || { id: "", label: "" };
    var roleId = role.id;
    var referenceTargets = TARGETS[roleId] || [];
    var imported = input.assessmentImport && input.assessmentImport.profileId === roleId ? input.assessmentImport : null;
    var assessment = input.assessment || {};
    var assessmentMatches = !assessment.role && !assessment.roleId || assessment.roleId === roleId || assessment.role === role.label || assessment.role === roleId;
    var ratings = assessmentMatches ? assessment.ratings || {} : {};
    var evidence = input.capabilityEvidence || {};
    var masteryByCourse = {};
    array(input.mastery && input.mastery.courses).forEach(function (row) { masteryByCourse[row.courseId] = row; });
    var courses = array(catalog.courses);
    var courseById = {};
    var progress = {};
    courses.forEach(function (course) { courseById[course.id] = course; progress[course.id] = progressFor(course, input); });
    var targetChanged = false;
    var candidates = {};
    var gaps = [];
    var unavailable = [];

    var dimensions = DIMENSIONS.map(function (definition, index) {
      var baseline = assessedRow(imported, definition);
      var baselineRank = baseline ? rank(baseline.currentLevel) : null;
      var target = baseline && rank(baseline.targetLevel) != null ? rank(baseline.targetLevel) : referenceTargets[index];
      if (target !== referenceTargets[index]) targetChanged = true;
      var caps = array(catalog.capabilities).filter(function (cap) { return matchesDimension(cap.cluster, definition); }).map(function (cap) { return Object.assign({}, cap, { title: canonicalCapabilityTitle(cap.title) }); });
      var rows = caps.map(function (cap) {
        var explicit = Object.prototype.hasOwnProperty.call(ratings, String(cap.id)) ? rank(ratings[cap.id]) : null;
        // A dimension-level baseline remains labelled as an inherited baseline,
        // never as an individual measured capability result.
        var current = explicit != null ? explicit : baselineRank;
        var source = explicit != null ? "self-assessment" : baselineRank != null ? "assessment-import" : "unknown";
        var mapped = evidence[cap.id] || {};
        var observed = 0;
        for (var stage = 1; stage <= 3; stage += 1) {
          var proofIds = array(mapped[LEVELS[stage]]);
          if (!proofIds.length || !proofIds.every(function (id) { return courseEvidencePassed(id, masteryByCourse); })) break;
          observed = stage;
        }
        if (observed > (current || 0)) { current = observed; source = "learning-evidence"; }
        var notRelevant = ["not relevant", "not-relevant", "n. a."].indexOf(String(ratings[cap.id] || "").toLowerCase()) >= 0 || !target;
        var needed = !notRelevant && (current == null || current < target);
        var learningStages = [];
        if (!notRelevant) {
          for (var level = (current || 0) + 1; level <= target; level += 1) {
            var ids = array(mapped[LEVELS[level]]);
            var prerequisiteIds = [];
            for (var lower = (current || 0) + 1; lower < level; lower += 1) prerequisiteIds = prerequisiteIds.concat(array(mapped[LEVELS[lower]]));
            learningStages.push({ level: LEVELS[level], courseIds: ids.slice(), completed: ids.length > 0 && ids.every(function (id) { return progress[id] && progress[id].completed; }) });
            if (!ids.length) unavailable.push({ dimension: definition.name, capabilityId: cap.id, capability: cap.title, targetLevel: LEVELS[level], reason: "unmapped" });
            ids.forEach(function (id) {
              var course = courseById[id];
              if (!course || !eligible(course, roleId)) {
                unavailable.push({ dimension: definition.name, capabilityId: cap.id, capability: cap.title, courseId: id, targetLevel: LEVELS[level], reason: "unavailable" });
                return;
              }
              if (!candidates[id]) candidates[id] = { course: course, matches: [], prerequisiteIds: [] };
              candidates[id].matches.push({ dimension: definition.name, dimensionId: definition.id, capabilityId: cap.id, capability: cap.title, currentLevel: current === 0 ? "None" : LEVELS[current] || null, targetLevel: LEVELS[level], rank: level, source: source });
              candidates[id].prerequisiteIds = unique(candidates[id].prerequisiteIds.concat(prerequisiteIds)).filter(function (pid) { return pid !== id; });
            });
          }
        }
        return { id: cap.id, title: cap.title, currentLevel: current === 0 ? "None" : LEVELS[current] || null, currentRank: current, targetLevel: LEVELS[target] || null, source: source, observedLevel: LEVELS[observed] || null, notRelevant: notRelevant, needed: needed, stages: learningStages };
      });
      var relevant = rows.filter(function (row) { return !row.notRelevant; });
      var allKnown = relevant.length > 0 && relevant.every(function (row) { return row.currentRank != null; });
      var current = baselineRank;
      if (allKnown) current = Math.min.apply(null, relevant.map(function (row) { return row.currentRank; }));
      var observedAll = relevant.length > 0 && relevant.every(function (row) { return rank(row.observedLevel) >= target; });
      var met = target && allKnown && relevant.every(function (row) { return row.currentRank >= target; });
      var status = !target || rows.length > 0 && !relevant.length ? "not-relevant" : observedAll ? "evidenced" : met ? "self-assessed" : current == null ? "unknown" : "gap";
      var row = { id: definition.id, name: definition.name, currentLevel: current === 0 ? "None" : LEVELS[current] || null, targetLevel: LEVELS[target] || null, referenceTargetLevel: LEVELS[referenceTargets[index]] || null, status: status, source: observedAll ? "learning-evidence" : baselineRank != null ? "assessment-import" : allKnown ? "self-assessment" : "unknown", assessedAt: imported && imported.importedAt || assessment.updatedAt || null, capabilities: rows, nextLevel: target && current !== null && current < target ? LEVELS[current + 1] : status === "unknown" ? "Acquire" : null };
      if (status === "gap") gaps.push(row);
      return row;
    });

    var saved = input.savedPlan;
    var savedMatches = saved && saved.learner && saved.learner.roleId === roleId;
    var savedSteps = savedMatches ? array(saved.steps) : [];
    var excluded = savedMatches ? array(saved.excludedCourseIds) : [];
    // A consciously chosen, role-compatible course may be outside the explicit
    // matrix; retain it as personal choice without claiming dimension coverage.
    savedSteps.forEach(function (step) {
      var course = courseById[step.courseId];
      if (course && eligible(course, roleId) && !candidates[course.id] && (saved.customized || step.personalized)) candidates[course.id] = { course: course, matches: [], prerequisiteIds: [], personal: true };
    });
    courses.forEach(function (course) {
      if (progress[course.id].touched && !progress[course.id].completed && eligible(course, roleId) && !candidates[course.id]) candidates[course.id] = { course: course, matches: [], prerequisiteIds: [], personal: true };
    });
    var assigned = unique(array(input.assignments).flatMap(function (assignment) { return array(assignment.courseIds); }));
    assigned.forEach(function (id) { if (courseById[id] && eligible(courseById[id], roleId) && !candidates[id]) candidates[id] = { course: courseById[id], matches: [], prerequisiteIds: [] }; });
    var preferred = savedSteps.map(function (step) { return step.courseId; });
    var ranking = array(input.rankedSteps).map(function (step) { return step.courseId; });
    var de = input.locale === "de";
    var steps = Object.keys(candidates).filter(function (id) { return excluded.indexOf(id) < 0; }).map(function (id) {
      var entry = candidates[id];
      var course = entry.course;
      var p = progress[id];
      var matches = entry.matches.slice().sort(function (a, b) { return a.rank - b.rank; });
      var match = matches[0] || {};
      var explicitPrereqs = array(course.prerequisiteCourseIds);
      var openPrerequisites = unique(entry.prerequisiteIds.concat(explicitPrereqs)).filter(function (pid) { return !progress[pid] || !progress[pid].completed; });
      var status = p.completed ? "completed" : !p.available ? "unavailable" : openPrerequisites.length ? "prerequisite-open" : p.touched ? "in-progress" : "ready";
      var activityPath = lessonPaths(id, input.courseMaps).find(function (path) { return !(input.progressState && input.progressState.lessons && input.progressState.lessons[path] && input.progressState.lessons[path].completedAt); });
      var reason = match.capability
        ? (de ? "Übt " : "Practises ") + match.capability + " · " + match.dimension + " · " + match.targetLevel + "."
        : (de ? "Für deinen persönlichen Lernpfad ausgewählt; ohne belegte Dimensionszuordnung." : "Selected for your personal learning path; no confirmed dimension mapping.");
      if (status === "in-progress") reason = (de ? "Setze deinen begonnenen Kurs fort. " : "Continue the course you started. ") + reason;
      if (status === "prerequisite-open") reason = (de ? "Zuerst die vorbereitenden Lernschritte abschließen. " : "Complete the preparatory learning steps first. ") + reason;
      if (assigned.indexOf(id) >= 0) reason = (de ? "Deinem Team zugewiesen. " : "Assigned to your team. ") + reason;
      return { courseId: id, title: course.title, href: "lrn/course.html?id=" + encodeURIComponent(id), activityHref: activityPath ? "lesson.html?path=" + encodeURIComponent(activityPath) + "&course=" + encodeURIComponent(id) : null, reason: reason, status: status, dimension: match.dimension || null, capability: match.capability || null, targetLevel: match.targetLevel || null, currentLevel: match.currentLevel || null, matches: matches, prerequisiteCourseIds: openPrerequisites, percent: p.percent, rank: match.rank || 0, sequence: Number(course.sequence) || 0, assigned: assigned.indexOf(id) >= 0, personalized: !!entry.personal };
    });
    steps.sort(function (a, b) {
      if (a.status === "completed" || b.status === "completed") return (a.status === "completed" ? 1 : 0) - (b.status === "completed" ? 1 : 0) || a.sequence - b.sequence;
      if (a.assigned !== b.assigned) return a.assigned ? -1 : 1;
      if (input.focusDimensionId) {
        var aFocus = a.matches.some(function (match) { return match.dimensionId === input.focusDimensionId; });
        var bFocus = b.matches.some(function (match) { return match.dimensionId === input.focusDimensionId; });
        if (aFocus !== bFocus) return aFocus ? -1 : 1;
      }
      var ai = preferred.indexOf(a.courseId), bi = preferred.indexOf(b.courseId);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
      if (a.status === "in-progress" || b.status === "in-progress") return (b.status === "in-progress" ? 1 : 0) - (a.status === "in-progress" ? 1 : 0);
      if (a.rank !== b.rank) return a.rank - b.rank;
      var ar = ranking.indexOf(a.courseId), br = ranking.indexOf(b.courseId);
      if (ar >= 0 || br >= 0) return (ar < 0 ? Infinity : ar) - (br < 0 ? Infinity : br);
      return a.sequence - b.sequence || a.courseId.localeCompare(b.courseId);
    });
    // Expand prerequisites directly before their dependent step. A malformed
    // cycle stays blocked instead of causing recursion or recommending it.
    var byStep = {};
    steps.forEach(function (step) { byStep[step.courseId] = step; });
    var ordered = [], visiting = {}, visited = {};
    function visit(step) {
      if (visited[step.courseId] || visiting[step.courseId]) return;
      visiting[step.courseId] = true;
      step.prerequisiteCourseIds.forEach(function (id) { if (byStep[id]) visit(byStep[id]); });
      visiting[step.courseId] = false;
      visited[step.courseId] = true;
      ordered.push(step);
    }
    steps.forEach(visit);
    steps = ordered;
    var next = steps.find(function (step) { return step.status === "ready" || step.status === "in-progress"; }) || null;
    if (next) steps = [next].concat(steps.filter(function (step) { return step !== next; }));
    var externalRecommendations = [];
    var now = Number.isFinite(input.now) ? input.now : Date.now();
    array(catalog.academyPaths).forEach(function (path) {
      if (!(path.recommendationRanks && path.recommendationRanks[roleId]) && !path.foundationRank) return;
      var ids = unique(array(path.stages).flatMap(function (stage) { return array(stage.courses); }));
      if (!ids.length || !ids.every(function (id) { return progress[id] && progress[id].completed; })) return;
      var anchor = ids[ids.length - 1];
      var registrationUrl = array(catalog.sessions).filter(function (session) { return session.courseId === anchor; }).map(function (session) { return usableRegistration(session, now); }).filter(Boolean)[0];
      if (!registrationUrl) return;
      externalRecommendations.push({ academyCourse: path.academyCourse, title: path.title, courseId: anchor, href: registrationUrl, status: "ready", bookingAvailable: true, reason: de ? "Wenn du das Gelernte praktisch vertiefen möchtest, findest du hier ein passendes Angebot der LHIND Academy." : "If you want to deepen what you have learned in practice, you can find a suitable LHIND Academy offering here." });
    });
    var assessmentAvailable = !!imported || Object.keys(ratings).some(function (id) { return rank(ratings[id]) != null; });
    return {
      roleId: roleId, role: role, roleSelected: input.roleSelected !== false,
      focusDimensionId: input.focusDimensionId || null,
      dimensions: dimensions, next: next, steps: steps, gaps: gaps,
      unknownCount: dimensions.filter(function (row) { return row.status === "unknown"; }).length,
      assessmentAvailable: assessmentAvailable, provisional: !assessmentAvailable,
      targetSource: imported ? "assessment-import" : "reference", targetChanged: targetChanged,
      targetSourceDate: imported && imported.importedAt || "2026-08",
      externalRecommendations: externalRecommendations,
      coverageGaps: unavailable,
      savedPlanActive: !!savedMatches,
      roleChanged: !!saved && !savedMatches,
      completedCourseCount: courses.filter(function (course) { return progress[course.id].completed; }).length,
      reachedDimensionCount: dimensions.filter(function (row) { return row.status === "self-assessed" || row.status === "evidenced"; }).length
    };
  }

  return { createModel: createModel, rank: rank, lessonPaths: lessonPaths, canonicalCapabilityTitle: canonicalCapabilityTitle, referenceTargets: TARGETS, dimensions: DIMENSIONS };
});
