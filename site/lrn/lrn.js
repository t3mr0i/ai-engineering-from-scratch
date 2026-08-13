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
  var state = loadState();

  var levelDefinitions = [
    { value: 1, labelKey: "lrn_level_basic", focusLevels: ["Acquire"] },
    { value: 2, labelKey: "lrn_level_foundation", focusLevels: ["Acquire", "Deepen"] },
    { value: 3, labelKey: "lrn_level_practitioner", focusLevels: ["Deepen"] },
    { value: 4, labelKey: "lrn_level_advanced", focusLevels: ["Deepen", "Create"] },
    { value: 5, labelKey: "lrn_level_lead", focusLevels: ["Create"] }
  ];

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
  // Per-course icon map (course.id → Phosphor Light name). Authoritative —
  // a specific mapping here always wins over the keyword fallback below, so
  // we can pin a unique, content-matched icon per course. Phosphor Light
  // names verified against @phosphor-icons/web 2.1.2.
  var COURSE_ICONS = {
    "PRIMER-01": "brain",
    "AI-09": "graduation-cap",
    "AI-06": "lightning",
    "RESP-01": "scales",
    "PROMPT-01": "chats",
    "USECASE-01": "magnifying-glass",
    "AI-01": "code",
    "AI-03": "tree-structure",
    "AI-02": "robot",
    "AI-10": "shield-check",
    "AI-11": "test-tube",
    "AI-12": "path",
    "AI-13": "file-text",
    "AI-14": "leaf",
    "AI-15": "users-three",
    "AI-16": "magnifying-glass",
    "AI-17": "coins",
    "AI-18": "chats",
    "AI-19": "handshake",
    "AI-20": "users",
    "AI-21": "compass",
    "AI-22": "chart-bar",
    "AI-23": "shield-warning",
    "AI-24": "database",
    "AI-25": "handshake",
    "AI-26": "wrench",
    "AI-31": "headphones",
    "AI-35": "presentation-chart",
    "AI-36": "squares-four",
    "AI-37": "database",
    "AI-38": "flow-arrow",
    "AI-39": "shield-check",
    "AI-40": "file-text",
    "AI-42": "tree-structure",
    "AI-43": "clipboard-text",
    "AI-45": "test-tube",
    "AI-48": "briefcase",
    "AI-49": "cloud",
    "AI-51": "users-three",
    "AI-52": "squares-four",
    "AI-53": "wrench",
    "AI-54": "shield-warning",
    "AI-57": "book-open"
  };

  // Keyword fallback for any future course id that isn't in COURSE_ICONS yet.
  // Specific topics come before broad ones. Interest theme icon is the last
  // resort.
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
    interestChips: document.getElementById("interestChips"),
    courseFilters: document.getElementById("courseFilters"),
    courseGrid: document.getElementById("courseGrid"),
    resultLine: document.getElementById("resultLine"),
    searchInput: document.getElementById("searchInput"),
    searchClear: document.getElementById("searchClear"),
    topicChips: document.getElementById("topicChips"),
    topicClearBtn: document.getElementById("topicClearBtn"),
    resetBtn: document.getElementById("resetBtn"),
    srStatus: document.getElementById("srStatus")
  };

  applyExternalParams();
  renderControls();
  render();
  wireActions();
  if (progressApi && progressApi.onChange) progressApi.onChange(render);

  function loadState() {
    // LRN cockpit currently exposes only the Technology Consulting profile;
    // see site/lrn/data.js -> profiles for the full set.
    var fallback = {
      profileId: "tc",
      externalLevel: 1,
      interests: ["foundation", "productivity"],
      filter: "recommended",
      activeCourseId: null,
      searchTopic: null
    };

    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (!saved || !profileById[saved.profileId]) return fallback;
      return {
        profileId: saved.profileId,
        externalLevel: validLevel(saved.externalLevel) ? Number(saved.externalLevel) : fallback.externalLevel,
        interests: validInterests(saved.interests) ? saved.interests : fallback.interests,
        filter: ["recommended", "optional", "inprogress", "completed", "all"].indexOf(saved.filter) !== -1 ? saved.filter : "recommended",
        activeCourseId: saved.activeCourseId || null,
        searchTopic: validSearchTopic(saved.searchTopic) ? saved.searchTopic : fallback.searchTopic
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
    var rawTopic = params.get("topic") || params.get("theme");
    var rawQuery = params.get("q");

    if (rawQuery && els.searchInput) {
      els.searchInput.value = rawQuery;
    }

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

    if (rawTopic) {
      var topicId = resolveInterest(rawTopic);
      if (topicId) {
        state.searchTopic = topicId;
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
      state.searchTopic = null;
      if (els.searchInput) els.searchInput.value = "";
      syncSearchUi();
      syncTopicUi();
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
    if (els.topicClearBtn) {
      els.topicClearBtn.addEventListener("click", function () {
        clearTopic(true);
      });
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
      if (!validLevel(level) || state.externalLevel === level) return;
      state.externalLevel = level;
      saveState();
      render();
      announce(i18n("lrn_announce_level_set").replace("{level}", level));
    });

    document.addEventListener("sitelang:change", function () {
      renderControls();
      render();
    });
  }

  // Controls (profile/level selects + interest/topic chips) only need a full
  // rebuild when the underlying selection set or language changes — not on
  // every progress tick.
  function renderControls() {
    renderProfileSelect();
    renderLevelSelect();
    renderInterestChips();
    renderTopicChips();
  }

  function render() {
    var computed = compute();
    syncSelects();
    syncTopicChipState();
    syncTopicUi();
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
      option.textContent = "LV" + level.value + " · " + i18n(level.labelKey);
      return option;
    }));
    els.levelSelect.value = String(state.externalLevel);
  }

  function syncSelects() {
    if (els.profileSelect.value !== state.profileId) els.profileSelect.value = state.profileId;
    if (els.levelSelect.value !== String(state.externalLevel)) els.levelSelect.value = String(state.externalLevel);
  }

  function renderInterestChips() {
    replaceChildren(els.interestChips, data.interests.map(function (interest) {
      var selected = state.interests.indexOf(interest.id) !== -1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.setAttribute("aria-pressed", String(selected));
      btn.textContent = topicLabel(interest.id, interest.label);
      btn.title = topicHint(interest.id, interest.hint);
      btn.addEventListener("click", function () {
        toggleInterest(interest.id);
        saveState();
        renderInterestChips();
        render();
      });
      return btn;
    }));
  }

  // Search topic controls are deliberately separate from the multi-select
  // recommendation interests above. Both lists come from LrnData.interests;
  // the single topic scope gives search an unambiguous, resettable dimension.
  function renderTopicChips() {
    if (!els.topicChips) return;
    var topics = [{ id: "", label: i18n("topic_filter_all") }].concat(data.interests.map(function (interest) {
      return {
        id: interest.id,
        label: topicLabel(interest.id, interest.label),
        hint: topicHint(interest.id, interest.hint)
      };
    }));

    replaceChildren(els.topicChips, topics.map(function (topic) {
      var selected = state.searchTopic === (topic.id || null);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip topic-chip" + (topic.id ? "" : " topic-chip--all");
      btn.setAttribute("data-topic", topic.id || "");
      btn.setAttribute("aria-pressed", String(selected));
      btn.textContent = topic.label;
      if (topic.hint) btn.title = topic.hint;
      btn.addEventListener("click", function () {
        state.searchTopic = topic.id || null;
        saveState();
        syncTopicUi();
        render();
        announce(state.searchTopic
          ? i18n("lrn_announce_topic_set").replace("{topic}", topicLabel(state.searchTopic))
          : i18n("lrn_announce_topic_clear"));
      });
      return btn;
    }));
  }

  function topicLabel(id, fallback) {
    var interest = data.interests.find(function (item) { return item.id === id; });
    return i18n("topic_" + id, fallback || (interest && interest.label) || id || i18n("topic_filter_all"));
  }

  function topicHint(id, fallback) {
    var interest = data.interests.find(function (item) { return item.id === id; });
    return i18n("topic_" + id + "_hint", fallback || (interest && interest.hint) || "");
  }

  function syncTopicChipState() {
    if (!els.topicChips) return;
    var selected = state.searchTopic || "";
    var chips = els.topicChips.querySelectorAll("[data-topic]");
    for (var i = 0; i < chips.length; i += 1) {
      chips[i].setAttribute("aria-pressed", String(chips[i].getAttribute("data-topic") === selected));
    }
  }

  function focusAllTopicChip() {
    if (!els.topicChips) return;
    var allTopic = els.topicChips.querySelector('[data-topic=""]');
    if (allTopic && typeof allTopic.focus === "function") allTopic.focus();
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

  var lastVisibleSignature = null;

  function renderCourses(computed) {
    var term = searchTerm();
    var scoped = filterCourses(computed.entries);
    if (state.searchTopic) {
      scoped = filterTopicEntries(scoped, state.searchTopic);
    }
    var visible = term ? applySearch(scoped) : scoped;
    var activeTopic = state.searchTopic ? topicLabel(state.searchTopic) : "";

    if (els.resultLine) {
      if (term) {
        var searchResultKey = state.searchTopic
          ? (visible.length === 1 ? "lrn_search_topic_one" : "lrn_search_topic_many")
          : (visible.length === 1 ? "lrn_search_one" : "lrn_search_many");
        els.resultLine.textContent = i18n(searchResultKey)
          .replace("{count}", String(visible.length))
          .replace("{query}", term)
          .replace("{topic}", activeTopic);
      } else if (state.searchTopic) {
        els.resultLine.textContent = i18n(visible.length === 1 ? "lrn_topic_one" : "lrn_topic_many")
          .replace("{count}", String(visible.length))
          .replace("{topic}", activeTopic);
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
      if (term || state.searchTopic) {
        var emptyIcon = document.createElement("span");
        emptyIcon.className = "empty-state__icon";
        emptyIcon.setAttribute("aria-hidden", "true");
        emptyIcon.appendChild(lucideIcon("magnifying-glass"));
        var emptyTitle = document.createElement("h3");
        emptyTitle.textContent = i18n("lrn_search_empty_title");
        var emptyBody = document.createElement("p");
        emptyBody.textContent = term && state.searchTopic
          ? i18n("lrn_search_topic_empty_body")
          : (term ? i18n("lrn_search_empty_body") : i18n("lrn_topic_empty_body"));
        empty.append(emptyIcon, emptyTitle, emptyBody);
        if (term) {
          var clearSearchButton = document.createElement("button");
          clearSearchButton.type = "button";
          clearSearchButton.className = "text-btn";
          clearSearchButton.textContent = i18n("lrn_search_clear");
          clearSearchButton.addEventListener("click", clearSearch);
          empty.appendChild(clearSearchButton);
        }
        if (state.searchTopic) {
          var clearTopicButton = document.createElement("button");
          clearTopicButton.type = "button";
          clearTopicButton.className = "text-btn";
          clearTopicButton.textContent = i18n("topic_filter_clear");
          clearTopicButton.addEventListener("click", function () {
            clearTopic(true);
          });
          empty.appendChild(clearTopicButton);
        }
      } else if (state.filter === "recommended" && hasOptional) {
        empty.textContent = i18n("lrn_empty_no_onpath");
      } else {
        empty.textContent = i18n("lrn_empty_no_matches");
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
          meta: [course.id, course.format, course.status, course.source].join(" ")
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

  function syncTopicUi() {
    if (!els.topicClearBtn) return;
    els.topicClearBtn.hidden = !state.searchTopic;
  }

  function clearSearch() {
    if (!els.searchInput) return;
    els.searchInput.value = "";
    syncSearchUi();
    render();
    els.searchInput.focus();
  }

  function clearTopic(restoreFocus) {
    if (!state.searchTopic) return;
    state.searchTopic = null;
    syncTopicUi();
    saveState();
    render();
    if (restoreFocus) focusAllTopicChip();
    announce(i18n("lrn_announce_topic_clear"));
  }

  function courseSearchText(course) {
    return [
      course.id,
      course.title,
      course.summary,
      course.format,
      course.status,
      course.source,
      (course.modules || []).join(" "),
      (course.interests || []).join(" "),
      (course.dimensions || []).join(" "),
      (course.levels || []).join(" ")
    ].join(" ").toLowerCase();
  }

  function filterTopicEntries(entries, topic) {
    if (!topic) return entries;
    if (window.CurriculumSearch && window.CurriculumSearch.filterByTopic) {
      return window.CurriculumSearch.filterByTopic(entries.map(function (entry) {
        return Object.assign({}, entry, { interests: entry.course.interests || [] });
      }), topic).map(function (entry) {
        var copy = Object.assign({}, entry);
        delete copy.interests;
        return copy;
      });
    }
    return entries.filter(function (entry) {
      return (entry.course.interests || []).indexOf(topic) !== -1;
    });
  }

  function courseTheme(course) {
    var primary = (course.interests || [])[0];
    return INTEREST_THEMES[primary] ? primary : "foundation";
  }

  function courseIcon(course, theme) {
    if (course && COURSE_ICONS[course.id]) return COURSE_ICONS[course.id];
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

    head.appendChild(tile);

    var h = document.createElement("h3");
    h.textContent = course.title;
    h.title = courseCode(course) + " · " + course.id + " · " + (course.summary || "");

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

    card.append(head, h, meta);
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

  function courseCode(course) {
    var index = data.courses.indexOf(course);
    return "C" + String(index + 1).padStart(2, "0");
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

  function validSearchTopic(topic) {
    return topic == null || topic === "" || data.interests.some(function (interest) {
      return interest.id === topic;
    });
  }

  function resolveInterest(rawInterest) {
    var normalized = String(rawInterest == null ? "" : rawInterest).trim().toLowerCase();
    if (!normalized) return null;
    var direct = data.interests.find(function (interest) {
      return interest.id === normalized;
    });
    if (direct) return direct.id;
    var match = data.interests.find(function (interest) {
      return interest.label.toLowerCase() === normalized ||
        topicLabel(interest.id, interest.label).toLowerCase() === normalized ||
        interest.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === normalized;
    });
    return match && match.id;
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
    i.className = "ph-light ph-" + name;
    i.setAttribute("aria-hidden", "true");
    return i;
  }

  // Phosphor is self-rendering (web font), so this is a no-op kept for
  // API parity with the previous Lucide-based call sites.
  function refreshIcons() {}
})();
