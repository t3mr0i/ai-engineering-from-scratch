/* Progress for the prepared learning paths. Learner data stays in the
   existing progress, assessment, and curriculum stores. */
(function (root) {
  "use strict";
  var doc = root.document;
  var COPY = {
    en: {
      backToPath: "My learning path", savedNotes: "Saved notes & code", ongoing: "Continue learning", finished: "Completed courses", checks: "Confirmed self-checks", emptyOngoing: "You haven’t started a course yet.", emptyFinished: "Your completed courses will appear here.", emptyChecks: "Confirmed practical self-checks will appear here. Reading and quiz answers do not count as these checks.", read: "read", doneLessons: "lessons completed", courseContinue: "Continue", courseReview: "Review", checkCount: "confirmed self-checks", title: "My progress", intro: "Your courses in progress, completed lessons, and practical evidence.",
      navHome: "My learning", navAreas: "Learning areas", navCatalog: "Explore courses",
      pace: "A little curiosity. Your own pace.", plan: "My plan", progress: "My progress",
      views: "Plan and progress", editRole: "Role & assessment", skip: "Skip to my progress",
      courseProgress: "Your learning so far", evidenceNote: "Course completion records your learning. Assessments and practical evidence show your competency level.",
      evidence: "Explore course contributions and capabilities", assessment: "Add or replace my assessment",
      chooseRole: "Choose your role to get started", empty: "Your next course is a good place to begin. Your learning progress will appear here.",
      completed: "courses completed", started: "courses started", lessons: "lessons completed"
    },
    de: {
      backToPath: "Mein Lernpfad", savedNotes: "Merkzettel & gespeicherter Code", ongoing: "Hier kannst du weitermachen", finished: "Abgeschlossene Kurse", checks: "Bestätigte Selbstchecks", emptyOngoing: "Du hast noch keinen Kurs begonnen.", emptyFinished: "Hier erscheinen deine abgeschlossenen Kurse.", emptyChecks: "Hier erscheinen bestätigte praktische Selbstchecks. Lesefortschritt und Quizantworten zählen nicht als solche Nachweise.", read: "gelesen", doneLessons: "Lektionen abgeschlossen", courseContinue: "Fortsetzen", courseReview: "Ansehen", checkCount: "bestätigte Selbstchecks", title: "Mein Fortschritt", intro: "Deine begonnenen Kurse, abgeschlossenen Lektionen und praktischen Nachweise.",
      navHome: "Mein Lernen", navAreas: "Lernbereiche", navCatalog: "Kurse entdecken",
      pace: "Mit Neugier. In deinem Tempo.", plan: "Mein Plan", progress: "Mein Fortschritt",
      views: "Plan und Fortschritt", editRole: "Rolle & Assessment", skip: "Zu meinem Fortschritt springen",
      courseProgress: "Das hast du bisher gelernt", evidenceNote: "Abgeschlossene Kurse halten deinen Lernfortschritt fest. Assessments und praktische Nachweise zeigen deinen Kompetenzstand.",
      evidence: "Kursbeiträge und Fähigkeiten", assessment: "Assessment verwalten",
      chooseRole: "Wähle deine Rolle für den Einstieg", empty: "Mit deinem nächsten Kurs geht es los. Hier wird dein Lernfortschritt sichtbar.",
      completed: "Kurse abgeschlossen", started: "Kurse begonnen", lessons: "Lektionen abgeschlossen"
    }
  };
  function copy() { return COPY[root.SiteLang && root.SiteLang.get() === "de" ? "de" : "en"]; }
  function showView() {
    if (root.location.hash === "#assessmentImport" || root.location.hash === "#assessmentSettings") doc.getElementById("assessmentSettings").open = true;
  }

  function node(tag, cls, text) {
    var element = doc.createElement(tag); if (cls) element.className = cls;
    if (text != null) element.textContent = text; return element;
  }
  function renderHistory(t, state) {
    var host = doc.getElementById("workspaceHistory");
    if (!host || !root.LrnLearningHistory) return;
    var history = root.LrnLearningHistory.build({ state: state,
      courses: root.LrnData && root.LrnData.courses,
      courseMaps: root.LrnCurriculumMap && root.LrnCurriculumMap.courseMaps,
      readFraction: root.AIFSProgress && root.AIFSProgress.getReadFraction });
    host.replaceChildren();
    [[t.ongoing, history.started, t.emptyOngoing], [t.finished, history.completed, t.emptyFinished]].forEach(function (group) {
      var section = node('section', 'workspace-history-section');
      section.append(node('h2', '', group[0]));
      if (!group[1].length) section.append(node('p', 'workspace-history-empty', group[2]));
      var list = node('ul', 'workspace-course-list');
      group[1].forEach(function (course) {
        var row = node('li', 'workspace-course-row');
        var icon = root.LrnLearningIcons.forCourse(course.id); icon.setAttribute('aria-hidden', 'true');
        var identity = node('div', 'workspace-course-copy'); identity.append(node('h3', '', course.title));
        identity.append(node('p', '', course.completedLessons + '/' + course.totalLessons + ' ' + t.doneLessons));
        var metric = node('div', 'workspace-course-metric');
        metric.append(node('span', '', course.percent + '% ' + t.read));
        var progress = node('progress', ''); progress.max = 100; progress.value = course.percent;
        progress.setAttribute('aria-label', course.title + ': ' + t.read); metric.append(progress);
        var link = node('a', 'readiness-button readiness-button--secondary', course.completed ? t.courseReview : t.courseContinue);
        link.href = 'lrn/course.html?id=' + encodeURIComponent(course.id);
        row.append(icon, identity, metric, link); list.append(row);
      });
      section.append(list); host.append(section);
    });
    var proof = node('details', 'workspace-evidence'); proof.append(node('summary', '', t.checks + ' · ' + history.evidence.length));
    if (!history.evidence.length) proof.append(node('p', 'workspace-history-empty', t.emptyChecks));
    var grouped = {};
    history.evidence.forEach(function (check) { (grouped[check.path] || (grouped[check.path] = [])).push(check); });
    var checks = node('ul', 'workspace-check-list');
    Object.entries(grouped).forEach(function (entry) {
      var row = node('li', ''); var link = node('a', '', entry[1][0].title);
      link.href = 'lesson.html?path=' + encodeURIComponent(entry[0]);
      row.append(link, node('span', '', entry[1].length + ' ' + t.checkCount)); checks.append(row);
    });
    proof.append(checks); host.append(proof);
  }
  function render() {
    var t = copy();
    doc.querySelectorAll("[data-workspace-copy]").forEach(function (node) { node.textContent = t[node.dataset.workspaceCopy]; });
    doc.querySelectorAll("[data-workspace-label]").forEach(function (node) { node.setAttribute("aria-label", t[node.dataset.workspaceLabel]); });
    doc.title = t.title + " · LHIND AI Learning Catalog";
    doc.getElementById("learningNav").setAttribute("aria-label", t.navHome);
    var model = root.LrnJourneyState && root.LrnJourneyState.snapshot();
    doc.getElementById("workspaceRole").textContent = model && model.roleSelected ? model.role.label : t.chooseRole;
    var state = root.AIFSProgress && root.AIFSProgress.getState();
    var lessons = Object.values(state && state.lessons || {}).filter(function (lesson) { return lesson.completedAt; }).length;
    var completed = 0, started = 0;
    var rows = state && state.lessons || {};
    Object.values(root.LrnCurriculumMap && root.LrnCurriculumMap.courseMaps || {}).forEach(function (units) {
      var paths = Array.from(new Set(units.flatMap(function (unit) { return unit.lessons || []; }).map(function (lesson) { return lesson.path; }).filter(Boolean)));
      if (!paths.length) return;
      if (paths.every(function (path) { return rows[path] && rows[path].completedAt; })) completed++;
      else if (paths.some(function (path) { var row = rows[path]; return row && (row.visitedAt || row.readPct || row.completedAt || Object.keys(row.answers || {}).length || Object.keys(row.appliedEvidence || {}).length); })) started++;
    });
    doc.getElementById("workspaceCourseProgress").textContent = completed || started || lessons
      ? completed + " " + t.completed + " · " + started + " " + t.started + " · " + lessons + " " + t.lessons
      : t.empty;
    renderHistory(t, state || {});
    showView();
  }
  function start() {
    doc.querySelectorAll("[data-learning-icon]").forEach(function (host) { host.replaceChildren(root.LrnLearningIcons.create(host.dataset.learningIcon)); });
    root.addEventListener("hashchange", showView);
    root.addEventListener("popstate", showView);
    doc.addEventListener("sitelang:change", render);
    doc.addEventListener("lrn:journey-change", render);
    if (root.AIFSProgress && root.AIFSProgress.onChange) root.AIFSProgress.onChange(render);
    render();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})(window);
