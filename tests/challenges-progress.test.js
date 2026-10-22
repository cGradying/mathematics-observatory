const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { makeEl, makeDocument, makeStorage, makeWindow } = require('./dom-stub');

const src = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const ex = (question, finalAnswer) => ({ question, given: 'x', formula: '', finalAnswer, difficulty: 'Beginner', expectedMethod: 'm', workedSolution: 'w', commonMistake: '' });
const DATA = { modules: [
  { id: 'statistics', topic: { topicName: 'Statistics' }, exampleBank: { examples: [ex('Find the mean of 2, 4, 6', '4'), ex('Find the median of 1, 5, 9', '5')] } },
  { id: 'functions', topic: { topicName: 'Functions' }, exampleBank: { examples: [ex('Evaluate f(2) for f(x)=x+1', '3')] } },
] };

async function boot({ hash = '', seed } = {}) {
  const storage = makeStorage();
  if (seed) storage.setItem('observatory-progress-v1', JSON.stringify(seed));
  const doc = makeDocument();
  const made = [];
  const mk = doc.createElement;
  doc.createElement = t => { const e = mk(t); made.push(e); return e; };
  const keys = ['all', 'business', 'sequences', 'measurement', 'functions', 'statistics', 'trigonometry', 'logic'];
  const buttons = keys.map(k => Object.assign(makeEl('button', doc.registry), { dataset: { challengeFilter: k } }));
  doc.querySelectorAll = sel => (sel === '[data-challenge-filter]' ? buttons : []);
  const win = makeWindow(doc, storage, { GRADE_11_MATH_DATA_READY: Promise.resolve(DATA), CustomEvent: class { constructor(type) { this.type = type; } } });
  win.location.hash = hash;
  const ctx = vm.createContext({ ...win, window: win, document: doc, CustomEvent: win.CustomEvent, URL, URLSearchParams, console });
  ctx.window = ctx;
  Object.assign(ctx, { addEventListener: win.addEventListener, dispatchEvent: win.dispatchEvent, location: win.location });
  vm.runInContext(src('assets/js/progress.js'), ctx);
  const calls = [];
  const real = ctx.Progress.recordAnswer;
  ctx.Progress.recordAnswer = (t, c) => { calls.push([t, c]); return real(t, c); };
  vm.runInContext(src('assets/js/challenges.js'), ctx);
  await new Promise(r => setTimeout(r, 10));
  const q = s => doc.registry.get(s);
  const answer = text => { q('#challenge-answer').value = text; q('#challenge-answer-form').fire('submit'); };
  const levelUp = () => made.find(e => e.className === 'challenge-levelup');
  const related = () => made.find(e => e.id === 'challenge-related');
  return { ctx, calls, q, levelUp, related, answer, buttons, win };
}

test('deep link #topic=statistics selects that filter', async () => {
  const { q } = await boot({ hash: '#topic=statistics' });
  assert.match(q('#challenge-bank-count').textContent, /^2 matching questions/);
  assert.match(q('#challenge-question').textContent, /mean|median/);
});

test('unknown deep link falls back to all topics', async () => {
  const { q } = await boot({ hash: '#topic=__proto__' });
  assert.match(q('#challenge-bank-count').textContent, /^3 matching questions/);
});

test('submitting records the right slug and pass flag', async () => {
  const { calls, ctx, answer } = await boot({ hash: '#topic=functions' });
  answer('99');
  answer('3');
  assert.deepEqual(calls, [['functions', false], ['functions', true]]);
  assert.equal(ctx.Progress.mastery('functions').n, 2);
});

test('first answer reads "Just started", not "Practising", and shows related tools', async () => {
  const { ctx, q, answer, levelUp, related } = await boot({ hash: '#topic=functions' });
  answer('3');
  assert.equal(ctx.Progress.describe('functions').label, 'Just started');
  assert.equal(q('#challenge-solution').hidden, false);
  assert.equal(related().hidden, false);
  assert.ok(related().children.some(c => c.href === 'learn.html?topic=functions'));
  assert.equal(levelUp().textContent, 'Nice start on Functions.');
  assert.equal(levelUp().attrs.role, 'status');
});

test('no level-up message when the level does not change; message when it does', async () => {
  const { answer, levelUp } = await boot({ hash: '#topic=functions', seed: { v: 1, answers: { functions: [true, true, true] } } });
  answer('3'); // 4th answer: still practising
  assert.equal(levelUp().textContent, '');
  answer('3'); // 5th answer at 100%: Confident
  assert.equal(levelUp().textContent, 'Level up: Functions is now Confident.');
});

test('page wires progress.js before challenges.js and has no old harsh wording', () => {
  const h = src('challenges.html');
  assert.ok(h.indexOf('assets/js/progress.js') > 0 && h.indexOf('assets/js/progress.js') < h.indexOf('assets/js/challenges.js'));
  assert.doesNotMatch(src('assets/js/challenges.js') + src('assets/js/dashboard.js'), /Not started/);
});
