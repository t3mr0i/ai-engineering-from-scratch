/* An assessment is encouraged, never required to browse the authored paths.
   Only an explicit skip dismisses the reminder; opening SharePoint does not. */
(function (root) {
  "use strict";
  var key = "aifs:assessment-prompt-skipped:v1", memory = {};
  function skipped(role) {
    if (memory[role] || memory["*"]) return true;
    try { var values = JSON.parse(root.localStorage.getItem(key)) || {}; return !!(values[role] || values["*"]); }
    catch (_) { return !!memory[role]; }
  }
  function skip() {
    var model = root.LrnJourneyState.snapshot(), role = model.roleSelected ? model.roleId : "*";
    memory[role] = true;
    try { var values = JSON.parse(root.localStorage.getItem(key)) || {}; values[role] = true; root.localStorage.setItem(key, JSON.stringify(values)); } catch (_) {}
    render();
  }
  function element(tag, text, cls) { var node = root.document.createElement(tag); node.textContent = text; if (cls) node.className = cls; return node; }
  function render() {
    if (!root.LrnJourneyState) return;
    var model = root.LrnJourneyState.snapshot();
    var profile = new URLSearchParams(root.location.search).get("view") === "profile" || root.location.hash === "#roleSelect";
    var de = root.SiteLang && root.SiteLang.get() === "de";
    root.document.querySelectorAll("[data-assessment-prompt]").forEach(function (host) {
      host.hidden = profile || model.assessmentAvailable || skipped(model.roleId || "unselected");
      host.replaceChildren();
      if (host.hidden) return;
      host.className = "assessment-prompt";
      var heading = element("h2", de ? "Finde deinen Einstieg mit dem AI-Assessment" : "Find your starting point with the AI assessment");
      host.appendChild(heading);
      host.appendChild(element("p", de ? "Was bringst du schon mit? Schätze dich ein und lade dein Ergebnis hoch. So passen die vorgefertigten Lernpfade zu deinem Wissensstand." : "What do you already know? Complete the assessment and upload your result to tailor the prepared learning paths to your starting point."));
      var actions = element("div", "", "assessment-prompt__actions");
      var start = element("a", de ? "Assessment starten" : "Start assessment", "readiness-button");
      start.href = "https://lufthansagroup.sharepoint.com/sites/LHIND_APP_AISelfAssessment/SitePages/de/TopicHome.aspx";
      start.target = "_blank"; start.rel = "noopener";
      start.setAttribute("aria-label", de ? "Assessment starten (SharePoint, neuer Tab)" : "Start assessment (SharePoint, new tab)");
      var upload = element("a", de ? "Ergebnis hochladen" : "Upload result", "readiness-button readiness-button--secondary");
      upload.href = "index.html?view=profile&from=" + (root.document.querySelector(".page--learning-workspace") ? "progress" : "learning") + "#assessmentImport";
      var later = element("button", de ? "Vorerst überspringen" : "Skip for now", "readiness-link"); later.type = "button"; later.addEventListener("click", skip);
      actions.append(start, upload, later); host.appendChild(actions);
    });
  }
  function start() {
    root.document.addEventListener("lrn:journey-change", render);
    root.document.addEventListener("sitelang:change", render);
    root.document.addEventListener("assessment-import:change", render);
    root.addEventListener("storage", render);
    var setupSkip = root.document.getElementById("setupSkip");
    if (setupSkip) setupSkip.addEventListener("click", skip);
    render();
  }
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})(window);
