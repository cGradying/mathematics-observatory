const assert = require('node:assert/strict');
const test = require('node:test');
const assistantApi = require('../api/assistant');

const KEY = 'secret-key-XYZ';
const messages = [{ role: 'system', content: 's' }, { role: 'user', content: 'private student question' }];
let ipCounter = 0;

function res() {
    return {
        statusCode: 200, headers: {}, body: undefined, ended: false,
        setHeader(n, v) { this.headers[n.toLowerCase()] = v; },
        status(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; },
        end() { this.ended = true; return this; }
    };
}

async function call({ env = { GEMINI_API_KEY: KEY }, upstream, headers = {}, body = { messages }, method = 'POST' } = {}) {
    const saved = { fetch: globalThis.fetch, key: process.env.GEMINI_API_KEY, err: console.error };
    const logs = [];
    console.error = (...a) => logs.push(a.join(' '));
    if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY; else delete process.env.GEMINI_API_KEY;
    if (upstream) globalThis.fetch = upstream;
    try {
        const r = res();
        await assistantApi({ method, headers: { host: 'site.test', 'x-forwarded-for': `198.51.100.${++ipCounter % 250}`, ...headers }, body }, r);
        const everything = JSON.stringify([r.body, r.headers, logs]);
        assert.ok(!everything.includes(KEY), 'key must not leak into responses or logs');
        assert.ok(!logs.join('').includes('private student question'), 'user content must not be logged');
        return r;
    } finally {
        globalThis.fetch = saved.fetch; console.error = saved.err;
        if (saved.key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = saved.key;
    }
}
const ok = json => async () => ({ ok: true, status: 200, json: async () => json });
const status = code => async () => ({ ok: false, status: code, json: async () => ({ error: { message: `leak ${KEY}` } }) });

test('no key -> 503 not_configured', async () => {
    const r = await call({ env: {} });
    assert.equal(r.statusCode, 503); assert.equal(r.body.code, 'not_configured'); assert.ok(r.body.error);
});
test('OPTIONS answered without CORS headers; other methods 405', async () => {
    const o = await call({ method: 'OPTIONS' });
    assert.equal(o.statusCode, 204); assert.equal(o.headers['access-control-allow-origin'], undefined);
    assert.equal((await call({ method: 'PUT' })).statusCode, 405);
});
test('bad origin 403; matching origin via x-forwarded-host accepted', async () => {
    assert.equal((await call({ headers: { origin: 'https://evil.test' } })).body.code, 'bad_origin');
    const r = await call({ headers: { origin: 'https://math.example', 'x-forwarded-host': 'math.example' }, upstream: ok({ candidates: [{ content: { parts: [{ text: 'hi' }] } }] }) });
    assert.equal(r.statusCode, 200);
});
test('bad body -> 400 and oversize -> 413', async () => {
    assert.equal((await call({ body: '{nope' })).statusCode, 400);
    assert.equal((await call({ body: { messages: [] } })).body.code, 'bad_request');
    assert.equal((await call({ body: { messages: [messages[0], { role: 'user', content: 'x'.repeat(50_000) }] } })).statusCode, 413);
});
test('upstream 429 / 500 / 403 map to friendly coded errors', async () => {
    const a = await call({ upstream: status(429) });
    assert.equal(a.statusCode, 429); assert.equal(a.body.code, 'upstream_rate_limited');
    const b = await call({ upstream: status(500) });
    assert.equal(b.statusCode, 502); assert.equal(b.body.code, 'upstream_error');
    assert.equal((await call({ upstream: status(403) })).body.code, 'upstream_auth');
});
test('timeout -> 504', async () => {
    const r = await call({ upstream: async () => { throw Object.assign(new Error('t'), { name: 'TimeoutError' }); } });
    assert.equal(r.statusCode, 504); assert.equal(r.body.code, 'timeout');
});
test('blocked content -> 422', async () => {
    assert.equal((await call({ upstream: ok({ promptFeedback: { blockReason: 'SAFETY' } }) })).body.code, 'blocked');
    assert.equal((await call({ upstream: ok({ candidates: [{ finishReason: 'SAFETY' }] }) })).statusCode, 422);
});
test('success parse and empty reply', async () => {
    const r = await call({ upstream: ok({ candidates: [{ content: { parts: [{ text: '{"answer":"12"}' }] }, finishReason: 'STOP' }] }) });
    assert.deepEqual(r.body, { message: { content: '{"answer":"12"}' } });
    assert.equal((await call({ upstream: ok({ candidates: [{ content: { parts: [] } }] }) })).body.code, 'empty');
});
test('default model is the documented stable Flash-Lite id', () => {
    assert.equal(assistantApi.DEFAULT_MODEL, 'gemini-3.5-flash-lite');
});

test('header AI button hides itself when the assistant failed to load, and mirrors aria-expanded otherwise', () => {
    const fs = require('node:fs'); const vm = require('node:vm'); const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'assets/js/header-ai.js'), 'utf8');
    const mk = launcher => {
        const attrs = {}; let observed; let click;
        const btn = { hidden: false, setAttribute: (k, v) => { attrs[k] = v; }, addEventListener: (_, f) => { click = f; } };
        const doc = { querySelector: sel => (sel === '.header-ai' ? btn : launcher) };
        vm.runInNewContext(src, { document: doc, MutationObserver: class { constructor(f) { observed = f; } observe() {} } });
        return { btn, attrs, observed, click };
    };
    assert.equal(mk(null).btn.hidden, true);
    const launcher = { expanded: 'false', tabIndex: 0, setAttribute() {}, getAttribute() { return this.expanded; }, click() { this.clicked = true; } };
    const h = mk(launcher);
    assert.equal(h.btn.hidden, false); assert.equal(h.attrs['aria-pressed'], 'false');
    launcher.expanded = 'true'; h.observed(); assert.equal(h.attrs['aria-pressed'], 'true');
    h.click(); assert.ok(launcher.clicked);
});
