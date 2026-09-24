/* Keep the native assessment entry visible for first visits and retakes. */
(function (root) {
  "use strict";
  function element(tag, text, cls) { var node = root.document.createElement(tag); node.textContent = text; if (cls) node.className = cls; return node; }
  function render() {
    if (!root.LrnJourneyState) return;
    var model = root.LrnJourneyState.snapshot();
    var profile = new URLSearchParams(root.location.search).get("view") === "profile" || root.location.hash === "#roleSelect";
    var de = root.SiteLang && root.SiteLang.get() === "de";
    root.document.querySelectorAll("[data-assessment-prompt]").forEach(function (host) {
      host.hidden = profile;
      host.replaceChildren();
      if (host.hidden) return;
      host.className = "assessment-prompt";
      var heading = element("h2", model.assessmentAvailable ? (de ? "AI Self Assessment wiederholen" : "Retake the AI Self Assessment") : (de ? "Finde deinen Einstieg mit dem AI Self Assessment" : "Find your starting point with the AI Self Assessment"));
      host.appendChild(heading);
      host.appendChild(element("p", model.assessmentAvailable ? (de ? "Du kannst das Assessment jederzeit wiederholen und deinen Lernpfad aktualisieren." : "You can repeat the assessment anytime and update your learning path.") : (de ? "Beantworte zehn Fragen direkt hier im Lernkatalog und entdecke passende Lernpfade." : "Answer ten questions here in the learning catalog to find a suitable learning path.")));
      var actions = element("div", "", "assessment-prompt__actions");
      var start = element("a", model.assessmentAvailable ? (de ? "AI Self Assessment wiederholen" : "Retake the AI Self Assessment") : (de ? "AI Self Assessment starten" : "Start the AI Self Assessment"), "readiness-button");
      start.href = "assessment.html";
      actions.append(start); host.appendChild(actions);
    });
  }
  function start() {
    root.document.addEventListener("lrn:journey-change", render);
    root.document.addEventListener("sitelang:change", render);
    root.document.addEventListener("assessment-import:change", render);
    root.addEventListener("storage", render);
    render();
  }
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})(window);
