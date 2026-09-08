// Run: node --test site/assessment-import.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { deflateSync } from 'node:zlib';
import vm from 'node:vm';

const require = createRequire(import.meta.url);

function load() {
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const sandbox = {
    window: { Blob, Response, DecompressionStream, localStorage },
    Blob, Response, DecompressionStream, Uint8Array, ArrayBuffer, Number, String, Object,
    Date, JSON, RegExp, Error, console,
  };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync('site/assessment-import.js', 'utf8'), sandbox, { filename: 'assessment-import.js' });
  return { api: sandbox.window.AIFSAssessmentImport, values, localStorage };
}

function shippedCourseContext() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync('site/lrn/data.js', 'utf8'), sandbox, { filename: 'lrn/data.js' });
  vm.runInContext(`${readFileSync('site/capabilities.js', 'utf8')}\nglobalThis.__capabilities = CAPABILITIES;`, sandbox, { filename: 'capabilities.js' });
  const evidence = require('./skills-progress-evidence.js');
  return {
    capabilities: sandbox.__capabilities,
    evidence,
    course(id) { return sandbox.window.LrnData.courses.find((item) => item.id === id); },
  };
}

function compressedPdf(operators) {
  const compressed = deflateSync(Buffer.from(operators, 'latin1'));
  return new Uint8Array(Buffer.concat([
    Buffer.from('%PDF-1.3\n/Filter /FlateDecode\nstream\n', 'latin1'), compressed,
    Buffer.from('\nendstream\n%%EOF', 'latin1'),
  ]));
}

const RESULTS = `Results by Dimension
Foundation 5.00 CREATE CREATE
Engineering Literacy 4.00 DEEPEN CREATE
Product and Process Literacy 2.00 ACQUIRE DEEPEN
Advisory and Biz Literacy 2.00 ACQUIRE DEEPEN
Leadership Strategy 2.50 ACQUIRE ACQUIRE`;

test('parses the five dimension results and infers Technology Consulting', () => {
  const { api } = load();
  const record = api.parseAssessmentText(RESULTS, '2026-09-07T12:00:00.000Z');
  assert.equal(record.profileId, 'tc');
  assert.equal(record.role, 'Technology Consulting');
  assert.deepEqual(JSON.parse(JSON.stringify(record.dimensions.Foundation)), { score: 5, currentLevel: 'Create', targetLevel: 'Create' });
  assert.deepEqual(JSON.parse(JSON.stringify(record.dimensions['Product and Process Literacy'])), { score: 2, currentLevel: 'Acquire', targetLevel: 'Deepen' });
});

test('supports a compressed text PDF without a third-party dependency', async () => {
  const { api } = load();
  const operators = RESULTS.split('\n').map((line) => `(${line}) Tj`).join('\n');
  const record = await api.parsePdfBytes(compressedPdf(operators), '2026-09-07T12:00:00.000Z');
  assert.equal(record.profileId, 'tc');
  assert.equal(record.dimensions['Leadership Strategy'].score, 2.5);
});

test('keeps mixed Tj and fragmented TJ strings in PDF operator order', async () => {
  const { api } = load();
  const operators = [
    '[(Results) -300 (by Dimension)] TJ',
    '(Foundation) Tj', '[(5.) 0 (00)] TJ', '(CREATE) Tj', '(CREATE) Tj',
    '[(Engineering) 0 ( Literacy)] TJ', '(4.00) Tj', '(DEEPEN) Tj', '(CREATE) Tj',
    '(Product and Process Literacy) Tj', '(2.00) Tj', '(ACQUIRE) Tj', '(DEEPEN) Tj',
    '(Advisory and Biz Literacy) Tj', '(2.00) Tj', '(ACQUIRE) Tj', '(DEEPEN) Tj',
    '(Leadership Strategy) Tj', '[(2.) 0 (50)] TJ', '(ACQUIRE) Tj', '(ACQUIRE) Tj',
  ].join('\n');
  const text = await api.extractPdfText(compressedPdf(operators));
  assert.match(text, /Results by Dimension\nFoundation\n5\.00\nCREATE\nCREATE/);
  const record = await api.parsePdfBytes(compressedPdf(operators), '2026-09-07T12:00:00.000Z');
  assert.equal(record.dimensions['Engineering Literacy'].score, 4);
  assert.equal(record.dimensions['Leadership Strategy'].score, 2.5);
});

test('rejects text that is not an assessment result', () => {
  const { api } = load();
  assert.throws(() => api.parseAssessmentText('A random PDF export'), /kein unterstütztes/);
});

test('rejects a result missing one required dimension', () => {
  const { api } = load();
  assert.throws(() => api.parseAssessmentText(RESULTS.replace(/\nLeadership Strategy.*/, '')), /Leadership Strategy/);
});

