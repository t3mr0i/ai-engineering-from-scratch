/* Home owns setup and return visits. The shared journey remains the source
   for role targets, assessment provenance, prerequisites and recommendations. */
(function (root) {
  "use strict";
  var COPY = {
    en: {
      academyTitle: "LHIND Academy learning paths", academyIntro: "Explore the online preparation and practical stages. Available sessions and booking links are listed in the learning path.",
      profileTitle: "Role & assessment", backPlan: "Back to my progress", backLearning: "Back to my learning path", saveProfile: "Apply and return",
      roleBased: "Role-based suggestions · Assessment can be added anytime", assessmentReady: "Your assessment is included in these paths",
      returnPath: "Back to my learning path", roleSummary: "Learning areas tailored to your role.",
      pathKnown: "Your assessment sets the starting point for each area. Choose an area to see its courses and the steps towards your role’s recommended level.",
      pathUnknown: "Choose an area to see its full course sequence. These first suggestions follow your role; an assessment helps tailor where you begin.",
      navHome: "My learning", navAreas: "Learning areas", navCatalog: "Explore courses", navPlan: "My progress", navProgress: "My progress", paceNote: "A little curiosity. Your own pace.",
      levelsTitle: "Room to grow, step by step", levelsIntro: "Your learning paths bring together three levels:", laterNote: "You can add your assessment whenever you’re ready.",
      catalogTitle: "What would you like to explore?", catalogIntro: "Find a topic you’re curious about, or browse the courses at your own pace.", welcomeBack: "Your learning path", welcomeIntro: "Build on what you know, explore the steps ahead and learn at your own pace.", knowledgeDetails: "What this course helps you practise", profileDetails: "How your level is determined", addAssessment: "Add my assessment",
      hero: "Make room for learning.", heroIntro: "Discover what AI can bring to your work. We’ll help you find a next step that feels right for you.",
      setupTitle: "Let’s shape your learning path", setupIntro: "Three simple steps to find courses that fit your experience and your work.",
      importStep: "Your knowledge", roleStep: "Your role", reviewStep: "Your learning paths",
      importWhy: "Let’s build on what you know", importWhyIntro: "Your assessment helps us find courses that build on your experience. You can add it now or start exploring first.",
      acquireMeaning: "Understand and use AI fundamentals.", deepenMeaning: "Apply AI in your professional context.", createMeaning: "Design solutions and share expertise.",
      levelsNote: "The recommended level depends on your role and the area you’re exploring.",
      confirmRole: "Continue to your role", skipAssessment: "Explore without an assessment", browse: "Explore all courses", back: "Back",
      roleTitle: "Which role describes your work?", roleIntro: "Choose the role that feels closest to your everyday work. We’ll use it to suggest suitable learning paths. You can change it anytime.",
      previewPaths: "Show my learning paths", reviewTitle: "Here’s how your learning paths come together", finish: "Use these learning paths",
      savedHere: "Your selection is remembered in this browser. You can adjust your role or replace your assessment at any time.",
      dashboardTitle: "Recommended for you", editProfile: "Change role & assessment", personalPlan: "Adapt my learning path", evidence: "View capability evidence",
      targetTitle: "Recommended levels for your role", chooseRole: "Select your role to see its recommended levels.", importedRole: "Your role was identified from the imported assessment. Check that it matches your work.",
      reference: "Targets from the AI Literacy reference", imported: "Targets from your imported assessment", changed: "Your imported targets differ from the role reference. These paths use the targets from your assessment.",
      unknown: "Not assessed", noTarget: "No target", current: "Your starting point", target: "Recommended target", area: "Competency area",
      previewKnown: "Your assessment and available learning evidence determine where each path starts. You can work across areas; shared courses can contribute to several targets.",
      previewUnknown: "You can start with the fundamentals. Until you import an assessment, recommendations are provisional and your current levels remain unknown.",
      provisional: "These first suggestions are based on your role. Add an assessment whenever you’d like more personal recommendations.",
      next: "A good next step", continue: "Continue learning", open: "Start course", contributes: "Helps you progress in", why: "Why this course?",
      direction: "Your learning profile", targetProgress: "areas at their recommended target", targetProgressNote: "Based on assessment and demonstrated evidence. Course completion alone does not prove a competency level.",
      unknownAreas: "areas are ready for you to explore. An assessment can help you find where to begin.",
      allAreas: "Prioritize across all areas", focus: "Your chosen focus", focusFallback: "This area has no immediately available next course. The recommendation below comes from another area; check the map for completed targets or open preparation.",
      noNextTitle: "See how far you’ve come", noNext: "There is no immediately available course in these paths. The map shows reached targets, open preparation and gaps in the course offering.",
      savedSession: "Your browser could not save this setup. You can continue now, but may need to confirm your role again on your next visit.",
      preparation: "Preparation", ready: "Available now", inProgress: "In progress", clearFilters: "Reset catalog filters"
    },
    de: {
      academyTitle: "Lernpfade der LHIND Academy", academyIntro: "Hier findest du Onlinevorbereitung und praktische Vertiefung. Verfügbare Termine und Buchungslinks stehen im jeweiligen Lernpfad.",
      profileTitle: "Rolle & Assessment", backPlan: "Zurück zu meinem Fortschritt", backLearning: "Zurück zu meinem Lernpfad", saveProfile: "Übernehmen und zurück",
      roleBased: "Empfehlungen nach deiner Rolle · Assessment jederzeit ergänzbar", assessmentReady: "Deine Einschätzung ist in diesen Lernwegen berücksichtigt",
      returnPath: "Zurück zu meinem Lernpfad", roleSummary: "Lernbereiche passend zu deiner Rolle.",
      pathKnown: "Dein Assessment zeigt, wo du in jedem Bereich anknüpfen kannst. Wähle einen Bereich und entdecke die Kurse bis zur empfohlenen Zielstufe deiner Rolle.",
      pathUnknown: "Wähle einen Bereich und sieh dir alle Kurse an. Die erste Auswahl folgt deiner Rolle; ein Assessment hilft, den Einstieg an dein Wissen anzupassen.",
      navHome: "Mein Lernen", navAreas: "Lernbereiche", navCatalog: "Kurse entdecken", navPlan: "Mein Fortschritt", navProgress: "Mein Fortschritt", paceNote: "Mit Neugier. In deinem Tempo.",
      levelsTitle: "Schritt für Schritt weiterkommen", levelsIntro: "Deine Lernwege verbinden drei Stufen:", laterNote: "Dein Assessment kannst du jederzeit ergänzen.",
      catalogTitle: "Was möchtest du entdecken?", catalogIntro: "Finde ein Thema, das dich interessiert, oder stöbere in Ruhe durch die Kurse.", welcomeBack: "Dein Lernpfad", welcomeIntro: "Knüpfe an dein Wissen an, entdecke die nächsten Etappen und lerne in deinem Tempo.", knowledgeDetails: "Das kannst du hier üben", profileDetails: "Wie sich dein Stand zusammensetzt", addAssessment: "Mein Assessment ergänzen",
      hero: "Schön, dass du da bist.", heroIntro: "Entdecke, wie KI deinen Arbeitsalltag bereichern kann. Wir helfen dir, passende nächste Schritte zu finden.",
      setupTitle: "Lass uns deinen Lernweg gestalten", setupIntro: "In drei Schritten findest du Kurse, die zu deiner Erfahrung und deiner Arbeit passen.",
      importStep: "Dein Wissen", roleStep: "Deine Rolle", reviewStep: "Dein Lernweg",
      importWhy: "Auf deinem Wissen bauen wir auf", importWhyIntro: "Mit deinem Assessment finden wir Kurse, die an deine Erfahrung anknüpfen. Du kannst es jetzt ergänzen oder dich erst einmal umsehen.",
      acquireMeaning: "Die Grundlagen kennenlernen.", deepenMeaning: "KI im Arbeitsalltag ausprobieren und vertiefen.", createMeaning: "Eigene Lösungen gestalten und Wissen teilen.",
      levelsNote: "Welche Stufe zu dir passt, hängt von deiner Rolle und dem jeweiligen Bereich ab.",
      confirmRole: "Weiter zu deiner Rolle", skipAssessment: "Erst einmal ohne Assessment starten", browse: "Alle Kurse entdecken", back: "Zurück",
      roleTitle: "Was beschreibt deinen Arbeitsalltag am besten?", roleIntro: "Wähle die Rolle, die am besten zu deiner Arbeit passt. Daraus stellen wir deine Lernwege zusammen. Deine Auswahl kannst du jederzeit ändern.",
      previewPaths: "Meine Lernwege anzeigen", reviewTitle: "So setzen sich deine Lernwege zusammen", finish: "Meinen Lernbereich öffnen",
      savedHere: "Deine Auswahl wird in diesem Browser gespeichert. Du kannst deine Rolle jederzeit anpassen oder dein Assessment ersetzen.",
      dashboardTitle: "Für dich empfohlen", editProfile: "Rolle & Assessment ändern", personalPlan: "Lernpfad anpassen", evidence: "Kompetenznachweise ansehen",
      targetTitle: "Empfohlene Stufen für deine Rolle", chooseRole: "Wähle deine Rolle, um die empfohlenen Zielstufen zu sehen.", importedRole: "Deine Rolle wurde aus dem Assessment erkannt. Prüfe, ob sie zu deiner Arbeit passt.",
      reference: "Zielstufen aus der AI-Literacy-Referenz", imported: "Zielstufen aus deinem importierten Assessment", changed: "Deine importierten Zielstufen weichen von der Rollenreferenz ab. Diese Lernwege verwenden die Ziele aus deinem Assessment.",
      unknown: "Noch nicht eingeschätzt", noTarget: "Kein Ziel", current: "Dein aktueller Stand", target: "Empfohlenes Ziel", area: "Kompetenzbereich",
      previewKnown: "Dein Assessment und vorhandene Kompetenznachweise bestimmen den Einstieg in jeden Lernweg. Du kannst zwischen Bereichen wechseln; gemeinsame Kurse unterstützen mehrere Ziele.",
      previewUnknown: "Für den Anfang empfehlen wir dir passende Grundlagen. Mit einem Assessment können wir später genauer an dein Wissen anknüpfen. Dein aktueller Stand bleibt bis dahin offen.",
      provisional: "Diese ersten Vorschläge orientieren sich an deiner Rolle. Mit einem Assessment können wir sie noch persönlicher auf dich abstimmen.",
      next: "Ein guter nächster Schritt", continue: "Weiterlernen", open: "Kurs starten", contributes: "Dabei beschäftigst du dich mit", why: "Warum dieser Kurs?",
      direction: "Dein Lernprofil", targetProgress: "Bereiche auf der empfohlenen Zielstufe", targetProgressNote: "Dein Stand ergibt sich aus deinem Assessment und praktischen Nachweisen. Deine abgeschlossenen Kurse halten wir zusätzlich als Lernfortschritt fest.",
      unknownAreas: "Bereiche laden zum Entdecken ein. Ein Assessment hilft dir, einen passenden Einstieg zu finden.",
      allAreas: "Alle Bereiche berücksichtigen", focus: "Dein gewählter Fokus", focusFallback: "Für deinen Fokus ist gerade kein weiterer Kurs direkt verfügbar. Vielleicht möchtest du in der Zwischenzeit diesen anderen Bereich entdecken. Details findest du in deinen Lernbereichen.",
      noNextTitle: "Schau dir deinen Lernfortschritt an", noNext: "Für dich ist gerade kein weiterer Kurs direkt verfügbar. In deinen Lernbereichen findest du erreichte Ziele, hilfreiche Vorbereitung und Bereiche, für die wir noch Kurse ergänzen.",
      savedSession: "Dein Browser konnte die Einrichtung nicht speichern. Du kannst jetzt weiterlernen, musst deine Rolle beim nächsten Besuch aber eventuell erneut bestätigen.",
      preparation: "Vorbereitung", ready: "Jetzt verfügbar", inProgress: "Begonnen", clearFilters: "Katalogfilter zurücksetzen"
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
      doc.getElementById("setupReviewIntro").textContent = t(model.assessmentAvailable ? "previewKnown" : "previewUnknown");
    }
    function renderContext(model) {
      var host = doc.getElementById("readinessNext"); host.replaceChildren();
      var context = el("p", "readiness-setup__note", t(model.assessmentAvailable ? "assessmentReady" : "roleBased"));
      var details = el("details", "readiness-profile-detail");
      details.appendChild(el("summary", "", t("profileDetails")));
      details.appendChild(context);
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
        doc.getElementById("readinessRoleSummary").textContent = t("roleSummary");
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
