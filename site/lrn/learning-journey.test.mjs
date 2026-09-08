import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const journey = require('./learning-journey.js');
const catalog = JSON.parse(readFileSync(new URL('./manifests/catalog.json', import.meta.url)));
const evidence = require('../skills-progress-evidence.js');
const curriculumContext = { window: {} };
vm.runInNewContext(readFileSync(new URL('./curriculum-map.js', import.meta.url), 'utf8'), curriculumContext);
const curriculum = curriculumContext.window.LrnCurriculumMap;
const real = { catalog, capabilityEvidence: evidence, courseMaps: curriculum.courseMaps, visibleCourseIds: curriculum.visibleCourseIds, roleId: 'tc' };

function fixture(extra = {}) {
  return {
    roleId: 'tc',
    catalog: {
      roles: [{ id: 'tc', label: 'Technology Consulting' }, { id: 'lead', label: 'Leadership' }],
      capabilities: [{ id: 1, title: 'Architecture', cluster: 'Engineering' }],
      courses: [
        { id: 'A', title: 'Foundations', roleIds: ['tc'], sequence: 1 },
        { id: 'D', title: 'Application', roleIds: ['tc'], sequence: 2 },
        { id: 'C', title: 'Create systems', roleIds: ['tc'], sequence: 3 },
        { id: 'L', title: 'Leadership only', roleIds: ['lead'], sequence: 0 }
      ],
      academyPaths: [{ academyCourse: 'AI-02', title: 'Engineering', recommendationRanks: { tc: 1 }, stages: [{ courses: ['A', 'D', 'C'] }] }]
    },
    courseMaps: { A: [{ lessons: [{ path: 'a' }] }], D: [{ lessons: [{ path: 'd' }] }], C: [{ lessons: [{ path: 'c' }] }] },
    capabilityEvidence: { 1: { Acquire: ['A'], Deepen: ['D'], Create: ['C'] } },
    ...extra
  };
}
function model(extra) { return journey.createModel(fixture(extra)); }

test('Technology Consulting uses the five HTML dimensions, not legacy assessment targets', () => {
  const m = journey.createModel(real);
  assert.deepEqual(m.dimensions.map(d => d.targetLevel), ['Create', 'Create', 'Deepen', 'Create', 'Acquire']);
  assert.equal(m.unknownCount, 5);
  assert.equal(m.provisional, true);
  assert.equal(m.next.courseId, 'LRN-01');
  assert.equal(m.targetSource, 'reference');
});

test('every reference role target matches the imported source matrix', () => {
  const source = JSON.parse(readFileSync(new URL('../../docs/ai-literacy-lhind/zielbilder.json', import.meta.url)));
  const codeToId = { BSC: 'bsc', TC: 'tc', AM: 'am', PMA: 'pma', CF: 'corp', L: 'lead', PVS: 'pvs' };
  for (const role of source.roles) {
    assert.deepEqual(Object.values(role.targets).map(row => ({ A: 1, D: 2, C: 3 }[row.target] || null)), journey.referenceTargets[codeToId[role.code]]);
  }
});

test('matching imported targets retain their provenance and disclose a different reference', () => {
  const m = journey.createModel({ ...real, assessmentImport: { profileId: 'tc', dimensions: { 'Advisory and Biz Literacy': { currentLevel: 'Acquire', targetLevel: 'Deepen' } } } });
  const advisory = m.dimensions.find(d => d.id === 'advisory');
  assert.equal(advisory.targetLevel, 'Deepen');
  assert.equal(advisory.referenceTargetLevel, 'Create');
  assert.equal(m.targetChanged, true);
  assert.equal(m.targetSource, 'assessment-import');
});

test('a different role assessment cannot change the selected role targets or baseline', () => {
  const m = model({ assessmentImport: { profileId: 'lead', dimensions: { Engineering: { currentLevel: 'Create', targetLevel: 'Acquire' } } }, assessment: { role: 'Leadership', ratings: { 1: 'Create' } } });
  assert.equal(m.dimensions[1].currentLevel, null);
  assert.equal(m.targetSource, 'reference');
  assert.equal(m.next.courseId, 'A');
});

