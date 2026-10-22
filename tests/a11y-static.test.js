const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const line = (h, i) => h.slice(0, i).split('\n').length;

for (const f of pages) {
  test(`a11y static: ${f}`, () => {
    const h = fs.readFileSync(path.join(root, f), 'utf8');
    const errs = [];
    const count = re => (h.match(re) || []).length;
    if (!/<html[^>]*\blang=/.test(h)) errs.push('missing html lang');
    // learn.html renders its h1 via React into #learn-root
    const react = /id="learn-root"|<main id="top"><\/main>/.test(h); // client-rendered root
    if (count(/<h1\b/g) !== 1 && !react) errs.push(`expected 1 h1, got ${count(/<h1\b/g)}`);
    const skip = /<a[^>]+href="#([\w-]+)"[^>]*skip|<a[^>]*skip[^>]*href="#([\w-]+)"/.exec(h);
    if (!skip) errs.push('no skip link');
    else if (!h.includes(`id="${skip[1] || skip[2]}"`)) errs.push('skip link target missing');
    if (!/<main\b/.test(h) && !react) errs.push('no <main id="main">');
    for (const t of ['main', 'nav', 'footer', 'header']) {
      if (count(new RegExp(`<${t}\\b`, 'g')) !== count(new RegExp(`</${t}>`, 'g'))) errs.push(`unbalanced <${t}>`);
    }
    const seen = new Map();
    for (const m of h.matchAll(/\sid="([^"]+)"/g)) {
      if (seen.has(m[1])) errs.push(`duplicate id "${m[1]}" line ${line(h, m.index)}`);
      seen.set(m[1], 1);
    }
    for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) errs.push(`img without alt line ${line(h, m.index)}`);
    for (const m of h.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
      const text = m[2].replace(/<[^>]*>/g, '').trim();
      if (!text && !/aria-label(ledby)?=|title=/.test(m[1])) errs.push(`button without name line ${line(h, m.index)}`);
    }
    assert.deepEqual(errs, [], `${f}: ${errs.join('; ')}`);
  });
}
