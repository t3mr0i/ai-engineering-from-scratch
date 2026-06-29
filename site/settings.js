/**
 * Central settings — LLM API key, available on every page.
 *
 * The learner stores one Bifrost LHIND AI Gateway key here; it lives in localStorage
 * under `lrn-llm-key` (same-origin, never uploaded). Every JupyterLite notebook
 * reads it through the key bridge: when a notebook iframe loads, the lesson
 * shell postMessages the key in, and the notebook's lrn_llm wrapper reads it
 * from window.__LRN_LLM_KEY__ (see ide/jupyterlite/lrn-key-bridge.js).
 *
 * This file is the single source of truth for that key. lesson.html no longer
 * defines its own dialog — it reuses LrnSettings here so the catalog, lesson,
 * and every other page open the exact same settings and feed the same notebooks.
 */
(function () {
  var LRN_KEY_NAME = 'lrn-llm-key';

  function readKey() {
    try {
      var k = localStorage.getItem(LRN_KEY_NAME);
      if (k) return k;
      // legacy key name was lrn-llm-key:openai — migrate it once.
      var legacy = localStorage.getItem('lrn-llm-key:openai');
      if (legacy) {
        localStorage.setItem(LRN_KEY_NAME, legacy);
        localStorage.removeItem('lrn-llm-key:openai');
        return legacy;
      }
    } catch (e) {}
    return '';
  }

  function writeKey(k) {
    try {
      if (k) localStorage.setItem(LRN_KEY_NAME, k);
      else localStorage.removeItem(LRN_KEY_NAME);
      localStorage.removeItem('lrn-llm-key:openai');
      localStorage.removeItem('lrn-llm-key:anthropic');
    } catch (e) {}
  }

  // Push the current key into one notebook iframe. Re-send once shortly after,
  // in case the bridge listener wasn't ready when the iframe first loaded.
  function sendKeyToNotebook(frame) {
    if (!frame || !frame.contentWindow) return;
    var msg = { type: 'lrn-llm-key', key: readKey() };
    function post() {
      try { frame.contentWindow.postMessage(msg, window.location.origin); } catch (e) {}
    }
    post();
    setTimeout(post, 500);
  }

  // Re-push the key into every notebook iframe currently on the page, so saving
  // or clearing takes effect without reopening the notebook. Covers the known
  // iframe ids plus any iframe pointing at the JupyterLite bundle.
  function pushToOpenNotebooks() {
    var seen = [];
    ['nbFrame', 'lrnNbFrame'].forEach(function (id) {
      var f = document.getElementById(id);
      if (f) { sendKeyToNotebook(f); seen.push(f); }
    });
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (seen.indexOf(f) !== -1) continue;
      if ((f.src || '').indexOf('jupyterlite') !== -1) sendKeyToNotebook(f);
    }
  }

  function escapeAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function openDialog() {
    if (document.getElementById('lrnKeyOverlay')) return;
    var existingKey = readKey();

    var overlay = document.createElement('div');
    overlay.id = 'lrnKeyOverlay';
    overlay.className = 'lrn-key-overlay';
    overlay.innerHTML =
      '<div role="dialog" aria-modal="true" aria-label="API key settings" class="lrn-key-dialog">' +
      '  <h3 class="lrn-key-title">Bifrost · LHIND AI Gateway key</h3>' +
      '  <p class="lrn-key-lede">Lesson notebooks call the LLM exclusively through the <strong>Bifrost LHIND API Gateway</strong> (<code>gateway.lhind.ai</code>). Save your gateway key once — it stays in this browser only (localStorage, same-origin), no network upload.</p>' +
      '  <label class="lrn-key-label">Bifrost gateway key (sk-xf-…)</label>' +
      '  <div class="lrn-key-row">' +
      '    <input id="lrnKeyOpenAi" class="lrn-key-input" type="password" autocomplete="off" placeholder="sk-xf-…" value="' + escapeAttr(existingKey) + '">' +
      '  </div>' +
      '  <p class="lrn-key-foot">Der Key wird beim Öffnen eines Notebooks automatisch in die JupyterLite-Sandbox injiziert — kein Copy-Paste nötig. Im LHIND-Netz ist der Key optional (das Bifrost-Gateway authentifiziert netz-/WAF-basiert); außerhalb wird er benötigt.</p>' +
      '  <div class="lrn-key-actions">' +
      '    <button id="lrnKeyClear" type="button" class="lrn-key-btn lrn-key-btn--ghost">Clear</button>' +
      '    <button id="lrnKeyCancel" type="button" class="lrn-key-btn lrn-key-btn--ghost">Cancel</button>' +
      '    <button id="lrnKeySave" type="button" class="lrn-key-btn lrn-key-btn--primary">Save</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);

    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    document.getElementById('lrnKeyCancel').addEventListener('click', close);
    document.getElementById('lrnKeyClear').addEventListener('click', function () {
      writeKey('');
      pushToOpenNotebooks();
      close();
    });
    document.getElementById('lrnKeySave').addEventListener('click', function () {
      writeKey(document.getElementById('lrnKeyOpenAi').value.trim());
      pushToOpenNotebooks();
      close();
    });
    var input = document.getElementById('lrnKeyOpenAi');
    if (input) input.focus();
  }

  // Open from any element with id="lrnKeyBtn" (the nav gear), regardless of when
  // it renders.
  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.id === 'lrnKeyBtn') { e.preventDefault(); openDialog(); return; }
      t = t.parentNode;
    }
  });

  // Public surface for lesson.html (notebook injection on iframe load).
  window.LrnSettings = {
    readKey: readKey,
    open: openDialog,
    sendKeyToNotebook: sendKeyToNotebook,
    pushToOpenNotebooks: pushToOpenNotebooks,
  };
})();