test('PMA Engineering has no target and contributes no gap', () => {
  const m = journey.createModel({ ...real, roleId: 'pma' });
  assert.equal(m.dimensions[1].status, 'not-relevant');
  assert.equal(m.dimensions[1].targetLevel, null);
  assert.ok(!m.steps.some(step => step.matches.some(match => match.dimensionId === 'engineering')));
});

test('legacy self-assessment levels skip already acquired foundations without recording completion', () => {
  const m = model({ assessment: { role: 'Technology Consulting', ratings: { 1: 'Basic' } } });
  assert.equal(m.next.courseId, 'D');
  assert.equal(m.dimensions[1].currentLevel, 'Acquire');
  assert.equal(m.completedCourseCount, 0);
});

test('partial assessment never reports the whole target achieved', () => {
  const m = model({ assessment: { ratings: { 1: 'Create' } } });
  assert.equal(m.dimensions[1].status, 'self-assessed');
  assert.equal(m.reachedDimensionCount, 1);
  assert.equal(m.unknownCount, 4);
});

test('not-relevant ratings are not interpreted as missing foundation knowledge', () => {
  const m = model({ assessment: { ratings: { 1: 'not relevant' } } });
  assert.equal(m.dimensions[1].status, 'not-relevant');
  assert.equal(m.steps.length, 0);
});

test('an explicit None rating means no prior knowledge, not an irrelevant target', () => {
  const m = model({ assessment: { ratings: { 1: 'None' } } });
  assert.equal(m.dimensions[1].status, 'gap');
  assert.equal(m.dimensions[1].currentLevel, 'None');
  assert.equal(m.next.courseId, 'A');
  assert.equal(m.assessmentAvailable, true);
});

test('ordered prerequisites come before a saved advanced course', () => {
  const m = model({ savedPlan: { learner: { roleId: 'tc' }, steps: [{ courseId: 'C' }, { courseId: 'D' }, { courseId: 'A' }] } });
  assert.equal(m.next.courseId, 'A');
  assert.deepEqual(m.steps.map(s => s.courseId), ['A', 'D', 'C']);
  assert.equal(m.steps[1].status, 'prerequisite-open');
});

test('completion advances the next course but never the competence level', () => {
  const m = model({ progressState: { lessons: { a: { completedAt: 1 } } } });
  assert.equal(m.next.courseId, 'D');
  assert.equal(m.dimensions[1].currentLevel, null);
  assert.equal(m.dimensions[1].status, 'unknown');
});

test('reading alone never completes a course or proves a dimension', () => {
  const m = model({ progressState: { lessons: { a: { visitedAt: 1, readPct: 100 } } } });
  assert.equal(m.next.courseId, 'A');
  assert.equal(m.next.status, 'in-progress');
  assert.equal(m.completedCourseCount, 0);
  assert.equal(m.dimensions[1].currentLevel, null);
});

test('evidence requires enough quiz observations AND a passed applied check for each stage', () => {
  const insufficient = model({ mastery: { courses: [{ courseId: 'A', probability: .99, evidenceCount: 6, appliedEvidenceCount: 0 }] } });
  assert.equal(insufficient.dimensions[1].currentLevel, null);
  const observed = model({ mastery: { courses: ['A', 'D', 'C'].map(courseId => ({ courseId, probability: .9, evidenceCount: 6, appliedEvidenceCount: 1 })) } });
  assert.equal(observed.dimensions[1].status, 'evidenced');
  assert.equal(observed.dimensions[1].currentLevel, 'Create');
});

test('removed courses stay removed and their dependants remain visibly blocked', () => {
  const m = model({ savedPlan: { learner: { roleId: 'tc' }, steps: [{ courseId: 'D' }], excludedCourseIds: ['A'] } });
  assert.equal(m.next, null);
  assert.equal(m.steps[0].status, 'prerequisite-open');
});

