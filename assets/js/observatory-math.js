(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ObservatoryMath = Object.freeze(api);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const finite = (value, label) => {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`${label} must be a finite number.`);
    return number;
  };
  const positive = (value, label) => {
    const number = finite(value, label);
    if (number <= 0) throw new Error(`${label} must be greater than zero.`);
    return number;
  };
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const parseList = (input) => {
    const values = String(input).split(/[\s,;]+/).filter(Boolean).map((value) => Number(value));
    if (values.length < 2 || values.some((value) => !Number.isFinite(value))) {
      throw new Error('Enter at least two valid numbers separated by commas.');
    }
    return values;
  };
  function summarize(values, sample = false) {
    if (!Array.isArray(values) || values.length < (sample ? 2 : 1) || values.some((value) => !Number.isFinite(value))) {
      throw new Error('A valid non-empty numeric data set is required.');
    }
    const average = mean(values);
    const divisor = values.length - (sample ? 1 : 0);
    const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / divisor;
    return { count: values.length, mean: average, median: median(values), min: Math.min(...values), max: Math.max(...values), range: Math.max(...values) - Math.min(...values), variance, standardDeviation: Math.sqrt(variance) };
  }
  function sequence(kind, first, change, count) {
    const a = finite(first, 'First term');
    const step = finite(change, kind === 'geometric' ? 'Common ratio' : 'Common difference');
    const n = Math.floor(finite(count, 'Term count'));
    if (n < 1 || n > 30) throw new Error('Choose between 1 and 30 terms.');
    if (kind === 'fibonacci') {
      const terms = [0, 1];
      while (terms.length < n) terms.push(terms.at(-1) + terms.at(-2));
      return terms.slice(0, n);
    }
    if (kind === 'geometric') return Array.from({ length: n }, (_, index) => a * step ** index);
    return Array.from({ length: n }, (_, index) => a + step * index);
  }
  function seriesSum(kind, first, change, count) {
    const terms = sequence(kind, first, change, count);
    return terms.reduce((sum, value) => sum + value, 0);
  }
  function compoundInterest(principal, annualRatePercent, years, compoundsPerYear = 1) {
    const p = positive(principal, 'Principal');
    const rate = finite(annualRatePercent, 'Rate');
    const t = positive(years, 'Time');
    const m = positive(compoundsPerYear, 'Compounding periods per year');
    if (rate < 0 || rate > 100 || !Number.isInteger(m)) throw new Error('Use a rate from 0% to 100% and a whole-number compounding frequency.');
    const amount = p * (1 + rate / (100 * m)) ** (m * t);
    return { amount, interest: amount - p, periods: m * t, periodicRate: rate / (100 * m) };
  }
  function loanPayment(principal, ratePerPeriodPercent, periods) {
    const pv = positive(principal, 'Loan amount');
    const n = Math.floor(positive(periods, 'Number of payments'));
    const r = finite(ratePerPeriodPercent, 'Rate per payment period') / 100;
    if (r < 0 || r > 1 || n > 1200) throw new Error('Use a period rate from 0% to 100% and no more than 1,200 payments.');
    return r === 0 ? pv / n : pv * r / (1 - (1 + r) ** -n);
  }
  function futureValueAnnuity(payment, ratePerPeriodPercent, periods, beginning = false) {
    const pmt = positive(payment, 'Payment');
    const n = Math.floor(positive(periods, 'Number of payments'));
    const r = finite(ratePerPeriodPercent, 'Rate per payment period') / 100;
    if (r < 0 || r > 1 || n > 1200) throw new Error('Use a period rate from 0% to 100% and no more than 1,200 payments.');
    const ordinary = r === 0 ? pmt * n : pmt * (((1 + r) ** n - 1) / r);
    return ordinary * (beginning ? 1 + r : 1);
  }
  function presentValueAnnuity(payment, ratePerPeriodPercent, periods, beginning = false) {
    const pmt = positive(payment, 'Payment');
    const n = Math.floor(positive(periods, 'Number of payments'));
    const r = finite(ratePerPeriodPercent, 'Rate per payment period') / 100;
    if (r < 0 || r > 1 || n > 1200) throw new Error('Use a period rate from 0% to 100% and no more than 1,200 payments.');
    const ordinary = r === 0 ? pmt * n : pmt * ((1 - (1 + r) ** -n) / r);
    return ordinary * (beginning ? 1 + r : 1);
  }
  function priceChange(price, markupPercent, discountPercent, vatPercent) {
    const original = positive(price, 'Original price');
    const markup = finite(markupPercent, 'Markup');
    const discount = finite(discountPercent, 'Discount');
    const vat = finite(vatPercent, 'VAT');
    if ([markup, discount, vat].some((value) => value < 0 || value > 100)) throw new Error('Percentages must be from 0% to 100%.');
    const marked = original * (1 + markup / 100);
    const discounted = marked * (1 - discount / 100);
    return { marked, discounted, vatAmount: discounted * vat / 100, finalPrice: discounted * (1 + vat / 100) };
  }
  function wagePay({ hourlyRate, regularHours, overtimeHours = 0, overtimeMultiplier = 1.5, allowance = 0, commission = 0, piecework = 0 }) {
    const rate = positive(hourlyRate, 'Hourly rate');
    const hours = finite(regularHours, 'Regular hours');
    const overtime = finite(overtimeHours, 'Overtime hours');
    const multiplier = positive(overtimeMultiplier, 'Overtime multiplier');
    const extra = finite(allowance, 'Allowance') + finite(commission, 'Commission') + finite(piecework, 'Piecework pay');
    if (hours < 0 || overtime < 0 || extra < 0) throw new Error('Hours and additional pay cannot be negative.');
    const regularPay = rate * hours;
    const overtimePay = rate * multiplier * overtime;
    return { regularPay, overtimePay, additionalPay: extra, grossPay: regularPay + overtimePay + extra };
  }
  function geometry(shape, a, b = 0, c = 0) {
    const x = positive(a, 'Dimension');
    if (shape === 'sphere') return { volume: (4 / 3) * Math.PI * x ** 3, surfaceArea: 4 * Math.PI * x ** 2, unit: 'radius' };
    if (shape === 'cylinder') {
      const h = positive(b, 'Height');
      return { volume: Math.PI * x ** 2 * h, surfaceArea: 2 * Math.PI * x * (x + h), unit: 'radius and height' };
    }
    if (shape === 'cone') {
      const h = positive(b, 'Height');
      const slant = Math.hypot(x, h);
      return { volume: Math.PI * x ** 2 * h / 3, surfaceArea: Math.PI * x * (x + slant), unit: 'radius and height' };
    }
    if (shape === 'square-pyramid') {
      const side = x; const h = positive(b, 'Height'); const slant = Math.hypot(h, side / 2);
      return { volume: side ** 2 * h / 3, surfaceArea: side ** 2 + 2 * side * slant, unit: 'square base side and height' };
    }
    if (shape === 'triangular-prism') {
      const side = x; const prismLength = positive(b, 'Prism length'); const triangleHeight = positive(c, 'Triangle height');
      const area = side * triangleHeight / 2;
      const equalSide = Math.hypot(side / 2, triangleHeight);
      return { volume: area * prismLength, surfaceArea: (side + 2 * equalSide) * prismLength + 2 * area, unit: 'isosceles triangle base, prism length, and triangle height' };
    }
    const width = positive(b, 'Width');
    const height = positive(c, 'Height');
    return { volume: x * width * height, surfaceArea: 2 * (x * width + x * height + width * height), unit: 'length, width, and height' };
  }
  function triangleAreaHeron(a, b, c) {
    const x = positive(a, 'Side a'); const y = positive(b, 'Side b'); const z = positive(c, 'Side c');
    if (x + y <= z || x + z <= y || y + z <= x) throw new Error('These side lengths cannot form a triangle.');
    const s = (x + y + z) / 2;
    return Math.sqrt(s * (s - x) * (s - y) * (s - z));
  }
  function discreteDistribution(values, probabilities) {
    if (!values.length || values.length !== probabilities.length) throw new Error('Provide matching value and probability lists.');
    const p = probabilities.map((value) => finite(value, 'Probability'));
    if (p.some((value) => value < 0 || value > 1)) throw new Error('Each probability must be between 0 and 1.');
    const total = p.reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 1) > 1e-9) throw new Error('Probabilities must sum to 1.');
    const expectedValue = values.reduce((sum, value, index) => sum + finite(value, 'Random-variable value') * p[index], 0);
    const variance = values.reduce((sum, value, index) => sum + p[index] * (value - expectedValue) ** 2, 0);
    return { expectedValue, variance, standardDeviation: Math.sqrt(variance), totalProbability: total };
  }
  function normalPdf(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
  function normalCdf(z) {
    const x = finite(z, 'z-score');
    const abs = Math.abs(x) / Math.sqrt(2);
    const t = 1 / (1 + 0.3275911 * abs);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-abs * abs);
    return Math.max(0, Math.min(1, 0.5 * (1 + (x < 0 ? -erf : erf))));
  }
  function zScore(value, meanValue, standardDeviation) {
    const sd = positive(standardDeviation, 'Standard deviation');
    return (finite(value, 'Value') - finite(meanValue, 'Mean')) / sd;
  }
  function linearRegression(xValues, yValues) {
    if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length || xValues.length < 2) throw new Error('Provide at least two paired observations.');
    const x = xValues.map((value) => finite(value, 'x value'));
    const y = yValues.map((value) => finite(value, 'y value'));
    const xMean = mean(x); const yMean = mean(y);
    const xx = x.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
    const yy = y.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
    if (xx === 0 || yy === 0) throw new Error('Both variables need to vary to calculate correlation.');
    const xy = x.reduce((sum, value, index) => sum + (value - xMean) * (y[index] - yMean), 0);
    const slope = xy / xx;
    return { slope, intercept: yMean - slope * xMean, correlation: xy / Math.sqrt(xx * yy), count: x.length };
  }
  function piecewiseFare(distance, base = 30, includedDistance = 2, perKm = 12) {
    const d = finite(distance, 'Distance');
    const baseFare = positive(base, 'Base fare');
    const included = finite(includedDistance, 'Included distance');
    const extra = positive(perKm, 'Fare per extra kilometre');
    if (d < 0 || included < 0) throw new Error('Distance and included distance cannot be negative.');
    return baseFare + Math.max(0, d - included) * extra;
  }
  function truthTable(operator) {
    const rows = [];
    for (const p of [true, false]) for (const q of [true, false]) {
      let result;
      if (operator === 'and') result = p && q;
      else if (operator === 'or') result = p || q;
      else if (operator === 'conditional') result = !p || q;
      else if (operator === 'biconditional') result = p === q;
      else if (operator === 'xor') result = p !== q;
      else throw new Error('Choose and, or, conditional, biconditional, or xor.');
      rows.push({ p, q, result });
    }
    return rows;
  }
  function scaleDistance(mapDistance, scaleDenominator) {
    const mapValue = positive(mapDistance, 'Map distance');
    const denominator = positive(scaleDenominator, 'Scale denominator');
    return mapValue * denominator;
  }
  function convertTemperature(value, from, to) {
    const temp = finite(value, 'Temperature');
    const celsius = from === 'F' ? (temp - 32) * 5 / 9 : from === 'K' ? temp - 273.15 : temp;
    if (from === to) return temp;
    if (to === 'F') return celsius * 9 / 5 + 32;
    if (to === 'K') return celsius + 273.15;
    return celsius;
  }
  function rightTriangleHypotenuse(a, b) {
    const x = positive(a, 'Leg a');
    const y = positive(b, 'Leg b');
    const c = Math.hypot(x, y);
    return { a: x, b: y, c, squares: { a2: x * x, b2: y * y, c2: c * c }, area: x * y / 2 };
  }
  function triangleBaseHeight(base, height) {
    const b = positive(base, 'Base');
    const h = positive(height, 'Height');
    return { base: b, height: h, area: b * h / 2 };
  }
  function solveRightTriangle(target, a, b, c) {
    // Mirrors visualizers/2d.html targetVar mechanics: solve for one side
    // while the other two are given. Solved field is display-only.
    if (target === 'a') {
      const y = positive(b, 'Side b');
      const hyp = positive(c, 'Hypotenuse');
      if (hyp <= y) throw new Error('Hypotenuse must exceed side b to solve for side a.');
      const x = Math.sqrt(hyp * hyp - y * y);
      return { a: x, b: y, c: hyp, squares: { a2: x * x, b2: y * y, c2: hyp * hyp }, area: x * y / 2 };
    }
    if (target === 'b') {
      const x = positive(a, 'Side a');
      const hyp = positive(c, 'Hypotenuse');
      if (hyp <= x) throw new Error('Hypotenuse must exceed side a to solve for side b.');
      const y = Math.sqrt(hyp * hyp - x * x);
      return { a: x, b: y, c: hyp, squares: { a2: x * x, b2: y * y, c2: hyp * hyp }, area: x * y / 2 };
    }
    return rightTriangleHypotenuse(a, b);
  }
  function solveTriangleDimension(solveFor, first, second) {
    // Mirrors visualizers/triangle-area-explorer.html modeConfigs:
    // area: A = b*h/2; base: b = 2A/h; height: h = 2A/b.
    if (solveFor === 'base') {
      const h = positive(first, 'Height');
      const areaValue = positive(second, 'Area');
      return { base: (2 * areaValue) / h, height: h, area: areaValue };
    }
    if (solveFor === 'height') {
      const b = positive(first, 'Base');
      const areaValue = positive(second, 'Area');
      return { base: b, height: (2 * areaValue) / b, area: areaValue };
    }
    return triangleBaseHeight(first, second);
  }
  function solveObliqueTriangle(caseName, v1, v2, v3) {
    const rad = (d) => (d * Math.PI) / 180;
    const deg = (r) => (r * 180) / Math.PI;
    let a, b, c, A, B, C;
    if (caseName === 'SSS') {
      a = positive(v1, 'Side a'); b = positive(v2, 'Side b'); c = positive(v3, 'Side c');
      if (a + b <= c || a + c <= b || b + c <= a) throw new Error('Triangle Inequality Violation: the sum of any two sides must exceed the third side.');
      A = deg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
      B = deg(Math.acos((a * a + c * c - b * b) / (2 * a * c)));
      C = 180 - A - B;
    } else if (caseName === 'SAS') {
      a = positive(v1, 'Side a'); C = finite(v2, 'Included angle'); b = positive(v3, 'Side b');
      if (C <= 0 || C >= 180) throw new Error('Angle must be between 0° and 180°.');
      c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(C)));
      A = deg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
      B = 180 - A - C;
    } else if (caseName === 'ASA') {
      A = finite(v1, 'Angle A'); c = positive(v2, 'Side c'); B = finite(v3, 'Angle B');
      if (A <= 0 || B <= 0 || A + B >= 180) throw new Error('Angle Violation: A + B must stay below 180°.');
      C = 180 - A - B;
      a = (c * Math.sin(rad(A))) / Math.sin(rad(C));
      b = (c * Math.sin(rad(B))) / Math.sin(rad(C));
    } else if (caseName === 'AAS') {
      A = finite(v1, 'Angle A'); B = finite(v2, 'Angle B'); a = positive(v3, 'Side a');
      if (A <= 0 || B <= 0 || A + B >= 180) throw new Error('Angle Violation: A + B must stay below 180°.');
      C = 180 - A - B;
      b = (a * Math.sin(rad(B))) / Math.sin(rad(A));
      c = (a * Math.sin(rad(C))) / Math.sin(rad(A));
    } else if (caseName === 'SSA') {
      a = positive(v1, 'Side a'); b = positive(v2, 'Side b'); A = finite(v3, 'Angle A');
      if (A <= 0 || A >= 180) throw new Error('Angle must be between 0° and 180°.');
      const sinB = (b * Math.sin(rad(A))) / a;
      if (sinB > 1) throw new Error('Impossible configuration: side a is too short to close the triangle (sin B > 1).');
      B = deg(Math.asin(Math.min(1, sinB)));
      C = 180 - A - B;
      if (C <= 0) throw new Error('Impossible configuration: the angles leave no room for angle C.');
      c = (a * Math.sin(rad(C))) / Math.sin(rad(A));
    } else {
      throw new Error('Choose right-triangle, SSS, SAS, ASA, AAS, or SSA.');
    }
    if ([a, b, c, A, B, C].some((value) => !Number.isFinite(value))) throw new Error('These values do not form a valid triangle.');
    const perimeter = a + b + c;
    const s = perimeter / 2;
    const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    let classification = 'Acute';
    if (A > 90.1 || B > 90.1 || C > 90.1) classification = 'Obtuse';
    else if (Math.abs(A - 90) < 0.5 || Math.abs(B - 90) < 0.5 || Math.abs(C - 90) < 0.5) classification = 'Right';
    return { a, b, c, A, B, C, perimeter, area, classification };
  }
  function answersEquivalent(entered, expected) {
    const normalize = (value) => String(value).trim().toLowerCase().replace(/\s+/g, '').replace(/[,$₱€£%]/g, '').replace(/−/g, '-');
    if (normalize(entered) === normalize(expected)) return true;
    const scalar = (value) => {
      const text = String(value).trim().replace(/,/g, '').replace(/[−]/g, '-');
      const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
      if (fraction) return Number(fraction[1]) / Number(fraction[2]);
      const match = text.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i);
      return match ? Number(match[0]) : NaN;
    };
    const a = scalar(entered); const b = scalar(expected);
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.005);
  }
  return { parseList, summarize, sequence, seriesSum, compoundInterest, loanPayment, futureValueAnnuity, presentValueAnnuity, priceChange, wagePay, geometry, triangleAreaHeron, rightTriangleHypotenuse, triangleBaseHeight, solveRightTriangle, solveTriangleDimension, solveObliqueTriangle, discreteDistribution, normalPdf, normalCdf, zScore, linearRegression, piecewiseFare, truthTable, scaleDistance, convertTemperature, answersEquivalent };
});
