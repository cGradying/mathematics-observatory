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
  const modes = ['quick', 'topic', 'free'].map(k => Object.assign(makeEl('button', doc.registry), { dataset: { mode: k } }));
  doc.querySelectorAll = sel => (sel === '[data-challenge-filter]' ? buttons : sel === '[data-mode]' ? modes : []);
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
  const start = (topic, mode = 'quick') => {
    if (topic) { q('#quiz-topic').value = topic; q('#quiz-topic').fire('change', { target: q('#quiz-topic') }); }
    modes.find(m => m.dataset.mode === mode).fire('click');
    q('#quiz-start').fire('click');
  };
  const next = () => q('#challenge-next').fire('click');
  return { ctx, calls, q, levelUp, related, answer, buttons, win, start, next, made };
}

test('deep link #topic=statistics preselects the quiz topic and browse filter', async () => {
  const { q, start } = await boot({ hash: '#topic=statistics' });
  assert.match(q('#quiz-setup-note').textContent, /Only 2 questions match/);
  assert.equal(q('#quiz-topic').value, 'statistics');
  start();
  assert.match(q('#challenge-question').textContent, /mean|median/);
  assert.equal(q('#quiz-play').hidden, false);
  assert.equal(q('#quiz-setup').hidden, true);
});

test('unknown deep link falls back to all topics', async () => {
  const { q } = await boot({ hash: '#topic=__proto__' });
  assert.match(q('#challenge-bank-count').textContent, /^3 matching questions/);
});

test('submitting records the right slug and pass flag', async () => {
  const { calls, ctx, answer, start, q } = await boot({ hash: '#topic=functions' });
  start();
  answer('99');
  q('#challenge-retry').fire('click');
  answer('3');
  assert.deepEqual(calls, [['functions', false], ['functions', true]]);
  assert.equal(ctx.Progress.mastery('functions').n, 2);
});

test('first answer reads "Just started", not "Practising", and shows related tools', async () => {
  const { ctx, q, answer, levelUp, related, start } = await boot({ hash: '#topic=functions' });
  start();
  answer('3');
  assert.equal(ctx.Progress.describe('functions').label, 'Just started');
  assert.equal(q('#challenge-solution').hidden, false);
  assert.equal(related().hidden, false);
  assert.ok(related().children.some(c => c.href === 'learn.html?topic=functions'));
  assert.equal(levelUp().textContent, 'Nice start on Functions.');
  assert.equal(levelUp().attrs.role, 'status');
});

test('no level-up message when the level does not change; message when it does', async () => {
  const { answer, levelUp, start, q } = await boot({ hash: '#topic=functions', seed: { v: 1, answers: { functions: [true, true, true] } } });
  start('functions', 'free');
  answer('3'); // 4th answer: still practising
  assert.equal(levelUp().textContent, '');
  q('#challenge-retry').fire('click');
  answer('3'); // 5th answer at 100%: Confident
  assert.equal(levelUp().textContent, 'Level up: Functions is now Confident.');
});

test('page wires progress.js before challenges.js and has no old harsh wording', () => {
  const h = src('challenges.html');
  assert.ok(h.indexOf('assets/js/progress.js') > 0 && h.indexOf('assets/js/progress.js') < h.indexOf('assets/js/challenges.js'));
  assert.doesNotMatch(src('assets/js/challenges.js') + src('assets/js/dashboard.js'), /Not started/);
});

test('quiz session: scoring, review, and retry-missed', async () => {
  const { q, start, answer, next, calls, made } = await boot({ hash: '#topic=statistics' });
  start('statistics', 'topic'); // 2 statistics questions available
  assert.equal(q('#challenge-count').textContent, 'Question 1 of 2');
  const first = q('#challenge-question').textContent;
  const right = first.includes('mean') ? '4' : '5';
  answer(right); // first correct
  assert.equal(q('#challenge-next').hidden, false);
  assert.equal(q('#challenge-next').firstChild.textContent, 'Next question ');
  next();
  assert.equal(q('#challenge-count').textContent, 'Question 2 of 2');
  answer('wrong'); // second missed
  assert.equal(q('#challenge-retry').hidden, false);
  assert.equal(q('#challenge-next').firstChild.textContent, 'See results ');
  next();
  assert.equal(q('#quiz-results').hidden, false);
  assert.equal(q('#quiz-score').textContent, '1 of 2 correct');
  const review = q('#quiz-review').children;
  assert.equal(review.length, 2);
  assert.match(review[1].text, /Missed.*Your answer: wrong.*Expected:/);
  assert.equal(q('#quiz-retry-missed').firstChild.textContent, 'Retry missed (1)');
  const link = q('#quiz-topics').children.find(c => c.href);
  assert.equal(link.href, 'learn.html?topic=statistics');
  assert.deepEqual(calls.map(c => c[1]), [true, false]);
  q('#quiz-retry-missed').fire('click');
  assert.equal(q('#quiz-play').hidden, false);
  assert.equal(q('#challenge-count').textContent, 'Question 1 of 1');
  q('#quiz-new').fire('click');
  assert.equal(q('#quiz-setup').hidden, false);
});
