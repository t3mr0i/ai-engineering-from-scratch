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

  var root = document.getElementById("courseRoot");
  var srStatus = document.getElementById("srStatus");
  var course = resolveCourse();

  setBackLinks();
  render();
  if (progressApi && progressApi.onChange) progressApi.onChange(render);

  function resolveCourse() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    return id && courseById[id] ? courseById[id] : null;
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
    if (!course) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Course not found. Return to the catalog.";
      replaceChildren(root, [empty]);
      return;
    }

    document.title = course.title + " · LHIND AI Learning Catalog";

    var map = courseMap(course.id);
    var stats = courseProgress(course);
    var nextLesson = nextLessonForCourse(course.id);

    var head = document.createElement("header");
    head.className = "course-head";

    var title = document.createElement("h1");
    title.textContent = course.title;
    title.title = courseCode(course) + " · " + course.id;

    var summary = document.createElement("p");
    summary.className = "course-head__summary";
    summary.textContent = course.summary;

    var meta = document.createElement("p");
    meta.className = "course-head__meta";
    meta.textContent = (stats.subcourseCount === 1 ? "1 unit" : stats.subcourseCount + " units") + " · "
      + (stats.lessonCount === 1 ? "1 activity" : stats.lessonCount + " activities") + " · "
      + stats.percent + "% shipped";

    var action = document.createElement("a");
    action.className = "primary-cta";
    if (nextLesson) {
      action.href = lessonHref(nextLesson.path, course.id);
      var ctaLabel = document.createElement("span");
      ctaLabel.textContent = stats.visitedLessons > 0 ? "Resume" : "Open first task";
      action.append(ctaLabel, lucideIcon("arrow-right"));
    } else {
      action.appendChild(lucideIcon("check-circle"));
      var doneLabel = document.createElement("span");
      doneLabel.textContent = "All shipped";
      action.appendChild(doneLabel);
      action.href = "#";
      action.setAttribute("aria-disabled", "true");
      action.addEventListener("click", function (event) { event.preventDefault(); });
    }

    head.append(title, summary, meta, progressMeter(stats.percent, "Progress " + course.title), action);

    var children = [head];

    var outcomes = Array.isArray(course.outcomes) ? course.outcomes.filter(function (s) { return typeof s === "string" && s.trim().length > 0; }) : [];
    if (outcomes.length) {
      var outcomesBlock = document.createElement("section");
      outcomesBlock.className = "course-head__outcomes";
      outcomesBlock.setAttribute("aria-labelledby", "courseOutcomesTitle");

      var outcomesTitle = document.createElement("h2");
      outcomesTitle.id = "courseOutcomesTitle";
      outcomesTitle.className = "course-head__outcomes-title";
      outcomesTitle.textContent = "After this, you can ship:";

      var outcomesList = document.createElement("ul");
      outcomesList.className = "course-head__outcomes-list";
      outcomes.forEach(function (text) {
        var li = document.createElement("li");
        li.className = "course-head__outcomes-item";
        li.textContent = text;
        outcomesList.appendChild(li);
      });

      outcomesBlock.append(outcomesTitle, outcomesList);
      children.push(outcomesBlock);
    }

    var syllabusTitle = document.createElement("h2");
    syllabusTitle.className = "syllabus-title";
    syllabusTitle.textContent = "Tasks";
    children.push(syllabusTitle);

    if (!map.length) {
      var emptyMap = document.createElement("div");
      emptyMap.className = "empty-state";
      emptyMap.textContent = "No curriculum mapping has been maintained for this course yet.";
      children.push(emptyMap);
    } else {
      map.forEach(function (subcourse, subcourseIndex) {
        children.push(unitBlock(subcourse, course.id, subcourseIndex));
      });
    }

    replaceChildren(root, children);
    refreshIcons();
  }

  // Phosphor Light icon for a syllabus unit, picked from the unit title.
  // First match wins. Same vocabulary as lrn.js COURSE_ICON_RULES so a unit
  // about "Architecture" gets tree-structure on both surfaces.
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
    meta.textContent = stats.completedLessons + " of " + stats.lessonCount + " completed";

    head.append(icon, code, title, meta);
    block.appendChild(head);

    var meter = progressMeter(
      stats.percent,
      "Progress " + subcourse.title
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
    a.className = "activity-link";
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
      status.textContent = progress.label;
      status.dataset.state = progress.state;
      a.appendChild(status);
    }

    return a;
  }

  function activityType(lesson, subcourse) {
    var title = (lesson.title || "").toLowerCase();
    var unit = (subcourse && subcourse.title || "").toLowerCase();
    if (/eval|test|qa|verification|review|guardrail|compliance|risk|assessment/.test(title + " " + unit)) return "Eval";
    if (/project|pilot|capstone|case|use case|strategy|workflow|builder|registry|canvas/.test(title + " " + unit)) return "Lab";
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

  function courseCode(course) {
    var index = data.courses.indexOf(course);
    return "C" + String(index + 1).padStart(2, "0");
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
