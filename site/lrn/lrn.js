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
  var roleById = indexBy(data.roles, "id");
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
  var ACADEMY_RECOMMEND_CAP = 3;

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
    roleSelect: document.getElementById("roleSelect"),
    keyAreaSelect: document.getElementById("keyAreaSelect"),
    specializationSelect: document.getElementById("specializationSelect"),
    levelSelect: document.getElementById("levelSelect"),
    courseFilters: document.getElementById("courseFilters"),
    courseGrid: document.getElementById("courseGrid"),
    resultLine: document.getElementById("resultLine"),
    searchInput: document.getElementById("searchInput"),
    searchClear: document.getElementById("searchClear"),
    resetBtn: document.getElementById("resetBtn"),
    academyPathList: document.getElementById("academyPathList"),
    academyPathCount: document.getElementById("academyPathCount"),
    academyAllToggle: document.getElementById("academyAllToggle"),
    myLearningPath: document.getElementById("myLearningPath"),
    myLearningPathContent: document.getElementById("myLearningPathContent"),
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
      keyAreaId: null,
      specializationId: null,
      externalLevel: 1,
      filter: "recommended",
      activeCourseId: null,
      academyAll: false
    };

    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (!saved || !roleById[saved.profileId]) return fallback;
      return {
        profileId: saved.profileId,
        keyAreaId: saved.keyAreaId || null,
        specializationId: saved.specializationId || null,
        externalLevel: validDepthValue(saved.externalLevel) ? Number(saved.externalLevel) : fallback.externalLevel,
        filter: ["recommended", "optional", "inprogress", "completed", "all"].indexOf(saved.filter) !== -1 ? saved.filter : "recommended",
        activeCourseId: saved.activeCourseId || null,
        academyAll: Boolean(saved.academyAll)
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
    var rawRole = params.get("profile") || params.get("role");
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

    if (rawRole) {
      var roleId = resolveRole(rawRole);
      if (roleId) {
        state.profileId = roleId;
        changed = true;
      }
    }

    if (changed) saveState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORE, JSON.stringify(state));
      if (window.LrnReportSync) window.LrnReportSync.sync();
    } catch (error) {
      // Selection persistence is a convenience only. Lesson progress is owned by progress.js / LRN.
    }
  }

  function wireActions() {
    els.resetBtn.addEventListener("click", function () {
      state.profileId = "tc";
      state.keyAreaId = null;
      state.specializationId = null;
      state.externalLevel = 1;
      state.filter = "recommended";
      state.activeCourseId = null;
      state.academyAll = false;
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
    if (els.academyAllToggle) {
      els.academyAllToggle.addEventListener("click", function () {
        state.academyAll = !state.academyAll;
        saveState();
        render();
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

    els.roleSelect.addEventListener("change", function () {
      var role = roleById[els.roleSelect.value];
      if (!role || state.profileId === role.id) return;
      state.profileId = role.id;
      state.keyAreaId = null;
      state.specializationId = null;
      saveState();
      render();
      announce(i18n("lrn_announce_profile_set").replace("{profile}", role.label));
    });

    if (els.keyAreaSelect) {
      els.keyAreaSelect.addEventListener("change", function () {
        if (state.keyAreaId === els.keyAreaSelect.value) return;
        state.keyAreaId = els.keyAreaSelect.value;
        state.specializationId = null;
        saveState();
        renderSpecializationSelect();
        render();
      });
    }

    if (els.specializationSelect) {
      els.specializationSelect.addEventListener("change", function () {
        if (state.specializationId === els.specializationSelect.value) return;
        state.specializationId = els.specializationSelect.value;
        saveState();
        render();
      });
    }

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
      render();
    });
  }

  // Controls (profile/level selects) only need a full rebuild when the
  // underlying selection set or language changes — not on every progress tick.
  function renderControls() {
    renderRoleSelect();
    renderLevelSelect();
  }

  function render() {
    renderKeyAreaSelect();
    renderSpecializationSelect();
    var computed = compute();
    var academyContext = computeAcademyContext(computed);
    syncSelects();
    renderFilters();
    renderLearningPath(academyContext);
    renderAcademyPaths(academyContext);
    renderCourses(computed);
    refreshIcons();
  }

  function renderRoleSelect() {
    replaceChildren(els.roleSelect, data.roles.map(function (role) {
      var option = document.createElement("option");
      option.value = role.id;
      option.textContent = role.label;
      return option;
    }));
    els.roleSelect.value = state.profileId;
  }

  function keyAreasForRole(roleId) {
    return (data.keyAreas || []).filter(function (keyArea) { return keyArea.roleId === roleId; });
  }

  function specializationsForKeyArea(keyAreaId) {
    return (data.specializations || []).filter(function (spec) { return spec.keyAreaId === keyAreaId; });
  }

  function renderKeyAreaSelect() {
    if (!els.keyAreaSelect) return;
    var options = keyAreasForRole(state.profileId);
    var wrapper = els.keyAreaSelect.closest(".selector-field");
    if (!options.length) {
      if (wrapper) wrapper.hidden = true;
      els.keyAreaSelect.innerHTML = "";
      state.keyAreaId = null;
      return;
    }
    if (wrapper) wrapper.hidden = false;
    replaceChildren(els.keyAreaSelect, options.map(function (keyArea) {
      var option = document.createElement("option");
      option.value = keyArea.id;
      option.textContent = keyArea.label;
      return option;
    }));
    if (!options.some(function (k) { return k.id === state.keyAreaId; })) {
      state.keyAreaId = options[0].id;
    }
    els.keyAreaSelect.value = state.keyAreaId;
  }

  function renderSpecializationSelect() {
    if (!els.specializationSelect) return;
    var options = state.keyAreaId ? specializationsForKeyArea(state.keyAreaId) : [];
    var wrapper = els.specializationSelect.closest(".selector-field");
    if (!options.length) {
      if (wrapper) wrapper.hidden = true;
      els.specializationSelect.innerHTML = "";
      state.specializationId = null;
      return;
    }
    if (wrapper) wrapper.hidden = false;
    replaceChildren(els.specializationSelect, options.map(function (spec) {
      var option = document.createElement("option");
      option.value = spec.id;
      option.textContent = spec.label;
      return option;
    }));
    if (!options.some(function (s) { return s.id === state.specializationId; })) {
      state.specializationId = options[0].id;
    }
    els.specializationSelect.value = state.specializationId;
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
    if (els.roleSelect.value !== state.profileId) els.roleSelect.value = state.profileId;
    if (els.levelSelect.value !== String(state.externalLevel)) els.levelSelect.value = String(state.externalLevel);
  }

  function renderFilters() {
    var options = [
      { id: "recommended", labelKey: "lrn_status_recommended" },
      { id: "optional", labelKey: "lrn_status_optional" },
      { id: "inprogress", labelKey: "lrn_status_started" },
      { id: "completed", labelKey: "lrn_status_completed" },
      { id: "scheduled", labelKey: "lrn_status_scheduled" },
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

  function computeAcademyContext(computed) {
    var activeLevel = computed && computed.level && computed.level.focusLevels[0] || "Acquire";
    var profileId = computed && computed.profile && computed.profile.id || state.profileId;
    var allPaths = data.academyPaths || [];
    var levelPaths = allPaths.filter(function (path) {
      return academyPathSupportsLevel(path, activeLevel);
    });
    var recommendedPaths = levelPaths.filter(function (path) {
      return path.category !== "foundation" && academyRecommendationRank(path, profileId) !== null;
    }).sort(function (a, b) {
      var rankDelta = academyRecommendationRank(a, profileId) - academyRecommendationRank(b, profileId);
      return rankDelta || a.academyCourse.localeCompare(b.academyCourse);
    });
    var primaryRecommendations = recommendedPaths.slice(0, ACADEMY_RECOMMEND_CAP);
    var foundationPaths = allPaths.filter(function (path) {
      return path.category === "foundation" && (state.academyAll || academyPathSupportsLevel(path, activeLevel));
    }).sort(function (a, b) {
      return Number(a.foundationRank || 999) - Number(b.foundationRank || 999);
    });
    var visiblePaths = state.academyAll ? allPaths : primaryRecommendations;
    var saved = progressApi && progressApi.getLearningPath ? progressApi.getLearningPath() : null;
    var activePath = saved && saved.profileId === profileId && allPaths.find(function (path) {
      return path.academyCourse === saved.academyCourse;
    });

    if (!activePath && visiblePaths.length) {
      activePath = primaryRecommendations[0] || foundationPaths[0];
      saveAcademyPath(activePath, profileId, activeLevel, "recommendation");
    }

    return {
      activeLevel: activeLevel,
      profileId: profileId,
      recommendedPaths: recommendedPaths,
      primaryRecommendations: primaryRecommendations,
      foundationPaths: foundationPaths,
      visiblePaths: visiblePaths,
      activePath: activePath
    };
  }

  function academyPathSupportsLevel(path, activeLevel) {
    return (path.stages || []).some(function (stage) { return stage.label === activeLevel; });
  }

  function academyRecommendationRank(path, roleId) {
    var rank = path.recommendationRanks && path.recommendationRanks[roleId];
    return Number.isFinite(Number(rank)) && Number(rank) > 0 ? Number(rank) : null;
  }

  function uniqueAcademyPaths(paths) {
    var seen = {};
    return (paths || []).filter(function (path) {
      if (!path || seen[path.id]) return false;
      seen[path.id] = true;
      return true;
    });
  }

  function saveAcademyPath(path, roleId, activeLevel, source) {
    if (!path || !progressApi || !progressApi.saveLearningPath) return;
    progressApi.saveLearningPath({
      academyCourse: path.academyCourse,
      profileId: roleId,
      targetLevel: activeLevel,
      source: source || "choice"
    });
  }

  function renderLearningPath(context) {
    if (!els.myLearningPathContent) return;
    if (!context.activePath) {
      if (els.myLearningPath) els.myLearningPath.hidden = true;
      return;
    }
    if (els.myLearningPath) els.myLearningPath.hidden = false;

    var path = context.activePath;
    var stats = academyPathProgress(path);
    syncUpskillingJourney(stats);
    var card = document.createElement("article");
    card.className = "my-learning-path__card";

    var overview = document.createElement("div");
    overview.className = "my-learning-path__overview";
    var identity = document.createElement("div");
    identity.className = "my-learning-path__identity";
    var icon = document.createElement("span");
    icon.className = "my-learning-path__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.appendChild(lucideIcon(academyPathIcon(path)));
    var copy = document.createElement("div");
    var code = document.createElement("p");
    code.className = "my-learning-path__code";
    code.textContent = path.academyCourse;
    var title = document.createElement("h3");
    title.textContent = path.title;
    var summary = document.createElement("p");
    summary.className = "my-learning-path__summary";
    summary.textContent = path.summary;
    copy.append(code, title, summary);
    identity.append(icon, copy);

    var progressCopy = document.createElement("div");
    progressCopy.className = "my-learning-path__progress-copy";
    var progressLabel = document.createElement("span");
    progressLabel.textContent = i18n("my_path_progress", "Overall path progress");
    var progressValue = document.createElement("strong");
    progressValue.textContent = stats.percent + "%";
    progressCopy.append(progressLabel, progressValue);
    overview.append(identity, progressCopy, progressMeter(stats.percent, i18n("my_path_progress", "Overall path progress")));

    var route = document.createElement("ol");
    route.className = "my-learning-path__route";
    route.setAttribute("aria-label", i18n("my_path_route_label", "Learning path stages"));
    stats.stages.forEach(function (stage) {
      var item = document.createElement("li");
      item.dataset.state = stage.state;
      if (stage.state === "current") item.setAttribute("aria-current", "step");
      var marker = document.createElement("span");
      marker.className = "my-learning-path__marker";
      marker.setAttribute("aria-hidden", "true");
      marker.appendChild(lucideIcon(stage.state === "complete" ? "check" : stage.state === "current" ? "play" : "circle"));
      var stageCopy = document.createElement("span");
      stageCopy.className = "my-learning-path__stage-copy";
      var stageName = document.createElement("strong");
      stageName.textContent = i18n("lrn_depth_" + stage.label.toLowerCase(), stage.label);
      var stageMeta = document.createElement("small");
      stageMeta.textContent = i18n("my_path_stage_meta", "{percent}% · {completed}/{total} courses")
        .replace("{percent}", String(stage.percent))
        .replace("{completed}", String(stage.completedCourses))
        .replace("{total}", String(stage.courseCount));
      stageCopy.append(stageName, stageMeta);
      item.append(marker, stageCopy);
      route.appendChild(item);
    });
    overview.appendChild(route);

    var next = document.createElement("aside");
    next.className = "my-learning-path__next";
    var nextIcon = document.createElement("span");
    nextIcon.className = "my-learning-path__next-icon";
    nextIcon.setAttribute("aria-hidden", "true");
    nextIcon.appendChild(lucideIcon(stats.nextCourse ? "arrow-right" : "check-circle"));
    var nextLabel = document.createElement("p");
    nextLabel.className = "my-learning-path__next-label";
    nextLabel.textContent = stats.nextCourse
      ? i18n("my_path_next_label", "Your next step")
      : i18n("my_path_complete_label", "Path complete");
    var nextTitle = document.createElement("h3");
    nextTitle.textContent = stats.nextCourse
      ? stats.nextCourse.title
      : i18n("my_path_complete_title", "You completed this learning path");
    var nextDetail = document.createElement("p");
    nextDetail.textContent = stats.nextCourse
      ? i18n("my_path_next_detail", "Continue with {stage}. Your progress is saved automatically.")
          .replace("{stage}", i18n("lrn_depth_" + stats.nextStage.toLowerCase(), stats.nextStage))
      : i18n("my_path_complete_detail", "Review your capability progress and choose what to deepen next.");
    var action = document.createElement("a");
    action.className = "primary-cta my-learning-path__cta";
    action.href = stats.nextCourse ? courseHref(stats.nextCourse.id) : "skills.html";
    action.append(
      document.createTextNode(stats.nextCourse
        ? i18n("my_path_open_next", "Open next course")
        : i18n("my_path_view_capabilities", "View capability progress")),
      lucideIcon("arrow-right")
    );
    var change = document.createElement("a");
    change.className = "text-link my-learning-path__change";
    change.href = "#academyPathsTitle";
    change.textContent = i18n("my_path_choose_another", "Choose another path");
    next.append(nextIcon, nextLabel, nextTitle, nextDetail, action, change);

    card.append(overview, next);
    replaceChildren(els.myLearningPathContent, [card]);
  }

  function syncUpskillingJourney(stats) {
    var currentStep = stats.percent >= 100 ? 5 : 3;
    document.querySelectorAll(".upskilling-journey__steps li[data-step]").forEach(function (item) {
      var step = Number(item.dataset.step);
      var itemState = step < currentStep ? "complete" : step === currentStep ? "current" : "upcoming";
      if (step === 4) itemState = "optional";
      item.dataset.state = itemState;
      if (itemState === "current") item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
  }

  function academyPathProgress(path) {
    var firstOpenStage = -1;
    var nextCourse = null;
    var nextStage = "Acquire";
    var stages = (path.stages || []).map(function (stage, index) {
      var courses = uniqueValues(stage.courses || []).map(function (id) { return courseById[id]; }).filter(Boolean);
      var progress = courses.map(courseProgress);
      var completedCourses = progress.filter(function (entry) { return entry.percent === 100; }).length;
      var percent = progress.length
        ? Math.round(progress.reduce(function (sum, entry) { return sum + entry.percent; }, 0) / progress.length)
        : 0;
      if (firstOpenStage === -1 && percent < 100) firstOpenStage = index;
      if (!nextCourse) {
        var openIndex = progress.findIndex(function (entry) { return entry.percent < 100; });
        if (openIndex !== -1) {
          nextCourse = courses[openIndex];
          nextStage = stage.label;
        }
      }
      return {
        label: stage.label,
        percent: percent,
        completedCourses: completedCourses,
        courseCount: courses.length,
        state: "upcoming"
      };
    });
    stages.forEach(function (stage, index) {
      stage.state = stage.percent === 100 ? "complete" : index === firstOpenStage ? "current" : "upcoming";
    });
    var courseIds = uniqueValues((path.stages || []).reduce(function (all, stage) {
      return all.concat(stage.courses || []);
    }, []));
    var allCourses = courseIds.map(function (id) { return courseById[id]; }).filter(Boolean);
    var allProgress = allCourses.map(courseProgress);
    var percent = allProgress.length
      ? Math.round(allProgress.reduce(function (sum, entry) { return sum + entry.percent; }, 0) / allProgress.length)
      : 0;
    return { stages: stages, nextCourse: nextCourse, nextStage: nextStage, percent: percent };
  }

  function renderAcademyPaths(context) {
    if (!els.academyPathList) return;

    var activeLevel = context.activeLevel;
    var visiblePaths = context.visiblePaths;
    var visibleIds = {};
    visiblePaths.forEach(function (path) { visibleIds[path.id] = true; });

    if (els.academyPathCount) {
      els.academyPathCount.textContent = i18n(
        state.academyAll ? "academy_paths_count_all" : "academy_paths_count_relevant",
        state.academyAll ? "{count} trainings in total" : "{count} selected trainings"
      )
        .replace("{count}", String(visiblePaths.length));
    }
    if (els.academyAllToggle) {
      els.academyAllToggle.setAttribute("aria-pressed", String(state.academyAll));
      els.academyAllToggle.textContent = state.academyAll
        ? i18n("academy_paths_show_relevant", "Show my selection")
        : i18n("academy_paths_show_all", "Show all AI trainings");
    }

    var profile = roleById[context.profileId];
    var groups = [
      academyPathGroup(
        "recommended",
        i18n("academy_group_recommended_title", "Recommended for {role}").replace("{role}", profile ? profile.label : "your role"),
        i18n("academy_group_recommended_intro", "The strongest matches for your selected profile and level."),
        context.primaryRecommendations.filter(function (path) { return visibleIds[path.id]; }),
        context
      ),
      academyPathGroup(
        "foundation",
        i18n("academy_group_foundation_title", "Foundations for everyone"),
        i18n("academy_group_foundation_intro", "Shared knowledge and everyday tools before you specialize."),
        context.foundationPaths.filter(function (path) { return visibleIds[path.id]; }),
        context
      )
    ];

    if (state.academyAll) {
      var featuredIds = {};
      context.primaryRecommendations.concat(context.foundationPaths).forEach(function (path) { featuredIds[path.id] = true; });
      groups.push(
        academyPathGroup(
          "role",
          i18n("academy_group_role_title", "Role-based trainings"),
          i18n("academy_group_role_intro", "Trainings for consulting, decision, leadership, and sales responsibilities."),
          visiblePaths.filter(function (path) { return path.category === "role" && !featuredIds[path.id]; }),
          context
        ),
        academyPathGroup(
          "technical",
          i18n("academy_group_technical_title", "Technical specializations"),
          i18n("academy_group_technical_intro", "Advanced paths for engineering, architecture, agents, and infrastructure."),
          visiblePaths.filter(function (path) { return path.category === "technical" && !featuredIds[path.id]; }),
          context
        )
      );
    }

    replaceChildren(els.academyPathList, groups.filter(Boolean));
  }

  function academyPathGroup(kind, titleText, introText, paths, context) {
    if (!paths.length) return null;
    var section = document.createElement("section");
    section.className = "academy-path-group";
    section.dataset.kind = kind;
    var headingId = "academyPathGroup-" + kind;
    section.setAttribute("aria-labelledby", headingId);

    var heading = document.createElement("div");
    heading.className = "academy-path-group__heading";
    var title = document.createElement("h3");
    title.id = headingId;
    title.textContent = titleText;
    var intro = document.createElement("p");
    intro.textContent = introText;
    heading.append(title, intro);

    var grid = document.createElement("div");
    grid.className = "academy-path-group__grid";
    paths.forEach(function (path) {
      grid.appendChild(academyPathCard(path, context));
    });
    section.append(heading, grid);
    return section;
  }

  function academyPathCard(path, context) {
    var activeLevel = context.activeLevel;
    var link = document.createElement("a");
    link.className = "interactive-surface interactive-card academy-card";
    link.dataset.pathId = path.id;
    link.dataset.category = path.category;
    var isActive = context.activePath && context.activePath.academyCourse === path.academyCourse;
    link.dataset.selected = String(Boolean(isActive));
    link.href = academyPathHref(path.academyCourse);
    link.setAttribute("aria-label", (isActive ? i18n("my_path_selected_prefix", "Your path: ") : "") + i18n("academy_path_open", "Open {title}").replace("{title}", path.title));
    link.addEventListener("click", function () {
      saveAcademyPath(path, context.profileId, activeLevel, "choice");
    });

    var icon = document.createElement("span");
    icon.className = "interactive-card__icon academy-card__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.appendChild(lucideIcon(academyPathIcon(path)));

    var code = document.createElement("span");
    code.className = "academy-card__code";
    code.textContent = path.academyCourse + (isActive ? " · " + i18n("my_path_short", "Your path") : "");

    var identity = document.createElement("span");
    identity.className = "academy-card__identity";
    var title = document.createElement("strong");
    title.textContent = path.title;
    var format = document.createElement("span");
    format.textContent = path.format;
    identity.append(title, format);

    var selectedStage = (path.stages || []).find(function (stage) { return stage.label === activeLevel; }) || path.stages[0];
    var stageBadge = document.createElement("span");
    stageBadge.className = "academy-card__level";
    stageBadge.textContent = selectedStage ? i18n("lrn_depth_" + selectedStage.label.toLowerCase(), selectedStage.label) : activeLevel;

    var chevron = document.createElement("span");
    chevron.className = "interactive-card__action academy-card__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.appendChild(lucideIcon("arrow-right"));
    link.append(icon, code, identity, stageBadge, chevron);
    return link;
  }

  function academyPathIcon(path) {
    var icons = {
      "AI-01": "code",
      "AI-02": "robot",
      "AI-03": "tree-structure",
      "AI-04": "clipboard-text",
      "AI-06": "magic-wand",
      "AI-07": "chart-line-up",
      "AI-08": "users-three",
      "AI-09": "book-open",
      "AI-10": "presentation-chart",
      "AI-12": "cloud"
    };
    return icons[path.academyCourse] || "graduation-cap";
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
    card.className = "interactive-surface interactive-card course-card";
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
    tile.className = "interactive-card__icon course-card__tile";
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
    // LHIND LRN taxonomy: Role → Key Area → Ausprägung → Level → Course → Unit → Activity).
    // The cockpit already names this layer "Lesson" on the syllabus row
    // (course.js: activityType → "Lesson"/"Guided Lesson"/"Knowledge Check"),
    // so the catalog-side label should match.
    metaText.textContent = entry.progress.lessonCount === 1
      ? "1 lesson"
      : entry.progress.lessonCount + " lessons";
    meta.appendChild(metaText);

    // Nächster Termin aus catalog.json — nur, wenn einer gepflegt ist.
    var nextSession = window.LrnSchedule ? window.LrnSchedule.next(course.id) : null;
    if (nextSession) {
      var locale = (window.SiteLang ? window.SiteLang.get() : "en") === "de" ? "de-DE" : "en-GB";
      var date = document.createElement("span");
      date.className = "course-card__date";
      date.textContent = window.LrnSchedule.formatShort(nextSession, locale)
        + (nextSession.language ? " · " + String(nextSession.language).toUpperCase() : "");
      date.title = i18n("course_card_next_date", "Next date {date}")
        .replace("{date}", window.LrnSchedule.formatRange(nextSession, locale));
      meta.appendChild(date);
    }

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
    open.className = "interactive-card__action course-card__open";
    open.setAttribute("aria-hidden", "true");
    open.appendChild(lucideIcon("arrow-right"));
    foot.appendChild(open);

    card.append(head, code, h, meta);
    if (summary) card.appendChild(summary);
    card.appendChild(foot);
    return card;
  }

  function compute() {
    var role = roleById[state.profileId];
    var level = levelDefinitions.find(function (item) {
      return item.value === Number(state.externalLevel);
    }) || levelDefinitions[0];
    var entries = rankedCourses(role, level);
    return { profile: role, level: level, entries: entries };
  }

  function rankedCourses(role, level) {
    // Course candidacy comes from the curated learning tracks (LP01-LP05), not
    // from re-deriving it via tag matching. A course only counts as on-path for
    // this role/level if it sits in a track serving the role, in a stage
    // matching the external level's focus (Acquire/Deepen/Create).
    var stageCoursesForLevel = curatedCourseIds(role, level.focusLevels);

    var entries = data.courses.filter(function (course) {
      return course.roleIds.indexOf(role.id) !== -1;
    }).map(function (course) {
      var onPath = stageCoursesForLevel.indexOf(course.id) !== -1;
      var roleTargetMatch = course.dimensions.some(function (dimensionId) {
        return Number(role.targets[dimensionId] || 0) > 0;
      });
      var keyAreaMatch = state.keyAreaId &&
        Array.isArray(course.keyAreaIds) && course.keyAreaIds.indexOf(state.keyAreaId) !== -1;
      var specializationMatch = state.specializationId && (
        (Array.isArray(course.specializationIds) && course.specializationIds.indexOf(state.specializationId) !== -1) ||
        (Array.isArray(course.specializationDepths) && course.specializationDepths.some(function (entry) {
          return entry.specializationId === state.specializationId;
        }))
      );
      var progress = courseProgress(course);
      // Sharpness score decides which of the relevant courses survive the cap.
      var score = 10;
      if (onPath) score += 60;
      if (roleTargetMatch) score += 8;
      if (specializationMatch) score += 20;
      else if (keyAreaMatch) score += 10;
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

    // A role/level whose track stages have no on-path courses would
    // otherwise leave the Recommended tab empty — fall back to showing
    // everything relevant instead.
    var hasStrict = entries.some(function (entry) { return entry.kind === "recommended"; });
    if (!hasStrict) {
      entries.forEach(function (entry) { entry.kind = "recommended"; });
    }

    // Enforce the cap: demote recommended courses past RECOMMEND_CAP to optional
    // so the focused list never balloons for broad roles/interests.
    var shown = 0;
    entries.forEach(function (entry) {
      if (entry.kind !== "recommended") return;
      if (shown < RECOMMEND_CAP) shown += 1;
      else entry.kind = "optional";
    });

    return entries;
  }

  // Course ids drawn from the curated tracks that serve this role, limited to
  // stages whose label matches the external level's focus (Acquire/Deepen/Create).
  function curatedCourseIds(role, focusLevels) {
    var ids = [];
    (data.tracks || []).forEach(function (track) {
      if (track.roleIds.indexOf(role.id) === -1) return;
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
      if (state.filter === "scheduled") return Boolean(window.LrnSchedule && window.LrnSchedule.next(entry.course.id));
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

  function academyPathHref(academyCourse) {
    var inLrn = /\/lrn(\/|$)/.test(location.pathname);
    var prefix = inLrn ? "course.html" : "lrn/course.html";
    return prefix + "?academy=" + encodeURIComponent(academyCourse);
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

  function resolveRole(rawRole) {
    var normalized = String(rawRole).trim().toLowerCase();
    if (roleById[normalized]) return normalized;
    var match = data.roles.find(function (role) {
      return role.segment.toLowerCase() === normalized ||
        role.label.toLowerCase() === normalized ||
        role.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === normalized;
    });
    return match && match.id;
  }

  function replaceChildren(parent, children) {
    parent.textContent = "";
    children.forEach(function (child) {
      parent.appendChild(child);
    });
  }

  function uniqueValues(values) {
    var seen = {};
    return (values || []).filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
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