test('rejects an ambiguous or unknown target vector', () => {
  const { api } = load();
  const ambiguous = RESULTS.replace(/CREATE|DEEPEN|ACQUIRE/g, 'Acquire');
  assert.throws(() => api.parseAssessmentText(ambiguous), /nicht eindeutig/);
});

test('recognizes every target vector from the supplied profile mapping', () => {
  const { api } = load();
  const vectors = {
    bsc: ['Deepen', 'Deepen', 'Create', 'Create', 'Deepen'],
    tc: ['Create', 'Create', 'Deepen', 'Deepen', 'Acquire'],
    am: ['Deepen', 'Deepen', 'Acquire', 'Deepen', 'Acquire'],
    pma: ['Deepen', 'Acquire', 'Acquire', 'Deepen', 'Deepen'],
    corp: ['Deepen', 'Deepen', 'Acquire', 'Acquire', 'Deepen'],
    lead: ['Deepen', 'Acquire', 'Acquire', 'Deepen', 'Create'],
  };
  for (const [profileId, targets] of Object.entries(vectors)) {
    const text = `Results by Dimension\n${api.DIMENSIONS.map((name, index) => `${name} 3.00 Deepen ${targets[index]}`).join('\n')}`;
    assert.equal(api.parseAssessmentText(text).profileId, profileId, profileId);
  }
});

test('does not read dimension-looking training recommendations as results', () => {
  const { api } = load();
  const partial = RESULTS.replace(/\nLeadership Strategy.*/, '');
  const training = '\nLHIND Academy Trainings\nLeadership Strategy 3.00 Create Acquire';
  assert.throws(() => api.parseAssessmentText(partial + training), /Leadership Strategy/);
});

test('rejects duplicate result rows in the result table', () => {
  const { api } = load();
  const duplicate = RESULTS.replace('Foundation 5.00 CREATE CREATE', 'Foundation 5.00 CREATE CREATE\nFoundation 2.00 Acquire Deepen');
  assert.throws(() => api.parseAssessmentText(duplicate), (error) => error.code === 'AMBIGUOUS_ASSESSMENT');
});

test('validation rejects a profile id that conflicts with the PDF target levels', () => {
  const { api } = load();
  const record = api.parseAssessmentText(RESULTS);
  record.profileId = 'bsc';
  assert.throws(() => api.validateAssessment(record), /stimmt nicht/);
});

test('validation rejects coerced scores and invalid import timestamps', () => {
  const { api } = load();
  const record = api.parseAssessmentText(RESULTS);
  record.dimensions.Foundation.score = '';
  assert.throws(() => api.validateAssessment(record), (error) => error.code === 'INVALID_ASSESSMENT');
  record.dimensions.Foundation.score = 5;
  record.importedAt = '2026-09-07';
  assert.throws(() => api.validateAssessment(record), /Importzeitpunkt/);
});

test('rejects non-PDF and truncated PDF bytes with stable error codes', async () => {
  const { api } = load();
  await assert.rejects(api.parsePdfBytes(new Uint8Array([1, 2, 3])), (error) => error.code === 'UNSUPPORTED_FILE');
  const truncated = new TextEncoder().encode('%PDF-1.3\n/Filter /FlateDecode\nstream\nnot-finished');
  await assert.rejects(api.parsePdfBytes(truncated), (error) => error.code === 'PDF_TRUNCATED');
});

test('rejects encrypted and unsupported-text PDFs before attempting an import', async () => {
  const { api } = load();
  const encrypted = new TextEncoder().encode('%PDF-1.3\n/Encrypt 9 0 R\n%%EOF');
  await assert.rejects(api.parsePdfBytes(encrypted), (error) => error.code === 'PDF_ENCRYPTED');
  const noText = new TextEncoder().encode('%PDF-1.3\n%%EOF');
  await assert.rejects(api.parsePdfBytes(noText), (error) => error.code === 'UNSUPPORTED_PDF_ENCODING');
});

test('bounds the decompressed content size', async () => {
  const { api } = load();
  const compressed = deflateSync(Buffer.alloc(8 * 1024 * 1024 + 1, 65));
  const pdf = new Uint8Array(Buffer.concat([
    Buffer.from('%PDF-1.3\n/Filter /FlateDecode\nstream\n', 'latin1'), compressed,
    Buffer.from('\nendstream\n%%EOF', 'latin1'),
  ]));
  await assert.rejects(api.parsePdfBytes(pdf), (error) => error.code === 'PDF_TOO_COMPLEX');
});

