const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(reduced) {
  const body = { kids: [], appendChild(c) { this.kids.push(c); c.isConnected = true; return c; } };
  const mk = () => ({
    style: { setProperty() {} }, children: [], attrs: {}, cls: new Set(), textContent: '',
    classList: { add(c) { this.o.cls.add(c); }, remove(c) { this.o.cls.delete(c); } },
    setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); },
    remove() { body.kids.splice(body.kids.indexOf(this), 1); }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 10, height: 10 }),
  });
  const make = () => { const e = mk(); e.classList.o = e; return e; };
  const doc = { readyState: 'complete', body, createElement: make, addEventListener() {}, getElementById: () => null, querySelectorAll: () => [] };
  const win = { document: doc, matchMedia: () => ({ matches: reduced }), innerHeight: 800, setTimeout, clearTimeout };
  win.window = win;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets/js/fun.js'), 'utf8'), { ...win, window: win, setTimeout, clearTimeout });
  return { Fun: win.Fun, body };
}

test('Fun.pop adds <=12 nodes and cleans up', async () => {
  const { Fun, body } = load(false);
  const before = body.kids.length;
  const box = Fun.pop(body.kids[0], 99);
  assert.equal(box.children.length, 12);
  assert.equal(body.kids.length, before + 1);
  await new Promise(r => setTimeout(r, 800));
  assert.equal(body.kids.length, before);
});

test('Fun.toast uses a polite live region', () => {
  const { Fun, body } = load(false);
  const el = Fun.toast('Course complete: Algebra');
  assert.equal(el.attrs.role, 'status');
  assert.equal(el.attrs['aria-live'], 'polite');
  assert.equal(el.textContent, 'Course complete: Algebra');
  assert.equal(body.kids.filter(k => k.attrs.role === 'status').length, 1);
});

test('reduced motion: pop does not animate, css disables motion', () => {
  const { Fun, body } = load(true);
  assert.equal(Fun.pop(body.kids[0]), null);
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets/css/fun.css'), 'utf8');
  assert.match(css, /@view-transition \{ navigation: auto; \}/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*navigation: none/);
});
