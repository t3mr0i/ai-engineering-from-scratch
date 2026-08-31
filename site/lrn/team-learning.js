/**
 * Learner-facing team assignments, mastery evidence, and skill credentials.
 * Team membership stays an anonymous browser-local choice; the server sees a
 * random browser id and validates every assignment code and credential claim.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.AIFSTeamLearning = api;
    if (root.document) api.init();
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  var STORE = "aifs:team-assignments:v1";
  var CREDENTIAL_STORE = "aifs:skill-credentials:v1";
  var ANON_ID_STORE = "aifs:anon-id:v1";
  var host;
  var status;

  var COPY = {
    en: {
      eyebrow: "Team learning and evidence",
      title: "Connect assigned work to proven understanding.",
      intro: "Join a team plan with a code. Quiz evidence—not reading time—drives mastery and verifiable self-directed skill receipts.",
      code: "Team join code",
      placeholder: "For example: A7K9M2QP",
      join: "Join team plan",
      joining: "Checking code…",
      invalid: "Enter a valid 6–12 character team code.",
      joined: "Team plan joined. Your personal plan will reprioritise automatically.",
      noAssignment: "No team plan joined. Your personal plan remains fully learner-owned.",
      assigned: "Assigned courses",
      due: "Due {date}",
      open: "Open course",
      leave: "Leave assignment",
      progress: "{done} of {total} courses complete",
      mastery: "Quiz mastery",
      evidence: "{count} quiz observations",
      noEvidence: "Complete lesson quizzes to build evidence. Reading alone never unlocks a credential.",
      credentialReady: "Eligible for a self-directed skill receipt",
      credentialIssue: "Issue verified receipt",
      credentialIssuing: "Synchronising evidence…",
      credentialIssued: "Skill receipt issued and ready to verify.",
      credentialOpen: "Verify receipt",
      assurance: "Receipts verify issuer and evidence integrity; they do not prove identity or proctored assessment.",
      requestFailed: "The request could not be completed. Your local progress is unchanged.",
    },
    de: {
      eyebrow: "Teamlernen und Evidenz",
      title: "Verknüpfe zugewiesene Arbeit mit nachgewiesenem Verständnis.",
      intro: "Tritt per Code einem Teamplan bei. Quiz-Evidenz – nicht Lesezeit – steuert Mastery und prüfbare, selbstgesteuerte Skill-Nachweise.",
      code: "Team-Beitrittscode",
      placeholder: "Zum Beispiel: A7K9M2QP",
      join: "Teamplan beitreten",
      joining: "Code wird geprüft…",
      invalid: "Gib einen gültigen Teamcode mit 6–12 Zeichen ein.",
      joined: "Teamplan beigetreten. Dein persönlicher Plan priorisiert sich automatisch neu.",
      noAssignment: "Kein Teamplan aktiv. Dein persönlicher Plan bleibt vollständig in deiner Hand.",
      assigned: "Zugewiesene Kurse",
      due: "Fällig am {date}",
      open: "Kurs öffnen",
      leave: "Zuweisung verlassen",
      progress: "{done} von {total} Kursen abgeschlossen",
      mastery: "Quiz-Mastery",
      evidence: "{count} Quizbeobachtungen",
      noEvidence: "Bearbeite Lektionsquizze, um Evidenz aufzubauen. Lesen allein schaltet keinen Nachweis frei.",
      credentialReady: "Berechtigt für einen selbstgesteuerten Skill-Nachweis",
      credentialIssue: "Prüfbaren Nachweis ausstellen",
      credentialIssuing: "Evidenz wird synchronisiert…",
      credentialIssued: "Skill-Nachweis ausgestellt und prüfbar.",
      credentialOpen: "Nachweis prüfen",
      assurance: "Nachweise bestätigen Herausgeber und Evidenzintegrität, nicht Identität oder beaufsichtigte Prüfung.",
      requestFailed: "Die Anfrage konnte nicht abgeschlossen werden. Dein lokaler Fortschritt bleibt unverändert.",
    },
  };

  function locale() { return root.SiteLang && root.SiteLang.get && root.SiteLang.get() === "de" ? "de" : "en"; }
  function t(key, values) {
    var output = COPY[locale()][key] || COPY.en[key] || key;
    Object.keys(values || {}).forEach(function (name) { output = output.replace("{" + name + "}", values[name]); });
    return output;
  }
  function read(key, fallback) {
    try { var value = JSON.parse(root.localStorage.getItem(key)); return value && typeof value === "object" ? value : fallback; }
    catch (_) { return fallback; }
  }
  function write(key, value) { root.localStorage.setItem(key, JSON.stringify(value)); }
  function create(tag, className, text) {
    var node = root.document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function icon(name) { var node = create("i", "ph-light ph-" + name); node.setAttribute("aria-hidden", "true"); return node; }
  function courseById(id) { return (root.LrnData && root.LrnData.courses || []).find(function (course) { return course.id === id; }); }
  function capabilityById(id) { return (root.LrnData && root.LrnData.capabilities || []).find(function (capability) { return String(capability.id) === String(id); }); }
  function assignmentState() { return read(STORE, { assignments: [] }); }
  function credentialState() { var state = read(CREDENTIAL_STORE, { credentials: [] }); return Array.isArray(state.credentials) ? state : { credentials: [] }; }
  function completedCourses() {
    var progress = root.AIFSProgress && root.AIFSProgress.getState ? root.AIFSProgress.getState() : { lessons: {} };
    var lessons = progress.lessons || {};
    var maps = root.LrnCurriculumMap && root.LrnCurriculumMap.courseMaps || {};
    return (root.LrnData && root.LrnData.courses || []).filter(function (course) {
      var paths = (maps[course.id] || []).flatMap(function (unit) { return unit.lessons || []; }).map(function (lesson) { return lesson.path; }).filter(Boolean);
      return paths.length && paths.every(function (path) { return lessons[path] && lessons[path].completedAt; });
    }).map(function (course) { return course.id; });
  }
  function mastery() {
    if (!root.LrnMastery) return { summary: { evidenceCount: 0, courses: [], dueReviews: [] }, capabilities: [] };
    var summary = root.LrnMastery.summarize({
      progressState: root.AIFSProgress && root.AIFSProgress.getState ? root.AIFSProgress.getState() : { lessons: {} },
      curriculumMap: root.LrnCurriculumMap || {},
    });
    var capabilities = root.AIFSCapabilityEvidence ? root.LrnMastery.capabilitySummary(summary, root.AIFSCapabilityEvidence) : [];
    return { summary: summary, capabilities: capabilities };
  }
  function setStatus(message, kind) { if (status) { status.textContent = message || ""; status.dataset.state = kind || ""; } }

  async function join(event) {
    event.preventDefault();
    var input = event.currentTarget.elements.code;
    var button = event.currentTarget.querySelector("button[type=submit]");
    var code = String(input.value || "").trim().toUpperCase();
    input.value = code;
    if (!/^[A-Z2-9]{6,12}$/.test(code)) {
      input.setAttribute("aria-invalid", "true");
      setStatus(t("invalid"), "error");
      input.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    button.disabled = true;
    button.lastChild.textContent = t("joining");
    try {
      var response = await fetch("/api/lrn/team-assignments?code=" + encodeURIComponent(code), { credentials: "same-origin" });
      var body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body && body.error && body.error.message || t("requestFailed"));
      var state = assignmentState();
      var rows = Array.isArray(state.assignments) ? state.assignments.filter(function (row) { return row.id !== body.assignment.id; }) : [];
      rows.push(body.assignment);
      write(STORE, { assignments: rows, updatedAt: Date.now() });
      input.value = "";
      root.dispatchEvent(new CustomEvent("aifs:team-assignment-change", { detail: body.assignment }));
      if (root.LrnReportSync) root.LrnReportSync.sync();
      render();
      setStatus(t("joined"), "success");
    } catch (error) {
      setStatus(error.message || t("requestFailed"), "error");
    } finally {
      button.disabled = false;
      button.lastChild.textContent = t("join");
    }
  }

  function leave(id) {
    var state = assignmentState();
    state.assignments = (state.assignments || []).filter(function (row) { return row.id !== id; });
    state.updatedAt = Date.now();
    write(STORE, state);
    root.dispatchEvent(new CustomEvent("aifs:team-assignment-change", { detail: null }));
    if (root.LrnReportSync) root.LrnReportSync.sync();
    render();
  }

  function anonId() {
    var id = root.localStorage.getItem(ANON_ID_STORE);
    if (!id) { id = root.crypto.randomUUID(); root.localStorage.setItem(ANON_ID_STORE, id); }
    return id;
  }

  async function issueCredential(capabilityId, button) {
    button.disabled = true;
    setStatus(t("credentialIssuing"), "working");
    try {
      if (root.LrnReportSync) root.LrnReportSync.sync();
      await new Promise(function (resolve) { root.setTimeout(resolve, 2300); });
      var response = await fetch("/api/lrn/credentials", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonId: anonId(), capabilityId: capabilityId }),
      });
      var body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body && body.error && body.error.message || t("requestFailed"));
      var state = credentialState();
      state.credentials = state.credentials.filter(function (row) { return String(row.capabilityId) !== String(capabilityId); });
      state.credentials.push(body.credential);
      write(CREDENTIAL_STORE, state);
      render();
      setStatus(t("credentialIssued"), "success");
    } catch (error) {
      setStatus(error.message || t("requestFailed"), "error");
      button.disabled = false;
    }
  }

  function renderAssignments(container) {
    var rows = assignmentState().assignments || [];
    if (!rows.length) { container.appendChild(create("p", "team-learning__empty", t("noAssignment"))); return; }
    var done = completedCourses();
    rows.forEach(function (assignment) {
      var article = create("article", "team-assignment");
      var head = create("div", "team-assignment__head");
      var copy = create("div");
      copy.append(create("h3", "", assignment.title), assignment.objective ? create("p", "", assignment.objective) : null);
      var leaveButton = create("button", "team-learning__quiet", t("leave"));
      leaveButton.type = "button";
      leaveButton.addEventListener("click", function () { leave(assignment.id); });
      head.append(copy, leaveButton);
      article.appendChild(head);
      if (assignment.dueAt) article.appendChild(create("p", "team-assignment__due", t("due", { date: new Date(assignment.dueAt + "T00:00:00").toLocaleDateString(locale() === "de" ? "de-DE" : "en-GB") })));
      var list = create("ul", "team-assignment__courses");
      (assignment.courseIds || []).forEach(function (courseId) {
        var course = courseById(courseId);
        var item = create("li", "");
        item.append(create("span", "team-assignment__state", done.indexOf(courseId) >= 0 ? "✓" : "○"), create("strong", "", course ? course.title : courseId));
        var link = create("a", "personal-plan-step__link", t("open"));
        link.href = "lrn/course.html?id=" + encodeURIComponent(courseId);
        link.appendChild(icon("arrow-right"));
        item.appendChild(link);
        list.appendChild(item);
      });
      article.append(list, create("p", "team-assignment__progress", t("progress", { done: assignment.courseIds.filter(function (id) { return done.indexOf(id) >= 0; }).length, total: assignment.courseIds.length })));
      container.appendChild(article);
    });
  }

  function renderMastery(container) {
    var model = mastery();
    var credentials = credentialState().credentials;
    var head = create("div", "team-mastery__head");
    head.append(create("h3", "", t("mastery")), create("span", "", t("evidence", { count: model.summary.evidenceCount })));
    container.appendChild(head);
    if (!model.summary.evidenceCount) { container.appendChild(create("p", "team-learning__empty", t("noEvidence"))); return; }
    var list = create("ul", "team-mastery__list");
    model.capabilities.filter(function (row) { return row.evidenceCount > 0; }).sort(function (a, b) { return b.percent - a.percent; }).slice(0, 8).forEach(function (row) {
      var capability = capabilityById(row.capabilityId);
      var item = create("li", "team-mastery__row");
      var metric = create("div", "team-mastery__metric");
      metric.append(create("strong", "", capability ? capability.title : "Capability " + row.capabilityId), create("span", "", row.percent + "% · " + t("evidence", { count: row.evidenceCount })));
      var bar = create("span", "team-mastery__bar");
      var fill = create("span", "");
      fill.style.width = row.percent + "%";
      bar.appendChild(fill);
      metric.appendChild(bar);
      item.appendChild(metric);
      var issued = credentials.find(function (credential) { return String(credential.capabilityId) === String(row.capabilityId); });
      if (issued) {
        var verify = create("a", "team-learning__action", t("credentialOpen"));
        verify.href = "credential.html?id=" + encodeURIComponent(issued.id) + "&proof=" + encodeURIComponent(issued.proof);
        item.appendChild(verify);
      } else if (row.eligibleForCredential) {
        var issue = create("button", "team-learning__action", t("credentialIssue"));
        issue.type = "button";
        issue.addEventListener("click", function () { issueCredential(row.capabilityId, issue); });
        item.appendChild(issue);
      }
      list.appendChild(item);
    });
    container.append(list, create("p", "team-mastery__assurance", t("assurance")));
  }

  function render() {
    host = root.document.getElementById("teamLearningApp");
    if (!host) return;
    host.textContent = "";
    var header = create("div", "team-learning__header");
    var copy = create("div");
    copy.append(create("p", "team-learning__eyebrow", t("eyebrow")), create("h2", "", t("title")), create("p", "", t("intro")));
    header.appendChild(copy);
    var form = create("form", "team-learning__join");
    var label = create("label", "");
    label.setAttribute("for", "teamJoinCode");
    label.textContent = t("code");
    var field = create("div", "team-learning__join-row");
    var input = create("input", "");
    input.id = "teamJoinCode";
    input.name = "code";
    input.maxLength = 12;
    input.autocomplete = "off";
    input.placeholder = t("placeholder");
    input.setAttribute("aria-describedby", "teamLearningStatus");
    var submit = create("button", "team-learning__action");
    submit.type = "submit";
    submit.append(icon("users-three"), create("span", "", t("join")));
    field.append(input, submit);
    form.append(label, field);
    form.addEventListener("submit", join);
    header.appendChild(form);
    status = create("p", "team-learning__status");
    status.id = "teamLearningStatus";
    status.setAttribute("role", "status");
    var body = create("div", "team-learning__body");
    var assignments = create("section", "team-learning__assignments");
    assignments.appendChild(create("h3", "", t("assigned")));
    renderAssignments(assignments);
    var masteryPanel = create("section", "team-learning__mastery");
    renderMastery(masteryPanel);
    body.append(assignments, masteryPanel);
    host.append(header, status, body);
  }

  function init() {
    function run() {
      render();
      root.document.addEventListener("sitelang:change", render);
      if (root.AIFSProgress && root.AIFSProgress.onChange) root.AIFSProgress.onChange(render);
    }
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", run, { once: true });
    else run();
  }

  return { init: init, render: render, mastery: mastery, completedCourses: completedCourses };
});
