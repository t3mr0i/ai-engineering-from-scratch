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
    selectedPathId: null,
    courseQuery: "",
    pathQuery: "",
    saveTimer: null,
    skills: [],
    aiSkillId: "curriculum-grill",
    aiScope: "curriculum",
    aiLoading: false,
    aiDraft: "",
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

  function initials(name) {
    return String(name || "?").split(/[.@\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function statusLabel(status) {
    return ({ draft: "Entwurf", review: "Im Review", approved: "Freigegeben", published: "Veröffentlicht", archived: "Archiviert" })[status] || status;
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

  function pageHeading(id, overline, title, description, action) {
    return h("div", { class: "admin-page-heading" }, [
      h("div", {}, [
        h("p", { class: "admin-overline", text: overline }),
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
    };
    $("#courseNavCount").textContent = state.stats.courses;
    $("#pathNavCount").textContent = state.stats.tracks;
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
        toast("Der Entwurf wurde parallel geändert. Öffne ihn erneut, um beide Versionen zu vergleichen.", "error");
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
    $("#adminSidebar").classList.remove("is-open");
    $("#adminMenuButton").setAttribute("aria-expanded", "false");
    renderCurrentView();
    $("#adminMain").focus({ preventScroll: true });
  }

  function renderCurrentView() {
    if (!state.snapshot) return;
    ({
      overview: renderOverview,
      courses: renderCourses,
      paths: renderPaths,
      assistant: renderAssistant,
      review: renderReview,
      history: renderHistory,
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
      button("Kurs bearbeiten", "primary", () => activateView("courses"), "pencil-simple"),
    ));

    const errors = state.issues.filter((item) => item.severity === "error").length;
    const warnings = state.issues.filter((item) => item.severity !== "error").length;
    const quality = Math.max(0, Math.round(100 - errors * 10 - warnings * 1.5));
    const drafts = state.changesets.filter((item) => item.status === "draft").length;
    const review = state.changesets.filter((item) => item.status === "review").length;
    const dashboard = h("div", { class: "admin-dashboard" });

    dashboard.append(
      h("article", { class: "metric-primary" }, [
        h("div", {}, [h("span", { class: "metric-label", text: "Kurse im Katalog" }), h("strong", { class: "metric-value", text: state.stats.courses })]),
        h("div", {}, [
          h("span", { class: "metric-context", text: `${state.stats.units} Units · ${state.stats.activities} Activities` }),
          h("svg", { class: "metric-line", viewBox: "0 0 300 34", preserveAspectRatio: "none", "aria-hidden": "true" },
            h("path", { d: "M0 28 C35 24 54 26 82 18 S132 10 164 15 S215 21 246 10 S278 6 300 4" })),
        ]),
      ]),
      h("article", { class: "metric-support" }, [
        h("span", { class: "metric-label", text: "Lernpfade" }),
        h("strong", { class: "metric-value", text: state.stats.tracks }),
        h("span", { class: "metric-context", text: "Profile und Level verbunden" }),
      ]),
      h("article", { class: "metric-support" }, [
        h("span", { class: "metric-label", text: "Offene Entscheidungen" }),
        h("strong", { class: "metric-value", text: drafts + review }),
        h("span", { class: "metric-context", text: `${drafts} Entwürfe · ${review} im Review` }),
      ]),
    );

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
      selectFor(course.status || "draft", [
        { value: "draft", label: "Entwurf" }, { value: "active", label: "Aktiv" }, { value: "planned", label: "Geplant" }, { value: "archived", label: "Archiviert" },
      ], (value) => { update("status", value); renderCourses(); }, { disabled: !editable, "aria-label": "Kursstatus" }),
    ]);
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
        field("Profile", inputFor((course.profileIds || []).join(", "), (value) => update("profileIds", splitList(value)), { disabled: !editable }), false, "Kommagetrennte Profil-IDs"),
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
    return [heading, h("div", { class: "editor-sections" }, [basics, outcomes, unitSection])];
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
      profileIds: [],
      dimensions: {},
      interests: [],
      levels: [],
      ase: {},
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
        field("Profile", inputFor((track.profileIds || []).join(", "), (value) => update("profileIds", splitList(value)), { disabled: !editable }), true, "Kommagetrennte Profil-IDs"),
      ]),
    ]);
    const stages = h("section", { class: "editor-section" }, [
      h("div", { class: "admin-panel__header" }, [h("h2", { text: "Stufen und Kurse" }), button("Stufe hinzufügen", "secondary", () => { track.stages = track.stages || []; track.stages.push({ label: "Neue Stufe", courses: [] }); markDirty(); renderPaths(); }, "plus", { disabled: !editable })]),
      renderStageEditors(track, editable),
    ]);
    return [heading, h("div", { class: "editor-sections" }, [basics, stages])];
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

  function createPath() {
    if (!state.active) return openChangesetDialog();
    const tracks = state.snapshot.catalog.tracks;
    const next = Math.max(0, ...tracks.map((track) => Number((/^LP(\d+)$/.exec(track.code) || [])[1]) || 0)) + 1;
    const code = `LP${String(next).padStart(2, "0")}`;
    const track = { id: `path-${String(next).padStart(2, "0")}`, code, label: "Neuer Lernpfad", profileIds: [], stages: [{ label: "Acquire", courses: [] }, { label: "Deepen", courses: [] }, { label: "Create", courses: [] }] };
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
    panel.replaceChildren(pageHeading(
      "reviewTitle", "Qualitätsgate", "Review", "Strukturelle Prüfungen sind die erste Stufe; Curriculum-Grill und Repository-Audits folgen vor der Veröffentlichung.",
      state.active && state.active.status === "draft" ? button("Review anfordern", "primary", () => transitionStatus("review"), "arrow-right", { disabled: errors.length > 0 || state.dirty || (state.active.grill && state.active.grill.required && !["passed", "overridden"].includes(state.active.grill.status)) }) : null,
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
    ]);
    panel.append(h("div", { class: "review-grid" }, [issuePanel, gatePanel]));
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
      ]));
    }
    panel.append(h("article", { class: "admin-panel" }, [h("div", { class: "admin-panel__header" }, h("h2", { text: state.active.title })), h("div", { class: "admin-table-wrap" }, h("table", { class: "admin-table" }, [
      h("thead", {}, h("tr", {}, ["Zeitpunkt", "Benutzer", "Aktion", "Begründung", "Version"].map((label) => h("th", { scope: "col", text: label })))), tbody,
    ]))]));
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
    if (!id) {
      state.active = null;
      state.snapshot = clone(state.base.snapshot);
      state.stats = state.base.stats;
      state.issues = state.base.issues;
      state.dirty = false;
      $("#changesetSelect").value = "";
      $("#saveButton").disabled = true;
      setSaveStatus("Nur lesen");
      renderCurrentView();
      return;
    }
    try {
      const body = await api(`/api/admin/changesets/${id}`);
      state.active = body.changeset;
      state.snapshot = clone(body.changeset.snapshot);
      state.issues = [];
      state.dirty = false;
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
      const open = $("#adminSidebar").classList.toggle("is-open");
      $("#adminMenuButton").setAttribute("aria-expanded", String(open));
    });
    $("#newChangesetButton").addEventListener("click", openChangesetDialog);
    $("#saveButton").addEventListener("click", () => saveDraft(false));
    $("#validateButton").addEventListener("click", validateActive);
    $("#changesetSelect").addEventListener("change", (event) => selectChangeset(event.target.value));
    $("#changesetForm").addEventListener("submit", createChangeset);
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveDraft(false);
      }
    });
    window.addEventListener("beforeunload", (event) => {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
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
      const [me, curriculum, changesets, aiSkills] = await Promise.all([
        api("/api/admin/me"), api("/api/admin/curriculum"), api("/api/admin/changesets"), api("/api/admin/ai/skills"),
      ]);
      state.actor = me.actor;
      state.base = curriculum;
      state.snapshot = clone(curriculum.snapshot);
      state.stats = curriculum.stats;
      state.issues = curriculum.issues;
      state.changesets = changesets.changesets;
      state.skills = aiSkills.skills;
      $("#adminUsername").textContent = state.actor.username;
      $("#adminRoles").textContent = state.actor.roles.join(" · ");
      $("#adminAvatar").textContent = initials(state.actor.username);
      $("#adminBoot").hidden = true;
      $("#adminApp").hidden = false;
      bindShell();
      await refreshChangeSets(false);
      updateStats();
      renderOverview();
      let remembered = "";
      try { remembered = localStorage.getItem("lhind:admin:changeset") || ""; } catch (_) {}
      if (remembered && state.changesets.some((item) => item.id === remembered)) await selectChangeset(remembered);
    } catch (error) {
      renderFatal(error);
    }
  }

  boot();
})();
