/**
 * Capability progress for the LRN cockpit.
 *
 * The calculation consumes an explicit capability-to-course evidence matrix.
 * Curriculum phases and course audience tags are deliberately not inferred as
 * capability evidence. Lesson progress remains owned by progress.js.
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

  function unique(values) {
    var seen = {};
    return (values || []).filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function average(values) {
    return values.length
      ? Math.round(values.reduce(function (sum, value) { return sum + value; }, 0) / values.length)
      : 0;
  }

  function targetIndex(target) {
    for (var i = 0; i < STAGES.length; i++) {
      if (STAGES[i].name === target) return i;
    }
    return -1;
  }

  function lessonFraction(progressState, path) {
    var lesson = progressState && progressState.lessons && progressState.lessons[path];
    if (!lesson) return 0;
    if (lesson.completedAt) return 1;
    var read = Number(lesson.readPct) || 0;
    return Math.max(0, Math.min(1, read >= 0.9 ? 1 : read));
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
        description: detail.description || "",
        levels: detail.levels || {}
      };
    });
  }

  function lessonPaths(courseId, courseMaps) {
    var paths = [];
    ((courseMaps && courseMaps[courseId]) || []).forEach(function (unit) {
      (unit.lessons || []).forEach(function (lesson) {
        if (lesson.path) paths.push(lesson.path);
      });
    });
    return unique(paths);
  }

  /**
   * Builds the complete read-only view model behind one small test seam.
   * Each course is calculated once, then reused by every capability it proves.
   */
  function createModel(options) {
    options = options || {};
    var capabilities = mergeCapabilities(options.catalogCapabilities, options.detailedCapabilities);
    var courseById = {};
    var courseProgressById = {};
    var evidence = options.evidence || {};
    var courseMaps = options.courseMaps || {};
    var progressState = options.progressState || { lessons: {} };
    var profileId = options.profileId || "tc";

    (options.courses || []).forEach(function (course) {
      courseById[course.id] = course;
    });

    function courseProgress(courseId) {
      if (courseProgressById[courseId]) return courseProgressById[courseId];
      var course = courseById[courseId];
      var paths = lessonPaths(courseId, courseMaps);
      var result = {
        id: courseId,
        title: course ? course.title : courseId,
        available: !!course,
        lessonPaths: paths,
        lessonCount: paths.length,
        percent: paths.length ? average(paths.map(function (path) {
          return lessonFraction(progressState, path) * 100;
        })) : 0
      };
      courseProgressById[courseId] = result;
      return result;
    }

    var items = capabilities.filter(function (capability) {
      return targetIndex(capability.targets && capability.targets[profileId]) >= 0;
    }).map(function (capability) {
      var target = capability.targets[profileId];
      var goalIndex = targetIndex(target);
      var capabilityEvidence = evidence[capability.id] || {};
      var stages = STAGES.map(function (stage, index) {
        var ids = unique(capabilityEvidence[stage.name] || []);
        var courses = ids.map(courseProgress);
        var paths = unique([].concat.apply([], courses.map(function (course) {
          return course.lessonPaths;
        })));
        var hasEvidence = courses.length > 0 && courses.every(function (course) {
          return course.available && course.lessonCount > 0;
        });
        return {
          name: stage.name,
          sourceLevel: stage.sourceLevel,
          description: capability.levels && capability.levels[stage.sourceLevel] || "",
          courses: courses,
          courseCount: courses.length,
          lessonCount: paths.length,
          percent: courses.length ? average(courses.map(function (course) { return course.percent; })) : 0,
          hasEvidence: hasEvidence,
          inTarget: index <= goalIndex
        };
      });
      var targetStages = stages.slice(0, goalIndex + 1);
      var targetCourses = unique([].concat.apply([], targetStages.map(function (stage) {
        return stage.courses.map(function (course) { return course.id; });
      })));
      return {
        id: capability.id,
        cluster: capability.cluster,
        title: capability.title,
        description: capability.description,
        target: target,
        targetIndex: goalIndex,
        stages: stages,
        percent: average(targetStages.map(function (stage) { return stage.percent; })),
        tracked: targetStages.some(function (stage) { return stage.hasEvidence; }),
        fullyMapped: targetStages.every(function (stage) { return stage.hasEvidence; }),
        targetCourseCount: targetCourses.length
      };
    });

    return {
      items: items,
      totalPercent: average(items.map(function (item) { return item.percent; })),
      trackedCount: items.filter(function (item) { return item.fullyMapped; }).length,
      unmappedCount: items.filter(function (item) { return !item.fullyMapped; }).length
    };
  }

  function sortItems(items, mode) {
    return (items || []).slice().sort(function (a, b) {
      if (mode === "name") return a.title.localeCompare(b.title);
      if (mode === "order") return a.id - b.id;
      if (a.fullyMapped !== b.fullyMapped) return a.fullyMapped ? -1 : 1;
      if (b.percent !== a.percent) return b.percent - a.percent;
      return a.id - b.id;
    });
  }

  function mount(doc) {
    var section = doc.getElementById("skillsProgress");
    if (!section) return;

    var data = (typeof window !== "undefined" && window.LrnData) || {};
    var curriculum = (typeof window !== "undefined" && window.LrnCurriculumMap) || {};
    var evidence = (typeof window !== "undefined" && window.AIFSCapabilityEvidence) || {};
    var progressApi = (typeof window !== "undefined" && window.AIFSProgress) || null;
    var detailed = typeof CAPABILITIES !== "undefined" ? CAPABILITIES : [];
    var list = doc.getElementById("skillsProgressList");
    var total = doc.getElementById("skillsProgressTotal");
    var coverage = doc.getElementById("skillsProgressCoverage");
    var sort = doc.getElementById("skillsProgressSort");
    var showAllButton = doc.getElementById("skillsProgressShowAll");
    var profileSelect = doc.getElementById("capabilityProfileSelect");
    var groupList = doc.getElementById("capabilityGroupList");
    var groupReset = doc.getElementById("capabilityGroupReset");
    var expanded = {};
    var showAll = false;
    var activeCluster = "";
    var cockpitStore = "lhind:lrn-cockpit:v3";

    function i18n(key, fallback, vars) {
      var dict = (typeof window !== "undefined" && window.SITE_I18N) || {};
      var lang = typeof window !== "undefined" && window.SiteLang ? window.SiteLang.get() : "en";
      var entry = dict[key];
      var output = entry && (entry[lang] != null ? entry[lang] : entry.en);
      output = output == null ? fallback : output;
      Object.keys(vars || {}).forEach(function (name) {
        output = output.split("{" + name + "}").join(String(vars[name]));
      });
      return output;
    }

    function currentProfileId() {
      if (profileSelect && profileSelect.value) return profileSelect.value;
      return (data.profiles || []).some(function (profile) { return profile.id === "tc"; }) ? "tc" : (data.profiles[0] && data.profiles[0].id || "tc");
    }

    function storedProfileId() {
      try {
        var saved = JSON.parse(window.localStorage.getItem(cockpitStore));
        if (saved && (data.profiles || []).some(function (profile) { return profile.id === saved.profileId; })) {
          return saved.profileId;
        }
      } catch (error) {}
      return (data.profiles || []).some(function (profile) { return profile.id === "tc"; }) ? "tc" : (data.profiles[0] && data.profiles[0].id || "tc");
    }

    function saveProfileId(profileId) {
      try {
        var saved = JSON.parse(window.localStorage.getItem(cockpitStore)) || {};
        saved.profileId = profileId;
        window.localStorage.setItem(cockpitStore, JSON.stringify(saved));
      } catch (error) {}
    }

    function populateProfileSelect() {
      if (!profileSelect) return;
      (data.profiles || []).forEach(function (profile) {
        var option = element("option", "", profile.label);
        option.value = profile.id;
        profileSelect.appendChild(option);
      });
      profileSelect.value = storedProfileId();
    }

    function element(tag, className, content) {
      var node = doc.createElement(tag);
      if (className) node.className = className;
      if (content != null) node.textContent = content;
      return node;
    }

    function appendParagraphs(parent, text) {
      String(text || "").split(/\n\s*\n/).filter(Boolean).forEach(function (block) {
        parent.appendChild(element("p", "", block));
      });
    }

    function shortDescription(text) {
      var first = String(text || "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/)[0] || "";
      return first.length > 180 ? first.slice(0, 177).trimEnd() + "…" : first;
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

    function progressMeter(percent, className, label) {
      var meter = element("span", className);
      meter.setAttribute("role", "progressbar");
      meter.setAttribute("aria-label", label);
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", "100");
      meter.setAttribute("aria-valuenow", String(percent));
      var fill = element("i");
      fill.style.transform = "scaleX(" + (percent / 100) + ")";
      meter.appendChild(fill);
      return meter;
    }

    function overviewCard(item) {
      var card = element("section", "skill-overview");
      card.setAttribute("aria-labelledby", "skillOverviewTitle" + item.id);
      var icon = element("span", "skill-overview__icon");
      var glyph = element("i", "ph-light ph-" + (CLUSTER_ICONS[item.cluster] || "star"));
      glyph.setAttribute("aria-hidden", "true");
      icon.appendChild(glyph);
      var copy = element("div", "skill-overview__copy");
      var heading = element("h3", "", i18n("skills_progress_about", "What this capability covers"));
      heading.id = "skillOverviewTitle" + item.id;
      copy.appendChild(heading);
      appendParagraphs(copy, item.description);
      var note = element("p", "skill-overview__note", i18n(
        "skills_progress_evidence_note",
        "Only the courses shown below contribute to this capability."
      ));
      card.append(icon, copy, note);
      return card;
    }

    function courseEvidence(course, stage, item) {
      var li = element("li", "skill-course");
      var link = element("a", "interactive-surface skill-course__link");
      link.href = "lrn/course.html?id=" + encodeURIComponent(course.id);
      link.setAttribute("aria-label", i18n(
        "skills_progress_open_course",
        "Open {title}: {percent}% complete",
        { title: course.title, percent: course.percent }
      ));
      var identity = element("span", "skill-course__identity");
      identity.appendChild(element("small", "", course.id));
      identity.appendChild(element("strong", "", course.title));
      var metric = element("span", "skill-course__metric", course.percent + "%");
      metric.setAttribute("aria-hidden", "true");
      var arrow = element("i", "ph-light ph-arrow-up-right");
      arrow.setAttribute("aria-hidden", "true");
      link.append(identity, metric, arrow);
      li.appendChild(link);
      li.appendChild(progressMeter(
        course.percent,
        "skill-course__meter",
        course.title + " — " + stage.name + " — " + item.title
      ));
      return li;
    }

    function stagePanel(stage, index, item) {
      var panel = element("li", "skill-level");
      panel.dataset.level = stage.name.toLowerCase();
      if (stage.inTarget) panel.dataset.inTarget = "true";
      if (index === item.targetIndex) panel.dataset.target = "true";

      var head = element("div", "skill-level__head");
      head.appendChild(element("span", "skill-level__index", "0" + (index + 1)));
      head.appendChild(element("h4", "", stage.name));
      if (index === item.targetIndex) {
        head.appendChild(element("span", "skill-level__target", i18n("skills_progress_target", "Target")));
      }
      head.appendChild(element("strong", "", stage.percent + "%"));
      panel.appendChild(head);
      panel.appendChild(progressMeter(
        stage.percent,
        "skill-level__meter",
        stage.name + " — " + item.title
      ));

      var courseLabel = stage.courseCount === 1
        ? i18n("skills_progress_one_course", "1 contributing course")
        : i18n("skills_progress_courses", "{count} contributing courses", { count: stage.courseCount });
      panel.appendChild(element("p", "skill-level__meta", courseLabel));

      if (stage.courses.length) {
        var courses = element("ul", "skill-level__courses");
        stage.courses.forEach(function (course) {
          courses.appendChild(courseEvidence(course, stage, item));
        });
        panel.appendChild(courses);
      } else {
        panel.appendChild(element(
          "p",
          "skill-level__empty",
          i18n("skills_progress_no_lessons", "No course mapped yet")
        ));
      }

      if (stage.description) {
        var definition = element("details", "skill-level__definition");
        definition.appendChild(element(
          "summary",
          "",
          i18n("skills_progress_level_definition", "What this level means")
        ));
        definition.appendChild(levelDescription(stage.description));
        panel.appendChild(definition);
      }
      return panel;
    }

    function detailPanel(item) {
      var detail = element("div", "skill-track__details");
      detail.id = "skillDetails" + item.id;
      detail.hidden = !expanded[item.id];
      if (item.description) detail.appendChild(overviewCard(item));
      var heading = element("div", "skill-levels__heading");
      heading.appendChild(element("h3", "", i18n("skills_progress_path_title", "Your level path")));
      heading.appendChild(element(
        "p",
        "",
        i18n("skills_progress_path_intro", "Course progress is averaged within each level and then towards your role target.")
      ));
      detail.appendChild(heading);
      var levels = element("ol", "skill-levels");
      item.stages.forEach(function (stage, index) {
        levels.appendChild(stagePanel(stage, index, item));
      });
      detail.appendChild(levels);
      return detail;
    }

    function skillRow(item) {
      var li = element("li", "skill-track");
      if (!item.fullyMapped) li.dataset.unmapped = "true";
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
      identity.appendChild(element("small", "skill-track__cluster", item.cluster));
      identity.appendChild(element("span", "skill-track__description", shortDescription(item.description)));

      var visual = element("span", "skill-track__visual");
      var rail = element("span", "skill-track__rail");
      rail.setAttribute("role", "img");
      rail.setAttribute("aria-label", item.title + ": " + item.percent + "%");
      item.stages.forEach(function (stage, index) {
        var segment = element("span", "skill-track__segment");
        segment.dataset.level = stage.name.toLowerCase();
        segment.dataset.target = String(stage.inTarget);
        if (!stage.hasEvidence) segment.dataset.empty = "true";
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
      metric.appendChild(element("small", "", item.fullyMapped
        ? i18n("skills_progress_evidence_courses", "{count} courses", { count: item.targetCourseCount })
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

    function renderGroupNavigation(model) {
      if (!groupList) return;
      var lang = typeof window !== "undefined" && window.SiteLang ? window.SiteLang.get() : "en";
      var counts = {};
      model.items.forEach(function (item) { counts[item.cluster] = (counts[item.cluster] || 0) + 1; });
      var groups = data.capabilityGroups || [];
      groupList.replaceChildren.apply(groupList, groups.map(function (group) {
        var button = element("button", "capability-group");
        button.type = "button";
        button.setAttribute("aria-pressed", String(activeCluster === group.cluster));
        button.dataset.active = String(activeCluster === group.cluster);
        var icon = element("span", "capability-group__icon");
        var glyph = element("i", "ph-light ph-" + (group.icon || CLUSTER_ICONS[group.cluster] || "star"));
        glyph.setAttribute("aria-hidden", "true");
        icon.appendChild(glyph);
        var copy = element("span", "capability-group__copy");
        copy.appendChild(element("strong", "", lang === "de" ? group.labelDe : group.label));
        copy.appendChild(element("span", "", lang === "de" ? group.descriptionDe : group.description));
        copy.appendChild(element("small", "", i18n("capability_groups_count", "{count} capabilities", { count: counts[group.cluster] || 0 })));
        button.append(icon, copy);
        button.addEventListener("click", function () {
          activeCluster = activeCluster === group.cluster ? "" : group.cluster;
          showAll = Boolean(activeCluster);
          render();
        });
        return button;
      }));
      if (groupReset) groupReset.setAttribute("aria-pressed", String(!activeCluster));
    }

    function render() {
      var model = createModel({
        catalogCapabilities: data.capabilities || [],
        detailedCapabilities: detailed,
        evidence: evidence,
        courses: data.courses || [],
        courseMaps: curriculum.courseMaps || {},
        progressState: progressApi && progressApi.getState ? progressApi.getState() : { lessons: {} },
        profileId: currentProfileId()
      });
      if (!model.items.length) {
        section.hidden = true;
        return;
      }
      section.hidden = false;
      renderGroupNavigation(model);
      var scoped = activeCluster ? model.items.filter(function (item) { return item.cluster === activeCluster; }) : model.items;
      var sorted = sortItems(scoped, sort ? sort.value : "progress");
      var shown = showAll ? sorted : sorted.slice(0, INITIAL_LIMIT);
      list.replaceChildren.apply(list, shown.map(skillRow));
      total.textContent = model.totalPercent + "%";
      coverage.textContent = i18n(
        "skills_progress_coverage",
        "{tracked} linked · {unmapped} awaiting courses",
        { tracked: model.trackedCount, unmapped: model.unmappedCount }
      );
      showAllButton.hidden = sorted.length <= INITIAL_LIMIT;
      showAllButton.setAttribute("aria-expanded", String(showAll));
      showAllButton.querySelector("span").textContent = showAll
        ? i18n("skills_progress_show_less", "Show fewer capabilities")
        : i18n("skills_progress_show_all", "Show all capabilities");
      showAllButton.querySelector("i").className = "ph-light " + (showAll ? "ph-arrow-up" : "ph-arrow-down");
    }

    if (sort) sort.addEventListener("change", render);
    populateProfileSelect();
    if (profileSelect) profileSelect.addEventListener("change", function () {
      saveProfileId(profileSelect.value);
      expanded = {};
      render();
    });
    if (groupReset) groupReset.addEventListener("click", function () {
      activeCluster = "";
      showAll = false;
      render();
    });
    showAllButton.addEventListener("click", function () {
      showAll = !showAll;
      render();
      showAllButton.focus();
    });
    doc.addEventListener("sitelang:change", render);
    if (progressApi && progressApi.onChange) progressApi.onChange(render);
    render();
  }

  return {
    createModel: createModel,
    mount: mount
  };
});
