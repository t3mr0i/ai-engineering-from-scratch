/**
 * Evidence-based learner model for the LRN cockpit.
 * Quiz attempts update one BKT-style probability per stable question id;
 * reading and completion remain engagement signals and never prove mastery.
 * The module is deterministic, local-first, and dependency-free.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LrnMastery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var VERSION = 1;
  var DAY_MS = 24 * 60 * 60 * 1000;
  var DEFAULTS = { prior: 0.2, guess: 0.2, slip: 0.1, learn: 0.12 };
  var MASTERY_THRESHOLD = 0.8;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function normalizeAttempt(value, fallbackTime) {
    if (!value || typeof value !== "object" || typeof value.correct !== "boolean") return null;
    return {
      correct: value.correct,
      picked: Number.isInteger(value.picked) ? value.picked : null,
      t: Number.isFinite(Number(value.t)) ? Number(value.t) : fallbackTime || 0,
    };
  }

  function attemptsFor(answer) {
    if (!answer || typeof answer !== "object") return [];
    var attempts = Array.isArray(answer.attempts) ? answer.attempts : [answer];
    return attempts.map(function (attempt) { return normalizeAttempt(attempt, answer.t); }).filter(Boolean)
      .sort(function (left, right) { return left.t - right.t; });
  }

  function updateProbability(probability, correct, parameters) {
    var p = clamp(probability, 0.001, 0.999);
    var guess = clamp(parameters.guess, 0.001, 0.999);
    var slip = clamp(parameters.slip, 0.001, 0.999);
    var learn = clamp(parameters.learn, 0, 0.999);
    var numerator = correct ? p * (1 - slip) : p * slip;
    var denominator = correct
      ? numerator + (1 - p) * guess
      : numerator + (1 - p) * (1 - guess);
    var observed = denominator ? numerator / denominator : p;
    return clamp(observed + (1 - observed) * learn, 0, 1);
  }

  function reviewInterval(attempts, probability) {
    if (!attempts.length) return DAY_MS;
    var streak = 0;
    for (var index = attempts.length - 1; index >= 0 && attempts[index].correct; index -= 1) streak += 1;
    if (!attempts[attempts.length - 1].correct) return DAY_MS;
    var days = [1, 3, 7, 14, 30][Math.min(streak - 1, 4)];
    if (probability < 0.5) days = 1;
    return days * DAY_MS;
  }

  function conceptMastery(answer, options) {
    options = options || {};
    var parameters = {
      prior: options.prior == null ? DEFAULTS.prior : options.prior,
      guess: options.guess == null ? DEFAULTS.guess : options.guess,
      slip: options.slip == null ? DEFAULTS.slip : options.slip,
      learn: options.learn == null ? DEFAULTS.learn : options.learn,
    };
    var attempts = attemptsFor(answer);
    var probability = clamp(parameters.prior, 0, 1);
    attempts.forEach(function (attempt) {
      probability = updateProbability(probability, attempt.correct, parameters);
    });
    var latest = attempts.length ? attempts[attempts.length - 1] : null;
    var nextDueAt = latest ? latest.t + reviewInterval(attempts, probability) : 0;
    return {
      probability: probability,
      percent: Math.round(probability * 100),
      attempts: attempts.length,
      successes: attempts.filter(function (attempt) { return attempt.correct; }).length,
      lastAttemptAt: latest ? latest.t : 0,
      nextDueAt: nextDueAt,
      mastered: attempts.length >= 2 && probability >= MASTERY_THRESHOLD,
    };
  }

  function lessonTitles(curriculumMap) {
    var result = {};
    var courseIds = {};
    Object.keys(curriculumMap && curriculumMap.courseMaps || {}).forEach(function (courseId) {
      (curriculumMap.courseMaps[courseId] || []).forEach(function (unit) {
        (unit.lessons || []).forEach(function (lesson) {
          if (!lesson || !lesson.path) return;
          if (!result[lesson.path]) result[lesson.path] = lesson.title || lesson.path;
          if (!courseIds[lesson.path]) courseIds[lesson.path] = [];
          if (courseIds[lesson.path].indexOf(courseId) < 0) courseIds[lesson.path].push(courseId);
        });
      });
    });
    return { titles: result, courseIds: courseIds };
  }

  function mean(values) {
    return values.length ? values.reduce(function (sum, value) { return sum + value; }, 0) / values.length : 0;
  }

  function summarize(options) {
    options = options || {};
    var progress = options.progressState && options.progressState.lessons || {};
    var now = Number.isFinite(Number(options.now)) ? Number(options.now) : Date.now();
    var metadata = lessonTitles(options.curriculumMap || {});
    var concepts = [];
    var lessonRows = [];
    var byCourse = {};
    var appliedEvidence = [];
    var appliedByCourse = {};

    Object.keys(progress).sort().forEach(function (lessonPath) {
      var lesson = progress[lessonPath] || {};
      Object.keys(lesson.appliedEvidence || {}).sort().forEach(function (evidenceId) {
        var evidenceRow = lesson.appliedEvidence[evidenceId];
        if (!evidenceRow || evidenceRow.passed !== true) return;
        var row = { evidenceId: evidenceId, lessonPath: lessonPath, courseIds: (metadata.courseIds[lessonPath] || []).slice(), passedAt: Number(evidenceRow.t) || 0 };
        appliedEvidence.push(row);
        row.courseIds.forEach(function (courseId) { appliedByCourse[courseId] = (appliedByCourse[courseId] || 0) + 1; });
      });
      var rows = Object.keys(lesson.answers || {}).sort().map(function (qid) {
        var mastery = conceptMastery(lesson.answers[qid], options.parameters);
        var row = {
          id: lessonPath + "#" + qid,
          lessonPath: lessonPath,
          lessonTitle: metadata.titles[lessonPath] || lessonPath.split("/").pop().replace(/-/g, " "),
          questionId: qid,
          stage: String(qid).split("-")[0],
          courseIds: (metadata.courseIds[lessonPath] || []).slice(),
          probability: mastery.probability,
          percent: mastery.percent,
          attempts: mastery.attempts,
          successes: mastery.successes,
          lastAttemptAt: mastery.lastAttemptAt,
          nextDueAt: mastery.nextDueAt,
          due: mastery.attempts > 0 && mastery.nextDueAt <= now,
          mastered: mastery.mastered,
        };
        concepts.push(row);
        return row;
      });
      if (!rows.length) return;
      var probability = mean(rows.map(function (row) { return row.probability; }));
      var lessonRow = {
        lessonPath: lessonPath,
        lessonTitle: metadata.titles[lessonPath] || lessonPath,
        courseIds: (metadata.courseIds[lessonPath] || []).slice(),
        probability: probability,
        percent: Math.round(probability * 100),
        evidenceCount: rows.reduce(function (sum, row) { return sum + row.attempts; }, 0),
        conceptCount: rows.length,
        masteredConcepts: rows.filter(function (row) { return row.mastered; }).length,
        dueCount: rows.filter(function (row) { return row.due; }).length,
      };
      lessonRows.push(lessonRow);
      lessonRow.courseIds.forEach(function (courseId) {
        if (!byCourse[courseId]) byCourse[courseId] = [];
        byCourse[courseId].push(lessonRow);
      });
    });

    var courses = Object.keys(byCourse).sort().map(function (courseId) {
      var rows = byCourse[courseId];
      var probability = mean(rows.map(function (row) { return row.probability; }));
      return {
        courseId: courseId,
        probability: probability,
        percent: Math.round(probability * 100),
        evidenceCount: rows.reduce(function (sum, row) { return sum + row.evidenceCount; }, 0),
        lessonCount: rows.length,
        dueCount: rows.reduce(function (sum, row) { return sum + row.dueCount; }, 0),
        appliedEvidenceCount: appliedByCourse[courseId] || 0,
      };
    });

    var dueReviews = concepts.filter(function (row) { return row.due && !row.mastered; })
      .sort(function (left, right) { return left.nextDueAt - right.nextDueAt || left.id.localeCompare(right.id); })
      .map(function (row) {
        return {
          conceptId: row.id,
          lessonPath: row.lessonPath,
          lessonTitle: row.lessonTitle,
          courseId: row.courseIds[0] || "",
          percent: row.percent,
          dueAt: row.nextDueAt,
        };
      });

    return {
      schemaVersion: VERSION,
      generatedAt: now,
      concepts: concepts,
      lessons: lessonRows,
      courses: courses,
      dueReviews: dueReviews,
      appliedEvidence: appliedEvidence,
      evidenceCount: concepts.reduce(function (sum, row) { return sum + row.attempts; }, 0),
    };
  }

  function capabilitySummary(summary, evidence) {
    var courseById = {};
    (summary && summary.courses || []).forEach(function (course) { courseById[course.courseId] = course; });
    return Object.keys(evidence || {}).sort(function (a, b) { return Number(a) - Number(b); }).map(function (capabilityId) {
      var courseIds = [];
      var stages = evidence[capabilityId] || {};
      Object.keys(stages).forEach(function (stage) {
        (stages[stage] || []).forEach(function (courseId) {
          if (courseIds.indexOf(courseId) < 0) courseIds.push(courseId);
        });
      });
      var rows = courseIds.map(function (id) { return courseById[id]; }).filter(Boolean);
      var probability = mean(rows.map(function (row) { return row.probability; }));
      var evidenceCount = rows.reduce(function (sum, row) { return sum + row.evidenceCount; }, 0);
      var appliedEvidenceCount = (summary && summary.appliedEvidence || []).filter(function (row) {
        return row.courseIds.some(function (courseId) { return courseIds.indexOf(courseId) >= 0; });
      }).filter(function (row, index, all) {
        return all.findIndex(function (candidate) {
          return candidate.lessonPath === row.lessonPath && candidate.evidenceId === row.evidenceId;
        }) === index;
      }).length;
      return {
        capabilityId: Number.isNaN(Number(capabilityId)) ? capabilityId : Number(capabilityId),
        probability: probability,
        percent: Math.round(probability * 100),
        evidenceCount: evidenceCount,
        appliedEvidenceCount: appliedEvidenceCount,
        courseIds: courseIds,
        eligibleForCredential: rows.length > 0 && evidenceCount >= 6 && appliedEvidenceCount >= 1 && probability >= MASTERY_THRESHOLD,
      };
    });
  }

  return {
    VERSION: VERSION,
    MASTERY_THRESHOLD: MASTERY_THRESHOLD,
    updateProbability: updateProbability,
    conceptMastery: conceptMastery,
    summarize: summarize,
    capabilitySummary: capabilitySummary,
  };
});
