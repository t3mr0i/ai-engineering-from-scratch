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
    overlay.setAttribute('style', 'position:fixed;inset:0;background:rgba(13,27,42,.78);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:inherit');
    overlay.innerHTML =
      '<div role="dialog" aria-modal="true" aria-label="API key settings" style="background:#fff;color:#0d1b2a;padding:28px 30px;border-radius:8px;max-width:520px;width:92vw;box-shadow:0 18px 48px rgba(0,0,0,.35)">' +
      '  <h3 style="margin:0 0 6px 0;font-size:1.05rem">Bifrost · LHIND AI Gateway key</h3>' +
      '  <p style="margin:0 0 16px 0;color:#415a77;font-size:.85rem;line-height:1.45">Lesson notebooks call the LLM exclusively through the <strong>Bifrost LHIND API Gateway</strong> (<code>gateway.lhind.ai</code>). Save your gateway key once — it stays in this browser only (localStorage, same-origin), no network upload.</p>' +
      '  <label style="display:block;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#415a77;margin-bottom:4px">Bifrost gateway key (sk-xf-…)</label>' +
      '  <div style="display:flex;gap:6px;align-items:stretch;margin-bottom:18px">' +
      '    <input id="lrnKeyOpenAi" type="password" autocomplete="off" placeholder="sk-xf-…" value="' + escapeAttr(existingKey) + '" style="flex:1;box-sizing:border-box;padding:9px 11px;border:1px solid #ccd6e0;border-radius:4px;font-family:monospace;font-size:.85rem">' +
      '  </div>' +
      '  <p style="margin:0 0 16px 0;color:#415a77;font-size:.74rem;line-height:1.45">Der Key wird beim Öffnen eines Notebooks automatisch in die JupyterLite-Sandbox injiziert — kein Copy-Paste nötig. Im LHIND-Netz ist der Key optional (das Bifrost-Gateway authentifiziert netz-/WAF-basiert); außerhalb wird er benötigt.</p>' +
      '  <div style="display:flex;justify-content:flex-end;gap:8px">' +
      '    <button id="lrnKeyClear" type="button" style="padding:8px 14px;background:#fff;border:1px solid #ccd6e0;border-radius:4px;cursor:pointer;font-family:inherit;font-size:.82rem">Clear</button>' +
      '    <button id="lrnKeyCancel" type="button" style="padding:8px 14px;background:#fff;border:1px solid #ccd6e0;border-radius:4px;cursor:pointer;font-family:inherit;font-size:.82rem">Cancel</button>' +
      '    <button id="lrnKeySave" type="button" style="padding:8px 16px;background:#415a77;color:#fff;border:1px solid #415a77;border-radius:4px;cursor:pointer;font-family:inherit;font-size:.82rem">Save</button>' +
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
