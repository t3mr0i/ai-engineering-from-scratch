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

    var children = [intro, facts, overview];

    var sessions = sessionSection(course);
    if (sessions) children.push(sessions);

    if (map.length && window.LearningVisuals) {
      var routeHost = document.createElement("div");
      routeHost.className = "learning-visual-slot";
      var currentAssigned = false;
      window.LearningVisuals.renderCourseRoute(routeHost, map.map(function (subcourse, index) {
        var unitStats = subcourseProgress(subcourse);
        var state = unitStats.percent >= 100 ? "complete" : "open";
        if (state === "open" && !currentAssigned) {
          state = "current";
          currentAssigned = true;
        }
        return {
          code: unitCode(index),
          title: subcourse.title,
          count: unitStats.lessonCount,
          percent: unitStats.percent,
          state: state,
          href: "#course-unit-" + String(index + 1)
        };
      }), {
        title: i18n("viz_course_title", "Course route"),
        description: i18n("viz_course_desc", "Move through the units in order; progress reflects your reading depth.")
      });
      children.push(routeHost);
    }

    var syllabusTitle = document.createElement("h2");
    syllabusTitle.className = "syllabus-title";
    syllabusTitle.textContent = i18n("course_tasks_title", "Tasks");
    children.push(syllabusTitle);

    if (!map.length) {
      var emptyMap = document.createElement("div");
      emptyMap.className = "empty-state";
      emptyMap.textContent = i18n("course_no_map", "No curriculum mapping has been maintained for this course yet.");
      children.push(emptyMap);
    } else {
      map.forEach(function (subcourse, subcourseIndex) {
        children.push(unitBlock(subcourse, course.id, subcourseIndex));
      });
    }

    replaceChildren(root, children);
    refreshIcons();
  }

  function renderAcademyPath(path) {
    document.title = path.title + " · LHIND AI Learning Catalog";
    var pathSaved = persistAcademyPath(path);

    var stats = academyPathStats(path);
    var nextCourse = stats.courses.find(function (item) {
      return courseProgress(item).percent < 100;
    });

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
    summary.textContent = path.summary;

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
      : i18n("my_path_complete_label", "Path complete");
    var nextTitle = document.createElement("strong");
    nextTitle.textContent = nextCourse
      ? nextCourse.title
      : i18n("my_path_complete_title", "You completed this learning path");
    nextSummary.append(nextLabel, nextTitle);

    var action = document.createElement("a");
    action.className = "primary-cta";
    if (nextCourse) {
      action.href = courseDetailHref(nextCourse.id);
      var actionLabel = document.createElement("span");
      actionLabel.textContent = i18n("my_path_open_next", "Open next course");
      action.append(actionLabel, lucideIcon("arrow-right"));
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
    includesList.appendChild(includesItem("presentation-chart", path.format));
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
      factItem("presentation-chart", i18n("academy_path_fact_format", "Format"), path.format),
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
      overviewDetail(i18n("academy_path_audience", "Audience"), path.audience),
      overviewDetail(i18n("academy_path_prerequisites", "Prerequisites"), path.prerequisites)
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
    academyStageStats(path).forEach(function (stage) {
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
      stageFocus.textContent = stage.focus;
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

    var children = [intro, facts, overview];
    var syllabusTitle = document.createElement("h2");
    syllabusTitle.className = "syllabus-title";
    syllabusTitle.textContent = i18n("academy_path_courses_title", "Supporting courses");
    children.push(syllabusTitle);
    (path.stages || []).forEach(function (stage, index) {
      children.push(academyStageBlock(stage, index));
    });

    replaceChildren(root, children);
    refreshIcons();
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

  function academyStageStats(path) {
    var firstOpen = -1;
    var stages = (path.stages || []).map(function (stage, index) {
      var courses = uniqueValues(stage.courses || []).map(function (id) { return courseById[id]; }).filter(Boolean);
      var courseStats = courses.map(courseProgress);
      var completedCourses = courseStats.filter(function (entry) { return entry.percent === 100; }).length;
      var percent = courseStats.length
        ? Math.round(courseStats.reduce(function (sum, entry) { return sum + entry.percent; }, 0) / courseStats.length)
        : 0;
      if (firstOpen === -1 && percent < 100) firstOpen = index;
      return {
        label: stage.label,
        focus: stage.focus,
        percent: percent,
        completedCourses: completedCourses,
        courseCount: courses.length,
        state: "upcoming"
      };
    });
    stages.forEach(function (stage, index) {
      stage.state = stage.percent === 100 ? "complete" : index === firstOpen ? "current" : "upcoming";
    });
    return stages;
  }

  function academyStageBlock(stage, index) {
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
      note.textContent = stage.focus;
      block.appendChild(note);
    }
    var list = document.createElement("div");
    list.className = "activity-list";
    courses.forEach(function (item) { list.appendChild(academyCourseLink(item)); });
    block.appendChild(list);
    return block;
  }

  function academyCourseLink(courseItem) {
    var stats = courseProgress(courseItem);
    var state = stats.percent === 100 ? "completed" : stats.visitedLessons > 0 ? "visited" : "open";
    var link = document.createElement("a");
    link.className = "interactive-surface activity-link academy-course-link";
    link.href = courseDetailHref(courseItem.id);
    link.title = courseItem.id + " · " + courseItem.title;
    var dot = document.createElement("span");
    dot.className = "activity-link__dot";
    dot.dataset.state = state;
    dot.setAttribute("aria-hidden", "true");
    dot.appendChild(lucideIcon(state === "completed" ? "check-circle" : state === "visited" ? "dot" : "circle"));
    var icon = lucideIcon(courseFormat(courseItem).icon);
    icon.classList.add("activity-link__type-icon");
    var label = document.createElement("strong");
    label.textContent = courseItem.title;
    var type = document.createElement("small");
    type.textContent = courseItem.id + " · " + activityCountLabel(stats.lessonCount);
    link.append(dot, icon, label, type);
    if (state !== "open") {
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

  // Kurstermine aus catalog.json (window.LrnData.sessions). Die Sektion bleibt
  // ganz weg, solange für den Kurs nie ein Termin gepflegt wurde — ein leerer
  // Kasten auf jeder Kursseite wäre nur Rauschen.
  function sessionSection(courseItem) {
    if (!window.LrnSchedule) return null;
    var all = window.LrnSchedule.sessions(courseItem.id);
    if (!all.length) return null;
    var open = window.LrnSchedule.upcoming(courseItem.id);
    var locale = (window.SiteLang ? window.SiteLang.get() : "en") === "de" ? "de-DE" : "en-GB";

    var section = document.createElement("section");
    section.className = "course-sessions";
    section.setAttribute("aria-labelledby", "courseSessionsTitle");

    var title = document.createElement("h2");
    title.id = "courseSessionsTitle";
    title.className = "course-sessions__title";
    title.textContent = i18n("course_sessions_title", "Upcoming dates");
    section.appendChild(title);

    if (!open.length) {
      var empty = document.createElement("p");
      empty.className = "course-sessions__empty";
      empty.textContent = i18n("course_sessions_empty", "No date has been scheduled for this course yet.");
      section.appendChild(empty);
      return section;
    }

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

  function unitBlock(subcourse, courseId, subcourseIndex) {
    var stats = subcourseProgress(subcourse);
    var block = document.createElement("section");
    block.className = "unit-block";
    block.id = "course-unit-" + String(subcourseIndex + 1);

    var head = document.createElement("div");
    head.className = "unit-block__head";

    var icon = document.createElement("i");
    icon.className = "ph-light ph-" + unitIcon(subcourse) + " unit-block__icon";
    icon.setAttribute("aria-hidden", "true");

    var code = document.createElement("span");
    code.className = "unit-block__code";
    code.textContent = unitCode(subcourseIndex);

    var title = document.createElement("h3");
    title.textContent = subcourse.title;
    title.title = unitCode(subcourseIndex);

    var meta = document.createElement("span");
    meta.className = "unit-block__meta";
    meta.textContent = i18nFmt("course_unit_progress", { completed: stats.completedLessons, total: stats.lessonCount }, "{completed} of {total} completed");

    head.append(icon, code, title, meta);
    block.appendChild(head);

    var meter = progressMeter(
      stats.percent,
      i18nFmt("course_progress_label", { title: subcourse.title }, "Progress {title}")
    );
    meter.classList.add("unit-block__meter");
    block.appendChild(meter);

    if (subcourse.note) {
      var note = document.createElement("p");
      note.className = "unit-block__note";
      note.textContent = subcourse.note;
      block.appendChild(note);
    }

    var list = document.createElement("div");
    list.className = "activity-list";
    var lessons = Array.isArray(subcourse.lessons) ? subcourse.lessons : [];
    lessons.forEach(function (lesson) {
      list.appendChild(activityLink(lesson, courseId, subcourse));
    });
    block.appendChild(list);

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
