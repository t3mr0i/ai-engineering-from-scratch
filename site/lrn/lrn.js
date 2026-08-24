(function () {
  "use strict";

  var STORE = "lhind:lrn-cockpit:v3";
  var data = window.LrnData;
  var curriculum = window.LrnCurriculumMap || { courseMaps: {}, omittedGroups: [] };
  var progressApi = window.AIFSProgress || null;
  // Rollout gate — see curriculum-map.js:visibleCourseIds. Track stages keep
  // referencing hidden ids; those simply stop matching a course here.
  if (curriculum.visibleCourseIds && curriculum.visibleCourseIds.length) {
    data.courses = data.courses.filter(function (course) {
      return curriculum.visibleCourseIds.indexOf(course.id) !== -1;
    });
  }
  var profileById = indexBy(data.profiles, "id");
  var courseById = indexBy(data.courses, "id");
  var state = loadState();

  // Die Tiefenachse (Acquire/Deepen/Create) ersetzt die frueheren L1-L4-
  // Senioritaetscodes im Katalog (00_REPORT.md Teil B1). Abgeleitet aus
  // data.levels statt aus data.aseLevelReference, das ist nur noch die
  // MyCompetence-Referenzstruktur ohne UI-Wirkung, siehe data.js.
  var levelDefinitions = (data.levels || []).filter(function (lv) {
    return lv.id >= 1 && lv.id <= 3;
  }).map(function (lv) {
    return {
      value: lv.id,
      labelKey: "lrn_depth_" + lv.label.toLowerCase(),
      focusLevels: [lv.label]
    };
  });

  // Mirrors lang.js's entry() lookup so lrn.js-owned UI chrome strings (level
  // labels, status tabs, CTA, empty-state, announcements) translate with the
  // rest of the site. Guarded for load order even though index.html loads
  // i18n.js/lang.js before lrn.js.
  function i18n(key, fallback) {
    var dict = window.SITE_I18N || {};
    var lang = window.SiteLang ? window.SiteLang.get() : "en";
    var entry = dict[key];
    if (!entry) return fallback == null ? key : fallback;
    if (entry[lang] != null) return entry[lang];
    if (entry.en != null) return entry.en;
    return fallback == null ? key : fallback;
  }

  // Max courses shown as "Recommended". Beyond this, level- and interest-relevant
  // courses are demoted to "Optional" so the recommended list stays focused.
  // Must be defined before the init render() below — it ran while the old
  // `var RECOMMEND_CAP = 11` (declared further down) was still hoisted-undefined,
  // so `shown < undefined` was always false and every course got demoted → 0 shown.
  var RECOMMEND_CAP = 11;

  // Visual theme per course family — derived from the primary interest. It
  // only drives the tile tint; course-formats.js owns the icon and label.
  var INTEREST_THEMES = {
    foundation: true,
    productivity: true,
    consulting: true,
    engineering: true,
    governance: true,
    leadership: true
  };

  var els = {
    profileSelect: document.getElementById("profileSelect"),
    levelSelect: document.getElementById("levelSelect"),
    courseFilters: document.getElementById("courseFilters"),
    courseGrid: document.getElementById("courseGrid"),
    resultLine: document.getElementById("resultLine"),
    searchInput: document.getElementById("searchInput"),
    searchClear: document.getElementById("searchClear"),
    resetBtn: document.getElementById("resetBtn"),
    academyPathList: document.getElementById("academyPathList"),
    srStatus: document.getElementById("srStatus")
  };

  applyExternalParams();
  renderControls();
  renderAcademyPaths();
  render();
  wireActions();
  if (progressApi && progressApi.onChange) progressApi.onChange(render);

  function loadState() {
    // LRN cockpit currently exposes only the Technology Consulting profile;
    // see site/lrn/data.js -> profiles for the full set.
    var fallback = {
      profileId: "tc",
      externalLevel: 1,
      filter: "recommended",
      activeCourseId: null
    };

    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (!saved || !profileById[saved.profileId]) return fallback;
      return {
        profileId: saved.profileId,
        externalLevel: validDepthValue(saved.externalLevel) ? Number(saved.externalLevel) : fallback.externalLevel,
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
    var rawDepth = params.get("depth");
    var rawProfile = params.get("profile") || params.get("role");
    var rawQuery = params.get("q");

    if (rawQuery && els.searchInput) {
      els.searchInput.value = rawQuery;
    }

    var depthFromParam = depthParamToValue(rawDepth);
    if (depthFromParam) {
      state.externalLevel = depthFromParam;
      changed = true;
    } else {
      var depthFromLevel = mapExternalLevelToDepth(rawLevel);
      if (depthFromLevel) {
        state.externalLevel = depthFromLevel;
        changed = true;
      }
    }

    if (rawProfile) {
      var profileId = resolveProfile(rawProfile);
      if (profileId) {
        state.profileId = profileId;
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
      state.profileId = "tc";
      state.externalLevel = 1;
      state.filter = "recommended";
      state.activeCourseId = null;
      if (els.searchInput) els.searchInput.value = "";
      syncSearchUi();
      saveState();
      renderControls();
      render();
      announce(i18n("lrn_announce_reset"));
    });

    if (els.searchInput) {
      els.searchInput.addEventListener("input", function () {
        syncSearchUi();
        render();
      });
      els.searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && searchTerm()) {
          event.preventDefault();
          clearSearch();
        }
      });
      syncSearchUi();
    }
    if (els.searchClear) {
      els.searchClear.addEventListener("click", clearSearch);
    }
    var searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) { event.preventDefault(); });
    }

    document.addEventListener("keydown", function (event) {
      var target = event.target;
      var editing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (event.key === "/" && !editing && !event.metaKey && !event.ctrlKey && !event.altKey && els.searchInput) {
        event.preventDefault();
        els.searchInput.focus();
      }
    });

    els.profileSelect.addEventListener("change", function () {
      var profile = profileById[els.profileSelect.value];
      if (!profile || state.profileId === profile.id) return;
      state.profileId = profile.id;
      saveState();
      render();
      announce(i18n("lrn_announce_profile_set").replace("{profile}", profile.label));
    });

    els.levelSelect.addEventListener("change", function () {
      var level = Number(els.levelSelect.value);
      if (!validDepthValue(level) || state.externalLevel === level) return;
      state.externalLevel = level;
      saveState();
      render();
      announce(i18n("lrn_announce_level_set").replace("{level}", level));
    });

    document.addEventListener("sitelang:change", function () {
      renderControls();
      renderAcademyPaths();
      render();
    });
  }

  // Controls (profile/level selects) only need a full rebuild when the
  // underlying selection set or language changes — not on every progress tick.
  function renderControls() {
    renderProfileSelect();
    renderLevelSelect();
  }

  function render() {
    var computed = compute();
    syncSelects();
    renderFilters();
    renderCourses(computed);
    refreshIcons();
  }

  function renderProfileSelect() {
    replaceChildren(els.profileSelect, data.profiles.map(function (profile) {
      var option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.label;
      return option;
    }));
    els.profileSelect.value = state.profileId;
  }

  function renderLevelSelect() {
    replaceChildren(els.levelSelect, levelDefinitions.map(function (level) {
      var option = document.createElement("option");
      option.value = String(level.value);
      option.textContent = i18n(level.labelKey);
      return option;
    }));
    els.levelSelect.value = String(state.externalLevel);
  }

  function syncSelects() {
    if (els.profileSelect.value !== state.profileId) els.profileSelect.value = state.profileId;
    if (els.levelSelect.value !== String(state.externalLevel)) els.levelSelect.value = String(state.externalLevel);
  }

  function renderFilters() {
    var options = [
      { id: "recommended", labelKey: "lrn_status_recommended" },
      { id: "optional", labelKey: "lrn_status_optional" },
      { id: "inprogress", labelKey: "lrn_status_started" },
      { id: "completed", labelKey: "lrn_status_completed" },
      { id: "all", labelKey: "lrn_status_all" }
    ];
    replaceChildren(els.courseFilters, options.map(function (option) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seg-btn";
      btn.textContent = i18n(option.labelKey);
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

  function renderAcademyPaths() {
    if (!els.academyPathList) return;

    var openPathIds = Array.prototype.filter.call(
      els.academyPathList.querySelectorAll("details[open]"),
      function (detail) { return detail.dataset.pathId; }
    ).map(function (detail) { return detail.dataset.pathId; });

    replaceChildren(els.academyPathList, (data.academyPaths || []).map(function (path) {
      var detail = document.createElement("details");
      detail.className = "academy-path";
      detail.dataset.pathId = path.id;
      detail.open = openPathIds.indexOf(path.id) !== -1;

      var summary = document.createElement("summary");
      summary.className = "academy-path__summary";

      var code = document.createElement("span");
      code.className = "academy-path__code";
      code.textContent = path.academyCourse;

      var identity = document.createElement("span");
      identity.className = "academy-path__identity";
      var title = document.createElement("strong");
      title.textContent = path.title;
      var format = document.createElement("span");
      format.textContent = path.format;
      identity.append(title, format);

      var chevron = lucideIcon("caret-down");
      chevron.classList.add("academy-path__chevron");
      summary.append(code, identity, chevron);

      var body = document.createElement("div");
      body.className = "academy-path__body";
      var pathSummary = document.createElement("p");
      pathSummary.className = "academy-path__description";
      pathSummary.textContent = path.summary;

      var facts = document.createElement("dl");
      facts.className = "academy-path__facts";
      appendFact(facts, i18n("academy_path_audience"), path.audience);
      appendFact(facts, i18n("academy_path_prerequisites"), path.prerequisites);

      var stages = document.createElement("ol");
      stages.className = "academy-path__stages";
      (path.stages || []).forEach(function (stage) {
        var item = document.createElement("li");
        item.className = "academy-stage";

        var stageCopy = document.createElement("div");
        stageCopy.className = "academy-stage__copy";
        var stageTitle = document.createElement("h3");
        stageTitle.textContent = i18n("lrn_depth_" + stage.label.toLowerCase(), stage.label);
        var stageFocus = document.createElement("p");
        stageFocus.textContent = stage.focus;
        stageCopy.append(stageTitle, stageFocus);

        var courseList = document.createElement("ul");
        courseList.className = "academy-stage__courses";
        courseList.setAttribute("aria-label", i18n("academy_path_courses"));
        (stage.courses || []).forEach(function (courseId) {
          var course = courseById[courseId];
          if (!course) return;
          var courseItem = document.createElement("li");
          var link = document.createElement("a");
          link.href = courseHref(courseId);
          link.textContent = courseId + " · " + course.title;
          link.setAttribute("aria-label", i18n("academy_path_open_course").replace("{title}", course.title));
          courseItem.appendChild(link);
          courseList.appendChild(courseItem);
        });

        item.append(stageCopy, courseList);
        stages.appendChild(item);
      });

      body.append(pathSummary, facts, stages);
      detail.append(summary, body);
      return detail;
    }));
  }

  function appendFact(list, label, value) {
    var group = document.createElement("div");
    var term = document.createElement("dt");
    term.textContent = label;
    var description = document.createElement("dd");
    description.textContent = value;
    group.append(term, description);
    list.appendChild(group);
  }

  var lastVisibleSignature = null;

  function renderCourses(computed) {
    var term = searchTerm();
    var scoped = filterCourses(computed.entries);
    var visible = term ? applySearch(scoped) : scoped;

    if (els.resultLine) {
      if (term) {
        var searchResultKey = visible.length === 1 ? "lrn_search_one" : "lrn_search_many";
        els.resultLine.textContent = i18n(searchResultKey)
          .replace("{count}", String(visible.length))
          .replace("{query}", term);
      } else {
        els.resultLine.textContent = i18n(visible.length === 1 ? "lrn_courses_one" : "lrn_courses_many")
          .replace("{count}", String(visible.length));
      }
    }

    if (!visible.length) {
      lastVisibleSignature = "";
      var empty = document.createElement("div");
      empty.className = "empty-state";
      // When "Recommended" is empty but optional courses exist, the level/interest
      // combination simply has no on-path match — point the user at Optional.
      var hasOptional = computed.entries.some(function (entry) { return entry.kind === "optional"; });
      if (term) {
        var emptyIcon = document.createElement("span");
        emptyIcon.className = "empty-state__icon";
        emptyIcon.setAttribute("aria-hidden", "true");
        emptyIcon.appendChild(lucideIcon("magnifying-glass"));
        var emptyTitle = document.createElement("h3");
        emptyTitle.textContent = i18n("lrn_search_empty_title");
        var emptyBody = document.createElement("p");
        emptyBody.textContent = i18n("lrn_search_empty_body");
        empty.append(emptyIcon, emptyTitle, emptyBody);
        var clearSearchButton = document.createElement("button");
        clearSearchButton.type = "button";
        clearSearchButton.className = "text-btn";
        clearSearchButton.textContent = i18n("lrn_search_clear");
        clearSearchButton.addEventListener("click", clearSearch);
        empty.appendChild(clearSearchButton);
      } else if (state.filter === "recommended" && hasOptional) {
        empty.textContent = i18n("lrn_empty_no_onpath");
      } else {
        // B10: lrn_empty_no_matches told users to "clear the search" even
        // though no search term was active in this branch (handled above) —
        // there is nothing to clear. Reuse the on-path empty copy instead:
        // it already only points at the "All" filter, an action that always
        // exists on this page.
        empty.textContent = i18n("lrn_empty_no_onpath");
      }
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
    var term = searchTerm();
    if (!term) return entries;
    if (window.CurriculumSearch) {
      var searchable = entries.map(function (entry) {
        var course = entry.course;
        return {
          entry: entry,
          title: course.title,
          summary: course.summary,
          topics: [].concat(
            course.modules || [],
            course.interests || [],
            course.dimensions || [],
            course.levels || []
          ),
          meta: [course.id, course.format, courseFormatLabel(course), course.status, course.source].join(" ")
        };
      });
      return window.CurriculumSearch.rank(searchable, term, {
        fields: { title: 9, topics: 5, summary: 4, meta: 2 }
      }).map(function (result) {
        var copy = Object.assign({}, result.item.entry);
        copy.searchMatch = result.match;
        return copy;
      });
    }
    return entries.filter(function (entry) {
      return courseSearchText(entry.course).indexOf(term.toLowerCase()) !== -1;
    });
  }

  function searchTerm() {
    return els.searchInput ? els.searchInput.value.trim() : "";
  }

  function syncSearchUi() {
    if (!els.searchClear) return;
    els.searchClear.hidden = !searchTerm();
  }

  function clearSearch() {
    if (!els.searchInput) return;
    els.searchInput.value = "";
    syncSearchUi();
    render();
    els.searchInput.focus();
  }

  function courseSearchText(course) {
    return [
      course.id,
      course.title,
      course.summary,
      course.format,
      courseFormatLabel(course),
      course.status,
      course.source,
      (course.modules || []).join(" "),
      (course.interests || []).join(" "),
      (course.dimensions || []).join(" "),
      (course.levels || []).join(" ")
    ].join(" ").toLowerCase();
  }

  function courseTheme(course) {
    var primary = (course.interests || [])[0];
    return INTEREST_THEMES[primary] ? primary : "foundation";
  }

  function courseFormat(course) {
    if (window.LrnCourseFormats && window.LrnCourseFormats.resolve) {
      return window.LrnCourseFormats.resolve(course);
    }
    return { id: "toolkit", icon: "wrench", labelKey: "course_format_toolkit", label: "Toolkit" };
  }

  function courseFormatLabel(course) {
    var format = courseFormat(course);
    return i18n(format.labelKey, format.label);
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

    var theme = courseTheme(course);
    card.dataset.theme = theme;
    var format = courseFormat(course);
    card.dataset.format = format.id;

    var head = document.createElement("div");
    head.className = "course-card__head";

    var tile = document.createElement("span");
    tile.className = "course-card__tile";
    tile.setAttribute("aria-hidden", "true");
    tile.appendChild(lucideIcon(format.icon));

    var formatLabel = document.createElement("span");
    formatLabel.className = "course-card__format";
    formatLabel.textContent = i18n(format.labelKey, format.label);
    formatLabel.title = course.format || formatLabel.textContent;

    head.append(tile, formatLabel);

    var code = document.createElement("span");
    code.className = "course-card__code";
    code.textContent = course.id;

    var h = document.createElement("h3");
    h.textContent = course.title;
    h.title = course.id + " · " + course.title;

    var meta = document.createElement("p");
    meta.className = "course-card__meta";
    var metaText = document.createElement("span");
    // Course-Card-Meta counts the *lessons* inside the course (per
    // LHIND LRN taxonomy: Profile → Level → Course → Unit → Activity).
    // The cockpit already names this layer "Lesson" on the syllabus row
    // (course.js: activityType → "Lesson"/"Guided Lesson"/"Knowledge Check"),
    // so the catalog-side label should match.
    metaText.textContent = entry.progress.lessonCount === 1
      ? "1 lesson"
      : entry.progress.lessonCount + " lessons";
    meta.appendChild(metaText);

    var summary = null;
    if (entry.searchMatch && course.summary) {
      summary = document.createElement("p");
      summary.className = "course-card__summary";
      summary.textContent = course.summary;
    }

    var foot = document.createElement("div");
    foot.className = "course-card__foot";
    foot.append(
      progressMeter(entry.progress.percent, "Progress " + course.title)
    );
    var open = document.createElement("span");
    open.className = "course-card__open";
    open.setAttribute("aria-hidden", "true");
    open.appendChild(lucideIcon("arrow-right"));
    foot.appendChild(open);

    card.append(head, code, h, meta);
    if (summary) card.appendChild(summary);
    card.appendChild(foot);
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
    // Course candidacy comes from the curated learning tracks (LP01-LP05), not
    // from re-deriving it via tag matching. A course only counts as on-path for
    // this profile/level if it sits in a track serving the profile, in a stage
    // matching the external level's focus (Acquire/Deepen/Create).
    var stageCoursesForLevel = curatedCourseIds(profile, level.focusLevels);

    var entries = data.courses.filter(function (course) {
      return course.profileIds.indexOf(profile.id) !== -1;
    }).map(function (course) {
      var onPath = stageCoursesForLevel.indexOf(course.id) !== -1;
      var roleTargetMatch = course.dimensions.some(function (dimensionId) {
        return Number(profile.targets[dimensionId] || 0) > 0;
      });
      var progress = courseProgress(course);
      // Sharpness score decides which of the relevant courses survive the cap.
      var score = 10;
      if (onPath) score += 60;
      if (roleTargetMatch) score += 8;
      if (progress.percent > 0 && progress.percent < 100) score += 12;
      if (progress.percent === 100 && progress.lessonCount > 0) score -= 20;
      return {
        course: course,
        score: score,
        // The cap is applied below; everything else falls back to optional.
        kind: onPath ? "recommended" : "optional",
        onPath: onPath,
        progress: progress
      };
    }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.course.id.localeCompare(b.course.id);
    });

    // A profile/level whose track stages have no on-path courses would
    // otherwise leave the Recommended tab empty — fall back to showing
    // everything relevant instead.
    var hasStrict = entries.some(function (entry) { return entry.kind === "recommended"; });
    if (!hasStrict) {
      entries.forEach(function (entry) { entry.kind = "recommended"; });
    }

    // Enforce the cap: demote recommended courses past RECOMMEND_CAP to optional
    // so the focused list never balloons for broad profiles/interests.
    var shown = 0;
    entries.forEach(function (entry) {
      if (entry.kind !== "recommended") return;
      if (shown < RECOMMEND_CAP) shown += 1;
      else entry.kind = "optional";
    });

    return entries;
  }

  // Course ids drawn from the curated tracks that serve this profile, limited to
  // stages whose label matches the external level's focus (Acquire/Deepen/Create).
  function curatedCourseIds(profile, focusLevels) {
    var ids = [];
    (data.tracks || []).forEach(function (track) {
      if (track.profileIds.indexOf(profile.id) === -1) return;
      (track.stages || []).forEach(function (stage) {
        if (focusLevels.indexOf(stage.label) === -1) return;
        stage.courses.forEach(function (id) {
          if (ids.indexOf(id) === -1) ids.push(id);
        });
      });
    });
    return ids;
  }

  function filterCourses(entries) {
    return entries.filter(function (entry) {
      if (state.filter === "all") return true;
      if (state.filter === "recommended" || state.filter === "optional") return entry.kind === state.filter;
      // B5: was keyed on completedLessons, so a course with a visited-but-
      // not-yet-completed lesson (the same signal the homepage "resume"
      // CTA uses) never counted as "Begonnen" here — the tab showed 0
      // while the hero still offered to continue. Key on visitedLessons
      // instead, matching what "started" actually means.
      if (state.filter === "inprogress") return entry.progress.visitedLessons > 0 && entry.progress.completedLessons < entry.progress.lessonCount;
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
    var fillPercent = percent > 0 ? Math.max(percent, 6) : 0;
    bar.style.transform = "scaleX(" + (fillPercent / 100) + ")";
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
    // Percent is the average reading fraction across the course's lessons, so a
    // half-read lesson contributes 0.5 and a completed one contributes 1. This
    // makes the bar move while reading, not only on "complete".
    var fractionSum = paths.reduce(function (sum, path) {
      return sum + readFraction(path);
    }, 0);
    return {
      subcourseCount: courseMap(course.id).length,
      lessonCount: paths.length,
      completedLessons: completed,
      visitedLessons: visited,
      percent: paths.length ? Math.round((fractionSum / paths.length) * 100) : 0
    };
  }

  function readFraction(path) {
    if (progressApi && progressApi.getReadFraction) {
      return progressApi.getReadFraction(path);
    }
    // Fallback for an older progress.js: binary completed-or-not.
    return lessonProgress(path).state === "completed" ? 1 : 0;
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

  // Build the course-detail URL relative to where the catalog is hosted.
  // The catalog can be served as "/" (root index.html), "/lrn/" (SWA
  // navigationFallback rewrite), or "/lrn/course.html" itself (deep link).
  // A bare "lrn/course.html" href double-prefixes to "/lrn/lrn/course.html"
  // when clicked from the /lrn/ SWA fallback, so branch on the current path.
  function courseHref(courseId) {
    var inLrn = /\/lrn(\/|$)/.test(location.pathname);
    var prefix = inLrn ? "course.html" : "lrn/course.html";
    return prefix + "?id=" + encodeURIComponent(courseId);
  }

  function validDepthValue(value) {
    var number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 3;
  }

  // Backward-compat for the external AI Self-Assessment ?level= contract
  // (previously addressed the retired L1-L4 seniority codes, before that an
  // LV1-LV5 scale). L3's old "Deepen/Create" straddle resolves to Deepen,
  // its primary depthOwn value — see data.aseLevelReference and
  // 00_REPORT.md Teil B2/E-7. Returns null (no change) for out-of-range input.
  function mapExternalLevelToDepth(raw) {
    var n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > 5) return null;
    if (n <= 1) return 1; // Acquire
    if (n <= 3) return 2; // Deepen
    return 3; // Create
  }

  function depthParamToValue(raw) {
    if (!raw) return null;
    var match = { acquire: 1, deepen: 2, create: 3 }[String(raw).trim().toLowerCase()];
    return match || null;
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

  function announce(text) {
    els.srStatus.textContent = text;
  }

  // Render a Phosphor Light icon. Phosphor is a web font loaded via the
  // CDN <script> in course.html; the icon is just a glyph on the <i> tag.
  // Lucide → Phosphor names: callers pass Phosphor spellings directly.
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
