/* Home owns setup and return visits. The shared journey remains the source
   for role targets, assessment provenance, prerequisites and recommendations. */
(function (root) {
  "use strict";
  var COPY = {
    en: {
      academyTitle: "LHIND Academy training", academyIntro: "Explore the online preparation and practical stages. Available sessions and booking links are listed in the training.",
      profileTitle: "Role & assessment", backPlan: "Back to my progress", backLearning: "Back to my training steps", saveProfile: "Apply and return",
      roleBased: "Role-based suggestions · Assessment can be added anytime", assessmentReady: "Your assessment is included in these paths",
      returnPath: "Back to my training steps",
      pathKnown: "Your assessment sets the starting point for each area. Choose an area to see its courses and the steps towards your role’s recommended level.",
      pathUnknown: "Choose an area to see its full course sequence. These first suggestions follow your role; an assessment helps tailor where you begin.",
      navHome: "My learning", navAreas: "Learning areas", navCatalog: "Explore courses", navPlan: "My progress", navTrainer: "Trainer area",
      levelsTitle: "The three learning levels",
      catalogTitle: "Find a course", welcomeBack: "Your training steps", welcomeIntro: "Build on what you know, explore the steps ahead and learn at your own pace.", profileDetails: "How your level is determined",
      hero: "Welcome.", heroIntro: "Find online courses and sessions to build your AI skills.",
      setupTitle: "Get started",
      importStep: "Your knowledge", roleStep: "Your role", reviewStep: "Your learning paths",
      importWhy: "Where are you starting from?", importWhyIntro: "Answer ten short questions so we can suggest courses for your role. You can also continue without them.",
      acquireMeaning: "Learn the basics.", deepenMeaning: "Use AI in your work.", createMeaning: "Build your own solutions.",
      levelsNote: "The recommended level is a suggestion, not a requirement.",
      startAssessment: "Answer ten questions", retakeAssessment: "Repeat the assessment",
      confirmRole: "Continue to your role", skipAssessment: "Choose my role instead", back: "Back",
      roleTitle: "Which role describes your work?", roleIntro: "Choose the role that feels closest to your everyday work. We’ll use it to suggest suitable learning paths. You can change it anytime.",
      previewPaths: "Show my training steps", reviewTitle: "Here’s how your training steps come together", finish: "Use these training steps",
      evidence: "View capability evidence",
      targetTitle: "Recommended levels for your role", chooseRole: "Select your role to see its recommended levels.", importedRole: "Your role was selected in the self-assessment. Check that it matches your work.",
      reference: "Targets from the AI Literacy reference", imported: "Targets from your self-assessment",
      unknown: "Not assessed", noTarget: "No target", current: "Your starting point", target: "Recommended target", area: "Competency area",
      targetProgressNote: "Based on assessment and demonstrated evidence. Course completion alone does not prove a competency level.",
      savedSession: "Your browser could not save this setup. You can continue now, but may need to confirm your role again on your next visit.",
      clearFilters: "Reset catalog filters"
    },
    de: {
      academyTitle: "Trainings der LHIND Academy", academyIntro: "Hier findest du Onlinevorbereitung und praktische Vertiefung. Verfügbare Termine und Buchungslinks stehen im jeweiligen Training.",
      profileTitle: "Rolle & Assessment", backPlan: "Zurück zu meinem Fortschritt", backLearning: "Zurück zu meinen Trainingsschritten", saveProfile: "Übernehmen und zurück",
      roleBased: "Empfehlungen nach deiner Rolle · Assessment jederzeit ergänzbar", assessmentReady: "Deine Einschätzung ist in diesen Lernwegen berücksichtigt",
      returnPath: "Zurück zu meinen Trainingsschritten",
      pathKnown: "Dein Assessment zeigt, wo du in jedem Bereich anknüpfen kannst. Wähle einen Bereich und entdecke die Kurse bis zur empfohlenen Zielstufe deiner Rolle.",
      pathUnknown: "Wähle einen Bereich und sieh dir alle Kurse an. Die erste Auswahl folgt deiner Rolle; ein Assessment hilft, den Einstieg an dein Wissen anzupassen.",
      navHome: "Mein Lernen", navAreas: "Lernbereiche", navCatalog: "Kurse entdecken", navPlan: "Mein Fortschritt", navTrainer: "Trainerbereich",
      levelsTitle: "Die drei Lernstufen",
      catalogTitle: "Kurs finden", welcomeBack: "Deine Trainingsschritte", welcomeIntro: "Knüpfe an dein Wissen an, entdecke die nächsten Etappen und lerne in deinem Tempo.", profileDetails: "Wie sich dein Stand zusammensetzt",
      hero: "Schön, dass du da bist.", heroIntro: "Hier findest du Online-Kurse und Sessions, mit denen du deine AI-Fähigkeiten ausbauen kannst.",
      setupTitle: "Dein Einstieg",
      importStep: "Dein Wissen", roleStep: "Deine Rolle", reviewStep: "Dein Lernweg",
      importWhy: "Wo stehst du gerade?", importWhyIntro: "Beantworte zehn kurze Fragen. So können wir dir passende Kurse für deine Rolle vorschlagen. Du kannst diesen Schritt auch überspringen.",
      acquireMeaning: "Lerne die Grundlagen kennen.", deepenMeaning: "Nutze KI in deiner Arbeit.", createMeaning: "Entwickle eigene Lösungen.",
      levelsNote: "Die empfohlene Stufe ist eine Empfehlung und nicht bindend.",
      startAssessment: "Zehn Fragen beantworten", retakeAssessment: "Einschätzung wiederholen",
      confirmRole: "Weiter zu deiner Rolle", skipAssessment: "Stattdessen Rolle auswählen", back: "Zurück",
      roleTitle: "Was beschreibt deinen Arbeitsalltag am besten?", roleIntro: "Wähle die Rolle, die am besten zu deiner Arbeit passt. Daraus stellen wir deine Lernwege zusammen. Deine Auswahl kannst du jederzeit ändern.",
      previewPaths: "Meine Trainingsschritte anzeigen", reviewTitle: "So setzen sich deine Trainingsschritte zusammen", finish: "Diese Trainingsschritte übernehmen",
      evidence: "Kompetenznachweise ansehen",
      targetTitle: "Empfohlene Stufen für deine Rolle", chooseRole: "Wähle deine Rolle, um die empfohlenen Zielstufen zu sehen.", importedRole: "Deine Rolle wurde im Self-Assessment ausgewählt. Prüfe, ob sie zu deiner Arbeit passt.",
      reference: "Zielstufen aus der AI-Literacy-Referenz", imported: "Zielstufen aus deinem Self-Assessment",
      unknown: "Noch nicht eingeschätzt", noTarget: "Kein Ziel", current: "Dein aktueller Stand", target: "Empfohlenes Ziel", area: "Kompetenzbereich",
      targetProgressNote: "Dein Stand ergibt sich aus deinem Assessment und praktischen Nachweisen. Deine abgeschlossenen Kurse halten wir zusätzlich als Lernfortschritt fest.",
      savedSession: "Dein Browser konnte die Einrichtung nicht speichern. Du kannst jetzt weiterlernen, musst deine Rolle beim nächsten Besuch aber eventuell erneut bestätigen.",
      clearFilters: "Katalogfilter zurücksetzen"
    }
  };
  function language() { return root.SiteLang && root.SiteLang.get() === "de" ? "de" : "en"; }
  function t(key) { return COPY[language()][key] || key; }
  function el(tag, cls, text) { var node = root.document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; }
  function array(value) { return Array.isArray(value) ? value : []; }
  function start() {
    var doc = root.document;
    var setup = doc.getElementById("readinessSetup");
    if (!setup || !root.LrnJourneyState || !root.LrnReadinessSetupState) return;
    var storage;
    try { storage = root.localStorage; } catch (_) { storage = null; }
    var state = root.LrnReadinessSetupState.create(storage);
    var params = new URLSearchParams(root.location.search);
    var profilePage = params.get("view") === "profile" || root.location.hash === "#roleSelect";
    var returnToPlan = params.get("from") === "plan" || params.get("from") === "progress";
    var returnHref = params.get("from") === "progress" ? "personal-plan.html#progress" : returnToPlan ? "personal-plan.html" : "index.html#readinessMap";
    var step = 0, editing = profilePage, sessionOnly = false;
    var currentModel = null;
    var knownRole = null;
    var legacyRoleSelected = false;
    try {
      var legacyCockpit = storage && storage.getItem("lhind:lrn-cockpit:v3");
      legacyCockpit = legacyCockpit && JSON.parse(legacyCockpit);
      legacyRoleSelected = !!(legacyCockpit && (legacyCockpit.profileId || legacyCockpit.roleId));
    } catch (_) {}
    var initialModel = root.LrnJourneyState.snapshot();
    // A role explicitly chosen before this UI existed remains a valid choice.
    // New learners still complete setup; returning learners need not choose again.
    var returningRole = legacyRoleSelected && initialModel && initialModel.roleSelected ? initialModel.roleId : null;
    var roleSelect = doc.getElementById("roleSelect");
    var dashboard = doc.getElementById("readinessDashboard");
    function imported() { try { return root.AIFSAssessmentImport && root.AIFSAssessmentImport.load(); } catch (_) { return null; } }
    if (imported()) step = 1;
    function go(next) {
      step = next;
      render();
      var panel = doc.getElementById(["readinessImportStep", "readinessRoleStep", "readinessReviewStep"][step]);
      var heading = panel.querySelector("h2, h3");
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      if (profilePage) root.scrollTo({ top: 0, behavior: "instant" });
      else setup.scrollIntoView({ block: "start", behavior: "auto" });
    }
    function targetTable(model, review) {
      var table = el("table", "readiness-target-table");
      var caption = el("caption", "", model.role.label);
      table.appendChild(caption);
      var head = el("thead"), row = el("tr");
      ["area"].concat(review ? ["current", "target"] : ["target"]).forEach(function (key) { var th = el("th", "", t(key)); th.scope = "col"; row.appendChild(th); });
      head.appendChild(row); table.appendChild(head);
      var body = el("tbody");
      array(model.dimensions).forEach(function (dimension) {
        var tr = el("tr"); var label = el("th", "", dimension.name); label.scope = "row"; tr.appendChild(label);
        if (review) tr.appendChild(el("td", "", dimension.currentLevel || t("unknown")));
        tr.appendChild(el("td", "readiness-target-table__target", dimension.targetLevel || t("noTarget"))); body.appendChild(tr);
      });
      table.appendChild(body); return table;
    }
    function renderSetup(model) {
      var selected = model.roleSelected;
      if (!selected && step === 2) step = 1;
      ["readinessImportStep", "readinessRoleStep", "readinessReviewStep"].forEach(function (id, index) { doc.getElementById(id).hidden = index !== step; });
      var progress = doc.getElementById("setupSteps"); progress.replaceChildren();
      ["importStep", "roleStep", "reviewStep"].forEach(function (key, index) {
        var li = el("li", "");
        if (index === step) li.setAttribute("aria-current", "step");
        var button = el("button", "", t(key)); button.type = "button";
        button.disabled = index > step;
        button.addEventListener("click", function () { go(index); });
        li.appendChild(button); progress.appendChild(li);
      });
      doc.getElementById("setupImportContinue").hidden = !model.assessmentAvailable;
      doc.getElementById("setupSkip").hidden = model.assessmentAvailable;
      doc.getElementById("setupAssessmentLink").textContent = t(model.assessmentAvailable ? "retakeAssessment" : "startAssessment");
      doc.getElementById("setupRoleContinue").disabled = !selected;
      doc.getElementById("setupReturn").hidden = profilePage || !selected || !(returningRole || state.isComplete(model.roleId));
      var record = imported();
      doc.getElementById("setupRoleSource").textContent = record && record.profileId === model.roleId ? t("importedRole") : "";
      var targets = doc.getElementById("setupRoleTargets"); targets.replaceChildren();
      targets.appendChild(el("h3", "", t("targetTitle")));
      if (selected) {
        targets.appendChild(targetTable(model, false));
        targets.appendChild(el("p", "readiness-setup__note", t(model.targetSource === "assessment-import" ? "imported" : "reference")));
      } else targets.appendChild(el("p", "", t("chooseRole")));
      var preview = doc.getElementById("setupReview"); preview.replaceChildren();
      if (selected) preview.appendChild(targetTable(model, true));
    }
    function renderContext(model) {
      var host = doc.getElementById("readinessNext"); host.replaceChildren();
      host.appendChild(el("p", "readiness-path-context__intro", t(model.assessmentAvailable ? "assessmentReady" : "roleBased")));
      var details = el("details", "readiness-profile-detail");
      details.appendChild(el("summary", "", t("profileDetails")));
      details.appendChild(el("p", "readiness-setup__note", t(model.assessmentAvailable ? "pathKnown" : "pathUnknown")));
      details.appendChild(el("p", "readiness-setup__note", t("targetProgressNote")));
      details.appendChild(el("p", "readiness-setup__note", t(model.targetSource === "assessment-import" ? "imported" : "reference")));
      var evidence = el("a", "readiness-link", t("evidence")); evidence.href = model.links.skills; details.appendChild(evidence);
      host.appendChild(details);
    }
    function renderMap(model) {
      var host = doc.getElementById("readinessMap");
      if (!root.LrnReadinessMap) return;
      var active = doc.activeElement && doc.activeElement.dataset.focus;
      var openCourses = new Set(Array.from(host.querySelectorAll("details[data-course][open]")).map(function (node) { return node.dataset.course; }));
      var openStages = Array.from(host.querySelectorAll("details[data-stage][open]")).map(function (node) { return node.dataset.stage; });
      var sameArea = host.dataset.focus === (model.focusDimensionId || "");
      host.replaceChildren(root.LrnReadinessMap.render(model, {
        embedded: true,
        activeDimensionId: model.focusDimensionId,
        courseMaps: root.LrnCurriculumMap && root.LrnCurriculumMap.courseMaps,
        onSelect: function (id) { root.LrnJourneyState.setFocus(id); }
      }));
      if (sameArea) host.querySelectorAll("details[data-course]").forEach(function (node) { node.open = openCourses.has(node.dataset.course); });
      if (sameArea) host.querySelectorAll("details[data-stage]").forEach(function (node) { node.open = openStages.indexOf(node.dataset.stage) >= 0; });
      var academy = doc.getElementById("readinessAcademyList");
      if (academy) {
        academy.replaceChildren();
        (root.LrnData.academyPaths || []).forEach(function (path) {
          var item = el("li", ""); var link = el("a", "readiness-link", path.title);
          link.href = "lrn/course.html?academy=" + encodeURIComponent(path.academyCourse);
          item.appendChild(link); academy.appendChild(item);
        });
      }
      host.dataset.focus = model.focusDimensionId || "";
      if (active) Array.from(host.querySelectorAll("button[data-focus]")).some(function (node) { if (node.dataset.focus !== active) return false; node.focus({ preventScroll: true }); return true; });
    }
    function render() {
      var model;
      try { model = root.LrnJourneyState.snapshot(); } catch (_) { return; }
      if (!model) return;
      currentModel = model;
      if (model.roleSelected && !roleSelect.value && model.roleId !== knownRole) {
        knownRole = model.roleId;
        roleSelect.value = model.roleId;
        roleSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      var configured = model.roleSelected && (state.isComplete(model.roleId) || returningRole === model.roleId) && !editing;
      setup.hidden = configured; dashboard.hidden = !configured;
      doc.querySelector(".page--home").dataset.readinessMode = profilePage ? "profile" : configured ? "dashboard" : "setup";
      doc.querySelectorAll("[data-ready-copy]").forEach(function (node) { node.textContent = t(node.dataset.readyCopy); });
      doc.getElementById("heroTitle").textContent = t(profilePage ? "profileTitle" : configured ? "welcomeBack" : "hero");
      doc.getElementById("homeHeroIntro").textContent = t(configured ? "welcomeIntro" : "heroIntro");
      doc.getElementById("homeHeroIntro").hidden = configured || profilePage;
      doc.getElementById("profileNav").hidden = !profilePage;
      doc.getElementById("profileNav").setAttribute("aria-current", "page");
      var back = doc.getElementById("profileBack"); back.hidden = !profilePage;
      back.href = returnHref; back.textContent = t(returnToPlan ? "backPlan" : "backLearning");
      doc.querySelector(".training-catalog").hidden = profilePage;
      if (profilePage) doc.querySelector('[data-ready-action="finish"][data-ready-copy="finish"]').textContent = t("saveProfile");
      doc.getElementById("resumeButton").hidden = true;
      doc.querySelector(".skip-link").href = configured ? "#readinessDashboard" : "#readinessSetup";
      var reset = doc.getElementById("resetBtn");
      reset.removeAttribute("data-i18n-title"); reset.removeAttribute("data-i18n-aria-label"); reset.title = t("clearFilters"); reset.setAttribute("aria-label", t("clearFilters"));
      doc.querySelector('[data-home-nav="areas"]').hidden = !model.roleSelected;
      doc.getElementById("learningNav").setAttribute("aria-label", t("navHome"));
      updateNav();
      if (!configured) renderSetup(model);
      else {
        doc.getElementById("readinessTitle").textContent = model.role.label;
        var notice = doc.getElementById("readinessStorageNotice"); notice.hidden = !sessionOnly; notice.textContent = sessionOnly ? t("savedSession") : "";
        renderContext(model); renderMap(model);
      }
    }
    doc.querySelectorAll("[data-learning-icon]").forEach(function (host) { host.replaceChildren(root.LrnLearningIcons.create(host.dataset.learningIcon)); });
    function updateNav() {
      var catalog = doc.getElementById("trainingCatalogTitle").getBoundingClientRect().top;
      var map = doc.getElementById("readinessMap").getBoundingClientRect().top;
      var active = root.scrollY < 120 ? "home" : catalog < root.innerHeight * .45 ? "catalog" : !dashboard.hidden && map < root.innerHeight * .45 ? "areas" : "home";
      doc.querySelectorAll("[data-home-nav]").forEach(function (link) { if (!profilePage && link.dataset.homeNav === active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current"); });
    }
    var scrollPending = false;
    root.addEventListener("scroll", function () { if (scrollPending) return; scrollPending = true; root.requestAnimationFrame(function () { scrollPending = false; updateNav(); }); }, { passive: true });
    doc.addEventListener("click", function (event) {
      var action = event.target.closest("[data-ready-action]");
      if (!action) return;
      switch (action.dataset.readyAction) {
        case "import": go(0); break;
        case "role": go(1); break;
        case "review": if (currentModel && currentModel.roleSelected) go(2); break;
        case "edit": editing = true; go(0); break;
        case "finish":
          if (!currentModel || !currentModel.roleSelected) return;
          sessionOnly = !state.complete(currentModel.roleId);
          if (profilePage) { root.location.assign(returnHref); return; }
          editing = false; render();
          doc.getElementById("readinessTitle").focus({ preventScroll: true });
          dashboard.scrollIntoView({ block: "start", behavior: "auto" });
          break;
      }
    });
    doc.addEventListener("assessment-import:change", function (event) { editing = true; step = event.detail ? 1 : 0; render(); });
    doc.addEventListener("lrn:journey-change", render);
    doc.addEventListener("sitelang:change", render);
    root.addEventListener("storage", render);
    render();
    if (profilePage) { editing = true; go(root.location.hash === "#assessmentImport" ? 0 : 1); }
    else if (["#journeyCockpit", "#readinessDashboard"].indexOf(root.location.hash) >= 0) {
      (dashboard.hidden ? setup : dashboard).scrollIntoView({ block: "start", behavior: "auto" });
    }
  }
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start); else start();
})(window);
