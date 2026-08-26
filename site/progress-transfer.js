/**
 * Export/import the learner's local progress as a single copyable code.
 *
 * Bundles the localStorage keys that make up "my progress" (lessons,
 * streak, notes, cockpit selection, seen badges) into one versioned JSON
 * envelope, then UTF-8-safe base64-encodes it behind a fixed "AIFS1:"
 * prefix so a garbled paste fails with a clear error instead of a cryptic
 * JSON.parse crash. Purely client-side, like progress.js itself — no
 * server round-trip, no account.
 *
 * `aifs:anon-id:v1` (site/lrn/report-sync.js's anonymous telemetry id) is
 * deliberately excluded: importing it on another device would misattribute
 * that device's future reports to the exporting device.
 */
(function () {
  'use strict';

  var PREFIX = 'AIFS1:';
  var PROGRESS_KEY = 'aifs:progress:v1';
  var LEARNING_PATH_KEY = 'aifs:learning-path:v1';
  var COCKPIT_KEY = 'lhind:lrn-cockpit:v3';
  var BADGES_KEY = 'aifs:badges:v1';

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function encodeUtf8Base64(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function decodeUtf8Base64(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function buildBundle() {
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      progress: readJson(PROGRESS_KEY),
      cockpit: readJson(COCKPIT_KEY),
      badges: readJson(BADGES_KEY),
    };
  }

  function exportCode() {
    return PREFIX + encodeUtf8Base64(JSON.stringify(buildBundle()));
  }

  function parseCode(code) {
    code = String(code == null ? '' : code).trim();
    if (code.indexOf(PREFIX) !== 0) {
      throw new Error('Das ist kein gültiger Export-Code (Präfix fehlt).');
    }
    var bundle;
    try {
      bundle = JSON.parse(decodeUtf8Base64(code.slice(PREFIX.length)));
    } catch (e) {
      throw new Error('Der Export-Code ist beschädigt oder unvollständig.');
    }
    if (!bundle || typeof bundle !== 'object' || bundle.schemaVersion !== 1) {
      throw new Error('Der Export-Code stammt aus einer nicht unterstützten Version.');
    }
    return bundle;
  }

  // Writes a parsed bundle's localStorage keys, overwriting the current
  // device's progress. Separated from importCode() so tests can exercise
  // the actual write without going through window.confirm.
  function applyBundle(bundle) {
    if (bundle.progress) localStorage.setItem(PROGRESS_KEY, JSON.stringify(bundle.progress));
    if (bundle.progress && bundle.progress.learningPath) {
      localStorage.setItem(LEARNING_PATH_KEY, JSON.stringify(bundle.progress.learningPath));
    } else {
      localStorage.removeItem(LEARNING_PATH_KEY);
    }
    if (bundle.cockpit) localStorage.setItem(COCKPIT_KEY, JSON.stringify(bundle.cockpit));
    if (bundle.badges) localStorage.setItem(BADGES_KEY, JSON.stringify(bundle.badges));
  }

  function importCode(code) {
    var bundle = parseCode(code);
    applyBundle(bundle);
    return bundle;
  }

  window.AIFSProgressTransfer = {
    exportCode: exportCode,
    parseCode: parseCode,
    applyBundle: applyBundle,
    importCode: importCode,
  };
})();
