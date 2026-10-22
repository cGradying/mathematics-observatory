const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const M = require('../assets/js/observatory-math');

const root = path.resolve(__dirname, '..');

class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.listeners = {};
    this.style = {}; this.dataset = {}; this.hidden = false; this.value = ''; this.textContent = ''; this.href = '';
    const classes = new Set();
    this.classList = { toggle: (name, force) => { const enabled = force ?? !classes.has(name); enabled ? classes.add(name) : classes.delete(name); return enabled; }, add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) };
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  scrollIntoView() { this.scrolledIntoView = true; }
  focus() { this.focused = true; }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  dispatch(name) { const event={type:name,target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};for (const listener of this.listeners[name] || []) listener(event);return event; }
  dispatchEvent(event) { event.target=this;for(const listener of this.listeners[event.type]||[])listener(event);return !event.defaultPrevented; }
  querySelectorAll(selector) { return this.children.flatMap(child => [((selector === 'input,select' || selector === 'input, select') && ['INPUT','SELECT'].includes(child.tagName)) ? child : null, ...child.querySelectorAll(selector)].filter(Boolean)); }
}

function createVisualizeRuntime() {
  const html = fs.readFileSync(path.join(root, 'visualize.html'), 'utf8');
  const ids = ['viz-topic','viz-topic-controls','viz-chart','viz-line','viz-area','viz-point','viz-markers','viz-study-title','viz-study-description','viz-equation','viz-rule-label','viz-rule-panel','viz-formula-reference','viz-output','viz-point-readout','viz-reset','viz-alt-visual','viz-metrics'];
  const nodes = Object.fromEntries(ids.map(id => [id, new Element(id === 'viz-topic' ? 'select' : 'div')]));
  nodes['visual-workspace'] = new Element('section');
  const axis = new Element('path'); const caption = new Element(); const chartWrap = new Element(); const ticks = new Element('g'); const gridLines = new Element('g');
  const topicOptions = [...html.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]);
  nodes['viz-topic'].value = topicOptions[0];
  nodes['viz-chart'].setAttribute = nodes['viz-chart'].setAttribute.bind(nodes['viz-chart']);
  const filters = ['all','functions','sequences','data','finance'].map(value => { const el=new Element('button');el.dataset.vizFilter=value;return el; });
  const entries = ['functions','sequences','data','finance'].map(value => { const el=new Element('article');el.dataset.vizCategory=value;const link=new Element('a');link.className='study-action';el.append(link);el.querySelector=selector=>selector==='.study-action'?link:null;return el; });
  function findById(id) { return nodes[id] || nodes['viz-topic-controls'].querySelectorAll('input,select').find(item => item.id === id) || null; }
  const document = {
    querySelector(selector) { if (selector.startsWith('#')) return selector === '#viz-grid-lines' ? gridLines : findById(selector.slice(1)); if (selector === '.viz-axis') return axis; if (selector === '.viz-ticks') return ticks; if (selector === '.viz-chart-caption') return caption; if (selector === '.viz-chart-wrap') return chartWrap; return null; },
    querySelectorAll(selector) { if (selector === '[data-viz-filter]') return filters; if (selector === '[data-viz-category]') return entries; return []; },
    createElement(tag) { return new Element(tag); },
    createElementNS(_namespace, tag) { return new Element(tag); },
  };
  const browserWindow = { ObservatoryMath: M };
  const context = { window: browserWindow, document, Intl, Number, Math, Array, String, Error, Event:class Event { constructor(type,options={}){this.type=type;this.bubbles=options.bubbles??false;this.defaultPrevented=false;} preventDefault(){this.defaultPrevented=true;} }, console };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/visualize.js'), 'utf8'), context, { filename: 'visualize.js' });
  return { nodes, topicOptions, filters, entries, gridLines, ticks, chartWrap, browserWindow };
}

