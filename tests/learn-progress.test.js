const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('learn.html loads progress.js before the module entry', () => {
  const h = read('learn.html');
  const a = h.indexOf('assets/js/progress.js'), b = h.indexOf('type="module"');
  assert.ok(a > 0 && b > 0 && a < b);
});
test('every Progress topic has a Learn course mapping', () => {
  const topics = [...read('assets/js/progress.js').match(/const TOPICS = \[([\s\S]*?)\];/)[1].matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
  const slugs = new Set([...read('src/App.tsx').match(/const SLUGS[^=]*=\s*\{([\s\S]*?)\};/)[1].matchAll(/:\s*"([^"]+)"/g)].map(m => m[1]));
  assert.ok(topics.length > 0);
  const missing = topics.filter(t => !slugs.has(t));
  assert.deepEqual(missing, [], `no Learn course maps to: ${missing}`);
});
