(function () {
  "use strict";

  const list = document.getElementById("trainerModules");
  const search = document.getElementById("trainerSearch");
  const count = document.getElementById("trainerCount");
  const summary = document.getElementById("trainerSummary");
  const status = document.getElementById("trainerStatus");
  const listHead = document.getElementById("trainerListHead");
  const pagination = document.getElementById("trainerPagination");
  const previous = document.getElementById("trainerPrev");
  const next = document.getElementById("trainerNext");
  const pageInfo = document.getElementById("trainerPageInfo");
  const filters = Array.from(document.querySelectorAll("[data-trainer-filter]"));
  const drafts = new Map();
  const expanded = new Set();
  let modules = [];
  let activeFilter = "all";
  let page = 1;
  const pageSize = 8;

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  }

  function validUrl(value) {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
    } catch (_) {
      return false;
    }
  }

  function disableControls() {
    search.disabled = true;
    filters.forEach((button) => { button.disabled = true; });
  }

  function render(message) {
    const linked = modules.filter((item) => Boolean(item.servicePortalUrl)).length;
    const missing = modules.length - linked;
    summary.textContent = linked + " von " + modules.length + " Modulen mit Serviceportal-Link";
    const labels = { all: "Alle (" + modules.length + ")", missing: "Ohne Link (" + missing + ")", linked: "Verlinkt (" + linked + ")" };
    filters.forEach((button) => {
      button.textContent = labels[button.dataset.trainerFilter];
      button.setAttribute("aria-pressed", String(button.dataset.trainerFilter === activeFilter));
    });

    const term = search.value.trim().toLocaleLowerCase();
    const shown = modules.filter((item) => {
      if (activeFilter === "missing" && item.servicePortalUrl) return false;
      if (activeFilter === "linked" && !item.servicePortalUrl) return false;
      return (item.id + " " + item.title).toLocaleLowerCase().includes(term);
    });
    const pages = Math.max(1, Math.ceil(shown.length / pageSize));
    page = Math.min(page, pages);
    const first = (page - 1) * pageSize;
    const pageItems = shown.slice(first, first + pageSize);
    count.textContent = shown.length === 1 ? "1 Modul" : shown.length ? (first + 1) + "–" + (first + pageItems.length) + " von " + shown.length + " Modulen" : "0 Module";
    listHead.hidden = shown.length === 0;
    pagination.hidden = shown.length <= pageSize;
    pageInfo.textContent = "Seite " + page + " von " + pages;
    previous.disabled = page === 1;
    next.disabled = page === pages;
    list.replaceChildren();
    for (const item of pageItems) list.append(renderModule(item));
    status.textContent = message || (shown.length ? "" : term ? "Keine Module zu dieser Suche gefunden." : activeFilter === "missing" ? "Alle Module haben einen Serviceportal-Link." : activeFilter === "linked" ? "Noch kein Modul ist verlinkt." : "Keine Module vorhanden.");
  }

  function renderModule(item) {
    const linked = Boolean(item.servicePortalUrl);
    const row = element("section", "trainer-module");
    row.dataset.moduleId = item.id;
    const identity = element("div", "trainer-module__identity");
    identity.append(element("h2", "", item.title), element("span", "trainer-module__meta", item.id));

    const current = element("div", "trainer-module__current");
    const state = element("span", "trainer-module__state" + (linked ? " is-linked" : ""), linked ? "Verlinkt" : "Link fehlt");
    const controls = element("div", "trainer-module__controls");
    if (linked) {
      const open = element("a", "trainer-module__open", "Serviceportal öffnen");
      open.href = item.servicePortalUrl;
      open.target = "_blank";
      open.rel = "noopener noreferrer";
      open.title = item.servicePortalUrl;
      controls.append(open);
    }
    const edit = element("button", "trainer-edit", linked ? "Link bearbeiten" : "Link ergänzen");
    edit.id = "edit-" + item.id;
    edit.type = "button";
    edit.setAttribute("aria-expanded", String(expanded.has(item.id)));
    edit.setAttribute("aria-controls", "editor-" + item.id);
    edit.addEventListener("click", () => {
      if (expanded.has(item.id) && !drafts.has(item.id)) expanded.delete(item.id);
      else expanded.add(item.id);
      render();
      const target = expanded.has(item.id) ? document.getElementById("url-" + item.id) : document.getElementById("edit-" + item.id);
      if (target) target.focus();
    });
    controls.append(edit);
    current.append(state);
    if (linked) {
      const url = element("span", "trainer-module__url", item.servicePortalUrl);
      url.title = item.servicePortalUrl;
      current.append(url);
    }

    const form = element("form", "trainer-editor");
    form.id = "editor-" + item.id;
    form.hidden = !expanded.has(item.id);
    const label = element("label", "", "Serviceportal-URL");
    label.htmlFor = "url-" + item.id;
    const input = element("input", "trainer-url");
    input.id = label.htmlFor;
    input.type = "url";
    input.inputMode = "url";
    input.autocomplete = "url";
    input.maxLength = 2048;
    input.placeholder = "https://serviceportal…";
    input.value = drafts.has(item.id) ? drafts.get(item.id) : item.servicePortalUrl || "";
    const hint = element("p", "trainer-editor__hint", "Vollständige HTTPS-Adresse des passenden Serviceportal-Eintrags.");
    const actions = element("div", "trainer-actions");
    const save = element("button", "trainer-save", "Link speichern");
    save.type = "submit";
    const cancel = element("button", "trainer-cancel", "Abbrechen");
    cancel.type = "button";
    const feedback = element("span", "trainer-feedback");
    feedback.setAttribute("role", "status");
    function updateDraft() {
      const value = input.value.trim();
      if (value === (item.servicePortalUrl || "")) drafts.delete(item.id);
      else drafts.set(item.id, value);
      const invalid = !validUrl(value);
      input.setAttribute("aria-invalid", String(invalid));
      save.disabled = !drafts.has(item.id) || invalid;
      save.textContent = linked && !value ? "Link entfernen" : "Link speichern";
      feedback.textContent = invalid ? "Bitte eine vollständige HTTPS-Adresse eingeben." : drafts.has(item.id) ? "Noch nicht gespeichert" : "";
    }
    input.addEventListener("input", updateDraft);
    cancel.addEventListener("click", () => {
      drafts.delete(item.id);
      expanded.delete(item.id);
      render();
      const target = document.getElementById("edit-" + item.id);
      if (target) target.focus();
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      updateDraft();
      if (save.disabled) return;
      const value = drafts.get(item.id);
      save.disabled = true;
      input.disabled = true;
      cancel.disabled = true;
      feedback.textContent = "Wird gespeichert …";
      try {
        const response = await fetch("/api/trainer/modules/" + encodeURIComponent(item.id), {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ servicePortalUrl: value, expectedUrl: item.servicePortalUrl || "" }),
        });
        const result = await response.json();
        if (response.status === 409) {
          const currentModules = await loadModules();
          const currentItem = currentModules.find((module) => module.id === item.id);
          if (currentItem) item.servicePortalUrl = currentItem.servicePortalUrl || "";
          modules = currentModules;
          render("Der Link wurde inzwischen geändert. Dein Entwurf bleibt erhalten. Bitte prüfe den aktuellen Link und speichere erneut.");
          return;
        }
        if (!response.ok) throw new Error(result.error && result.error.message || "Speichern fehlgeschlagen.");
        item.servicePortalUrl = result.servicePortalUrl;
        drafts.delete(item.id);
        expanded.delete(item.id);
        render(value ? "Link gespeichert." : "Link entfernt.");
      } catch (error) {
        feedback.textContent = error && error.name === "Error" ? error.message : "Keine Verbindung zum Katalogserver. Bitte erneut versuchen.";
      } finally {
        input.disabled = false;
        cancel.disabled = false;
        save.disabled = !drafts.has(item.id) || !validUrl(input.value.trim());
      }
    });
    actions.append(save, cancel, feedback);
    form.append(label, input, hint, actions);
    updateDraft();
    row.append(identity, current, controls, form);
    return row;
  }

  async function loadModules() {
    const response = await fetch("/api/trainer/modules", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Module konnten nicht geladen werden.");
    const result = await response.json();
    if (!result || !Array.isArray(result.modules)) throw new Error("Moduldaten sind ungültig.");
    return result.modules;
  }

  search.addEventListener("input", () => { page = 1; render(); });
  filters.forEach((button) => button.addEventListener("click", () => { activeFilter = button.dataset.trainerFilter; page = 1; render(); }));
  previous.addEventListener("click", () => { page -= 1; render(); count.scrollIntoView({ block: "start" }); });
  next.addEventListener("click", () => { page += 1; render(); count.scrollIntoView({ block: "start" }); });
  window.addEventListener("beforeunload", (event) => {
    if (!drafts.size) return;
    event.preventDefault();
    event.returnValue = "";
  });
  if (location.protocol === "file:") {
    disableControls();
    status.textContent = "Diese Datei wurde direkt geöffnet. Zum Laden und Speichern der Serviceportal-Links den lokalen Server mit ./serve.sh starten.";
    const link = element("a", "trainer-module__open", "Trainerbereich auf localhost öffnen");
    link.href = "http://127.0.0.1:4173/trainer.html";
    status.append(" ", link);
    return;
  }
  loadModules().then((items) => { modules = items; render(); }).catch(() => {
    disableControls();
    status.textContent = "Die Module konnten nicht geladen werden. Bitte prüfen, ob der Katalogserver läuft, und die Seite erneut laden.";
  });
})();
