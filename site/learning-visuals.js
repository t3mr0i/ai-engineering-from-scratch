(function (root, factory) {
  "use strict";

  var api = factory(root || {});
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LearningVisuals = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var MAX_LESSON_STEPS = 6;

  function text(key, fallback, vars) {
    var dict = root.SITE_I18N || {};
    var lang = root.SiteLang && root.SiteLang.get ? root.SiteLang.get() : "en";
    var entry = dict[key];
    var value = entry ? (entry[lang] || entry.en || fallback) : fallback;
    Object.keys(vars || {}).forEach(function (name) {
      value = value.replace(new RegExp("\\{" + name + "\\}", "g"), String(vars[name]));
    });
    return value;
  }

  function cleanLabel(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function selectMilestones(items, limit) {
    var source = (items || []).filter(Boolean);
    var max = Math.max(2, Number(limit) || MAX_LESSON_STEPS);
    if (source.length <= max) return source.slice();

    var selected = [source[0]];
    var stride = (source.length - 1) / (max - 1);
    for (var i = 1; i < max - 1; i += 1) {
      selected.push(source[Math.round(i * stride)]);
    }
    selected.push(source[source.length - 1]);
    return selected.filter(function (item, index, all) {
      return all.indexOf(item) === index;
    });
  }

  function lessonSections(article) {
    if (!article || !article.querySelectorAll) return [];
    var ignored = /^(learning objectives|lernziele|further reading|weiterführende literatur|references|referenzen|quiz)$/i;
    var headings = Array.prototype.slice.call(article.querySelectorAll("h2[id]"))
      .filter(function (heading) {
        return !heading.closest("[data-learning-visual]") && !ignored.test(cleanLabel(heading.textContent));
      })
      .map(function (heading) {
        return { id: heading.id, label: cleanLabel(heading.textContent), element: heading };
      });
    return selectMilestones(headings, MAX_LESSON_STEPS);
  }

  function phaseStats(allRows, visibleRows) {
    var byPhase = {};
    (allRows || []).forEach(function (row) {
      var key = String(row.phase);
      if (!byPhase[key]) byPhase[key] = { id: row.phase, name: row.phaseName || key, total: 0, visible: 0 };
      byPhase[key].total += 1;
    });
    (visibleRows || []).forEach(function (row) {
      var key = String(row.phase);
      if (!byPhase[key]) byPhase[key] = { id: row.phase, name: row.phaseName || key, total: 0, visible: 0 };
      byPhase[key].visible += 1;
    });
    return Object.keys(byPhase).map(function (key) { return byPhase[key]; }).sort(function (a, b) {
      return Number(a.id) - Number(b.id);
    });
  }

  function capabilityClusters(rows) {
    var clusters = [];
    var byName = {};
    (rows || []).forEach(function (row) {
      var name = cleanLabel(row.cluster) || text("viz_assessment_other", "Other");
      if (!byName[name]) {
        byName[name] = { name: name, met: 0, count: 0 };
        clusters.push(byName[name]);
      }
      var current = Math.max(0, Math.min(3, Number(row.current) || 0));
      var target = Math.max(0, Math.min(3, Number(row.target) || 0));
      if (target > 0 && current >= target) byName[name].met += 1;
      byName[name].count += 1;
    });
    return clusters.map(function (cluster) {
      return {
        name: cluster.name,
        met: cluster.met,
        percent: cluster.count ? Math.round(cluster.met / cluster.count * 100) : 0,
        count: cluster.count
      };
    });
  }

  function makeHeader(title, description, headingTag) {
    var header = document.createElement("header");
    header.className = "learning-visual__header";
    var heading = document.createElement(headingTag || "h2");
    heading.className = "learning-visual__title";
    heading.textContent = title;
    var copy = document.createElement("p");
    copy.className = "learning-visual__description";
    copy.textContent = description;
    header.append(heading, copy);
    return header;
  }

  function stepState(label) {
    var value = cleanLabel(label).toLowerCase();
    if (/build|implement|construct|entwick|bauen/.test(value)) return "build";
    if (/use|apply|practice|anwenden|nutzen/.test(value)) return "use";
    if (/ship|deploy|deliver|publish|ausliefer|bereitstell/.test(value)) return "ship";
    return "learn";
  }

  function renderLessonRoute(article) {
    if (!article || !document.createElement) return null;
    var steps = lessonSections(article);
    if (steps.length < 2) return null;

    var nav = document.createElement("nav");
    nav.className = "learning-visual learning-visual--lesson";
    nav.dataset.learningVisual = "lesson-route";
    nav.setAttribute("aria-label", text("viz_lesson_title", "Lesson route"));
    nav.appendChild(makeHeader(
      text("viz_lesson_title", "Lesson route"),
      text("viz_lesson_desc", "See the concepts in sequence and jump to any section."),
      "p"
    ));

    var list = document.createElement("ol");
    list.className = "learning-route";
    list.style.setProperty("--route-columns", String(steps.length));
    steps.forEach(function (step, index) {
      var item = document.createElement("li");
      item.className = "learning-route__step";
      item.dataset.kind = stepState(step.label);
      var link = document.createElement("a");
      link.href = "#" + step.id;
      link.dataset.routeTarget = step.id;
      if (index === 0) link.setAttribute("aria-current", "location");
      var marker = document.createElement("span");
      marker.className = "learning-route__marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = String(index + 1).padStart(2, "0");
      var label = document.createElement("span");
      label.className = "learning-route__label";
      label.textContent = step.label;
      link.append(marker, label);
      item.appendChild(link);
      list.appendChild(item);
    });
    nav.appendChild(list);

    var anchor = article.querySelector(".lesson-meta") || article.querySelector(".learning-objectives") || article.querySelector(".motto") || article.querySelector("h1");
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(nav, anchor.nextSibling);
    else article.insertBefore(nav, article.firstChild);

    bindLessonProgress(nav, steps);
    return nav;
  }

  function bindLessonProgress(nav, steps) {
    if (!root.IntersectionObserver) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("[data-route-target]"));
    function mark(id) {
      links.forEach(function (link) {
        if (link.dataset.routeTarget === id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    var observer = new root.IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; }).sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      if (visible[0]) mark(visible[0].target.id);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
    steps.forEach(function (step) { if (step.element) observer.observe(step.element); });
  }

  function renderCourseRoute(host, units, options) {
    if (!host || !document.createElement) return null;
    host.textContent = "";
    var opts = options || {};
    var section = document.createElement("section");
    section.className = "learning-visual learning-visual--course";
    section.dataset.learningVisual = "course-route";
    section.appendChild(makeHeader(
      opts.title || text("viz_course_title", "Course route"),
      opts.description || text("viz_course_desc", "Move through the units in order; progress reflects your reading depth.")
    ));
    var list = document.createElement("ol");
    list.className = "course-route";
    (units || []).forEach(function (unit, index) {
      var item = document.createElement("li");
      item.className = "course-route__unit";
      item.dataset.state = unit.state || "open";
      var link = document.createElement("a");
      link.href = unit.href || "#";
      var marker = document.createElement("span");
      marker.className = "course-route__marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = cleanLabel(unit.code) || String(index + 1).padStart(2, "0");
      var copy = document.createElement("span");
      copy.className = "course-route__copy";
      var title = document.createElement("strong");
      title.textContent = cleanLabel(unit.title);
      var meta = document.createElement("small");
      meta.textContent = text("viz_unit_meta", "{count} activities · {percent}%", {
        count: unit.count || 0,
        percent: Math.round(Number(unit.percent) || 0)
      });
      var track = document.createElement("span");
      track.className = "course-route__track";
      track.setAttribute("aria-hidden", "true");
      var fill = document.createElement("span");
      fill.style.width = Math.max(0, Math.min(100, Number(unit.percent) || 0)) + "%";
      track.appendChild(fill);
      copy.append(title, meta, track);
      link.append(marker, copy);
      item.appendChild(link);
      list.appendChild(item);
    });
    section.appendChild(list);
    host.appendChild(section);
    return section;
  }

  function renderPhaseChart(host, allRows, visibleRows, options) {
    if (!host || !document.createElement) return null;
    host.textContent = "";
    var opts = options || {};
    var stats = phaseStats(allRows, visibleRows);
    if (!stats.length) return null;
    var max = stats.reduce(function (value, row) { return Math.max(value, row.total); }, 1);
    var section = document.createElement("section");
    section.className = "learning-visual learning-visual--phases";
    section.dataset.learningVisual = "phase-chart";
    section.appendChild(makeHeader(
      opts.title || text("viz_catalog_title", "Curriculum distribution"),
      opts.description || text("viz_catalog_desc", "Each bar is a phase. The blue fill shows the lessons matching your filters.")
    ));
    var chart = document.createElement("ol");
    chart.className = "phase-chart";
    chart.style.setProperty("--phase-count", String(stats.length));
    stats.forEach(function (phase) {
      var item = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "phase-chart__button";
      button.title = String(phase.id).padStart(2, "0") + " · " + phase.name;
      button.setAttribute("aria-label", text("viz_phase_label", "Phase {phase}: {visible} of {total} lessons", {
        phase: phase.name, visible: phase.visible, total: phase.total
      }));
      button.setAttribute("aria-pressed", String(String(opts.selectedPhase || "") === String(phase.id)));
      var value = document.createElement("strong");
      value.textContent = String(phase.visible);
      var plot = document.createElement("span");
      plot.className = "phase-chart__plot";
      plot.setAttribute("aria-hidden", "true");
      var totalBar = document.createElement("span");
      totalBar.className = "phase-chart__total";
      totalBar.style.height = Math.max(8, Math.round((phase.total / max) * 100)) + "%";
      var visibleBar = document.createElement("span");
      visibleBar.className = "phase-chart__visible";
      visibleBar.style.height = Math.round((phase.visible / max) * 100) + "%";
      plot.append(totalBar, visibleBar);
      var label = document.createElement("span");
      label.className = "phase-chart__label";
      label.textContent = String(phase.id).padStart(2, "0");
      button.append(value, plot, label);
      if (typeof opts.onSelect === "function") {
        button.addEventListener("click", function () { opts.onSelect(phase.id); });
      }
      item.appendChild(button);
      chart.appendChild(item);
    });
    section.appendChild(chart);
    host.appendChild(section);
    return section;
  }

  function renderCapabilityProfile(host, rows, options) {
    if (!host || !document.createElement) return null;
    host.textContent = "";
    var opts = options || {};
    var clusters = capabilityClusters(rows);
    if (!clusters.length) return null;
    var section = document.createElement("section");
    section.className = "learning-visual learning-visual--capabilities";
    section.dataset.learningVisual = "capability-profile";
    section.appendChild(makeHeader(
      opts.title || text("viz_assessment_title", "Capability profile"),
      opts.description || text("viz_assessment_desc", "Current ratings are shown against the target profile for your role.")
    ));
    var legend = document.createElement("div");
    legend.className = "capability-profile__legend";
    var legendItem = document.createElement("span");
    legendItem.textContent = text("viz_assessment_met", "Role targets met");
    legend.appendChild(legendItem);
    var list = document.createElement("ol");
    list.className = "capability-profile";
    clusters.forEach(function (cluster) {
      var item = document.createElement("li");
      var label = document.createElement("strong");
      label.textContent = cluster.name;
      var values = document.createElement("span");
      values.className = "capability-profile__values";
      values.textContent = text("viz_assessment_met_count", "{met} / {total} targets", {
        met: cluster.met, total: cluster.count
      });
      var plot = document.createElement("span");
      plot.className = "capability-profile__plot";
      plot.setAttribute("role", "img");
      plot.setAttribute("aria-label", text("viz_capability_label", "{name}: {met} of {total} role targets met", {
        name: cluster.name, met: cluster.met, total: cluster.count
      }));
      var current = document.createElement("span");
      current.className = "capability-profile__current";
      current.style.width = cluster.percent + "%";
      plot.appendChild(current);
      item.append(label, values, plot);
      list.appendChild(item);
    });
    section.append(legend, list);
    host.appendChild(section);
    return section;
  }

  return {
    renderLessonRoute: renderLessonRoute,
    renderCourseRoute: renderCourseRoute,
    renderPhaseChart: renderPhaseChart,
    renderCapabilityProfile: renderCapabilityProfile,
    _test: {
      selectMilestones: selectMilestones,
      phaseStats: phaseStats,
      capabilityClusters: capabilityClusters
    }
  };
});
