const assert = require('node:assert/strict');
const test = require('node:test');
const M = require('../assets/js/observatory-math');

test('sequence, finite-series, and annuity formulas', () => {
  assert.deepEqual(M.sequence('arithmetic', 3, 2, 5), [3, 5, 7, 9, 11]);
  assert.deepEqual(M.sequence('geometric', 2, 3, 4), [2, 6, 18, 54]);
  assert.deepEqual(M.sequence('fibonacci', 0, 0, 6), [0, 1, 1, 2, 3, 5]);
  assert.equal(M.seriesSum('arithmetic', 1, 1, 10), 55);
  assert.ok(Math.abs(M.futureValueAnnuity(100, 1, 12) - 1268.2503) < 0.01);
  assert.equal(M.presentValueAnnuity(100, 0, 12), 1200);
});

test('finance models compute compound interest, loans, price changes, and wages', () => {
  assert.ok(Math.abs(M.compoundInterest(1000, 5, 10).amount - 1628.8946) < 0.01);
  assert.ok(Math.abs(M.loanPayment(1000, 0, 10) - 100) < 1e-10);
  assert.deepEqual(M.priceChange(100, 20, 10, 12), { marked: 120, discounted: 108, vatAmount: 12.96, finalPrice: 120.96000000000001 });
  assert.equal(M.wagePay({ hourlyRate: 100, regularHours: 40, overtimeHours: 2 }).grossPay, 4300);
  assert.equal(M.piecewiseFare(5, 30, 2, 12), 66);
});

