(function () {
  "use strict";

  var STORE = "lhind:lrn-cockpit:v3";
  var data = window.LrnData;
  var curriculum = window.LrnCurriculumMap || { courseMaps: {}, omittedGroups: [] };
  var progressApi = window.AIFSProgress || null;
  // Rollout gate — see curriculum-map.js:visibleCourseIds. A hidden course id
  // in the URL falls through to the existing "Course not found" empty state.
  if (curriculum.visibleCourseIds && curriculum.visibleCourseIds.length) {
    data.courses = data.courses.filter(function (course) {
      return curriculum.visibleCourseIds.indexOf(course.id) !== -1;
    });
  }
  var courseById = indexBy(data.courses, "id");
  var academyPathByCourse = indexBy(data.academyPaths || [], "academyCourse");
  var trackByCode = indexBy(data.tracks || [], "code");

  var root = document.getElementById("courseRoot");
  var journeyRoot = document.getElementById("courseJourney");
  var srStatus = document.getElementById("srStatus");
  var course = resolveCourse();
  var academyPath = resolveAcademyPath();

  // Mirrors lang.js's entry() lookup, same as lrn.js's i18n() — course.js
  // has its own dynamic (non data-i18n) render path so it needs the same
  // helper. i18n.js/lang.js load before this script (see course.html), so
  // window.SITE_I18N/window.SiteLang are already populated by the time
  // render() runs below.
  function i18n(key, fallback) {
    var dict = window.SITE_I18N || {};
    var lang = window.SiteLang ? window.SiteLang.get() : "en";
    var entry = dict[key];
    if (!entry) return fallback == null ? key : fallback;
    if (entry[lang] != null) return entry[lang];
    if (entry.en != null) return entry.en;
    return fallback == null ? key : fallback;
  }

  function i18nFmt(key, vars, fallback) {
    var str = i18n(key, fallback);
    Object.keys(vars || {}).forEach(function (k) {
      str = str.replace("{" + k + "}", String(vars[k]));
    });
    return str;
  }

  setBackLinks();
  render();
  if (progressApi && progressApi.onChange) progressApi.onChange(render);
  document.addEventListener("sitelang:change", render);

  function resolveCourse() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    return id && courseById[id] ? courseById[id] : null;
  }

  function resolveAcademyPath() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("academy");
    if (id === "AI-01") id = "AI-06";
    return id && academyPathByCourse[id] ? academyPathByCourse[id] : null;
  }

  // "Back to courses" must preserve the catalog selection. Read the same store
  // the catalog persists to and re-encode profile/level/interests as params.
  // Point at "/" so it works from any host path (/, /lrn/, /lrn/course.html).
  function backHref() {
    var query = "";
    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (saved) {
        var parts = [];
        if (saved.profileId) parts.push("profile=" + encodeURIComponent(saved.profileId));
        if (saved.externalLevel) parts.push("level=" + encodeURIComponent(saved.externalLevel));
        if (Array.isArray(saved.interests) && saved.interests.length) {
          parts.push("interests=" + encodeURIComponent(saved.interests.join(",")));
        }
        if (parts.length) query = "?" + parts.join("&");
      }
    } catch (error) {
      query = "";
    }
    return "/" + query;
  }

  function setBackLinks() {
    var href = backHref();
    ["backLink", "backLinkTop"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.href = href;
    });
  }

  function activeProfileId() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      return saved && saved.profileId ? saved.profileId : "";
    } catch (error) {
      return "";
    }
  }

  function importedAssessment() {
    var importer = window.AIFSAssessmentImport || window.AssessmentImport;
    if (!importer || typeof importer.load !== "function") return null;
    try {
      var record = importer.load();
      return record && record.profileId === activeProfileId() ? record : null;
    } catch (error) {
      return null;
    }
  }

  function importedPlacement(courseItem, record) {
    var importer = window.AIFSAssessmentImport || window.AssessmentImport;
    if (!record || !importer || typeof importer.coursePlacement !== "function") return null;
    return importer.coursePlacement(courseItem, record, {
      profileId: activeProfileId(),
      capabilities: data.capabilities || [],
      evidence: window.AIFSCapabilityEvidence || {}
    });
  }

  // An imported baseline can explain why an untouched course is not the next
  // learning step. It is not completion evidence: once a learner has opened a
  // course, their real progress remains the source of truth.
  function assessmentAttainedCourse(courseItem, record, stats) {
    stats = stats || courseProgress(courseItem);
    if (stats.percent !== 0 || stats.visitedLessons > 0) return false;
    var placement = importedPlacement(courseItem, record);
    return Boolean(placement && placement.mapped && !placement.needsLearning);
  }

  function sharedJourneyNext() {
    var stateApi = window.LrnJourneyState;
    if (!stateApi || typeof stateApi.snapshot !== "function") return null;
    try {
      var snapshot = stateApi.snapshot();
      return snapshot && snapshot.next && snapshot.next.href ? snapshot.next : null;
    } catch (error) {
      return null;
    }
  }

  function render() {
    if (academyPath) {
      renderAcademyPath(academyPath);
      return;
    }

    if (!course) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = i18n("course_not_found", "Course not found. Return to the catalog.");
      replaceChildren(root, [empty]);
      return;
    }

    document.title = course.title + " · LHIND AI Learning Catalog";

    var map = courseMap(course.id);
    var stats = courseProgress(course);
    var nextLesson = nextLessonForCourse(course.id);
    var journeyNext = sharedJourneyNext();

    var intro = document.createElement("section");
    intro.className = "course-intro";
    intro.setAttribute("aria-labelledby", "courseTitle");

    var head = document.createElement("header");
    head.className = "course-head";

    var code = document.createElement("p");
    code.className = "course-head__code";
    code.textContent = course.id;

    var title = document.createElement("h1");
    title.id = "courseTitle";
    title.textContent = course.title;
    title.title = course.id + " · " + course.title;

    var summary = document.createElement("p");
    summary.className = "course-head__summary";
    summary.textContent = course.summary;

    var action = document.createElement("a");
    action.className = "primary-cta";
    if (nextLesson) {
      action.href = lessonHref(nextLesson.path, course.id);
      var ctaLabel = document.createElement("span");
      ctaLabel.textContent = stats.visitedLessons > 0 ? i18n("course_resume", "Resume") : i18n("course_open_first_task", "Open first task");
      action.append(ctaLabel, lucideIcon("arrow-right"));
    } else if (journeyNext) {
      action.href = journeyNext.href;
      var journeyLabel = document.createElement("span");
      journeyLabel.textContent = i18n("journey_open_course", "Open next course");
      action.append(journeyLabel, lucideIcon("arrow-right"));
    } else {
      action.appendChild(lucideIcon("check-circle"));
      var doneLabel = document.createElement("span");
      doneLabel.textContent = i18n("course_all_shipped", "All shipped");
      action.appendChild(doneLabel);
      action.href = "#";
      action.setAttribute("aria-disabled", "true");
      action.addEventListener("click", function (event) { event.preventDefault(); });
    }

    var progress = document.createElement("div");
    progress.className = "course-head__progress";

    var progressLabel = document.createElement("p");
    progressLabel.className = "course-head__progress-label";
    progressLabel.textContent = i18n("course_progress_heading", "Course progress");

    progress.append(progressLabel, progressMeter(stats.percent, i18nFmt("course_progress_label", { title: course.title }, "Progress {title}")));
    head.append(code, title, summary, progress, action);
    if (window.LrnJourneyState) {
      var journeyModel = window.LrnJourneyState.snapshot();
      var contribution = journeyModel && journeyModel.steps.find(function (step) { return step.courseId === course.id; });
      if (contribution && contribution.matches.length) {
        var purpose = document.createElement("p");
        purpose.className = "course-journey-purpose";
        purpose.textContent = i18n("journey_course_contribution", "Contribution to your target") + ": " +
          uniqueValues(contribution.matches.map(function (match) { return match.dimension + " · " + match.capability + " · " + match.targetLevel; })).join("; ");
        head.appendChild(purpose);
      }
    }

    var includes = document.createElement("aside");
    includes.className = "course-includes";
    includes.setAttribute("aria-labelledby", "courseIncludesTitle");

    var includesTitle = document.createElement("h2");
    includesTitle.id = "courseIncludesTitle";
    includesTitle.textContent = i18n("course_includes_title", "This course includes");

    var format = courseFormat(course);
    var formatBadge = document.createElement("span");
    formatBadge.className = "course-includes__format";
    formatBadge.title = course.format || i18n(format.labelKey, format.label);
    formatBadge.append(lucideIcon(format.icon), document.createTextNode(i18n(format.labelKey, format.label)));

    var includesList = document.createElement("ul");
    includesList.className = "course-includes__list";

    if (course.format) {
      includesList.appendChild(includesItem(format.icon, course.format));
    }

    var modules = Array.isArray(course.modules) ? course.modules.filter(function (module) {
      return typeof module === "string" && module.trim().length > 0;
    }) : [];

    modules.forEach(function (module) {
      includesList.appendChild(includesItem("puzzle-piece", module));
    });

    if (!includesList.children.length) {
      includesList.appendChild(includesItem(
        "list-checks",
        stats.lessonCount === 1
          ? i18n("course_activities_one", "1 activity")
          : i18nFmt("course_activities_many", { count: stats.lessonCount }, "{count} activities")
      ));
    }

    includes.append(includesTitle, formatBadge, includesList);
    intro.append(head, includes);

    var facts = document.createElement("section");
    facts.className = "course-facts";
    facts.setAttribute("aria-label", i18n("course_facts_label", "Course facts"));
    facts.append(
      factItem("chart-bar", i18n("course_fact_level", "Level"), localizedDepths(course.levels)),
      factItem("stack", i18n("course_fact_units", "Units"), String(stats.subcourseCount)),
      factItem("list-checks", i18n("course_fact_activities", "Activities"), String(stats.lessonCount)),
      factItem("compass", i18n("course_fact_focus", "Focus"), courseFocus(course))
    );

    var overview = document.createElement("section");
    overview.className = "course-overview";

    var about = document.createElement("article");
    about.className = "course-overview__about";
    about.setAttribute("aria-labelledby", "courseAboutTitle");

    var aboutTitle = document.createElement("h2");
    aboutTitle.id = "courseAboutTitle";
    aboutTitle.textContent = i18n("course_about_title", "About this course");
    about.appendChild(aboutTitle);

    if (course.format) {
      about.appendChild(overviewDetail(
        i18n("course_format_label", "Format"),
        i18n(format.labelKey, format.label) + " · " + course.format
      ));
    }
    if (modules.length) {
      about.appendChild(overviewDetail(i18n("course_modules_label", "Modules"), modules.join(" · ")));
    }
    var owner = window.LrnSchedule ? window.LrnSchedule.trainer(course.ownerTrainerId) : null;
    if (owner) {
      about.appendChild(overviewDetail(i18n("course_owner_label", "Course lead"), owner.name || owner.id));
    }

    overview.appendChild(about);

    var outcomes = Array.isArray(course.outcomes) ? course.outcomes.filter(function (s) { return typeof s === "string" && s.trim().length > 0; }) : [];
    if (outcomes.length) {
      var outcomesBlock = document.createElement("section");
      outcomesBlock.className = "course-head__outcomes";
      outcomesBlock.setAttribute("aria-labelledby", "courseOutcomesTitle");

      var outcomesTitle = document.createElement("h2");
      outcomesTitle.id = "courseOutcomesTitle";
      outcomesTitle.className = "course-head__outcomes-title";
      outcomesTitle.textContent = i18n("course_outcomes_title", "After this, you can ship:");

      var outcomesList = document.createElement("ul");
      outcomesList.className = "course-head__outcomes-list";
      outcomes.forEach(function (text) {
        var li = document.createElement("li");
        li.className = "course-head__outcomes-item";
        li.append(lucideIcon("check-circle"), document.createTextNode(text));
        outcomesList.appendChild(li);
      });

      outcomesBlock.append(outcomesTitle, outcomesList);
      overview.appendChild(outcomesBlock);
    }

    var pathSection = document.createElement("section");
    pathSection.className = "course-path";
    pathSection.setAttribute("aria-labelledby", "coursePathTitle");
    var pathHead = document.createElement("div");
    pathHead.className = "course-path__head";
    var pathTitle = document.createElement("h2");
    pathTitle.id = "coursePathTitle";
    pathTitle.textContent = i18n("course_path_title", "Your course path");
    var pathMeta = document.createElement("p");
    pathMeta.className = "course-path__meta";
    pathMeta.textContent = i18nFmt(
      stats.subcourseCount === 1 ? "course_path_unit_one" : "course_path_units_many",
      { count: stats.subcourseCount },
      stats.subcourseCount === 1 ? "1 unit" : "{count} units"
    ) + " · " + i18nFmt(
      stats.lessonCount === 1 ? "course_path_activity_one" : "course_path_activities_many",
      { count: stats.lessonCount },
      stats.lessonCount === 1 ? "1 activity" : "{count} activities"
    );
    pathHead.append(pathTitle, pathMeta);
    var pathIntro = document.createElement("p");
    pathIntro.className = "course-path__intro";
    pathIntro.textContent = i18n("course_path_intro", "Work through the units in order. Open any unit to see its lessons and labs.");
    pathSection.append(pathHead, pathIntro);

    if (!map.length) {
      var emptyMap = document.createElement("div");
      emptyMap.className = "empty-state";
      emptyMap.textContent = i18n("course_no_map", "No curriculum mapping has been maintained for this course yet.");
      pathSection.appendChild(emptyMap);
    } else {
      var unitList = document.createElement("div");
      unitList.className = "course-path__units";
      var nextUnitIndex = map.findIndex(function (subcourse) {
        var unitStats = subcourseProgress(subcourse);
        return unitStats.completedLessons < unitStats.lessonCount;
      });
      map.forEach(function (subcourse, subcourseIndex) {
        unitList.appendChild(unitBlock(subcourse, course.id, subcourseIndex, subcourseIndex === nextUnitIndex));
      });
      pathSection.appendChild(unitList);
    }

    var children = [intro, facts, pathSection, overview];
    var sessions = sessionSection(course);
    if (sessions) children.push(sessions);
    var learningContract = learningContractSection(course);
    if (learningContract) children.push(learningContract);

    replaceChildren(root, children);
    var hashedUnit = /^#course-unit-\d+$/.test(window.location.hash)
      ? root.querySelector(window.location.hash) : null;
    if (hashedUnit && hashedUnit.classList.contains("unit-block")) hashedUnit.open = true;
    mountJourney(course.id);
    refreshIcons();
  }

  // The journey card is driven by the shared state engine. Course content and
  // lesson progress remain owned by this page; mounting here only exposes the
  // next recommended step and never changes competency or completion state.
  function mountJourney(courseId) {
    if (!journeyRoot || !window.LrnJourneyUI || typeof window.LrnJourneyUI.mount !== "function") return;
    window.LrnJourneyUI.mount(journeyRoot, { compact: true, courseId: courseId });
  }

  function renderAcademyPath(path) {
    document.title = path.title + " · LHIND AI Learning Catalog";
    var pathSaved = persistAcademyPath(path);
    var routeCopy = academyRouteCopy(path);

    var assessment = importedAssessment();
    var stats = academyPathStats(path);
    var nextCourse = stats.courses.find(function (item) {
      var courseStats = courseProgress(item);
      return courseStats.percent < 100 && !assessmentAttainedCourse(item, assessment, courseStats);
    });
    var nextPlacement = nextCourse ? importedPlacement(nextCourse, assessment) : null;
    var hasUnfinishedCourses = stats.courses.some(function (item) { return courseProgress(item).percent < 100; });
    var noOpenAssessmentGap = !nextCourse && hasUnfinishedCourses;

    var intro = document.createElement("section");
    intro.className = "course-intro";
    intro.setAttribute("aria-labelledby", "courseTitle");

    var head = document.createElement("header");
    head.className = "course-head";

    var code = document.createElement("p");
    code.className = "course-head__code";
    code.textContent = path.academyCourse;

    var title = document.createElement("h1");
    title.id = "courseTitle";
    title.textContent = path.title;
    title.title = path.academyCourse + " · " + path.title;

    var summary = document.createElement("p");
    summary.className = "course-head__summary";
    summary.textContent = routeCopy ? routeCopy.summary : path.summary;

    var progress = document.createElement("div");
    progress.className = "course-head__progress";
    var progressLabel = document.createElement("p");
    progressLabel.className = "course-head__progress-label";
    progressLabel.textContent = i18n("academy_path_progress_heading", "Learning-path progress");
    progress.append(progressLabel, progressMeter(
      stats.percent,
      i18nFmt("academy_path_progress_label", { title: path.title }, "Progress {title}")
    ));

    var saved = document.createElement("p");
    saved.className = "course-head__saved-path";
    saved.dataset.state = pathSaved ? "saved" : "error";
    saved.append(
      lucideIcon(pathSaved ? "device-mobile" : "warning-circle"),
      document.createTextNode(pathSaved
        ? i18n("my_path_saved_locally", "Saved in this browser")
        : i18n("my_path_save_error", "This browser could not save your path"))
    );

    var nextSummary = document.createElement("div");
    nextSummary.className = "course-head__next";
    var nextLabel = document.createElement("span");
    nextLabel.textContent = nextCourse
      ? i18n("my_path_next_label", "Your next step")
      : noOpenAssessmentGap
        ? i18n("assessment_no_gap", "No open assessment gap")
      : i18n("my_path_complete_label", "Path complete");
    var nextTitle = document.createElement("strong");
    nextTitle.textContent = nextCourse
      ? nextCourse.title + (nextPlacement && nextPlacement.focusLevels.length
        ? " · " + localizedDepths(nextPlacement.focusLevels)
        : "")
      : noOpenAssessmentGap
        ? i18n("assessment_no_gap", "No open assessment gap")
      : i18n("my_path_complete_title", "You completed this learning path");
    nextSummary.append(nextLabel, nextTitle);

    var action = document.createElement("a");
    action.className = "primary-cta";
    if (nextCourse) {
      action.href = courseDetailHref(nextCourse.id);
      var actionLabel = document.createElement("span");
      actionLabel.textContent = i18n("my_path_open_next", "Open next course");
      action.append(actionLabel, lucideIcon("arrow-right"));
    } else if (noOpenAssessmentGap) {
      action.href = "../personal-plan.html#progress";
      action.append(lucideIcon("chart-bar"), document.createTextNode(i18n("my_path_view_capabilities", "View capability progress")));
    } else {
      action.href = "#";
      action.setAttribute("aria-disabled", "true");
      action.addEventListener("click", function (event) { event.preventDefault(); });
      action.append(lucideIcon("check-circle"), document.createTextNode(i18n("academy_path_all_complete", "Path complete")));
    }

    head.append(code, title, summary, saved, progress, nextSummary, action);

    var includes = document.createElement("aside");
    includes.className = "course-includes";
    includes.setAttribute("aria-labelledby", "courseIncludesTitle");
    var includesTitle = document.createElement("h2");
    includesTitle.id = "courseIncludesTitle";
    includesTitle.textContent = i18n("academy_path_includes_title", "This learning path includes");
    var formatBadge = document.createElement("span");
    formatBadge.className = "course-includes__format";
    formatBadge.append(lucideIcon("graduation-cap"), document.createTextNode(i18n("academy_path_format_badge", "Academy learning path")));
    var includesList = document.createElement("ul");
    includesList.className = "course-includes__list";
    includesList.appendChild(includesItem("presentation-chart", routeCopy ? routeCopy.format : path.format));
    (path.stages || []).forEach(function (stage) {
      var count = uniqueValues(stage.courses || []).length;
      includesList.appendChild(includesItem(
        "stack",
        localizedStage(stage.label) + " · " + courseCountLabel(count)
      ));
    });
    includes.append(includesTitle, formatBadge, includesList);
    intro.append(head, includes);

    var facts = document.createElement("section");
    facts.className = "course-facts";
    facts.setAttribute("aria-label", i18n("academy_path_facts_label", "Learning-path facts"));
    facts.append(
      factItem("presentation-chart", i18n("academy_path_fact_format", "Format"), routeCopy ? routeCopy.format : path.format),
      factItem("stairs", i18n("academy_path_fact_stages", "Stages"), String((path.stages || []).length)),
      factItem("stack", i18n("academy_path_fact_courses", "Courses"), String(stats.courses.length)),
      factItem("list-checks", i18n("academy_path_fact_activities", "Activities"), String(stats.lessonCount))
    );

    var overview = document.createElement("section");
    overview.className = "course-overview";
    var about = document.createElement("article");
    about.className = "course-overview__about";
    about.setAttribute("aria-labelledby", "courseAboutTitle");
    var aboutTitle = document.createElement("h2");
    aboutTitle.id = "courseAboutTitle";
    aboutTitle.textContent = i18n("academy_path_about_title", "About this learning path");
    about.append(
      aboutTitle,
      overviewDetail(i18n("academy_path_audience", "Audience"), routeCopy ? routeCopy.audience : path.audience),
      overviewDetail(i18n("academy_path_prerequisites", "Prerequisites"), routeCopy ? routeCopy.prerequisites : path.prerequisites)
    );
    var trackNames = (path.trackCodes || []).map(function (trackCode) {
      return trackByCode[trackCode] ? trackByCode[trackCode].label : trackCode;
    });
    if (trackNames.length) {
      about.appendChild(overviewDetail(i18n("academy_path_tracks", "Tracks"), trackNames.join(" · ")));
    }
    overview.appendChild(about);

    var journey = document.createElement("section");
    journey.className = "course-head__outcomes";
    journey.setAttribute("aria-labelledby", "courseOutcomesTitle");
    var journeyTitle = document.createElement("h2");
    journeyTitle.id = "courseOutcomesTitle";
    journeyTitle.className = "course-head__outcomes-title";
    journeyTitle.textContent = i18n("academy_path_journey_title", "Your journey");
    var journeyList = document.createElement("ol");
    journeyList.className = "academy-journey";
    journeyList.setAttribute("aria-label", i18n("my_path_route_label", "Learning path stages"));
    academyStageStats(path, assessment).forEach(function (stage) {
      var item = document.createElement("li");
      item.dataset.state = stage.state;
      if (stage.state === "current") item.setAttribute("aria-current", "step");
      var marker = document.createElement("span");
      marker.className = "academy-journey__marker";
      marker.setAttribute("aria-hidden", "true");
      marker.appendChild(lucideIcon(stage.state === "complete" ? "check" : stage.state === "current" ? "play" : "circle"));
      var stageCopy = document.createElement("span");
      stageCopy.className = "academy-journey__copy";
      var stageTitle = document.createElement("strong");
      stageTitle.textContent = localizedStage(stage.label);
      var stageFocus = document.createElement("span");
      stageFocus.textContent = stage.assessmentGapClosed
        ? i18n("assessment_no_gap", "No open assessment gap")
        : stage.focus;
      var stageMeta = document.createElement("small");
      stageMeta.textContent = i18nFmt(
        "my_path_stage_meta",
        { percent: stage.percent, completed: stage.completedCourses, total: stage.courseCount },
        "{percent}% · {completed}/{total} courses"
      );
      stageCopy.append(stageTitle, stageFocus, stageMeta);
      item.append(marker, stageCopy);
      journeyList.appendChild(item);
    });
    journey.append(journeyTitle, journeyList);
    overview.appendChild(journey);

    var recommendations = academyRecommendationsSection(path);
    var workshop = academyWorkshopSection(path);
    var offering = recommendations ? null : academyOfferingSection(path);
    var routeTitle = document.createElement("h2");
    routeTitle.className = "academy-route-title";
    routeTitle.textContent = i18n("academy_path_route_title", "Supplementary learning route in this catalog");
    var routeIntro = document.createElement("p");
    routeIntro.className = "academy-route-intro";
    routeIntro.textContent = i18n(
      "academy_path_route_intro",
      "The courses below are this catalog's supplementary learning route. They do not replace the AI Literacy recommendations or LHIND Academy live modules. Progress here records activity in this catalog."
    );
    var children = [intro];
    if (recommendations) children.push(recommendations);
    if (workshop) children.push(workshop);
    if (offering) children.push(offering);
    children.push(routeTitle, routeIntro, facts, overview);
    var syllabusTitle = document.createElement("h2");
    syllabusTitle.className = "syllabus-title";
    syllabusTitle.textContent = i18n("academy_path_courses_title", "Courses in this route");
    children.push(syllabusTitle);
    (path.stages || []).forEach(function (stage, index) {
      children.push(academyStageBlock(path, stage, index, assessment));
    });

    replaceChildren(root, children);
    mountJourney(path.academyCourse);
    refreshIcons();
  }

  function academyRouteCopy(path) {
    if (!window.SiteLang || window.SiteLang.get() !== "de") return null;
    return (window.LrnAcademyRouteDe || {})[path.academyCourse] || null;
  }

  function academySourceLink(url, label) {
    var link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
  }

  function academyRecommendationsSection(path) {
    var source = window.LrnAcademyRecommendations;
    if (!source || !Array.isArray(source.records)) return null;
    var records = source.records.filter(function (record) { return record.academy === path.academyCourse; });
    if (!records.length) return null;

    var section = document.createElement("section");
    section.className = "academy-offering academy-recommendations";
    section.setAttribute("aria-labelledby", "academyRecommendationsTitle");
    var title = document.createElement("h2");
    title.id = "academyRecommendationsTitle";
    title.textContent = i18n("academy_recommendations_title", "AI Literacy online-course recommendations");
    var note = document.createElement("p");
    note.className = "academy-offering__source";
    note.textContent = i18n("academy_recommendations_note", "Official recommendation list, August 2026. Choose the courses for your role and level; check the source for updates.");
    var sourceLink = academySourceLink(source.sourceUrl, i18n("academy_recommendations_source", "Open official recommendation list"));
    section.append(title, note, sourceLink);

    var roles = [];
    records.forEach(function (record) {
      if (roles.indexOf(record.role) === -1) roles.push(record.role);
    });
    var primaryRole = roles.reduce(function (best, role) {
      var count = records.filter(function (record) { return record.role === role; }).length;
      var bestCount = records.filter(function (record) { return record.role === best; }).length;
      return count > bestCount ? role : best;
    }, roles[0]);
    roles.forEach(function (role) {
      var roleRecords = records.filter(function (record) { return record.role === role; });
      var group = document.createElement("details");
      group.className = "academy-recommendations__role";
      if (role === primaryRole) group.open = true;
      var summary = document.createElement("summary");
      summary.textContent = role + " · " + i18nFmt(
        roleRecords.length === 1 ? "academy_recommendations_count_one" : "academy_recommendations_count",
        { count: roleRecords.length },
        roleRecords.length === 1 ? "1 online course" : "{count} online courses"
      );
      var list = document.createElement("ul");
      list.className = "academy-offering__modules";
      roleRecords.forEach(function (record) {
        var item = document.createElement("li");
        var name = academySourceLink(record.url, record.course);
        name.className = "academy-recommendations__course";
        var meta = document.createElement("span");
        meta.textContent = [record.level, record.provider, record.hours ? record.hours + " h" : ""].filter(Boolean).join(" · ");
        item.append(name, meta);
        list.appendChild(item);
      });
      group.append(summary, list);
      section.appendChild(group);
    });
    return section;
  }

  function academyWorkshopSection(path) {
    var workshops = {
      "AI-02": {
        title: "AI-02 Modul 4: AI Agentic Software Engineering - Hands-on",
        en: "Two-hour German-language live session after three online modules: approved coding tools, prompt and context engineering, code review, tests, RAG and agent workflows with guardrails.",
        de: "Zweistündige Live-Session auf Deutsch nach drei Online-Modulen: freigegebene Coding-Tools, Prompt- und Context-Engineering, Code-Review, Tests sowie RAG- und Agenten-Workflows mit Guardrails."
      },
      "AI-08": {
        title: "AI-08 Modul 2: AI für Führungskräfte, Projektleiter, Senior Consultants (AI for Leaders)",
        en: "Three-hour live session transferring online learning to leadership scenarios, organizational roles, governance, change and concrete initiatives.",
        de: "Dreistündige Live-Session für den Transfer der Online-Inhalte auf Führungsszenarien, Rollen, Governance, Change und konkrete Initiativen."
      }
    };
    var workshop = workshops[path.academyCourse];
    if (!workshop) return null;
    var section = document.createElement("section");
    section.className = "academy-offering academy-workshop";
    var title = document.createElement("h2");
    title.textContent = i18n("academy_workshop_title", "LHIND Academy live module");
    var moduleTitle = document.createElement("h3");
    moduleTitle.textContent = workshop.title;
    var description = document.createElement("p");
    description.textContent = workshop[window.SiteLang && window.SiteLang.get() === "de" ? "de" : "en"];
    var note = document.createElement("p");
    note.className = "academy-offering__source";
    note.textContent = i18n("academy_workshop_note", "Listed in the Service Portal on 24 September 2026. Check the catalog for current dates and availability.");
    section.append(title, moduleTitle, description, note, academySourceLink(
      "https://esm.lhind.app.lufthansa.com/wm/app-SelfServicePortal/search-page/6cac2957-1ae1-e511-dd9b-74d02b9d869c?structures=87a0f940-8069-f111-19b0-b1243d88a77a_178bf9cc-cffc-ee11-f2ba-00505686fb19",
      i18n("academy_workshop_link", "Open AI Literacy in the Service Portal")
    ));
    return section;
  }

  function academyOfferingSection(path) {
    var offering = (window.LrnAcademyOfferings || {})[path.academyCourse];
    if (!offering) return null;

    var section = document.createElement("section");
    section.className = "academy-offering";
    section.setAttribute("aria-labelledby", "academyOfferingTitle");

    var title = document.createElement("h2");
    title.id = "academyOfferingTitle";
    title.textContent = i18n("academy_offering_title", "Academy offering");
    var source = document.createElement("p");
    source.className = "academy-offering__source";
    source.textContent = i18nFmt(
      "academy_offering_source_note",
      { source: offering.source },
      "Local source: {source}. Check the Learning Portal for the current offer and enrollment."
    );
    var courseTitle = document.createElement("h3");
    courseTitle.textContent = offering.title;
    section.append(title, courseTitle, source);

    var modules = Array.isArray(offering.modules) ? offering.modules : [];
    if (modules.length) {
      var modulesTitle = document.createElement("h4");
      modulesTitle.textContent = i18n("academy_offering_modules", "Courses and modules in the training overview");
      var list = document.createElement("ul");
      list.className = "academy-offering__modules";
      modules.forEach(function (module) {
        var item = document.createElement("li");
        var name = document.createElement("strong");
        name.textContent = (module.id === "AI-06-2" ? "AI-06-2 · " : "") + module.title;
        var meta = document.createElement("span");
        meta.textContent = [module.provider, module.duration,
          module.optional ? i18n("academy_offering_optional", "Optional") : ""
        ].filter(Boolean).join(" · ");
        item.append(name, meta);
        list.appendChild(item);
      });
      section.append(modulesTitle, list);
    } else {
      if (offering.overview) {
        var lang = window.SiteLang ? window.SiteLang.get() : "en";
        var overview = document.createElement("p");
        overview.className = "academy-offering__overview";
        overview.textContent = offering.overview[lang] || offering.overview.en;
        section.appendChild(overview);
      }
      var missing = document.createElement("p");
      missing.className = "academy-offering__missing";
      missing.textContent = i18n(
        "academy_offering_no_modules",
        "The local sources do not establish a reliable module list for this course. Check the Learning Portal for the current modules."
      );
      section.appendChild(missing);
    }
    return section;
  }

  function persistAcademyPath(path) {
    if (!progressApi || !progressApi.saveLearningPath || !progressApi.getLearningPath || !path) return false;
    var profileId = "";
    var targetLevel = "Acquire";
    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (saved && saved.profileId) profileId = saved.profileId;
      if (saved && saved.externalLevel) {
        targetLevel = ({ 1: "Acquire", 2: "Deepen", 3: "Create" })[Number(saved.externalLevel)] || "Acquire";
      }
    } catch (error) {
      profileId = "";
    }
    progressApi.saveLearningPath({
      academyCourse: path.academyCourse,
      profileId: profileId,
      targetLevel: targetLevel,
      source: "deep-link"
    });
    var confirmed = progressApi.getLearningPath();
    return Boolean(confirmed && confirmed.academyCourse === path.academyCourse);
  }

  function academyStageStats(path, assessment) {
    var firstOpen = -1;
    var routeCopy = academyRouteCopy(path);
    var stages = (path.stages || []).map(function (stage, index) {
      var courses = uniqueValues(stage.courses || []).map(function (id) { return courseById[id]; }).filter(Boolean);
      var courseStats = courses.map(courseProgress);
      var completedCourses = courseStats.filter(function (entry) { return entry.percent === 100; }).length;
      var percent = courseStats.length
        ? Math.round(courseStats.reduce(function (sum, entry) { return sum + entry.percent; }, 0) / courseStats.length)
        : 0;
      var assessmentGapClosed = courses.length > 0 && courseStats.some(function (entry) { return entry.percent < 100; }) &&
        courses.every(function (courseItem, courseIndex) {
          return courseStats[courseIndex].percent === 100 || assessmentAttainedCourse(courseItem, assessment, courseStats[courseIndex]);
        });
      if (firstOpen === -1 && percent < 100 && !assessmentGapClosed) firstOpen = index;
      return {
        label: stage.label,
        focus: routeCopy && routeCopy.stages[index] ? routeCopy.stages[index] : stage.focus,
        percent: percent,
        completedCourses: completedCourses,
        courseCount: courses.length,
        assessmentGapClosed: assessmentGapClosed,
        state: "upcoming"
      };
    });
    stages.forEach(function (stage, index) {
      stage.state = stage.percent === 100 ? "complete" : stage.assessmentGapClosed ? "assessment" : index === firstOpen ? "current" : "upcoming";
    });
    return stages;
  }

  function academyStageBlock(path, stage, index, assessment) {
    var courses = uniqueValues(stage.courses || []).map(function (id) { return courseById[id]; }).filter(Boolean);
    var lessonPathsForStage = uniqueValues(courses.reduce(function (all, item) {
      return all.concat(lessonPaths(item.id));
    }, []));
    var completedCourses = courses.filter(function (item) { return courseProgress(item).percent === 100; }).length;

    var block = document.createElement("section");
    block.className = "unit-block";
    var head = document.createElement("div");
    head.className = "unit-block__head";
    var icon = lucideIcon(["flag", "path", "rocket-launch"][index] || "graduation-cap");
    icon.classList.add("unit-block__icon");
    var code = document.createElement("span");
    code.className = "unit-block__code";
    code.textContent = "S" + String(index + 1).padStart(2, "0");
    var title = document.createElement("h3");
    title.textContent = localizedStage(stage.label);
    var meta = document.createElement("span");
    meta.className = "unit-block__meta";
    meta.textContent = i18nFmt(
      "academy_path_stage_progress",
      { completed: completedCourses, total: courses.length },
      "{completed} of {total} courses completed"
    );
    head.append(icon, code, title, meta);
    block.appendChild(head);
    var meter = progressMeter(
      averageReadPercent(lessonPathsForStage),
      i18nFmt("academy_path_progress_label", { title: stage.label }, "Progress {title}")
    );
    meter.classList.add("unit-block__meter");
    block.appendChild(meter);
    if (stage.focus) {
      var note = document.createElement("p");
      note.className = "unit-block__note";
      var routeCopy = academyRouteCopy(path);
      note.textContent = routeCopy && routeCopy.stages[index] ? routeCopy.stages[index] : stage.focus;
      block.appendChild(note);
    }
    if (courses.length && courses.every(function (item) { return courseProgress(item).percent === 100 || assessmentAttainedCourse(item, assessment); })) {
      var assessmentNote = document.createElement("p");
      assessmentNote.className = "unit-block__note";
      assessmentNote.dataset.state = "assessment";
      assessmentNote.textContent = i18n("assessment_no_gap", "No open assessment gap");
      block.appendChild(assessmentNote);
    }
    var list = document.createElement("div");
    list.className = "activity-list";
    courses.forEach(function (item) { list.appendChild(academyCourseLink(item, assessment)); });
    block.appendChild(list);
    return block;
  }

  function academyCourseLink(courseItem, assessment) {
    var stats = courseProgress(courseItem);
    var state = stats.percent === 100 ? "completed" : stats.visitedLessons > 0 ? "visited" : "open";
    var assessmentAttained = state === "open" && assessmentAttainedCourse(courseItem, assessment, stats);
    var link = document.createElement("a");
    link.className = "interactive-surface activity-link academy-course-link";
    link.href = courseDetailHref(courseItem.id);
    link.title = courseItem.id + " · " + courseItem.title;
    var dot = document.createElement("span");
    dot.className = "activity-link__dot";
    dot.dataset.state = assessmentAttained ? "assessment" : state;
    dot.setAttribute("aria-hidden", "true");
    dot.appendChild(lucideIcon(state === "completed" ? "check-circle" : state === "visited" ? "dot" : "circle"));
    var icon = lucideIcon(courseFormat(courseItem).icon);
    icon.classList.add("activity-link__type-icon");
    var label = document.createElement("strong");
    label.textContent = courseItem.title;
    var type = document.createElement("small");
    type.textContent = courseItem.id + " · " + activityCountLabel(stats.lessonCount);
    link.append(dot, icon, label, type);
    if (assessmentAttained) {
      var assessmentStatus = document.createElement("em");
      assessmentStatus.dataset.state = "assessment";
      assessmentStatus.textContent = i18n("assessment_no_gap", "No open assessment gap");
      link.appendChild(assessmentStatus);
    } else if (state !== "open") {
      var status = document.createElement("em");
      status.dataset.state = state;
      status.textContent = i18nFmt("academy_path_course_progress", { percent: stats.percent }, "{percent}% complete");
      link.appendChild(status);
    }
    return link;
  }

  function academyPathStats(path) {
    var courseIds = uniqueValues((path.stages || []).reduce(function (all, stage) {
      return all.concat(stage.courses || []);
    }, []));
    var courses = courseIds.map(function (id) { return courseById[id]; }).filter(Boolean);
    var paths = uniqueValues(courses.reduce(function (all, item) { return all.concat(lessonPaths(item.id)); }, []));
    return {
      courses: courses,
      lessonCount: paths.length,
      visitedLessons: paths.filter(function (lessonPath) { return lessonProgress(lessonPath).state !== "open"; }).length,
      percent: averageReadPercent(paths)
    };
  }

  function localizedStage(label) {
    return i18n("lrn_depth_" + String(label).toLowerCase(), label);
  }

  function courseCountLabel(count) {
    return count === 1
      ? i18n("academy_path_courses_one", "1 course")
      : i18nFmt("academy_path_courses_many", { count: count }, "{count} courses");
  }

  function activityCountLabel(count) {
    return count === 1
      ? i18n("course_activities_one", "1 activity")
      : i18nFmt("course_activities_many", { count: count }, "{count} activities");
  }

  function courseDetailHref(courseId) {
    return "course.html?id=" + encodeURIComponent(courseId);
  }

  function uniqueValues(values) {
    var seen = {};
    return values.filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function courseFormat(courseItem) {
    if (window.LrnCourseFormats && window.LrnCourseFormats.resolve) {
      return window.LrnCourseFormats.resolve(courseItem);
    }
    return { id: "toolkit", icon: "wrench", labelKey: "course_format_toolkit", label: "Toolkit" };
  }

  // Course dates come from catalog.json (window.LrnData.sessions). Do not show
  // a schedule section until there is an actionable upcoming date.
  function sessionSection(courseItem) {
    if (!window.LrnSchedule) return null;
    var open = window.LrnSchedule.upcoming(courseItem.id);
    if (!open.length) return null;
    var locale = (window.SiteLang ? window.SiteLang.get() : "en") === "de" ? "de-DE" : "en-GB";

    var section = document.createElement("section");
    section.className = "course-sessions";
    section.setAttribute("aria-labelledby", "courseSessionsTitle");

    var title = document.createElement("h2");
    title.id = "courseSessionsTitle";
    title.className = "course-sessions__title";
    title.textContent = i18n("course_sessions_title", "Upcoming dates");
    section.appendChild(title);

    var list = document.createElement("ul");
    list.className = "course-sessions__list";
    open.slice(0, 3).forEach(function (session) {
      list.appendChild(sessionCard(session, locale));
    });
    section.appendChild(list);

    if (open.length > 3) {
      var more = document.createElement("p");
      more.className = "course-sessions__more";
      more.textContent = i18nFmt("course_sessions_more", { count: open.length - 3 }, "{count} further dates");
      section.appendChild(more);
    }
    return section;
  }

  function sessionCard(session, locale) {
    var item = document.createElement("li");
    item.className = "course-session";
    item.dataset.status = session.status || "planned";

    var when = document.createElement("p");
    when.className = "course-session__when";
    when.append(lucideIcon("calendar-dots"), document.createTextNode(window.LrnSchedule.formatRange(session, locale)));

    var meta = document.createElement("p");
    meta.className = "course-session__meta";
    var parts = [];
    if (session.language) parts.push(i18n("course_lang_" + session.language, String(session.language).toUpperCase()));
    if (session.delivery) parts.push(i18n("course_delivery_" + session.delivery, session.delivery));
    if (session.location) parts.push(session.location);
    meta.textContent = parts.join(" · ");

    var people = document.createElement("p");
    people.className = "course-session__trainers";
    var names = window.LrnSchedule.trainerNames(session);
    people.append(
      lucideIcon("user"),
      document.createTextNode(names.length ? names.join(", ") : i18n("course_session_trainer_open", "Trainer to be confirmed"))
    );

    var foot = document.createElement("p");
    foot.className = "course-session__foot";
    var free = window.LrnSchedule.seatsFree(session);
    var seatLabel = document.createElement("span");
    seatLabel.className = "course-session__seats";
    if (session.status === "full" || free === 0) {
      seatLabel.textContent = i18n("course_session_seats_full", "Fully booked");
    } else if (free == null) {
      seatLabel.textContent = i18n("course_session_seats_open", "Seats on request");
    } else {
      seatLabel.textContent = i18nFmt("course_session_seats_free", { count: free }, "{count} seats free");
    }
    foot.appendChild(seatLabel);

    if (session.registrationUrl) {
      var register = document.createElement("a");
      register.className = "course-session__register";
      register.href = session.registrationUrl;
      register.rel = "noopener";
      register.target = "_blank";
      register.append(document.createTextNode(i18n("course_session_register", "Register")), lucideIcon("arrow-up-right"));
      foot.appendChild(register);
    }

    item.append(when, meta, people, foot);
    if (session.note) {
      var note = document.createElement("p");
      note.className = "course-session__note";
      note.textContent = session.note;
      item.appendChild(note);
    }
    return item;
  }

  function includesItem(iconName, text) {
    var item = document.createElement("li");
    item.className = "course-includes__item";
    item.append(lucideIcon(iconName), document.createTextNode(text));
    return item;
  }

  function factItem(iconName, label, value) {
    var item = document.createElement("div");
    item.className = "course-fact";

    var icon = lucideIcon(iconName);
    icon.classList.add("course-fact__icon");

    var copy = document.createElement("div");
    var factLabel = document.createElement("span");
    factLabel.className = "course-fact__label";
    factLabel.textContent = label;
    var factValue = document.createElement("strong");
    factValue.className = "course-fact__value";
    factValue.textContent = value || i18n("course_fact_not_specified", "Not specified");
    copy.append(factLabel, factValue);

    item.append(icon, copy);
    return item;
  }

  function overviewDetail(label, value) {
    var detail = document.createElement("p");
    detail.className = "course-overview__detail";
    var strong = document.createElement("strong");
    strong.textContent = label + ":";
    detail.append(strong, document.createTextNode(" " + value));
    return detail;
  }

  function learningContractSection(courseItem) {
    if (!courseItem) return null;
    var localizedContracts = (window.LrnCourseContracts || {})[courseItem.id] || {};
    var lang = window.SiteLang ? window.SiteLang.get() : "en";
    var contract = localizedContracts[lang] || localizedContracts.en || courseItem.learningContract;
    if (!contract || !contract.promise) return null;

    var section = document.createElement("section");
    section.className = "learning-contract";
    section.dataset.contract = "authored";
    section.setAttribute("aria-labelledby", "learningContractTitle");

    var header = document.createElement("header");
    header.className = "learning-contract__header";

    var title = document.createElement("h2");
    title.id = "learningContractTitle";
    title.textContent = contract.headline || i18n("course_learning_contract_title", "Apply the course content");

    var note = document.createElement("p");
    note.className = "learning-contract__note";
    note.textContent = i18n("course_learning_contract_note", "Suggested by this catalog; this is not a Learning Portal completion requirement.");

    var promise = document.createElement("p");
    promise.className = "learning-contract__promise";
    promise.textContent = contract.promise;
    header.append(title, note, promise);

    var body = document.createElement("div");
    body.className = "learning-contract__body";

    if (contract.projectScenario && contract.projectScenario.title) {
      var scenario = document.createElement("article");
      scenario.className = "learning-contract__scenario";

      var scenarioLabel = document.createElement("p");
      scenarioLabel.className = "learning-contract__section-label";
      scenarioLabel.append(
        lucideIcon("briefcase"),
        document.createTextNode(i18n("course_project_scenario_title", "Practice scenario"))
      );

      var scenarioTitle = document.createElement("h3");
      scenarioTitle.textContent = contract.projectScenario.title;

      var scenarioDescription = document.createElement("p");
      scenarioDescription.textContent = contract.projectScenario.description || "";
      scenario.append(scenarioLabel, scenarioTitle, scenarioDescription);

      if (contract.projectScenario.guardrail) {
        var guardrail = document.createElement("p");
        guardrail.className = "learning-contract__guardrail";
        guardrail.append(
          lucideIcon("shield-check"),
          document.createTextNode(contract.projectScenario.guardrail)
        );
        scenario.appendChild(guardrail);
      }
      body.appendChild(scenario);
    }

    var stages = Array.isArray(contract.stages) ? contract.stages : [];
    if (stages.length) {
      var method = document.createElement("div");
      method.className = "learning-contract__method";

      var methodTitle = document.createElement("h3");
      methodTitle.textContent = i18n("course_learning_method_title", "Suggested steps");

      var stageList = document.createElement("ol");
      stageList.className = "learning-contract__stages";
      stages.forEach(function (stage, index) {
        var item = document.createElement("li");
        item.dataset.kind = stage.kind || "guided";

        var marker = document.createElement("span");
        marker.className = "learning-contract__stage-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = String(index + 1).padStart(2, "0");

        var copy = document.createElement("div");
        var stageTitle = document.createElement("strong");
        stageTitle.textContent = stage.title;
        var stageDescription = document.createElement("p");
        stageDescription.textContent = stage.description;
        copy.append(stageTitle, stageDescription);
        item.append(marker, copy);
        stageList.appendChild(item);
      });
      method.append(methodTitle, stageList);
      body.appendChild(method);
    }

    var evidenceItems = Array.isArray(contract.evidence) ? contract.evidence : [];
    if (evidenceItems.length) {
      var evidence = document.createElement("div");
      evidence.className = "learning-contract__evidence";

      var evidenceTitle = document.createElement("h3");
      evidenceTitle.append(
        lucideIcon("seal-check"),
        document.createTextNode(i18n("course_completion_evidence_title", "Possible work samples"))
      );

      var evidenceList = document.createElement("ul");
      evidenceItems.forEach(function (text) {
        var item = document.createElement("li");
        item.append(lucideIcon("check"), document.createTextNode(text));
        evidenceList.appendChild(item);
      });
      evidence.append(evidenceTitle, evidenceList);
      section.append(header, body, evidence);
    } else {
      section.append(header, body);
    }

    return section;
  }

  function localizedDepths(levels) {
    var values = Array.isArray(levels) ? levels : [];
    return values.map(function (level) {
      var key = "lrn_depth_" + String(level).toLowerCase();
      return i18n(key, level);
    }).join(" · ");
  }

  function courseFocus(course) {
    var interestById = indexBy(data.interests || [], "id");
    var ids = Array.isArray(course.interests) ? course.interests : [];
    return ids.map(function (id) {
      return i18n("topic_" + id, interestById[id] ? interestById[id].label : id);
    }).join(" · ");
  }

  // Phosphor Light icon for a syllabus unit, picked from the unit title.
  // These remain topic icons because they describe units; course-level icons
  // deliberately describe the learning format via course-formats.js.
  var UNIT_ICON_RULES = [
    [/security|injection/, "shield-warning"],
    [/responsible|trustworthy|gdpr|ethics|legal|compliance|risk|governance/, "shield-check"],
    [/prompt/, "chats"],
    [/copilot|code|agentic/, "code"],
    [/test|qa|quality|verification/, "test-tube"],
    [/architecture|systems|infrastructure/, "tree-structure"],
    [/rag|knowledge|retrieval|vector/, "database"],
    [/doc|content|writing/, "file-text"],
    [/requirement|backlog|specification/, "clipboard-text"],
    [/use case|spotting|discovery|research|interview/, "magnifying-glass"],
    [/cost|value|economics|finance|budget|benefit/, "coins"],
    [/workforce|hr|people|recruit/, "users"],
    [/change|transformation|stakeholder|adoption/, "arrows-clockwise"],
    [/project|reporting|steering|portfolio|roadmap|sponsor/, "squares-four"],
    [/data|analytics|metric/, "chart-bar"],
    [/green|sustainable|carbon/, "leaf"],
    [/vendor|procurement|ecosystem|partner/, "handshake"],
    [/operations|incident|service desk|support/, "wrench"],
    [/sales|consulting|pitch/, "briefcase"],
    [/communication|marketing|brand/, "megaphone"],
    [/meeting|facilitation|workshop/, "presentation-chart"],
    [/automation|process optimization/, "flow-arrow"],
    [/customer|service/, "headphones"],
    [/leader|decision|executive|strategy/, "compass"],
    [/training|learning|onboard|teach/, "graduation-cap"],
    [/prompt.*engineer|engineer.*prompt/, "function"]
  ];

  function unitIcon(subcourse) {
    var title = String((subcourse && subcourse.title) || "").toLowerCase();
    var rules = UNIT_ICON_RULES || [];
    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i][0].test(title)) return rules[i][1];
    }
    return "book-open";
  }

  // Phosphor Light icon for a single activity (lesson). Activity titles are
  // short and concrete — keyed on the lesson type when we can detect it,
  // else on content keywords. Falls back to the unit's icon when no signal.
  var ACTIVITY_ICON_RULES = [
    [/knowledge check|quiz|test|exam|assessment|verify|guardrail|risk/, "question"],
    [/practice|exercise|lab|workshop|project|capstone|pilot|case study/, "pencil-line"],
    [/demo|walkthrough|preview|tour/, "play"],
    [/recap|summary|wrap|takeaway|key point/, "list-checks"],
    [/introduction|overview|intro|primer|getting started/, "book-open"],
    [/concept|theory|principle|deep dive|fundamentals/, "book-open"],
    [/hand.?on|hands-on|build|implement|code|script/, "code"],
    [/setup|install|configure|environment|prereq/, "wrench"],
    [/example|scenario|sample|illustration/, "lightbulb"],
    [/tip|best practice|do and don|do's/, "lightbulb"]
  ];

  function activityIcon(lesson, subcourse) {
    if (lesson && lesson.activityType === "lab") return "code";
    if (lesson && lesson.activityType === "lesson") return "book-open";
    var title = String((lesson && lesson.title) || "").toLowerCase();
    var rules = ACTIVITY_ICON_RULES || [];
    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i][0].test(title)) return rules[i][1];
    }
    if (subcourse) return unitIcon(subcourse);
    return "circle";
  }

  function unitBlock(subcourse, courseId, subcourseIndex, isCurrent) {
    var stats = subcourseProgress(subcourse);
    var block = document.createElement("details");
    block.className = "unit-block";
    block.id = "course-unit-" + String(subcourseIndex + 1);
    block.open = isCurrent;
    block.dataset.state = stats.lessonCount > 0 && stats.completedLessons >= stats.lessonCount
      ? "complete" : isCurrent ? "current" : "upcoming";

    var summary = document.createElement("summary");
    summary.className = "unit-block__summary";

    var code = document.createElement("span");
    code.className = "unit-block__code";
    code.textContent = unitCode(subcourseIndex);

    var title = document.createElement("strong");
    title.className = "unit-block__title";
    title.setAttribute("role", "heading");
    title.setAttribute("aria-level", "3");
    title.textContent = subcourse.title;

    var meta = document.createElement("span");
    meta.className = "unit-block__meta";
    meta.textContent = i18nFmt("course_unit_progress", { completed: stats.completedLessons, total: stats.lessonCount }, "{completed} of {total} completed");

    var state = document.createElement("span");
    state.className = "unit-block__state";
    state.textContent = block.dataset.state === "complete"
      ? i18n("course_unit_complete", "Complete")
      : isCurrent ? i18n("course_unit_next", "Next up") : "";

    var chevron = lucideIcon("caret-down");
    chevron.classList.add("unit-block__chevron");
    summary.append(code, title, meta, state, chevron);
    block.appendChild(summary);

    var body = document.createElement("div");
    body.className = "unit-block__body";

    var meter = progressMeter(
      stats.percent,
      i18nFmt("course_progress_label", { title: subcourse.title }, "Progress {title}")
    );
    meter.classList.add("unit-block__meter");
    body.appendChild(meter);

    if (subcourse.note) {
      var note = document.createElement("p");
      note.className = "unit-block__note";
      note.textContent = subcourse.note;
      body.appendChild(note);
    }

    var list = document.createElement("div");
    list.className = "activity-list";
    var lessons = Array.isArray(subcourse.lessons) ? subcourse.lessons : [];
    lessons.forEach(function (lesson) {
      list.appendChild(activityLink(lesson, courseId, subcourse));
    });
    body.appendChild(list);
    block.appendChild(body);

    return block;
  }

  function activityLink(lesson, courseId, subcourse) {
    var progress = lessonProgress(lesson.path);
    var a = document.createElement("a");
    a.className = "interactive-surface activity-link";
    a.href = lessonHref(lesson.path, courseId);
    a.title = lesson.path;

    var dot = document.createElement("span");
    dot.className = "activity-link__dot";
    dot.dataset.state = progress.state;
    dot.setAttribute("aria-hidden", "true");
    dot.appendChild(lucideIcon(
      progress.state === "completed" ? "check-circle" :
      progress.state === "visited" ? "dot" : "circle"
    ));

    var icon = lucideIcon(activityIcon(lesson, subcourse));
    icon.classList.add("activity-link__type-icon");

    var label = document.createElement("strong");
    label.textContent = lesson.title;

    var type = document.createElement("small");
    type.textContent = activityType(lesson, subcourse);

    a.append(dot, icon, label, type);

    // "Open" on every untouched row is noise, so only call out actual progress.
    if (progress.state !== "open") {
      var status = document.createElement("em");
      status.textContent = progress.state === "completed"
        ? i18n("course_activity_completed", "completed")
        : i18n("course_activity_started", "started");
      status.dataset.state = progress.state;
      a.appendChild(status);
    }

    return a;
  }

  function activityType(lesson, subcourse) {
    if (lesson.activityType === "lab") return i18n("course_activity_type_lab", "Lab");
    if (lesson.activityType === "lesson") return i18n("course_activity_type_lesson", "Lesson");
    var title = (lesson.title || "").toLowerCase();
    var unit = (subcourse && subcourse.title || "").toLowerCase();
    // "Eval" stays untranslated — established jargon used identically in
    // German AI-consulting usage (see glossary.html's "Eval Harness" entry).
    if (/eval|test|qa|verification|review|guardrail|compliance|risk|assessment/.test(title + " " + unit)) return "Eval";
    if (/project|pilot|capstone|case|use case|strategy|workflow|builder|registry|canvas/.test(title + " " + unit)) return i18n("course_activity_type_lab", "Lab");
    return "";
  }

  function nextLessonForCourse(courseId) {
    var lessons = [];
    courseMap(courseId).forEach(function (subcourse) {
      subcourse.lessons.forEach(function (lesson) {
        lessons.push(lesson);
      });
    });
    if (!lessons.length) return null;
    return lessons.find(function (lesson) {
      return lessonProgress(lesson.path).state !== "completed";
    }) || lessons[0];
  }

  function progressMeter(percent, label) {
    var wrap = document.createElement("div");
    wrap.className = "progress-meter";
    wrap.setAttribute("role", "progressbar");
    wrap.setAttribute("aria-label", label);
    wrap.setAttribute("aria-valuemin", "0");
    wrap.setAttribute("aria-valuemax", "100");
    wrap.setAttribute("aria-valuenow", String(percent));
    var bar = document.createElement("span");
    bar.style.width = percent + "%";
    var text = document.createElement("strong");
    text.textContent = percent + "%";
    wrap.append(bar, text);
    return wrap;
  }

  function courseProgress(course) {
    var paths = lessonPaths(course.id);
    var completed = paths.filter(function (path) {
      return lessonProgress(path).state === "completed";
    }).length;
    var visited = paths.filter(function (path) {
      return lessonProgress(path).state !== "open";
    }).length;
    return {
      subcourseCount: courseMap(course.id).length,
      lessonCount: paths.length,
      completedLessons: completed,
      visitedLessons: visited,
      percent: averageReadPercent(paths)
    };
  }

  function subcourseProgress(subcourse) {
    var paths = subcourse.lessons.map(function (lesson) { return lesson.path; });
    var completed = paths.filter(function (path) {
      return lessonProgress(path).state === "completed";
    }).length;
    var visited = paths.filter(function (path) {
      return lessonProgress(path).state !== "open";
    }).length;
    return {
      lessonCount: paths.length,
      completedLessons: completed,
      visitedLessons: visited,
      percent: averageReadPercent(paths)
    };
  }

  // Average reading fraction across the given lessons, as a 0..100 percent.
  // A half-read lesson contributes 0.5 and a completed one 1, so unit and
  // course bars move with reading depth, not only on "complete".
  function averageReadPercent(paths) {
    if (!paths.length) return 0;
    var sum = paths.reduce(function (acc, path) {
      if (progressApi && progressApi.getReadFraction) return acc + progressApi.getReadFraction(path);
      return acc + (lessonProgress(path).state === "completed" ? 1 : 0);
    }, 0);
    return Math.round((sum / paths.length) * 100);
  }

  function lessonProgress(path) {
    if (!progressApi || !progressApi.getLessonProgress) {
      return { state: "open", label: "open" };
    }
    var progress = progressApi.getLessonProgress(path);
    if (progress && progress.completedAt) return { state: "completed", label: "completed" };
    if (progress && progress.visitedAt) return { state: "visited", label: "started" };
    return { state: "open", label: "open" };
  }

  function lessonPaths(courseId) {
    var unique = {};
    courseMap(courseId).forEach(function (subcourse) {
      subcourse.lessons.forEach(function (lesson) {
        unique[lesson.path] = true;
      });
    });
    return Object.keys(unique);
  }

  function courseMap(courseId) {
    return curriculum.courseMaps && curriculum.courseMaps[courseId] ? curriculum.courseMaps[courseId] : [];
  }

  function unitCode(index) {
    return "U" + String(index + 1).padStart(2, "0");
  }

  function lessonHref(path, courseId) {
    var query = "path=" + encodeURIComponent(path);
    if (courseId) query += "&course=" + encodeURIComponent(courseId);
    return "../lesson.html?" + query;
  }

  function indexBy(items, key) {
    return items.reduce(function (out, item) {
      out[item[key]] = item;
      return out;
    }, {});
  }

  function replaceChildren(parent, children) {
    parent.textContent = "";
    children.forEach(function (child) {
      parent.appendChild(child);
    });
  }

  function lucideIcon(name) {
    var i = document.createElement("i");
    i.className = "ph-light ph-" + name;
    i.setAttribute("aria-hidden", "true");
    return i;
  }

  // Phosphor is self-rendering (web font), so this is a no-op kept for
  // API parity with the previous Lucide-based call sites.
  function refreshIcons() {}
})();