test('save uses a separate assessment key and does not alter lesson progress', () => {
  const { api, localStorage, values } = load();
  localStorage.setItem('aifs:progress:v1', JSON.stringify({ lessons: { example: { completedAt: 1 } } }));
  const saved = api.save(api.parseAssessmentText(RESULTS), localStorage);
  assert.equal(saved.profileId, 'tc');
  assert.equal(JSON.parse(values.get('aifs:progress:v1')).lessons.example.completedAt, 1);
  assert.ok(values.has('aifs:external-assessment:v1'));
  assert.deepEqual(JSON.parse(JSON.stringify(api.load(localStorage))), JSON.parse(JSON.stringify(saved)));
});

test('load ignores corrupt persisted data and clear removes only the assessment', () => {
  const { api, localStorage } = load();
  localStorage.setItem(api.STORE_KEY, '{bad json');
  localStorage.setItem('aifs:progress:v1', '{"lessons":{}}');
  assert.equal(api.load(localStorage), null);
  api.clear(localStorage);
  assert.equal(localStorage.getItem(api.STORE_KEY), null);
  assert.equal(localStorage.getItem('aifs:progress:v1'), '{"lessons":{}}');
});

test('maps the existing curriculum clusters to imported assessment dimensions', () => {
  const { api } = load();
  assert.equal(api.dimensionForCluster('Advisory and Business Consulting'), 'Advisory and Biz Literacy');
  assert.equal(api.dimensionForCluster('Leadership and Strategy'), 'Leadership Strategy');
  assert.equal(api.dimensionForCluster('Unknown'), null);
});

test('uses explicit capability evidence before broad course interests', () => {
  const { api } = load();
  const context = shippedCourseContext();
  const record = api.parseAssessmentText(RESULTS);
  const placement = api.coursePlacement(context.course('LRN-02'), record, {
    profileId: 'tc', capabilities: context.capabilities, evidence: context.evidence,
  });
  assert.equal(placement.mapped, true);
  assert.equal(placement.needsLearning, false, 'Foundation Acquire is already attained');
  assert.deepEqual(JSON.parse(JSON.stringify(placement.focusLevels)), []);
  const dimensions = placement.matches.map((match) => match.dimension);
  assert.ok(dimensions.includes('Foundation'));
  assert.ok(!dimensions.includes('Product and Process Literacy'), 'the productivity interest is not treated as depth evidence');
  assert.ok(placement.matches.every((match) => match.source === 'capability-matrix'));
});

test('places shipped courses at the explicit imported gaps', () => {
  const { api } = load();
  const context = shippedCourseContext();
  const record = api.parseAssessmentText(RESULTS);
  function placement(id) {
    return api.coursePlacement(context.course(id), record, {
      profileId: 'tc', capabilities: context.capabilities, evidence: context.evidence,
    });
  }
  const engineering = placement('LRN-42');
  assert.equal(engineering.needsLearning, true);
  assert.deepEqual(JSON.parse(JSON.stringify(engineering.focusLevels)), ['Create']);
  assert.ok(engineering.matches.some((match) => match.dimension === 'Engineering Literacy' && match.levels.includes('Create')));

  const product = placement('LRN-30');
  assert.deepEqual(JSON.parse(JSON.stringify(product.focusLevels)), ['Deepen']);
  assert.ok(product.matches.some((match) => match.dimension === 'Product and Process Literacy' && match.levels.includes('Deepen')));

  const advisory = placement('LRN-33');
  assert.deepEqual(JSON.parse(JSON.stringify(advisory.focusLevels)), ['Deepen']);
  assert.ok(advisory.matches.some((match) => match.dimension === 'Advisory and Biz Literacy' && match.levels.includes('Deepen')));
});

test('does not place courses for the wrong role, attained targets, or unknown courses', () => {
  const { api } = load();
  const context = shippedCourseContext();
  const record = api.parseAssessmentText(RESULTS);
  const options = { capabilities: context.capabilities, evidence: context.evidence };
  assert.deepEqual(JSON.parse(JSON.stringify(api.coursePlacement(context.course('LRN-42'), record, { ...options, profileId: 'bsc' }))), {
    mapped: false, needsLearning: false, focusLevels: [], matches: [],
  });

  const attained = api.parseAssessmentText(RESULTS);
  Object.values(attained.dimensions).forEach((dimension) => { dimension.currentLevel = dimension.targetLevel; });
  const allAttained = api.coursePlacement(context.course('LRN-42'), attained, { ...options, profileId: 'tc' });
  assert.equal(allAttained.mapped, true);
  assert.equal(allAttained.needsLearning, false);
  assert.deepEqual(JSON.parse(JSON.stringify(allAttained.focusLevels)), []);

  assert.deepEqual(JSON.parse(JSON.stringify(api.coursePlacement({ id: 'UNKNOWN-COURSE' }, record, { ...options, profileId: 'tc' }))), {
    mapped: false, needsLearning: false, focusLevels: [], matches: [],
  });
});
