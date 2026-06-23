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

  // Max courses shown as "Recommended". Beyond this, level- and interest-relevant
  // courses are demoted to "Optional" so the recommended list stays focused.
  // Must be defined before the init render() below — it ran while the old
  // `var RECOMMEND_CAP = 11` (declared further down) was still hoisted-undefined,
  // so `shown < undefined` was always false and every course got demoted → 0 shown.
  var RECOMMEND_CAP = 11;

  // Visual theme per course family — derived from the course's primary
  // (first) interest. The theme drives the tile tint; the icon itself is
  // resolved per course from its title (see COURSE_ICON_RULES).
  // Icons are Phosphor Light names (Lufthansa DS substitutes for the
  // official LHG line-icon set; see SKILL.md). Phosphor resolves them
  // from the CDN font file loaded in course.html.
  var INTEREST_THEMES = {
    foundation: { icon: "graduation-cap" },
    productivity: { icon: "lightning" },
    consulting: { icon: "briefcase" },
    engineering: { icon: "terminal-window" },
    governance: { icon: "shield-check" },
    leadership: { icon: "compass" }
  };

  // Title-keyword → Phosphor Light icon. First match wins, so specific topics
  // (security, prompts, testing) must come before broad ones (learning).
  // Fallback: the interest theme's icon.
  var COURSE_ICON_RULES = [
    [/security|injection/, "shield-warning"],
    [/responsible|trustworthy|gdpr|ethics|legal/, "scales"],
    [/governance|risk|controls|compliance/, "shield-check"],
    [/prompt/, "chats"],
    [/copilot|code|agentic|software engineer/, "code"],
    [/testing|qa\b|test data/, "test-tube"],
    [/architecture|systems/, "tree-structure"],
    [/rag|knowledge/, "database"],
    [/documentation|content/, "file-text"],
    [/requirement|backlog|business analysis/, "clipboard-text"],
    [/use case|spotting|discovery|research/, "magnifying-glass"],
    [/cost|value|economics|finance|benefits/, "coins"],
    [/workforce|hr\b|people/, "users"],
    [/change|transformation|stakeholder/, "arrows-clockwise"],
    [/project|reporting|steering|portfolio|roadmap/, "squares-four"],
    [/data/, "chart-bar"],
    [/green|sustainable/, "leaf"],
    [/vendor|procurement|ecosystem/, "handshake"],
    [/operations|incident|service|support/, "wrench"],
    [/sales|consulting/, "briefcase"],
    [/communication|marketing/, "megaphone"],
    [/meeting|facilitation|workshop/, "presentation-chart"],
    [/automation|process/, "flow-arrow"],
    [/customer/, "headphones"],
    [/leader|decision/, "compass"],
    [/productivity/, "lightning"]
  ];

  var els = {
    profileSelect: document.getElementById("profileSelect"),
    levelSelect: document.getElementById("levelSelect"),
    ctaBtn: document.getElementById("ctaBtn"),
    ctaLabel: document.getElementById("ctaLabel"),
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
      profileId: "tc",
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
      state.profileId = "tc";
      state.externalLevel = 1;
      state.interests = ["foundation", "productivity"];
      state.filter = "recommended";
      state.activeCourseId = null;
      if (els.searchInput) els.searchInput.value = "";
      saveState();
      renderControls();
      render();
      announce("Selection reset. Lesson progress stays in the lesson system.");
    });

    if (els.searchInput) {
      els.searchInput.addEventListener("input", render);
    }
    var searchForm = document.getElementById("searchForm");
    if (searchForm) {
      searchForm.addEventListener("submit", function (event) { event.preventDefault(); });
    }

    els.profileSelect.addEventListener("change", function () {
      var profile = profileById[els.profileSelect.value];
      if (!profile || state.profileId === profile.id) return;
      state.profileId = profile.id;
      saveState();
      render();
      announce("Profile set: " + profile.label + ".");
    });

    els.levelSelect.addEventListener("change", function () {
      var level = Number(els.levelSelect.value);
      if (!validLevel(level) || state.externalLevel === level) return;
      state.externalLevel = level;
      saveState();
      render();
      announce("Level set: " + level + ".");
    });

    els.ctaBtn.addEventListener("click", function () {
      state.filter = "recommended";
      saveState();
      renderFilters();
      render();
      els.courseGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Controls (profile/level selects + interest chips) only need a full rebuild
  // when the underlying selection set changes — not on every progress tick.
  function renderControls() {
    renderProfileSelect();
    renderLevelSelect();
    renderInterestChips();
  }

  function render() {
    var computed = compute();
    syncSelects();
    renderInterestChips();
    renderFilters();
    renderCourses(computed);
    updateCta(computed);
    refreshIcons();
  }

  function renderProfileSelect() {
    replaceChildren(els.profileSelect, data.profiles.map(function (profile) {
      var option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.label;
      option.title = profileCode(profile);
      return option;
    }));
    els.profileSelect.value = state.profileId;
  }

  function renderLevelSelect() {
    replaceChildren(els.levelSelect, levelDefinitions.map(function (level) {
      var option = document.createElement("option");
      option.value = String(level.value);
      option.textContent = "LV" + level.value + " · " + level.label;
      return option;
    }));
    els.levelSelect.value = String(state.externalLevel);
  }

  function syncSelects() {
    if (els.profileSelect.value !== state.profileId) els.profileSelect.value = state.profileId;
    if (els.levelSelect.value !== String(state.externalLevel)) els.levelSelect.value = String(state.externalLevel);
  }

  // CTA shows a live count of recommended courses for the current selection so
  // changing profile/level gives immediate feedback before scrolling anywhere.
  function updateCta(computed) {
    var count = computed.entries.filter(function (entry) {
      return entry.kind === "recommended";
    }).length;
    els.ctaLabel.textContent = count === 1
      ? "Show 1 matching course"
      : "Show " + count + " matching courses";
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
      { id: "recommended", label: "Recommended" },
      { id: "optional", label: "Optional" },
      { id: "inprogress", label: "In Progress" },
      { id: "completed", label: "Completed" },
      { id: "all", label: "All" }
    ];
    replaceChildren(els.courseFilters, options.map(function (option) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seg-btn";
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
    var term = searchTerm();
    var visible = term ? applySearch(globalCourseEntries()) : filterCourses(computed.entries);

    if (els.resultLine) {
      els.resultLine.textContent = (visible.length === 1 ? "1 course" : visible.length + " courses")
        + (term ? " · global search" : "");
    }

    if (!visible.length) {
      lastVisibleSignature = "";
      var empty = document.createElement("div");
      empty.className = "empty-state";
      // When "Recommended" is empty but optional courses exist, the level/interest
      // combination simply has no on-path match — point the user at Optional.
      var hasOptional = computed.entries.some(function (entry) { return entry.kind === "optional"; });
      if (term) {
        empty.textContent = "No courses match this search.";
      } else if (state.filter === "recommended" && hasOptional) {
        empty.textContent = "There is no direct path course for this level and interest. Check Optional for adjacent courses.";
      } else {
        empty.textContent = "No courses in this filter. Switch to All or adjust the search.";
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
    return entries.filter(function (entry) {
      return courseSearchText(entry.course).indexOf(term) !== -1;
    });
  }

  function searchTerm() {
    return els.searchInput ? els.searchInput.value.trim().toLowerCase() : "";
  }

  function courseSearchText(course) {
    return [
      course.id,
      course.title,
      course.summary,
      course.format,
      course.status,
      course.source,
      (course.modules || []).join(" ")
    ].join(" ").toLowerCase();
  }

  function globalCourseEntries() {
    return data.courses.map(function (course) {
      return {
        course: course,
        score: 0,
        kind: "catalog",
        interestMatch: false,
        progress: courseProgress(course)
      };
    });
  }

  function courseTheme(course) {
    var primary = (course.interests || [])[0];
    return INTEREST_THEMES[primary] ? primary : "foundation";
  }

  function courseIcon(course, theme) {
    var title = String(course.title || "").toLowerCase();
    for (var i = 0; i < COURSE_ICON_RULES.length; i += 1) {
      if (COURSE_ICON_RULES[i][0].test(title)) return COURSE_ICON_RULES[i][1];
    }
    return INTEREST_THEMES[theme].icon;
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

    var head = document.createElement("div");
    head.className = "course-card__head";

    var tile = document.createElement("span");
    tile.className = "course-card__tile";
    tile.setAttribute("aria-hidden", "true");
    tile.appendChild(lucideIcon(courseIcon(course, theme)));

    var kind = document.createElement("span");
    kind.className = "course-card__kind";
    kind.dataset.kind = entry.kind;
    kind.textContent = courseKindLabel(entry.kind);
    head.append(tile, kind);

    var h = document.createElement("h3");
    h.textContent = course.title;
    h.title = courseCode(course) + " · " + course.id + " · " + (course.summary || "");

    var meta = document.createElement("p");
    meta.className = "course-card__meta";
    var metaText = document.createElement("span");
    metaText.textContent = entry.progress.lessonCount === 1
      ? "1 activity"
      : entry.progress.lessonCount + " activities";
    meta.appendChild(metaText);

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

    card.append(head, h, meta, foot);
    return card;
  }

  function courseKindLabel(kind) {
    if (kind === "recommended") return "Recommended";
    if (kind === "optional") return "Optional";
    return "Catalog";
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

    // Course candidacy comes from the curated learning tracks (LP01-LP05), not
    // from re-deriving it via tag matching. A course only counts as on-path for
    // this profile/level if it sits in a track serving the profile, in a stage
    // matching the external level's focus (Acquire/Deepen/Create).
    var stageCoursesForLevel = curatedCourseIds(profile, level.focusLevels);

    var entries = data.courses.filter(function (course) {
      return course.profileIds.indexOf(profile.id) !== -1;
    }).map(function (course) {
      var onPath = stageCoursesForLevel.indexOf(course.id) !== -1;
      var interestMatch = intersects(course.interests, selectedInterests) || intersects(course.dimensions, selectedInterestDims);
      var roleTargetMatch = course.dimensions.some(function (dimensionId) {
        return Number(profile.targets[dimensionId] || 0) > 0;
      });
      var progress = courseProgress(course);
      // Sharpness score decides which of the relevant courses survive the cap.
      var score = 10;
      if (onPath) score += 60;
      if (interestMatch) score += 24;
      if (onPath && interestMatch) score += 12;
      if (roleTargetMatch) score += 8;
      if (progress.percent > 0 && progress.percent < 100) score += 12;
      if (progress.percent === 100 && progress.lessonCount > 0) score -= 20;
      return {
        course: course,
        score: score,
        // Recommended requires both an on-path course AND a matching interest.
        // The cap is applied below; everything else falls back to optional.
        kind: onPath && interestMatch ? "recommended" : "optional",
        onPath: onPath,
        interestMatch: interestMatch,
        progress: progress
      };
    }).sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.course.id.localeCompare(b.course.id);
    });

    // Strict matching can yield zero recommendations (e.g. a profile/level whose
    // track stages don't intersect the chosen interests). Never present an empty
    // recommendation: fall back to the next-best relevant courses (on-path OR
    // interest match), which the score ordering already ranks sensibly.
    var hasStrict = entries.some(function (entry) { return entry.kind === "recommended"; });
    if (!hasStrict) {
      entries.forEach(function (entry) {
        if (entry.onPath || entry.interestMatch) entry.kind = "recommended";
      });
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

  function profileCode(profile) {
    return profile && profile.code ? profile.code : "R??";
  }

  function courseCode(course) {
    var index = data.courses.indexOf(course);
    return "C" + String(index + 1).padStart(2, "0");
  }

  function courseHref(courseId) {
    return "lrn/course.html?id=" + encodeURIComponent(courseId);
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

  // Render a Phosphor Light icon. Phosphor is a web font loaded via the
  // CDN <script> in course.html; the icon is just a glyph on the <i> tag.
  // Lucide → Phosphor names: callers pass the Phosphor name (COURSE_ICON_RULES
  // and call sites below use Phosphor spellings directly).
  function lucideIcon(name) {
    var i = document.createElement("i");
    i.className = "ph ph-" + name;
    i.setAttribute("aria-hidden", "true");
    return i;
  }

  // Phosphor is self-rendering (web font), so this is a no-op kept for
  // API parity with the previous Lucide-based call sites.
  function refreshIcons() {}
})();
