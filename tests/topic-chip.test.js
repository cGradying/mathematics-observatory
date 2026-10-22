const test = require('node:test');
const assert = require('node:assert/strict');

function run(search, file = 'statistics-page.html') {
  const data = new Map();
  globalThis.localStorage = { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, v) };
  delete require.cache[require.resolve('../assets/js/progress.js')];
  const Progress = require('../assets/js/progress.js');
  const inserted = [];
  const el = tag => ({ tag, children: [], setAttribute() {}, appendChild(c) { this.children.push(c); } });
  const main = { parentNode: { insertBefore: c => inserted.push(c) } };
  const doc = { createElement: el, querySelector: () => main, body: { prepend: c => inserted.push(c) } };
  const init = require('../assets/js/topic-chip.js');
  const chip = init({ Progress, document: doc, location: { search, pathname: '/x/' + file } });
  return { chip, inserted, Progress };
}

test('known slug builds chip with correct links and records last', () => {
  const { chip, inserted, Progress } = run('?topic=statistics', 'explore.html');
  assert.equal(inserted.length, 1);
  assert.equal(chip.children[0].textContent, 'Topic: Statistics · Ready to begin');
  assert.equal(chip.children[1].href, 'challenges.html#topic=statistics');
  assert.equal(chip.children[2].href, 'learn.html?topic=statistics');
  const last = Progress.load().last;
  assert.equal(last.topic, 'statistics');
  assert.equal(last.page, 'explore');
  assert.equal(last.label, 'Using Explore for Statistics');
  assert.equal(last.href, 'explore.html?topic=statistics');
});

test('unknown, missing or hostile slugs do nothing', () => {
  for (const s of ['', '?topic=', '?topic=<script>', '?topic=__proto__', '?topic=Statistics', '?other=1']) {
    const { chip, inserted, Progress } = run(s);
    assert.equal(chip, null, s);
    assert.equal(inserted.length, 0);
    assert.equal(Progress.load().last, null);
  }
});
