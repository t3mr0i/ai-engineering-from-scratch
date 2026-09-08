/*
 * Parse the LHIND self-assessment PDF entirely in the browser.
 * The imported result is deliberately stored apart from lesson progress:
 * it describes a starting point and must never mark a course as completed.
 */
(function (root) {
  'use strict';

  var STORE_KEY = 'aifs:external-assessment:v1';
  var SCHEMA_VERSION = 1;
  var MAX_PDF_BYTES = 10 * 1024 * 1024;
  var MAX_DECOMPRESSED_BYTES = 8 * 1024 * 1024;
  var MAX_STREAMS = 20;
  var LEVELS = ['Acquire', 'Deepen', 'Create'];
  var DIMENSIONS = [
    'Foundation',
    'Engineering Literacy',
    'Product and Process Literacy',
    'Advisory and Biz Literacy',
    'Leadership Strategy'
  ];
  // AssessmentTargetMapping.csv supplied 2026-09-08. CF/L use the catalog's
  // corp/lead identifiers. These are role targets, never attained levels.
  var PROFILES = [
    { id: 'bsc', label: 'Business & Strategy Consulting', targets: ['Deepen', 'Deepen', 'Create', 'Create', 'Deepen'] },
    { id: 'tc', label: 'Technology Consulting', targets: ['Create', 'Create', 'Deepen', 'Deepen', 'Acquire'] },
    { id: 'am', label: 'Application Management', targets: ['Deepen', 'Deepen', 'Acquire', 'Deepen', 'Acquire'] },
    { id: 'pma', label: 'Project Management & Agility', targets: ['Deepen', 'Acquire', 'Acquire', 'Deepen', 'Deepen'] },
    { id: 'corp', label: 'Corporate Functions', targets: ['Deepen', 'Deepen', 'Acquire', 'Acquire', 'Deepen'] },
    { id: 'lead', label: 'Leadership', targets: ['Deepen', 'Acquire', 'Acquire', 'Deepen', 'Create'] }
  ];

  function fail(message, code) {
    var error = new Error(message);
    error.code = code || 'INVALID_ASSESSMENT';
    throw error;
  }
  function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function level(value) {
    var normalized = String(value || '').trim().toLowerCase();
    var match = LEVELS.filter(function (candidate) { return candidate.toLowerCase() === normalized; })[0];
    return match || null;
  }
  function asBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    fail('Die PDF-Daten konnten nicht gelesen werden.', 'UNSUPPORTED_FILE');
  }
  function latin1(bytes) {
    var result = '';
    var chunk = 0x8000;
    for (var start = 0; start < bytes.length; start += chunk) {
      result += String.fromCharCode.apply(null, bytes.subarray(start, Math.min(start + chunk, bytes.length)));
    }
    return result;
  }
  function decodePdfString(value) {
    return value.replace(/\\([0-7]{1,3}|[nrtbf()\\])/g, function (_, escaped) {
      if (/^[0-7]/.test(escaped)) return String.fromCharCode(parseInt(escaped, 8));
      return { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }[escaped] || escaped;
    });
  }
  function textOperators(content) {
    var parts = [];
    // Preserve PDF operator order. A prior two-pass implementation collected
    // all `Tj` strings before all `TJ` arrays, which could scramble a table
    // when a producer mixed the two forms.
    var matcher = /\((?:\\.|[^\\)])*\)\s*Tj\b|\[(?:\\.|[^\]])*\]\s*TJ\b/g;
    var match;
    while ((match = matcher.exec(content))) {
      var operator = match[0];
      if (/\)\s*Tj\b$/.test(operator)) {
        parts.push(decodePdfString(operator.replace(/\)\s*Tj\b$/, '').slice(1)));
        continue;
      }
      var array = operator.replace(/\]\s*TJ\b$/, '').slice(1);
      var fragments = [];
      var fragmentMatcher = /\((?:\\.|[^\\)])*\)|(-?\d+(?:\.\d+)?)/g;
      var fragment;
      var pendingSpace = false;
      while ((fragment = fragmentMatcher.exec(array))) {
        if (fragment[1] != null) {
          // A sufficiently negative TJ adjustment advances the cursor and is
          // commonly used by generated PDFs in place of a literal space.
          if (Number(fragment[1]) <= -250) pendingSpace = true;
          continue;
        }
        var text = decodePdfString(fragment[0].slice(1, -1));
        var previous = fragments.length ? fragments[fragments.length - 1] : '';
        if (pendingSpace && previous && text && !/\s$/.test(previous) && !/^\s/.test(text)) fragments.push(' ');
        fragments.push(text);
        pendingSpace = false;
      }
      parts.push(fragments.join(''));
    }
    return parts.join('\n');
  }
  async function inflate(bytes, outputLimit) {
    if (typeof root.DecompressionStream !== 'function' || typeof root.Blob !== 'function') {
      fail('Dieser Browser unterstützt das Auslesen komprimierter PDFs noch nicht.', 'UNSUPPORTED_PDF_ENCODING');
    }
    try {
      var stream = new root.Blob([bytes]).stream().pipeThrough(new root.DecompressionStream('deflate'));
      var reader = stream.getReader();
      var chunks = [];
      var total = 0;
      while (true) {
        var next = await reader.read();
        if (next.done) break;
        total += next.value.byteLength;
        if (total > outputLimit) {
          try { await reader.cancel(); } catch (ignored) {}
          fail('Die PDF enthält zu viele unkomprimierte Daten.', 'PDF_TOO_COMPLEX');
        }
        chunks.push(next.value);
      }
      var output = new Uint8Array(total);
      var offset = 0;
      chunks.forEach(function (chunk) { output.set(chunk, offset); offset += chunk.byteLength; });
      return output;
    } catch (error) {
      if (error && error.code) throw error;
      fail('Die PDF enthält keinen lesbaren Textinhalt.', 'UNSUPPORTED_PDF_ENCODING');
    }
  }
  async function extractPdfText(input) {
    var bytes = asBytes(input);
    if (bytes.length > MAX_PDF_BYTES) fail('Die PDF ist zu groß (maximal 10 MB).', 'PDF_TOO_LARGE');
    if (latin1(bytes.subarray(0, 8)).indexOf('%PDF-') !== 0) fail('Bitte eine PDF-Datei hochladen.', 'UNSUPPORTED_FILE');
    var raw = latin1(bytes);
    if (/\/Encrypt\b/.test(raw)) fail('Verschlüsselte PDFs können nicht importiert werden.', 'PDF_ENCRYPTED');
    var texts = [];
    var decompressedTotal = 0;
    var marker = /\/Filter\s*\/FlateDecode[\s\S]{0,800}?stream\r?\n/g;
    var match;
    while ((match = marker.exec(raw))) {
      if (texts.length >= MAX_STREAMS) fail('Die PDF enthält zu viele Datenströme.', 'PDF_TOO_COMPLEX');
      var dictionaryStart = raw.lastIndexOf('<<', match.index);
      var dictionary = raw.slice(dictionaryStart === -1 ? match.index : dictionaryStart, match.index);
      // Image data can use the same compression but cannot contain the PDF text
      // operators we support; skipping it avoids needlessly inflating it.
      if (/\/Subtype\s*\/Image\b/.test(dictionary)) continue;
      var start = marker.lastIndex;
      var end = raw.indexOf('endstream', start);
      if (end === -1) fail('Die PDF ist unvollständig.', 'PDF_TRUNCATED');
      var streamBytes = bytes.slice(start, end);
      if (streamBytes.length && streamBytes[streamBytes.length - 1] === 10) streamBytes = streamBytes.slice(0, -1);
      if (streamBytes.length && streamBytes[streamBytes.length - 1] === 13) streamBytes = streamBytes.slice(0, -1);
      var inflated = await inflate(streamBytes, MAX_DECOMPRESSED_BYTES - decompressedTotal);
      decompressedTotal += inflated.byteLength;
      texts.push(textOperators(latin1(inflated)));
      marker.lastIndex = end + 'endstream'.length;
    }
    // A small number of text-only PDFs have an uncompressed content stream.
    if (!texts.length) {
      var plain = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      while ((match = plain.exec(raw))) texts.push(textOperators(match[1]));
    }
    var text = texts.join('\n');
    if (!text.trim()) fail('Die PDF verwendet eine nicht unterstützte Textkodierung oder enthält keine auswertbaren Ergebnisse.', 'UNSUPPORTED_PDF_ENCODING');
    return text;
  }
  function dimensionsFromText(text) {
    text = String(text || '').replace(/\u00a0/g, ' ').replace(/\r/g, '\n');
    var heading = /Results\s+by\s+Dimension/i.exec(text);
    if (!heading) fail('Dies ist kein unterstütztes Self-Assessment-Ergebnis.', 'UNSUPPORTED_ASSESSMENT');
    var afterHeading = text.slice(heading.index + heading[0].length);
    var endMarker = /(?:LHIND\s+Academy\s+Trainings|Training\s+Recommendations)/i.exec(afterHeading);
    var resultSection = endMarker ? afterHeading.slice(0, endMarker.index) : afterHeading;
    var result = {};
    DIMENSIONS.forEach(function (name) {
      var rows = Array.from(resultSection.matchAll(new RegExp(escapeRegExp(name) + '\\s+([0-5](?:[.,]\\d{1,2})?)\\s+(Acquire|Deepen|Create)\\s+(Acquire|Deepen|Create)', 'ig')));
      if (!rows.length) fail('Die Ergebniszeile für „' + name + '“ fehlt oder ist ungültig.', 'INVALID_ASSESSMENT');
      if (rows.length > 1) fail('Die Ergebniszeile für „' + name + '“ ist mehrdeutig.', 'AMBIGUOUS_ASSESSMENT');
      var row = rows[0];
      result[name] = { score: Number(row[1].replace(',', '.')), currentLevel: level(row[2]), targetLevel: level(row[3]) };
    });
    return result;
  }
  function inferProfile(dimensions) {
    var matches = PROFILES.filter(function (profile) {
      return DIMENSIONS.every(function (name, index) { return dimensions[name].targetLevel === profile.targets[index]; });
    });
    if (matches.length !== 1) fail('Das Zielprofil kann aus diesem Assessment nicht eindeutig bestimmt werden.', 'AMBIGUOUS_PROFILE');
    return matches[0];
  }
  function validateAssessment(value) {
    if (!value || typeof value !== 'object' || value.schemaVersion !== SCHEMA_VERSION) fail('Das importierte Assessment hat ein nicht unterstütztes Format.', 'INVALID_ASSESSMENT');
    if (!value.dimensions || typeof value.dimensions !== 'object') fail('Die Assessment-Dimensionen fehlen.', 'INVALID_ASSESSMENT');
    var dimensions = {};
    DIMENSIONS.forEach(function (name) {
      var entry = value.dimensions[name];
      if (!entry || typeof entry !== 'object') fail('Die Dimension „' + name + '“ fehlt.', 'INVALID_ASSESSMENT');
      var score = entry.score;
      var current = level(entry.currentLevel);
      var target = level(entry.targetLevel);
      if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 5 || !current || !target) fail('Die Dimension „' + name + '“ ist ungültig.', 'INVALID_ASSESSMENT');
      dimensions[name] = { score: score, currentLevel: current, targetLevel: target };
    });
    if (Object.keys(value.dimensions).some(function (key) { return DIMENSIONS.indexOf(key) === -1; })) fail('Das Assessment enthält unbekannte Dimensionen.', 'INVALID_ASSESSMENT');
    var profile = inferProfile(dimensions);
    if (value.profileId !== profile.id) fail('Das gespeicherte Profil stimmt nicht mit den Zielwerten überein.', 'INVALID_ASSESSMENT');
    if (typeof value.importedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.importedAt) || Number.isNaN(Date.parse(value.importedAt))) {
      fail('Der Importzeitpunkt ist ungültig.', 'INVALID_ASSESSMENT');
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      source: 'external-pdf',
      importedAt: value.importedAt,
      profileId: profile.id,
      role: profile.label,
      dimensions: dimensions
    };
  }
  function parseAssessmentText(text, importedAt) {
    var dimensions = dimensionsFromText(text);
    var profile = inferProfile(dimensions);
    return validateAssessment({ schemaVersion: SCHEMA_VERSION, source: 'external-pdf', importedAt: importedAt || new Date().toISOString(), profileId: profile.id, dimensions: dimensions });
  }
  async function parsePdfBytes(bytes, importedAt) { return parseAssessmentText(await extractPdfText(bytes), importedAt); }
  function storageOrDefault(storage) { return storage || root.localStorage; }
  function save(record, storage) {
    var validated = validateAssessment(record);
    storageOrDefault(storage).setItem(STORE_KEY, JSON.stringify(validated));
    return validated;
  }
  function load(storage) {
    try {
      var raw = storageOrDefault(storage).getItem(STORE_KEY);
      return raw ? validateAssessment(JSON.parse(raw)) : null;
    } catch (error) { return null; }
  }
  function clear(storage) { storageOrDefault(storage).removeItem(STORE_KEY); }
  function dimensionForCluster(cluster) {
    var normalized = String(cluster || '').toLowerCase();
    if (/foundation/.test(normalized)) return 'Foundation';
    if (/engineering/.test(normalized)) return 'Engineering Literacy';
    if (/product|process/.test(normalized)) return 'Product and Process Literacy';
    if (/advisory|business consulting/.test(normalized)) return 'Advisory and Biz Literacy';
    if (/leadership|strategy/.test(normalized)) return 'Leadership Strategy';
    return null;
  }

  // Reuse the curated capability/course matrix for placement. A course's
  // broad audience tags are not evidence that it teaches every depth.
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
        if (!dimension) return;
        stagesByDimension[dimension] = (stagesByDimension[dimension] || []).concat(stages);
      });
    });
    if (!explicitlyMapped) {
      var interests = course.interests || [];
      var hints = {
        'Foundation': ['foundation', 'governance'],
        'Engineering Literacy': ['engineering'],
        'Product and Process Literacy': ['productivity'],
        'Advisory and Biz Literacy': ['consulting'],
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
      var depths = LEVELS.filter(function (stage, rank) {
        return rank > current && rank <= target && stagesByDimension[dimension].indexOf(stage) >= 0;
      });
      matches.push({ dimension: dimension, currentLevel: baseline.currentLevel, targetLevel: baseline.targetLevel,
        levels: depths, gap: Math.max(0, target - current), source: explicitlyMapped ? 'capability-matrix' : 'course-metadata' });
    });
    var focusLevels = LEVELS.filter(function (stage) { return matches.some(function (match) { return match.levels.indexOf(stage) >= 0; }); });
    return { mapped: matches.length > 0, needsLearning: focusLevels.length > 0, focusLevels: focusLevels, matches: matches };
  }

  root.AIFSAssessmentImport = {
    STORE_KEY: STORE_KEY, SCHEMA_VERSION: SCHEMA_VERSION, DIMENSIONS: DIMENSIONS.slice(), LEVELS: LEVELS.slice(),
    extractPdfText: extractPdfText, parsePdfBytes: parsePdfBytes, parseAssessmentText: parseAssessmentText,
    validateAssessment: validateAssessment, inferProfile: inferProfile, dimensionForCluster: dimensionForCluster,
    load: load, save: save, clear: clear, coursePlacement: coursePlacement
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.AIFSAssessmentImport;
})(typeof window !== 'undefined' ? window : globalThis);
