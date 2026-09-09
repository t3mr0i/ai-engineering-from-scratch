(function (root) {
  "use strict";

  var mounted = [];
  var levelLegendSequence = 0;
  var COPY = {
    en: {
      title: "Your learning journey",
      courseEvidence: "Course contributions in detail",
      moreTools: "Adapt your learning plan",
      role: "Role",
      chooseRole: "Choose your role",
      chooseRoleReason: "Choose a role to view the target profile that matches your work.",
      target: "Guidance for your role",
      targetIntro: "These levels provide guidance for your role. You can choose which area to focus on.",
      focus: "Focus area",
      focusAll: "Show all areas equally",
      targetReference: "Target from the AI Literacy reference",
      targetImported: "Target from your imported assessment",
      targetChanged: "Your imported assessment uses a different target for this role. It is shown here without changing the reference target.",
      next: "Your next step",
      assessment: "Import your assessment result",
      assessmentReason: "Complete the official self-assessment in SharePoint, then import your result PDF so we can show the right next course.",
      plan: "Build your personal plan",
      planReason: "Turn your open capability gaps into an editable course sequence.",
      progress: "View capability progress",
      progressReason: "Review your current position and evidence before choosing your next learning goal.",
      open: "Open course",
      continue: "Continue course",
      journey: "Your journey",
      complete: "Completed",
      current: "Current",
      upcoming: "Upcoming",
      unknown: "Assessment needed",
      gap: "Open gap",
      evidenced: "Evidence recorded",
      selfAssessed: "Self-assessed",
      notRelevant: "Not relevant",
      preparation: "Preparation needed",
      unavailable: "Not available",
      sourceImport: "From imported assessment",
      sourceSelf: "From imported assessment",
      sourceEvidence: "From learning evidence",
      unknownTarget: "Complete the official Self-Assessment in SharePoint and import your result PDF to see your starting point.",
      targetValue: "Target: {target}",
      referenceValue: "Reference target: {target}",
      fromTo: "{current} to {target}",
      noCourse: "Your next course will appear here once your learning path is ready.",
      blockedReason: "Your learning path still has preparatory or unavailable steps. Open your plan to review them.",
      provisional: "Recommendations are based on the information available in this browser.",
      browse: "Browse all courses",
      academy: "Further recommendation",
      academyReady: "Continue with LHIND Academy",
      academyPreparation: "Discuss with LHIND Academy",
      academyNoSession: "Offered through LHIND Academy; dates and participation are arranged there.",
      academyTtt: "After completing this path, the LHIND Academy can advise on suitable Train-the-Trainer formats.",
      assessmentPanel: "Import an existing assessment",
      levelLegend: "How to read the level bars",
      levelLegendTitle: "Levels and colours",
      levelAcquire: "Build foundations.",
      levelDeepen: "Deepen in your work context.",
      levelCreate: "Design and share.",
      levelTarget: "Light blue: part of the target for your role.",
      levelCurrent: "Dark blue: your current level from an assessment or learning evidence.",
      levelNext: "Outline: your next level on the way to the target.",
      levelMuted: "Grey: outside your role target or not relevant."
    },
    de: {
      title: "Deine Lernreise",
      courseEvidence: "Kursbeiträge im Detail",
      moreTools: "Lernplan anpassen",
      role: "Rolle",
      chooseRole: "Rolle auswählen",
      chooseRoleReason: "Wähle eine Rolle, um das passende Zielbild für deine Arbeit zu sehen.",
      target: "Orientierung für deine Rolle",
      targetIntro: "Diese Kompetenzstufen geben dir Orientierung für deine Rolle. Du kannst selbst wählen, welchen Bereich du vertiefen möchtest.",
      focus: "Schwerpunkt setzen",
      focusAll: "Alle Bereiche gleich anzeigen",
      targetReference: "Zielbild aus der AI-Literacy-Referenz",
      targetImported: "Zielbild aus deinem importierten Assessment",
      targetChanged: "Dein importiertes Assessment nutzt für diese Rolle ein abweichendes Ziel. Es wird hier sichtbar gemacht, ohne das Referenz-Zielbild zu ändern.",
      next: "Dein nächster Schritt",
      assessment: "Assessment-Ergebnis übernehmen",
      assessmentReason: "Führe das offizielle Self-Assessment in SharePoint durch und importiere danach deine Ergebnis-PDF, damit wir den passenden nächsten Kurs zeigen können.",
      plan: "Persönlichen Plan erstellen",
      planReason: "Mache aus offenen Kompetenzlücken eine bearbeitbare Kursfolge.",
      progress: "Fähigkeitenfortschritt ansehen",
      progressReason: "Prüfe deinen Ist-Stand und deine Nachweise, bevor du dein nächstes Lernziel wählst.",
      open: "Kurs öffnen",
      continue: "Kurs fortsetzen",
      journey: "Deine Etappen",
      complete: "Abgeschlossen",
      current: "Aktuell",
      upcoming: "Als Nächstes",
      unknown: "Assessment offen",
      gap: "Lücke offen",
      evidenced: "Nachweis erfasst",
      selfAssessed: "Selbsteingeschätzt",
      notRelevant: "Nicht relevant",
      preparation: "Vorbereitung offen",
      unavailable: "Nicht verfügbar",
      sourceImport: "Aus importiertem Assessment",
      sourceSelf: "Aus importiertem Assessment",
      sourceEvidence: "Aus Lernnachweisen",
      unknownTarget: "Führe das offizielle Self-Assessment in SharePoint durch und importiere deine Ergebnis-PDF, um deinen Ausgangspunkt zu sehen.",
      targetValue: "Ziel: {target}",
      referenceValue: "Referenzziel: {target}",
      fromTo: "{current} zu {target}",
      noCourse: "Sobald dein Lernweg bereit ist, erscheint hier dein nächster Kurs.",
      blockedReason: "In deinem Lernweg sind noch vorbereitende oder nicht verfügbare Schritte offen. Prüfe sie in deinem Plan.",
      provisional: "Die Empfehlungen basieren auf den Informationen, die in diesem Browser verfügbar sind.",
      browse: "Alle Kurse durchsuchen",
      academy: "Weitere Empfehlung",
      academyReady: "Mit der LHIND Academy fortsetzen",
      academyPreparation: "Mit der LHIND Academy abstimmen",
      academyNoSession: "Angebot der LHIND Academy; Termine und Teilnahme werden dort abgestimmt.",
      academyTtt: "Nach Abschluss dieses Lernpfads kann die LHIND Academy zu passenden Train-the-Trainer-Formaten beraten.",
      assessmentPanel: "Vorhandenes Assessment importieren",
      levelLegend: "So liest du die Stufenbalken",
      levelLegendTitle: "Stufen und Farben",
      levelAcquire: "Grundlagen aufbauen.",
      levelDeepen: "Im Arbeitskontext vertiefen.",
      levelCreate: "Gestalten und weitergeben.",
      levelTarget: "Hellblau: Teil des Zielbereichs für deine Rolle.",
      levelCurrent: "Dunkelblau: dein aktueller Stand aus Assessment oder Lernnachweisen.",
      levelNext: "Rahmen: deine nächste Stufe auf dem Weg zum Ziel.",
      levelMuted: "Grau: außerhalb des Rollenziels oder nicht relevant."
    }
  };

  function language() { return root.SiteLang && root.SiteLang.get() === "de" ? "de" : "en"; }
  function t(key, values) {
    var text = COPY[language()][key] || COPY.en[key] || key;
    Object.keys(values || {}).forEach(function (name) { text = text.replace("{" + name + "}", values[name] == null ? "–" : String(values[name])); });
    return text;
  }
  function el(name, className, text) {
    var node = root.document.createElement(name);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function icon(name) {
    var node = el("i", "ph-light ph-" + name);
    node.setAttribute("aria-hidden", "true");
    return node;
  }
  function levelRank(value) { return ["Acquire", "Deepen", "Create"].indexOf(value) + 1; }
  function statusText(status) {
    return t({ completed: "complete", "in-progress": "current", current: "current", ready: "upcoming", upcoming: "upcoming", gap: "gap", evidenced: "evidenced", "self-assessed": "selfAssessed", "not-relevant": "notRelevant", unknown: "unknown", "prerequisite-open": "preparation", unavailable: "unavailable" }[status] || "upcoming");
  }
  function clean(value) { return value == null || value === "" ? "–" : String(value); }
  function focused(model, items) {
    var values = Array.isArray(items) ? items.slice() : [];
    if (!model || !model.focusDimensionId) return values;
    return values.sort(function (left, right) {
      return (left.id === model.focusDimensionId ? -1 : right.id === model.focusDimensionId ? 1 : 0);
    });
  }
  function snapshot() {
    var api = root.LrnJourneyState;
    if (!api || typeof api.snapshot !== "function") return null;
    try { return api.snapshot(); } catch (error) { return null; }
  }
  function makeAction(model) {
    var links = model && model.links || {};
    if (model && model.roleSelected === false) return { href: (links.home || "index.html") + "#roleSelect", label: t("chooseRole"), title: t("chooseRole"), reason: t("chooseRoleReason") };
    var next = model && model.next;
    if (next && next.href) return {
      href: next.href,
      label: next.status === "in-progress" ? t("continue") : t("open"),
      title: next.title || t("next"),
      reason: next.reason || (next.dimension ? clean(next.dimension) + " · " + t("fromTo", { current: clean(next.currentLevel), target: clean(next.targetLevel) }) : "")
    };
    if (!model || !model.assessmentAvailable) return { href: links.assessment || "assessment.html", label: t("assessment"), title: t("assessment"), reason: t("assessmentReason") };
    var hasGaps = Array.isArray(model.gaps) && model.gaps.length > 0;
    var hasOpenSteps = Array.isArray(model.steps) && model.steps.some(function (step) { return step.status !== "completed"; });
    if (hasGaps || model.unknownCount > 0 || hasOpenSteps) return { href: links.plan || "personal-plan.html", label: t("plan"), title: t("plan"), reason: hasOpenSteps && !hasGaps && !model.unknownCount ? t("blockedReason") : t("planReason") };
    return { href: links.skills || "skills.html", label: t("progress"), title: t("progress"), reason: t("progressReason") };
  }
  function renderLevelLegend() {
    var legend = el("div", "journey-ui__level-legend");
    var control = el("div", "journey-ui__level-legend-control");
    var id = "journeyLevelLegend" + (++levelLegendSequence);
    var button = el("button", "journey-ui__level-legend-button", t("levelLegend"));
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", id);
    button.appendChild(icon("info"));
    var popover = el("div", "journey-ui__level-legend-popover");
    popover.id = id;
    popover.hidden = true;
    popover.setAttribute("role", "region");
    popover.setAttribute("aria-label", t("levelLegendTitle"));
    popover.appendChild(el("strong", "journey-ui__level-legend-title", t("levelLegendTitle")));
    var levels = el("ul", "journey-ui__level-legend-list");
    [["Acquire", "levelAcquire"], ["Deepen", "levelDeepen"], ["Create", "levelCreate"]].forEach(function (entry) {
      var item = el("li", "");
      item.append(el("strong", "", entry[0]), root.document.createTextNode(" — " + t(entry[1])));
      levels.appendChild(item);
    });
    popover.appendChild(levels);
    var keys = el("ul", "journey-ui__level-legend-keys");
    [["target", "levelTarget"], ["current", "levelCurrent"], ["next", "levelNext"], ["muted", "levelMuted"]].forEach(function (entry) {
      var item = el("li", "");
      var swatch = el("span", "journey-ui__level-legend-swatch");
      swatch.dataset.state = entry[0];
      swatch.setAttribute("aria-hidden", "true");
      item.append(swatch, el("span", "", t(entry[1])));
      keys.appendChild(item);
    });
    popover.appendChild(keys);
    function setOpen(open) {
      legend.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      popover.hidden = !open;
    }
    var pinned = false;
    button.addEventListener("click", function () { pinned = !pinned; setOpen(pinned); });
    control.addEventListener("mouseenter", function () { setOpen(true); });
    control.addEventListener("mouseleave", function () { if (!pinned && !control.matches(":focus-within")) setOpen(false); });
    control.addEventListener("focusin", function () { setOpen(true); });
    control.addEventListener("focusout", function () {
      root.setTimeout(function () { if (!pinned && !control.matches(":hover") && !control.matches(":focus-within")) setOpen(false); }, 0);
    });
    control.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      pinned = false;
      setOpen(false);
      button.focus();
    });
    control.append(button, popover);
    legend.appendChild(control);
    return legend;
  }
  function renderDimensions(model) {
    var list = el("ol", "journey-ui__dimensions");
    focused(model, model.dimensions).slice(0, 5).forEach(function (dimension) {
      var item = el("li", "journey-ui__dimension");
      item.dataset.status = dimension.status || "unknown";
      var top = el("div", "journey-ui__dimension-top");
      var name = el("strong", "journey-ui__dimension-name", dimension.name);
      var state = el("span", "journey-ui__status", statusText(dimension.status));
      top.append(name, state);
      var levels = el("div", "journey-ui__levels");
      ["Acquire", "Deepen", "Create"].forEach(function (level) {
        var marker = el("span", "journey-ui__level", level);
        var targetRank = levelRank(dimension.targetLevel);
        var currentRank = levelRank(dimension.currentLevel);
        if (targetRank && levelRank(level) <= targetRank) marker.dataset.target = "true";
        if (currentRank && levelRank(level) <= currentRank) marker.dataset.current = "true";
        if (dimension.nextLevel === level) marker.dataset.next = "true";
        levels.appendChild(marker);
      });
      var detail = el("p", "journey-ui__dimension-detail");
      if (dimension.status === "not-relevant") detail.textContent = t("notRelevant");
      else if (!dimension.currentLevel) detail.textContent = t("targetValue", { target: clean(dimension.targetLevel) });
      else detail.textContent = t("fromTo", { current: dimension.currentLevel, target: dimension.targetLevel }) + " · " + t("targetValue", { target: clean(dimension.targetLevel) });
      var sourceKey = { "assessment-import": "sourceImport", "self-assessment": "sourceSelf", "learning-evidence": "sourceEvidence" }[dimension.source];
      if (sourceKey) detail.textContent += " · " + t(sourceKey);
      if (model.targetChanged && dimension.referenceTargetLevel && dimension.referenceTargetLevel !== dimension.targetLevel) detail.textContent += " · " + t("referenceValue", { target: dimension.referenceTargetLevel });
      item.append(top, levels, detail);
      list.appendChild(item);
    });
    return list;
  }
  function renderSteps(model) {
    if (!Array.isArray(model.steps) || !model.steps.length) return null;
    var section = el("section", "journey-ui__steps");
    var list = el("ol", "journey-ui__step-list");
    (model.steps || []).slice(0, 5).forEach(function (step) {
      var item = el("li", "journey-ui__step");
      item.dataset.status = step.status || "upcoming";
      var marker = el("span", "journey-ui__step-marker");
      marker.appendChild(icon(step.status === "completed" ? "check" : "book-open"));
      marker.setAttribute("aria-hidden", "true");
      var copy = el("div", "journey-ui__step-copy");
      copy.appendChild(el("strong", "", step.title || step.capability || step.dimension || t("next")));
      var meta = [step.dimension, step.targetLevel].filter(Boolean).join(" · ");
      if (meta) copy.appendChild(el("span", "", meta));
      item.append(marker, copy);
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }
  function renderExternal(model) {
    var recommendations = Array.isArray(model.externalRecommendations) ? model.externalRecommendations : [];
    if (!recommendations.length) return null;
    var section = el("section", "journey-ui__external");
    section.appendChild(el("h3", "journey-ui__subheading", t("academy")));
    var list = el("ul", "journey-ui__external-list");
    recommendations.forEach(function (recommendation) {
      var item = el("li", "journey-ui__external-item");
      var copy = el("div", "journey-ui__external-copy");
      copy.appendChild(el("strong", "", recommendation.title || recommendation.academyCourse));
      var reason = recommendation.reason || (recommendation.academyCourse === "TTT" ? t("academyTtt") : t("academyNoSession"));
      copy.appendChild(el("p", "", reason));
      var action = el("a", "journey-ui__external-action", recommendation.bookingAvailable ? t("academyReady") : t("academyPreparation"));
      action.href = recommendation.href || "#";
      if (/^https?:/i.test(action.href)) { action.target = "_blank"; action.rel = "noopener"; }
      item.append(copy, action); list.appendChild(item);
    });
    section.appendChild(list); return section;
  }
  function renderCourseMatches(model, courseId) {
    if (!courseId) return null;
    var step = (model.steps || []).filter(function (item) { return item.courseId === courseId; })[0];
    if (!step || !Array.isArray(step.matches) || !step.matches.length) return null;
    var section = el("section", "journey-ui__course-matches");
    section.appendChild(el("h3", "journey-ui__subheading", language() === "de" ? "Beitrag zu deinem Zielbild" : "Contribution to your target"));
    var list = el("ul", "journey-ui__match-list");
    step.matches.slice(0, 6).forEach(function (match) {
      var item = el("li", "journey-ui__match");
      var label = [match.dimension, match.capability].filter(Boolean).join(" · ");
      item.appendChild(el("strong", "", label || match.capabilityId || "Capability"));
      if (match.currentLevel || match.targetLevel) item.appendChild(el("span", "", (match.currentLevel || "–") + " → " + (match.targetLevel || "–")));
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }
  function render(host, options) {
    var model = snapshot();
    var de = language() === "de";
    var expanded = !!(host.querySelector(".journey-ui__details[open]"));
    var restoreFocus = root.document.activeElement && root.document.activeElement === host.querySelector(".journey-ui__focus-select");
    host.replaceChildren();
    host.className = "journey-ui" + (options.compact ? " journey-ui--compact" : "");
    host.setAttribute("aria-live", "polite");
    if (!model) {
      host.appendChild(el("p", "journey-ui__loading", language() === "de" ? "Deine Lernreise wird vorbereitet …" : "Preparing your learning journey …"));
      return;
    }
    if (!options.progressOnly && !options.compact) {
      host.appendChild(el("h2", "journey-ui__title", t("title")));
    }
    if (!options.compact) {
      var target = el("section", "journey-ui__target");
      var progressTitle = el(options.progressOnly ? "h2" : "h3", "journey-ui__subheading", de ? "Dein Kompetenzstand" : "Your capability progress");
      progressTitle.prepend(icon("chart-line-up"));
      target.appendChild(progressTitle);
      var dimensions = (model.dimensions || []).filter(function (d) { return d.status !== "not-relevant"; });
      var known = dimensions.filter(function (d) { return !!d.currentLevel; });
      target.appendChild(el("p", "journey-ui__intro", known.length
        ? (de ? "Dein aktueller Stand und die Orientierung für deine Rolle." : "Your current level and guidance for your role.")
        : (de ? "Wo stehst du heute? Eine Selbsteinschätzung macht deine Entwicklung sichtbar." : "Where are you today? A self-assessment makes your development visible.")));
      var overview = el("ul", "journey-ui__overview");
      dimensions.forEach(function (dimension) {
        var row = el("li", "journey-ui__overview-row");
        row.append(el("span", "", dimension.name), el("strong", "", dimension.currentLevel || (de ? "Noch offen" : "Not assessed")));
        overview.appendChild(row);
      });
      if (!options.progressOnly) target.appendChild(overview);
      var assessmentLink = el("a", "journey-ui__text-link", known.length ? (de ? "Assessment-Ergebnis aktualisieren" : "Update imported result") : t("assessment"));
      assessmentLink.href = model.links && model.links.assessment || "assessment.html";
      target.appendChild(assessmentLink);
      var details = el("details", "journey-ui__details");
      details.open = options.progressOnly || expanded;
      details.appendChild(el("summary", "", de ? "Kompetenzstufen und Schwerpunkt" : "Capability levels and focus"));
      details.appendChild(renderLevelLegend());
      details.appendChild(renderDimensions(model));
      var focusField = el("label", "journey-ui__focus");
      focusField.appendChild(el("span", "", t("focus")));
      var select = el("select", "journey-ui__focus-select");
      select.appendChild(new Option(t("focusAll"), ""));
      dimensions.forEach(function (dimension) { select.appendChild(new Option(dimension.name, dimension.id)); });
      select.value = model.focusDimensionId || "";
      select.addEventListener("change", function () {
        if (root.LrnJourneyState && typeof root.LrnJourneyState.setFocus === "function") root.LrnJourneyState.setFocus(select.value);
      });
      focusField.appendChild(select); details.appendChild(focusField);
      if (model.targetChanged) details.appendChild(el("p", "journey-ui__target-changed", de ? "Für dich gelten die Zielstufen aus deinem importierten Assessment." : "Your target levels come from your imported assessment."));
      target.appendChild(details);
      if (!options.progressOnly) {
        var progressLink = el("a", "journey-ui__text-link", de ? "Fortschritt und Nachweise ansehen" : "View progress and evidence");
        progressLink.href = model.links && model.links.skills || "skills.html";
        target.appendChild(progressLink);
      }
      host.appendChild(target);
    }
    if (options.progressOnly) {
      host.classList.add("journey-ui--progress");
      if (restoreFocus) host.querySelector(".journey-ui__focus-select").focus({ preventScroll: true });
      decorateDisclosures();
      return;
    }
    var courseMatches = renderCourseMatches(model, options.courseId);
    if (courseMatches) host.appendChild(courseMatches);
    var action = makeAction(model);
    if (model.next && model.next.activityHref && (options.courseId === model.next.courseId || model.next.status === "in-progress")) {
      action.href = model.next.activityHref;
      action.label = model.next.status === "in-progress" ? t("continue") : language() === "de" ? "Erste Lernaktivität starten" : "Start first learning activity";
    }
    var next = el("section", "journey-ui__next");
    var nextHeading = el("h3", "journey-ui__subheading", t("next"));
    nextHeading.prepend(icon("play-circle"));
    next.appendChild(nextHeading);
    next.appendChild(el("strong", "journey-ui__next-title", action.title));
    if (action.reason) next.appendChild(el("p", "journey-ui__next-reason", action.reason));
    var link = el("a", "journey-ui__action", action.label);
    link.href = action.href;
    next.appendChild(link);
    host.insertBefore(next, host.querySelector(".journey-ui__target"));
    if (!options.compact && model.steps && model.steps.length > 1) {
      var later = el("section", "journey-ui__route");
      var routeHeading = el("h4", "journey-ui__route-heading", de ? "Danach auf deinem Lernweg" : "Next on your learning journey");
      routeHeading.prepend(icon("path"));
      later.appendChild(routeHeading);
      var following = renderSteps(Object.assign({}, model, { steps: model.steps.filter(function (step) { return !model.next || step.courseId !== model.next.courseId; }).slice(0, 2) }));
      if (following) later.appendChild(following);
      next.appendChild(later);
    }
    var external = renderExternal(model);
    if (external) host.appendChild(external);

    var browse = el("a", "journey-ui__browse", t("browse"));
    browse.href = model.links && model.links.catalog || "index.html#trainingCatalogTitle";
    host.appendChild(browse);
    var focusSelect = restoreFocus && host.querySelector(".journey-ui__focus-select");
    if (focusSelect) focusSelect.focus({ preventScroll: true });
    decorateDisclosures();
  }
  function decorateDisclosures() {
    root.document.querySelectorAll(".journey-ui__details > summary, .journey-optional > summary, .page--home .recommendation-settings > summary").forEach(function (summary) {
      if (summary.querySelector(".journey-disclosure__label")) return;
      var label = summary.textContent;
      var name = summary.parentElement.classList.contains("journey-assessment") || summary.dataset.journeyCopy === "assessmentPanel" ? "file-arrow-up" : summary.dataset.journeyCopy === "moreTools" ? "sliders-horizontal" : summary.dataset.journeyCopy === "courseEvidence" ? "certificate" : "sliders-horizontal";
      summary.replaceChildren(icon(name), el("span", "journey-disclosure__label", label), icon("caret-down"));
    });
  }
  function refreshStaticCopy() {
    root.document.querySelectorAll("[data-journey-copy]").forEach(function (node) { node.textContent = t(node.dataset.journeyCopy); });
  }
  function refresh() { refreshStaticCopy(); mounted.forEach(function (entry) { render(entry.host, entry.options); }); }
  function mount(host, options) {
    if (!host || !root.document) return null;
    var entry = { host: host, options: options || {} };
    var existing = mounted.filter(function (item) { return item.host === host; })[0];
    if (existing) {
      existing.options = entry.options;
      render(existing.host, existing.options);
      return existing;
    }
    mounted.push(entry); refreshStaticCopy(); render(host, entry.options); return entry;
  }
  root.LrnJourneyUI = { mount: mount, refresh: refresh };
  root.document.addEventListener("lrn:journey-change", refresh);
  root.document.addEventListener("sitelang:change", refresh);
  root.document.addEventListener("change", function (event) {
    if (event.target && event.target.id === "roleSelect") root.setTimeout(refresh, 0);
  });
})(window);
