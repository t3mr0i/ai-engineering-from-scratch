/* Personal learning activity, derived without changing assessment or progress. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LrnLearningHistory = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function build(options) {
    var state = options.state || {}, rows = state.lessons || {};
    var courses = [], evidence = [], titles = {};
    Object.entries(options.courseMaps || {}).forEach(function (entry) {
      var id = entry[0], definitions = entry[1].flatMap(function (unit) { return unit.lessons || []; });
      var paths = Array.from(new Set(definitions.map(function (lesson) { return lesson.path; }).filter(Boolean)));
      definitions.forEach(function (lesson) { titles[lesson.path] = lesson.title || lesson.path; });
      if (!paths.length) return;
      var completed = 0, activityAt = 0, touched = false, fraction = 0;
      paths.forEach(function (path) {
        var row = rows[path] || {}, checks = Object.values(row.appliedEvidence || {}), answers = Object.values(row.answers || {});
        if (row.completedAt) completed++;
        if (row.completedAt || row.visitedAt || row.readPct || checks.length || answers.length) touched = true;
        activityAt = Math.max(activityAt, row.visitedAt || 0, row.completedAt || 0,
          ...checks.concat(answers).map(function (check) { return Number(check.t) || 0; }));
        var read = options.readFraction ? options.readFraction(path) : (row.completedAt ? 1 : Number(row.readPct) || 0);
        fraction += Math.max(0, Math.min(1, Number(read) || 0));
      });
      if (!touched) return;
      var course = (options.courses || []).find(function (course) { return course.id === id; });
      courses.push({ id: id, title: course ? course.title : id, completed: completed === paths.length,
        completedLessons: completed, totalLessons: paths.length, percent: Math.round(100 * fraction / paths.length), activityAt: activityAt });
    });
    Object.entries(rows).forEach(function (entry) {
      var path = entry[0], row = entry[1];
      Object.entries(row.appliedEvidence || {}).forEach(function (check) {
        if (check[1].passed !== true) return;
        evidence.push({ path: path, title: titles[path] || path.split('/').pop(), id: check[0], at: Number(check[1].t) || 0 });
      });
    });
    courses.sort(function (a, b) { return b.activityAt - a.activityAt || a.title.localeCompare(b.title); });
    evidence.sort(function (a, b) { return b.at - a.at; });
    return { started: courses.filter(function (course) { return !course.completed; }),
      completed: courses.filter(function (course) { return course.completed; }), evidence: evidence,
      completedLessons: Object.values(rows).filter(function (row) { return !!row.completedAt; }).length };
  }
  return { build: build };
});
