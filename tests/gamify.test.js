const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { makeDocument, makeStorage, makeWindow } = require('./dom-stub');

function fresh() {
  const data = new Map();
  globalThis.localStorage = { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, v) };
  delete require.cache[require.resolve('../assets/js/progress.js')];
  return require('../assets/js/progress.js');
}

test('rank thresholds and next-rank distance', () => {
  const P = fresh();
  const at = n => P.rank(n).name;
  assert.deepEqual([0, 9, 10, 29, 30, 69, 70, 149, 150, 5000].map(at),
    ['Stargazer', 'Stargazer', 'Navigator', 'Navigator', 'Astronomer', 'Astronomer', 'Cartographer', 'Cartographer', 'Luminary', 'Luminary']);
  assert.equal(P.rank(7).toNext, 3);
  assert.equal(P.rank(150).next, null);
  assert.equal(P.rank(-4).name, 'Stargazer');
});

test('lifetime correct count survives the 10-answer window; legacy saves backfill', () => {
  const P = fresh();
  for (let i = 0; i < 14; i++) P.recordAnswer('functions', true);
  P.recordAnswer('functions', false);
  assert.equal(P.load().ok, 14);
  assert.equal(P.importJSON(JSON.stringify({ v: 1, answers: { statistics: [true, true, false] } })), true);
  assert.equal(P.load().ok, 2);
});

test('stars by score', () => {
  const P = fresh();
  assert.deepEqual([[5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5], [0, 0]].map(([r, t]) => P.stars(r, t)), [3, 2, 1, 1, 0, 0, 0]);
});

test('best score per mode: first, new best, not-a-best, bad modes ignored', () => {
  const P = fresh();
  assert.deepEqual(P.recordBest('quick', 3, 5), { isNew: false, prev: null });
  assert.equal(P.recordBest('quick', 2, 5).isNew, false);
  const b = P.recordBest('quick', 4, 5);
  assert.equal(b.isNew, true);
  assert.deepEqual(b.prev, { right: 3, total: 5 });
  assert.deepEqual(P.load().best.quick, { right: 4, total: 5 });
  P.recordBest('free', 5, 5);
  assert.equal(P.load().best.free, undefined);
});

test('import sanitises best, days, path, ok', () => {
  const P = fresh();
  const evil = { v: 1, ok: -5, best: { quick: { right: 99, total: 5 }, topic: { right: 'x', total: 0 }, free: { right: 1, total: 1 }, __proto__: { x: 1 } },
    days: Object.fromEntries([...Array(20)].map((_, i) => [`2026-01-${String(i + 1).padStart(2, '0')}`, 1e9]).concat([['bad', 3]])),
    path: { day: '<img>', read: true } };
  assert.equal(P.importJSON(JSON.stringify(evil)), true);
  const s = P.load();
  assert.equal(s.ok, 0);
  assert.deepEqual(s.best, { quick: { right: 5, total: 5 } });
  assert.equal(Object.keys(s.days).length, 14);
  assert.ok(Object.values(s.days).every(n => n === 9999));
  assert.equal(s.days.bad, undefined);
  assert.equal(s.path, null);
});

test('week strip covers 7 days and caps stored days at 14', () => {
  const P = fresh();
  P.recordAnswer('functions', true); P.recordAnswer('functions', false);
  const w = P.week();
  assert.equal(w.length, 7);
  assert.equal(w[6].today, true);
  assert.equal(w[6].n, 2);
  assert.equal(w[0].n, 0);
  const old = P.load(); for (let i = 1; i <= 20; i++) old.days[`2025-01-${String(i).padStart(2, '0')}`] = 1;
  P.importJSON(JSON.stringify(old));
  P.recordAnswer('functions', true);
  assert.ok(Object.keys(P.load().days).length <= 14);
});

test('greeting by hour', () => {
  const P = fresh();
  assert.deepEqual([3, 8, 14, 21].map(h => P.greeting(h)), ['Still up, stargazer?', 'Good morning', 'Good afternoon', 'Good evening']);
});

test('path ticks: lesson read, 5 answers, tool visit; tool needs a non-quiz page', () => {
  const P = fresh();
  assert.deepEqual(P.pathToday(), { read: false, quiz: false, tool: false });
  P.markRead('functions', 'l1');
  assert.equal(P.pathToday().read, true);
  P.setLast('functions', 'challenges', 'x', 'challenges.html');
  assert.equal(P.pathToday().tool, false);
  P.setLast('functions', 'visualize', 'x', 'visualize.html');
  assert.equal(P.pathToday().tool, true);
  for (let i = 0; i < 4; i++) P.recordAnswer('functions', true);
  assert.equal(P.pathToday().quiz, false);
  P.recordAnswer('functions', true);
  assert.equal(P.pathToday().quiz, true);
  // yesterday's marks do not count
  const s = P.load(); s.path.day = '2000-01-01'; P.importJSON(JSON.stringify(s));
  assert.equal(P.pathToday().read, false);
});

function boot({ blocked = false, seed } = {}) {
  const storage = makeStorage(blocked);
  if (seed) storage.setItem('observatory-progress-v1', JSON.stringify(seed));
  const doc = makeDocument();
  const win = makeWindow(doc, storage, { confirm: () => true, CustomEvent: class { constructor(type) { this.type = type; } } });
  const ctx = vm.createContext({ ...win, window: win, document: doc, localStorage: storage, CustomEvent: win.CustomEvent, URL, Blob, setTimeout });
  ctx.window = ctx;
  Object.assign(ctx, { addEventListener: win.addEventListener, dispatchEvent: win.dispatchEvent });
  for (const f of ['progress', 'dashboard']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', `assets/js/${f}.js`), 'utf8'), ctx);
  return { ctx, $: id => doc.registry.get('#' + id) };
}

test('home path strip renders three steps, ticks done ones, hides without storage', () => {
  const day = new Date(); const k = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const { $, ctx } = boot({ seed: { v: 1, goal: 'exam', path: { day: k, read: true, tool: false } } });
  assert.equal($('path').hidden, false);
  const items = $('path-list').children;
  assert.equal(items.length, 3);
  assert.equal(items[0].className, 'path-item is-done');
  assert.equal(items[1].className, 'path-item');
  for (let i = 0; i < 5; i++) ctx.Progress.recordAnswer('functions', true);
  assert.equal($('path-list').children[1].className, 'path-item is-done');
  assert.match($('dash-goal-text').textContent, /Goal reached/);
  assert.match($('dash-rank').textContent, /^Stargazer/);
  assert.equal($('dash-week').children.length, 7);
  const off = boot({ blocked: true });
  assert.equal(off.$('path').hidden, true);
});