test('all Visualize studies render, respond to input, and reset without uncaught runtime errors', () => {
  const { nodes, topicOptions } = createVisualizeRuntime();
  assert.equal(topicOptions.length, 24);
  for (const value of topicOptions) {
    nodes['viz-topic'].value = value;
    assert.doesNotThrow(() => nodes['viz-topic'].dispatch('change'), `${value} should initialize`);
    assert.notEqual(nodes['viz-output'].textContent, '—', `${value} should calculate with example values: ${nodes['viz-point-readout'].textContent}; controls=${nodes['viz-topic-controls'].querySelectorAll('input,select').map(input => `${input.id}:${input.value}`).join('|')}`);
    const before = nodes['viz-output'].textContent;
    const control = nodes['viz-topic-controls'].querySelectorAll('input,select')[0];
    if (control && control.tagName === 'INPUT' && control.type === 'number') {
      control.value = String(Number(control.value) + 1);
      assert.doesNotThrow(() => control.dispatch('input'), `${value} should update on input`);
    }
    assert.doesNotThrow(() => nodes['viz-reset'].dispatch('click'), `${value} should reset`);
    assert.notEqual(nodes['viz-output'].textContent, '—', `${value} should recalculate after reset (initial ${before})`);
  }
});

test('linear function inspection marker tracks x and undefined square-root inputs are safe', () => {
  const { nodes } = createVisualizeRuntime();
  assert.equal(nodes['viz-equation'].textContent, 'y = x');
  const slopeDefault = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-slope');
  assert.equal(slopeDefault.value, 1);
  assert.equal(slopeDefault.min, -5);
  assert.equal(slopeDefault.max, 5);
  assert.equal(slopeDefault.step, 0.0001);
  const markerBefore = nodes['viz-point'].attributes.cx;
  const xInput = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-x');
  xInput.value = '4'; xInput.dispatch('input');
  assert.notEqual(nodes['viz-point'].attributes.cx, markerBefore);
  nodes['viz-topic'].value = 'root'; nodes['viz-topic'].dispatch('change');
  const rootX = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-x');
  assert.equal(rootX.value, 2);
  assert.equal(rootX.min, 0);
  assert.equal(rootX.max, 5);
  assert.equal(rootX.step, 0.25);
  rootX.value = '-2'; rootX.dispatch('input');
  assert.match(nodes['viz-output'].textContent, /undefined/);
  assert.equal(nodes['viz-point'].style.display, 'none');
});

