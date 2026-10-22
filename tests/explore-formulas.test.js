const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// explore.js is a classic script; run it with a stub DOM and read its top-level data.
const read = (f) => fs.readFileSync(path.join(__dirname, '../assets/js', f), 'utf8');
const source = read('explore-formulas.js');
const context = vm.createContext({ document: { addEventListener() {} }, window: {}, console });
vm.runInContext(source, context);
vm.runInContext(read('explore.js'), context); // must load cleanly against the exposed globals
const { FORMULA_LIBRARY, plainMath } = context.window.ExploreFormulas;

test('formula ids are unique and every formula yields well-formed examples', () => {
  assert.ok(FORMULA_LIBRARY.length > 0);
  assert.equal(new Set(FORMULA_LIBRARY.map((f) => f.id)).size, FORMULA_LIBRARY.length);
  for (const formula of FORMULA_LIBRARY) {
    for (let i = 0; i < 10; i += 1) {
      const ex = formula.generateExample(i);
      assert.ok(Number.isFinite(ex.answer), `${formula.id}#${i} answer`);
      assert.ok(ex.question && ex.steps.length, `${formula.id}#${i} content`);
    }
  }
});

test('plainMath strips LaTeX for the KaTeX-less fallback', () => {
  assert.equal(plainMath('\\frac{a}{b}\\times\\text{x}'), '(a) ÷ (b)×x');
});
