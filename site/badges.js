/**
 * AIFS Achievement Badges — local-only, derived from AIFSProgress.
 * site/badges.js
 *
 * No backend, no account. Badges are computed purely from the user's
 * localStorage progress (see progress.js: visits, quiz answers, lesson
 * completions, reading depth). When a new badge is earned mid-session a
 * toast fires; a "Badges" page renders the full earned/locked grid.
 *
 * Pure logic (CATALOG, evaluate, renderBadgeHTML) is exposed on
 * window.AIFSBadges and is unit-tested in badges.test.mjs via node:vm.
 */
(function () {
  'use strict';

  var BADGES_KEY = 'aifs:badges:v1';
  var PATH_RE = /(phases\/[^/]+\/[^/]+)\/?/;
  var READ_FULL = 0.9; // mirrors progress.js threshold

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function extractPath(url) {
    if (!url) return '';
    var m = String(url).match(PATH_RE);
    return m ? m[1] : '';
  }

  function phaseSlugFromPath(path) {
    if (!path) return '';
    var m = String(path).match(/^phases\/([^/]+)/);
    return m ? m[1] : '';
  }

  // Tier palette — constant across light/dark; rings read well on both.
  var TIERS = {
    bronze:   { ring: '#b08a4a', glow: 'rgba(176,138,74,0.45)',  label: 'Bronze' },
    silver:   { ring: '#9aa7b4', glow: 'rgba(154,167,180,0.45)', label: 'Silber' },
    gold:     { ring: '#d4af37', glow: 'rgba(212,175,55,0.50)',  label: 'Gold' },
    platinum: { ring: '#3fa9a0', glow: 'rgba(63,169,160,0.50)',  label: 'Platin' }
  };

  // ── state helpers ──────────────────────────────────────────────────────
  function eachLesson(state, fn) {
    var ls = (state && state.lessons) || {};
    for (var path in ls) { if (hasOwn(ls, path)) fn(path, ls[path]); }
  }
  function countCompleted(state) {
    var n = 0; eachLesson(state, function (p, lp) { if (lp && lp.completedAt) n++; }); return n;
  }
  function countVisited(state) {
    var n = 0; eachLesson(state, function (p, lp) {
      if (lp && (lp.visitedAt || lp.completedAt)) n++;
    }); return n;
  }
  function countAnswered(state) {
    var n = 0; eachLesson(state, function (p, lp) {
      if (lp && lp.answers) { for (var q in lp.answers) if (hasOwn(lp.answers, q)) n++; }
    }); return n;
  }
  function countFullyRead(state) {
    var n = 0; eachLesson(state, function (p, lp) {
      if (!lp) return;
      if (lp.completedAt || (lp.readPct || 0) >= READ_FULL) n++;
    }); return n;
  }
  function distinctPhasesTouched(state) {
    var set = {};
    eachLesson(state, function (p, lp) {
      if (lp && (lp.visitedAt || lp.completedAt)) { var s = phaseSlugFromPath(p); if (s) set[s] = 1; }
    });
    return Object.keys(set).length;
  }
  function countPerfectQuizzes(state) {
    // A full lesson quiz has 6 questions (1 pre + 3 check + 2 post).
    var n = 0;
    eachLesson(state, function (p, lp) {
      if (!lp || !lp.answers) return;
      var keys = Object.keys(lp.answers);
      if (keys.length < 6) return;
      var ok = true;
      for (var i = 0; i < keys.length; i++) {
        var a = lp.answers[keys[i]];
        if (!a || !a.correct) { ok = false; break; }
      }
      if (ok) n++;
    });
    return n;
  }
  function phaseLessonPaths(phase) {
    var out = [];
    if (!phase || !phase.lessons) return out;
    for (var i = 0; i < phase.lessons.length; i++) {
      var pp = extractPath(phase.lessons[i] && phase.lessons[i].url);
      if (pp) out.push(pp);
    }
    return out;
  }
  function totalCatalogLessons(ctx) {
    var phases = (ctx && ctx.phases) || [];
    var n = 0;
    for (var i = 0; i < phases.length; i++) {
      if (phases[i] && !phases[i].hidden) n += (phases[i].lessons ? phases[i].lessons.length : 0);
    }
    return n;
  }
  function phasesMasteredCount(state, ctx) {
    var phases = (ctx && ctx.phases) || [];
    var ls = (state && state.lessons) || {};
    var n = 0;
    for (var i = 0; i < phases.length; i++) {
      if (phases[i].hidden) continue;
      var paths = phaseLessonPaths(phases[i]);
      if (!paths.length) continue;
      var c = 0;
      for (var j = 0; j < paths.length; j++) {
        if (ls[paths[j]] && ls[paths[j]].completedAt) c++;
      }
      if (c >= paths.length) n++;
    }
    return n;
  }

  // ── badge catalog ──────────────────────────────────────────────────────
  // Each check returns { earned:boolean, cur:number, total:number } so the
  // locked state can show progress toward the goal.
  var CATALOG = [
    { id: 'first-steps', title: 'Erste Schritte', tier: 'bronze', icon: 'ph-footprints',
      desc: 'Besuche deine erste Lektion.',
      check: function (s) { var n = countVisited(s); return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'first-quiz', title: 'Quiz-Anfänger', tier: 'bronze', icon: 'ph-question',
      desc: 'Beantworte deine erste Quiz-Frage.',
      check: function (s) { var n = countAnswered(s); return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'first-complete', title: 'Erste Lektion gemeistert', tier: 'bronze', icon: 'ph-check-circle',
      desc: 'Schließe deine erste Lektion ab.',
      check: function (s) { var n = countCompleted(s); return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'explorer', title: 'Entdecker', tier: 'bronze', icon: 'ph-compass',
      desc: 'Besuche 10 verschiedene Lektionen.',
      check: function (s) { var n = countVisited(s); return { earned: n >= 10, cur: Math.min(n, 10), total: 10 }; } },
    { id: 'bookworm', title: 'Leseratte', tier: 'bronze', icon: 'ph-book-open',
      desc: 'Lese 5 Lektionen vollständig durch (≥90% Scrolltiefe).',
      check: function (s) { var n = countFullyRead(s); return { earned: n >= 5, cur: Math.min(n, 5), total: 5 }; } },
    { id: 'perfect-quiz', title: 'Perfektes Quiz', tier: 'silver', icon: 'ph-check-fat',
      desc: 'Beantworte in einer Lektion alle 6 Quiz-Fragen richtig.',
      check: function (s) { var n = countPerfectQuizzes(s); return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'consistent', title: 'Konsequent', tier: 'silver', icon: 'ph-target',
      desc: 'Schließe 5 Lektionen ab.',
      check: function (s) { var n = countCompleted(s); return { earned: n >= 5, cur: Math.min(n, 5), total: 5 }; } },
    { id: 'ten-milestone', title: 'Zehn-Meilenstein', tier: 'silver', icon: 'ph-flag',
      desc: 'Schließe 10 Lektionen ab.',
      check: function (s) { var n = countCompleted(s); return { earned: n >= 10, cur: Math.min(n, 10), total: 10 }; } },
    { id: 'polymath', title: 'Vielseitig', tier: 'silver', icon: 'ph-tree-structure',
      desc: 'Berühre Lektionen in 5 verschiedenen Phasen.',
      check: function (s) { var n = distinctPhasesTouched(s); return { earned: n >= 5, cur: Math.min(n, 5), total: 5 }; } },
    { id: 'fifty-lessons', title: 'Fünfziger-Club', tier: 'gold', icon: 'ph-star',
      desc: 'Schließe 50 Lektionen ab.',
      check: function (s) { var n = countCompleted(s); return { earned: n >= 50, cur: Math.min(n, 50), total: 50 }; } },
    { id: 'halfway', title: 'Halbzeit', tier: 'gold', icon: 'ph-percent',
      desc: 'Schließe die Hälfte des gesamten Curriculums ab.',
      check: function (s, c) {
        var tot = totalCatalogLessons(c);
        var half = Math.ceil(tot / 2);
        var n = countCompleted(s);
        return { earned: tot > 0 && n >= half, cur: Math.min(n, half || 1), total: half || 1 };
      } },
    { id: 'phase-master', title: 'Phasen-Meister', tier: 'gold', icon: 'ph-crown',
      desc: 'Schließe alle Lektionen einer Phase ab.',
      check: function (s, c) { var n = phasesMasteredCount(s, c); return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'hundred-club', title: 'Hunderter-Club', tier: 'gold', icon: 'ph-trophy',
      desc: 'Schließe 100 Lektionen ab.',
      check: function (s) { var n = countCompleted(s); return { earned: n >= 100, cur: Math.min(n, 100), total: 100 }; } },
    { id: 'curriculum-master', title: 'Curriculum-Meister', tier: 'platinum', icon: 'ph-medal',
      desc: 'Schließe alle Lektionen des gesamten Curriculums ab.',
      check: function (s, c) {
        var tot = totalCatalogLessons(c);
        var n = countCompleted(s);
        return { earned: tot > 0 && n >= tot, cur: Math.min(n, tot || 1), total: tot || 1 };
      } }
  ];

  function byId(id) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
    return null;
  }

  // ── evaluate ───────────────────────────────────────────────────────────
  function evaluate(state, ctx) {
    state = state || { lessons: {} };
    ctx = ctx || {};
    var phases = ctx.phases || [];
    var details = {};
    var earned = [];
    for (var i = 0; i < CATALOG.length; i++) {
      var b = CATALOG[i];
      var r = b.check(state, { phases: phases }) || { earned: false, cur: 0, total: 1 };
      if (typeof r.earned !== 'boolean') r.earned = !!r.earned;
      if (typeof r.cur !== 'number') r.cur = Number(r.cur) || 0;
      if (typeof r.total !== 'number' || !r.total) r.total = 1;
      details[b.id] = r;
      if (r.earned) earned.push(b.id);
    }
    return { earned: earned, details: details };
  }

  // ── rendering (returns HTML strings; no DOM mutation here) ─────────────
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function tierLabel(t) { return (TIERS[t] && TIERS[t].label) || t; }

  function renderBadgeHTML(badge, detail) {
    var d = detail || { earned: false, cur: 0, total: 1 };
    var earned = !!d.earned;
    var tier = TIERS[badge.tier] || TIERS.bronze;
    var iconCls = 'ph-light ' + (badge.icon || 'ph-medal');
    var stateCls = earned ? 'aifs-badge--earned' : 'aifs-badge--locked';
    var cur = d.cur || 0, total = d.total || 1;
    var pct = Math.max(0, Math.min(100, Math.round((cur / total) * 100)));
    var lock = earned ? '' : '<i class="ph-light ph-lock aifs-badge__lock" aria-hidden="true"></i>';
    var progress = earned ? '' :
      '<div class="aifs-badge__progress" aria-hidden="true">' +
      '<div class="aifs-badge__bar" style="width:' + pct + '%"></div></div>' +
      '<div class="aifs-badge__hint">' + cur + ' / ' + total + '</div>';
    return '' +
      '<div class="aifs-badge ' + stateCls + ' aifs-badge--' + badge.tier + '" title="' + escapeHTML(badge.desc) + '">' +
        '<div class="aifs-badge__disc" style="--tier-ring:' + tier.ring + ';--tier-glow:' + tier.glow + '">' +
          '<i class="' + iconCls + '" aria-hidden="true"></i>' + lock +
        '</div>' +
        '<div class="aifs-badge__title">' + escapeHTML(badge.title) + '</div>' +
        '<div class="aifs-badge__tier">' + escapeHTML(tierLabel(badge.tier)) + '</div>' +
        progress +
      '</div>';
  }

  function renderGridHTML(evalResult) {
    evalResult = evalResult || { earned: [], details: {} };
    var html = '';
    for (var i = 0; i < CATALOG.length; i++) {
      var b = CATALOG[i];
      html += renderBadgeHTML(b, evalResult.details[b.id]);
    }
    return '<div class="aifs-badges-grid">' + html + '</div>';
  }

  function renderSummaryHTML(evalResult, extra) {
    evalResult = evalResult || { earned: [], details: {} };
    extra = extra || {};
    var got = evalResult.earned.length;
    var total = CATALOG.length;
    var pct = Math.round((got / total) * 100);
    var lessons = (typeof extra.completed === 'number') ? extra.completed : null;
    var html = '<div class="aifs-badges-summary">' +
      '<div class="aifs-badges-summary__count"><strong>' + got + '</strong> / ' + total + ' Badges</div>' +
      '<div class="aifs-badges-summary__bar"><div class="aifs-badges-summary__fill" style="width:' + pct + '%"></div></div>';
    if (lessons !== null) html += '<div class="aifs-badges-summary__lessons">' + lessons + ' Lektionen abgeschlossen</div>';
    html += '</div>';
    return html;
  }

  // ── browser wiring (only runs in a real DOM with AIFSProgress) ─────────
  function getPhases() {
    try { if (typeof PHASES !== 'undefined') return PHASES; } catch (e) {}
    try { return (window.PHASES || []); } catch (e) { return []; }
  }

  function readSeen() {
    try {
      var raw = localStorage.getItem(BADGES_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && parsed.seen) ? parsed.seen : {};
    } catch (e) { return {}; }
  }
  function writeSeen(seen) {
    try { localStorage.setItem(BADGES_KEY, JSON.stringify({ seen: seen, updatedAt: Date.now() })); }
    catch (e) { /* quota / disabled — fail silently */ }
  }

  function readProgressState() {
    return (window.AIFSProgress && typeof window.AIFSProgress.getState === 'function')
      ? window.AIFSProgress.getState() : { lessons: {} };
  }

  function currentCtx() { return { phases: getPhases() }; }

  function renderMountTargets(res) {
    if (typeof document === 'undefined') return;
    var grid = document.querySelector('[data-aifs-badges-grid]');
    if (grid) grid.innerHTML = renderGridHTML(res);
    var sum = document.querySelector('[data-aifs-badges-summary]');
    if (sum) {
      var completed = window.AIFSProgress ? window.AIFSProgress.totalCompleted() : 0;
      sum.innerHTML = renderSummaryHTML(res, { completed: completed });
    }
  }

  function updateNavCount(n) {
    if (typeof document === 'undefined') return;
    var el = document.getElementById('navBadgeCount');
    if (!el) return;
    if (n > 0) { el.textContent = String(n); el.setAttribute('data-show', 'true'); }
    else { el.setAttribute('data-show', 'false'); }
  }

  function ensureToastContainer() {
    var c = document.getElementById('aifsBadgeToasts');
    if (!c) {
      c = document.createElement('div');
      c.id = 'aifsBadgeToasts';
      c.className = 'aifs-badge-toasts';
      c.setAttribute('aria-live', 'polite');
      c.setAttribute('aria-atomic', 'false');
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(badges) {
    if (typeof document === 'undefined' || !badges || !badges.length) return;
    var c = ensureToastContainer();
    for (var i = 0; i < badges.length; i++) {
      var b = badges[i];
      var tier = TIERS[b.tier] || TIERS.bronze;
      var el = document.createElement('a');
      el.className = 'aifs-badge-toast aifs-badge-toast--' + b.tier;
      el.href = 'badges.html';
      el.style.setProperty('--tier-ring', tier.ring);
      el.style.setProperty('--tier-glow', tier.glow);
      el.innerHTML =
        '<span class="aifs-badge-toast__disc" style="--tier-ring:' + tier.ring + '">' +
          '<i class="ph-light ' + (b.icon || 'ph-medal') + '" aria-hidden="true"></i>' +
        '</span>' +
        '<span class="aifs-badge-toast__body">' +
          '<span class="aifs-badge-toast__eyebrow">Neues Badge freigeschaltet</span>' +
          '<span class="aifs-badge-toast__title">' + escapeHTML(b.title) + '</span>' +
          '<span class="aifs-badge-toast__tier">' + escapeHTML(tierLabel(b.tier)) + '</span>' +
        '</span>';
      c.appendChild(el);
      (function (node) {
        setTimeout(function () {
          node.classList.add('aifs-badge-toast--leave');
          setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 320);
        }, 6000);
      })(el);
    }
  }

  function mount() {
    if (typeof window === 'undefined' || !window.AIFSProgress) return;
    var seen = readSeen();
    var res = evaluate(readProgressState(), currentCtx());
    // Mark everything currently earned as already seen so a page load never
    // spams toasts; only badges earned AFTER this point toast.
    for (var i = 0; i < res.earned.length; i++) seen[res.earned[i]] = true;
    writeSeen(seen);
    renderMountTargets(res);
    updateNavCount(res.earned.length);

    window.AIFSProgress.onChange(function () {
      var r2 = evaluate(readProgressState(), currentCtx());
      var newly = [];
      for (var j = 0; j < r2.earned.length; j++) {
        var id = r2.earned[j];
        if (!seen[id]) { seen[id] = true; newly.push(id); }
      }
      if (newly.length) {
        writeSeen(seen);
        var objs = [];
        for (var k = 0; k < newly.length; k++) { var b = byId(newly[k]); if (b) objs.push(b); }
        showToast(objs);
      }
      renderMountTargets(r2);
      updateNavCount(r2.earned.length);
    });
  }

  var api = {
    version: 1,
    CATALOG: CATALOG,
    TIERS: TIERS,
    extractPath: extractPath,
    evaluate: evaluate,
    byId: byId,
    renderBadgeHTML: renderBadgeHTML,
    renderGridHTML: renderGridHTML,
    renderSummaryHTML: renderSummaryHTML,
    mount: mount
  };

  if (typeof window !== 'undefined') window.AIFSBadges = api;

  // Auto-mount in the browser once the DOM is ready.
  if (typeof document !== 'undefined') {
    function boot() { try { mount(); } catch (e) { /* fail silently */ } }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
