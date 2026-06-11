/**
 * Lightweight password gate for the site.
 *
 * NOTE: this is a static site with no server, so this check runs entirely in
 * the browser. It is a "please don't look" sign, NOT real access control — the
 * password is in the client code and the gate can be bypassed via DevTools or
 * by requesting assets directly. For real protection, use Static Web Apps Entra
 * authentication instead.
 *
 * Load this FIRST in <head> (before any other script or stylesheet) so content
 * never flashes before the gate appears.
 */
(function () {
  var PASSWORD = 'LHIND2026!';
  var KEY = 'site-gate-ok';

  try {
    if (sessionStorage.getItem(KEY) === '1') return; // already unlocked this session
  } catch (e) { /* sessionStorage may be unavailable */ }

  // Hide the page until unlocked.
  var style = document.createElement('style');
  style.id = 'gate-hide';
  style.textContent = 'html{visibility:hidden!important}#site-gate{visibility:visible!important}';
  (document.head || document.documentElement).appendChild(style);

  function buildOverlay() {
    var ov = document.createElement('div');
    ov.id = 'site-gate';
    ov.setAttribute('style', [
      'position:fixed', 'inset:0', 'z-index:2147483647',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:#0d1b2a', 'font-family:monospace', 'color:#e0e1dd'
    ].join(';'));
    ov.innerHTML =
      '<form id="gate-form" style="width:min(360px,86vw);text-align:center">' +
      '<div style="font-size:0.78rem;letter-spacing:0.18em;text-transform:uppercase;opacity:0.7;margin-bottom:18px">LHIND AI Learning Catalog</div>' +
      '<input id="gate-pw" type="password" autocomplete="current-password" autofocus ' +
      'placeholder="Password" ' +
      'style="width:100%;box-sizing:border-box;padding:12px 14px;background:transparent;border:1px solid #415a77;color:#e0e1dd;font-family:monospace;font-size:0.95rem;outline:none">' +
      '<button type="submit" style="width:100%;margin-top:12px;padding:11px;background:#415a77;border:1px solid #415a77;color:#fff;font-family:monospace;letter-spacing:0.12em;text-transform:uppercase;font-size:0.78rem;cursor:pointer">Enter</button>' +
      '<div id="gate-err" style="height:18px;margin-top:10px;color:#e07a5f;font-size:0.74rem"></div>' +
      '</form>';
    document.body.appendChild(ov);

    var form = ov.querySelector('#gate-form');
    var input = ov.querySelector('#gate-pw');
    var err = ov.querySelector('#gate-err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value === PASSWORD) {
        try { sessionStorage.setItem(KEY, '1'); } catch (x) {}
        var h = document.getElementById('gate-hide');
        if (h) h.remove();
        ov.remove();
      } else {
        err.textContent = 'Incorrect password';
        input.select();
      }
    });
    input.focus();
  }

  if (document.body) {
    buildOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', buildOverlay);
  }
})();
