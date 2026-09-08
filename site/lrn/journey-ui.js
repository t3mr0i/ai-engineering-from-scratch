(function (root) {
  "use strict";

  var mounted = [];
  var COPY = {
    en: {
      title: "Your learning compass",
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
      assessment: "Start your self-assessment",
      assessmentReason: "Tell us where you are today so we can show the right next course.",
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
      sourceSelf: "From self-assessment",
      sourceEvidence: "From learning evidence",
      unknownTarget: "Complete the Self-Assessment to see your starting point.",
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
      academyTtt: "After completing this path, the LHIND Academy can advise on suitable Train-the-Trainer formats."
      , assessmentPanel: "Set your current level / connect an assessment"
    },
    de: {
      title: "Dein Lernkompass",
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
      assessment: "Self-Assessment starten",
      assessmentReason: "Ordne deinen heutigen Stand ein, damit wir den passenden nächsten Kurs zeigen können.",
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
      sourceSelf: "Aus Self-Assessment",
      sourceEvidence: "Aus Lernnachweisen",
      unknownTarget: "Führe das Self-Assessment durch, um deinen Ausgangspunkt zu sehen.",
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
      academyTtt: "Nach Abschluss dieses Lernpfads kann die LHIND Academy zu passenden Train-the-Trainer-Formaten beraten."
      , assessmentPanel: "Ist-Stand einordnen / Assessment verbinden"
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
    section.appendChild(el("h3", "journey-ui__subheading", t("journey")));
    var list = el("ol", "journey-ui__step-list");
    (model.steps || []).slice(0, 5).forEach(function (step) {
      var item = el("li", "journey-ui__step");
      item.dataset.status = step.status || "upcoming";
      var marker = el("span", "journey-ui__step-marker", String(list.children.length + 1));
      marker.setAttribute("aria-hidden", "true");
      var copy = el("div", "journey-ui__step-copy");
      copy.appendChild(el("strong", "", step.title || step.capability || step.dimension || t("next")));
      var meta = [step.dimension, step.capability, step.targetLevel].filter(Boolean).join(" · ");
      if (meta) copy.appendChild(el("span", "", meta));
      item.append(marker, copy, el("span", "journey-ui__step-state", statusText(step.status)));
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
    var restoreFocus = root.document.activeElement && root.document.activeElement === host.querySelector(".journey-ui__focus-select");
    host.replaceChildren();
    host.className = "journey-ui" + (options.compact ? " journey-ui--compact" : "");
    host.setAttribute("aria-live", "polite");
    if (!model) {
      host.appendChild(el("p", "journey-ui__loading", language() === "de" ? "Deine Lernreise wird vorbereitet …" : "Preparing your learning journey …"));
      return;
    }
    var heading = el(options.compact ? "h2" : "h2", "journey-ui__title", t("title"));
    host.appendChild(heading);
    var role = el("p", "journey-ui__role", (model.role && model.role.label) || "–");
    host.appendChild(role);
    if (!options.compact) {
      var target = el("section", "journey-ui__target");
      target.append(el("h3", "journey-ui__subheading", t("target")), el("p", "journey-ui__intro", t("targetIntro")), renderDimensions(model));
      if ((model.dimensions || []).some(function (dimension) { return dimension.status !== "not-relevant" && !dimension.currentLevel; })) target.appendChild(el("p", "journey-ui__intro", t("unknownTarget")));
      var focusField = el("label", "journey-ui__focus");
      focusField.appendChild(el("span", "", t("focus")));
      var select = el("select", "journey-ui__focus-select");
      select.appendChild(new Option(t("focusAll"), ""));
      (model.dimensions || []).forEach(function (dimension) { select.appendChild(new Option(dimension.name, dimension.id)); });
      select.value = model.focusDimensionId || "";
      select.addEventListener("change", function () {
        if (root.LrnJourneyState && typeof root.LrnJourneyState.setFocus === "function") root.LrnJourneyState.setFocus(select.value);
      });
      focusField.appendChild(select); target.appendChild(focusField);
      target.appendChild(el("p", "journey-ui__target-source", model.targetSource === "assessment-import" ? t("targetImported") : t("targetReference")));
      if (model.targetChanged) target.appendChild(el("p", "journey-ui__target-changed", t("targetChanged")));
      host.appendChild(target);
    }
    var courseMatches = renderCourseMatches(model, options.courseId);
    if (courseMatches) host.appendChild(courseMatches);
    var action = makeAction(model);
    if (model.next && model.next.activityHref && (options.courseId === model.next.courseId || model.next.status === "in-progress")) {
      action.href = model.next.activityHref;
      action.label = model.next.status === "in-progress" ? t("continue") : language() === "de" ? "Erste Lernaktivität starten" : "Start first learning activity";
    }
    var next = el("section", "journey-ui__next");
    next.appendChild(el("h3", "journey-ui__subheading", t("next")));
    next.appendChild(el("strong", "journey-ui__next-title", action.title));
    if (action.reason) next.appendChild(el("p", "journey-ui__next-reason", action.reason));
    var link = el("a", "journey-ui__action", action.label);
    link.href = action.href;
    next.appendChild(link);
    host.appendChild(next);
    var steps = !options.compact && renderSteps(model);
    if (steps) host.appendChild(steps);
    var external = renderExternal(model);
    if (external) host.appendChild(external);
    if (model.provisional) host.appendChild(el("p", "journey-ui__provisional", t("provisional")));
    var browse = el("a", "journey-ui__browse", t("browse"));
    browse.href = model.links && model.links.catalog || "index.html#trainingCatalogTitle";
    host.appendChild(browse);
    var focusSelect = restoreFocus && host.querySelector(".journey-ui__focus-select");
    if (focusSelect) focusSelect.focus({ preventScroll: true });
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
