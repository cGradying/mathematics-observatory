// Tiny DOM stub for vm-style tests of classic browser scripts (not a test file).
function makeEl(tag = 'div', registry) {
  const el = {
    tag, children: [], attrs: {}, dataset: {}, style: {}, handlers: {}, hidden: false, textContent: '', value: '', href: '', className: '',
    classList: { toggle() {}, add() {}, remove() {} },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k] ?? null; },
    addEventListener(t, fn) { (this.handlers[t] ||= []).push(fn); },
    append(...c) { this.children.push(...c); }, prepend(...c) { this.children.unshift(...c); },
    appendChild(c) { this.children.push(c); return c; },
    replaceChildren(...c) { this.children = c; if (!c.length) this.textContent = ''; },
    after() {}, before() {}, remove() {}, focus() {}, click() {},
    querySelector(sel) { return registry ? registry.get(sel) : makeEl('div'); },
    querySelectorAll() { return []; },
    firstChild: { textContent: '' },
    fire(t, ev = {}) { (this.handlers[t] || []).forEach(fn => fn({ preventDefault() {}, target: this, ...ev })); },
    get text() { return [this.textContent, ...this.children.map(c => (typeof c === 'string' ? c : c.text))].join(''); },
  };
  return el;
}
// Elements are looked up by selector/id and created on demand; `ids` can be pre-seeded.
function makeDocument() {
  const byKey = new Map();
  const registry = { get(k) { if (!byKey.has(k)) byKey.set(k, makeEl('div', registry)); return byKey.get(k); } };
  const doc = {
    registry,
    createElement: t => makeEl(t, registry),
    createDocumentFragment: () => makeEl('frag', registry),
    getElementById: id => registry.get('#' + id),
    querySelector: s => registry.get(s),
    querySelectorAll: () => [],
    baseURI: 'http://localhost/',
    body: Object.assign(makeEl('body', registry), { classList: { on: false, toggle(c, v) { this.on = v; } } }),
  };
  return doc;
}
function makeStorage(blocked = false) {
  const data = new Map();
  return blocked
    ? { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }
    : { data, getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, v) };
}
function makeWindow(doc, storage, extra = {}) {
  const listeners = {};
  const win = {
    document: doc, localStorage: storage, location: { hash: '', search: '', pathname: '/index.html' },
    addEventListener: (t, fn) => (listeners[t] ||= []).push(fn),
    dispatchEvent: e => { (listeners[e.type] || []).forEach(fn => fn(e)); return true; },
    listeners, ...extra,
  };
  win.window = win;
  return win;
}
module.exports = { makeEl, makeDocument, makeStorage, makeWindow };
