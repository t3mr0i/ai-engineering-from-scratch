// LRN LLM key bridge — runs inside each JupyterLite HTML entry (same origin as
// the lesson site that embeds it via <iframe>).
//
// The lesson site holds the learner's LLM gateway key centrally in
// localStorage and postMessages it into this iframe. We stash it on a window
// global that the notebook's lrn_llm wrapper reads (via Pyodide's `js` module).
// Empty key → the wrapper sends no Authorization header (in-network gateway
// auth still works). See ide/jupyterlite/lrn_llm.py and site/lesson.html.
(function () {
  window.__LRN_LLM_KEY__ = window.__LRN_LLM_KEY__ || "";
  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    var data = event.data;
    if (!data || data.type !== "lrn-llm-key") return;
    window.__LRN_LLM_KEY__ = (data.key || "").toString();
  });
})();
