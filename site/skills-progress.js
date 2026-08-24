/**
 * Capability progress for the LRN cockpit.
 *
 * Joins three existing sources without creating a second progress store:
 * capability-to-phase mappings, course depth assignments, and the lesson
 * read/completion state owned by progress.js. Everything remains local.
 */
(function (root, factory) {
  "use strict";

  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.AIFSSkillsProgress = api;

  if (!root || !root.document) return;
  var start = function () { api.mount(root.document); };
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STAGES = [
    { name: "Acquire", sourceLevel: "Basic" },
    { name: "Deepen", sourceLevel: "Advanced" },
    { name: "Create", sourceLevel: "Expert" }
  ];
  var INITIAL_LIMIT = 6;
  var CLUSTER_ICONS = {
    "Foundation": "compass",
    "Engineering": "cpu",
    "Product and Process": "flow-arrow",
    "Advisory and Business Consulting": "briefcase",
    "Leadership and Strategy": "users-three"
  };

  function phaseId(path) {
    var match = String(path || "").match(/^phases\/(\d+)-/);
    return match ? Number(match[1]) : null;
  }

  function mergeCapabilities(catalogCapabilities, detailedCapabilities) {
    var detailById = {};
    (detailedCapabilities || []).forEach(function (capability) {
      detailById[capability.id] = capability;
    });
    return (catalogCapabilities || []).map(function (capability) {
      var detail = detailById[capability.id] || {};
      return {
        id: capability.id,
        cluster: capability.cluster || detail.cluster || "",
        title: capability.title || detail.title || "",
        targets: capability.targets || {},
        phases: Array.isArray(detail.phases) ? detail.phases.slice() : [],
        description: detail.description || "",
        levels: detail.levels || {}
      };
    });
  }

  function lessonFraction(progressState, path) {
    var lesson = progressState && progressState.lessons && progressState.lessons[path];
    if (!lesson) return 0;
    if (lesson.completedAt) return 1;
    var read = Number(lesson.readPct) || 0;
    return Math.max(0, Math.min(1, read >= 0.9 ? 1 : read));
  }

  function targetIndex(target) {
    for (var i = 0; i < STAGES.length; i++) {
      if (STAGES[i].name === target) return i;
    }
    return -1;
  }

  function pathsForStage(capability, stageName, courses, courseMaps) {
    var allowedPhases = {};
    (capability.phases || []).forEach(function (id) { allowedPhases[Number(id)] = true; });
    var paths = {};
    var courseIds = {};

    (courses || []).forEach(function (course) {
      if (!Array.isArray(course.levels) || course.levels.indexOf(stageName) === -1) return;
      var units = courseMaps && courseMaps[course.id];
      if (!Array.isArray(units)) return;
      units.forEach(function (unit) {
        (unit.lessons || []).forEach(function (lesson) {
          if (!allowedPhases[phaseId(lesson.path)]) return;
          paths[lesson.path] = true;
          courseIds[course.id] = true;
        });
      });
    });

    return { paths: Object.keys(paths), courseIds: Object.keys(courseIds) };
  }

  function capabilityProgress(capability, profileId, courses, courseMaps, progressState) {
    var target = capability.targets && capability.targets[profileId];
    var goalIndex = targetIndex(target);
    var stages = STAGES.map(function (stage, index) {
      var mapped = pathsForStage(capability, stage.name, courses, courseMaps);
      var sum = mapped.paths.reduce(function (total, path) {
        return total + lessonFraction(progressState, path);
      }, 0);
      return {
        name: stage.name,
        sourceLevel: stage.sourceLevel,
        description: capability.levels && capability.levels[stage.sourceLevel] || "",
        lessonCount: mapped.paths.length,
        courseCount: mapped.courseIds.length,
        percent: mapped.paths.length ? Math.round((sum / mapped.paths.length) * 100) : 0,
        inTarget: goalIndex >= 0 && index <= goalIndex
      };
    });
    var targetStages = stages.filter(function (stage) { return stage.inTarget && stage.lessonCount > 0; });
    var overall = targetStages.length
      ? Math.round(targetStages.reduce(function (sum, stage) { return sum + stage.percent; }, 0) / targetStages.length)
      : 0;
    var mappedLessons = {};
    stages.forEach(function (stage) {
      pathsForStage(capability, stage.name, courses, courseMaps).paths.forEach(function (path) {
        mappedLessons[path] = true;
      });
    });

    return {
      id: capability.id,
      cluster: capability.cluster,
      title: capability.title,
      description: capability.description,
      target: target || "n. a.",
      targetIndex: goalIndex,
      stages: stages,
      percent: overall,
      tracked: targetStages.length > 0,
      mappedLessonCount: Object.keys(mappedLessons).length
    };
  }

  function allProgress(capabilities, profileId, courses, courseMaps, progressState) {
    return (capabilities || []).filter(function (capability) {
      return targetIndex(capability.targets && capability.targets[profileId]) >= 0;
    }).map(function (capability) {
      return capabilityProgress(capability, profileId, courses, courseMaps, progressState);
    });
  }

  function overallProgress(items) {
    var tracked = (items || []).filter(function (item) { return item.tracked; });
    return tracked.length
      ? Math.round(tracked.reduce(function (sum, item) { return sum + item.percent; }, 0) / tracked.length)
      : 0;
  }

  function sortProgress(items, mode) {
    return (items || []).slice().sort(function (a, b) {
      if (mode === "name") return a.title.localeCompare(b.title);
      if (mode === "order") return a.id - b.id;
      if (a.tracked !== b.tracked) return a.tracked ? -1 : 1;
      if (b.percent !== a.percent) return b.percent - a.percent;
      return a.id - b.id;
    });
  }

  function mount(doc) {
    var section = doc.getElementById("skillsProgress");
    if (!section) return;

    var data = (typeof window !== "undefined" && window.LrnData) || {};
    var curriculum = (typeof window !== "undefined" && window.LrnCurriculumMap) || {};
    var progressApi = (typeof window !== "undefined" && window.AIFSProgress) || null;
    var detailed = typeof CAPABILITIES !== "undefined" ? CAPABILITIES : [];
    var capabilities = mergeCapabilities(data.capabilities, detailed);
    var list = doc.getElementById("skillsProgressList");
    var total = doc.getElementById("skillsProgressTotal");
    var coverage = doc.getElementById("skillsProgressCoverage");
    var sort = doc.getElementById("skillsProgressSort");
    var showAllButton = doc.getElementById("skillsProgressShowAll");
    var expanded = {};
    var showAll = false;

    function i18n(key, fallback, vars) {
      var dict = (typeof window !== "undefined" && window.SITE_I18N) || {};
      var lang = typeof window !== "undefined" && window.SiteLang ? window.SiteLang.get() : "en";
      var entry = dict[key];
      var text = entry && (entry[lang] != null ? entry[lang] : entry.en);
      text = text == null ? fallback : text;
      Object.keys(vars || {}).forEach(function (name) {
        text = text.replace("{" + name + "}", String(vars[name]));
      });
      return text;
    }

    function currentProfileId() {
      var select = doc.getElementById("profileSelect");
      if (select && select.value) return select.value;
      return data.profiles && data.profiles[0] ? data.profiles[0].id : "tc";
    }

    function element(tag, className, text) {
      var node = doc.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    }

    function levelDescription(text) {
      var wrap = element("div", "skill-level__description");
      String(text || "").split(/\n\s*\n/).filter(Boolean).forEach(function (block) {
        var paragraph = element("p");
        var match = block.match(/^([^:]{2,48}):\s*([\s\S]+)$/);
        if (match) {
          paragraph.appendChild(element("strong", "", match[1] + ": "));
          paragraph.appendChild(doc.createTextNode(match[2]));
        } else {
          paragraph.textContent = block;
        }
        wrap.appendChild(paragraph);
      });
      return wrap;
    }

    function stageMeter(stage, title) {
      var meter = element("div", "skill-level__meter");
      meter.setAttribute("role", "progressbar");
      meter.setAttribute("aria-label", stage.name + " — " + title);
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", "100");
      meter.setAttribute("aria-valuenow", String(stage.percent));
      var fill = element("span");
      fill.style.transform = "scaleX(" + (stage.percent / 100) + ")";
      meter.appendChild(fill);
      return meter;
    }

    function detailPanel(item) {
      var detail = element("div", "skill-track__details");
      detail.id = "skillDetails" + item.id;
      detail.hidden = !expanded[item.id];

      if (item.description) detail.appendChild(element("p", "skill-track__description", item.description));
      detail.appendChild(element("p", "skill-track__language-note", i18n(
        "skills_progress_description_note",
        "Capability descriptions are maintained in English."
      )));

      var grid = element("div", "skill-levels");
      item.stages.forEach(function (stage, index) {
        var card = element("article", "skill-level");
        if (stage.inTarget) card.dataset.target = "true";
        var head = element("div", "skill-level__head");
        head.appendChild(element("h4", "", stage.name));
        head.appendChild(element("strong", "", stage.percent + "%"));
        card.appendChild(head);
        card.appendChild(stageMeter(stage, item.title));
        var count = stage.lessonCount === 1
          ? i18n("skills_progress_one_lesson", "1 mapped lesson")
          : stage.lessonCount > 1
            ? i18n("skills_progress_lessons", "{count} mapped lessons", { count: stage.lessonCount })
            : i18n("skills_progress_no_lessons", "No course mapped yet");
        card.appendChild(element("p", "skill-level__meta", count));
        if (stage.description) card.appendChild(levelDescription(stage.description));
        if (index === item.targetIndex) {
          card.appendChild(element("span", "skill-level__target", i18n("skills_progress_target", "Target")));
        }
        grid.appendChild(card);
      });
      detail.appendChild(grid);
      return detail;
    }

    function skillRow(item) {
      var li = element("li", "skill-track");
      if (!item.tracked) li.dataset.unmapped = "true";
      var button = element("button", "skill-track__toggle");
      button.type = "button";
      button.setAttribute("aria-expanded", String(!!expanded[item.id]));
      button.setAttribute("aria-controls", "skillDetails" + item.id);
      button.setAttribute("aria-label", i18n(
        expanded[item.id] ? "skills_progress_details_close" : "skills_progress_details_open",
        (expanded[item.id] ? "Hide" : "Show") + " level details for {title}",
        { title: item.title }
      ));

      var icon = element("span", "skill-track__icon");
      var glyph = element("i", "ph-light ph-" + (CLUSTER_ICONS[item.cluster] || "star"));
      glyph.setAttribute("aria-hidden", "true");
      icon.appendChild(glyph);

      var identity = element("span", "skill-track__identity");
      identity.appendChild(element("strong", "", item.title));
      identity.appendChild(element("small", "", item.cluster));

      var visual = element("span", "skill-track__visual");
      var rail = element("span", "skill-track__rail");
      rail.setAttribute("role", "img");
      rail.setAttribute("aria-label", item.title + ": " + item.percent + "%");
      item.stages.forEach(function (stage, index) {
        var segment = element("span", "skill-track__segment");
        segment.dataset.level = stage.name.toLowerCase();
        if (stage.inTarget) segment.dataset.target = "true";
        if (!stage.lessonCount) segment.dataset.empty = "true";
        var fill = element("i");
        fill.style.transform = "scaleX(" + (stage.percent / 100) + ")";
        segment.appendChild(fill);
        if (index === item.targetIndex) segment.appendChild(element("b", "skill-track__target-marker"));
        rail.appendChild(segment);
      });
      visual.appendChild(rail);
      visual.appendChild(element("small", "", i18n("skills_progress_target", "Target") + " · " + item.target));

      var metric = element("span", "skill-track__metric");
      metric.appendChild(element("strong", "", item.percent + "%"));
      metric.appendChild(element("small", "", item.tracked
        ? i18n("skills_progress_complete", "complete")
        : i18n("skills_progress_no_lessons", "No course mapped yet")));

      var chevron = element("i", "ph-light " + (expanded[item.id] ? "ph-caret-up" : "ph-caret-down"));
      chevron.setAttribute("aria-hidden", "true");
      button.append(icon, identity, visual, metric, chevron);
      button.addEventListener("click", function () {
        expanded[item.id] = !expanded[item.id];
        render();
        var next = doc.querySelector('[aria-controls="skillDetails' + item.id + '"]');
        if (next) next.focus();
      });
      li.appendChild(button);
      li.appendChild(detailPanel(item));
      return li;
    }

    function render() {
      if (!capabilities.length) {
        section.hidden = true;
        return;
      }
      section.hidden = false;
      var progressState = progressApi && progressApi.getState ? progressApi.getState() : { lessons: {} };
      var items = allProgress(
        capabilities,
        currentProfileId(),
        data.courses || [],
        curriculum.courseMaps || {},
        progressState
      );
      var sorted = sortProgress(items, sort ? sort.value : "progress");
      var shown = showAll ? sorted : sorted.slice(0, INITIAL_LIMIT);
      list.replaceChildren.apply(list, shown.map(skillRow));
      total.textContent = overallProgress(items) + "%";
      var tracked = items.filter(function (item) { return item.tracked; }).length;
      var unmapped = items.length - tracked;
      coverage.textContent = i18n(
        "skills_progress_coverage",
        "{tracked} tracked · {unmapped} awaiting courses",
        { tracked: tracked, unmapped: unmapped }
      );
      showAllButton.hidden = sorted.length <= INITIAL_LIMIT;
      showAllButton.setAttribute("aria-expanded", String(showAll));
      showAllButton.querySelector("span").textContent = showAll
        ? i18n("skills_progress_show_less", "Show fewer capabilities")
        : i18n("skills_progress_show_all", "Show all capabilities");
      showAllButton.querySelector("i").className = "ph-light " + (showAll ? "ph-arrow-up" : "ph-arrow-down");
    }

    if (sort) sort.addEventListener("change", render);
    showAllButton.addEventListener("click", function () {
      showAll = !showAll;
      render();
      showAllButton.focus();
    });
    var profileSelect = doc.getElementById("profileSelect");
    if (profileSelect) profileSelect.addEventListener("change", render);
    doc.addEventListener("sitelang:change", render);
    if (progressApi && progressApi.onChange) progressApi.onChange(render);
    render();
  }

  return {
    STAGES: STAGES,
    phaseId: phaseId,
    mergeCapabilities: mergeCapabilities,
    lessonFraction: lessonFraction,
    pathsForStage: pathsForStage,
    capabilityProgress: capabilityProgress,
    allProgress: allProgress,
    overallProgress: overallProgress,
    sortProgress: sortProgress,
    mount: mount
  };
});
