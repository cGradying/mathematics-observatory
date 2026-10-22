const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { makeDocument, makeStorage, makeWindow } = require('./dom-stub');

const root = path.join(__dirname, '..');
const src = f => fs.readFileSync(path.join(root, f), 'utf8');

function boot({ blocked = false, seed } = {}) {
  const storage = makeStorage(blocked);
  if (seed) storage.setItem('observatory-progress-v1', JSON.stringify(seed));
  const doc = makeDocument();
  const win = makeWindow(doc, storage, { confirm: () => true, CustomEvent: class { constructor(type) { this.type = type; } } });
  const ctx = vm.createContext({ ...win, window: win, document: doc, localStorage: storage, CustomEvent: win.CustomEvent, URL, Blob, setTimeout });
  ctx.window = ctx; // scripts use window.* and root.dispatchEvent
  Object.assign(ctx, { addEventListener: win.addEventListener, dispatchEvent: win.dispatchEvent });
  vm.runInContext(src('assets/js/progress.js'), ctx);
  vm.runInContext(src('assets/js/dashboard.js'), ctx);
  const $ = id => doc.registry.get('#' + id);
  return { ctx, doc, $, storage, topics: $('dash-topics') };
}
const cardText = li => li.children.map(c => c.text).join(' | ');

test('new visitor sees only the goal picker', () => {
  const { $, doc } = boot();
  assert.equal($('dashboard').hidden, false);
  assert.equal($('dash-goal').hidden, false);
  assert.equal($('dash-main').hidden, true);
  assert.equal(doc.body.classList.on, false);
});

test('returning visitor sees gentle wording, progressbars and Continue vs Start', () => {
  const { $, doc, topics } = boot({ seed: { v: 1, goal: 'catchup', answers: { statistics: [true, false] } } });
  assert.equal($('dash-main').hidden, false);
  assert.equal(doc.body.classList.on, true);
  assert.equal(topics.children.length, 7);
  const stats = topics.children.find(li => li.children[0].text === 'Statistics');
  const fresh = topics.children.find(li => li.children[0].text === 'Functions');
  assert.match(cardText(stats), /Just started \| .* \| 2 of 10 answered/);
  assert.doesNotMatch(cardText(fresh), /Not started/);
  const bar = stats.children[2];
  assert.equal(bar.attrs.role, 'progressbar');
  assert.equal(bar.attrs['aria-valuenow'], '2');
  assert.equal(bar.attrs['aria-valuemax'], '10');
  assert.equal(stats.children.at(-1).text, 'Continue practising');
  assert.equal(stats.children.at(-1).href, 'challenges.html#topic=statistics');
  assert.equal(fresh.children.at(-1).text, 'Start');
  assert.match($('dash-activity').textContent, /Every answer counts|answered today/);
});

test('blocked storage still renders (memory fallback) without throwing', () => {
  const { ctx, $, topics } = boot({ blocked: true });
  assert.equal($('dash-goal').hidden, false);
  ctx.Progress.setGoal('exam'); // fires progress-change -> re-render
  assert.equal($('dash-main').hidden, false);
  assert.equal(topics.children.length, 7);
});

test('import rejection tells the student nothing changed; success confirms', async () => {
  const { ctx, $ } = boot({ seed: { v: 1, goal: 'exam' } });
  const file = text => ({ target: { files: [{ size: text.length, text: async () => text }], value: 'x' } });
  await Promise.all($('dash-import').handlers.change.map(fn => fn(file('not json'))));
  assert.match($('dash-status').textContent, /Import failed.*not changed/);
  assert.equal(ctx.Progress.load().goal, 'exam');
  await Promise.all($('dash-import').handlers.change.map(fn => fn(file('{"v":1,"goal":"explore"}'))));
  assert.equal($('dash-status').textContent, 'Progress imported.');
  assert.equal(ctx.Progress.load().goal, 'explore');
});

test('index.html keeps the status live region outside the closed details', () => {
  const h = src('index.html');
  const status = h.indexOf('id="dash-status"');
  assert.ok(status > h.indexOf('</details>'));
  assert.match(h.slice(status - 80, status + 80), /role="status"/);
});
