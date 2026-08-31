/**
 * Deterministic personal learning-plan engine for the learner cockpit.
 *
 * The engine uses only catalog metadata and an explicit learner snapshot. It
 * deliberately treats cadence as prioritisation capacity: course durations
 * are not present in the manifest and are therefore never estimated here.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LrnLearningPlan = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SCHEMA_VERSION = 1;
  var ALGORITHM_VERSION = "mastery-adaptive-v2";
  var SESSIONS_PER_FOCUS_SLOT = 4;
  var MAX_FOCUS_COURSES = 8;
  var LEVEL_RANK = {
    "not relevant": 0,
    "n. a.": 0,
    none: 0,
    basic: 1,
    acquire: 1,
    advanced: 2,
    deepen: 2,
    expert: 3,
    create: 3,
  };
  var LEVEL_LABEL = [null, "Acquire", "Deepen", "Create"];
  var STOP_WORDS = {
    a: true, an: true, and: true, are: true, as: true, at: true, be: true,
    by: true, for: true, from: true, i: true, in: true, into: true, is: true,
    it: true, my: true, of: true, on: true, or: true, that: true, the: true,
    this: true, to: true, want: true, with: true, ai: true,
    als: true, am: true, auf: true, aus: true, das: true, dem: true,
    den: true, der: true, die: true, ein: true, eine: true, fuer: true, fur: true,
    ich: true, im: true, in: true, ist: true, ki: true, lernen: true,
    mein: true, meine: true, mit: true, und: true, von: true, wie: true,
    will: true, zu: true,
  };
  var CLUSTER_HINTS = {
    foundation: {
      dimensions: ["literacy", "data", "prompting"],
      interests: ["foundation", "governance", "productivity"],
    },
    engineering: {
      dimensions: ["prompting", "data"],
      interests: ["engineering"],
    },
    "product and process": {
      dimensions: ["business", "prompting"],
      interests: ["consulting", "productivity"],
    },
    "advisory and business consulting": {
      dimensions: ["business", "prompting"],
      interests: ["consulting"],
    },
    "leadership and strategy": {
      dimensions: ["change", "business"],
      interests: ["leadership"],
    },
  };

  function cleanText(value) {
    var text = String(value == null ? "" : value).toLowerCase();
    if (typeof text.normalize === "function") {
      text = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    }
    return text.replace(/ß/g, "ss");
  }

  function tokens(value) {
    var seen = Object.create(null);
    return cleanText(value)
      .split(/[^a-z0-9]+/)
      .filter(function (token) {
        if (token.length < 2 || STOP_WORDS[token] || seen[token]) return false;
        seen[token] = true;
        return true;
      });
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function stringSet(values) {
    var result = Object.create(null);
    toArray(values).forEach(function (value) {
      result[String(value)] = true;
    });
    return result;
  }

  function levelRank(value, fieldName) {
    if (value == null || value === "" || value === 0 || value === "0") return 0;
    if (typeof value === "number") {
      if (Number.isInteger(value) && value >= 1 && value <= 3) return value;
      throw new RangeError(fieldName + " must be Acquire/Deepen/Create or 1/2/3");
    }
    var rank = LEVEL_RANK[cleanText(value).trim()];
    if (rank == null) {
      throw new RangeError(fieldName + " must be Acquire/Deepen/Create or 1/2/3");
    }
    return rank;
  }

  function positiveInteger(value, fieldName, minimum, maximum) {
    var number = typeof value === "string" && value.trim() ? Number(value) : value;
    if (!Number.isInteger(number) || number < minimum || number > maximum) {
      throw new RangeError(fieldName + " must be an integer from " + minimum + " to " + maximum);
    }
    return number;
  }

  function validateCatalog(catalog) {
    if (!catalog || typeof catalog !== "object" || !Array.isArray(catalog.courses)) {
      throw new TypeError("catalog.courses must be an array");
    }
    if (!catalog.courses.length) throw new RangeError("catalog.courses must not be empty");

    var ids = Object.create(null);
    catalog.courses.forEach(function (course, index) {
      if (!course || typeof course !== "object") {
        throw new TypeError("catalog.courses[" + index + "] must be an object");
      }
      if (typeof course.id !== "string" || !course.id.trim()) {
        throw new TypeError("catalog.courses[" + index + "].id must be a non-empty string");
      }
      if (ids[course.id]) throw new RangeError("duplicate course id: " + course.id);
      ids[course.id] = true;
      if (typeof course.title !== "string" || !course.title.trim()) {
        throw new TypeError("course " + course.id + " must have a title");
      }
    });
    return ids;
  }

  function normaliseCourseIds(value, fieldName) {
    if (value == null) return [];
    if (!Array.isArray(value)) {
      if (typeof value === "object") {
        return Object.keys(value).filter(function (id) { return !!value[id]; });
      }
      throw new TypeError(fieldName + " must be an array or an id map");
    }
    return value.map(function (entry, index) {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") {
        var id = entry.courseId || entry.id;
        if (typeof id === "string" && id) return id;
      }
      throw new TypeError(fieldName + "[" + index + "] must identify a course");
    });
  }

  function firstDefined() {
    for (var i = 0; i < arguments.length; i += 1) {
      if (arguments[i] != null) return arguments[i];
    }
    return undefined;
  }

  function readProgress(learner, catalogIds) {
    var progress = learner.progress || {};
    if (progress && typeof progress !== "object") {
      throw new TypeError("learner.progress must be an object");
    }
    var completed = normaliseCourseIds(firstDefined(
      progress.completedCourseIds,
      progress.completed,
      learner.completedCourseIds,
      learner.completedCourses
    ), "learner.progress.completed");
    var inProgress = normaliseCourseIds(firstDefined(
      progress.inProgressCourseIds,
      progress.inProgress,
      learner.inProgressCourseIds,
      learner.inProgressCourses
    ), "learner.progress.inProgress");
    var unknown = [];
    var completedSet = Object.create(null);
    var inProgressSet = Object.create(null);

    completed.forEach(function (id) {
      if (!catalogIds[id]) unknown.push(id);
      else completedSet[id] = true;
    });
    inProgress.forEach(function (id) {
      if (!catalogIds[id]) unknown.push(id);
      else if (!completedSet[id]) inProgressSet[id] = true;
    });

    return {
      completed: completedSet,
      inProgress: inProgressSet,
      unknown: Array.from(new Set(unknown)).sort(),
    };
  }

  function readRatings(learner) {
    var assessment = learner.assessment;
    var raw = firstDefined(
      learner.assessmentRatings,
      assessment && assessment.ratings,
      assessment
    );
    if (raw == null) return Object.create(null);
    var ratings = Object.create(null);

    if (Array.isArray(raw)) {
      raw.forEach(function (entry, index) {
        if (!entry || typeof entry !== "object") {
          throw new TypeError("learner assessment entry " + index + " must be an object");
        }
        var id = firstDefined(entry.capabilityId, entry.id);
        if (id == null) throw new TypeError("learner assessment entry " + index + " needs a capabilityId");
        ratings[String(id)] = levelRank(firstDefined(entry.rating, entry.level, entry.value), "assessment rating " + id);
      });
      return ratings;
    }

    if (typeof raw !== "object") throw new TypeError("learner assessment ratings must be an object or array");
    Object.keys(raw).forEach(function (id) {
      ratings[String(id)] = levelRank(raw[id], "assessment rating " + id);
    });
    return ratings;
  }

  function readMastery(learner, catalogIds) {
    var raw = learner.mastery && typeof learner.mastery === "object" ? learner.mastery : {};
    var courses = Object.create(null);
    toArray(raw.courses).forEach(function (row) {
      if (!row || typeof row !== "object" || !catalogIds[row.courseId]) return;
      courses[row.courseId] = {
        probability: Math.max(0, Math.min(1, Number(row.probability) || 0)),
        evidenceCount: Math.max(0, Math.floor(Number(row.evidenceCount) || 0)),
        dueCount: Math.max(0, Math.floor(Number(row.dueCount) || 0)),
      };
    });
    var dueReviews = toArray(raw.dueReviews).filter(function (row) {
      return row && typeof row === "object" && typeof row.lessonPath === "string" && row.lessonPath;
    }).slice(0, 40).map(function (row) {
      return {
        conceptId: String(row.conceptId || ""),
        lessonPath: row.lessonPath,
        lessonTitle: String(row.lessonTitle || row.lessonPath),
        courseId: catalogIds[row.courseId] ? row.courseId : "",
        percent: Math.max(0, Math.min(100, Math.round(Number(row.percent) || 0))),
        dueAt: Math.max(0, Number(row.dueAt) || 0),
      };
    });
    return { courses: courses, dueReviews: dueReviews };
  }

  function readAssignments(learner, catalogIds) {
    var assigned = Object.create(null);
    toArray(learner.assignments).forEach(function (assignment) {
      if (!assignment || typeof assignment !== "object") return;
      toArray(assignment.courseIds).forEach(function (courseId) {
        if (!catalogIds[courseId]) return;
        assigned[courseId] = {
          assignmentId: String(assignment.id || ""),
          title: String(assignment.title || "Team assignment"),
          dueAt: String(assignment.dueAt || ""),
        };
      });
    });
    return assigned;
  }

  function computeAssessmentGaps(catalog, learner, roleId) {
    var ratings = readRatings(learner);
    var capabilities = toArray(catalog.capabilities);
    var gaps = [];

    capabilities.forEach(function (capability) {
      if (!capability || capability.id == null || !capability.targets) return;
      var targetValue = firstDefined(capability.targets[roleId], capability.targets.all);
      if (targetValue == null) return;
      var target = levelRank(targetValue, "capability " + capability.id + " target");
      if (!target) return;
      var rating = ratings[String(capability.id)];
      if (rating == null) return;
      var gap = Math.max(0, target - rating);
      if (!gap) return;
      gaps.push({
        capabilityId: capability.id,
        title: capability.title || "Capability " + capability.id,
        cluster: capability.cluster || "",
        currentLevel: rating ? LEVEL_LABEL[rating] : "None",
        targetLevel: LEVEL_LABEL[target],
        gap: gap,
      });
    });

    gaps.sort(function (left, right) {
      if (right.gap !== left.gap) return right.gap - left.gap;
      var a = String(left.capabilityId);
      var b = String(right.capabilityId);
      return a < b ? -1 : a > b ? 1 : 0;
    });
    return gaps;
  }

  function courseDocument(course) {
    return {
      title: stringSet(tokens(course.title)),
      summary: stringSet(tokens(course.summary)),
      detail: stringSet(tokens(
        toArray(course.outcomes).join(" ") + " " +
        toArray(course.modules).join(" ") + " " +
        (course.format || "")
      )),
      dimensions: stringSet(course.dimensions),
      interests: stringSet(course.interests),
      all: stringSet(tokens(
        course.title + " " + (course.summary || "") + " " +
        toArray(course.outcomes).join(" ") + " " +
        toArray(course.modules).join(" ") + " " +
        toArray(course.dimensions).join(" ") + " " +
        toArray(course.interests).join(" ")
      )),
    };
  }

  function goalSignal(course, document, goal, goalTokens) {
    if (!goalTokens.length) return null;
    var score = 0;
    var matches = [];
    goalTokens.forEach(function (token) {
      var weight = 0;
      if (document.title[token]) weight = 14;
      else if (document.summary[token]) weight = 8;
      else if (document.detail[token]) weight = 5;
      else if (document.dimensions[token] || document.interests[token]) weight = 6;
      if (weight) {
        score += weight;
        matches.push(token);
      }
    });
    var phrase = cleanText(goal).trim();
    var haystack = cleanText(course.title + " " + (course.summary || ""));
    if (phrase.length >= 5 && haystack.indexOf(phrase) >= 0) score += 12;
    if (!score) return null;
    return {
      type: "goal_match",
      score: Math.min(score, 70),
      terms: matches.sort(),
      detail: "Matches the learning goal: " + matches.sort().join(", ") + ".",
    };
  }

  function countMatches(values, targetSet) {
    var matches = [];
    toArray(values).forEach(function (value) {
      if (targetSet[String(value)]) matches.push(String(value));
    });
    return Array.from(new Set(matches)).sort();
  }

  function assessmentSignals(course, document, gaps) {
    var signals = [];
    gaps.forEach(function (gap) {
      var hints = CLUSTER_HINTS[cleanText(gap.cluster)] || { dimensions: [], interests: [] };
      var titleMatches = tokens(gap.title).filter(function (token) { return !!document.all[token]; }).sort();
      var dimensionMatches = countMatches(hints.dimensions, document.dimensions);
      var interestMatches = countMatches(hints.interests, document.interests);
      var relevance = titleMatches.length * 6 + dimensionMatches.length * 4 + interestMatches.length * 3;
      if (!relevance) return;
      var score = Math.min(36, relevance * gap.gap);
      signals.push({
        type: "assessment_gap",
        score: score,
        capabilityId: gap.capabilityId,
        gap: gap.gap,
        currentLevel: gap.currentLevel,
        targetLevel: gap.targetLevel,
        matches: {
          terms: titleMatches,
          dimensions: dimensionMatches,
          interests: interestMatches,
        },
        detail: "Addresses the assessment gap in " + gap.title + ".",
      });
    });
    return signals;
  }

  function levelSignal(course, currentLevel) {
    if (!currentLevel) return null;
    var courseRanks = toArray(course.levels).map(function (value) {
      return levelRank(value, "course " + course.id + " level");
    }).filter(Boolean);
    if (!courseRanks.length) return null;
    var score = 0;
    var relation = "";
    if (courseRanks.indexOf(currentLevel) >= 0) {
      score = 12;
      relation = "current";
    } else if (courseRanks.indexOf(currentLevel + 1) >= 0) {
      score = 10;
      relation = "next";
    } else if (courseRanks.some(function (rank) { return rank < currentLevel; })) {
      score = 3;
      relation = "foundation";
    }
    if (!score) return null;
    return {
      type: "level_match",
      score: score,
      relation: relation,
      level: LEVEL_LABEL[currentLevel],
      detail: relation === "next"
        ? "Builds toward the next level after " + LEVEL_LABEL[currentLevel] + "."
        : relation === "foundation"
          ? "Reinforces foundations below the current " + LEVEL_LABEL[currentLevel] + " level."
          : "Matches the current " + LEVEL_LABEL[currentLevel] + " level.",
    };
  }

  function roleEligible(course, roleId) {
    if (!roleId || !Array.isArray(course.roleIds) || !course.roleIds.length) return true;
    return course.roleIds.indexOf("all") >= 0 || course.roleIds.indexOf(roleId) >= 0;
  }

  function courseSequence(course) {
    var value = Number(course.sequence);
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
  }

  function compareRanked(left, right) {
    if (right.score !== left.score) return right.score - left.score;
    var sequenceDifference = courseSequence(left.course) - courseSequence(right.course);
    if (sequenceDifference) return sequenceDifference;
    return left.course.id < right.course.id ? -1 : left.course.id > right.course.id ? 1 : 0;
  }

  function sourcesFor(course, signals, roleId) {
    var sources = [{ type: "catalog_course", id: course.id }];
    signals.forEach(function (signal) {
      if (signal.type === "progress") sources.push({ type: "learner_progress", courseId: course.id });
      if (signal.type === "goal_match") sources.push({ type: "learner_goal", terms: signal.terms.slice() });
      if (signal.type === "assessment_gap") {
        sources.push({
          type: "assessment",
          capabilityId: signal.capabilityId,
          currentLevel: signal.currentLevel,
          targetLevel: signal.targetLevel,
        });
      }
      if (signal.type === "role_match") sources.push({ type: "learner_role", roleId: roleId });
      if (signal.type === "level_match") sources.push({ type: "learner_level", level: signal.level });
      if (signal.type === "mastery_gap") sources.push({ type: "quiz_mastery", courseId: course.id, evidenceCount: signal.evidenceCount });
      if (signal.type === "team_assignment") sources.push({ type: "team_assignment", assignmentId: signal.assignmentId });
    });
    return sources;
  }

  function rationaleFor(signals) {
    var preferred = ["team_assignment", "mastery_gap", "progress", "goal_match", "assessment_gap", "level_match", "role_match"];
    var details = [];
    preferred.forEach(function (type) {
      signals.forEach(function (signal) {
        if (signal.type === type && details.indexOf(signal.detail) < 0 && details.length < 3) {
          details.push(signal.detail);
        }
      });
    });
    return details.length
      ? details.join(" ")
      : "Selected from the curriculum catalog as the next available course.";
  }

  function buildPlan(input) {
    if (!input || typeof input !== "object") throw new TypeError("buildPlan input must be an object");
    var catalog = input.catalog;
    var learner = input.learner == null ? {} : input.learner;
    if (!learner || typeof learner !== "object" || Array.isArray(learner)) {
      throw new TypeError("learner must be an object");
    }
    var catalogIds = validateCatalog(catalog);
    var durationWeeks = positiveInteger(input.durationWeeks, "durationWeeks", 1, 52);
    var sessionsPerWeek = positiveInteger(input.sessionsPerWeek, "sessionsPerWeek", 1, 7);
    var roleId = learner.roleId == null ? "" : String(learner.roleId).trim();
    var roles = toArray(catalog.roles);
    if (roleId && roles.length && !roles.some(function (role) { return role && role.id === roleId; })) {
      throw new RangeError("unknown learner.roleId: " + roleId);
    }
    if (learner.goal != null && typeof learner.goal !== "string") {
      throw new TypeError("learner.goal must be a string");
    }
    var goal = (learner.goal || "").trim();
    if (goal.length > 500) throw new RangeError("learner.goal must be at most 500 characters");
    var currentLevel = levelRank(learner.currentLevel, "learner.currentLevel");
    var progress = readProgress(learner, catalogIds);
    var mastery = readMastery(learner, catalogIds);
    var assignments = readAssignments(learner, catalogIds);
    var gaps = computeAssessmentGaps(catalog, learner, roleId);
    var goalTokens = tokens(goal);
    var ranked = [];
    var roleExcluded = [];

    catalog.courses.forEach(function (course) {
      if (progress.completed[course.id]) return;
      if (!roleEligible(course, roleId)) {
        roleExcluded.push(course.id);
        return;
      }
      var document = courseDocument(course);
      var signals = [];
      if (assignments[course.id]) {
        signals.push({
          type: "team_assignment",
          score: 120,
          assignmentId: assignments[course.id].assignmentId,
          dueAt: assignments[course.id].dueAt,
          detail: "Required by the active team assignment" + (assignments[course.id].dueAt ? " before " + assignments[course.id].dueAt : "") + ".",
        });
      }
      if (mastery.courses[course.id] && mastery.courses[course.id].evidenceCount > 0 && mastery.courses[course.id].probability < 0.8) {
        var courseMastery = mastery.courses[course.id];
        signals.push({
          type: "mastery_gap",
          score: Math.min(80, Math.round((0.8 - courseMastery.probability) * 80) + courseMastery.dueCount * 10),
          probability: courseMastery.probability,
          evidenceCount: courseMastery.evidenceCount,
          dueCount: courseMastery.dueCount,
          detail: "Quiz evidence shows this course needs reinforcement.",
        });
      }
      if (progress.inProgress[course.id]) {
        signals.push({
          type: "progress",
          score: 50,
          detail: "Continues a course that is already in progress.",
        });
      }
      var goalMatch = goalSignal(course, document, goal, goalTokens);
      if (goalMatch) signals.push(goalMatch);
      signals = signals.concat(assessmentSignals(course, document, gaps));
      var levelMatch = levelSignal(course, currentLevel);
      if (levelMatch) signals.push(levelMatch);
      if (roleId) {
        signals.push({
          type: "role_match",
          score: course.roleIds && course.roleIds.indexOf(roleId) >= 0 ? 18 : 8,
          roleId: roleId,
          detail: "Fits the selected role.",
        });
      }
      var score = signals.reduce(function (sum, signal) { return sum + signal.score; }, 0);
      ranked.push({ course: course, score: score, signals: signals });
    });

    ranked.sort(compareRanked);
    var sessionSlots = durationWeeks * sessionsPerWeek;
    var focusCourseSlots = Math.max(1, Math.min(MAX_FOCUS_COURSES, Math.ceil(sessionSlots / SESSIONS_PER_FOCUS_SLOT)));
    var selected = ranked.slice(0, focusCourseSlots);
    var selectedCount = selected.length;
    var steps = selected.map(function (entry, index) {
      var targetWeek = selectedCount
        ? Math.min(durationWeeks, Math.floor(index * durationWeeks / selectedCount) + 1)
        : 1;
      return {
        position: index + 1,
        courseId: entry.course.id,
        title: entry.course.title,
        rationale: rationaleFor(entry.signals),
        targetWeek: targetWeek,
        status: progress.inProgress[entry.course.id] ? "in_progress" : "planned",
        rankScore: entry.score,
        signals: entry.signals,
        sources: sourcesFor(entry.course, entry.signals, roleId),
      };
    });

    var warnings = [];
    if (progress.unknown.length) {
      warnings.push("Ignored unknown progress course ids: " + progress.unknown.join(", "));
    }
    if (!steps.length) warnings.push("No eligible incomplete courses remain for this profile.");

    return {
      schemaVersion: SCHEMA_VERSION,
      algorithmVersion: ALGORITHM_VERSION,
      learner: {
        roleId: roleId || null,
        currentLevel: currentLevel ? LEVEL_LABEL[currentLevel] : null,
        goal: goal,
      },
      cadence: {
        durationWeeks: durationWeeks,
        sessionsPerWeek: sessionsPerWeek,
      },
      capacity: {
        availableSessionSlots: sessionSlots,
        sessionsPerFocusSlot: SESSIONS_PER_FOCUS_SLOT,
        focusCourseSlots: focusCourseSlots,
        selectedCourses: selectedCount,
        courseDurationDataAvailable: false,
        note: "Catalog course durations are unavailable; focus slots prioritise work and are not completion-time estimates.",
      },
      steps: steps,
      evidence: {
        assessmentGaps: gaps,
        excludedCompletedCourseIds: Object.keys(progress.completed).sort(),
        excludedRoleCourseIds: roleExcluded.sort(),
        tieBreak: ["rankScore desc", "course sequence asc", "course id asc"],
      },
      reviewQueue: mastery.dueReviews,
      warnings: warnings,
    };
  }

  function adaptPlan(existing, input) {
    if (!existing || typeof existing !== "object") return buildPlan(input);
    var next = buildPlan(input);
    var previousIds = toArray(existing.steps).map(function (step) { return step.courseId; });
    var nextIds = next.steps.map(function (step) { return step.courseId; });
    next.createdAt = existing.createdAt || Date.now();
    next.updatedAt = Date.now();
    next.revision = {
      reason: "mastery-and-progress-update",
      previousAlgorithmVersion: existing.algorithmVersion || "unknown",
      addedCourseIds: nextIds.filter(function (id) { return previousIds.indexOf(id) < 0; }),
      removedCourseIds: previousIds.filter(function (id) { return nextIds.indexOf(id) < 0; }),
      reviewCount: next.reviewQueue.length,
    };
    return next;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    ALGORITHM_VERSION: ALGORITHM_VERSION,
    buildPlan: buildPlan,
    adaptPlan: adaptPlan,
    tokenize: tokens,
  };
});
