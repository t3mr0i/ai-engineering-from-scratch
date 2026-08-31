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
 *     learningPath: {
 *       academyCourse: string,
 *       profileId: string,
 *       targetLevel: "Acquire" | "Deepen" | "Create",
 *       source: "recommendation" | "choice" | "deep-link",
 *       selectedAt: number,
 *       updatedAt: number
 *     } | null,
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
  var PATH_STORAGE_KEY = 'aifs:learning-path:v1';
  var listeners = [];

  function emptyState() {
    return { lessons: {}, snippets: [], streak: emptyStreak(), learningPath: null, updatedAt: 0 };
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
      if (!parsed.learningPath || typeof parsed.learningPath !== 'object' || !parsed.learningPath.academyCourse) {
        parsed.learningPath = null;
      }
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
      state.lessons[path] = { answers: {}, appliedEvidence: {}, completedAt: null, visitedAt: 0, readPct: 0 };
    }
    if (!state.lessons[path].appliedEvidence || typeof state.lessons[path].appliedEvidence !== 'object') state.lessons[path].appliedEvidence = {};
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
    var now = Date.now();
    var previous = lesson.answers[qid];
    var attempts = previous && Array.isArray(previous.attempts)
      ? previous.attempts.slice(-19)
      : previous && typeof previous.correct === 'boolean'
        ? [{ picked: previous.picked, correct: previous.correct, t: previous.t || now }]
        : [];
    attempts.push({ picked: picked, correct: !!correct, t: now });
    lesson.answers[qid] = { picked: picked, correct: !!correct, t: now, attempts: attempts };
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

  function recordAppliedEvidence(path, evidenceId, passed) {
    if (!path || !evidenceId || !passed) return;
    var state = read();
    var lesson = ensureLesson(state, path);
    lesson.appliedEvidence[String(evidenceId).slice(0, 120)] = { passed: true, t: Date.now(), source: 'runnable-self-check' };
    touchActivity(state);
    write(state);
  }

  function unmarkLessonComplete(path) {
    if (!path) return;
    var state = read();
    if (state.lessons[path] && state.lessons[path].completedAt) {
      state.lessons[path].completedAt = null;
      write(state);
    }
  }

  // One active Academy path follows the learner across catalog, path detail,
  // and course pages. Canonical path content stays in LrnData; localStorage
  // only owns the learner's choice and the context in which it was made.
  function saveLearningPath(selection) {
    if (!selection || !selection.academyCourse) return null;
    var state = read();
    var current = readLearningPathRecord() || state.learningPath;
    var academyCourse = String(selection.academyCourse);
    var profileId = String(selection.profileId || '');
    var targetLevel = ['Acquire', 'Deepen', 'Create'].indexOf(selection.targetLevel) !== -1
      ? selection.targetLevel
      : 'Acquire';
    var source = ['recommendation', 'choice', 'deep-link'].indexOf(selection.source) !== -1
      ? selection.source
      : 'choice';

    if (current &&
        current.academyCourse === academyCourse &&
        current.profileId === profileId &&
        current.targetLevel === targetLevel &&
        current.source === source) {
      return current;
    }

    var now = Date.now();
    state.learningPath = {
      academyCourse: academyCourse,
      profileId: profileId,
      targetLevel: targetLevel,
      source: source,
      selectedAt: current && current.academyCourse === academyCourse && current.selectedAt
        ? current.selectedAt
        : now,
      updatedAt: now
    };
    try {
      localStorage.setItem(PATH_STORAGE_KEY, JSON.stringify(state.learningPath));
    } catch (e) {
      // The progress-state mirror below remains the fallback.
    }
    touchActivity(state);
    write(state);
    return state.learningPath;
  }

  function getLearningPath() {
    return readLearningPathRecord() || read().learningPath;
  }

  function readLearningPathRecord() {
    try {
      var raw = localStorage.getItem(PATH_STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && parsed.academyCourse ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function clearLearningPath() {
    var state = read();
    var hadPath = Boolean(state.learningPath || readLearningPathRecord());
    if (!hadPath) return;
    state.learningPath = null;
    try { localStorage.removeItem(PATH_STORAGE_KEY); } catch (e) {}
    write(state);
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

  // Free-text Merkzettel snippets: the learner highlights any passage in a
  // lesson and saves it. Cross-lesson and chronological, so they live as a
  // flat top-level list rather than nested under each lesson.
  function saveSnippet(path, text) {
    if (!path) return;
    text = String(text == null ? '' : text).trim();
    if (!text) return;
    var state = read();
    if (!Array.isArray(state.snippets)) state.snippets = [];
    state.snippets.push({
      id: 'snip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      path: path,
      text: text,
      savedAt: Date.now()
    });
    touchActivity(state);
    write(state);
  }

  function removeSnippet(id) {
    if (!id) return;
    var state = read();
    if (!Array.isArray(state.snippets)) return;
    var before = state.snippets.length;
    state.snippets = state.snippets.filter(function (s) { return s.id !== id; });
    if (state.snippets.length !== before) write(state);
  }

  // All saved snippets, newest first — feeds notes.html.
  function getAllSnippets() {
    var state = read();
    var out = Array.isArray(state.snippets) ? state.snippets.slice() : [];
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
    try { localStorage.removeItem(PATH_STORAGE_KEY); } catch (e) {}
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
    if (e.key !== STORAGE_KEY && e.key !== PATH_STORAGE_KEY) return;
    var state = read();
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state); } catch (_) {}
    }
  });

  // Best-effort: ask the browser not to auto-evict this origin's storage
  // under disk pressure. Guarded to run once; silently ignored where the API
  // is absent or the browser declines. Does NOT protect against the user (or
  // browser) explicitly clearing site data — nothing web-side can. The real
  // safety net is the Markdown export on notes.html.
  try {
    if (navigator.storage && typeof navigator.storage.persist === 'function') {
      navigator.storage.persist().catch(function () {});
    }
  } catch (e) { /* no-op */ }

  window.AIFSProgress = {
    getState: function () { return read(); },
    recordVisit: recordVisit,
    recordAnswer: recordAnswer,
    recordAppliedEvidence: recordAppliedEvidence,
    markLessonComplete: markLessonComplete,
    unmarkLessonComplete: unmarkLessonComplete,
    saveKeyTerms: saveKeyTerms,
    removeKeyTerms: removeKeyTerms,
    getKeyTerms: getKeyTerms,
    getAllSavedKeyTerms: getAllSavedKeyTerms,
    saveSnippet: saveSnippet,
    removeSnippet: removeSnippet,
    getAllSnippets: getAllSnippets,
    getLessonProgress: getLessonProgress,
    isLessonComplete: isLessonComplete,
    recordReadProgress: recordReadProgress,
    getReadFraction: getReadFraction,
    saveLearningPath: saveLearningPath,
    getLearningPath: getLearningPath,
    clearLearningPath: clearLearningPath,
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