test('role change ignores old plan order and never recommends an incompatible course', () => {
  const m = model({ savedPlan: { learner: { roleId: 'lead' }, steps: [{ courseId: 'L' }] } });
  assert.equal(m.roleChanged, true);
  assert.equal(m.next.courseId, 'A');
  assert.ok(!m.steps.some(s => s.courseId === 'L'));
});

test('a focus changes recommendations while preserving every dimensional target', () => {
  const plain = journey.createModel(real);
  const focused = journey.createModel({ ...real, focusDimensionId: 'engineering' });
  assert.equal(focused.next.dimension, 'Engineering');
  assert.deepEqual(focused.dimensions.map(d => d.targetLevel), plain.dimensions.map(d => d.targetLevel));
});

test('unavailable courses are never the next actionable step', () => {
  const m = model({ courseMaps: {} });
  assert.equal(m.next, null);
  assert.ok(m.steps.every(s => s.status === 'unavailable'));
});

test('external Academy transfer appears only with a future usable registration link', () => {
  assert.deepEqual(model().externalRecommendations, []);
  const done = model({ progressState: { lessons: { a: { completedAt: 1 }, d: { completedAt: 1 }, c: { completedAt: 1 } } } });
  assert.deepEqual(done.externalRecommendations, []);
  const bookable = model({
    progressState: { lessons: { a: { completedAt: 1 }, d: { completedAt: 1 }, c: { completedAt: 1 } } },
    now: Date.parse('2026-01-01T00:00:00Z'),
    catalog: { ...fixture().catalog, sessions: [{ courseId: 'C', start: '2026-02-01', registrationUrl: 'https://academy.example/register' }] }
  });
  assert.equal(bookable.externalRecommendations.length, 1);
  assert.equal(bookable.externalRecommendations[0].href, 'https://academy.example/register');
  assert.equal(bookable.externalRecommendations[0].bookingAvailable, true);
  const expired = model({
    progressState: { lessons: { a: { completedAt: 1 }, d: { completedAt: 1 }, c: { completedAt: 1 } } },
    now: Date.parse('2026-01-01T00:00:00Z'),
    catalog: { ...fixture().catalog, sessions: [{ courseId: 'C', end: '2025-12-31', registrationUrl: 'https://academy.example/register' }] }
  });
  assert.deepEqual(expired.externalRecommendations, []);
  const undated = model({
    progressState: { lessons: { a: { completedAt: 1 }, d: { completedAt: 1 }, c: { completedAt: 1 } } },
    now: Date.parse('2026-01-01T00:00:00Z'),
    catalog: { ...fixture().catalog, sessions: [{ courseId: 'C', registrationUrl: 'https://academy.example/register' }] }
  });
  assert.deepEqual(undated.externalRecommendations, []);
  assert.equal(done.dimensions[1].currentLevel, null);
});

test('browser snapshots share the next course and use correct nested-page links', () => {
  const store = new Map([['lhind:lrn-cockpit:v3', JSON.stringify({ profileId: 'tc' })]]);
  const document = { documentElement: { lang: 'en' }, addEventListener() {}, dispatchEvent() {} };
  const base = fixture();
  const window = { document, location: { pathname: '/lrn/course.html' }, localStorage: { getItem: k => store.get(k), setItem: (k, v) => store.set(k, v) }, LrnData: base.catalog, LrnCurriculumMap: { courseMaps: base.courseMaps }, AIFSCapabilityEvidence: base.capabilityEvidence, LrnLearningJourney: journey, addEventListener() {}, setTimeout, CustomEvent: class {} };
  vm.runInNewContext(readFileSync(new URL('./journey-state.js', import.meta.url), 'utf8'), { window });
  const nested = window.LrnJourneyState.snapshot();
  assert.equal(nested.next.href, '../lrn/course.html?id=A');
  window.location.pathname = '/index.html';
  assert.equal(window.LrnJourneyState.snapshot().next.courseId, nested.next.courseId);
  assert.equal(window.LrnJourneyState.snapshot().next.href, 'lrn/course.html?id=A');
});
