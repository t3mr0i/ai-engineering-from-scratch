/**
 * Gated lesson-content server.
 *
 * Replaces static `site/phases/**` (which is no longer shipped — see
 * .github/workflows/azure-static-web-apps.yml and .gitignore). Every lesson
 * doc, quiz, code sample, and asset is served through here instead, so a
 * request with no valid `ase_gate` cookie gets a 401 with no body — never
 * the file. Uses the exact same cookie validation as /api/check
 * (api/lib/gate-auth.js) so the two can't drift.
 *
 * The requested file is bundled with the function at deploy time under
 * ./_data (staged from phases/ — see the workflow and serve.sh), mirroring
 * the docs/en.md, docs/de.md + quiz.json + code/main.py + assets/*
 * selection the site has always used.
 */

const fs = require('fs');
const path = require('path');
const { COOKIE_NAME, readCookie, isValidToken } = require('../lib/gate-auth');

const DATA_DIR = path.resolve(__dirname, '_data');

// Every path this endpoint will ever serve has exactly one of these four
// shapes. <phase>, <lesson>, and <filename> are restricted to a conservative
// character class (letters, digits, dot, dash, underscore) with no slashes
// inside a segment — that alone rules out extra path segments, wrong
// extensions, and (because the pattern requires a literal "phases/" prefix
// with no leading slash) absolute paths.
const SEGMENT = '[A-Za-z0-9._-]+';
const PATTERNS = [
  { re: new RegExp('^phases/(' + SEGMENT + ')/(' + SEGMENT + ')/docs/(?:en|de)\\.md$'), type: 'text/markdown' },
  { re: new RegExp('^phases/(' + SEGMENT + ')/(' + SEGMENT + ')/quiz\\.json$'), type: 'application/json' },
  { re: new RegExp('^phases/(' + SEGMENT + ')/(' + SEGMENT + ')/code/main\\.py$'), type: 'text/x-python' },
  { re: new RegExp('^phases/(' + SEGMENT + ')/(' + SEGMENT + ')/assets/(' + SEGMENT + ')$'), type: 'image/svg+xml' },
];

/**
 * Two independent layers are used here, and BOTH are required:
 *
 * 1. The regex allowlist above. It is not sufficient on its own: the
 *    character class legally includes ".", so a segment can consist of
 *    exactly ".." (two allowed characters in a row) and still match the
 *    pattern — the regex has no idea that ".." is a filesystem special case.
 *
 * 2. path.resolve() the candidate against DATA_DIR and confirm the result
 *    is still inside it. This is also not sufficient on its own: taken
 *    alone it would happily serve *any* file under _data/ (or, if DATA_DIR
 *    itself ever moved, anything reachable via enough "../"), which is a far
 *    bigger surface than "one of the four lesson-content shapes we intend to
 *    expose". It's the regex that keeps the endpoint scoped to lesson
 *    content at all.
 *
 * Together: the regex defines *what* may be requested, the resolve check
 * confirms *where* it actually points on disk. The explicit substring/prefix
 * checks below (null byte, backslash, "..", leading "/") are redundant with
 * what the regex already excludes, but are kept as cheap, obviously-correct
 * guards that don't depend on the regex being right.
 */
function validatePath(rawPath) {
  if (typeof rawPath !== 'string' || rawPath.length === 0) return null;
  if (rawPath.indexOf('\0') !== -1) return null;
  if (rawPath.indexOf('\\') !== -1) return null;
  if (rawPath.indexOf('..') !== -1) return null;
  if (rawPath.charAt(0) === '/') return null;

  let type = null;
  for (let i = 0; i < PATTERNS.length; i++) {
    if (PATTERNS[i].re.test(rawPath)) { type = PATTERNS[i].type; break; }
  }
  if (!type) return null;

  const abs = path.resolve(DATA_DIR, rawPath);
  const prefix = DATA_DIR + path.sep;
  if (abs !== DATA_DIR && abs.indexOf(prefix) !== 0) return null;

  return { absPath: abs, type: type };
}

module.exports = async function (context, req) {
  const secret = process.env.GATE_SECRET;
  const token = readCookie(req.headers && req.headers.cookie, COOKIE_NAME);
  const authorized = Boolean(secret) && isValidToken(token, secret);

  if (!authorized) {
    // No body — never leak file contents (or even confirm the path shape
    // was valid) on the unauthorized path.
    context.res = { status: 401 };
    return;
  }

  const rawPath = req.query && req.query.path;
  const validated = validatePath(rawPath);
  if (!validated) {
    context.res = { status: 400 };
    return;
  }

  let data;
  try {
    data = fs.readFileSync(validated.absPath);
  } catch (err) {
    context.res = { status: 404 };
    return;
  }

  context.res = {
    status: 200,
    headers: {
      'Content-Type': validated.type,
      'Cache-Control': 'private, max-age=300',
    },
    body: data,
    isRaw: true,
  };
};

module.exports.validatePath = validatePath;
