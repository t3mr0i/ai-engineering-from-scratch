import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import journey from './lrn/learning-journey.js';
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const reference = read('../docs/ai-literacy-lhind/zielbilder.json');
const catalog = read('./lrn/manifests/catalog.json');
const roleIds = { BSC: 'bsc', TC: 'tc', AM: 'am', PMA: 'pma', CF: 'corp', L: 'lead', PVS: 'pvs' };
test('all seven reference target profiles remain exact, including null and PVS', () => {
  for (const role of reference.roles) {
    assert.deepEqual(journey.referenceTargets[roleIds[role.code]], reference.dimensions.map(d => ({ A: 1, D: 2, C: 3 }[role.targets[d.id].target] ?? null)));
    assert.equal(catalog.roles.some(r => r.id === roleIds[role.code]), role.inAssessment);
  }
});
test('all reference capability topics remain represented in the nineteen catalog capabilities', () => {
  assert.equal(catalog.capabilities.length, 19);
  for (const dimension of reference.dimensions) {
    for (const topic of dimension.capabilities) {
      assert.ok(catalog.capabilities.some(capability => capability.cluster === dimension.name &&
        (journey.canonicalCapabilityTitle(capability.title) === journey.canonicalCapabilityTitle(topic) || capability.title.includes(topic))), topic);
    }
  }
});
test('all nine Academy paths from the reference remain reachable by a course route', () => {
  const academy = read('../docs/ai-literacy-lhind/academy.json');
  for (const id of Object.keys(academy)) assert.ok(catalog.academyPaths.some(path => path.academyCourse === id), id);
  const home = readFileSync(new URL('./lrn/readiness-home.js', import.meta.url), 'utf8');
  assert.match(home, /lrn\/course\.html\?academy=/);
});
