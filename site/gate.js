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
    // Lufthansa Group visual language: ground-to-sky deep navy with a faint
    // sky glow up top, Lufthansa Head Light title (sentence case), Lufthansa
    // Text for body, hairline 1px borders, solid Core Blue pill button.
    var ov = document.createElement('div');
    ov.id = 'site-gate';
    ov.setAttribute('style', [
      'position:fixed', 'inset:0', 'z-index:2147483647',
      'display:flex', 'align-items:center', 'justify-content:center',
      // ground-to-sky field · Core Blue with a soft radial sky glow
      'background:radial-gradient(120% 90% at 50% -20%, rgba(90,138,201,0.35) 0%, transparent 60%),linear-gradient(180deg,#14366B 0%,#05164d 100%)',
      // Lufthansa Text (body) with a Helvetica/Arial fallback so the page
      // is readable even before the webfont CSS has loaded.
      'font-family:"Lufthansa Text","Helvetica Neue",Arial,sans-serif',
      'font-weight:300',
      'color:#ffffff'
    ].join(';'));

    // Lufthansa Head (display) is loaded via tokens.css on every other page;
    // the gate runs before tokens.css loads, so inline-declare the @font-face
    // once so the title renders in the real face. Only Light is needed.
    var fontStyle = document.createElement('style');
    fontStyle.id = 'gate-fonts';
    fontStyle.textContent =
      "@font-face{font-family:'Lufthansa Head';src:url('lrn/assets/fonts/LHGHeadWEB-Light.woff2') format('woff2');font-weight:300;font-style:normal;font-display:swap;}" +
      "@font-face{font-family:'Lufthansa Text';src:url('lrn/assets/fonts/LHGTextWEB-Light.woff2') format('woff2');font-weight:300;font-style:normal;font-display:swap;}";
    (document.head || document.documentElement).appendChild(fontStyle);

    ov.innerHTML =
      '<form id="gate-form" style="width:min(360px,86vw);text-align:center">' +
      // Title: Lufthansa Head Light, sentence case, with a period for the
      // signature "calm, finished" LHG tone.
      '<div style="font-family:Lufthansa Head,Helvetica Neue,Arial,sans-serif;font-weight:300;font-size:1.5rem;letter-spacing:-0.01em;line-height:1.2;margin-bottom:8px">LHIND Learning Catalog.</div>' +
      // Subtitle: tracked overline in Lufthansa Text 500, like every
      // PROFILE / LEVEL overline on the catalog page.
      '<div style="font-family:Lufthansa Text,Helvetica Neue,Arial,sans-serif;font-weight:500;font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.72);margin-bottom:32px">Restricted · LHIND Industry Solutions</div>' +
      // Password input — hairline 1px border on warm grey, white surface,
      // Lufthansa Text italic placeholder.
      '<input id="gate-pw" type="password" autocomplete="current-password" autofocus ' +
      'placeholder="Password" ' +
      'style="width:100%;box-sizing:border-box;padding:14px 18px;background:#ffffff;border:1px solid #e3e1de;border-radius:12px;color:#05164d;font-family:Lufthansa Text,Helvetica Neue,Arial,sans-serif;font-weight:300;font-size:17px;line-height:1.5;outline:none;transition:border-color 240ms cubic-bezier(0.4,0,0.2,1),box-shadow 240ms cubic-bezier(0.4,0,0.2,1)" />' +
      // Primary button — solid Core Blue pill, Lufthansa Text regular.
      '<button type="submit" ' +
      'style="width:100%;margin-top:14px;padding:14px 24px;background:#05164d;border:1px solid #05164d;border-radius:999px;color:#ffffff;font-family:Lufthansa Text,Helvetica Neue,Arial,sans-serif;font-weight:400;font-size:14px;letter-spacing:0.005em;cursor:pointer;transition:background-color 240ms cubic-bezier(0.4,0,0.2,1)">Enter</button>' +
      '<div id="gate-err" style="height:18px;margin-top:14px;color:#ffb3b3;font-family:Lufthansa Text,Helvetica Neue,Arial,sans-serif;font-weight:300;font-size:13px"></div>' +
      '</form>';
    document.body.appendChild(ov);

    var form = ov.querySelector('#gate-form');
    var input = ov.querySelector('#gate-pw');
    var err = ov.querySelector('#gate-err');

    // Focus ring in Lufthansa Blue 500 — same token as hero search input.
    input.addEventListener('focus', function () {
      input.style.borderColor = '#2d5fe4';
      input.style.boxShadow = '0 0 0 3px rgba(45,95,228,0.30)';
    });
    input.addEventListener('blur', function () {
      input.style.borderColor = '#e3e1de';
      input.style.boxShadow = 'none';
    });

    var btn = form.querySelector('button[type="submit"]');
    btn.addEventListener('mouseenter', function () {
      btn.style.background = '#243f9b';
      btn.style.borderColor = '#243f9b';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.background = '#05164d';
      btn.style.borderColor = '#05164d';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value === PASSWORD) {
        try { sessionStorage.setItem(KEY, '1'); } catch (x) {}
        var h = document.getElementById('gate-hide');
        if (h) h.remove();
        ov.remove();
        var f = document.getElementById('gate-fonts');
        if (f) f.remove();
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
