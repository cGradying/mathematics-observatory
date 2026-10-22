const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const dist = path.join(__dirname, '..', 'dist');
const exists = fs.existsSync(dist);
const pages = exists ? fs.readdirSync(dist).filter(name => name.endsWith('.html')) : [];

test('dist exists (run npm run build first)', () => assert.ok(exists && pages.length >= 8));

test('every internal href/src in dist HTML resolves to a file', () => {
    const missing = [];
    for (const page of pages) {
        const html = fs.readFileSync(path.join(dist, page), 'utf8');
        for (const [, , url] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
            if (/^(https?:|\/\/|data:|mailto:|tel:|#|javascript:)/.test(url)) continue;
            const clean = url.split(/[?#]/)[0];
            if (!clean) continue;
            const target = clean.startsWith('/') ? path.join(dist, clean) : path.join(dist, path.dirname(page), clean);
            const candidates = [target, target + '.html', path.join(target, 'index.html')];
            if (clean === '/') candidates.push(path.join(dist, 'index.html'));
            if (!candidates.some(file => fs.existsSync(file) && fs.statSync(file).isFile())) missing.push(`${page} -> ${url}`);
        }
    }
    assert.deepEqual(missing, []);
});

test('no browser-served script keeps a bare module import (three.js must be bundled)', () => {
    const js = path.join(dist, 'assets', 'js');
    const bare = [];
    // Only scripts the browser can load: classic <script src> tags plus the bundled dynamic-import target.
    const served = new Set(['geometry-visualizer.js']);
    for (const page of pages) {
        for (const [, name] of fs.readFileSync(path.join(dist, page), 'utf8').matchAll(/src="assets\/js\/([^"?]+)/g)) served.add(name);
    }
    for (const file of served) {
        const source = fs.readFileSync(path.join(js, file), 'utf8');
        if (/(?:^|[;\n])\s*import[^'"\n]*?from\s*['"](?![./])/.test(source) || /import\(\s*['"](?![./])/.test(source)) bare.push(file);
    }
    assert.deepEqual(bare, []);
});

test('public files and vercel.json are present and valid', () => {
    for (const file of ['404.html', 'robots.txt', 'sitemap.xml', 'favicon.svg', 'fonts/fonts.css']) {
        assert.ok(fs.existsSync(path.join(dist, file)), file);
    }
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
    assert.equal(config.outputDirectory, 'dist');
});
