/**
 * Learner-owned plan builder for the LRN cockpit. The recommendation order is
 * produced by learning-plan.js; this module owns the editable, local-first UI.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.AIFSPersonalPlan = api;
    if (root.document) api.init();
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var STORE = "aifs:personal-plan:v1";
  var COCKPIT_STORE = "lhind:lrn-cockpit:v3";
  var ASSESSMENT_STORE = "aifs:assessment";
  var draft = null;
  var saved = null;
  var host = null;
  var goalInput = null;
  var weeksSelect = null;
  var sessionsSelect = null;
  var output = null;
  var status = null;

  var COPY = {
    en: {
      eyebrow: "Personal learning plan",
      title: "Build a plan around your goal.",
      intro: "Choose a goal and cadence. The plan uses your role, assessment gaps, and local progress, then stays editable before you save it.",
      local: "Stored in this browser",
      goal: "What do you want to be able to do?",
      goalPlaceholder: "For example: evaluate and ship reliable AI agents",
      weeks: "Planning horizon",
      sessions: "Focus sessions per week",
      weekOption: "{n} weeks",
      sessionOption: "{n} per week",
      build: "Build my plan",
      rebuild: "Rebuild priorities",
      assessmentUsed: "Assessment gaps included",
      assessmentMissing: "Add a self-assessment for sharper priorities",
      assessmentLink: "Start assessment",
      draft: "Draft — review before saving",
      saved: "Saved in this browser",
      empty: "No eligible unfinished courses remain for this profile.",
      focus: "{count} focus courses across {weeks} weeks",
      capacity: "{sessions} focus sessions available. Courses are prioritised; this is not a duration estimate.",
      week: "Week {n}",
      inProgress: "Continue",
      planned: "Planned",
      openCourse: "Open course",
      moveUp: "Move {title} earlier",
      moveDown: "Move {title} later",
      remove: "Remove {title} from plan",
      roleReason: "Fits your selected role.",
      levelReason: "Matches your current or next learning depth.",
      goalReason: "Matches your stated goal: {terms}.",
      gapReason: "Addresses an assessment gap from {current} to {target}.",
      progressReason: "Continues work you already started.",
      defaultReason: "Selected from the approved course catalog.",
      save: "Save plan",
      clear: "Clear plan",
      clearConfirm: "Clear your personal plan from this browser?",
      saveError: "The browser could not save this plan.",
      generatedError: "The plan could not be built. Check the selected inputs.",
      customizeHint: "Reorder or remove courses. Saving never changes course content or your completion history.",
      planReady: "Plan built. Review the priorities before saving.",
      planSaved: "Plan saved in this browser.",
      noGoal: "Add a concrete goal for more precise priorities."
    },
    de: {
      eyebrow: "Persönlicher Lernplan",
      title: "Baue einen Plan rund um dein Ziel.",
      intro: "Wähle Ziel und Rhythmus. Der Plan nutzt Rolle, Assessment-Lücken und lokalen Fortschritt und bleibt vor dem Speichern editierbar.",
      local: "In diesem Browser gespeichert",
      goal: "Was möchtest du anschließend können?",
      goalPlaceholder: "Zum Beispiel: zuverlässige KI-Agenten evaluieren und ausrollen",
      weeks: "Planungszeitraum",
      sessions: "Fokus-Sessions pro Woche",
      weekOption: "{n} Wochen",
      sessionOption: "{n} pro Woche",
      build: "Meinen Plan bauen",
      rebuild: "Prioritäten neu berechnen",
      assessmentUsed: "Assessment-Lücken berücksichtigt",
      assessmentMissing: "Mit Self-Assessment werden Prioritäten genauer",
      assessmentLink: "Assessment starten",
      draft: "Entwurf — vor dem Speichern prüfen",
      saved: "In diesem Browser gespeichert",
      empty: "Für dieses Profil sind keine geeigneten offenen Kurse mehr vorhanden.",
      focus: "{count} Fokuskurse in {weeks} Wochen",
      capacity: "{sessions} Fokus-Sessions verfügbar. Die Kurse werden priorisiert; das ist keine Dauerschätzung.",
      week: "Woche {n}",
      inProgress: "Fortsetzen",
      planned: "Geplant",
      openCourse: "Kurs öffnen",
      moveUp: "{title} nach vorne verschieben",
      moveDown: "{title} nach hinten verschieben",
      remove: "{title} aus dem Plan entfernen",
      roleReason: "Passt zu deiner gewählten Rolle.",
      levelReason: "Passt zu deiner aktuellen oder nächsten Lerntiefe.",
      goalReason: "Passt zu deinem Ziel: {terms}.",
      gapReason: "Schließt eine Assessment-Lücke von {current} zu {target}.",
      progressReason: "Setzt einen bereits begonnenen Kurs fort.",
      defaultReason: "Aus dem freigegebenen Kurskatalog ausgewählt.",
      save: "Plan speichern",
      clear: "Plan löschen",
      clearConfirm: "Persönlichen Plan aus diesem Browser löschen?",
      saveError: "Der Browser konnte den Plan nicht speichern.",
      generatedError: "Der Plan konnte nicht gebaut werden. Prüfe die gewählten Angaben.",
      customizeHint: "Du kannst Kurse verschieben oder entfernen. Speichern ändert weder Kursinhalte noch deinen Abschlussverlauf.",
      planReady: "Plan erstellt. Prüfe die Prioritäten vor dem Speichern.",
      planSaved: "Plan in diesem Browser gespeichert.",
      noGoal: "Mit einem konkreten Ziel werden die Prioritäten genauer."
    }
  };

  function locale() {
    return root.SiteLang && root.SiteLang.get && root.SiteLang.get() === "de" ? "de" : "en";
  }

  function t(key, values) {
    var text = (COPY[locale()] && COPY[locale()][key]) || COPY.en[key] || key;
    Object.keys(values || {}).forEach(function (name) {
      text = text.replace(new RegExp("\\{" + name + "\\}", "g"), values[name]);
    });
    return text;
  }

  function read(key, fallback) {
    try {
      var value = JSON.parse(root.localStorage.getItem(key));
      return value && typeof value === "object" ? value : fallback;
    } catch (_) { return fallback; }
  }

  function courseLessonPaths(courseId) {
    var units = root.LrnCurriculumMap && root.LrnCurriculumMap.courseMaps && root.LrnCurriculumMap.courseMaps[courseId];
    if (!Array.isArray(units)) return [];
    var seen = {};
    return units.flatMap(function (unit) { return unit.lessons || []; }).map(function (lesson) { return lesson && lesson.path; }).filter(function (path) {
      if (!path || seen[path]) return false;
      seen[path] = true;
      return true;
    });
  }

  function progressSnapshot() {
    var state = root.AIFSProgress && root.AIFSProgress.getState ? root.AIFSProgress.getState() : { lessons: {} };
    var lessonState = state.lessons || {};
    var completed = [];
    var inProgress = [];
    ((root.LrnData && root.LrnData.courses) || []).forEach(function (course) {
      var paths = courseLessonPaths(course.id);
      if (!paths.length) return;
      var done = paths.filter(function (path) { return lessonState[path] && lessonState[path].completedAt; }).length;
      var touched = paths.some(function (path) {
        var entry = lessonState[path];
        return entry && (entry.visitedAt || entry.readPct || entry.completedAt || Object.keys(entry.answers || {}).length);
      });
      if (done === paths.length) completed.push(course.id);
      else if (touched) inProgress.push(course.id);
    });
    return { completedCourseIds: completed, inProgressCourseIds: inProgress };
  }

  function learnerSnapshot(goal) {
    var cockpit = read(COCKPIT_STORE, {});
    var assessment = read(ASSESSMENT_STORE, {});
    return {
      roleId: cockpit.profileId || "tc",
      currentLevel: Number(cockpit.externalLevel || 1),
      goal: String(goal || "").trim().slice(0, 500),
      assessment: { ratings: assessment.ratings || {} },
      progress: progressSnapshot()
    };
  }

  function assessmentAvailable() {
    var assessment = read(ASSESSMENT_STORE, {});
    return assessment.ratings && Object.keys(assessment.ratings).length > 0;
  }

  function create(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function icon(name) {
    var node = create("i", "ph-light ph-" + name);
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  function setStatus(message, state) {
    if (!status) return;
    status.textContent = message || "";
    status.dataset.state = state || "";
  }

  function recalculatePositions(plan) {
    var count = plan.steps.length;
    plan.steps.forEach(function (step, index) {
      step.position = index + 1;
      step.targetWeek = count ? Math.min(plan.cadence.durationWeeks, Math.floor(index * plan.cadence.durationWeeks / count) + 1) : 1;
    });
    plan.capacity.selectedCourses = count;
    plan.customized = true;
    return plan;
  }

  function reasonFor(step) {
    var signals = Array.isArray(step.signals) ? step.signals : [];
    var signal = signals.find(function (item) { return item.type === "progress"; }) ||
      signals.find(function (item) { return item.type === "goal_match"; }) ||
      signals.find(function (item) { return item.type === "assessment_gap"; }) ||
      signals.find(function (item) { return item.type === "level_match"; }) ||
      signals.find(function (item) { return item.type === "role_match"; });
    if (!signal) return t("defaultReason");
    if (signal.type === "progress") return t("progressReason");
    if (signal.type === "goal_match") return t("goalReason", { terms: (signal.terms || []).join(", ") });
    if (signal.type === "assessment_gap") return t("gapReason", { current: signal.currentLevel, target: signal.targetLevel });
    if (signal.type === "level_match") return t("levelReason");
    return t("roleReason");
  }

  function controlButton(name, label, disabled, handler) {
    var button = create("button", "personal-plan-step__control");
    button.type = "button";
    button.disabled = disabled;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.appendChild(icon(name));
    button.addEventListener("click", handler);
    return button;
  }

  function renderStep(step, index) {
    var item = create("li", "personal-plan-step");
    if (step.status === "in_progress") item.dataset.state = "in-progress";
    var timing = create("div", "personal-plan-step__timing");
    timing.append(create("span", "personal-plan-step__number", String(index + 1).padStart(2, "0")), create("span", "personal-plan-step__week", t("week", { n: step.targetWeek })));

    var body = create("div", "personal-plan-step__body");
    var stateLabel = create("span", "personal-plan-step__state", step.status === "in_progress" ? t("inProgress") : t("planned"));
    var title = create("h4", "", step.title);
    var reason = create("p", "", reasonFor(step));
    var link = create("a", "personal-plan-step__link", t("openCourse"));
    link.href = "lrn/course.html?id=" + encodeURIComponent(step.courseId);
    link.appendChild(icon("arrow-right"));
    body.append(stateLabel, title, reason, link);

    var controls = create("div", "personal-plan-step__controls");
    controls.append(
      controlButton("arrow-up", t("moveUp", { title: step.title }), index === 0, function () { moveStep(index, -1); }),
      controlButton("arrow-down", t("moveDown", { title: step.title }), index === draft.steps.length - 1, function () { moveStep(index, 1); }),
      controlButton("x", t("remove", { title: step.title }), false, function () { removeStep(index); })
    );
    item.append(timing, body, controls);
    return item;
  }

  function renderPlan() {
    if (!output) return;
    output.textContent = "";
    if (!draft) return;
    var result = create("section", "personal-plan-result");
    result.setAttribute("aria-labelledby", "personalPlanResultTitle");
    var head = create("div", "personal-plan-result__head");
    var copy = create("div");
    var heading = create("h3", "", t("focus", { count: draft.steps.length, weeks: draft.cadence.durationWeeks }));
    heading.id = "personalPlanResultTitle";
    copy.append(heading, create("p", "", t("capacity", { sessions: draft.capacity.availableSessionSlots })));
    var badge = create("span", "personal-plan-result__badge", saved && saved.updatedAt === draft.updatedAt ? t("saved") : t("draft"));
    head.append(copy, badge);
    result.appendChild(head);

    if (!draft.steps.length) result.appendChild(create("p", "personal-plan-result__empty", t("empty")));
    else {
      var list = create("ol", "personal-plan-steps");
      draft.steps.forEach(function (step, index) { list.appendChild(renderStep(step, index)); });
      result.appendChild(list);
    }

    var footer = create("div", "personal-plan-result__footer");
    footer.appendChild(create("p", "personal-plan-result__hint", t("customizeHint")));
    var actions = create("div", "personal-plan-result__actions");
    var save = create("button", "personal-plan__primary", t("save"));
    save.type = "button";
    save.disabled = !draft.steps.length;
    save.addEventListener("click", savePlan);
    var clear = create("button", "personal-plan__secondary", t("clear"));
    clear.type = "button";
    clear.addEventListener("click", clearPlan);
    actions.append(save, clear);
    footer.appendChild(actions);
    result.appendChild(footer);
    output.appendChild(result);
  }

  function moveStep(index, direction) {
    if (!draft) return;
    var target = index + direction;
    if (target < 0 || target >= draft.steps.length) return;
    var steps = draft.steps.slice();
    var item = steps[index];
    steps.splice(index, 1);
    steps.splice(target, 0, item);
    draft.steps = steps;
    draft.updatedAt = 0;
    recalculatePositions(draft);
    setStatus(t("draft"), "draft");
    renderPlan();
  }

  function removeStep(index) {
    if (!draft) return;
    draft.steps = draft.steps.filter(function (_, stepIndex) { return stepIndex !== index; });
    draft.updatedAt = 0;
    recalculatePositions(draft);
    setStatus(t("draft"), "draft");
    renderPlan();
  }

  function buildPlan(event) {
    if (event) event.preventDefault();
    if (!root.LrnLearningPlan || !root.LrnData) return setStatus(t("generatedError"), "error");
    try {
      draft = root.LrnLearningPlan.buildPlan({
        catalog: root.LrnData,
        learner: learnerSnapshot(goalInput.value),
        durationWeeks: Number(weeksSelect.value),
        sessionsPerWeek: Number(sessionsSelect.value)
      });
      draft.createdAt = Date.now();
      draft.updatedAt = 0;
      saved = null;
      setStatus(goalInput.value.trim() ? t("planReady") : t("noGoal"), "ready");
      renderPlan();
    } catch (error) {
      setStatus(t("generatedError") + " " + String(error && error.message || ""), "error");
    }
  }

  function savePlan() {
    if (!draft || !draft.steps.length) return;
    var now = Date.now();
    draft = JSON.parse(JSON.stringify(draft));
    draft.createdAt = saved && saved.createdAt || draft.createdAt || now;
    draft.updatedAt = now;
    try {
      root.localStorage.setItem(STORE, JSON.stringify(draft));
      saved = JSON.parse(JSON.stringify(draft));
      setStatus(t("planSaved"), "saved");
      renderPlan();
      root.dispatchEvent(new CustomEvent("aifs:personal-plan-change", { detail: saved }));
    } catch (_) { setStatus(t("saveError"), "error"); }
  }

  function clearPlan() {
    if (!root.confirm(t("clearConfirm"))) return;
    try { root.localStorage.removeItem(STORE); } catch (_) {}
    saved = null;
    draft = null;
    setStatus("", "");
    renderPlan();
    root.dispatchEvent(new CustomEvent("aifs:personal-plan-change", { detail: null }));
  }

  function option(select, value, label) {
    var node = create("option", "", label);
    node.value = String(value);
    select.appendChild(node);
  }

  function buildUi(preserve) {
    var preservedDraft = preserve && draft ? JSON.parse(JSON.stringify(draft)) : null;
    var preservedSaved = preserve && saved ? JSON.parse(JSON.stringify(saved)) : null;
    var preservedGoal = preserve && goalInput ? goalInput.value : "";
    var preservedWeeks = preserve && weeksSelect ? weeksSelect.value : "";
    var preservedSessions = preserve && sessionsSelect ? sessionsSelect.value : "";
    var preservedState = preserve && status ? status.dataset.state : "";
    host = root.document.getElementById("personalPlanApp");
    if (!host) return;
    host.textContent = "";
    var intro = create("div", "personal-plan__intro");
    var introCopy = create("div");
    var sectionTitle = create("h2", "", t("title"));
    sectionTitle.id = "personalPlanTitle";
    introCopy.append(create("p", "personal-plan__eyebrow", t("eyebrow")), sectionTitle, create("p", "personal-plan__description", t("intro")));
    intro.append(introCopy, create("span", "personal-plan__local", t("local")));

    var form = create("form", "personal-plan-form");
    var goalField = create("label", "personal-plan-field personal-plan-field--goal");
    goalField.appendChild(create("span", "", t("goal")));
    goalInput = create("input", "");
    goalInput.type = "text";
    goalInput.maxLength = 500;
    goalInput.placeholder = t("goalPlaceholder");
    goalField.appendChild(goalInput);

    var weeksField = create("label", "personal-plan-field");
    weeksField.appendChild(create("span", "", t("weeks")));
    weeksSelect = create("select", "");
    [4, 8, 12].forEach(function (value) { option(weeksSelect, value, t("weekOption", { n: value })); });
    weeksSelect.value = "8";
    weeksField.appendChild(weeksSelect);

    var sessionsField = create("label", "personal-plan-field");
    sessionsField.appendChild(create("span", "", t("sessions")));
    sessionsSelect = create("select", "");
    [1, 2, 3, 4].forEach(function (value) { option(sessionsSelect, value, t("sessionOption", { n: value })); });
    sessionsSelect.value = "2";
    sessionsField.appendChild(sessionsSelect);

    var submit = create("button", "personal-plan__primary", t("build"));
    submit.type = "submit";
    submit.appendChild(icon("arrow-right"));
    form.append(goalField, weeksField, sessionsField, submit);
    form.addEventListener("submit", buildPlan);

    var evidence = create("div", "personal-plan__evidence");
    if (assessmentAvailable()) evidence.append(icon("check-circle"), root.document.createTextNode(t("assessmentUsed")));
    else {
      evidence.append(icon("info"), root.document.createTextNode(t("assessmentMissing") + " · "));
      var assessmentLink = create("a", "", t("assessmentLink"));
      assessmentLink.href = "assessment.html";
      evidence.appendChild(assessmentLink);
    }
    status = create("p", "personal-plan__status");
    status.setAttribute("role", "status");
    output = create("div", "personal-plan__output");
    host.append(intro, form, evidence, status, output);

    saved = preservedSaved || read(STORE, null);
    if (preservedDraft) {
      draft = preservedDraft;
      goalInput.value = preservedGoal;
      weeksSelect.value = preservedWeeks || String(draft.cadence.durationWeeks || 8);
      sessionsSelect.value = preservedSessions || String(draft.cadence.sessionsPerWeek || 2);
      setStatus(preservedState === "saved" ? t("planSaved") : preservedState === "ready" ? t("planReady") : t("draft"), preservedState || "draft");
      renderPlan();
    } else if (saved && Array.isArray(saved.steps) && saved.cadence && saved.capacity) {
      draft = JSON.parse(JSON.stringify(saved));
      goalInput.value = saved.learner && saved.learner.goal || "";
      weeksSelect.value = String(saved.cadence.durationWeeks || 8);
      sessionsSelect.value = String(saved.cadence.sessionsPerWeek || 2);
      setStatus(t("planSaved"), "saved");
      renderPlan();
    }
  }

  function renderLocale() {
    if (host) buildUi(true);
  }

  function open() {
    var section = root.document && root.document.getElementById("personalPlan");
    if (!section) return;
    section.scrollIntoView({ behavior: root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    root.setTimeout(function () { if (goalInput) goalInput.focus(); }, 250);
  }

  function init() {
    if (!root.document) return;
    function run() {
      buildUi();
      root.document.addEventListener("sitelang:change", renderLocale);
      if (root.location && root.location.hash === "#personalPlan") open();
    }
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", run, { once: true });
    else run();
  }

  return { init: init, open: open, build: buildPlan, getSaved: function () { return read(STORE, null); }, progressSnapshot: progressSnapshot };
});
