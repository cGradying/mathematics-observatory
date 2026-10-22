const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const all = cfg.headers.find(h => h.source === '/(.*)').headers;
const get = k => (all.find(h => h.key.toLowerCase() === k.toLowerCase()) || {}).value;
const csp = get('Content-Security-Policy');
const directive = n => (csp.split(';').map(s => s.trim()).find(s => s.startsWith(n + ' ')) || '');

test('CSP is strict', () => {
  assert.ok(csp);
  assert.ok(!/unsafe-eval/.test(csp));
  assert.ok(!/script-src[^;]*unsafe-inline/.test(csp));
  assert.equal(directive('default-src'), "default-src 'self'");
  assert.equal(directive('frame-ancestors'), "frame-ancestors 'none'");
  assert.ok(directive('object-src').includes("'none'"));
});
test('security headers present', () => {
  assert.equal(get('X-Frame-Options'), 'DENY');
  assert.equal(get('X-Content-Type-Options'), 'nosniff');
  assert.ok(get('Referrer-Policy'));
});
test('cache and function config', () => {
  const imm = cfg.headers.find(h => /assets\/\(\.\*\)-/.test(h.source));
  assert.match(imm.headers[0].value, /immutable/);
  const re = new RegExp('^' + imm.source + '$');
  assert.ok(re.test('/assets/index-AbCd1234.js'));
  assert.ok(!re.test('/assets/js/script.js'));
  assert.ok(cfg.functions['api/assistant.js'].maxDuration > 0);
});
test('dist inline scripts are CSP-safe (none allowed without nonce/hash)', () => {
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(dist)) return;
  for (const f of fs.readdirSync(dist).filter(f => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(dist, f), 'utf8');
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const src = /\bsrc=["']([^"']+)/.exec(m[1]);
      if (src) assert.ok(!/^(https?:)?\/\//.test(src[1]) || src[1].startsWith('https://cdn.jsdelivr.net'), `${f}: external script ${src[1]}`);
      else if (!/type=["']application\/(ld\+)?json/.test(m[1])) assert.equal(m[2].trim(), '', `${f}: inline script blocked by CSP`);
    }
    assert.ok(!/\son\w+=["']/i.test(html), `${f}: inline event handler blocked by CSP`);
  }
});