test('linear slope range, signed angle, and intercept metrics match the standalone visualizer', () => {
  const { nodes, gridLines, ticks } = createVisualizeRuntime();
  const slope = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-slope');
  assert.equal(slope.min, -5);
  assert.equal(slope.max, 5);
  assert.equal(slope.step, 0.0001);
  assert.ok(gridLines.children.length >= 10, 'linear plot should draw coordinate grid lines');
  assert.ok(gridLines.children.some(path => path.attributes.class.includes('viz-grid-line-minor')), 'linear plot should draw finer subdivision lines');
  assert.ok(gridLines.children.some(path => path.attributes.class.includes('viz-grid-line-major')), 'linear plot should distinguish major grid lines');
  assert.ok(ticks.children.length >= 10, 'linear plot should label its coordinate grid');
  const verticals = gridLines.children.map(path => path.attributes.d).filter(d => /V 370$/.test(d)).map(d => Number(d.match(/^M ([\d.]+)/)?.[1]));
  const horizontals = gridLines.children.map(path => path.attributes.d).filter(d => /H 660$/.test(d)).map(d => Number(d.match(/M 60 ([\d.]+)/)?.[1]));
  assert.ok(Math.abs(Math.abs(verticals[1] - verticals[0]) - Math.abs(horizontals[1] - horizontals[0])) < 1e-6, 'linear grid cells should be square in graph coordinates');
  assert.match(nodes['viz-line'].attributes.d, /^M 60 /);
  const lineEnd = nodes['viz-line'].attributes.d.match(/L ([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?) ([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*$/i);
  assert.ok(lineEnd && Number(lineEnd[1]) > 659.9, 'linear graph should extend to the right plot bound');
  slope.value = '1.6666667'; slope.dispatch('input');
  const rise = nodes['viz-markers'].children.find(marker => marker.attributes.class?.includes('viz-rise-label'));
  assert.equal(rise.textContent, 'Rise: 5', 'fine slope adjustments should allow a displayed rise of exactly 5');
  slope.value = '-2.4';
  nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-intercept').value = '0';
  nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-intercept').dispatch('input');
  const values = nodes['viz-metrics'].children.map(card => card.children[1].textContent);
  assert.deepEqual(values, ['(0, 0)', '(0, 0)', '-67.38°']);
  slope.value = '5'; slope.dispatch('input');
  assert.equal(nodes['viz-metrics'].children[2].children[1].textContent, '78.69°');
  const rise15Marker = nodes['viz-markers'].children.find(marker => marker.attributes.class.includes('viz-sample'));
  assert.ok(rise15Marker && Math.abs(Number(rise15Marker.attributes.cy) - 40) < 1e-6, 'rise 15 sample should sit on the expanded top grid line');
  const originLabel = nodes['viz-markers'].children.find(marker => marker.textContent === '(0, 0)');
  const originLabelBackground = nodes['viz-markers'].children.find(marker => marker.attributes.class === 'viz-marker-label-bg');
  const runLabel = nodes['viz-markers'].children.find(marker => marker.attributes.class?.includes('viz-run-label'));
  const equationTag = nodes['viz-markers'].children.find(marker => marker.attributes.class === 'viz-equation-tag-bg');
  assert.ok(['start','end','middle'].includes(originLabel.attributes['text-anchor']), 'origin coordinates should use a deliberate placement');
  assert.ok(originLabelBackground && Number(originLabelBackground.attributes.width) > 0, 'origin coordinates should have a solid backing for readability');
  assert.ok(Number(runLabel.attributes.y) > Number(originLabel.attributes.y), 'run label should sit below the axis, clear of the origin coordinates');
  assert.ok(Number(equationTag.attributes.y) >= 40, 'equation tag should remain inside the plot at the top edge');
  assert.match(fs.readFileSync(path.join(root, 'visualize.html'), 'utf8'), /clip-path="url\(#viz-plot-clip\)"/);
});

test('linear rule pretty-prints like the prototype and horizontal lines keep the run indicator', () => {
  const { nodes } = createVisualizeRuntime();
  assert.equal(nodes['viz-equation'].textContent, 'y = x');
  const slope = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-slope');
  const intercept = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-intercept');
  slope.value = '-1'; slope.dispatch('input');
  intercept.value = '2'; intercept.dispatch('input');
  assert.equal(nodes['viz-equation'].textContent, 'y = −x + 2');
  slope.value = '0'; slope.dispatch('input');
  assert.equal(nodes['viz-equation'].textContent, 'y = 2');
  assert.ok(nodes['viz-markers'].children.some(marker => marker.attributes.class?.includes('viz-run')), 'horizontal line should still draw the run indicator like the prototype');
});

test('quadratic nature uses prototype colors and the a = 0 line keeps its intercept marker', () => {
  const { nodes } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'quadratic'; nodes['viz-topic'].dispatch('change');
  const nature = () => nodes['viz-metrics'].children.find(card => card.children[0].textContent === 'Nature of roots').children[1];
  assert.equal(nature().style.color, '#22c55e');
  const b = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-b');
  b.value = '0'; b.dispatch('input');
  const c = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-c');
  c.value = '1'; c.dispatch('input');
  assert.equal(nature().style.color, '#dc2626');
  const a = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-a');
  a.value = '0'; a.dispatch('input');
  assert.ok(nodes['viz-markers'].children.some(marker => marker.attributes.class?.includes('viz-intercept')), 'degenerate a = 0 line should keep the y-intercept dot like the prototype');
});

test('square-root readout names the parent function like the prototype badge', () => {
  const { nodes } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'root'; nodes['viz-topic'].dispatch('change');
  assert.match(nodes['viz-point-readout'].textContent, /Parent: y = √x/);
});

test('linear presets do not include the removed Rise 5 button', () => {
  const { nodes } = createVisualizeRuntime();
  const presets = nodes['viz-topic-controls'].children.at(-1);
  assert.ok(!presets.children.some(control => control.textContent === 'Rise 5 (run 3)'));
  assert.ok(presets.children.some(control => control.textContent === 'Identity (y = x)'));
  assert.ok(presets.children.some(control => control.textContent === 'Horizontal (y = 2)'));
});

test('quadratic vertex and y-intercept labels use translucent grey backings', () => {
  const { nodes, gridLines, ticks } = createVisualizeRuntime();
  assert.equal(nodes['viz-rule-panel'].hidden, true, 'rule and formula panel should be hidden for the default linear study');
  nodes['viz-topic'].value = 'quadratic'; nodes['viz-topic'].dispatch('change');
  const labels = nodes['viz-markers'].children.filter(marker => marker.attributes.class?.includes('viz-intercept-label'));
  const backgrounds = nodes['viz-markers'].children.filter(marker => marker.attributes.class === 'viz-marker-label-bg');
  const rootLabels = nodes['viz-markers'].children.filter(marker => marker.attributes.class?.includes('viz-root-label'));
  const plottedDots = nodes['viz-markers'].children.filter(marker => marker.attributes.class?.includes('viz-marker '));
  assert.ok(labels.some(label => label.textContent.startsWith('V(')), 'quadratic vertex should be labeled');
  assert.ok(labels.some(label => label.textContent.startsWith('(0,')), 'quadratic y-intercept should be labeled');
  assert.deepEqual(rootLabels.map(label => label.textContent).sort(), ['x = -1', 'x = 3'], 'real roots should be identified separately from x-axis tick values');
  assert.ok(rootLabels.every(label => Math.abs(Number(label.attributes.y) - 227) > 20), 'root labels should be offset from the x-axis tick labels');
  const vertexLabel = labels.find(label => label.textContent.startsWith('V('));
  const interceptLabel = labels.find(label => label.textContent.startsWith('(0,'));
  assert.ok(Math.abs(Number(vertexLabel.attributes.y) - Number(interceptLabel.attributes.y)) > 24, 'vertex and y-intercept annotations should not share a text baseline');
  assert.equal(nodes['viz-formula-reference'].hidden, false, 'quadratic study should show the reference formula');
  assert.equal(nodes['viz-rule-panel'].hidden, false, 'quadratic study should show its complete rule panel');
  const pageMarkup = fs.readFileSync(path.join(root, 'visualize.html'), 'utf8');
  assert.match(pageMarkup, /viz-fraction-numerator[^>]*>−b ± √\(b² − 4ac\)/);
  assert.match(pageMarkup, /viz-fraction-denominator[^>]*>2a</);
  assert.equal(nodes['viz-point'].style.display, 'none', 'quadratic study should show only its four named points');
  assert.equal(plottedDots.length, 4, 'quadratic study should draw only two roots, the y-intercept, and vertex');
  assert.equal(backgrounds.length, 4, 'vertex, y-intercept, and both root labels should have backings');
  assert.ok(gridLines.children.some(path => path.attributes.d.includes('V 370')), 'quadratic graph should draw its fixed coordinate grid');
  assert.ok(ticks.children.some(label => label.textContent === '10'), 'quadratic graph should retain the prototype’s -10 to 10 view');
  assert.ok(nodes['viz-markers'].children.some(marker => marker.attributes.class === 'viz-marker-line'), 'quadratic graph should show the axis of symmetry');
  assert.match(fs.readFileSync(path.join(root, 'assets/css/visualize.css'), 'utf8'), /\.viz-marker-label-bg\s*\{[^}]*fill-opacity:\s*\.58/s);
});

test('quadratic annotations move to avoid collisions for shifted roots and vertex', () => {
  const { nodes, ticks } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'quadratic'; nodes['viz-topic'].dispatch('change');
  const b = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-b');
  b.value = '-3'; b.dispatch('input');
  const badges = nodes['viz-markers'].children.filter(marker => marker.attributes.class === 'viz-marker-label-bg');
  const bounds = badges.map(rect => ({ left:Number(rect.attributes.x), right:Number(rect.attributes.x)+Number(rect.attributes.width), top:Number(rect.attributes.y), bottom:Number(rect.attributes.y)+Number(rect.attributes.height) }));
  for (let i=0;i<bounds.length;i++) for (let j=i+1;j<bounds.length;j++) {
    assert.ok(bounds[i].right<=bounds[j].left || bounds[j].right<=bounds[i].left || bounds[i].bottom<=bounds[j].top || bounds[j].bottom<=bounds[i].top, 'quadratic label badges should not overlap each other');
  }
  for (const tick of ticks.children) {
    const x=Number(tick.attributes.x),y=Number(tick.attributes.y),width=(tick.textContent||'').length*7.5,anchor=tick.attributes['text-anchor']||'start';
    const left=anchor==='end'?x-width:anchor==='middle'?x-width/2:x;
    const tickBox={left:left-3,right:left+width+3,top:y-11,bottom:y+4};
    for (const badge of bounds) assert.ok(badge.right<=tickBox.left || tickBox.right<=badge.left || badge.bottom<=tickBox.top || tickBox.bottom<=badge.top, `quadratic value badge ${JSON.stringify(badge)} overlaps tick ${tick.textContent} ${JSON.stringify(tickBox)}`);
  }
});

test('function-family graph annotations are placed as backed labels on every update', () => {
  const { nodes } = createVisualizeRuntime();
  for (const study of ['linear','absolute','root','cube-root','quadratic']) {
    nodes['viz-topic'].value = study;
    nodes['viz-topic'].dispatch('change');
    const labels = nodes['viz-markers'].children.filter(node => node.tagName === 'TEXT' && node.attributes.class?.includes('viz-marker-label'));
    const backgrounds = nodes['viz-markers'].children.filter(node => node.attributes.class === 'viz-marker-label-bg');
    assert.ok(labels.length > 0, `${study} should retain its graph annotations`);
    assert.equal(backgrounds.length, labels.length, `${study} labels should have readable backing panels`);
    const control = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.tagName === 'INPUT' && input.type === 'number');
    if (control) {
      const original = nodes['viz-line'].attributes.d;
      control.value = String(Number(control.value) + 0.5);
      control.dispatch('input');
      const updated = nodes['viz-line'].attributes.d;
      assert.notEqual(updated, original, `${study} annotations should be recalculated as parameters change`);
    }
  }
});

test('absolute-value study matches the standalone prototype defaults, rule, and presets', () => {
  const { nodes } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'absolute';
  nodes['viz-topic'].dispatch('change');
  const controls = nodes['viz-topic-controls'].querySelectorAll('input,select');
  const stretch = controls.find(input => input.id === 'viz-a');
  assert.equal(stretch.value, 3, 'standalone prototype starts with a = 3');
  assert.equal(nodes['viz-equation'].textContent, 'f(x) = 3|x|');
  assert.equal(nodes['viz-rule-panel'].hidden, false, 'absolute-value study should display its live formula');
  assert.equal(nodes['viz-formula-reference'].hidden, true, 'quadratic reference formula should remain hidden');
  assert.deepEqual(nodes['viz-metrics'].children.map(card => card.children[1].textContent), ['(0, 0)', 'Upward', '3.0']);
  const shifted = nodes['viz-topic-controls'].children.at(-1).children.find(button => button.textContent === 'Inverted & shifted');
  shifted.dispatch('click');
  assert.equal(nodes['viz-equation'].textContent, 'f(x) = −|x − 2| + 3');
  assert.deepEqual(nodes['viz-metrics'].children.map(card => card.children[1].textContent), ['(2, 3)', 'Downward', '1.0']);
  nodes['viz-topic'].value = 'linear';
  nodes['viz-topic'].dispatch('change');
  assert.equal(nodes['viz-rule-panel'].hidden, true, 'absolute-value formula panel should disappear when another study is selected');
});

test('solid geometry replaces the graph in its display area and restores it when switching back', () => {
  const { nodes, browserWindow, chartWrap } = createVisualizeRuntime();
  const rendered = [];
  let disposed = 0;
  browserWindow.createGeometryVisualizer = () => ({ update: settings => rendered.push(settings), dispose: () => disposed++ });
  nodes['viz-topic'].value = 'geometry';
  nodes['viz-topic'].dispatch('change');
  assert.equal(nodes['viz-study-title'].textContent, 'Solid geometry');
  assert.equal(nodes['viz-chart'].hidden, true, '3D geometry should not be drawn as a two-dimensional value chart');
  assert.equal(chartWrap.classList.contains('viz-alt-view-active'), true, 'geometry should take over the shared visualization area');
  assert.equal(nodes['viz-alt-visual'].hidden, false);
  assert.equal(nodes['viz-output'].textContent, 'V 1 units³');
  assert.deepEqual(nodes['viz-metrics'].children.map(card => card.children[1].textContent), ['Cube', '6 units²', '1 units³']);
  assert.deepEqual({ shape:rendered.at(-1).shape, a:rendered.at(-1).a, style:rendered.at(-1).style }, { shape:'cube', a:1, style:'filled' });
  const shapeSelect = nodes['viz-topic-controls'].children[0].children[1];
  shapeSelect.value = 'sphere';
  shapeSelect.dispatch('input');
  assert.equal(nodes['viz-metrics'].children[0].children[1].textContent, 'Sphere');
  assert.match(nodes['viz-metrics'].children[1].children[1].textContent, /12\.566 units²/);
  assert.match(nodes['viz-metrics'].children[2].children[1].textContent, /4\.189 units³/);
  const dims = nodes['viz-topic-controls'].children.at(-1).children;
  dims[0].children[1].value = '2';
  dims[0].children[1].dispatch('input');
  assert.equal(rendered.at(-1).a, 2, 'dimension slider changes should be sent to the 3D renderer');
  const styleSelect = nodes['viz-topic-controls'].children[1].children[1];
  styleSelect.value = 'wireframe';
  styleSelect.dispatch('change');
  assert.equal(rendered.at(-1).style, 'wireframe');
  nodes['viz-topic'].value = 'linear';
  nodes['viz-topic'].dispatch('change');
  assert.equal(nodes['viz-alt-visual'].hidden, true, 'the 3D model should hide when switching back to a graph');
  assert.equal(chartWrap.classList.contains('viz-alt-view-active'), false, 'switching to a graph should restore the graph display mode');
  assert.equal(disposed, 1, 'leaving geometry should dispose its renderer');
});

test('regression renders independent observations with a fitted least-squares line', () => {
  const { nodes } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'regression'; nodes['viz-topic'].dispatch('change');
  assert.equal(nodes['viz-markers'].children.length, 5);
  assert.match(nodes['viz-equation'].textContent, /ŷ = 0\.9 \+ 1\.1x/);
  assert.match(nodes['viz-output'].textContent, /r =/);
});

test('comma-separated statistics and regression values use text controls, not numeric-only inputs', () => {
  const { nodes } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'statistics'; nodes['viz-topic'].dispatch('change');
  const data = nodes['viz-topic-controls'].querySelectorAll('input,select')[0];
  assert.equal(data.type, 'text');
  assert.equal(data.value, '4, 6, 7, 8, 10, 11');
  nodes['viz-topic'].value = 'regression'; nodes['viz-topic'].dispatch('change');
  for (const input of nodes['viz-topic-controls'].querySelectorAll('input,select')) assert.equal(input.type, 'text');
  assert.match(nodes['viz-output'].textContent, /r =/);
});

test('zero-interest loan keeps a valid amortization graph', () => {
  const { nodes } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'loan'; nodes['viz-topic'].dispatch('change');
  const controls = nodes['viz-topic-controls'].querySelectorAll('input,select');
  const rate = controls.find(input => input.id === 'viz-rate');
  rate.value = '0'; rate.dispatch('input');
  assert.match(nodes['viz-output'].textContent, /Total/);
  assert.ok(nodes['viz-line'].attributes.d?.length > 0, 'loan balance path should remain rendered at 0%');
});

test('triangle explorer mirrors the standalone target-solver, area explorer, and oblique solver mechanics', () => {
  const { nodes } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'triangle'; nodes['viz-topic'].dispatch('change');
  const controls = () => nodes['viz-topic-controls'].querySelectorAll('input,select');
  const byId = (id) => controls().find(input => input.id === id);
  assert.equal(nodes['viz-study-title'].textContent, 'Triangle explorer');
  assert.match(nodes['viz-output'].textContent, /^c = /);
  assert.match(nodes['viz-point-readout'].textContent, /Squares: a²/);
  byId('viz-tri-target').value = 'a'; byId('viz-tri-target').dispatch('input');
  assert.match(nodes['viz-output'].textContent, /^a = /);
  assert.equal(byId('viz-tri-a').disabled, true);
  assert.equal(byId('viz-tri-b').disabled, false);
  assert.match(nodes['viz-equation'].textContent, /a = √\(c² − b²\)/);
  byId('viz-tri-mode').value = 'base-height'; byId('viz-tri-mode').dispatch('change');
  assert.match(nodes['viz-output'].textContent, /^Area /);
  byId('viz-tri-solvefor').value = 'base'; byId('viz-tri-solvefor').dispatch('input');
  assert.match(nodes['viz-output'].textContent, /^Base /);
  assert.equal(byId('viz-tri-base').disabled, true);
  assert.match(nodes['viz-equation'].textContent, /b = 2A \/ h/);
  byId('viz-tri-mode').value = 'SSS'; byId('viz-tri-mode').dispatch('change');
  assert.match(nodes['viz-output'].textContent, /Acute/);
  byId('viz-tri-v0').value = '1'; byId('viz-tri-v0').dispatch('input');
  byId('viz-tri-v1').value = '2'; byId('viz-tri-v1').dispatch('input');
  byId('viz-tri-v2').value = '9'; byId('viz-tri-v2').dispatch('input');
  assert.equal(nodes['viz-output'].textContent, '—');
  assert.match(nodes['viz-point-readout'].textContent, /Triangle Inequality/);
  byId('viz-tri-mode').value = 'SSA'; byId('viz-tri-mode').dispatch('change');
  assert.match(nodes['viz-point-readout'].textContent, /Alternate valid configuration/);
});

test('normal study shades the cumulative area and updates it with the z-score', () => {
  const { nodes } = createVisualizeRuntime();
  nodes['viz-topic'].value = 'normal'; nodes['viz-topic'].dispatch('change');
  const initialArea = nodes['viz-area'].attributes.d;
  assert.ok(initialArea?.length > 0, 'left-tail area should be drawn on the standard normal curve');
  const value = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-value');
  value.value = '80'; value.dispatch('input');
  assert.notEqual(nodes['viz-area'].attributes.d, initialArea, 'changing the observed value should move the shaded cutoff');
});

test('invalid and empty inputs show a useful message instead of throwing', () => {
  const { nodes } = createVisualizeRuntime();
  const slope = nodes['viz-topic-controls'].querySelectorAll('input,select').find(input => input.id === 'viz-slope');
  slope.value = ''; assert.doesNotThrow(() => slope.dispatch('input'));
  assert.match(nodes['viz-point-readout'].textContent, /Enter a value for slope/);
  nodes['viz-topic'].value = 'statistics'; nodes['viz-topic'].dispatch('change');
  const dataset = nodes['viz-topic-controls'].querySelectorAll('input,select')[0];
  dataset.value = '1, invalid'; dataset.dispatch('input');
  assert.match(nodes['viz-point-readout'].textContent, /valid numbers/);
});

test('collection cards open and select their matching interactive study', () => {
  const { nodes, entries } = createVisualizeRuntime();
  const expected = { functions:'quadratic', sequences:'sequence', data:'regression', finance:'finance' };
  for (const entry of entries) {
    const link = entry.querySelector('.study-action');
    assert.equal(link.href, '#visual-workspace');
    const click={type:'click',defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};
    link.dispatchEvent(click);
    assert.equal(click.defaultPrevented,true,'the shortcut should keep the visitor on the current page');
    assert.ok(expected[entry.dataset.vizCategory]);
    assert.equal(nodes['viz-topic'].value, expected[entry.dataset.vizCategory]);
    assert.ok(nodes['visual-workspace'].scrolledIntoView);
    assert.ok(nodes['viz-topic'].focused);
  }
});

test('study filters hide and restore cards while synchronizing pressed state', () => {
  const { filters, entries } = createVisualizeRuntime();
  const statistics = filters.find(button => button.dataset.vizFilter === 'data');
  statistics.dispatch('click');
  assert.equal(statistics.attributes['aria-pressed'], 'true');
  assert.equal(entries.find(entry => entry.dataset.vizCategory === 'data').hidden, false);
  assert.equal(entries.find(entry => entry.dataset.vizCategory === 'functions').hidden, true);
  filters.find(button => button.dataset.vizFilter === 'all').dispatch('click');
  assert.ok(entries.every(entry => !entry.hidden));
});
