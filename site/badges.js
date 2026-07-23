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

  // Awards UI hidden for now (nav link + toasts) — flip to false to restore.
  var AWARDS_HIDDEN = true;

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  // Badge titles/descriptions and a few render-time UI strings are bilingual
  // ({en, de} objects); everything else in this file (ids, checks) is
  // language-independent. Falls back to 'en' when localStorage is unavailable
  // (e.g. the node:vm sandbox in badges.test.mjs has no `localStorage`).
  function curLang() {
    try { return (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || 'en'; }
    catch (e) { return 'en'; }
  }
  function pick(v) { return (v && typeof v === 'object') ? (v[curLang()] || v.en) : v; }
  var STR = {
    newBadgeUnlocked: { en: 'New badge unlocked', de: 'Neues Badge freigeschaltet' },
    daysInARow: { en: 'days in a row', de: 'Tage in Folge' },
    bestStreak: { en: 'Best streak', de: 'Best-Streak' },
    activeToday: { en: 'active today', de: 'heute aktiv' },
    notActiveToday: { en: 'not active today yet', de: 'heute noch nicht aktiv' },
    badgesLabel: { en: 'badges', de: 'Badges' },
    lessonsCompleted: { en: 'lessons completed', de: 'Lektionen abgeschlossen' },
    unlocked: { en: 'Unlocked', de: 'Freigeschaltet' },
    locked: { en: 'Locked', de: 'Gesperrt' }
  };

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

  // Tier palette — Lufthansa Group Design System expressions tones.
  // Rings map to the LHG raw scale (site/lrn/tokens.css) so the medals
  // share the corporate visual language instead of generic gold/bronze.
  //   bronze   -> LHG Blue 600    (#243f9b)  corporate blue accent
  //   silver   -> --lhg-slate-500 (#657898)  cool neutral
  //   gold     -> --lhg-warning   (#e2974b)  amber accent
  //   platinum -> --lhg-teal      (#368089)  Expressions category tone
  // glow is the same hue at 45% alpha for the disc shadow. Each entry also
  // carries the LHG Badge tone used for the pill label (Badge.jsx tones:
  // neutral | blue | success | warning | error | teal | purple).
  var TIERS = {
    bronze:   { ring: '#243f9b', glow: 'rgba(36,63,155,0.45)',  label: { en: 'Bronze',   de: 'Bronze' }, tone: 'blue' },
    silver:   { ring: '#657898', glow: 'rgba(101,120,152,0.45)', label: { en: 'Silver',   de: 'Silber' }, tone: 'neutral' },
    gold:     { ring: '#e2974b', glow: 'rgba(226,151,75,0.50)',  label: { en: 'Gold',     de: 'Gold' },   tone: 'warning' },
    platinum: { ring: '#368089', glow: 'rgba(54,128,137,0.50)',  label: { en: 'Platinum', de: 'Platin' }, tone: 'teal' }
  };

  // Per-lesson aggregates (completed / visited / answered / fullyRead /
  // perfectQuizzes / distinctPhases / completionsByDay) are computed in a
  // single pass by computeAggregates() below; badge checks then read those
  // precomputed numbers instead of each re-walking state.lessons.
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

  // ── date + streak helpers (pure, no window/localStorage) ──────────────
  // Day keys are "YYYY-MM-DD". ctx.now (a ts) lets tests inject a fixed
  // clock. Kept self-contained so badges.test.mjs (which loads only
  // badges.js) exercises the real math, not a window delegation.
  function toDayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dayDiff(a, b) {
    return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
  }
  function nowTs(ctx) { return (ctx && typeof ctx.now === 'number') ? ctx.now : Date.now(); }

  // streakInfo: derive { current, best, lastDay, activeToday } from the raw
  // days[] list (the source of truth on state.streak). Recomputed here so
  // badge logic stays pure even if progress.js' maintained counters drift.
  function streakInfo(state, ctx) {
    var st = (state && state.streak) || { days: [], current: 0, best: 0, lastDay: '' };
    var days = Array.isArray(st.days) ? st.days.slice().sort() : [];
    if (!days.length) return { current: 0, best: 0, lastDay: '', activeToday: false };
    var best = 1, cur = 1;
    for (var i = 1; i < days.length; i++) {
      cur = (dayDiff(days[i - 1], days[i]) === 1) ? cur + 1 : 1;
      if (cur > best) best = cur;
    }
    var today = toDayKey(nowTs(ctx));
    var last = days[days.length - 1];
    var gap = dayDiff(last, today);
    // gap 0 (today) or 1 (yesterday) keeps the streak "current"; 2+ broken.
    return { current: gap <= 1 ? cur : 0, best: best, lastDay: last, activeToday: gap === 0 };
  }

  // ── computeAggregates: ONE pass over state.lessons ────────────────────
  // Every badge check reads from this object, so evaluate() is O(lessons)
  // instead of O(badges × lessons). Also the unit-testable seam for the
  // counting logic (see badges.test.mjs).
  function computeAggregates(state, ctx) {
    state = state || {};
    var ls = state.lessons || {};
    ctx = ctx || {};
    var phases = ctx.phases || [];
    var a = {
      completed: 0, visited: 0, answered: 0, fullyRead: 0,
      perfectQuizzes: 0, distinctPhases: {}, completionsByDay: {},
      catalogTotal: totalCatalogLessons(ctx),
      phasesMastered: 0,
      streak: streakInfo(state, ctx)
    };
    for (var path in ls) {
      if (!hasOwn(ls, path)) continue;
      var lp = ls[path]; if (!lp) continue;
      var active = !!(lp.visitedAt || lp.completedAt);
      if (active) a.visited++;
      if (lp.completedAt) {
        a.completed++;
        var dk = toDayKey(lp.completedAt);
        a.completionsByDay[dk] = (a.completionsByDay[dk] || 0) + 1;
      }
      if (lp.completedAt || (lp.readPct || 0) >= READ_FULL) a.fullyRead++;
      if (lp.answers) {
        var keys = Object.keys(lp.answers);
        for (var q = 0; q < keys.length; q++) if (hasOwn(lp.answers, keys[q])) a.answered++;
        // a full lesson quiz is 6 questions (1 pre + 3 check + 2 post)
        if (keys.length >= 6) {
          var ok = true;
          for (var i = 0; i < keys.length; i++) {
            var an = lp.answers[keys[i]];
            if (!an || !an.correct) { ok = false; break; }
          }
          if (ok) a.perfectQuizzes++;
        }
      }
      if (active) { var ps = phaseSlugFromPath(path); if (ps) a.distinctPhases[ps] = 1; }
    }
    a.distinctPhasesCount = Object.keys(a.distinctPhases).length;
    a.maxPerDay = 0;
    for (var d in a.completionsByDay) if (hasOwn(a.completionsByDay, d) && a.completionsByDay[d] > a.maxPerDay) a.maxPerDay = a.completionsByDay[d];
    a.phasesMastered = phasesMasteredCount(state, ctx);
    return a;
  }

  // ── badge catalog ──────────────────────────────────────────────────────
  // Each check receives the precomputed aggregate object (a) from
  // computeAggregates() and returns { earned, cur, total } so the locked
  // state can show progress toward the goal. Checks are O(1) reads.
  var CATALOG = [
    { id: 'first-steps', title: { en: 'First Steps', de: 'Erste Schritte' }, tier: 'bronze', icon: 'ph-footprints',
      desc: { en: 'Visit your first lesson.', de: 'Besuche deine erste Lektion.' },
      check: function (a) { var n = a.visited; return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'first-quiz', title: { en: 'Quiz Rookie', de: 'Quiz-Anfänger' }, tier: 'bronze', icon: 'ph-question',
      desc: { en: 'Answer your first quiz question.', de: 'Beantworte deine erste Quiz-Frage.' },
      check: function (a) { var n = a.answered; return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'first-complete', title: { en: 'First Lesson Mastered', de: 'Erste Lektion gemeistert' }, tier: 'bronze', icon: 'ph-check-circle',
      desc: { en: 'Complete your first lesson.', de: 'Schließe deine erste Lektion ab.' },
      check: function (a) { var n = a.completed; return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'explorer', title: { en: 'Explorer', de: 'Entdecker' }, tier: 'bronze', icon: 'ph-compass',
      desc: { en: 'Visit 10 different lessons.', de: 'Besuche 10 verschiedene Lektionen.' },
      check: function (a) { var n = a.visited; return { earned: n >= 10, cur: Math.min(n, 10), total: 10 }; } },
    { id: 'bookworm', title: { en: 'Bookworm', de: 'Leseratte' }, tier: 'bronze', icon: 'ph-book-open',
      desc: { en: 'Read 5 lessons in full (≥90% scroll depth).', de: 'Lese 5 Lektionen vollständig durch (≥90% Scrolltiefe).' },
      check: function (a) { var n = a.fullyRead; return { earned: n >= 5, cur: Math.min(n, 5), total: 5 }; } },
    { id: 'perfect-quiz', title: { en: 'Perfect Quiz', de: 'Perfektes Quiz' }, tier: 'silver', icon: 'ph-check-fat',
      desc: { en: 'Answer all 6 quiz questions correctly in one lesson.', de: 'Beantworte in einer Lektion alle 6 Quiz-Fragen richtig.' },
      check: function (a) { var n = a.perfectQuizzes; return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'consistent', title: { en: 'Consistent', de: 'Konsequent' }, tier: 'silver', icon: 'ph-target',
      desc: { en: 'Complete 5 lessons.', de: 'Schließe 5 Lektionen ab.' },
      check: function (a) { var n = a.completed; return { earned: n >= 5, cur: Math.min(n, 5), total: 5 }; } },
    { id: 'ten-milestone', title: { en: 'Ten Milestone', de: 'Zehn-Meilenstein' }, tier: 'silver', icon: 'ph-flag',
      desc: { en: 'Complete 10 lessons.', de: 'Schließe 10 Lektionen ab.' },
      check: function (a) { var n = a.completed; return { earned: n >= 10, cur: Math.min(n, 10), total: 10 }; } },
    { id: 'polymath', title: { en: 'Polymath', de: 'Vielseitig' }, tier: 'silver', icon: 'ph-tree-structure',
      desc: { en: 'Touch lessons in 5 different phases.', de: 'Berühre Lektionen in 5 verschiedenen Phasen.' },
      check: function (a) { var n = a.distinctPhasesCount; return { earned: n >= 5, cur: Math.min(n, 5), total: 5 }; } },
    { id: 'fifty-lessons', title: { en: 'Fifty Club', de: 'Fünfziger-Club' }, tier: 'gold', icon: 'ph-star',
      desc: { en: 'Complete 50 lessons.', de: 'Schließe 50 Lektionen ab.' },
      check: function (a) { var n = a.completed; return { earned: n >= 50, cur: Math.min(n, 50), total: 50 }; } },
    { id: 'halfway', title: { en: 'Halfway', de: 'Halbzeit' }, tier: 'gold', icon: 'ph-percent',
      desc: { en: 'Complete half of the entire curriculum.', de: 'Schließe die Hälfte des gesamten Curriculums ab.' },
      check: function (a) {
        var half = Math.ceil(a.catalogTotal / 2);
        return { earned: a.catalogTotal > 0 && a.completed >= half, cur: Math.min(a.completed, half || 1), total: half || 1 };
      } },
    { id: 'phase-master', title: { en: 'Phase Master', de: 'Phasen-Meister' }, tier: 'gold', icon: 'ph-crown',
      desc: { en: 'Complete every lesson in a phase.', de: 'Schließe alle Lektionen einer Phase ab.' },
      check: function (a) { var n = a.phasesMastered; return { earned: n >= 1, cur: Math.min(n, 1), total: 1 }; } },
    { id: 'hundred-club', title: { en: 'Hundred Club', de: 'Hunderter-Club' }, tier: 'gold', icon: 'ph-trophy',
      desc: { en: 'Complete 100 lessons.', de: 'Schließe 100 Lektionen ab.' },
      check: function (a) { var n = a.completed; return { earned: n >= 100, cur: Math.min(n, 100), total: 100 }; } },
    { id: 'curriculum-master', title: { en: 'Curriculum Master', de: 'Curriculum-Meister' }, tier: 'platinum', icon: 'ph-medal',
      desc: { en: 'Complete every lesson in the entire curriculum.', de: 'Schließe alle Lektionen des gesamten Curriculums ab.' },
      check: function (a) {
        var tot = a.catalogTotal;
        return { earned: tot > 0 && a.completed >= tot, cur: Math.min(a.completed, tot || 1), total: tot || 1 };
      } },
    // ── Streak / daily badges (read a.streak / a.maxPerDay) ──────────────
    { id: 'daily-sprint', title: { en: 'Daily Sprint', de: 'Tagesziel' }, tier: 'bronze', icon: 'ph-battery-high',
      desc: { en: 'Complete 3 lessons in a single day.', de: 'Schließe an einem einzigen Tag 3 Lektionen ab.' },
      check: function (a) { var n = a.maxPerDay; return { earned: n >= 3, cur: Math.min(n, 3), total: 3 }; } },
    { id: 'warmed-up', title: { en: 'Warmed Up', de: 'Aufwärmer' }, tier: 'silver', icon: 'ph-fire',
      desc: { en: 'Learn on 3 consecutive days.', de: 'Lerne an 3 Tagen in Folge.' },
      check: function (a) { var n = a.streak.best; return { earned: n >= 3, cur: Math.min(n, 3), total: 3 }; } },
    { id: 'steady-spirit', title: { en: 'Steady Spirit', de: 'Durchhalte-Geist' }, tier: 'gold', icon: 'ph-flame',
      desc: { en: 'Reach a 7-day learning streak.', de: 'Erreiche eine 7-Tage-Lernstreak.' },
      check: function (a) { var n = a.streak.best; return { earned: n >= 7, cur: Math.min(n, 7), total: 7 }; } },
    { id: 'discipline', title: { en: 'Discipline', de: 'Disziplin' }, tier: 'gold', icon: 'ph-calendar-check',
      desc: { en: 'Reach a 30-day learning streak.', de: 'Erreiche eine 30-Tage-Lernstreak.' },
      check: function (a) { var n = a.streak.best; return { earned: n >= 30, cur: Math.min(n, 30), total: 30 }; } },
    { id: 'iron-routine', title: { en: 'Iron Routine', de: 'Eiserne Routine' }, tier: 'platinum', icon: 'ph-thermometer-simple',
      desc: { en: 'Be active today while holding a best streak of at least 14 days.', de: 'Sei heute aktiv und halte dabei eine Best-Streak von mindestens 14 Tagen.' },
      check: function (a) {
        var st = a.streak;
        return { earned: !!st.activeToday && st.best >= 14, cur: Math.min(st.best, 14), total: 14 };
      } }
  ];

  function byId(id) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
    return null;
  }

  // ── evaluate ───────────────────────────────────────────────────────────
  // One aggregate pass over the lessons, then each badge check is an O(1)
  // read over that aggregate. Returns the aggregates too so consumers
  // (summary, tests) don't have to recompute.
  function evaluate(state, ctx) {
    var agg = computeAggregates(state, ctx);
    var details = {};
    var earned = [];
    for (var i = 0; i < CATALOG.length; i++) {
      var b = CATALOG[i];
      var r = b.check(agg) || { earned: false, cur: 0, total: 1 };
      if (typeof r.earned !== 'boolean') r.earned = !!r.earned;
      if (typeof r.cur !== 'number') r.cur = Number(r.cur) || 0;
      if (typeof r.total !== 'number' || !r.total) r.total = 1;
      details[b.id] = r;
      if (r.earned) earned.push(b.id);
    }
    return { earned: earned, details: details, aggregates: agg };
  }

  // ── rendering (returns HTML strings; no DOM mutation here) ─────────────
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function tierLabel(t) { return (TIERS[t] && pick(TIERS[t].label)) || t; }

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
    // Tier label rendered as an LHG Badge pill (subtle tint + tone color).
    // The tone class maps to the Badge.jsx tone palette; badges.css paints it.
    var pill = '<span class="aifs-badge__tier aifs-pill aifs-pill--' + tier.tone + '">' +
      escapeHTML(tierLabel(badge.tier)) + '</span>';
    return '' +
      '<button type="button" class="aifs-badge ' + stateCls + ' aifs-badge--' + badge.tier + '" data-badge-id="' + escapeHTML(badge.id) + '" aria-label="' + escapeHTML(pick(badge.title)) + ' — ' + escapeHTML(pick(badge.desc)) + '">' +
        '<div class="aifs-badge__disc" style="--tier-ring:' + tier.ring + ';--tier-glow:' + tier.glow + '">' +
          '<i class="' + iconCls + '" aria-hidden="true"></i>' + lock +
        '</div>' +
        '<div class="aifs-badge__title">' + escapeHTML(pick(badge.title)) + '</div>' +
        pill +
        progress +
      '</button>';
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

  function renderStreakHTML(streak) {
    var st = streak || { current: 0, best: 0, activeToday: false };
    var flame = st.current > 0 ? ' aifs-streak--active' : '';
    var today = st.activeToday ? pick(STR.activeToday) : pick(STR.notActiveToday);
    return '<div class="aifs-streak' + flame + '">' +
      '<div class="aifs-streak__icon"><i class="ph-light ph-fire" aria-hidden="true"></i></div>' +
      '<div class="aifs-streak__body">' +
        '<div class="aifs-streak__current"><strong>' + st.current + '</strong> ' + pick(STR.daysInARow) + '</div>' +
        '<div class="aifs-streak__best">' + pick(STR.bestStreak) + ': ' + st.best + ' · ' + today + '</div>' +
      '</div></div>';
  }

  function renderSummaryHTML(evalResult, extra) {
    evalResult = evalResult || { earned: [], details: {} };
    extra = extra || {};
    var got = evalResult.earned.length;
    var total = CATALOG.length;
    var pct = Math.round((got / total) * 100);
    var lessons = (typeof extra.completed === 'number') ? extra.completed : null;
    var html = '<div class="aifs-badges-summary">' +
      '<div class="aifs-badges-summary__count"><strong>' + got + '</strong> / ' + total + ' ' + pick(STR.badgesLabel) + '</div>' +
      '<div class="aifs-badges-summary__bar"><div class="aifs-badges-summary__fill" style="width:' + pct + '%"></div></div>';
    if (lessons !== null) html += '<div class="aifs-badges-summary__lessons">' + lessons + ' ' + pick(STR.lessonsCompleted) + '</div>';
    if (extra.streak) html += renderStreakHTML(extra.streak);
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
    var s = (window.AIFSProgress && typeof window.AIFSProgress.getState === 'function')
      ? window.AIFSProgress.getState() : { lessons: {}, streak: { days: [], current: 0, best: 0, lastDay: '' } };
    if (!s.streak) s.streak = { days: [], current: 0, best: 0, lastDay: '' };
    return s;
  }

  function currentCtx() { return { phases: getPhases(), now: Date.now() }; }

  function renderMountTargets(res) {
    if (typeof document === 'undefined') return;
    var grid = document.querySelector('[data-aifs-badges-grid]');
    if (grid) grid.innerHTML = renderGridHTML(res);
    var sum = document.querySelector('[data-aifs-badges-summary]');
    if (sum) {
      var completed = window.AIFSProgress ? window.AIFSProgress.totalCompleted() : 0;
      // reuse the streak evaluate() already computed; fall back to a fresh
      // compute only if a caller passed a res without aggregates.
      var st = (res && res.aggregates && res.aggregates.streak) || streakInfo(readProgressState(), currentCtx());
      sum.innerHTML = renderSummaryHTML(res, { completed: completed, streak: st });
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
          '<span class="aifs-badge-toast__eyebrow">' + escapeHTML(pick(STR.newBadgeUnlocked)) + '</span>' +
          '<span class="aifs-badge-toast__title">' + escapeHTML(pick(b.title)) + '</span>' +
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

  function showBadgeDetails(badge, detail) {
    var dialog = document.getElementById('badgeDetailDialog');
    if (!dialog) return;

    var earned = !!detail.earned;
    var tier = TIERS[badge.tier] || TIERS.bronze;
    var cur = detail.cur || 0;
    var total = detail.total || 1;
    var pct = Math.max(0, Math.min(100, Math.round((cur / total) * 100)));

    var titleEl = document.getElementById('dialogTitle');
    if (titleEl) titleEl.textContent = pick(badge.title);

    var descEl = document.getElementById('dialogDesc');
    if (descEl) descEl.textContent = pick(badge.desc);

    var tierEl = document.getElementById('dialogTier');
    if (tierEl) {
      tierEl.textContent = pick(tier.label);
      tierEl.className = 'aifs-dialog__tier aifs-pill aifs-pill--' + tier.tone;
    }

    var discEl = document.getElementById('dialogDisc');
    if (discEl) {
      discEl.style.setProperty('--tier-ring', tier.ring);
      discEl.style.setProperty('--tier-glow', tier.glow);
    }

    var iconEl = document.getElementById('dialogIcon');
    if (iconEl) {
      iconEl.className = 'ph-light ' + (badge.icon || 'ph-medal');
      iconEl.style.color = tier.ring;
    }

    var lockEl = document.getElementById('dialogLock');
    if (lockEl) {
      lockEl.style.display = earned ? 'none' : 'grid';
    }

    var progressSec = document.getElementById('dialogProgressSection');
    var progressVal = document.getElementById('dialogProgressValue');
    var progressFill = document.getElementById('dialogProgressFill');

    if (earned) {
      if (progressSec) progressSec.style.display = 'none';
    } else {
      if (progressSec) {
        progressSec.style.display = 'block';
        if (progressVal) progressVal.textContent = cur + ' / ' + total;
        if (progressFill) {
          progressFill.style.setProperty('--tier-ring', tier.ring);
          progressFill.style.width = '0%';
          void progressFill.offsetWidth; // force reflow
          progressFill.style.width = pct + '%';
        }
      }
    }

    var statusBadge = document.getElementById('dialogStatusBadge');
    if (statusBadge) {
      if (earned) {
        statusBadge.className = 'aifs-dialog__status-badge aifs-dialog__status-badge--unlocked';
        statusBadge.innerHTML = '<i class="ph-light ph-check-circle"></i> ' + escapeHTML(pick(STR.unlocked));
      } else {
        statusBadge.className = 'aifs-dialog__status-badge aifs-dialog__status-badge--locked';
        statusBadge.innerHTML = '<i class="ph-light ph-lock"></i> ' + escapeHTML(pick(STR.locked));
      }
    }

    dialog.showModal();
  }

  function initDialog() {
    if (typeof document === 'undefined') return;
    var dialog = document.getElementById('badgeDetailDialog');
    if (!dialog) return;

    var closeBtn = document.getElementById('dialogCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        dialog.close();
      });
    }

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', function (event) {
        if (event.target !== dialog) return;
        var rect = dialog.getBoundingClientRect();
        var isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        dialog.close();
      });
    }

    document.body.addEventListener('click', function (event) {
      var btn = event.target.closest('.aifs-badge');
      if (!btn) return;

      var badgeId = btn.getAttribute('data-badge-id');
      if (!badgeId) return;

      var badge = byId(badgeId);
      if (!badge) return;

      var state = readProgressState();
      var res = evaluate(state, currentCtx());
      var detail = res.details[badgeId] || { earned: false, cur: 0, total: 1 };

      showBadgeDetails(badge, detail);
    });
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
    initDialog();

    window.AIFSProgress.onChange(function () {
      var r2 = evaluate(readProgressState(), currentCtx());
      var newly = [];
      for (var j = 0; j < r2.earned.length; j++) {
        var id = r2.earned[j];
        if (!seen[id]) { seen[id] = true; newly.push(id); }
      }
      if (newly.length) {
        writeSeen(seen);
        if (!AWARDS_HIDDEN) {
          var objs = [];
          for (var k = 0; k < newly.length; k++) { var b = byId(newly[k]); if (b) objs.push(b); }
          showToast(objs);
        }
      }
      renderMountTargets(r2);
      updateNavCount(r2.earned.length);
    });
  }

  // Re-render the grid/summary/streak in the newly selected language without
  // re-registering the AIFSProgress.onChange listener (mount() would stack a
  // duplicate one). Triggered by lang.js's 'sitelang:change' event.
  function refresh() {
    if (typeof window === 'undefined' || !window.AIFSProgress) return;
    var res = evaluate(readProgressState(), currentCtx());
    renderMountTargets(res);
    updateNavCount(res.earned.length);
  }

  var api = {
    version: 1,
    CATALOG: CATALOG,
    TIERS: TIERS,
    extractPath: extractPath,
    evaluate: evaluate,
    computeAggregates: computeAggregates,
    byId: byId,
    streakInfo: streakInfo,
    renderBadgeHTML: renderBadgeHTML,
    renderGridHTML: renderGridHTML,
    renderSummaryHTML: renderSummaryHTML,
    renderStreakHTML: renderStreakHTML,
    mount: mount,
    refresh: refresh
  };

  if (typeof window !== 'undefined') window.AIFSBadges = api;

  // Auto-mount in the browser once the DOM is ready.
  if (typeof document !== 'undefined') {
    function boot() { try { mount(); } catch (e) { /* fail silently */ } }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
    document.addEventListener('sitelang:change', function () { try { refresh(); } catch (e) {} });
  }
})();
