/**
 * Passcode gate guard — runs first on every protected page.
 *
 * Hides the document until /api/check confirms a valid `ase_gate` cookie.
 * Without it, redirects to gate.html (preserving the intended path in ?r).
 * This is the trial's access control: a shared passcode, not identity. The
 * real check is server-side in /api/check; this script only gates the UI.
 */
(function () {
  // Don't guard the gate page itself.
  if (location.pathname.replace(/\/$/, '').endsWith('/gate') ||
      location.pathname.endsWith('gate.html')) return;

  var html = document.documentElement;
  html.style.visibility = 'hidden';

  function redirect() {
    var here = location.pathname + location.search + location.hash;
    location.replace('/gate.html?r=' + encodeURIComponent(here));
  }

  fetch('/api/check', { credentials: 'same-origin' })
    .then(function (res) {
      if (res.ok) { html.style.visibility = ''; }
      else { redirect(); }
    })
    .catch(function () { redirect(); });
})();
