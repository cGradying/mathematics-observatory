const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const links = h => [...h.match(/<ul class="nav-links"[\s\S]*?<\/ul>/)[0].matchAll(/href="([^"]+)"/g)].map(m => m[1]);

test('8 pages share one header', () => {
  assert.equal(pages.length, 8);
  const ref = links(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  assert.equal(ref.length, 8);
  for (const f of pages) {
    const h = fs.readFileSync(path.join(root, f), 'utf8');
    assert.deepEqual(links(h), ref, `${f} nav links`);
    assert.equal((h.match(/<a class="logo"/g) || []).length, 1, `${f} logo`);
    assert.match(h, /<a class="logo" href="index\.html" aria-label="[^"]+"/, `${f} logo link`);
    assert.match(h, /<button class="header-ai"[^>]*aria-label="Ask the math tutor"/, `${f} AI button`);
    assert.match(h, /<script defer src="assets\/js\/header-ai\.js"><\/script>/, `${f} header-ai.js`);
    assert.equal((h.match(/aria-current="page"/g) || []).length, 1, `${f} aria-current`);
    assert.equal((h.match(/<header class="site-header">/g) || []).length, 1, `${f} header`);
  }
});
