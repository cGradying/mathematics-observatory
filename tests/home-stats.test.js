const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

test('home stat numbers are static text equal to real data counts (no count-up)', () => {
  const dir = path.join(root, 'data/knowledge/examples');
  const examples = fs.readdirSync(dir).reduce((n, f) => n + JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).examples.length, 0);
  const ctx = vm.createContext({ document: { addEventListener() {} }, window: {}, console });
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/explore-formulas.js'), 'utf8'), ctx);
  const formulas = ctx.window.ExploreFormulas.FORMULA_LIBRARY.length;
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const stat = (label) => Number(html.match(new RegExp(`<dt data-count="(\\d+)">(\\d+)</dt><dd>${label}</dd>`)).slice(1).reduce((a, b) => { assert.equal(a, b); return a; }));
  assert.equal(stat('worked examples'), examples);
  assert.equal(stat('formulas to inspect'), formulas);
  assert.equal(stat('studios to explore'), (html.match(/<article class="section-card /g) || []).length);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'assets/js/script.js'), 'utf8'), /setupCounters|dataset\.count/);
});
