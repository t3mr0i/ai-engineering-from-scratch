(function () {
  "use strict";

  var STORE = "lhind:lrn-cockpit:v3";
  var data = window.LrnData;
  var curriculum = window.LrnCurriculumMap || { courseMaps: {}, omittedGroups: [] };
  var progressApi = window.AIFSProgress || null;
  var profileById = indexBy(data.profiles, "id");
  var state = loadState();

  var levelDefinitions = [
    { value: 1, label: "Basic", focusLevels: ["Acquire"] },
    { value: 2, label: "Foundation", focusLevels: ["Acquire", "Deepen"] },
    { value: 3, label: "Practitioner", focusLevels: ["Deepen"] },
    { value: 4, label: "Advanced", focusLevels: ["Deepen", "Create"] },
    { value: 5, label: "Expert", focusLevels: ["Create"] }
  ];

  var els = {
    profileSelect: document.getElementById("profileSelect"),
    levelSelect: document.getElementById("levelSelect"),
    interestChips: document.getElementById("interestChips"),
    courseFilters: document.getElementById("courseFilters"),
    courseGrid: document.getElementById("courseGrid"),
    resultLine: document.getElementById("resultLine"),
    searchInput: document.getElementById("searchInput"),
    resetBtn: document.getElementById("resetBtn"),
    srStatus: document.getElementById("srStatus")
  };

  applyExternalParams();
  renderControls();
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
      if (els.searchInput) els.searchInput.value = "";
      saveState();
      renderControls();
      render();
      announce("Auswahl zurückgesetzt. Lesson-Fortschritt bleibt im Lesson-System erhalten.");
    });

    if (els.searchInput) {
      els.searchInput.addEventListener("input", render);
    }
    var searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) { event.preventDefault(); });
    }
  }

  // Controls (profile + level selects, interest chips) only need to render
  // when the underlying selection set changes — not on every progress tick.
  function renderControls() {
    renderProfileSelect();
    renderLevelSelect();
    renderInterestChips();
  }

  function render() {
    var computed = compute();
    renderProfileSelect();
    renderLevelSelect();
    renderInterestChips();
    renderFilters();
    renderCourses(computed);
  }

  function renderProfileSelect() {
    var select = els.profileSelect;
    if (select.options.length !== data.profiles.length) {
      select.textContent = "";
      data.profiles.forEach(function (profile) {
        var opt = document.createElement("option");
        opt.value = profile.id;
        opt.textContent = profile.label;
        opt.title = profileCode(profile);
        select.appendChild(opt);
      });
    }
    select.value = state.profileId;
  }

  function renderLevelSelect() {
    var select = els.levelSelect;
    if (select.options.length !== levelDefinitions.length) {
      select.textContent = "";
      levelDefinitions.forEach(function (level) {
        var opt = document.createElement("option");
        opt.value = String(level.value);
        opt.textContent = level.value + " · " + level.label;
        select.appendChild(opt);
      });
    }
    select.value = String(state.externalLevel);
  }

  function renderInterestChips() {
    replaceChildren(els.interestChips, data.interests.map(function (interest) {
      var selected = state.interests.indexOf(interest.id) !== -1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.setAttribute("aria-pressed", String(selected));
      btn.textContent = interest.label;
      btn.title = interest.hint;
      btn.addEventListener("click", function () {
        toggleInterest(interest.id);
        saveState();
        renderInterestChips();
        render();
      });
      return btn;
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
      btn.className = "chip chip--filter";
      btn.textContent = option.label;
      btn.setAttribute("aria-pressed", String(state.filter === option.id));
      btn.addEventListener("click", function () {
        state.filter = option.id;
        saveState();
        renderFilters();
        render();
      });
      return btn;
    }));
  }

  var lastVisibleSignature = null;

  function renderCourses(computed) {
    var visible = filterCourses(computed.entries);
    visible = applySearch(visible);

    if (els.resultLine) {
      els.resultLine.textContent = visible.length === 1
        ? "1 Kurs"
        : visible.length + " Kurse";
    }

    if (!visible.length) {
      lastVisibleSignature = "";
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Keine Kurse in diesem Filter. Wechsle auf 'Alle' oder passe die Suche an.";
      replaceChildren(els.courseGrid, [empty]);
      return;
    }

    // Stagger the reveal only when the card SET changes (filter/profile/level/search),
    // not when re-rendering after a progress tick — otherwise the grid flickers.
    var signature = visible.map(function (entry) { return entry.course.id; }).join(",");
    var animate = signature !== lastVisibleSignature;
    lastVisibleSignature = signature;

    replaceChildren(els.courseGrid, visible.map(function (entry, index) {
      return courseCard(entry.course, entry, animate ? index : -1);
    }));
  }

  function applySearch(entries) {
    var term = els.searchInput ? els.searchInput.value.trim().toLowerCase() : "";
    if (!term) return entries;
    return entries.filter(function (entry) {
      var course = entry.course;
      return (course.title + " " + course.summary).toLowerCase().indexOf(term) !== -1;
    });
  }

  function courseCard(course, entry, index) {
    var card = document.createElement("a");
    card.className = "course-card";
    card.href = courseHref(course.id);
    // Stagger only when the set changed (index >= 0): 45ms/card, capped at 8 steps
    // so a 19-card grid still settles in ~360ms.
    if (index >= 0) {
      card.className += " course-card--enter";
      card.style.setProperty("--enter-delay", Math.min(index, 8) * 45 + "ms");
    }

    var h = document.createElement("h3");
    h.textContent = course.title;
    h.title = courseCode(course) + " · " + course.id;

    var meta = document.createElement("p");
    meta.className = "course-card__meta";
    meta.textContent = (entry.kind === "recommended" ? "Empfohlen" : "Optional")
      + " · " + entry.progress.lessonCount + " Aktivitäten";

    card.append(h, meta, progressMeter(entry.progress.percent, "Fortschritt " + course.title));
    return card;
  }

  function compute() {
    var profile = profileById[state.profileId];
    var level = levelDefinitions.find(function (item) {
      return item.value === Number(state.externalLevel);
    }) || levelDefinitions[0];
    var entries = rankedCourses(profile, level);
    return { profile: profile, level: level, entries: entries };
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

  function profileCode(profile) {
    return profile && profile.code ? profile.code : "R??";
  }

  function courseCode(course) {
    var index = data.courses.indexOf(course);
    return "C" + String(index + 1).padStart(2, "0");
  }

  function courseHref(courseId) {
    return "course.html?id=" + encodeURIComponent(courseId);
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

  // Selects fire on change; wire after element refs exist.
  els.profileSelect.addEventListener("change", function () {
    if (profileById[els.profileSelect.value]) {
      state.profileId = els.profileSelect.value;
      saveState();
      render();
      announce("Profil gesetzt: " + profileById[state.profileId].label + ".");
    }
  });

  els.levelSelect.addEventListener("change", function () {
    if (validLevel(els.levelSelect.value)) {
      state.externalLevel = Number(els.levelSelect.value);
      saveState();
      render();
      announce("Assessment-Level gesetzt: " + state.externalLevel + ".");
    }
  });
})();
