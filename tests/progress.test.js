const test = require('node:test');
const assert = require('node:assert/strict');

function fresh() {
  const data = new Map();
  globalThis.localStorage = { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, v) };
  delete require.cache[require.resolve('../assets/js/progress.js')];
  return require('../assets/js/progress.js');
}

test('mastery levels follow recent accuracy over the last 10 answers', () => {
  const P = fresh();
  assert.equal(P.mastery('functions').level, 'new');
  for (let i = 0; i < 3; i++) P.recordAnswer('functions', true);
  assert.equal(P.mastery('functions').level, 'practising');
  for (let i = 0; i < 5; i++) P.recordAnswer('functions', true);
  assert.equal(P.mastery('functions').level, 'mastered');
  for (let i = 0; i < 10; i++) P.recordAnswer('functions', false);
  assert.equal(P.mastery('functions').n, 10);
  assert.equal(P.mastery('functions').level, 'practising');
});

test('unknown topics are ignored and import rejects bad or foreign data', () => {
  const P = fresh();
  assert.equal(P.recordAnswer('nope', true), false);
  assert.equal(P.importJSON('not json'), false);
  assert.equal(P.importJSON('{"v":2}'), false);
  const evil = { v: 1, goal: 'exam', last: { topic: 'functions', page: 'x', label: 'y', href: 'https://evil.example/' }, answers: { functions: [true, 1] } };
  assert.equal(P.importJSON(JSON.stringify(evil)), true);
  assert.equal(P.load().last, null);
  assert.deepEqual(P.load().answers.functions, [true, true]);
});

test('read marks, export/import round trip and reset', () => {
  const P = fresh();
  P.markRead('statistics', 'Mean', true);
  assert.equal(P.isRead('statistics', 'Mean'), true);
  const dump = P.exportJSON();
  P.reset();
  assert.equal(P.isRead('statistics', 'Mean'), false);
  assert.equal(P.importJSON(dump), true);
  assert.equal(P.readCount('statistics'), 1);
});

test('next step respects goal and weak topics', () => {
  const P = fresh();
  assert.equal(P.nextStep().topic, 'business-mathematics');
  for (let i = 0; i < 4; i++) P.recordAnswer('statistics', false);
  assert.equal(P.nextStep().topic, 'statistics');
  P.setGoal('explore');
  assert.equal(P.nextStep().action, 'visualize');
  P.setGoal('exam');
  assert.notEqual(P.nextStep().topic, 'statistics');
});

test('storage failures fall back to memory without throwing', () => {
  const P = fresh();
  globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => P.recordAnswer('functions', true));
});

test('learn page loads progress.js before the app module', () => {
  const h = require('node:fs').readFileSync(require('node:path').join(__dirname, '../learn.html'), 'utf8');
  assert.ok(h.indexOf('assets/js/progress.js') > 0 && h.indexOf('assets/js/progress.js') < h.indexOf('learn-main.tsx'));
});

test('describe gives gentle labels, progress and next-level hint', () => {
  const P = fresh();
  assert.equal(P.describe('functions').label, 'Ready to begin');
  P.recordAnswer('functions', true);
  let d = P.describe('functions');
  assert.equal(d.label, 'Just started');
  assert.equal(d.progress, '1 of 10 answered');
  assert.equal(d.next, '4 more answers to reach Confident');
  assert.equal(d.level, 'practising');
  for (let i = 0; i < 2; i++) P.recordAnswer('functions', true);
  assert.equal(P.describe('functions').label, 'Building up');
});

test('activity counts answers today and sanitizes imported act', () => {
  const P = fresh();
  assert.deepEqual(P.activity(), { today: 0, run: 0 });
  P.recordAnswer('functions', true); P.recordAnswer('statistics', false);
  assert.deepEqual(P.activity(), { today: 2, run: 1 });
  const d = new Date(); d.setDate(d.getDate() - 1);
  const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.equal(P.importJSON(JSON.stringify({ v: 1, act: { day: y, n: 5, run: 3 } })), true);
  assert.deepEqual(P.activity(), { today: 0, run: 3 });
  P.recordAnswer('functions', true);
  assert.deepEqual(P.activity(), { today: 1, run: 4 });
  P.importJSON(JSON.stringify({ v: 1, act: { day: '<img>', n: 'x', run: -4 } }));
  assert.equal(P.load().act, null);
  P.importJSON(JSON.stringify({ v: 1, act: { day: y, n: -9, run: 1e12 } }));
  assert.deepEqual(P.load().act, { day: y, n: 0, run: 9999 });
});
