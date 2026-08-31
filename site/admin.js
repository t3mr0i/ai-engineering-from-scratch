(function () {
  "use strict";

  const state = {
    actor: null,
    base: null,
    snapshot: null,
    stats: null,
    issues: [],
    changesets: [],
    active: null,
    view: "overview",
    dirty: false,
    saving: false,
    selectedCourseId: null,
    lessons: [],
    lessonQuery: "",
    selectedLessonPath: null,
    activeLesson: null,
    lessonFile: "docs/en.md",
    lessonDirty: false,
    lessonIssues: [],
    selectedPathId: null,
    pathView: "structure",
    selectedTrainerId: null,
    trainerQuery: "",
    selectedSessionId: null,
    calendarView: "list",
    calendarMonth: "",
    calendarFilters: { courseId: "", trainerId: "", language: "", status: "" },
    courseQuery: "",
    coursePreview: false,
    pathQuery: "",
    saveTimer: null,
    skills: [],
    aiSkillId: "curriculum-grill",
    aiScope: "curriculum",
    aiLoading: false,
    aiDraft: "",
    publishConfigured: false,
    grillOverrideReason: "",
    pendingImport: null,
    loadedSnapshot: null,
    conflict: null,
    baseCurrent: true,
    lrnStats: null,
    teamAssignments: [],
    teamReporting: {},
  };

  const ROLE_LABELS = {
    editor: "Bearbeiten",
    reviewer: "Prüfen",
    publisher: "Veröffentlichen",
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value == null || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "htmlFor") node.htmlFor = value;
      else if (key === "checked") node.checked = Boolean(value);
      else if (key === "value") node.value = value;
      else if (key === "disabled") node.disabled = Boolean(value);
      else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, String(value));
    }
    const values = Array.isArray(children) ? children : children == null ? [] : [children];
    for (const child of values.flat(Infinity)) {
      if (child == null || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function icon(name, className) {
    return h("i", { class: `ph-light ph-${name}${className ? ` ${className}` : ""}`, "aria-hidden": "true" });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sameValue(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function mergeThreeWay(base, local, remote, pathParts = [], conflicts = []) {
    if (sameValue(local, base)) return { value: remote, conflicts };
    if (sameValue(remote, base) || sameValue(local, remote)) return { value: local, conflicts };
    if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
      const identified = [...base, ...local, ...remote].every((item) => item && typeof item === "object" && typeof item.id === "string");
      if (identified) {
        const baseMap = new Map(base.map((item) => [item.id, item]));
        const localMap = new Map(local.map((item) => [item.id, item]));
        const remoteMap = new Map(remote.map((item) => [item.id, item]));
        const order = [...remote.map((item) => item.id), ...local.map((item) => item.id).filter((id) => !remoteMap.has(id))];
        return { value: order.map((id) => mergeThreeWay(baseMap.get(id), localMap.get(id), remoteMap.get(id), [...pathParts, id], conflicts).value).filter((item) => item !== undefined), conflicts };
      }
      if (base.length === local.length && base.length === remote.length) {
        return { value: base.map((_, index) => mergeThreeWay(base[index], local[index], remote[index], [...pathParts, String(index)], conflicts).value), conflicts };
      }
    }
    const plain = (value) => value && typeof value === "object" && !Array.isArray(value);
    if (plain(base) && plain(local) && plain(remote)) {
      const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
      const value = {};
      for (const key of keys) value[key] = mergeThreeWay(base[key], local[key], remote[key], [...pathParts, key], conflicts).value;
      return { value, conflicts };
    }
    conflicts.push({ path: pathParts, label: `/${pathParts.join("/")}`, base, local, remote, choice: "" });
    return { value: remote, conflicts };
  }

  function setAtPath(root, pathParts, value) {
    let parent = root;
    for (const part of pathParts.slice(0, -1)) parent = parent[part];
    const key = pathParts.at(-1);
    if (value === undefined) {
      if (Array.isArray(parent)) parent.splice(Number(key), 1); else delete parent[key];
    } else parent[key] = clone(value);
  }

  function previewValue(value) {
    const text = value === undefined ? "(entfernt)" : JSON.stringify(value, null, 2);
    return text.length > 900 ? `${text.slice(0, 900)}…` : text;
  }

  function showConflict(current) {
    const result = mergeThreeWay(state.loadedSnapshot || state.base.snapshot, state.snapshot, current.snapshot);
    if (!result.conflicts.length) {
      state.active = current;
      state.loadedSnapshot = clone(current.snapshot);
      state.snapshot = result.value;
      state.dirty = true;
      setSaveStatus("Parallele Änderungen automatisch zusammengeführt", "dirty");
      toast("Nicht überlappende Änderungen wurden per Drei-Wege-Merge zusammengeführt.");
      renderCurrentView();
      return;
    }
    state.conflict = { current, merged: result.value, items: result.conflicts };
    const rows = result.conflicts.map((item, index) => h("article", { class: "conflict-row" }, [
      h("code", { text: item.label }),
      h("div", { class: "conflict-versions" }, [
        h("div", {}, [h("strong", { text: "Meine Änderung" }), h("pre", { text: previewValue(item.local) })]),
        h("div", {}, [h("strong", { text: "Remote-Änderung" }), h("pre", { text: previewValue(item.remote) })]),
      ]),
      field("Entscheidung", selectFor("", [{ value: "", label: "Bitte wählen" }, { value: "local", label: "Meine Änderung" }, { value: "remote", label: "Remote-Änderung" }], (choice) => { state.conflict.items[index].choice = choice; })),
    ]));
    $("#conflictSummary").replaceChildren(h("p", { text: `${result.conflicts.length} überlappende Felder benötigen eine explizite Entscheidung. Nicht überlappende Änderungen sind bereits kombiniert.` }), ...rows);
    $("#conflictDialog").showModal();
  }

  function cancelConflict() {
    if (!state.conflict) return $("#conflictDialog").close();
    state.active = state.conflict.current;
    state.snapshot = clone(state.conflict.current.snapshot);
    state.loadedSnapshot = clone(state.conflict.current.snapshot);
    state.dirty = false;
    state.conflict = null;
    $("#conflictDialog").close();
    setSaveStatus(`Version ${state.active.version} · Remote-Stand geladen`, "saved");
    renderCurrentView();
  }

  function applyConflict() {
    if (!state.conflict || state.conflict.items.some((item) => !item.choice)) {
      toast("Bitte entscheide jeden überlappenden Konflikt.", "error");
      return;
    }
    for (const item of state.conflict.items) setAtPath(state.conflict.merged, item.path, item[item.choice]);
    state.active = state.conflict.current;
    state.loadedSnapshot = clone(state.conflict.current.snapshot);
    state.snapshot = state.conflict.merged;
    state.conflict = null;
    state.dirty = true;
    $("#conflictDialog").close();
    setSaveStatus("Konflikte aufgelöst · Speichern erforderlich", "dirty");
    renderCurrentView();
  }

  function initials(name) {
    return String(name || "?").split(/[.@\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function statusLabel(status) {
    return ({ draft: "Entwurf", review: "Im Review", approved: "Freigegeben", published: "Veröffentlicht", archived: "Archiviert" })[status] || status;
  }

  function hasRole(role) {
    return Boolean(state.actor && state.actor.roles.includes(role));
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    let body;
    try { body = await response.json(); } catch (_) { body = null; }
    if (!response.ok || !body || body.ok === false) {
      const error = new Error(body && body.error ? body.error.message : `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = body && body.error;
      throw error;
    }
    return body;
  }

  function setSaveStatus(text, kind) {
    const node = $("#saveStatus");
    node.textContent = text;
    node.className = `save-status${kind ? ` is-${kind}` : ""}`;
  }

  function toast(message, kind = "success") {
    const node = h("div", { class: "admin-toast", "data-kind": kind, role: kind === "error" ? "alert" : "status", text: message });
    $("#toastRegion").append(node);
    window.setTimeout(() => node.remove(), 5000);
  }

  function pageHeading(id, _context, title, description, action) {
    return h("div", { class: "admin-page-heading" }, [
      h("div", {}, [
        h("h1", { id, text: title }),
        h("p", { text: description }),
      ]),
      action || null,
    ]);
  }

  function emptyState(iconName, title, copy, action) {
    return h("div", { class: "admin-empty" }, [icon(iconName), h("h2", { text: title }), h("p", { text: copy }), action || null]);
  }

  function button(label, kind, handler, iconName, attrs) {
    return h("button", {
      type: "button",
      class: `admin-button admin-button--${kind || "secondary"}`,
      onclick: handler,
      ...(attrs || {}),
    }, [iconName ? icon(iconName) : null, label]);
  }

  function field(label, control, wide, hint) {
    return h("label", { class: `admin-field${wide ? " admin-field--wide" : ""}` }, [
      h("span", { text: label }),
      hint ? h("p", { class: "admin-form-hint", text: hint }) : null,
      control,
    ]);
  }

  function inputFor(value, handler, attrs) {
    return h("input", { value: value == null ? "" : value, oninput: (event) => handler(event.target.value), ...(attrs || {}) });
  }

  function textareaFor(value, handler, attrs) {
    return h("textarea", { oninput: (event) => handler(event.target.value), ...(attrs || {}) }, value == null ? "" : value);
  }

  function selectFor(value, options, handler, attrs) {
    const select = h("select", { onchange: (event) => handler(event.target.value), ...(attrs || {}) });
    const normalized = options.slice();
    if (value != null && value !== "" && !normalized.some((option) => option.value === value)) {
      normalized.unshift({ value, label: value });
    }
    for (const option of normalized) select.append(h("option", { value: option.value, text: option.label }));
    select.value = value == null ? "" : value;
    return select;
  }

  function updateStats() {
    const maps = state.snapshot.curriculumMap.courseMaps || {};
    state.stats = {
      courses: state.snapshot.catalog.courses.length,
      tracks: state.snapshot.catalog.tracks.length,
      units: Object.values(maps).reduce((sum, units) => sum + units.length, 0),
      activities: Object.values(maps).reduce((sum, units) => sum + units.reduce((inner, unit) => inner + (unit.lessons || []).length, 0), 0),
      trainers: (state.snapshot.catalog.trainers || []).length,
      sessions: (state.snapshot.catalog.sessions || []).length,
    };
    $("#courseNavCount").textContent = state.stats.courses;
    $("#lessonNavCount").textContent = state.lessons.length;
    $("#pathNavCount").textContent = state.stats.tracks;
    $("#trainerNavCount").textContent = state.stats.trainers;
    $("#sessionNavCount").textContent = state.stats.sessions;
    $("#reviewNavCount").textContent = state.issues.length || "";
  }

  function markDirty() {
    if (!state.active) {
      openChangesetDialog();
      return false;
    }
    state.dirty = true;
    setSaveStatus("Ungespeicherte Änderungen", "dirty");
    $("#saveButton").disabled = false;
    window.clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(() => saveDraft(true), 1600);
    updateStats();
    return true;
  }

  async function saveDraft(quiet) {
    if (!state.active || !state.dirty || state.saving) return;
    state.saving = true;
    setSaveStatus("Speichert …");
    $("#saveButton").disabled = true;
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}`, {
        method: "PUT",
        body: JSON.stringify({
          expectedVersion: state.active.version,
          title: state.active.title,
          description: state.active.description,
          snapshot: state.snapshot,
        }),
      });
      state.active = body.changeset;
      state.snapshot = clone(body.changeset.snapshot);
      state.loadedSnapshot = clone(body.changeset.snapshot);
      state.issues = body.issues || [];
      state.dirty = false;
      state.saving = false;
      setSaveStatus("Gerade gespeichert", "saved");
      $("#saveButton").disabled = true;
      await refreshChangeSets(false);
      if (!quiet) toast("Entwurf gespeichert.");
      renderCurrentView();
    } catch (error) {
      state.saving = false;
      $("#saveButton").disabled = false;
      if (error.status === 409 && error.payload && error.payload.details) {
        setSaveStatus("Bearbeitungskonflikt", "dirty");
        if (error.payload.details.current) showConflict(error.payload.details.current);
        else toast("Der Entwurf wurde parallel geändert.", "error");
      } else {
        setSaveStatus("Speichern fehlgeschlagen", "dirty");
        toast(`${error.message}${error.payload && error.payload.id ? ` · Fehler-ID ${error.payload.id}` : ""}`, "error");
      }
    }
  }

  function activateView(view) {
    state.view = view;
    $$("[data-view-panel]").forEach((panel) => { panel.hidden = panel.dataset.viewPanel !== view; });
    $$("[data-view]").forEach((item) => {
      const active = item.dataset.view === view;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
    });
    setSidebarOpen(false);
    renderCurrentView();
    $("#adminMain").focus({ preventScroll: true });
  }

  function renderCurrentView() {
    if (!state.snapshot) return;
    ({
      overview: renderOverview,
      courses: renderCourses,
      lessons: renderLessons,
      paths: renderPaths,
      trainers: renderTrainers,
      calendar: renderCalendar,
      teams: renderTeams,
      assistant: renderAssistant,
      review: renderReview,
      history: renderHistory,
      stats: renderStats,
    })[state.view]();
  }

  function renderOverview() {
    updateStats();
    const panel = $("#view-overview");
    panel.replaceChildren(pageHeading(
      "overviewTitle",
      "Curriculum-Zustand",
      "Was braucht heute eine Entscheidung?",
      "Kurse, Pfade und Qualitätsprüfungen in einem kontrollierten Veröffentlichungsfluss.",
      h("div", { class: "review-actions" }, [
        button("Import", "secondary", () => $("#curriculumImport").click(), "upload-simple", { disabled: !state.active || state.active.status !== "draft" }),
        button("Export", "secondary", exportCurriculum, "download-simple"),
        button("Kurs bearbeiten", "primary", () => activateView("courses"), "pencil-simple"),
      ]),
    ));

    const errors = state.issues.filter((item) => item.severity === "error").length;
    const warnings = state.issues.filter((item) => item.severity !== "error").length;
    const quality = Math.max(0, Math.round(100 - errors * 10 - warnings * 1.5));
    const drafts = state.changesets.filter((item) => item.status === "draft").length;
    const review = state.changesets.filter((item) => item.status === "review").length;
    const dashboard = h("div", { class: "admin-dashboard" });

    const inventoryItems = [
      ["Kurse", state.stats.courses, `${state.stats.units} Units`],
      ["Lessons", state.lessons.length, `${state.stats.activities} Activities`],
      ["Lernpfade", state.stats.tracks, "Profile und Level verbunden"],
      ["Termine", state.stats.sessions, `${state.stats.trainers} Trainer`],
      ["Offene Entscheidungen", drafts + review, `${drafts} Entwürfe · ${review} im Review`],
    ];
    dashboard.append(h("dl", { class: "admin-inventory", "aria-label": "Curriculum-Inventar" }, inventoryItems.map(([label, value, context]) =>
      h("div", { class: "admin-inventory__item" }, [
        h("dt", { text: label }),
        h("dd", { text: value }),
        h("small", { text: context }),
      ]),
    )));

    const changePanel = h("article", { class: "admin-panel admin-dashboard__wide" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Letzte Änderungssätze" }), button("Neuen Entwurf anlegen", "secondary", openChangesetDialog, "plus")]),
      renderChangesetTable(state.changesets.slice(0, 5)),
    ]);
    const qualityPanel = h("aside", { class: "admin-panel admin-dashboard__side" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Qualität" }), h("strong", { text: `${quality}%` })]),
      h("div", { class: "quality-bar", role: "progressbar", "aria-label": "Curriculum-Qualität", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": quality }, h("span", { style: `width:${quality}%` })),
      h("div", { class: "quality-copy" }, [h("span", { text: `${errors} Blocker` }), h("span", { text: `${warnings} Hinweise` })]),
      h("p", { class: "metric-context", text: errors ? "Blocker müssen vor dem Review gelöst werden." : "Keine strukturellen Blocker im aktuellen Stand." }),
      button("Prüfbericht öffnen", "quiet", () => activateView("review"), "arrow-right"),
    ]);
    dashboard.append(changePanel, qualityPanel);
    panel.append(dashboard);
  }

  function renderStats() {
    const panel = $("#view-stats");
    panel.replaceChildren(pageHeading(
      "statsTitle",
      "Statistik",
      "Firmenweiter Lernfortschritt",
      "Anonym erhoben — jeder Datenpunkt ist ein zufälliges Browser-Pseudonym, kein Klarname.",
    ));

    const stats = state.lrnStats || { totalLearners: 0, byProfile: {}, byLevel: {}, courseCompletions: {} };
    if (!stats.totalLearners) {
      panel.append(emptyState("chart-bar", "Noch keine Daten", "Sobald Lernende die LRN-Kachel öffnen, erscheinen hier aggregierte Zahlen."));
      return;
    }

    const profileTitle = (id) => {
      const profile = (state.snapshot.catalog.roles || []).find((item) => item.id === id);
      return profile ? profile.label : id;
    };
    const courseTitle = (id) => {
      const course = (state.snapshot.catalog.courses || []).find((item) => item.id === id);
      return course ? course.title : id;
    };

    const dashboard = h("div", { class: "admin-dashboard" });
    dashboard.append(h("dl", { class: "admin-inventory", "aria-label": "Lernende gesamt" }, [
      h("div", { class: "admin-inventory__item" }, [
        h("dt", { text: "Lernende (anonym)" }),
        h("dd", { text: stats.totalLearners }),
        h("small", { text: "Ein Eintrag pro Browser-Pseudonym" }),
      ]),
    ]));

    const profileRows = Object.entries(stats.byProfile).sort((a, b) => b[1] - a[1]);
    const profilePanel = h("article", { class: "admin-panel admin-dashboard__wide" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Nach Profil" })]),
      h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
        h("thead", {}, h("tr", {}, [h("th", { text: "Profil" }), h("th", { text: "Lernende" })])),
        h("tbody", {}, profileRows.map(([id, count]) => h("tr", {}, [h("td", { text: profileTitle(id) }), h("td", { text: count })]))),
      ])),
    ]);

    const levelRows = Object.entries(stats.byLevel).sort((a, b) => Number(a[0]) - Number(b[0]));
    const levelPanel = h("aside", { class: "admin-panel admin-dashboard__side" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Nach Level" })]),
      h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
        h("thead", {}, h("tr", {}, [h("th", { text: "Level" }), h("th", { text: "Lernende" })])),
        h("tbody", {}, levelRows.map(([level, count]) => h("tr", {}, [h("td", { text: level }), h("td", { text: count })]))),
      ])),
    ]);

    const courseRows = Object.entries(stats.courseCompletions).sort((a, b) => b[1] - a[1]);
    const coursePanel = h("article", { class: "admin-panel admin-dashboard__wide" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Kursabschlüsse" })]),
      h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
        h("thead", {}, h("tr", {}, [h("th", { text: "Kurs" }), h("th", { text: "Abschlüsse" })])),
        h("tbody", {}, courseRows.map(([id, count]) => h("tr", {}, [h("td", { text: courseTitle(id) }), h("td", { text: count })]))),
      ])),
    ]);

    dashboard.append(profilePanel, levelPanel, coursePanel);
    panel.append(dashboard);
  }

  function teamProgress(assignment) {
    const report = state.teamReporting[assignment.id] || { learners: 0, courseCompletions: {}, averageMastery: 0 };
    const possible = report.learners * assignment.courseIds.length;
    const completed = assignment.courseIds.reduce((sum, courseId) => sum + (report.courseCompletions[courseId] || 0), 0);
    return { ...report, percent: possible ? Math.round(completed / possible * 100) : 0 };
  }

  async function createTeamAssignment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const selected = Array.from(form.elements.courseIds.selectedOptions).map((option) => option.value);
    if (!selected.length) {
      toast("Wähle mindestens einen Kurs.", "error");
      form.elements.courseIds.focus();
      return;
    }
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    try {
      const body = await api("/api/admin/team-assignments", {
        method: "POST",
        body: JSON.stringify({
          title: form.elements.title.value.trim(),
          objective: form.elements.objective.value.trim(),
          dueAt: form.elements.dueAt.value,
          courseIds: selected,
          status: "active",
        }),
      });
      state.teamAssignments.push(body.assignment);
      form.reset();
      renderTeams();
      toast(`Teamplan ${body.assignment.code} erstellt.`);
    } catch (error) { toast(error.message, "error"); }
    finally { submit.disabled = false; }
  }

  async function setTeamAssignmentStatus(assignment, status) {
    try {
      const body = await api(`/api/admin/team-assignments/${assignment.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...assignment, status }),
      });
      state.teamAssignments = state.teamAssignments.map((row) => row.id === assignment.id ? body.assignment : row);
      renderTeams();
      toast(status === "archived" ? "Teamplan archiviert." : "Teamplan aktiviert.");
    } catch (error) { toast(error.message, "error"); }
  }

  function renderTeams() {
    const panel = $("#view-teams");
    panel.replaceChildren(pageHeading(
      "teamsTitle",
      "Teamlernen",
      "Pläne zuweisen und Evidenz aggregiert verfolgen",
      "Beitrittscodes verbinden Teampläne mit anonymen Browser-Pseudonymen. Keine Klarnamen werden erfasst.",
    ));

    const courseSelect = h("select", { id: "teamCourseIds", name: "courseIds", multiple: "", size: "8", required: "" });
    state.snapshot.catalog.courses.forEach((course) => courseSelect.append(h("option", { value: course.id, text: `${course.id} · ${course.title}` })));
    const form = h("form", { class: "admin-panel team-assignment-form", onsubmit: createTeamAssignment }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Neuen Teamplan anlegen" }), h("p", { class: "admin-context-line", text: "Der Beitrittscode wird automatisch erzeugt." })]),
      h("div", { class: "admin-form-grid" }, [
        field("Titel", inputFor("", () => {}, { name: "title", required: "", maxlength: "120", autocomplete: "off", placeholder: "z. B. Agent Readiness Q4" })),
        field("Fällig am", inputFor("", () => {}, { name: "dueAt", type: "date" })),
        field("Ziel", textareaFor("", () => {}, { name: "objective", maxlength: "600", rows: "3", placeholder: "Welche Fähigkeit soll das Team anschließend anwenden können?" }), true),
        field("Zugewiesene Kurse", courseSelect, true, "Mehrere Kurse mit Strg/Cmd oder Umschalt auswählen."),
      ]),
      h("div", { class: "team-assignment-form__actions" }, button("Teamplan erstellen", "primary", null, "plus", { type: "submit", disabled: !hasRole("editor") })),
    ]);
    panel.appendChild(form);

    if (!state.teamAssignments.length) {
      panel.append(emptyState("users-four", "Noch keine Teampläne", "Erstelle oben den ersten Plan und teile den Beitrittscode mit dem Team."));
      return;
    }

    const rows = state.teamAssignments.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((assignment) => {
      const progress = teamProgress(assignment);
      const codeButton = button(assignment.code, "quiet", async () => {
        try { await navigator.clipboard.writeText(assignment.code); toast("Beitrittscode kopiert."); }
        catch (_) { toast(`Beitrittscode: ${assignment.code}`); }
      }, "copy", { "aria-label": `Beitrittscode ${assignment.code} kopieren` });
      const action = button(assignment.status === "archived" ? "Aktivieren" : "Archivieren", "secondary", () => setTeamAssignmentStatus(assignment, assignment.status === "archived" ? "active" : "archived"), assignment.status === "archived" ? "play" : "archive", { disabled: !hasRole("editor") });
      return h("tr", {}, [
        h("td", {}, [h("strong", { text: assignment.title }), assignment.dueAt ? h("small", { text: `Fällig ${new Date(`${assignment.dueAt}T00:00:00`).toLocaleDateString("de-DE")}` }) : null]),
        h("td", {}, codeButton),
        h("td", { text: String(assignment.courseIds.length) }),
        h("td", { class: "number", text: String(progress.learners) }),
        h("td", { class: "number", text: `${progress.percent}%` }),
        h("td", { class: "number", text: `${progress.averageMastery || 0}%` }),
        h("td", {}, h("span", { class: "status-dot", "data-status": assignment.status, text: assignment.status === "active" ? "Aktiv" : assignment.status === "archived" ? "Archiviert" : "Entwurf" })),
        h("td", {}, action),
      ]);
    });
    panel.append(h("section", { class: "admin-panel team-assignment-report" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Teamfortschritt" }), h("p", { class: "admin-context-line", text: "Mastery basiert ausschließlich auf synchronisierter Quiz-Evidenz." })]),
      h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
        h("thead", {}, h("tr", {}, ["Teamplan", "Code", "Kurse", "Lernende", "Abschluss", "Mastery", "Status", "Aktion"].map((label) => h("th", { scope: "col", text: label })))),
        h("tbody", {}, rows),
      ])),
    ]));
  }

  function renderChangesetTable(items) {
    if (!items.length) return emptyState("files", "Noch keine Änderungssätze", "Lege einen Entwurf an, um Kurse und Pfade nachvollziehbar zu bearbeiten.", button("Ersten Entwurf anlegen", "primary", openChangesetDialog, "plus"));
    const tbody = h("tbody");
    for (const item of items) {
      tbody.append(h("tr", {}, [
        h("td", {}, h("button", { class: "admin-button admin-button--quiet", type: "button", onclick: () => selectChangeset(item.id), text: item.title })),
        h("td", {}, h("span", { class: "status-dot", "data-status": item.status, text: statusLabel(item.status) })),
        h("td", { text: item.updatedBy }),
        h("td", { text: new Date(item.updatedAt).toLocaleDateString("de-DE") }),
        h("td", { class: "number", text: item.version }),
      ]));
    }
    return h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
      h("thead", {}, h("tr", {}, ["Änderungssatz", "Status", "Bearbeitet von", "Aktualisiert", "Version"].map((label) => h("th", { scope: "col", text: label })))),
      tbody,
    ]));
  }

  function renderCourses() {
    const panel = $("#view-courses");
    const courses = state.snapshot.catalog.courses;
    if (!state.selectedCourseId || !courses.some((item) => item.id === state.selectedCourseId)) state.selectedCourseId = courses[0] && courses[0].id;
    const filtered = courses.filter((course) => `${course.id} ${course.title} ${course.summary || ""}`.toLowerCase().includes(state.courseQuery.toLowerCase()));
    panel.replaceChildren(pageHeading(
      "coursesTitle",
      "Inhaltsverwaltung",
      "Kurse",
      "Metadaten, Lernziele, Units und Activities gemeinsam bearbeiten.",
      button("Neuen Kurs erstellen", "primary", createCourse, "plus", { disabled: !state.active }),
    ));

    const listItems = h("div", { class: "content-list__items", role: "listbox", "aria-label": "Kurse" });
    for (const course of filtered) {
      listItems.append(h("button", {
        type: "button",
        class: `content-list__item${course.id === state.selectedCourseId ? " is-active" : ""}`,
        role: "option",
        "aria-selected": String(course.id === state.selectedCourseId),
        onclick: () => { state.selectedCourseId = course.id; renderCourses(); },
      }, [h("span", {}, [h("strong", { text: course.title }), h("small", { text: `${course.format || "Format offen"} · ${course.status || "Status offen"}` })]), h("code", { text: course.id })]));
    }
    const list = h("aside", { class: "content-list" }, [
      h("div", { class: "content-list__toolbar" }, h("div", { class: "admin-search" }, [
        icon("magnifying-glass"),
        h("input", { type: "search", value: state.courseQuery, placeholder: "Titel, ID oder Thema …", "aria-label": "Kurse durchsuchen", oninput: (event) => { state.courseQuery = event.target.value; renderCourses(); } }),
      ])),
      filtered.length ? listItems : emptyState("magnifying-glass", "Keine Kurse gefunden", "Passe den Suchbegriff an.", button("Suche leeren", "quiet", () => { state.courseQuery = ""; renderCourses(); })),
    ]);
    const course = courses.find((item) => item.id === state.selectedCourseId);
    const editor = course ? renderCourseEditor(course) : emptyState("books", "Noch kein Kurs", "Lege den ersten Kurs in diesem Entwurf an.");
    panel.append(h("div", { class: "content-shell" }, [list, h("div", { class: "content-editor" }, editor)]));
  }

  function renderCourseEditor(course) {
    const editable = Boolean(state.active && state.active.status === "draft");
    const update = (key, value) => { course[key] = value; markDirty(); };
    const heading = h("div", { class: "editor-heading" }, [
      h("div", {}, [h("h1", { text: course.title || "Unbenannter Kurs" }), h("p", { text: `${course.id} · ${course.source || "Eigener Kurs"}` })]),
      h("div", { class: "editor-actions" }, [
        button(state.coursePreview ? "Editor" : "Vorschau", "secondary", () => { state.coursePreview = !state.coursePreview; renderCourses(); }, state.coursePreview ? "pencil-simple" : "eye"),
        button("Duplizieren", "secondary", () => duplicateCourse(course), "copy", { disabled: !editable }),
        selectFor(course.status || "draft", [
          { value: "draft", label: "Entwurf" }, { value: "active", label: "Aktiv" }, { value: "planned", label: "Geplant" }, { value: "archived", label: "Archiviert" },
        ], (value) => { update("status", value); renderCourses(); }, { disabled: !editable, "aria-label": "Kursstatus" }),
      ]),
    ]);
    if (state.coursePreview) return [heading, renderCoursePreview(course)];
    const basics = h("section", { class: "editor-section" }, [
      h("h2", { text: "Grundlagen" }),
      h("div", { class: "admin-form-grid" }, [
        field("Kurs-ID", inputFor(course.id, () => {}, { readonly: true }), false, "Bleibt nach der Erstellung stabil."),
        field("Reihenfolge", inputFor(course.sequence, (value) => update("sequence", Number(value)), { type: "number", min: "1", disabled: !editable })),
        field("Titel", inputFor(course.title, (value) => update("title", value), { disabled: !editable, required: true }), true),
        field("Zusammenfassung", textareaFor(course.summary, (value) => update("summary", value), { disabled: !editable, rows: "4" }), true),
        field("Format", selectFor(course.format || "self-paced", [
          { value: "self-paced", label: "Self-paced" }, { value: "blended", label: "Blended" }, { value: "workshop", label: "Workshop" }, { value: "cohort", label: "Cohort" },
        ], (value) => update("format", value), { disabled: !editable })),
        field("Rolle", inputFor((course.roleIds || []).join(", "), (value) => update("roleIds", splitList(value)), { disabled: !editable }), false, "Kommagetrennte Rollen-IDs"),
        field("Voraussetzungen", inputFor((course.prerequisites || []).join(", "), (value) => update("prerequisites", splitList(value)), { disabled: !editable }), true, "Kurs-IDs, kommagetrennt; Zyklen blockieren das Review."),
      ]),
    ]);
    const outcomes = h("section", { class: "editor-section" }, [
      h("h2", { text: "Lernziele" }),
      field("Ein Lernziel pro Zeile", textareaFor((course.outcomes || []).join("\n"), (value) => update("outcomes", splitLines(value)), { disabled: !editable, rows: "6" }), true, "Beginne mit einem beobachtbaren Verb."),
    ]);
    const unitSection = h("section", { class: "editor-section" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Units und Activities" }), button("Unit hinzufügen", "secondary", () => addUnit(course.id), "plus", { disabled: !editable })]),
      renderUnitEditors(course.id, editable),
    ]);
    return [heading, h("div", { class: "editor-sections" }, [basics, outcomes, renderCourseStaffing(course, editable), unitSection])];
  }

  function exportCurriculum() {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      changeSet: state.active ? { id: state.active.id, title: state.active.title, version: state.active.version } : null,
      snapshot: state.snapshot,
      lessons: state.active ? state.active.lessons || {} : {},
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = h("a", { href: url, download: `curriculum-${state.active ? state.active.id : "published"}.json` });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Curriculum-Export wurde erstellt.");
  }

  function parseDelimited(text) {
    const firstLine = String(text).split(/\r?\n/, 1)[0];
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (char === '"') {
        if (quoted && text[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted;
      } else if (char === delimiter && !quoted) { row.push(value); value = ""; }
      else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && text[index + 1] === "\n") index += 1;
        row.push(value); value = "";
        if (row.some((cell) => cell.trim())) rows.push(row);
        row = [];
      } else value += char;
    }
    if (value || row.length) { row.push(value); rows.push(row); }
    const headers = (rows.shift() || []).map((header) => header.trim());
    return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, (cells[index] || "").trim()])));
  }

  async function previewImport(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file || !state.active) return;
    try {
      const text = await file.text();
      let snapshot;
      let summary;
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text);
        snapshot = clone(parsed.snapshot || parsed);
        if (!snapshot.catalog || !snapshot.curriculumMap) throw new Error("Die JSON-Datei enthält keinen vollständigen Curriculum-Snapshot.");
        summary = `${snapshot.catalog.courses.length} Kurse und ${snapshot.catalog.tracks.length} Lernpfade ersetzen den aktuellen Entwurfsstand.`;
      } else {
        const rows = parseDelimited(text);
        if (!rows.length || !Object.prototype.hasOwnProperty.call(rows[0], "id")) throw new Error("CSV benötigt mindestens die Spalte id.");
        snapshot = clone(state.snapshot);
        let created = 0;
        let updated = 0;
        for (const row of rows) {
          let course = snapshot.catalog.courses.find((item) => item.id === row.id);
          if (!course) {
            course = { id: row.id, sequence: snapshot.catalog.courses.length + 1, title: row.title || "Imported course", status: "draft", source: "CSV import", roleIds: [], dimensions: {}, interests: [], levels: [], specializationDepths: [], format: "self-paced", summary: "", outcomes: [], modules: [] };
            snapshot.catalog.courses.push(course);
            snapshot.curriculumMap.courseMaps[row.id] = [];
            created += 1;
          } else updated += 1;
          for (const key of ["title", "status", "format", "summary"]) if (row[key]) course[key] = row[key];
          if (row.sequence) course.sequence = Number(row.sequence);
          if (row.roleIds) course.roleIds = row.roleIds.split("|").map((item) => item.trim()).filter(Boolean);
          if (row.outcomes) course.outcomes = row.outcomes.split("|").map((item) => item.trim()).filter(Boolean);
        }
        summary = `${rows.length} CSV-Zeilen: ${created} neue und ${updated} bestehende Kurse. Nicht genannte Felder bleiben erhalten.`;
      }
      state.pendingImport = snapshot;
      $("#importSummary").replaceChildren(
        h("div", { class: "lesson-issue-summary" }, [icon("table"), h("span", { text: summary })]),
        h("p", { text: "Die Übernahme verändert nur den aktiven Entwurf. Erst Speichern, Grill, Review und Merge Request können daraus veröffentlichten Inhalt machen." }),
      );
      $("#importDialog").showModal();
    } catch (error) { toast(error.message, "error"); }
  }

  function closeImport() {
    state.pendingImport = null;
    $("#importDialog").close();
  }

  function applyImport() {
    if (!state.pendingImport) return closeImport();
    state.snapshot = state.pendingImport;
    state.pendingImport = null;
    $("#importDialog").close();
    markDirty();
    renderCurrentView();
    toast("Import wurde in den Entwurf übernommen und wartet auf Validierung.");
  }

  function renderCoursePreview(course) {
    const units = state.snapshot.curriculumMap.courseMaps[course.id] || [];
    return h("article", { class: "course-preview" }, [
      h("div", { class: "course-preview__hero" }, [
        h("h2", { text: course.title }),
        h("p", { class: "admin-context-line", text: `${course.id} · ${course.format || "Format offen"}` }),
        h("p", { text: course.summary || "Noch keine Zusammenfassung." }),
        h("div", { class: "course-preview__meta" }, [h("span", { text: `${units.length} Units` }), h("span", { text: `${units.reduce((sum, unit) => sum + (unit.lessons || []).length, 0)} Activities` }), h("span", { text: course.status || "draft" })]),
      ]),
      h("section", {}, [h("h3", { text: "Learning outcomes" }), h("ul", {}, (course.outcomes || []).map((outcome) => h("li", { text: outcome })))]),
      h("section", {}, [h("h3", { text: "Course outline" }), h("ol", { class: "course-preview__units" }, units.map((unit) => h("li", {}, [h("strong", { text: unit.title || "Untitled unit" }), h("span", { text: `${(unit.lessons || []).length} activities` })])))]),
    ]);
  }

  function duplicateCourse(course) {
    if (!state.active) return;
    const courses = state.snapshot.catalog.courses;
    const numbers = courses.map((item) => /^LRN-(\d+)$/.exec(item.id)).filter(Boolean).map((match) => Number(match[1]));
    const id = `LRN-${String(Math.max(0, ...numbers) + 1).padStart(2, "0")}`;
    const copy = clone(course);
    copy.id = id;
    copy.title = `${course.title} (Copy)`;
    copy.status = "draft";
    copy.sequence = Math.max(0, ...courses.map((item) => Number(item.sequence) || 0)) + 1;
    courses.push(copy);
    state.snapshot.curriculumMap.courseMaps[id] = clone(state.snapshot.curriculumMap.courseMaps[course.id] || []);
    state.selectedCourseId = id;
    state.coursePreview = false;
    markDirty();
    renderCourses();
  }

  function renderUnitEditors(courseId, editable) {
    const units = state.snapshot.curriculumMap.courseMaps[courseId] || [];
    if (!units.length) return emptyState("stack", "Noch keine Units", "Strukturiere den Kurs in fachlich zusammenhängende Units.", button("Erste Unit hinzufügen", "primary", () => addUnit(courseId), "plus", { disabled: !editable }));
    const list = h("div", { class: "unit-list" });
    units.forEach((unit, index) => {
      const activityText = (unit.lessons || []).map((lesson) => `${lesson.path} | ${lesson.title}`).join("\n");
      list.append(h("div", { class: "unit-row" }, [
        h("span", { class: "unit-index", text: `U${String(index + 1).padStart(2, "0")}` }),
        h("div", { class: "admin-form-grid" }, [
          field("Unit-Titel", inputFor(unit.title, (value) => { unit.title = value; markDirty(); }, { disabled: !editable }), true),
          field("Entscheidung", selectFor(unit.decision || "core", [
            { value: "core", label: "Kerninhalt" }, { value: "optional", label: "Optional" }, { value: "reference", label: "Referenz" },
          ], (value) => { unit.decision = value; markDirty(); }, { disabled: !editable })),
          field("Begründung", inputFor(unit.note || "", (value) => { unit.note = value; markDirty(); }, { disabled: !editable })),
          field("Activities", textareaFor(activityText, (value) => { unit.lessons = parseActivities(value); markDirty(); }, { disabled: !editable, rows: "5" }), true, "Eine Zeile je Activity: Pfad | sichtbarer Titel"),
        ]),
        h("button", { class: "row-action", type: "button", disabled: !editable, "aria-label": `Unit ${index + 1} entfernen`, title: "Unit entfernen", onclick: () => { units.splice(index, 1); markDirty(); renderCourses(); } }, icon("trash")),
      ]));
    });
    return list;
  }

  function addUnit(courseId) {
    if (!state.active) return openChangesetDialog();
    const maps = state.snapshot.curriculumMap.courseMaps;
    if (!maps[courseId]) maps[courseId] = [];
    maps[courseId].push({ title: "Neue Unit", decision: "core", note: "", lessons: [] });
    markDirty();
    renderCourses();
  }

  function parseActivities(value) {
    return splitLines(value).map((line) => {
      const index = line.indexOf("|");
      if (index < 0) return { path: line.trim(), title: line.trim().split("/").at(-1).replaceAll("-", " ") };
      return { path: line.slice(0, index).trim(), title: line.slice(index + 1).trim() };
    });
  }

  function splitLines(value) { return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean); }
  function splitList(value) { return String(value || "").split(",").map((item) => item.trim()).filter(Boolean); }

  function createCourse() {
    if (!state.active) return openChangesetDialog();
    const courses = state.snapshot.catalog.courses;
    const numbers = courses.map((course) => /^LRN-(\d+)$/.exec(course.id)).filter(Boolean).map((match) => Number(match[1]));
    const next = Math.max(0, ...numbers) + 1;
    const id = `LRN-${String(next).padStart(2, "0")}`;
    courses.push({
      id,
      sequence: Math.max(0, ...courses.map((course) => Number(course.sequence) || 0)) + 1,
      title: "Neuer Kurs",
      status: "draft",
      source: "Curriculum Admin",
      roleIds: [],
      dimensions: {},
      interests: [],
      levels: [],
      specializationDepths: [],
      format: "self-paced",
      summary: "",
      outcomes: [],
      modules: [],
    });
    state.snapshot.curriculumMap.courseMaps[id] = [];
    state.selectedCourseId = id;
    markDirty();
    renderCourses();
  }

  function renderPaths() {
    const panel = $("#view-paths");
    const paths = state.snapshot.catalog.tracks;
    if (!state.selectedPathId || !paths.some((item) => item.id === state.selectedPathId)) state.selectedPathId = paths[0] && paths[0].id;
    const filtered = paths.filter((track) => `${track.code} ${track.label}`.toLowerCase().includes(state.pathQuery.toLowerCase()));
    panel.replaceChildren(pageHeading(
      "pathsTitle", "Curriculum-Architektur", "Lernpfade", "Kurse nach Zielprofil, Tiefe und sinnvoller Reihenfolge kombinieren.",
      button("Neuen Lernpfad erstellen", "primary", createPath, "plus", { disabled: !state.active }),
    ));
    const items = h("div", { class: "content-list__items", role: "listbox", "aria-label": "Lernpfade" });
    for (const track of filtered) {
      const count = (track.stages || []).reduce((sum, stage) => sum + (stage.courses || []).length, 0);
      items.append(h("button", {
        type: "button", class: `content-list__item${track.id === state.selectedPathId ? " is-active" : ""}`, role: "option",
        "aria-selected": String(track.id === state.selectedPathId), onclick: () => { state.selectedPathId = track.id; renderPaths(); },
      }, [h("span", {}, [h("strong", { text: track.label }), h("small", { text: `${count} Kurszuordnungen` })]), h("code", { text: track.code })]));
    }
    const list = h("aside", { class: "content-list" }, [
      h("div", { class: "content-list__toolbar" }, h("div", { class: "admin-search" }, [icon("magnifying-glass"), h("input", { type: "search", value: state.pathQuery, placeholder: "Pfad suchen …", "aria-label": "Lernpfade durchsuchen", oninput: (event) => { state.pathQuery = event.target.value; renderPaths(); } })])),
      items,
    ]);
    const track = paths.find((item) => item.id === state.selectedPathId);
    panel.append(h("div", { class: "content-shell" }, [list, h("div", { class: "content-editor" }, track ? renderPathEditor(track) : emptyState("path", "Noch kein Lernpfad", "Lege den ersten Lernpfad an."))]));
  }

  function renderPathEditor(track) {
    const editable = Boolean(state.active && state.active.status === "draft");
    const update = (key, value) => { track[key] = value; markDirty(); };
    const heading = h("div", { class: "editor-heading" }, [h("div", {}, [h("h1", { text: track.label }), h("p", { text: `${track.code} · ${track.id}` })])]);
    const basics = h("section", { class: "editor-section" }, [
      h("h2", { text: "Ziel und Zuordnung" }),
      h("div", { class: "admin-form-grid" }, [
        field("Interne ID", inputFor(track.id, () => {}, { readonly: true })),
        field("Pfad-Code", inputFor(track.code, (value) => update("code", value), { disabled: !editable, pattern: "LP[0-9]{2}" })),
        field("Name", inputFor(track.label, (value) => update("label", value), { disabled: !editable }), true),
        field("Status", selectFor(track.status || "active", [{ value: "active", label: "Aktiv" }, { value: "draft", label: "Entwurf" }, { value: "archived", label: "Archiviert" }], (value) => update("status", value), { disabled: !editable })),
        field("Rolle", inputFor((track.roleIds || []).join(", "), (value) => update("roleIds", splitList(value)), { disabled: !editable }), true, "Kommagetrennte Rollen-IDs"),
      ]),
    ]);
    const stages = h("section", { class: "editor-section" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Stufen und Kurse" }), button("Stufe hinzufügen", "secondary", () => { track.stages = track.stages || []; track.stages.push({ label: "Neue Stufe", courses: [] }); markDirty(); renderPaths(); }, "plus", { disabled: !editable })]),
      renderStageEditors(track, editable),
    ]);
    const viewSwitch = h("div", { class: "path-view-switch", role: "group", "aria-label": "Lernpfad-Ansicht" }, [
      ["structure", "Struktur", "list-bullets"],
      ["matrix", "Rollen-/Level-Matrix", "grid-four"],
      ["graph", "Voraussetzungsgraph", "graph"],
    ].map(([value, label, iconName]) => button(label, state.pathView === value ? "primary" : "secondary", () => { state.pathView = value; renderPaths(); }, iconName, { "aria-pressed": String(state.pathView === value) })));
    const pathView = state.pathView === "matrix" ? renderPathMatrix(track) : state.pathView === "graph" ? renderPathGraph(track) : stages;
    return [heading, viewSwitch, h("div", { class: "editor-sections" }, [basics, pathView])];
  }

  function renderPathMatrix(track) {
    const specializations = (state.snapshot.catalog.specializations || []).filter((s) => s.keyAreaId === "ase");
    const coursesById = new Map((state.snapshot.catalog.courses || []).map((course) => [course.id, course]));
    const selectedIds = new Set((track.stages || []).flatMap((stage) => stage.courses || []));
    const depths = ["Acquire", "Deepen", "Create"];
    const tbody = h("tbody");
    for (const specialization of specializations) {
      const counts = Object.fromEntries(depths.map((depth) => [depth, 0]));
      for (const courseId of selectedIds) {
        const course = coursesById.get(courseId);
        const assignment = course && (course.specializationDepths || []).find((item) => item.specializationId === specialization.id);
        for (const depth of (assignment && assignment.depths) || []) if (depth in counts) counts[depth] += 1;
      }
      tbody.append(h("tr", {}, [h("th", { scope: "row" }, [h("strong", { text: specialization.labelDe || specialization.label }), h("small", { text: specialization.code })]), ...depths.map((depth) => h("td", { class: "coverage-cell", "data-covered": String(counts[depth] > 0), text: counts[depth] || "—" }))]));
    }
    return h("section", { class: "editor-section" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Rollen- und Level-Abdeckung" }), h("span", { text: `${selectedIds.size} eindeutige Kurse` })]),
      h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table coverage-matrix" }, [
        h("thead", {}, h("tr", {}, [h("th", { scope: "col", text: "ASE-Rolle" }), ...depths.map((depth) => h("th", { scope: "col", text: depth }))])),
        tbody,
      ])),
      h("p", { class: "admin-form-hint", text: "Zahlen zeigen, wie viele Kurse im Lernpfad die jeweilige Rolle auf diesem Vertiefungsniveau abdecken." }),
    ]);
  }

  function renderPathGraph(track) {
    const coursesById = new Map((state.snapshot.catalog.courses || []).map((course) => [course.id, course]));
    return h("section", { class: "editor-section" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Voraussetzungsfluss" }), h("span", { text: "Reihenfolge von links nach rechts" })]),
      h("div", { class: "path-graph", role: "img", "aria-label": `Voraussetzungsgraph für ${track.label}` }, (track.stages || []).map((stage, stageIndex) => h("div", { class: "path-graph__stage" }, [
        h("div", { class: "path-graph__stage-heading" }, [h("span", { text: stageIndex + 1 }), h("strong", { text: stage.label })]),
        h("div", { class: "path-graph__nodes" }, (stage.courses || []).map((courseId) => {
          const course = coursesById.get(courseId);
          return h("div", { class: "path-graph__node" }, [h("code", { text: courseId }), h("span", { text: course ? course.title : "Unbekannter Kurs" })]);
        })),
      ]))),
      h("p", { class: "admin-form-hint", text: "Die Stufenkanten modellieren die aktuelle Pfadreihenfolge. Explizite Lesson-Prerequisites werden zusätzlich im Repository-Audit geprüft." }),
    ]);
  }

  function renderStageEditors(track, editable) {
    const list = h("div", { class: "stage-list" });
    (track.stages || []).forEach((stage, index) => {
      list.append(h("div", { class: "stage-row" }, [
        h("span", { class: "unit-index", text: index + 1 }),
        h("div", { class: "admin-form-grid" }, [
          field("Stufenname", inputFor(stage.label, (value) => { stage.label = value; markDirty(); }, { disabled: !editable })),
          field("Kurse", textareaFor((stage.courses || []).join(", "), (value) => { stage.courses = splitList(value); markDirty(); }, { disabled: !editable, rows: "3" }), false, "Kurs-IDs in gewünschter Reihenfolge"),
        ]),
        h("button", { class: "row-action", type: "button", disabled: !editable, "aria-label": `Stufe ${index + 1} entfernen`, onclick: () => { track.stages.splice(index, 1); markDirty(); renderPaths(); } }, icon("trash")),
      ]));
    });
    return list;
  }

  function lessonTitle(lesson) {
    const match = /^#\s+(.+)$/m.exec((lesson.files && lesson.files["docs/en.md"]) || "");
    return match ? match[1].trim() : lesson.path.split("/").at(-1);
  }

  async function selectLesson(lessonPath) {
    if (state.lessonDirty) await saveLessonDraft(true);
    state.selectedLessonPath = lessonPath;
    state.lessonFile = "docs/en.md";
    state.activeLesson = null;
    renderLessons();
    try {
      const suffix = state.active ? `&changeset=${encodeURIComponent(state.active.id)}` : "";
      const body = await api(`/api/admin/lessons?path=${encodeURIComponent(lessonPath)}${suffix}`);
      state.activeLesson = body.lesson;
      state.lessonIssues = body.issues || [];
      state.lessonDirty = false;
      renderLessons();
    } catch (error) { toast(error.message, "error"); }
  }

  function markLessonDirty() {
    state.lessonDirty = true;
    setSaveStatus("Lesson noch nicht im Änderungssatz gespeichert", "dirty");
  }

  async function saveLessonDraft(quiet = false) {
    if (!state.active || !state.activeLesson || !state.lessonDirty) return;
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          expectedVersion: state.active.version,
          path: state.activeLesson.path,
          mode: state.activeLesson.mode,
          files: state.activeLesson.files,
        }),
      });
      state.active = body.changeset;
      state.activeLesson = body.lesson;
      state.lessonIssues = body.issues || [];
      state.lessonDirty = false;
      setSaveStatus(`Version ${state.active.version} · Lesson gespeichert`, "saved");
      await refreshChangeSets(false);
      if (!quiet) toast(state.lessonIssues.length ? `Lesson gespeichert · ${state.lessonIssues.length} offene Vertragspunkte.` : "Lesson im Änderungssatz gespeichert.");
      renderLessons();
    } catch (error) { toast(error.message, "error"); }
  }

  function addLessonFile(file, initial) {
    if (!state.activeLesson || Object.prototype.hasOwnProperty.call(state.activeLesson.files, file)) return;
    state.activeLesson.files[file] = initial;
    state.lessonFile = file;
    markLessonDirty();
    renderLessons();
  }

  function removeLessonFile() {
    if (!state.activeLesson || ["docs/en.md", "quiz.json"].includes(state.lessonFile) || /^code\/main\./.test(state.lessonFile)) return;
    delete state.activeLesson.files[state.lessonFile];
    state.lessonFile = Object.keys(state.activeLesson.files).sort()[0] || "docs/en.md";
    markLessonDirty();
    renderLessons();
  }

  // ---------------------------------------------------------------------------
  // Trainerverwaltung und Kurskalender
  // ---------------------------------------------------------------------------

  const LANGUAGE_OPTIONS = [
    { value: "de", label: "Deutsch" },
    { value: "en", label: "Englisch" },
  ];
  const DELIVERY_OPTIONS = [
    { value: "onsite", label: "Präsenz" },
    { value: "remote", label: "Remote" },
    { value: "hybrid", label: "Hybrid" },
  ];
  const SESSION_STATUS_OPTIONS = [
    { value: "planned", label: "Geplant" },
    { value: "confirmed", label: "Bestätigt" },
    { value: "full", label: "Ausgebucht" },
    { value: "cancelled", label: "Abgesagt" },
    { value: "done", label: "Durchgeführt" },
  ];

  function trainerList() {
    if (!Array.isArray(state.snapshot.catalog.trainers)) state.snapshot.catalog.trainers = [];
    return state.snapshot.catalog.trainers;
  }

  function sessionList() {
    if (!Array.isArray(state.snapshot.catalog.sessions)) state.snapshot.catalog.sessions = [];
    return state.snapshot.catalog.sessions;
  }

  function trainerName(trainerId) {
    const trainer = trainerList().find((item) => item.id === trainerId);
    return trainer ? trainer.name || trainer.id : trainerId;
  }

  function courseTitle(courseId) {
    const course = state.snapshot.catalog.courses.find((item) => item.id === courseId);
    return course ? course.title : courseId;
  }

  function optionLabel(options, value, fallback) {
    const match = options.find((option) => option.value === value);
    return match ? match.label : value || fallback;
  }

  function sessionMoment(value) {
    if (typeof value !== "string" || !value) return null;
    const stamp = Date.parse(value.length === 10 ? `${value}T00:00` : value);
    return Number.isNaN(stamp) ? null : new Date(stamp);
  }

  function formatSessionRange(session) {
    const start = sessionMoment(session.start);
    const end = sessionMoment(session.end);
    if (!start) return "Termin offen";
    const day = (date) => date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const time = (date) => date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const hasTime = String(session.start).length > 10;
    if (!end || day(start) === day(end)) {
      return hasTime ? `${day(start)}, ${time(start)}–${end ? time(end) : "offen"}` : day(start);
    }
    return `${day(start)} – ${day(end)}`;
  }

  function sortedSessions(items) {
    return items.slice().sort((left, right) => String(left.start || "").localeCompare(String(right.start || "")));
  }

  function sessionsForCourse(courseId) {
    return sortedSessions(sessionList().filter((session) => session.courseId === courseId));
  }

  function sessionsForTrainer(trainerId) {
    return sortedSessions(sessionList().filter((session) => (session.trainerIds || []).includes(trainerId)));
  }

  function isEditable() {
    return Boolean(state.active && state.active.status === "draft");
  }

  function createTrainer() {
    if (!state.active) return openChangesetDialog();
    const trainers = trainerList();
    const numbers = trainers.map((item) => /^TR-(\d+)$/.exec(item.id || "")).filter(Boolean).map((match) => Number(match[1]));
    const id = `TR-${String(Math.max(0, ...numbers) + 1).padStart(2, "0")}`;
    trainers.push({
      id,
      name: "Neue Trainerin oder neuer Trainer",
      email: "",
      unit: "",
      languages: ["de"],
      status: "active",
      initials: "",
      photo: "",
      bio: "",
      topics: [],
      capacity: { sessionsPerMonth: null, note: "" },
    });
    state.selectedTrainerId = id;
    markDirty();
    renderTrainers();
  }

  function deleteTrainer(trainer) {
    const courses = state.snapshot.catalog.courses.filter((course) => course.ownerTrainerId === trainer.id || (course.trainerIds || []).includes(trainer.id));
    const sessions = sessionsForTrainer(trainer.id);
    if (courses.length || sessions.length) {
      toast(`${trainer.id} ist noch ${courses.length} Kursen und ${sessions.length} Terminen zugeordnet. Bitte zuerst dort entfernen.`, "error");
      return;
    }
    const trainers = trainerList();
    trainers.splice(trainers.indexOf(trainer), 1);
    state.selectedTrainerId = null;
    markDirty();
    renderTrainers();
  }

  function renderTrainers() {
    const panel = $("#view-trainers");
    const trainers = trainerList();
    if (!state.selectedTrainerId || !trainers.some((item) => item.id === state.selectedTrainerId)) {
      state.selectedTrainerId = trainers[0] ? trainers[0].id : null;
    }
    const query = state.trainerQuery.toLowerCase();
    const filtered = trainers.filter((trainer) => `${trainer.id} ${trainer.name || ""} ${trainer.unit || ""} ${(trainer.topics || []).join(" ")}`.toLowerCase().includes(query));
    panel.replaceChildren(pageHeading(
      "trainersTitle",
      "Durchführung",
      "Trainer",
      "Wer verantwortet einen Kurs fachlich und wer führt ihn durch?",
      button("Trainer anlegen", "primary", createTrainer, "plus", { disabled: !state.active }),
    ));

    const items = h("div", { class: "content-list__items", role: "listbox", "aria-label": "Trainer" });
    for (const trainer of filtered) {
      const owned = state.snapshot.catalog.courses.filter((course) => course.ownerTrainerId === trainer.id).length;
      items.append(h("button", {
        type: "button",
        class: `content-list__item${trainer.id === state.selectedTrainerId ? " is-active" : ""}`,
        role: "option",
        "aria-selected": String(trainer.id === state.selectedTrainerId),
        onclick: () => { state.selectedTrainerId = trainer.id; renderTrainers(); },
      }, [
        h("span", {}, [
          h("strong", { text: trainer.name || trainer.id }),
          h("small", { text: `${trainer.unit || "Ohne Einheit"} · ${owned} verantwortet${trainer.status === "inactive" ? " · inaktiv" : ""}` }),
        ]),
        h("code", { text: trainer.id }),
      ]));
    }
    const list = h("aside", { class: "content-list" }, [
      h("div", { class: "content-list__toolbar" }, h("div", { class: "admin-search" }, [
        icon("magnifying-glass"),
        h("input", { type: "search", value: state.trainerQuery, placeholder: "Name, Einheit oder Thema …", "aria-label": "Trainer durchsuchen", oninput: (event) => { state.trainerQuery = event.target.value; renderTrainers(); } }),
      ])),
      filtered.length || !state.trainerQuery
        ? items
        : emptyState("magnifying-glass", "Keine Trainer gefunden", "Passe den Suchbegriff an.", button("Suche leeren", "quiet", () => { state.trainerQuery = ""; renderTrainers(); })),
    ]);
    const trainer = trainers.find((item) => item.id === state.selectedTrainerId);
    const editor = trainer
      ? renderTrainerEditor(trainer)
      : emptyState("users-three", "Noch keine Trainer", "Lege die Personen an, die Kurse verantworten und durchführen.", button("Ersten Trainer anlegen", "primary", createTrainer, "plus", { disabled: !state.active }));
    panel.append(h("div", { class: "content-shell" }, [list, h("div", { class: "content-editor" }, editor)]));
  }

  function renderTrainerEditor(trainer) {
    const editable = isEditable();
    const update = (key, value) => { trainer[key] = value; markDirty(); };
    const updateCapacity = (key, value) => {
      trainer.capacity = trainer.capacity || {};
      trainer.capacity[key] = value;
      markDirty();
    };
    const heading = h("div", { class: "editor-heading" }, [
      h("div", {}, [
        h("h1", { text: trainer.name || trainer.id }),
        h("p", { text: `${trainer.id} · ${trainer.unit || "Ohne Organisationseinheit"}` }),
      ]),
      h("div", { class: "editor-actions" }, [
        selectFor(trainer.status || "active", [
          { value: "active", label: "Aktiv" },
          { value: "inactive", label: "Inaktiv" },
        ], (value) => { update("status", value); renderTrainers(); }, { disabled: !editable, "aria-label": "Trainerstatus" }),
        button("Entfernen", "secondary", () => deleteTrainer(trainer), "trash", { disabled: !editable }),
      ]),
    ]);

    const basics = h("section", { class: "editor-section" }, [
      h("h2", { text: "Grundlagen" }),
      h("div", { class: "admin-form-grid" }, [
        field("Trainer-ID", inputFor(trainer.id, () => {}, { readonly: true }), false, "Bleibt nach der Anlage stabil."),
        field("Name", inputFor(trainer.name, (value) => update("name", value), { disabled: !editable, required: true })),
        field("E-Mail", inputFor(trainer.email, (value) => update("email", value), { type: "email", disabled: !editable })),
        field("Organisationseinheit", inputFor(trainer.unit, (value) => update("unit", value), { disabled: !editable })),
        field("Sprachen", inputFor((trainer.languages || []).join(", "), (value) => update("languages", splitList(value)), { disabled: !editable }), false, "Sprachcodes, kommagetrennt, zum Beispiel de, en"),
      ]),
    ]);

    const profile = h("section", { class: "editor-section" }, [
      h("h2", { text: "Profil" }),
      h("div", { class: "admin-form-grid" }, [
        field("Initialen", inputFor(trainer.initials, (value) => update("initials", value), { disabled: !editable, maxlength: "3" }), false, "Leer lassen, dann werden sie aus dem Namen gebildet."),
        field("Foto", inputFor(trainer.photo, (value) => update("photo", value), { disabled: !editable }), false, "Pfad unterhalb von site/, zum Beispiel assets/trainers/tr-01.jpg"),
        field("Kurzbio", textareaFor(trainer.bio, (value) => update("bio", value), { disabled: !editable, rows: "4" }), true),
        field("Themenschwerpunkte", inputFor((trainer.topics || []).join(", "), (value) => update("topics", splitList(value)), { disabled: !editable }), true, "Kommagetrennt"),
      ]),
    ]);

    const capacity = h("section", { class: "editor-section" }, [
      h("h2", { text: "Kapazität" }),
      h("div", { class: "admin-form-grid" }, [
        field("Termine pro Monat", inputFor(trainer.capacity && trainer.capacity.sessionsPerMonth, (value) => updateCapacity("sessionsPerMonth", value === "" ? null : Number(value)), { type: "number", min: "0", disabled: !editable }), false, "Leer lassen, wenn keine Obergrenze gilt."),
        field("Verfügbarkeit", inputFor(trainer.capacity && trainer.capacity.note, (value) => updateCapacity("note", value), { disabled: !editable }), true, "Freitext, zum Beispiel: freitags nicht verfügbar"),
      ]),
    ]);

    const owned = state.snapshot.catalog.courses.filter((course) => course.ownerTrainerId === trainer.id);
    const pooled = state.snapshot.catalog.courses.filter((course) => (course.trainerIds || []).includes(trainer.id) && course.ownerTrainerId !== trainer.id);
    const upcoming = sessionsForTrainer(trainer.id).filter((session) => {
      const end = sessionMoment(session.end || session.start);
      return !end || end.getTime() >= Date.now();
    });
    const courseLink = (course) => h("button", {
      type: "button",
      class: "admin-button admin-button--quiet",
      text: `${course.id} · ${course.title}`,
      onclick: () => { state.selectedCourseId = course.id; activateView("courses"); },
    });
    const assignments = h("section", { class: "editor-section" }, [
      h("h2", { text: "Zuständigkeiten" }),
      h("div", { class: "trainer-refs" }, [
        h("div", {}, [
          h("h3", { text: `Verantwortlich für ${owned.length}` }),
          owned.length ? h("ul", {}, owned.map((course) => h("li", {}, courseLink(course)))) : h("p", { class: "metric-context", text: "Noch kein Kurs zugewiesen." }),
        ]),
        h("div", {}, [
          h("h3", { text: `Im Trainerpool von ${pooled.length}` }),
          pooled.length ? h("ul", {}, pooled.map((course) => h("li", {}, courseLink(course)))) : h("p", { class: "metric-context", text: "In keinem weiteren Trainerpool." }),
        ]),
        h("div", {}, [
          h("h3", { text: `Kommende Termine ${upcoming.length}` }),
          upcoming.length
            ? h("ul", {}, upcoming.slice(0, 6).map((session) => h("li", {}, h("button", {
              type: "button",
              class: "admin-button admin-button--quiet",
              text: `${formatSessionRange(session)} · ${session.courseId}`,
              onclick: () => { state.selectedSessionId = session.id; activateView("calendar"); },
            }))))
            : h("p", { class: "metric-context", text: "Keine kommenden Termine." }),
        ]),
      ]),
    ]);

    return [heading, h("div", { class: "editor-sections" }, [basics, profile, capacity, assignments])];
  }

  function renderCourseStaffing(course, editable) {
    const trainers = trainerList();
    const pool = Array.isArray(course.trainerIds) ? course.trainerIds : [];
    const togglePool = (trainerId, checked) => {
      const next = new Set(pool);
      if (checked) next.add(trainerId); else next.delete(trainerId);
      course.trainerIds = trainers.filter((item) => next.has(item.id)).map((item) => item.id);
      markDirty();
      renderCourses();
    };
    const roster = trainers.length
      ? h("div", { class: "trainer-picker" }, trainers.map((trainer) => h("label", { class: `trainer-picker__item${pool.includes(trainer.id) ? " is-active" : ""}` }, [
        h("input", { type: "checkbox", checked: pool.includes(trainer.id), disabled: !editable, onchange: (event) => togglePool(trainer.id, event.target.checked) }),
        h("span", {}, [h("strong", { text: trainer.name || trainer.id }), h("small", { text: `${trainer.id} · ${(trainer.languages || []).join(", ") || "Sprache offen"}` })]),
      ])))
      : h("p", { class: "metric-context", text: "Noch keine Trainer angelegt." });

    const sessions = sessionsForCourse(course.id);
    const upcoming = sessions.filter((session) => {
      const end = sessionMoment(session.end || session.start);
      return !end || end.getTime() >= Date.now();
    });

    return h("section", { class: "editor-section" }, [
      h("div", { class: "admin-panel__header" }, [
        h("h2", { text: "Verantwortung und Trainer" }),
        button("Trainer verwalten", "quiet", () => activateView("trainers"), "arrow-right"),
      ]),
      h("div", { class: "admin-form-grid" }, [
        field("Verantwortlich", selectFor(course.ownerTrainerId || "", [
          { value: "", label: "Nicht zugewiesen" },
          ...trainers.map((trainer) => ({ value: trainer.id, label: `${trainer.name || trainer.id} (${trainer.id})` })),
        ], (value) => { course.ownerTrainerId = value || undefined; markDirty(); renderCourses(); }, { disabled: !editable }), false, "Fachliche Verantwortung für die Inhalte."),
      ]),
      h("h3", { class: "editor-subheading", text: "Trainerpool" }),
      h("p", { class: "metric-context", text: "Termine dieses Kurses wählen ihre Trainer aus diesem Pool." }),
      roster,
      h("h3", { class: "editor-subheading", text: `Kommende Termine (${upcoming.length})` }),
      upcoming.length
        ? h("ul", { class: "course-session-list" }, upcoming.slice(0, 5).map((session) => h("li", {}, h("button", {
          type: "button",
          class: "admin-button admin-button--quiet",
          text: `${formatSessionRange(session)} · ${String(session.language || "").toUpperCase()} · ${optionLabel(DELIVERY_OPTIONS, session.delivery, "Format offen")}`,
          onclick: () => { state.selectedSessionId = session.id; activateView("calendar"); },
        }))))
        : h("p", { class: "metric-context", text: "Für diesen Kurs ist kein Termin geplant." }),
      button("Termin anlegen", "secondary", () => createSession(course.id), "calendar-plus", { disabled: !editable }),
    ]);
  }

  function createSession(courseId) {
    if (!state.active) return openChangesetDialog();
    const sessions = sessionList();
    const year = new Date().getFullYear();
    const numbers = sessions.map((item) => new RegExp(`^SES-${year}-(\\d{3})$`).exec(item.id || "")).filter(Boolean).map((match) => Number(match[1]));
    const id = `SES-${year}-${String(Math.max(0, ...numbers) + 1).padStart(3, "0")}`;
    const course = state.snapshot.catalog.courses.find((item) => item.id === courseId) || state.snapshot.catalog.courses[0];
    const start = new Date();
    start.setDate(start.getDate() + 14);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(17, 0, 0, 0);
    sessions.push({
      id,
      courseId: course ? course.id : "",
      start: localInputValue(start),
      end: localInputValue(end),
      language: "de",
      delivery: "remote",
      location: "",
      trainerIds: course && course.ownerTrainerId ? [course.ownerTrainerId] : [],
      seats: null,
      seatsTaken: 0,
      status: "planned",
      registrationUrl: "",
      note: "",
    });
    state.selectedSessionId = id;
    markDirty();
    activateView("calendar");
  }

  function deleteSession(session) {
    const sessions = sessionList();
    sessions.splice(sessions.indexOf(session), 1);
    state.selectedSessionId = null;
    markDirty();
    renderCalendar();
  }

  function localInputValue(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function visibleSessions() {
    const filters = state.calendarFilters;
    return sortedSessions(sessionList().filter((session) => {
      if (filters.courseId && session.courseId !== filters.courseId) return false;
      if (filters.trainerId && !(session.trainerIds || []).includes(filters.trainerId)) return false;
      if (filters.language && session.language !== filters.language) return false;
      if (filters.status && session.status !== filters.status) return false;
      return true;
    }));
  }

  function shiftCalendarMonth(offset) {
    const [year, month] = state.calendarMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    state.calendarMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    renderCalendar();
  }

  function renderCalendar() {
    const panel = $("#view-calendar");
    if (!state.calendarMonth) state.calendarMonth = localInputValue(new Date()).slice(0, 7);
    const sessions = visibleSessions();
    if (state.selectedSessionId && !sessionList().some((item) => item.id === state.selectedSessionId)) state.selectedSessionId = null;
    panel.replaceChildren(pageHeading(
      "calendarTitle",
      "Durchführung",
      "Kalender",
      "Wann welcher Kurs läuft, in welcher Sprache und mit wem.",
      button("Termin anlegen", "primary", () => createSession(state.calendarFilters.courseId || null), "plus", { disabled: !state.active }),
    ));

    const setFilter = (key, value) => { state.calendarFilters[key] = value; renderCalendar(); };
    const filters = h("div", { class: "calendar-filters" }, [
      field("Kurs", selectFor(state.calendarFilters.courseId, [
        { value: "", label: "Alle Kurse" },
        ...state.snapshot.catalog.courses.map((course) => ({ value: course.id, label: `${course.id} · ${course.title}` })),
      ], (value) => setFilter("courseId", value))),
      field("Trainer", selectFor(state.calendarFilters.trainerId, [
        { value: "", label: "Alle Trainer" },
        ...trainerList().map((trainer) => ({ value: trainer.id, label: trainer.name || trainer.id })),
      ], (value) => setFilter("trainerId", value))),
      field("Sprache", selectFor(state.calendarFilters.language, [
        { value: "", label: "Alle Sprachen" },
        ...LANGUAGE_OPTIONS,
      ], (value) => setFilter("language", value))),
      field("Status", selectFor(state.calendarFilters.status, [
        { value: "", label: "Alle Status" },
        ...SESSION_STATUS_OPTIONS,
      ], (value) => setFilter("status", value))),
      h("div", { class: "calendar-view-switch", role: "group", "aria-label": "Kalenderansicht" }, [
        ["list", "Liste", "list-bullets"],
        ["month", "Monat", "calendar-blank"],
      ].map(([value, label, iconName]) => button(label, state.calendarView === value ? "primary" : "secondary", () => { state.calendarView = value; renderCalendar(); }, iconName, { "aria-pressed": String(state.calendarView === value) }))),
    ]);

    const content = state.calendarView === "month" ? renderCalendarMonth(sessions) : renderCalendarList(sessions);
    const selected = sessionList().find((item) => item.id === state.selectedSessionId);
    const shell = h("div", { class: `calendar-shell${selected ? " calendar-shell--split" : ""}` }, [
      h("div", { class: "calendar-main" }, content),
      selected ? h("aside", { class: "calendar-editor" }, renderSessionEditor(selected)) : null,
    ]);
    panel.append(filters, shell);
  }

  function sessionChip(session, compact) {
    const trainers = (session.trainerIds || []).map(trainerName).join(", ");
    return h("button", {
      type: "button",
      class: `session-chip${session.id === state.selectedSessionId ? " is-active" : ""}`,
      "data-status": session.status || "planned",
      title: `${courseTitle(session.courseId)} · ${formatSessionRange(session)}${trainers ? ` · ${trainers}` : ""}`,
      onclick: () => { state.selectedSessionId = session.id; renderCalendar(); },
    }, compact
      ? [h("strong", { text: session.courseId }), h("small", { text: String(session.language || "").toUpperCase() })]
      : [
        h("strong", { text: `${session.courseId} · ${courseTitle(session.courseId)}` }),
        h("small", { text: `${String(session.language || "–").toUpperCase()} · ${optionLabel(DELIVERY_OPTIONS, session.delivery, "Format offen")}${session.location ? ` · ${session.location}` : ""} · ${trainers || "Trainer offen"}` }),
      ]);
  }

  function seatLabel(session) {
    const seats = Number(session.seats);
    if (!Number.isFinite(seats) || seats <= 0) return "Plätze offen";
    const taken = Number(session.seatsTaken) || 0;
    return `${taken}/${seats} Plätze`;
  }

  function renderCalendarList(sessions) {
    if (!sessions.length) {
      return emptyState("calendar-dots", "Keine Termine", "Für die aktuelle Auswahl ist nichts geplant.", button("Termin anlegen", "primary", () => createSession(state.calendarFilters.courseId || null), "plus", { disabled: !state.active }));
    }
    const groups = new Map();
    for (const session of sessions) {
      const date = sessionMoment(session.start);
      const key = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "offen";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(session);
    }
    const list = h("div", { class: "calendar-list" });
    for (const [key, items] of groups) {
      const label = key === "offen"
        ? "Ohne Datum"
        : new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
      list.append(h("section", { class: "calendar-group" }, [
        h("h2", { text: label }),
        h("div", { class: "calendar-group__items" }, items.map((session) => h("article", { class: "session-row" }, [
          h("span", { class: "session-row__date", text: formatSessionRange(session) }),
          sessionChip(session, false),
          h("span", { class: "status-dot", "data-status": session.status || "planned", text: optionLabel(SESSION_STATUS_OPTIONS, session.status, "Geplant") }),
          h("span", { class: "session-row__seats", text: seatLabel(session) }),
        ]))),
      ]));
    }
    return list;
  }

  function renderCalendarMonth(sessions) {
    const [year, month] = state.calendarMonth.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const offset = (first.getDay() + 6) % 7;
    const gridStart = new Date(year, month - 1, 1 - offset);
    const monthLabel = first.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    const byDay = new Map();
    for (const session of sessions) {
      const start = sessionMoment(session.start);
      const end = sessionMoment(session.end) || start;
      if (!start) continue;
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (cursor <= last) {
        const key = localInputValue(cursor).slice(0, 10);
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(session);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    const head = h("div", { class: "calendar-month__head" }, [
      button("Voriger Monat", "quiet", () => shiftCalendarMonth(-1), "caret-left", { "aria-label": "Voriger Monat" }),
      h("h2", { text: monthLabel }),
      button("Nächster Monat", "quiet", () => shiftCalendarMonth(1), "caret-right", { "aria-label": "Nächster Monat" }),
      button("Heute", "secondary", () => { state.calendarMonth = localInputValue(new Date()).slice(0, 7); renderCalendar(); }, "crosshair"),
    ]);
    const grid = h("div", { class: "calendar-month__grid", role: "grid", "aria-label": `Kalender ${monthLabel}` });
    for (const label of ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]) {
      grid.append(h("div", { class: "calendar-month__weekday", role: "columnheader", text: label }));
    }
    const today = localInputValue(new Date()).slice(0, 10);
    for (let index = 0; index < 42; index += 1) {
      const day = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const key = localInputValue(day).slice(0, 10);
      const outside = day.getMonth() !== month - 1;
      const items = byDay.get(key) || [];
      grid.append(h("div", {
        class: `calendar-month__day${outside ? " is-outside" : ""}${key === today ? " is-today" : ""}`,
        role: "gridcell",
        "aria-label": day.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }),
      }, [
        h("span", { class: "calendar-month__daynum", text: String(day.getDate()) }),
        ...items.map((session) => sessionChip(session, true)),
      ]));
    }
    return h("div", { class: "calendar-month" }, [head, grid]);
  }

  function renderSessionEditor(session) {
    const editable = isEditable();
    const update = (key, value) => { session[key] = value; markDirty(); renderCalendar(); };
    const quietUpdate = (key, value) => { session[key] = value; markDirty(); };
    const course = state.snapshot.catalog.courses.find((item) => item.id === session.courseId);
    const pool = course && Array.isArray(course.trainerIds) ? course.trainerIds : [];
    const assigned = Array.isArray(session.trainerIds) ? session.trainerIds : [];
    const toggleTrainer = (trainerId, checked) => {
      const next = new Set(assigned);
      if (checked) next.add(trainerId); else next.delete(trainerId);
      session.trainerIds = trainerList().filter((item) => next.has(item.id)).map((item) => item.id);
      markDirty();
      renderCalendar();
    };
    const candidates = trainerList().filter((trainer) => pool.includes(trainer.id) || assigned.includes(trainer.id));
    const others = trainerList().filter((trainer) => !pool.includes(trainer.id) && !assigned.includes(trainer.id));

    return [
      h("div", { class: "editor-heading" }, [
        h("div", {}, [
          h("h2", { text: courseTitle(session.courseId) }),
          h("p", { text: `${session.id} · ${formatSessionRange(session)}` }),
        ]),
        h("div", { class: "editor-actions" }, [
          button("Schließen", "quiet", () => { state.selectedSessionId = null; renderCalendar(); }, "x", { "aria-label": "Termindetails schließen" }),
          button("Entfernen", "secondary", () => deleteSession(session), "trash", { disabled: !editable }),
        ]),
      ]),
      h("div", { class: "admin-form-grid" }, [
        field("Kurs", selectFor(session.courseId, state.snapshot.catalog.courses.map((item) => ({ value: item.id, label: `${item.id} · ${item.title}` })), (value) => update("courseId", value), { disabled: !editable }), true),
        field("Beginn", inputFor(session.start, (value) => quietUpdate("start", value), { type: "datetime-local", disabled: !editable })),
        field("Ende", inputFor(session.end, (value) => quietUpdate("end", value), { type: "datetime-local", disabled: !editable })),
        field("Sprache", selectFor(session.language || "de", LANGUAGE_OPTIONS, (value) => update("language", value), { disabled: !editable })),
        field("Format", selectFor(session.delivery || "remote", DELIVERY_OPTIONS, (value) => update("delivery", value), { disabled: !editable })),
        field("Ort", inputFor(session.location, (value) => quietUpdate("location", value), { disabled: !editable }), true, "Bei Präsenz erforderlich, sonst zum Beispiel Teams."),
        field("Plätze", inputFor(session.seats, (value) => quietUpdate("seats", value === "" ? null : Number(value)), { type: "number", min: "0", disabled: !editable })),
        field("Belegt", inputFor(session.seatsTaken, (value) => quietUpdate("seatsTaken", value === "" ? null : Number(value)), { type: "number", min: "0", disabled: !editable })),
        field("Status", selectFor(session.status || "planned", SESSION_STATUS_OPTIONS, (value) => update("status", value), { disabled: !editable })),
        field("Anmeldung", inputFor(session.registrationUrl, (value) => quietUpdate("registrationUrl", value), { type: "url", disabled: !editable }), true, "Link zur Buchung, zum Beispiel MyCompetence."),
        field("Notiz", textareaFor(session.note, (value) => quietUpdate("note", value), { disabled: !editable, rows: "3" }), true),
      ]),
      h("h3", { class: "editor-subheading", text: "Trainer" }),
      candidates.length || others.length
        ? h("div", { class: "trainer-picker" }, [...candidates, ...others].map((trainer) => h("label", { class: `trainer-picker__item${assigned.includes(trainer.id) ? " is-active" : ""}` }, [
          h("input", { type: "checkbox", checked: assigned.includes(trainer.id), disabled: !editable, onchange: (event) => toggleTrainer(trainer.id, event.target.checked) }),
          h("span", {}, [
            h("strong", { text: trainer.name || trainer.id }),
            h("small", { text: pool.includes(trainer.id) ? `Im Pool · ${(trainer.languages || []).join(", ") || "Sprache offen"}` : `Außerhalb des Pools · ${(trainer.languages || []).join(", ") || "Sprache offen"}` }),
          ]),
        ])))
        : h("p", { class: "metric-context", text: "Noch keine Trainer angelegt." }),
    ];
  }

  function renderLessons() {
    const panel = $("#view-lessons");
    panel.replaceChildren(pageHeading(
      "lessonsTitle",
      "Repository-Inhalte",
      "Lessons",
      "Dokumentation, Quiz, Code, Tests und Outputs bleiben gemeinsam versioniert.",
      button("Neue Lesson", "primary", openLessonDialog, "plus", { disabled: !state.active || state.active.status !== "draft" }),
    ));
    const query = state.lessonQuery.toLowerCase();
    const lessons = state.lessons.filter((lesson) => !query || `${lesson.title} ${lesson.path}`.toLowerCase().includes(query));
    const list = h("div", { class: "content-list" }, [
      h("div", { class: "content-list__toolbar" }, h("div", { class: "admin-search" }, [icon("magnifying-glass"), inputFor(state.lessonQuery, (value) => { state.lessonQuery = value; renderLessons(); }, { type: "search", placeholder: "Lessons durchsuchen", "aria-label": "Lessons durchsuchen" })])),
      h("div", { class: "content-list__items" }, lessons.map((lesson) => h("button", {
        type: "button",
        class: `content-list__item${lesson.path === state.selectedLessonPath ? " is-active" : ""}`,
        onclick: () => selectLesson(lesson.path),
      }, [h("span", {}, [h("strong", { text: lesson.title }), h("small", { text: `${lesson.phase} · ${lesson.language}` })]), h("code", { text: lesson.slug.slice(0, 3) })]))),
    ]);
    const editor = h("div", { class: "content-editor lesson-editor" });
    if (!state.selectedLessonPath) {
      editor.append(emptyState("file-code", "Lesson auswählen", "Wähle eine bestehende Lesson oder lege einen vollständigen Lesson-Entwurf an."));
    } else if (!state.activeLesson) {
      editor.append(h("div", { class: "chat-thinking", role: "status" }, [h("span", { "aria-hidden": "true" }), "Lesson wird geladen …"]));
    } else {
      const editable = Boolean(state.active && state.active.status === "draft");
      const fileNames = Object.keys(state.activeLesson.files || {}).sort((left, right) => left.localeCompare(right));
      if (!fileNames.includes(state.lessonFile)) state.lessonFile = fileNames[0];
      const source = state.activeLesson.files[state.lessonFile] || "";
      editor.append(
        h("div", { class: "editor-heading" }, [
          h("div", {}, [h("h1", { text: lessonTitle(state.activeLesson) }), h("p", { class: "admin-context-line", text: `${state.activeLesson.mode === "create" ? "Neue Lesson" : "Repository-Lesson"} · ${state.activeLesson.path}` })]),
          button("Lesson speichern", "primary", () => saveLessonDraft(false), "floppy-disk", { disabled: !editable || !state.lessonDirty }),
        ]),
        state.lessonIssues.length ? h("div", { class: "lesson-issue-summary", role: "status" }, [icon("warning-circle"), h("span", { text: `${state.lessonIssues.length} Vertragspunkte offen. Entwürfe dürfen unvollständig sein; Review bleibt blockiert.` })]) : null,
        h("div", { class: "lesson-file-toolbar" }, [
          field("Datei", selectFor(state.lessonFile, fileNames.map((file) => ({ value: file, label: file })), (value) => { state.lessonFile = value; renderLessons(); }, { disabled: !fileNames.length })),
          button("DE-Dokument", "secondary", () => addLessonFile("docs/de.md", "# Deutsche Übersetzung\n\n[TODO]\n"), "translate", { disabled: !editable || fileNames.includes("docs/de.md") }),
          button("Output", "secondary", () => addLessonFile("outputs/README.md", "# Reusable artifact\n\n[TODO]\n"), "package", { disabled: !editable || fileNames.includes("outputs/README.md") }),
          button("Datei entfernen", "quiet", removeLessonFile, "trash", { disabled: !editable || ["docs/en.md", "quiz.json"].includes(state.lessonFile) || /^code\/main\./.test(state.lessonFile) }),
        ]),
        h("label", { class: "admin-field lesson-source" }, [
          h("span", { text: state.lessonFile }),
          h("textarea", {
            value: source,
            spellcheck: state.lessonFile.endsWith(".md") ? "true" : "false",
            disabled: !editable,
            oninput: (event) => { state.activeLesson.files[state.lessonFile] = event.target.value; markLessonDirty(); },
          }),
        ]),
      );
    }
    panel.append(h("div", { class: "content-shell lesson-shell" }, [list, editor]));
  }

  function openLessonDialog() {
    if (!state.active) return openChangesetDialog();
    const phaseSelect = $("#lessonPhase");
    const phases = [...new Set(state.lessons.map((lesson) => lesson.phase))];
    $("#lessonForm").reset();
    phaseSelect.replaceChildren(...phases.map((phase) => h("option", { value: phase, text: phase })));
    $("#lessonDialog").showModal();
  }

  function newLessonFiles(title, language, lessonPath) {
    const lessonSlug = lessonPath.split("/").at(-1);
    const languages = { py: "Python", ts: "TypeScript", rs: "Rust", jl: "Julia" };
    const comment = language === "py" ? "#" : "//";
    const main = `${comment} Lesson: ${lessonPath}/docs/en.md\n${comment} Build the core operation from first principles.\n${comment} Compare it with the production-library equivalent.\n${comment} Keep the demo deterministic and self-terminating.\n${comment} Sources: add the canonical specification or paper.\n\n`;
    const docs = `# ${title}\n\n> [TODO] One-line hook\n\n**Type:** Build\n**Languages:** ${languages[language]}\n**Prerequisites:** None\n**Time:** ~30 minutes\n\n## Learning Objectives\n- [TODO] Explain the core concept\n- [TODO] Implement the operation from first principles\n- [TODO] Compare the result with a production library\n- [TODO] Validate the reusable artifact\n`;
    const questions = ["pre", "check", "check", "check", "post", "post"].map((stage, index) => ({ stage, question: `[TODO] Question ${index + 1}`, options: ["a", "b", "c", "d"], correct: index % 4, explanation: "[TODO]" }));
    const testFile = language === "py" ? "code/tests/test_main.py" : `code/tests/test_main.${language}`;
    return {
      "docs/en.md": docs,
      "quiz.json": `${JSON.stringify({ lesson: lessonSlug, title, questions }, null, 2)}\n`,
      [`code/main.${language}`]: main,
      [testFile]: language === "py" ? "import unittest\n\n\nclass LessonTests(unittest.TestCase):\n    def test_placeholder_contract(self):\n        self.assertTrue(True)\n" : `${comment} [TODO] Add at least five tests with the stdlib runner.\n`,
      "outputs/README.md": `# ${title} artifact\n\n[TODO] Describe the reusable artifact.\n`,
    };
  }

  function createLessonDraft(event) {
    event.preventDefault();
    const phase = $("#lessonPhase").value;
    const slug = $("#lessonSlug").value.trim();
    const title = $("#lessonTitle").value.trim();
    const language = $("#lessonLanguage").value;
    const lessonPath = `phases/${phase}/${slug}`;
    if (!/^phases\/\d{2}-[a-z0-9-]+\/\d{2}-[a-z0-9-]+$/.test(lessonPath) || !title) return;
    if (state.lessons.some((lesson) => lesson.path === lessonPath)) {
      toast("Dieser Lesson-Pfad existiert bereits.", "error");
      return;
    }
    state.activeLesson = { path: lessonPath, mode: "create", files: newLessonFiles(title, language, lessonPath) };
    state.lessons.push({ path: lessonPath, phase, slug, title, language: ({ py: "Python", ts: "TypeScript", rs: "Rust", jl: "Julia" })[language], hasGerman: false });
    state.selectedLessonPath = lessonPath;
    state.lessonFile = "docs/en.md";
    state.lessonIssues = [];
    state.lessonDirty = true;
    $("#lessonDialog").close();
    setSaveStatus("Neue Lesson noch nicht gespeichert", "dirty");
    renderLessons();
  }

  function createPath() {
    if (!state.active) return openChangesetDialog();
    const tracks = state.snapshot.catalog.tracks;
    const next = Math.max(0, ...tracks.map((track) => Number((/^LP(\d+)$/.exec(track.code) || [])[1]) || 0)) + 1;
    const code = `LP${String(next).padStart(2, "0")}`;
    const track = { id: `path-${String(next).padStart(2, "0")}`, code, label: "Neuer Lernpfad", roleIds: [], stages: [{ label: "Acquire", courses: [] }, { label: "Deepen", courses: [] }, { label: "Create", courses: [] }] };
    tracks.push(track);
    state.selectedPathId = track.id;
    markDirty();
    renderPaths();
  }

  function aiScopeValue() {
    if (state.aiScope.startsWith("course:")) return { type: "course", id: state.aiScope.slice(7) };
    if (state.aiScope.startsWith("path:")) return { type: "path", id: state.aiScope.slice(5) };
    return { type: "curriculum" };
  }

  function renderAiResponse(turn) {
    const response = turn.response || {};
    const proposalNodes = (response.proposals || []).map((proposal) => h("article", { class: "ai-proposal", "data-status": proposal.status || "pending" }, [
      h("div", { class: "ai-proposal__heading" }, [
        h("strong", { text: proposal.label }),
        h("span", { class: "ai-proposal__status", text: ({ pending: "Offen", accepted: "Angenommen", rejected: "Abgelehnt" })[proposal.status || "pending"] }),
      ]),
      h("code", { text: `${proposal.operation} ${proposal.path}` }),
      proposal.rationale ? h("p", { text: proposal.rationale }) : null,
      proposal.status === "pending" ? h("div", { class: "ai-proposal__actions" }, [
        button("Ablehnen", "secondary", () => decideAiProposal(turn.id, proposal.id, "rejected"), "x", { disabled: state.aiLoading || state.active.status !== "draft" }),
        button("Änderung übernehmen", "primary", () => decideAiProposal(turn.id, proposal.id, "accepted"), "check", { disabled: state.aiLoading || state.active.status !== "draft" }),
      ]) : null,
    ]));
    return h("article", { class: "chat-message chat-message--assistant" }, [
      h("div", { class: "chat-message__meta" }, [icon("sparkle"), h("strong", { text: (state.skills.find((skill) => skill.id === turn.skillId) || {}).label || turn.skillId })]),
      h("p", { class: "chat-message__body", text: response.answer || "Keine Antwort." }),
      (response.questions || []).length ? h("ol", { class: "ai-question-list" }, response.questions.map((question) => h("li", { text: question }))) : null,
      (response.findings || []).length ? h("div", { class: "ai-findings" }, response.findings.map((finding) => h("div", { class: "ai-finding", "data-severity": finding.severity }, [
        icon(finding.severity === "blocker" ? "x-circle" : finding.severity === "warning" ? "warning-circle" : "info"),
        h("div", {}, [h("strong", { text: finding.title }), h("p", { text: finding.detail })]),
      ]))) : null,
      proposalNodes.length ? h("div", { class: "ai-proposals" }, [h("h3", { text: "Prüfbare Änderungsvorschläge" }), ...proposalNodes]) : null,
      h("details", { class: "ai-trace" }, [
        h("summary", { text: "Quellen und Tool-Spur" }),
        h("ul", {}, [...(response.sources || []).map((source) => h("li", { text: source })), ...(response.toolTrace || []).map((entry) => h("li", { text: `${entry.tool}: ${entry.detail}` }))]),
      ]),
    ]);
  }

  async function sendAiMessage(event) {
    event.preventDefault();
    if (!state.active || state.aiLoading) return;
    const textarea = $("#aiMessage");
    const message = state.aiDraft.trim();
    if (!message) return textarea.focus();
    if (state.dirty) await saveDraft(true);
    if (state.dirty) return;
    state.aiLoading = true;
    renderAssistant();
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/chat`, {
        method: "POST",
        body: JSON.stringify({
          expectedVersion: state.active.version,
          message,
          skillId: state.aiSkillId,
          scope: aiScopeValue(),
        }),
      });
      state.active = body.changeset;
      state.snapshot = clone(body.changeset.snapshot);
      state.aiDraft = "";
      setSaveStatus(`Version ${state.active.version} · ${statusLabel(state.active.status)}`, "saved");
      await refreshChangeSets(false);
      toast("KI-Antwort und Tool-Spur wurden am Änderungssatz protokolliert.");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      state.aiLoading = false;
      renderAssistant();
      const thread = $(".chat-thread");
      if (thread) thread.scrollTop = thread.scrollHeight;
    }
  }

  async function decideAiProposal(messageId, proposalId, decision) {
    if (!state.active || state.aiLoading) return;
    state.aiLoading = true;
    renderAssistant();
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/proposals`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: state.active.version, messageId, proposalId, decision }),
      });
      state.active = body.changeset;
      state.snapshot = clone(body.changeset.snapshot);
      state.issues = body.issues || [];
      setSaveStatus(`Version ${state.active.version} · ${statusLabel(state.active.status)}`, "saved");
      updateStats();
      await refreshChangeSets(false);
      toast(decision === "accepted" ? "KI-Vorschlag als sichtbare Entwurfsänderung übernommen." : "KI-Vorschlag abgelehnt und protokolliert.");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      state.aiLoading = false;
      renderAssistant();
    }
  }

  function renderAssistant() {
    const panel = $("#view-assistant");
    panel.replaceChildren(pageHeading("assistantTitle", "Curriculum-Copilot", "KI-Studio", "Entwürfe mit transparenten Skills analysieren und als prüfbare Änderungen übernehmen."));
    const chat = state.active ? state.active.chat || [] : [];
    const thread = h("div", { class: "chat-thread", role: "log", "aria-live": "polite", "aria-busy": String(state.aiLoading) });
    if (!chat.length && !state.aiLoading) {
      thread.append(emptyState("sparkle", "Womit sollen wir beginnen?", "Bitte die KI um eine Kursstruktur, eine Lückenanalyse oder starte den Curriculum-Grill. Antworten bleiben an den aktiven Änderungssatz gebunden."));
    }
    for (const turn of chat) {
      thread.append(
        h("article", { class: "chat-message chat-message--user" }, [h("div", { class: "chat-message__meta" }, [icon("user"), h("strong", { text: turn.by })]), h("p", { class: "chat-message__body", text: turn.message })]),
        renderAiResponse(turn),
      );
    }
    if (state.aiLoading) thread.append(h("div", { class: "chat-thinking", role: "status" }, [h("span", { "aria-hidden": "true" }), "Curriculum-Kontext und Skill werden geprüft …"]));
    const scopeOptions = [{ value: "curriculum", label: "Gesamtes Curriculum" }]
      .concat((state.snapshot.catalog.courses || []).map((course) => ({ value: `course:${course.id}`, label: `${course.id} · ${course.title}` })))
      .concat((state.snapshot.catalog.tracks || []).map((path) => ({ value: `path:${path.id}`, label: `${path.code} · ${path.label}` })));
    const composer = h("form", { class: "chat-composer", onsubmit: sendAiMessage }, [
      h("div", { class: "chat-context-row" }, [
        field("Kontext", selectFor(state.aiScope, scopeOptions, (value) => { state.aiScope = value; }, { disabled: !state.active || state.aiLoading, "aria-label": "KI-Kontext" })),
        state.active && state.active.grill && state.active.grill.required ? h("span", { class: "grill-badge", "data-status": state.active.grill.status, text: `Grill: ${state.active.grill.status}` }) : null,
      ]),
      h("label", { class: "admin-field" }, [h("span", { text: "Nachricht an den Curriculum-Copilot" }), h("textarea", { id: "aiMessage", value: state.aiDraft, oninput: (event) => { state.aiDraft = event.target.value; }, placeholder: "Prüfe, ob dieser Lernpfad alle Voraussetzungen in sinnvoller Reihenfolge vermittelt …", disabled: !state.active || state.aiLoading })]),
      h("div", { class: "chat-composer__actions" }, [h("small", { class: "metric-context", text: state.active ? `Änderungssatz: ${state.active.title}` : "Lege zuerst einen Änderungssatz an." }), button(state.aiLoading ? "Analysiert …" : "Senden", "primary", null, "paper-plane-tilt", { type: "submit", disabled: !state.active || state.aiLoading })]),
    ]);
    panel.append(h("div", { class: "assistant-layout" }, [
      h("section", { class: "chat-panel" }, [thread, composer]),
      h("aside", { class: "admin-panel" }, [
        h("div", { class: "admin-panel__header" }, h("h2", { text: "Verfügbare Skills" })),
        h("div", { class: "skill-list" }, state.skills.map((skill) => h("button", {
          type: "button",
          class: `skill-item${state.aiSkillId === skill.id ? " is-active" : ""}`,
          "aria-pressed": String(state.aiSkillId === skill.id),
          onclick: () => { state.aiSkillId = skill.id; renderAssistant(); },
        }, [h("strong", { text: skill.label }), h("small", { text: skill.description })]))),
        h("p", { class: "skill-attribution" }, ["Arbeitsweise inspiriert von den composable skills in ", h("a", { href: "https://github.com/mattpocock/skills", target: "_blank", rel: "noreferrer" }, "mattpocock/skills"), ". Prompts und Anwendung sind projektspezifisch."]),
      ]),
    ]));
  }

  function renderReview() {
    const panel = $("#view-review");
    const errors = state.issues.filter((item) => item.severity === "error");
    const warnings = state.issues.filter((item) => item.severity !== "error");
    let reviewAction = null;
    if (state.active && state.active.status === "draft") {
      reviewAction = button("Review anfordern", "primary", () => transitionStatus("review"), "arrow-right", { disabled: !state.baseCurrent || errors.length > 0 || state.dirty || (state.active.grill && state.active.grill.required && !["passed", "overridden"].includes(state.active.grill.status)) });
    } else if (state.active && state.active.status === "review" && hasRole("reviewer")) {
      reviewAction = h("div", { class: "review-actions" }, [
        button("Zurück in Entwurf", "secondary", () => transitionStatus("draft"), "arrow-u-up-left"),
        button("Fachlich freigeben", "primary", () => transitionStatus("approved"), "check"),
      ]);
    } else if (state.active && state.active.status === "approved" && hasRole("publisher")) {
      reviewAction = state.active.publication
        ? button("MR-Status aktualisieren", "primary", refreshPublication, "arrows-clockwise")
        : button("Merge Request öffnen", "primary", publishActive, "git-merge", { disabled: !state.publishConfigured });
    } else if (state.active && state.active.status === "published" && hasRole("publisher")) {
      reviewAction = button("Archivieren", "secondary", () => transitionStatus("archived"), "archive");
    }
    panel.replaceChildren(pageHeading(
      "reviewTitle", "Qualitätsgate", "Review", "Strukturelle Prüfungen sind die erste Stufe; Curriculum-Grill und Repository-Audits folgen vor der Veröffentlichung.",
      reviewAction,
    ));
    const issuePanel = h("section", { class: "admin-panel" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Prüfergebnisse" }), h("span", { text: `${errors.length} Blocker · ${warnings.length} Hinweise` })]),
      state.issues.length ? h("div", { class: "issue-list" }, state.issues.map((item) => h("div", { class: "issue-row", "data-severity": item.severity }, [
        icon(item.severity === "error" ? "x-circle" : "warning-circle"), h("div", {}, [h("strong", { text: item.message }), h("code", { text: item.path })]),
      ]))) : emptyState("check-circle", "Strukturell sauber", "Keine blockierenden Probleme im aktuellen Snapshot."),
    ]);
    const gatePanel = h("aside", { class: "admin-panel" }, [
      h("h2", { text: "Nächste Gates" }),
      h("div", { class: "issue-list" }, [
        ["Curriculum-Grill", state.active && state.active.grill && state.active.grill.required ? `Pflicht · Status: ${state.active.grill.status}` : "Für diese Änderung nicht verpflichtend"],
        ["Repository-Audits", "Lesson Contract, Quiz, Links und Tests"],
        ["Reviewer-Freigabe", "Vier-Augen-Prinzip mit Begründung"],
        ["Merge Request", "Diff, Pipeline und Review-App"],
      ].map(([title, copy], index) => h("div", { class: "issue-row" }, [icon(index === 0 && state.active && state.active.grill && ["passed", "overridden"].includes(state.active.grill.status) ? "check-circle" : "circle"), h("div", {}, [h("strong", { text: title }), h("span", { text: copy })])]))),
      state.active && state.active.grill && state.active.grill.required && !["passed", "overridden"].includes(state.active.grill.status)
        ? button("Grill im KI-Studio fortsetzen", "secondary", () => { state.aiSkillId = "curriculum-grill"; activateView("assistant"); }, "sparkle")
        : null,
      state.active && state.active.grill && state.active.grill.required && !["passed", "overridden"].includes(state.active.grill.status) && hasRole("reviewer")
        ? h("div", { class: "grill-override" }, [
          field("Reviewer-Override", textareaFor(state.grillOverrideReason, (value) => { state.grillOverrideReason = value; }, { placeholder: "Begründung für die bewusste Übersteuerung …", maxlength: "1000" }), true, "Wird unveränderlich im Audit-Log protokolliert."),
          button("Mit Begründung übersteuern", "secondary", overrideGrill, "warning"),
        ])
        : null,
    ]);
    const publicationPanel = state.active && state.active.publication ? h("section", { class: "admin-panel publication-panel" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "GitLab Merge Request" }), h("span", { class: "status-dot", "data-status": state.active.publication.state === "merged" ? "published" : "review", text: state.active.publication.state })]),
      h("dl", { class: "publication-details" }, [
        h("div", {}, [h("dt", { text: "Branch" }), h("dd", {}, h("code", { text: state.active.publication.branch }))]),
        h("div", {}, [h("dt", { text: "Commit" }), h("dd", {}, h("code", { text: (state.active.publication.commitId || "").slice(0, 12) }))]),
        h("div", {}, [h("dt", { text: "Ziel" }), h("dd", { text: state.active.publication.targetBranch })]),
      ]),
      h("a", { class: "admin-button admin-button--secondary", href: state.active.publication.mergeRequest.url, target: "_blank", rel: "noreferrer" }, [icon("arrow-square-out"), `MR !${state.active.publication.mergeRequest.iid} öffnen`]),
    ]) : null;
    panel.append(h("div", { class: "review-grid" }, [issuePanel, gatePanel]));
    if (state.active && !state.baseCurrent) panel.prepend(h("div", { class: "base-drift", role: "alert" }, [
      icon("git-diff"),
      h("div", {}, [h("strong", { text: "Veröffentlichte Basis hat sich geändert" }), h("p", { text: "Der Entwurf muss die neuen Curriculum-Inhalte per Drei-Wege-Rebase übernehmen, bevor Review oder Publishing möglich ist." })]),
      button("Basis aktualisieren", "primary", rebaseActive, "arrows-merge"),
    ]));
    if (publicationPanel) panel.append(publicationPanel);
  }

  function renderHistory() {
    const panel = $("#view-history");
    panel.replaceChildren(pageHeading("historyTitle", "Nachvollziehbarkeit", "Historie", "Wer hat wann welche Curriculum-Entscheidung getroffen?"));
    if (!state.active) {
      panel.append(emptyState("clock-counter-clockwise", "Kein Änderungssatz ausgewählt", "Wähle einen Entwurf aus, um seine unveränderliche Audit-Historie zu sehen."));
      return;
    }
    const tbody = h("tbody");
    for (const entry of [...state.active.audit].reverse()) {
      tbody.append(h("tr", {}, [
        h("td", { text: new Date(entry.at).toLocaleString("de-DE") }),
        h("td", { text: entry.by }),
        h("td", { text: entry.action.replace("changeset.", "") }),
        h("td", { text: entry.reason || "—" }),
        h("td", { class: "number", text: entry.version || 1 }),
        h("td", {}, entry.version && entry.version !== state.active.version ? button("Wiederherstellen", "quiet", () => restoreVersion(entry.version), "arrow-counter-clockwise") : "Aktuell"),
      ]));
    }
    panel.append(h("article", { class: "admin-panel" }, [h("div", { class: "admin-panel__header" }, h("h2", { text: state.active.title })), h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
      h("thead", {}, h("tr", {}, ["Zeitpunkt", "Benutzer", "Aktion", "Begründung", "Version", "Revision"].map((label) => h("th", { scope: "col", text: label })))), tbody,
    ]))]));
  }

  async function restoreVersion(version) {
    if (!state.active) return;
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/restore`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: state.active.version, version }),
      });
      state.active = body.changeset;
      state.snapshot = clone(body.changeset.snapshot);
      state.issues = body.issues || [];
      setSaveStatus(`Version ${state.active.version} · Revision ${version} wiederhergestellt`, "saved");
      await refreshChangeSets(false);
      toast(`Revision ${version} wurde als neuer Entwurf wiederhergestellt.`);
      renderHistory();
    } catch (error) { toast(error.message, "error"); }
  }

  async function rebaseActive() {
    if (!state.active) return;
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/rebase`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: state.active.version }),
      });
      state.active = body.changeset;
      state.snapshot = clone(body.changeset.snapshot);
      state.loadedSnapshot = clone(body.changeset.snapshot);
      state.issues = body.issues || [];
      state.baseCurrent = true;
      setSaveStatus(`Version ${state.active.version} · Basis aktualisiert`, "saved");
      await refreshChangeSets(false);
      toast("Veröffentlichte Basis und nicht überlappende Entwurfsänderungen wurden zusammengeführt.");
      renderReview();
    } catch (error) {
      const conflicts = error.payload && error.payload.details && error.payload.details.conflicts;
      toast(conflicts ? `Rebase benötigt manuelle Auflösung für ${conflicts.length} Überschneidungen.` : error.message, "error");
    }
  }

  async function validateActive() {
    if (!state.active) {
      toast("Lege einen Änderungssatz an, um einen bearbeitbaren Stand zu prüfen.", "error");
      return;
    }
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/validate`, { method: "POST", body: JSON.stringify({ snapshot: state.snapshot }) });
      state.issues = body.issues;
      updateStats();
      toast(body.valid ? "Keine strukturellen Blocker gefunden." : "Die Prüfung hat blockierende Probleme gefunden.", body.valid ? "success" : "error");
      activateView("review");
    } catch (error) { toast(error.message, "error"); }
  }

  async function transitionStatus(status) {
    if (!state.active) return;
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/status`, { method: "POST", body: JSON.stringify({ expectedVersion: state.active.version, status, reason: status === "review" ? "Zur fachlichen Prüfung eingereicht" : "" }) });
      state.active = body.changeset;
      await refreshChangeSets(false);
      toast(`Änderungssatz ist jetzt „${statusLabel(status)}“.`);
      renderCurrentView();
    } catch (error) { toast(error.message, "error"); }
  }

  async function overrideGrill() {
    if (!state.active || !state.grillOverrideReason.trim()) {
      toast("Bitte begründe den Reviewer-Override.", "error");
      return;
    }
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/grill-override`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: state.active.version, reason: state.grillOverrideReason }),
      });
      state.active = body.changeset;
      state.grillOverrideReason = "";
      setSaveStatus(`Version ${state.active.version} · ${statusLabel(state.active.status)}`, "saved");
      await refreshChangeSets(false);
      toast("Curriculum-Grill wurde mit Reviewer-Begründung übersteuert.");
      renderReview();
    } catch (error) { toast(error.message, "error"); }
  }

  async function publishActive() {
    if (!state.active) return;
    try {
      setSaveStatus("GitLab-Branch und Merge Request werden erstellt …");
      const body = await api(`/api/admin/changesets/${state.active.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: state.active.version }),
      });
      state.active = body.changeset;
      setSaveStatus(`Version ${state.active.version} · MR offen`, "saved");
      await refreshChangeSets(false);
      toast("GitLab-Branch, Manifest-Commit und Merge Request wurden erstellt.");
      renderReview();
    } catch (error) {
      setSaveStatus(`Version ${state.active.version} · ${statusLabel(state.active.status)}`, "saved");
      toast(error.message, "error");
    }
  }

  async function refreshPublication() {
    if (!state.active) return;
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/publication`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: state.active.version }),
      });
      state.active = body.changeset;
      setSaveStatus(`Version ${state.active.version} · ${statusLabel(state.active.status)}`, "saved");
      await refreshChangeSets(false);
      toast(state.active.status === "published" ? "Merge bestätigt: Curriculum ist veröffentlicht." : `Merge Request ist weiterhin „${state.active.publication.state}“.`);
      renderReview();
    } catch (error) { toast(error.message, "error"); }
  }

  function openChangesetDialog() {
    $("#changesetForm").reset();
    $("#changesetDialog").showModal();
    window.setTimeout(() => $("#changesetTitle").focus(), 0);
  }

  async function createChangeset(event) {
    event.preventDefault();
    const title = $("#changesetTitle").value.trim();
    if (!title) return $("#changesetTitle").focus();
    const submit = $("#createChangesetButton");
    submit.disabled = true;
    try {
      const body = await api("/api/admin/changesets", { method: "POST", body: JSON.stringify({ title, description: $("#changesetDescription").value.trim() }) });
      $("#changesetDialog").close();
      await refreshChangeSets(false);
      await selectChangeset(body.changeset.id);
      toast("Änderungssatz erstellt.");
    } catch (error) { toast(error.message, "error"); }
    finally { submit.disabled = false; }
  }

  async function refreshChangeSets(render = true) {
    const body = await api("/api/admin/changesets");
    state.changesets = body.changesets;
    const select = $("#changesetSelect");
    const activeId = state.active && state.active.id;
    select.replaceChildren(h("option", { value: "", text: "Veröffentlichter Stand" }));
    for (const item of state.changesets) select.append(h("option", { value: item.id, text: `${item.title} · ${statusLabel(item.status)}` }));
    select.value = activeId || "";
    if (render) renderCurrentView();
  }

  async function selectChangeset(id) {
    if (state.dirty) await saveDraft(true);
    if (state.lessonDirty) await saveLessonDraft(true);
    if (!id) {
      state.active = null;
      state.baseCurrent = true;
      state.snapshot = clone(state.base.snapshot);
      state.loadedSnapshot = clone(state.base.snapshot);
      state.stats = state.base.stats;
      state.issues = state.base.issues;
      state.dirty = false;
      state.activeLesson = null;
      state.selectedLessonPath = null;
      state.lessonDirty = false;
      $("#changesetSelect").value = "";
      $("#saveButton").disabled = true;
      setSaveStatus("Nur lesen");
      renderCurrentView();
      return;
    }
    try {
      const body = await api(`/api/admin/changesets/${id}`);
      state.active = body.changeset;
      state.baseCurrent = body.baseCurrent !== false;
      for (const draft of Object.values(state.active.lessons || {})) {
        if (!state.lessons.some((lesson) => lesson.path === draft.path)) {
          const [phase, slug] = draft.path.split("/").slice(-2);
          const main = Object.keys(draft.files || {}).find((file) => /^code\/main\./.test(file)) || "";
          const extension = main.split(".").at(-1);
          state.lessons.push({ path: draft.path, phase, slug, title: lessonTitle(draft), language: ({ py: "Python", ts: "TypeScript", rs: "Rust", jl: "Julia" })[extension] || "—", hasGerman: Boolean(draft.files["docs/de.md"]) });
        }
      }
      state.snapshot = clone(body.changeset.snapshot);
      state.loadedSnapshot = clone(body.changeset.snapshot);
      state.issues = [];
      state.dirty = false;
      state.activeLesson = null;
      state.selectedLessonPath = null;
      state.lessonDirty = false;
      $("#changesetSelect").value = id;
      $("#saveButton").disabled = true;
      setSaveStatus(`Version ${state.active.version} · ${statusLabel(state.active.status)}`, "saved");
      try { localStorage.setItem("lhind:admin:changeset", id); } catch (_) {}
      await validateActiveSilently();
      renderCurrentView();
    } catch (error) { toast(error.message, "error"); }
  }

  async function validateActiveSilently() {
    if (!state.active) return;
    try {
      const body = await api(`/api/admin/changesets/${state.active.id}/validate`, { method: "POST", body: JSON.stringify({ snapshot: state.snapshot }) });
      state.issues = body.issues;
      updateStats();
    } catch (_) {}
  }

  function bindShell() {
    $$("[data-view]").forEach((item) => item.addEventListener("click", () => activateView(item.dataset.view)));
    $("#adminMenuButton").addEventListener("click", () => {
      setSidebarOpen(!$("#adminSidebar").classList.contains("is-open"));
    });
    $("#adminSidebarBackdrop").addEventListener("click", () => setSidebarOpen(false));
    $("#adminThemeButton").addEventListener("click", toggleAdminTheme);
    $("#newChangesetButton").addEventListener("click", openChangesetDialog);
    $("#saveButton").addEventListener("click", () => saveDraft(false));
    $("#validateButton").addEventListener("click", validateActive);
    $("#changesetSelect").addEventListener("change", (event) => selectChangeset(event.target.value));
    $("#changesetForm").addEventListener("submit", createChangeset);
    $("#lessonForm").addEventListener("submit", createLessonDraft);
    $("#curriculumImport").addEventListener("change", previewImport);
    $("#closeImportDialog").addEventListener("click", closeImport);
    $("#cancelImport").addEventListener("click", closeImport);
    $("#applyImport").addEventListener("click", applyImport);
    $("#cancelConflict").addEventListener("click", cancelConflict);
    $("#applyConflict").addEventListener("click", applyConflict);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && $("#adminSidebar").classList.contains("is-open")) {
        setSidebarOpen(false);
        $("#adminMenuButton").focus();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (state.lessonDirty) saveLessonDraft(false); else saveDraft(false);
      }
    });
    window.addEventListener("beforeunload", (event) => {
      if (!state.dirty && !state.lessonDirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  function setSidebarOpen(open) {
    $("#adminSidebar").classList.toggle("is-open", open);
    $("#adminMenuButton").setAttribute("aria-expanded", String(open));
    $("#adminSidebarBackdrop").hidden = !open;
    document.body.classList.toggle("admin-nav-open", open);
  }

  function currentAdminTheme() {
    let stored = "";
    try { stored = localStorage.getItem("theme") || ""; } catch (_) {}
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function renderAdminTheme() {
    const dark = currentAdminTheme() === "dark";
    $("#adminThemeIcon").className = `ph-light ${dark ? "ph-sun" : "ph-moon"}`;
    const label = dark ? "Zu hellem Farbschema wechseln" : "Zu dunklem Farbschema wechseln";
    $("#adminThemeButton").setAttribute("aria-label", label);
    $("#adminThemeButton").setAttribute("title", label);
    $("#adminThemeButton").setAttribute("aria-pressed", String(dark));
    const themeColor = $("meta[name=\"theme-color\"]");
    if (themeColor) themeColor.content = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim();
  }

  function toggleAdminTheme() {
    const next = currentAdminTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch (_) {}
    document.documentElement.dataset.theme = next;
    renderAdminTheme();
  }

  function renderFatal(error) {
    $("#adminBoot").hidden = true;
    const app = $("#adminApp");
    app.hidden = false;
    app.replaceChildren(h("main", { class: "admin-error-page" }, h("div", { class: "admin-error-page__inner" }, [
      icon(error.status === 401 || error.status === 403 ? "lock-key" : "warning-circle"),
      h("h1", { text: error.status === 401 || error.status === 403 ? "Kein Admin-Zugriff" : "Admin konnte nicht geladen werden" }),
      h("p", { text: error.status === 401 || error.status === 403 ? "Deine Unternehmensidentität besitzt keine Curriculum-Rolle. Bitte wende dich an einen Publisher." : error.message }),
      error.payload && error.payload.id ? h("p", { class: "admin-error-id", text: `Fehler-ID ${error.payload.id}` }) : null,
      h("a", { class: "admin-button admin-button--secondary", href: "index.html" }, "Zum Learning Catalog"),
    ])));
  }

  async function boot() {
    try {
      const [me, curriculum, changesets, aiSkills, publishConfig, lessons, lrnStats, teams] = await Promise.all([
        api("/api/admin/me"), api("/api/admin/curriculum"), api("/api/admin/changesets"), api("/api/admin/ai/skills"), api("/api/admin/publish/config"), api("/api/admin/lessons"), api("/api/admin/lrn-stats").catch(() => ({ stats: null })), api("/api/admin/team-assignments").catch(() => ({ assignments: [], reporting: {} })),
      ]);
      state.actor = me.actor;
      state.base = curriculum;
      state.snapshot = clone(curriculum.snapshot);
      state.loadedSnapshot = clone(curriculum.snapshot);
      state.stats = curriculum.stats;
      state.issues = curriculum.issues;
      state.changesets = changesets.changesets;
      state.skills = aiSkills.skills;
      state.publishConfigured = publishConfig.configured;
      state.lessons = lessons.lessons;
      state.lrnStats = lrnStats.stats;
      state.teamAssignments = teams.assignments || [];
      state.teamReporting = teams.reporting || {};
      $("#teamNavCount").textContent = state.teamAssignments.filter((assignment) => assignment.status === "active").length || "";
      $("#adminUsername").textContent = state.actor.username;
      $("#adminRoles").textContent = state.actor.roles.map((role) => ROLE_LABELS[role] || role).join(" · ");
      $("#adminAvatar").textContent = initials(state.actor.username);
      $("#adminBoot").hidden = true;
      $("#adminApp").hidden = false;
      renderAdminTheme();
      bindShell();
      await refreshChangeSets(false);
      updateStats();
      renderOverview();
      let remembered = "";
      try { remembered = localStorage.getItem("lhind:admin:changeset") || ""; } catch (_) {}
      if (remembered && state.changesets.some((item) => item.id === remembered)) await selectChangeset(remembered);
      const requestedView = new URLSearchParams(window.location.search).get("view");
      const allowedViews = ["overview", "courses", "lessons", "paths", "trainers", "calendar", "teams", "assistant", "review", "history", "stats"];
      if (allowedViews.includes(requestedView)) activateView(requestedView);
    } catch (error) {
      renderFatal(error);
    }
  }

  boot();
})();
