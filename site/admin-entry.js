(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (!root || !root.document) return;

  root.AdminEntry = api;
  const start = () => api.mount(root.document, root.fetch && root.fetch.bind(root));
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const ADMIN_ROLES = new Set(["editor", "reviewer", "publisher"]);

  function hasAdminAccess(payload) {
    const roles = payload && payload.actor && payload.actor.roles;
    return Array.isArray(roles) && roles.some((role) => ADMIN_ROLES.has(role));
  }

  function makeIcon(documentRef) {
    const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.7");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle>';
    return svg;
  }

  function createEntry(documentRef) {
    const entry = documentRef.createElement("a");
    entry.className = "nav-admin-entry";
    entry.href = "/admin.html";
    entry.hidden = true;
    entry.setAttribute("aria-label", "Curriculum verwalten");
    entry.setAttribute("title", "Curriculum verwalten");
    entry.append(makeIcon(documentRef));
    const label = documentRef.createElement("span");
    label.textContent = "Admin";
    entry.append(label);
    return entry;
  }

  async function mount(documentRef, fetchFn) {
    const nav = documentRef && documentRef.querySelector(".nav-edge");
    if (!nav || typeof fetchFn !== "function") return false;

    let entry = nav.querySelector("[data-admin-entry]");
    if (!entry) {
      entry = createEntry(documentRef);
      entry.dataset.adminEntry = "true";
    }
    nav.append(entry);

    try {
      const response = await fetchFn("/api/admin/me", {
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return false;
      const payload = await response.json();
      if (!hasAdminAccess(payload)) return false;
      entry.hidden = false;
      entry.dataset.adminReady = "true";
      return true;
    } catch (_) {
      return false;
    }
  }

  return { hasAdminAccess, mount };
});