test('descriptive statistics, regression, normal probabilities, and distributions', () => {
  assert.deepEqual(M.summarize([1, 2, 3]), { count: 3, mean: 2, median: 2, min: 1, max: 3, range: 2, variance: 2 / 3, standardDeviation: Math.sqrt(2 / 3) });
  const line = M.linearRegression([1, 2, 3], [3, 5, 7]);
  assert.equal(line.slope, 2); assert.equal(line.intercept, 1); assert.equal(line.correlation, 1);
  assert.equal(M.zScore(70, 60, 5), 2);
  assert.ok(Math.abs(M.normalCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(M.normalCdf(1) - 0.84134) < 1e-4);
  assert.deepEqual(M.discreteDistribution([0, 1], [0.5, 0.5]), { expectedValue: 0.5, variance: 0.25, standardDeviation: 0.5, totalProbability: 1 });
});

test('geometry and triangle models validate dimensions and calculate measures', () => {
  assert.deepEqual(M.geometry('rectangular-prism', 2, 3, 4), { volume: 24, surfaceArea: 52, unit: 'length, width, and height' });
  assert.ok(Math.abs(M.geometry('cylinder', 2, 3).volume - 12 * Math.PI) < 1e-10);
  assert.ok(Math.abs(M.geometry('cone', 2, 3).volume - 4 * Math.PI) < 1e-10);
  assert.ok(Math.abs(M.geometry('triangular-prism', 6, 10, 4).surfaceArea - (6 + 2 * 5) * 10 - 24) < 1e-10);
  assert.ok(Math.abs(M.triangleAreaHeron(3, 4, 5) - 6) < 1e-10);
  assert.throws(() => M.triangleAreaHeron(1, 2, 9), /cannot form a triangle/);
  assert.throws(() => M.geometry('cylinder', 2, 0), /greater than zero/);
});


test('right-triangle, base-height, and oblique-triangle solvers', () => {
  const right = M.rightTriangleHypotenuse(6, 8);
  assert.equal(right.c, 10);
  assert.deepEqual(right.squares, { a2: 36, b2: 64, c2: 100 });
  assert.equal(right.area, 24);
  assert.equal(M.triangleBaseHeight(10, 4).area, 20);
  const sss = M.solveObliqueTriangle('SSS', 6, 7, 8);
  assert.equal(sss.classification, 'Acute');
  assert.ok(Math.abs(sss.A + sss.B + sss.C - 180) < 1e-9);
  assert.ok(Math.abs(sss.area - 20.333) < 0.01);
  const sas = M.solveObliqueTriangle('SAS', 6, 75.5, 7);
  assert.ok(Math.abs(sas.A + sas.B + sas.C - 180) < 1e-9);
  const asa = M.solveObliqueTriangle('ASA', 46.6, 8, 57.9);
  assert.ok(Math.abs(asa.C - 75.5) < 0.01);
  const aas = M.solveObliqueTriangle('AAS', 46.6, 57.9, 6);
  assert.ok(aas.c > 0 && Math.abs(aas.A + aas.B + aas.C - 180) < 1e-9);
  const ssa = M.solveObliqueTriangle('SSA', 6, 7, 46.6);
  assert.ok(Math.abs(ssa.A + ssa.B + ssa.C - 180) < 1e-9);
  assert.throws(() => M.solveObliqueTriangle('SSS', 1, 2, 9), /Triangle Inequality/);
  assert.throws(() => M.solveObliqueTriangle('ASA', 100, 5, 90), /below 180/);
  assert.throws(() => M.solveObliqueTriangle('SSA', 2, 10, 30), /too short/);
});

test('target-variable right-triangle and base/height solvers mirror the prototypes', () => {
  const solveA = M.solveRightTriangle('a', 6, 5.8, 8.4);
  assert.ok(Math.abs(solveA.a ** 2 + 5.8 ** 2 - 8.4 ** 2) < 1e-9);
  assert.equal(solveA.b, 5.8);
  assert.equal(solveA.c, 8.4);
  const solveB = M.solveRightTriangle('b', 6.1, 5.8, 8.4);
  assert.ok(Math.abs(6.1 ** 2 + solveB.b ** 2 - 8.4 ** 2) < 1e-9);
  const solveC = M.solveRightTriangle('c', 6, 8, 0);
  assert.equal(solveC.c, 10);
  assert.equal(solveC.area, 24);
  assert.throws(() => M.solveRightTriangle('a', 6, 9, 8.4), /Hypotenuse must exceed side b/);
  assert.throws(() => M.solveRightTriangle('b', 9, 5, 8.4), /Hypotenuse must exceed side a/);
  assert.equal(M.solveTriangleDimension('area', 10, 6).area, 30);
  assert.equal(M.solveTriangleDimension('base', 6, 30).base, 10);
  assert.equal(M.solveTriangleDimension('height', 10, 30).height, 6);
  assert.throws(() => M.solveTriangleDimension('base', 0, 30), /greater than zero/);
});

test('measurement, logic, and answer checking helpers', () => {
  assert.equal(M.convertTemperature(32, 'F', 'C'), 0);
  assert.equal(M.scaleDistance(3, 1000), 3000);
  assert.deepEqual(M.truthTable('conditional').map(row => row.result), [true, false, true, true]);
  assert.equal(M.answersEquivalent('$1,234.50', '1234.5'), true);
  assert.equal(M.answersEquivalent('1/2', '0.5'), true);
  assert.equal(M.answersEquivalent('9', '10'), false);
});

test('invalid calculator inputs are rejected instead of producing misleading results', () => {
  assert.throws(() => M.parseList('1, nope'), /valid numbers/);
  assert.throws(() => M.discreteDistribution([0, 1], [0.4, 0.4]), /sum to 1/);
  assert.throws(() => M.zScore(4, 3, 0), /greater than zero/);
  assert.throws(() => M.sequence('arithmetic', 1, 1, 0), /between 1 and 30/);
});

test('interactive workspaces expose curriculum studies and working experiment selectors', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  const visualize = fs.readFileSync(path.join(root, 'visualize.html'), 'utf8');
  const laboratory = fs.readFileSync(path.join(root, 'laboratory.html'), 'utf8');
  const visualizeScript = fs.readFileSync(path.join(root, 'assets/js/visualize.js'), 'utf8');
  const labScript = fs.readFileSync(path.join(root, 'assets/js/laboratory.js'), 'utf8');
  assert.equal((visualize.match(/<option value=/g) || []).length, 24);
  assert.equal((laboratory.match(/<option value=/g) || []).length, 14);
  assert.match(visualizeScript, /linearRegression/);
  assert.match(visualizeScript, /truthTable/);
  assert.match(visualizeScript, /cube-root/);
  assert.match(visualizeScript, /Σₙ/);
  assert.match(labScript, /sampling/);
  assert.match(labScript, /compare-interest/);
  assert.match(labScript, /Heron's formula/);
  assert.match(labScript, /data-lab-experiment/);
});
