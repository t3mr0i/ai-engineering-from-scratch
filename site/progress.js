/**
 * Local-only progress tracker.
 *
 * Stores everything in the user's own browser (localStorage). No network,
 * no account, no server. Data never leaves the device.
 *
 * Schema (versioned so we can migrate later without nuking users):
 *
 *   aifs:progress:v1 = {
 *     lessons: {
 *       "<lesson-path>": {
 *         answers: { "<qid>": { picked: number, correct: boolean, t: number } },
 *         completedAt: number | null,
 *         visitedAt: number
 *       }
 *     },
 *     updatedAt: number
 *   }
 *
 * "<lesson-path>" matches the path used in lesson.html?path=... and in
 * data.js urls (e.g. "phases/00-setup-and-tooling/01-dev-environment").
 *
 * "<qid>" is "<stage>-q<index>" e.g. "pre-q0", to match the quiz renderer.
 */
(function () {
  var STORAGE_KEY = 'aifs:progress:v1';
  var listeners = [];

  function emptyState() {
    return { lessons: {}, streak: emptyStreak(), updatedAt: 0 };
  }

  // ── Streak tracking ───────────────────────────────────────────────────
  // Separate, migrateable section of the schema. activeDays are stored as
  // "YYYY-MM-DD" (local calendar day) so streak math is timezone-stable and
  // survives Daylight Saving shifts. recordActivity() is called by every
  // write path (visit / answer / read / complete) so any meaningful
  // interaction counts as a "day".
  function emptyStreak() {
    return { days: [], current: 0, best: 0, lastDay: '' };
  }

  function toDayKey(ts) {
    var d = new Date(ts);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function dayDiff(a, b) {
    // whole calendar days from a -> b (b - a). a, b are "YYYY-MM-DD".
    var da = new Date(a + 'T00:00:00');
    var db = new Date(b + 'T00:00:00');
    return Math.round((db.getTime() - da.getTime()) / 86400000);
  }

  function ensureStreak(state) {
    if (!state.streak || typeof state.streak !== 'object') state.streak = emptyStreak();
    if (!Array.isArray(state.streak.days)) state.streak.days = [];
    if (typeof state.streak.current !== 'number') state.streak.current = 0;
    if (typeof state.streak.best !== 'number') state.streak.best = 0;
    if (typeof state.streak.lastDay !== 'string') state.streak.lastDay = '';
    return state.streak;
  }

  // recordActivity(): stamp today into the streak and update counters.
  // idempotent — calling twice in the same day only counts the day once.
  function recordActivity(state, ts) {
    var streak = ensureStreak(state);
    var today = toDayKey(typeof ts === 'number' ? ts : Date.now());
    if (streak.lastDay === today) return;          // already counted today
    var days = streak.days;
    // backfill the day list (kept sorted/unique)
    if (days.indexOf(today) < 0) {
      days.push(today);
      days.sort();
    }
    // update current/best based on the gap to the previous active day
    if (streak.lastDay) {
      var gap = dayDiff(streak.lastDay, today);
      if (gap === 1) streak.current += 1;
      else if (gap > 1) streak.current = 1;        // streak broken
      else streak.current = Math.max(1, streak.current); // same/older day (clock skew)
    } else {
      streak.current = 1;
    }
    if (streak.current > streak.best) streak.best = streak.current;
    streak.lastDay = today;
  }

  function recomputeStreakFromDays(streak) {
    // Rebuild current/best from the raw days list. Used on migration so an
    // existing days[] array (without counters) still produces correct stats.
    if (!streak || !Array.isArray(streak.days) || !streak.days.length) {
      if (streak) { streak.current = 0; streak.best = 0; streak.lastDay = streak.lastDay || ''; }
      return;
    }
    var sorted = streak.days.slice().sort();
    var best = 1, cur = 1;
    for (var i = 1; i < sorted.length; i++) {
      if (dayDiff(sorted[i - 1], sorted[i]) === 1) cur += 1;
      else cur = 1;
      if (cur > best) best = cur;
    }
    streak.current = cur;
    streak.best = best;
    streak.lastDay = sorted[sorted.length - 1];
  }

  function read() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.lessons) return emptyState();
      // migrate: ensure streak section exists; if days[] present but no
      // counters (older state), rebuild them so streaks work retroactively.
      ensureStreak(parsed);
      if (parsed.streak.days && parsed.streak.days.length && (!parsed.streak.best)) {
        recomputeStreakFromDays(parsed.streak);
      }
      return parsed;
    } catch (e) {
      return emptyState();
    }
  }

  function write(state) {
    state.updatedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // quota or disabled storage; fail silently
    }
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state); } catch (_) {}
    }
  }

  // Stamp the current day as active, then persist. Called by every write
  // path below so any interaction feeds the streak counter.
  function touchActivity(state) {
    try { recordActivity(state); } catch (e) { /* never let streak errors block a write */ }
  }

  function ensureLesson(state, path) {
    if (!state.lessons[path]) {
      state.lessons[path] = { answers: {}, completedAt: null, visitedAt: 0, readPct: 0 };
    }
    return state.lessons[path];
  }

  // Reading progress: the deepest scroll fraction (0..1) the user has reached in
  // a lesson, recorded automatically while scrolling. Only ever grows (max), so
  // scrolling back up never lowers it. 90% scroll counts as fully read.
  var READ_FULL_THRESHOLD = 0.9;

  function recordReadProgress(path, fraction) {
    if (!path) return;
    var pct = Math.max(0, Math.min(1, Number(fraction) || 0));
    if (pct >= READ_FULL_THRESHOLD) pct = 1;
    var state = read();
    var lesson = ensureLesson(state, path);
    var prev = lesson.readPct || 0;
    if (pct <= prev) return; // never lower the high-water mark
    lesson.readPct = pct;
    touchActivity(state);
    write(state);
  }

  // Effective completion fraction (0..1) for one lesson: a completed lesson
  // always counts fully; otherwise the recorded reading depth. This is what the
  // course/syllabus percentages aggregate, so 50%-read contributes 0.5.
  function getReadFraction(path) {
    var lp = getLessonProgress(path);
    if (!lp) return 0;
    if (lp.completedAt) return 1;
    var pct = lp.readPct || 0;
    return pct >= READ_FULL_THRESHOLD ? 1 : pct;
  }

  function recordVisit(path) {
    if (!path) return;
    var state = read();
    var lesson = ensureLesson(state, path);
    lesson.visitedAt = Date.now();
    touchActivity(state);
    write(state);
  }

  function recordAnswer(path, qid, picked, correct) {
    if (!path || !qid) return;
    var state = read();
    var lesson = ensureLesson(state, path);
    lesson.answers[qid] = { picked: picked, correct: !!correct, t: Date.now() };
    touchActivity(state);
    write(state);
  }

  function markLessonComplete(path) {
    if (!path) return;
    var state = read();
    var lesson = ensureLesson(state, path);
    if (!lesson.completedAt) {
      lesson.completedAt = Date.now();
      touchActivity(state);
      write(state);
    }
  }

  function unmarkLessonComplete(path) {
    if (!path) return;
    var state = read();
    if (state.lessons[path] && state.lessons[path].completedAt) {
      state.lessons[path].completedAt = null;
      write(state);
    }
  }

  // "My Merkzettel": the learner explicitly saves a lesson's Key Terms table
  // (term / says / means rows) so it's browsable later without reopening the
  // lesson. Opt-in per lesson — nothing is captured just by visiting.
  function saveKeyTerms(path, terms) {
    if (!path || !Array.isArray(terms) || !terms.length) return;
    var state = read();
    var lesson = ensureLesson(state, path);
    lesson.keyTerms = terms;
    lesson.keyTermsSavedAt = Date.now();
    touchActivity(state);
    write(state);
  }

  function removeKeyTerms(path) {
    if (!path) return;
    var state = read();
    if (state.lessons[path] && state.lessons[path].keyTerms) {
      delete state.lessons[path].keyTerms;
      delete state.lessons[path].keyTermsSavedAt;
      write(state);
    }
  }

  function getKeyTerms(path) {
    var lp = getLessonProgress(path);
    return (lp && lp.keyTerms) || [];
  }

  // All saved Key Terms across every lesson, newest first — feeds notes.html.
  function getAllSavedKeyTerms() {
    var state = read();
    var out = [];
    for (var path in state.lessons) {
      var lesson = state.lessons[path];
      if (lesson.keyTerms && lesson.keyTerms.length) {
        out.push({ path: path, terms: lesson.keyTerms, savedAt: lesson.keyTermsSavedAt || 0 });
      }
    }
    out.sort(function (a, b) { return b.savedAt - a.savedAt; });
    return out;
  }

  function getLessonProgress(path) {
    if (!path) return null;
    var state = read();
    return state.lessons[path] || { answers: {}, completedAt: null, visitedAt: 0 };
  }

  function isLessonComplete(path) {
    var lp = getLessonProgress(path);
    return !!(lp && lp.completedAt);
  }

  /**
   * Given a list of lesson urls (full GitHub urls from data.js), count how
   * many the user has completed. Match by the trailing "phases/.../..." path.
   */
  function countCompletedFromUrls(urls) {
    var state = read();
    var n = 0;
    for (var i = 0; i < urls.length; i++) {
      var path = extractPath(urls[i]);
      if (path && state.lessons[path] && state.lessons[path].completedAt) n++;
    }
    return n;
  }

  function extractPath(url) {
    if (!url) return '';
    var m = String(url).match(/(phases\/[^/]+\/[^/]+)\/?/);
    return m ? m[1] : '';
  }

  function totalCompleted() {
    var state = read();
    var n = 0;
    for (var k in state.lessons) {
      if (state.lessons[k].completedAt) n++;
    }
    return n;
  }

  function getStreak() {
    var state = read();
    return ensureStreak(state);
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](emptyState()); } catch (_) {}
    }
  }

  function onChange(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  // Cross-tab sync: if user clears or updates progress in another tab,
  // refresh listeners here too.
  window.addEventListener('storage', function (e) {
    if (e.key !== STORAGE_KEY) return;
    var state = read();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state); } catch (_) {}
    }
  });

  window.AIFSProgress = {
    getState: function () { return read(); },
    recordVisit: recordVisit,
    recordAnswer: recordAnswer,
    markLessonComplete: markLessonComplete,
    unmarkLessonComplete: unmarkLessonComplete,
    saveKeyTerms: saveKeyTerms,
    removeKeyTerms: removeKeyTerms,
    getKeyTerms: getKeyTerms,
    getAllSavedKeyTerms: getAllSavedKeyTerms,
    getLessonProgress: getLessonProgress,
    isLessonComplete: isLessonComplete,
    recordReadProgress: recordReadProgress,
    getReadFraction: getReadFraction,
    countCompletedFromUrls: countCompletedFromUrls,
    extractPath: extractPath,
    totalCompleted: totalCompleted,
    getStreak: getStreak,
    // exposed for tests / badges.js (pure helpers, no localStorage needed)
    toDayKey: toDayKey,
    dayDiff: dayDiff,
    reset: reset,
    onChange: onChange,
  };
})();
