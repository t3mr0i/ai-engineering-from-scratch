/**
 * Dark-mode toggle button wiring — shared by every page with a
 * #darkModeToggle button, so the behavior lives in one place instead of
 * being copy-pasted per page (see N-5). Load after i18n.js/lang.js (or
 * standalone; window.SiteLang is read defensively either way).
 *
 * Pairs with the early-apply snippet each page keeps inline in <head>
 * (reads the stored 'theme' key before first paint, to avoid a flash of
 * the wrong theme — that part can't be a deferred external file and stay
 * synchronous, so it isn't shared here).
 */
(function () {
  var btn = document.getElementById('darkModeToggle');
  var icon = document.getElementById('darkModeIcon');
  if (!btn) return;
  function stored() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function osDark() { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
  function current() {
    var s = stored();
    return (s === 'dark' || s === 'light') ? s : (osDark() ? 'dark' : 'light');
  }
  function render() {
    var theme = current();
    if (icon) icon.className = 'ph-light ' + (theme === 'dark' ? 'ph-sun' : 'ph-moon');
    var de = (window.SiteLang ? window.SiteLang.get() : 'en') === 'de';
    var label = theme === 'dark'
      ? (de ? 'Zu hellem Farbschema wechseln' : 'Switch to light color theme')
      : (de ? 'Zu dunklem Farbschema wechseln' : 'Switch to dark color theme');
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
  }
  render();
  btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch (e) {}
    document.documentElement.setAttribute('data-theme', next);
    render();
  });
  if (window.SiteLang) document.addEventListener('sitelang:change', render);
})();
