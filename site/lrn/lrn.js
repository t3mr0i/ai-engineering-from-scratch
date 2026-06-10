(function () {
  "use strict";

  var STORE = "lhind:lrn-cockpit:v3";
  var data = window.LrnData;
  var curriculum = window.LrnCurriculumMap || { courseMaps: {}, omittedGroups: [] };
  var progressApi = window.AIFSProgress || null;
  var profileById = indexBy(data.profiles, "id");
  var courseById = indexBy(data.courses, "id");
  var state = loadState();

  var levelDefinitions = [
    { value: 1, label: "Basic", stage: "Acquire", focusLevels: ["Acquire"], copy: "Einstieg: Grundlagen, sichere Toolnutzung und Orientierung." },
    { value: 2, label: "Foundation", stage: "Acquire", focusLevels: ["Acquire", "Deepen"], copy: "Solide Basis: Grundlagen festigen und erste Praxisbausteine starten." },
    { value: 3, label: "Practitioner", stage: "Deepen", focusLevels: ["Deepen"], copy: "Praxisniveau: Rollenbezogene Anwendung und konkrete Use Cases vertiefen." },
    { value: 4, label: "Advanced", stage: "Deepen", focusLevels: ["Deepen", "Create"], copy: "Fortgeschritten: komplexe Kontexte, Transfer und Skalierung vorbereiten." },
    { value: 5, label: "Expert", stage: "Create", focusLevels: ["Create"], copy: "High end: neue AI-Ansätze gestalten, teilen und als Multiplikator wirken." }
  ];

  var els = {
    profileCount: document.getElementById("profileCount"),
    profileGrid: document.getElementById("profileGrid"),
    levelGrid: document.getElementById("levelGrid"),
    interestGrid: document.getElementById("interestGrid"),
    scoreNumber: document.getElementById("scoreNumber"),
    scoreCopy: document.getElementById("scoreCopy"),
    progressPanel: document.getElementById("progressPanel"),
    trackGrid: document.getElementById("trackGrid"),
    courseFilters: document.getElementById("courseFilters"),
    courseGrid: document.getElementById("courseGrid"),
    courseDetail: document.getElementById("courseDetail"),
    capabilityGrid: document.getElementById("capabilityGrid"),
    resetBtn: document.getElementById("resetBtn"),
    copyBtn: document.getElementById("copyBtn"),
    srStatus: document.getElementById("srStatus")
  };

  applyExternalParams();
  render();
  wireActions();
  if (progressApi && progressApi.onChange) progressApi.onChange(render);

  function loadState() {
    var fallback = {
      profileId: "bsc",
      externalLevel: 1,
      interests: ["foundation", "productivity"],
      filter: "recommended",
      activeCourseId: null
    };

    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (!saved || !profileById[saved.profileId]) return fallback;
      return {
        profileId: saved.profileId,
        externalLevel: validLevel(saved.externalLevel) ? Number(saved.externalLevel) : fallback.externalLevel,
        interests: validInterests(saved.interests) ? saved.interests : fallback.interests,
        filter: ["recommended", "optional", "inprogress", "completed", "all"].indexOf(saved.filter) !== -1 ? saved.filter : "recommended",
        activeCourseId: saved.activeCourseId || null
      };
    } catch (error) {
      return fallback;
    }
  }

  function applyExternalParams() {
    var params = new URLSearchParams(window.location.search);
    var changed = false;
    var rawLevel = params.get("level") || params.get("score") || params.get("assessment");
    var rawProfile = params.get("profile") || params.get("role");
    var rawInterests = params.get("interests");

    if (validLevel(rawLevel)) {
      state.externalLevel = Number(rawLevel);
      changed = true;
    }

    if (rawProfile) {
      var profileId = resolveProfile(rawProfile);
      if (profileId) {
        state.profileId = profileId;
        changed = true;
      }
    }

    if (rawInterests) {
      var interests = rawInterests.split(",").map(function (item) {
        return item.trim();
      }).filter(function (item) {
        return data.interests.some(function (interest) { return interest.id === item; });
      });
      if (interests.length) {
        state.interests = interests;
        changed = true;
      }
    }

    if (changed) saveState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch (error) {
      // Selection persistence is a convenience only. Lesson progress is owned by progress.js / LRN.
    }
  }

  function wireActions() {
    els.resetBtn.addEventListener("click", function () {
      state.profileId = "bsc";
      state.externalLevel = 1;
      state.interests = ["foundation", "productivity"];
      state.filter = "recommended";
      state.activeCourseId = null;
      saveState();
      render();
      announce("Auswahl zurückgesetzt. Lesson-Fortschritt bleibt im Lesson-System erhalten.");
    });

    els.copyBtn.addEventListener("click", function () {
      var text = buildShareText();
      copyText(text).then(function () {
        els.copyBtn.textContent = "Kopiert";
        announce("LRN-Pfad wurde in die Zwischenablage kopiert.");
        window.setTimeout(function () { els.copyBtn.textContent = "Pfad kopieren"; }, 1800);
      }).catch(function () {
        announce("Kopieren ist in diesem Browser nicht verfügbar.");
      });
    });
  }

  function render() {
    var computed = compute();
    ensureActiveCourse(computed);
    renderProfiles();
    renderLevelControl();
    renderInterests();
    renderSummary(computed);
    renderProgress(computed);
    renderTracks(computed);
    renderFilters();
    renderCourses(computed);
    renderCourseDetail(computed);
    renderCapabilities();
  }

  function renderProfiles() {
    els.profileCount.textContent = data.profiles.length + " Profile";
    replaceChildren(els.profileGrid, data.profiles.map(function (profile) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "profile-btn";
      btn.setAttribute("aria-pressed", String(state.profileId === profile.id));
      btn.innerHTML = "<strong></strong><span></span>";
      btn.querySelector("strong").textContent = profile.label;
      btn.querySelector("span").textContent = profile.segment + " · " + profile.description;
      btn.addEventListener("click", function () {
        state.profileId = profile.id;
        state.activeCourseId = null;
        saveState();
        render();
        announce("Profil gesetzt: " + profile.label + ".");
      });
      return btn;
    }));
  }

  function renderLevelControl() {
    replaceChildren(els.levelGrid, levelDefinitions.map(function (level) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-btn";
      btn.setAttribute("aria-pressed", String(state.externalLevel === level.value));
      btn.innerHTML = "<strong></strong><span></span>";
      btn.querySelector("strong").textContent = String(level.value);
      btn.querySelector("span").textContent = level.label;
      btn.addEventListener("click", function () {
        state.externalLevel = level.value;
        state.activeCourseId = null;
        saveState();
        render();
        announce("Assessment-Level gesetzt: " + level.value + ".");
      });
      return btn;
    }));
  }

  function renderInterests() {
    replaceChildren(els.interestGrid, data.interests.map(function (interest) {
      var selected = state.interests.indexOf(interest.id) !== -1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "interest-btn";
      btn.setAttribute("aria-pressed", String(selected));
      var label = document.createElement("strong");
      label.textContent = interest.label;
      var hint = document.createElement("span");
      hint.textContent = interest.hint;
      btn.append(label, hint);
      btn.addEventListener("click", function () {
        toggleInterest(interest.id);
        state.activeCourseId = null;
        saveState();
        render();
      });
      return btn;
    }));
  }

  function renderSummary(computed) {
    els.scoreNumber.textContent = computed.level.value + "/5";
    els.scoreCopy.textContent = computed.level.copy + " Fokus: " + computed.level.focusLevels.join(" + ") + " für " + computed.profile.label + ".";
  }

  function renderProgress(computed) {
    var stats = computed.progressStats;
    var panel = document.createElement("div");
    panel.className = "progress-overview";

    var meter = progressMeter(stats.percent, "Curriculum-Fortschritt im empfohlenen Kurspool");
    var metrics = document.createElement("div");
    metrics.className = "metric-grid";
    [
      { label: "Empfohlene Kurse", value: String(stats.courseCount) },
      { label: "Curriculum-Lessons", value: String(stats.lessonCount) },
      { label: "Im Lesson-System erledigt", value: stats.completedLessons + "/" + stats.lessonCount }
    ].forEach(function (item) {
      var box = document.createElement("div");
      box.className = "metric-box";
      box.innerHTML = "<span></span><strong></strong>";
      box.querySelector("span").textContent = item.label;
      box.querySelector("strong").textContent = item.value;
      metrics.appendChild(box);
    });

    var copy = document.createElement("p");
    copy.className = "mapping-note";
    copy.textContent = "Kein manuelles Abhaken auf dieser Seite. Completion kommt aus dem Lesson-/LRN-Tracking, sobald die verlinkten Lessons bearbeitet werden.";

    panel.append(meter, metrics, copy);
    replaceChildren(els.progressPanel, [panel]);
  }

  function renderTracks(computed) {
    var tracks = data.tracks.filter(function (track) {
      return track.profileIds.indexOf(state.profileId) !== -1;
    });

    replaceChildren(els.trackGrid, tracks.map(function (track) {
      var card = document.createElement("article");
      card.className = "track-card";
      var title = document.createElement("h3");
      title.textContent = track.label;
      card.appendChild(title);

      track.stages.forEach(function (stage) {
        var group = document.createElement("div");
        group.className = "cluster-group";
        var level = document.createElement("span");
        level.className = "level-pill";
        level.dataset.level = stage.label;
        level.textContent = stage.label;
        if (computed.level.focusLevels.indexOf(stage.label) !== -1) level.dataset.focus = "true";
        group.appendChild(level);
        stage.courses.forEach(function (courseId) {
          var course = courseById[courseId];
          if (!course) return;
          var chip = document.createElement("button");
          chip.type = "button";
          chip.className = "module-pill module-pill--button";
          chip.textContent = course.id;
          chip.title = course.title;
          chip.addEventListener("click", function () {
            activateCourse(course.id);
          });
          group.appendChild(chip);
        });
        card.appendChild(group);
      });

      var p = document.createElement("p");
      p.textContent = "Für Level " + computed.level.value + " werden " + computed.level.focusLevels.join(" und ") + "-Bausteine priorisiert.";
      card.appendChild(p);
      return card;
    }));
  }

  function renderFilters() {
    var options = [
      { id: "recommended", label: "Empfohlen" },
      { id: "optional", label: "Optional" },
      { id: "inprogress", label: "In Arbeit" },
      { id: "completed", label: "Erledigt" },
      { id: "all", label: "Alle" }
    ];
    replaceChildren(els.courseFilters, options.map(function (option) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.textContent = option.label;
      btn.setAttribute("aria-pressed", String(state.filter === option.id));
      btn.addEventListener("click", function () {
        state.filter = option.id;
        saveState();
        render();
      });
      return btn;
    }));
  }

  function renderCourses(computed) {
    var visible = filterCourses(computed.entries);

    if (!visible.length) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Keine Kurse in diesem Filter. Wechseln Sie auf 'Alle', um den gesamten profilrelevanten Pool zu sehen.";
      replaceChildren(els.courseGrid, [empty]);
      return;
    }

    replaceChildren(els.courseGrid, visible.map(function (entry) {
      return courseCard(entry.course, entry);
    }));
  }

  function renderCourseDetail(computed) {
    var course = courseById[state.activeCourseId] || (computed.entries[0] && computed.entries[0].course);
    if (!course) {
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Noch kein Kurs ausgewählt.";
      replaceChildren(els.courseDetail, [empty]);
      return;
    }

    var map = courseMap(course.id);
    var stats = courseProgress(course);
    var detail = document.createElement("article");
    detail.className = "course-detail";

    var head = document.createElement("div");
    head.className = "course-detail__head";
    var title = document.createElement("h3");
    title.textContent = course.id + " · " + course.title;
    head.appendChild(title);

    var summary = document.createElement("p");
    summary.textContent = course.summary;

    var meta = document.createElement("div");
    meta.className = "course-meta";
    course.levels.forEach(function (level) {
      var pill = document.createElement("span");
      pill.className = "level-pill";
      pill.dataset.level = level;
      pill.textContent = level;
      meta.appendChild(pill);
    });
    var status = document.createElement("span");
    status.className = "module-pill";
    status.textContent = stats.subcourseCount + " Subkurse";
    meta.appendChild(status);
    var lessonCount = document.createElement("span");
    lessonCount.className = "module-pill";
    lessonCount.textContent = stats.lessonCount + " Lessons";
    meta.appendChild(lessonCount);

    var note = document.createElement("p");
    note.className = "mapping-note";
    note.textContent = "Die folgenden Subkurse sind aus dem vorhandenen Curriculum kuratiert. Verlinkt wird in den Lesson-Viewer; die Completion wird dort bzw. später im LRN-System gemessen.";

    detail.append(head, summary, meta, progressMeter(stats.percent, "Fortschritt " + course.title), note);

    if (!map.length) {
      var emptyMap = document.createElement("div");
      emptyMap.className = "empty-state";
      emptyMap.textContent = "Für diesen Kurs ist noch kein Curriculum-Mapping gepflegt.";
      detail.appendChild(emptyMap);
    } else {
      map.forEach(function (subcourse) {
        detail.appendChild(subcourseCard(subcourse, course.id));
      });
    }

    if (curriculum.omittedGroups && curriculum.omittedGroups.length) {
      detail.appendChild(omittedGroups());
    }

    replaceChildren(els.courseDetail, [detail]);
  }

  function subcourseCard(subcourse, courseId) {
    var card = document.createElement("section");
    card.className = "subcourse-card";
    var head = document.createElement("div");
    head.className = "subcourse-card__head";
    var title = document.createElement("h4");
    title.textContent = subcourse.title;
    var pill = document.createElement("span");
    pill.className = "advice-pill";
    pill.dataset.tone = subcourse.decision === "core" ? "warn" : "ok";
    pill.textContent = decisionLabel(subcourse.decision);
    head.append(title, pill);

    var note = document.createElement("p");
    note.textContent = subcourse.note || "";

    var list = document.createElement("div");
    list.className = "lesson-list";
    subcourse.lessons.forEach(function (lesson) {
      list.appendChild(lessonLink(lesson, courseId));
    });

    card.append(head, note, list);
    return card;
  }

  function lessonLink(lesson, courseId) {
    var progress = lessonProgress(lesson.path);
    var a = document.createElement("a");
    a.className = "lesson-link";
    a.href = lessonHref(lesson.path, courseId);
    a.innerHTML = "<span></span><strong></strong><em></em>";
    a.querySelector("span").textContent = lessonPathLabel(lesson.path);
    a.querySelector("strong").textContent = lesson.title;
    a.querySelector("em").textContent = progress.label;
    a.querySelector("em").dataset.state = progress.state;
    return a;
  }

  function omittedGroups() {
    var wrap = document.createElement("section");
    wrap.className = "omitted-groups";
    var h = document.createElement("h4");
    h.textContent = "Bewusst nicht als Pflichtteil gezogen";
    var list = document.createElement("div");
    list.className = "omitted-list";
    curriculum.omittedGroups.forEach(function (group) {
      var item = document.createElement("p");
      item.innerHTML = "<strong></strong><span></span>";
      item.querySelector("strong").textContent = group.label;
      item.querySelector("span").textContent = group.reason;
      list.appendChild(item);
    });
    wrap.append(h, list);
    return wrap;
  }

  function renderCapabilities() {
    var groups = {};
    data.capabilities.forEach(function (capability) {
      var target = capability.targets[state.profileId] || "n. a.";
      if (!groups[capability.cluster]) groups[capability.cluster] = [];
      groups[capability.cluster].push({ capability: capability, target: target });
    });

    replaceChildren(els.capabilityGrid, Object.keys(groups).map(function (cluster) {
      var card = document.createElement("article");
      card.className = "capability-card";
      var title = document.createElement("h3");
      title.textContent = cluster;
      var list = document.createElement("div");
      list.className = "module-list";
      groups[cluster].forEach(function (item) {
        var pill = document.createElement("span");
        pill.className = "level-pill";
        pill.dataset.level = normalizeLevelLabel(item.target);
        pill.textContent = item.capability.id + " · " + item.target;
        pill.title = item.capability.title;
        list.appendChild(pill);
      });
      card.append(title, list);
      return card;
    }));
  }

  function compute() {
    var profile = profileById[state.profileId];
    var level = levelDefinitions.find(function (item) {
      return item.value === Number(state.externalLevel);
    }) || levelDefinitions[0];
    var entries = rankedCourses(profile, level);
    var recommended = entries.filter(function (entry) {
      return entry.kind === "recommended";
    });

    return {
      profile: profile,
      level: level,
      entries: entries,
      recommended: recommended,
      progressStats: progressStats(recommended.length ? recommended.map(function (entry) { return entry.course; }) : entries.map(function (entry) { return entry.course; }))
    };
  }

  function rankedCourses(profile, level) {
    var selectedInterests = state.interests;
    var selectedInterestDims = data.interests.filter(function (interest) {
      return selectedInterests.indexOf(interest.id) !== -1;
    }).reduce(function (out, interest) {
      return out.concat(interest.dimensions);
    }, []);

    return data.courses.filter(function (course) {
      return course.profileIds.indexOf(profile.id) !== -1;
    }).map(function (course) {
      var levelMatch = intersects(course.levels, level.focusLevels);
      var interestMatch = intersects(course.interests, selectedInterests) || intersects(course.dimensions, selectedInterestDims);
      var roleTargetMatch = course.dimensions.some(function (dimensionId) {
        return Number(profile.targets[dimensionId] || 0) > 0;
      });
      var progress = courseProgress(course);
      var score = 10;
      if (levelMatch) score += 60;
      if (interestMatch) score += 18;
      if (roleTargetMatch) score += 8;
      if (progress.percent > 0 && progress.percent < 100) score += 12;
      if (progress.percent === 100 && progress.lessonCount > 0) score -= 20;
      return {
        course: course,
        score: score,
        kind: levelMatch ? "recommended" : "optional",
        interestMatch: interestMatch,
        progress: progress
      };
    }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.course.id.localeCompare(b.course.id);
    });
  }

  function filterCourses(entries) {
    return entries.filter(function (entry) {
      if (state.filter === "all") return true;
      if (state.filter === "recommended" || state.filter === "optional") return entry.kind === state.filter;
      if (state.filter === "inprogress") return entry.progress.completedLessons > 0 && entry.progress.completedLessons < entry.progress.lessonCount;
      if (state.filter === "completed") return entry.progress.lessonCount > 0 && entry.progress.completedLessons === entry.progress.lessonCount;
      return true;
    });
  }

  function courseCard(course, entry) {
    var card = document.createElement("article");
    card.className = "course-card";
    card.dataset.active = String(state.activeCourseId === course.id);

    var button = document.createElement("button");
    button.type = "button";
    button.className = "course-card__button";
    button.setAttribute("aria-pressed", String(state.activeCourseId === course.id));
    button.addEventListener("click", function () {
      activateCourse(course.id);
    });

    var h = document.createElement("h3");
    h.textContent = course.id + " · " + course.title;
    var summary = document.createElement("p");
    summary.textContent = course.summary;

    var meta = document.createElement("div");
    meta.className = "course-meta";
    var kind = document.createElement("span");
    kind.className = "advice-pill";
    kind.dataset.tone = entry.kind === "recommended" ? "warn" : "ok";
    kind.textContent = entry.kind === "recommended" ? "empfohlen" : "optional";
    meta.appendChild(kind);
    course.levels.forEach(function (level) {
      var pill = document.createElement("span");
      pill.className = "level-pill";
      pill.dataset.level = level;
      pill.textContent = level;
      meta.appendChild(pill);
    });
    var lessons = document.createElement("span");
    lessons.className = "module-pill";
    lessons.textContent = entry.progress.lessonCount + " Lessons";
    meta.appendChild(lessons);

    var modules = document.createElement("div");
    modules.className = "module-list";
    courseMap(course.id).forEach(function (subcourse) {
      var chip = document.createElement("span");
      chip.className = "module-pill";
      chip.textContent = subcourse.title;
      modules.appendChild(chip);
    });

    var action = document.createElement("span");
    action.className = "course-open";
    action.textContent = state.activeCourseId === course.id ? "Mapping geöffnet" : "Mapping öffnen";

    button.append(h, summary, meta, modules, progressMeter(entry.progress.percent, "Fortschritt " + course.title), action);
    card.appendChild(button);
    return card;
  }

  function activateCourse(courseId) {
    state.activeCourseId = courseId;
    saveState();
    render();
    announce("Kursmapping geöffnet: " + courseById[courseId].title + ".");
    els.courseDetail.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function ensureActiveCourse(computed) {
    var available = computed.entries.some(function (entry) {
      return entry.course.id === state.activeCourseId;
    });
    if (!available) {
      state.activeCourseId = computed.recommended[0] ? computed.recommended[0].course.id : computed.entries[0] && computed.entries[0].course.id;
    }
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

  function progressStats(courses) {
    var unique = {};
    courses.forEach(function (course) {
      lessonPaths(course.id).forEach(function (path) {
        unique[path] = true;
      });
    });
    var paths = Object.keys(unique);
    var completed = paths.filter(function (path) {
      return lessonProgress(path).state === "completed";
    }).length;
    return {
      courseCount: courses.length,
      lessonCount: paths.length,
      completedLessons: completed,
      percent: paths.length ? Math.round((completed / paths.length) * 100) : 0
    };
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
      percent: paths.length ? Math.round((completed / paths.length) * 100) : 0
    };
  }

  function lessonProgress(path) {
    if (!progressApi || !progressApi.getLessonProgress) {
      return { state: "open", label: "offen" };
    }
    var progress = progressApi.getLessonProgress(path);
    if (progress && progress.completedAt) return { state: "completed", label: "erledigt" };
    if (progress && progress.visitedAt) return { state: "visited", label: "gestartet" };
    return { state: "open", label: "offen" };
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

  function buildShareText() {
    var computed = compute();
    var courses = computed.recommended.slice(0, 8);
    var stats = computed.progressStats;
    var lines = [
      "LHIND AI LRN Course Cockpit",
      "Profil: " + computed.profile.label,
      "Externer Level: " + computed.level.value + "/5 (" + computed.level.label + ")",
      "Fokus: " + computed.level.focusLevels.join(" + "),
      "Interessen: " + state.interests.map(function (id) {
        return data.interests.find(function (interest) { return interest.id === id; }).label;
      }).join(", "),
      "Curriculum-Fortschritt: " + stats.percent + "% (" + stats.completedLessons + "/" + stats.lessonCount + " Lessons)",
      "",
      "Empfohlene Kurse:"
    ];
    courses.forEach(function (entry) {
      lines.push("- " + entry.course.id + " " + entry.course.title + " [" + entry.progress.completedLessons + "/" + entry.progress.lessonCount + " Lessons]");
    });
    return lines.join("\n");
  }

  function decisionLabel(decision) {
    if (decision === "condense") return "zusammengefasst";
    if (decision === "optional") return "optional";
    return "Kern";
  }

  function lessonPathLabel(path) {
    var parts = path.split("/");
    var phase = parts[1] || "";
    var lesson = parts[2] || "";
    var phaseNumber = (phase.match(/^(\d+)/) || [])[1] || phase;
    var lessonNumber = (lesson.match(/^(\d+)/) || [])[1] || lesson.slice(0, 2);
    return "P" + phaseNumber + " · L" + lessonNumber;
  }

  function lessonHref(path, courseId) {
    var prefix = window.location.pathname.indexOf("/lrn/") !== -1 ? "../" : "";
    var query = "path=" + encodeURIComponent(path);
    if (courseId) query += "&course=" + encodeURIComponent(courseId);
    return prefix + "lesson.html?" + query;
  }

  function normalizeLevelLabel(value) {
    if (value === "Expert" || value === "Create") return "Create";
    if (value === "Advanced" || value === "Deepen") return "Deepen";
    if (value === "Basic" || value === "Acquire") return "Acquire";
    return "n. a.";
  }

  function toggleInterest(id) {
    var idx = state.interests.indexOf(id);
    if (idx === -1) state.interests.push(id);
    else state.interests.splice(idx, 1);
    if (!state.interests.length) state.interests.push("foundation");
  }

  function validLevel(value) {
    var number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 5;
  }

  function validInterests(interests) {
    return Array.isArray(interests) && interests.length && interests.every(function (id) {
      return data.interests.some(function (interest) { return interest.id === id; });
    });
  }

  function resolveProfile(rawProfile) {
    var normalized = String(rawProfile).trim().toLowerCase();
    if (profileById[normalized]) return normalized;
    var match = data.profiles.find(function (profile) {
      return profile.segment.toLowerCase() === normalized ||
        profile.label.toLowerCase() === normalized ||
        profile.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === normalized;
    });
    return match && match.id;
  }

  function replaceChildren(parent, children) {
    parent.textContent = "";
    children.forEach(function (child) {
      parent.appendChild(child);
    });
  }

  function indexBy(items, key) {
    return items.reduce(function (out, item) {
      out[item[key]] = item;
      return out;
    }, {});
  }

  function intersects(a, b) {
    if (!a || !b || !a.length || !b.length) return false;
    return a.some(function (item) {
      return b.indexOf(item) !== -1;
    });
  }

  function announce(text) {
    els.srStatus.textContent = text;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.insetBlockStart = "-1000px";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(area);
      }
    });
  }
})();
