/**
 * Language toggle — shared across the content subpages. Replaces the old
 * theme.js dark-mode toggle (dropped; the site is light-only now). Persists
 * the choice in localStorage and translates elements tagged data-i18n /
 * data-i18n-html / data-i18n-placeholder / data-i18n-title using the
 * dictionary in site/i18n.js.
 */
(function () {
  var root = document.documentElement;
  var DICT = window.SITE_I18N || {};
  var lang = localStorage.getItem('lang') || 'en';

  function entry(key) {
    var e = DICT[key];
    return e && e[lang] != null ? e[lang] : null;
  }

  function translate() {
    root.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = entry(el.getAttribute('data-i18n'));
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = entry(el.getAttribute('data-i18n-html'));
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var v = entry(el.getAttribute('data-i18n-placeholder'));
      if (v != null) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var v = entry(el.getAttribute('data-i18n-title'));
      if (v != null) {
        el.setAttribute('title', v);
        el.setAttribute('aria-label', v);
      }
    });

    var icon = document.getElementById('langIcon');
    if (icon) icon.textContent = lang.toUpperCase();
    var toggleTitle = entry('lang_toggle_title');
    var toggle = document.getElementById('langToggle');
    if (toggle && toggleTitle) {
      toggle.setAttribute('title', toggleTitle);
      toggle.setAttribute('aria-label', toggleTitle);
    }
  }

  // Delegated so it keeps working after pages (e.g. lesson.html) replace the
  // header markup and mint a new #langToggle element on lesson navigation.
  function initToggle() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('#langToggle');
      if (!btn) return;
      e.preventDefault();
      lang = lang === 'en' ? 'de' : 'en';
      localStorage.setItem('lang', lang);
      translate();
    });
  }

  function init() {
    translate();
    initToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposed so pages that re-render nav markup after load (lesson.html's
  // dynamic lesson-to-lesson header) can re-apply translations without a
  // full reload.
  window.SiteLang = {
    translate: translate,
    get: function () { return lang; }
  };
})();
