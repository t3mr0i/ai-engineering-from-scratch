/* Native LHIND self-assessment. Only role, division and results are saved;
 * individual answers are discarded. Questions live in lrn/manifests/catalog.json. */
(function (root) {
  'use strict';
  var STORE_KEY = 'aifs:native-assessment:v2';
  var LEVELS = ['Acquire', 'Deepen', 'Create'];
  var DIMENSIONS = [
    { name: 'Foundation', questionIds: ['q1', 'q2'] },
    { name: 'Engineering Literacy', questionIds: ['q3', 'q4'] },
    { name: 'Product and Process Literacy', questionIds: ['q5', 'q6'] },
    { name: 'Advisory and Biz Literacy', questionIds: ['q7', 'q8'] },
    { name: 'Leadership Strategy', questionIds: ['q9', 'q10'] }
  ];
  // AssessmentTargetMapping.csv; these are role targets, not attained levels.
  var PROFILES = [
    { id: 'bsc', label: 'Business & Strategy Consulting', targets: ['Deepen', 'Deepen', 'Create', 'Create', 'Deepen'] },
    { id: 'tc', label: 'Technology Consulting', targets: ['Create', 'Create', 'Deepen', 'Deepen', 'Acquire'] },
    { id: 'am', label: 'Application Management', targets: ['Deepen', 'Deepen', 'Acquire', 'Deepen', 'Acquire'] },
    { id: 'pma', label: 'Project Management & Agility', targets: ['Deepen', 'Acquire', 'Acquire', 'Deepen', 'Deepen'] },
    { id: 'corp', label: 'Corporate Functions', targets: ['Deepen', 'Deepen', 'Acquire', 'Acquire', 'Deepen'] },
    { id: 'lead', label: 'Leadership', targets: ['Deepen', 'Acquire', 'Acquire', 'Deepen', 'Create'] }
  ];
  // LHIND People Management organigram, verified 2026-09-23:
  // https://lufthansagroup.sharepoint.com/sites/LHIND_EP/SitePages/Organigramm.aspx
  var DIVISIONS = [
    { id: 'aviation-commerce', label: 'Aviation Commerce' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'digitalization', label: 'Digitalization' },
    { id: 'finance-controlling-legal', label: 'Finance, Controlling & Legal' },
    { id: 'markets', label: 'Markets' },
    { id: 'people-management', label: 'People Management' },
    { id: 'technology', label: 'Technology' }
  ];
  function questions() {
    if (root.LrnData && root.LrnData.questions) return root.LrnData.questions;
    if (typeof require === 'function') return require('./lrn/manifests/catalog.json').questions;
    return [];
  }
  function fail(message) { throw new RangeError(message); }
  function level(score) { return score == null ? null : score < 3 ? 'Acquire' : score < 4.3 ? 'Deepen' : 'Create'; }
  function evaluate(profileId, divisionId, answers, at) {
    var profile = PROFILES.find(function (item) { return item.id === profileId; });
    if (!profile) fail('Choose a valid role.');
    var division = DIVISIONS.find(function (item) { return item.id === divisionId; });
    if (!division) fail('Choose a valid division.');
    var authored = questions();
    if (authored.length !== 10 || authored.some(function (item, index) { return item.id !== 'q' + (index + 1); })) fail('The ten assessment questions are unavailable.');
    if (!answers || typeof answers !== 'object') fail('Answer all ten questions.');
    var normalized = {};
    authored.forEach(function (question) {
      var answer = answers[question.id];
      if (answer !== 'na' && !(Number.isInteger(answer) && answer >= 1 && answer <= 5)) fail('Answer all ten questions.');
      normalized[question.id] = answer;
    });
    var dimensions = {};
    DIMENSIONS.forEach(function (dimension, index) {
      var rated = dimension.questionIds.map(function (id) { return normalized[id]; }).filter(function (answer) { return answer !== 'na'; });
      var score = rated.length ? rated.reduce(function (sum, answer) { return sum + answer; }, 0) / rated.length : null;
      dimensions[dimension.name] = { score: score, currentLevel: level(score), targetLevel: profile.targets[index] };
    });
    var importedAt = at || new Date().toISOString();
    if (typeof importedAt !== 'string' || Number.isNaN(Date.parse(importedAt))) fail('Invalid assessment date.');
    return { schemaVersion: 3, source: 'native', importedAt: importedAt, profileId: profile.id, role: profile.label, divisionId: division.id, division: division.label, dimensions: dimensions };
  }
  function save(record, storage) {
    var result = validateAssessment(record);
    (storage || root.localStorage).setItem(STORE_KEY, JSON.stringify(result));
    return result;
  }
  function load(storage) {
    try {
      var raw = (storage || root.localStorage).getItem(STORE_KEY);
      if (!raw) return null;
      var saved = JSON.parse(raw);
      if (saved.schemaVersion !== 3 || saved.source !== 'native') return null;
      return validateAssessment(saved);
    } catch (_) { return null; }
  }
  function clear(storage) { (storage || root.localStorage).removeItem(STORE_KEY); }
  function validateAssessment(record) {
    if (!record || record.schemaVersion !== 3 || record.source !== 'native') fail('Invalid native assessment.');
    var profile = PROFILES.find(function (item) { return item.id === record.profileId; });
    var division = DIVISIONS.find(function (item) { return item.id === record.divisionId; });
    if (!profile || record.role !== profile.label || !division || record.division !== division.label || typeof record.importedAt !== 'string' || Number.isNaN(Date.parse(record.importedAt))) fail('Invalid native assessment.');
    if (!record.dimensions || Object.keys(record.dimensions).length !== DIMENSIONS.length) fail('Invalid assessment results.');
    var dimensions = {};
    DIMENSIONS.forEach(function (dimension, index) {
      var row = record.dimensions[dimension.name];
      if (!row || Object.keys(row).length !== 3 || row.targetLevel !== profile.targets[index]) fail('Invalid assessment results.');
      var score = row.score;
      if (score !== null && !(typeof score === 'number' && Number.isFinite(score) && score >= 1 && score <= 5 && score * 2 === Math.round(score * 2))) fail('Invalid assessment score.');
      if (row.currentLevel !== level(score)) fail('Assessment level does not match its score.');
      dimensions[dimension.name] = { score: score, currentLevel: row.currentLevel, targetLevel: row.targetLevel };
    });
    return { schemaVersion: 3, source: 'native', importedAt: record.importedAt, profileId: profile.id, role: profile.label, divisionId: division.id, division: division.label, dimensions: dimensions };
  }
  function dimensionForCluster(cluster) {
    var normalized = String(cluster || '').toLowerCase();
    if (/foundation/.test(normalized)) return 'Foundation';
    if (/engineering/.test(normalized)) return 'Engineering Literacy';
    if (/product|process/.test(normalized)) return 'Product and Process Literacy';
    if (/advisory|business consulting/.test(normalized)) return 'Advisory and Biz Literacy';
    if (/leadership|strategy/.test(normalized)) return 'Leadership Strategy';
    return null;
  }
  function coursePlacement(course, record, options) {
    options = options || {};
    var empty = { mapped: false, needsLearning: false, focusLevels: [], matches: [] };
    if (!course || !record || !record.dimensions || record.profileId !== options.profileId) return empty;
    var evidence = options.evidence || {};
    var capabilities = options.capabilities || [];
    var stagesByDimension = {};
    var explicitlyMapped = false;
    Object.keys(evidence).forEach(function (id) {
      var rows = evidence[id] || {};
      var stages = LEVELS.filter(function (stage) { return Array.isArray(rows[stage]) && rows[stage].indexOf(course.id) >= 0; });
      if (!stages.length) return;
      explicitlyMapped = true;
      var capability = capabilities.find(function (item) { return String(item.id) === id; });
      if (!capability) return;
      String(capability.cluster || '').split(' / ').forEach(function (cluster) {
        var dimension = dimensionForCluster(cluster);
        if (dimension) stagesByDimension[dimension] = (stagesByDimension[dimension] || []).concat(stages);
      });
    });
    if (!explicitlyMapped) {
      var interests = course.interests || [];
      var hints = {
        Foundation: ['foundation', 'governance'], 'Engineering Literacy': ['engineering'],
        'Product and Process Literacy': ['productivity'], 'Advisory and Biz Literacy': ['consulting'],
        'Leadership Strategy': ['leadership']
      };
      Object.keys(hints).forEach(function (dimension) {
        if (hints[dimension].some(function (interest) { return interests.indexOf(interest) >= 0; })) {
          stagesByDimension[dimension] = (course.levels || []).filter(function (stage) { return LEVELS.indexOf(stage) >= 0; });
        }
      });
    }
    var matches = [];
    Object.keys(stagesByDimension).forEach(function (dimension) {
      var key = Object.keys(record.dimensions).find(function (name) { return dimensionForCluster(name) === dimension; });
      var baseline = key && record.dimensions[key];
      if (!baseline) return;
      var current = LEVELS.indexOf(baseline.currentLevel);
      var target = LEVELS.indexOf(baseline.targetLevel);
      if (current < 0 || target < 0) return;
      var depths = LEVELS.filter(function (stage, rank) { return rank > current && rank <= target && stagesByDimension[dimension].indexOf(stage) >= 0; });
      matches.push({ dimension: dimension, currentLevel: baseline.currentLevel, targetLevel: baseline.targetLevel,
        levels: depths, gap: Math.max(0, target - current), source: explicitlyMapped ? 'capability-matrix' : 'course-metadata' });
    });
    var focusLevels = LEVELS.filter(function (stage) { return matches.some(function (match) { return match.levels.indexOf(stage) >= 0; }); });
    return { mapped: matches.length > 0, needsLearning: focusLevels.length > 0, focusLevels: focusLevels, matches: matches };
  }
  var api = { STORE_KEY: STORE_KEY, DIMENSIONS: DIMENSIONS, PROFILES: PROFILES, DIVISIONS: DIVISIONS, LEVELS: LEVELS,
    evaluate: evaluate, validateAssessment: validateAssessment, save: save, load: load, clear: clear, coursePlacement: coursePlacement, dimensionForCluster: dimensionForCluster };
  root.AIFSAssessment = api;
  // Existing journey adapters still use this name for the result shape.
  root.AIFSAssessmentImport = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
