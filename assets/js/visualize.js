(() => {
  const M = window.ObservatoryMath;
  const topic = document.querySelector('#viz-topic');
  const controls = document.querySelector('#viz-topic-controls');
  const chart = document.querySelector('#viz-chart');
  const chartDesc = document.querySelector('#viz-chart-desc');
  const line = document.querySelector('#viz-line');
  const area = document.querySelector('#viz-area');
  const point = document.querySelector('#viz-point');
  const markers = document.querySelector('#viz-markers');
  const heading = document.querySelector('#viz-study-title');
  const description = document.querySelector('#viz-study-description');
  const equation = document.querySelector('#viz-equation');
  const ruleLabel = document.querySelector('#viz-rule-label');
  const rulePanel = document.querySelector('#viz-rule-panel');
  const formulaReference = document.querySelector('#viz-formula-reference');
  const output = document.querySelector('#viz-output');
  const readout = document.querySelector('#viz-point-readout');
  const metrics = document.querySelector('#viz-metrics');
  const SVGNS = 'http://www.w3.org/2000/svg';
  const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
  let geometryVisualizer = null;
  let geometryLoadPending = false;
  let geometryLoaderReady = false;
  let geometryRuntimeRequested = false;
  function requestGeometryRuntime() {
    if (geometryLoaderReady && !geometryRuntimeRequested && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      geometryRuntimeRequested = true;
      window.dispatchEvent(new CustomEvent('geometry-visualizer-request'));
    }
  }
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('geometry-loader-ready', () => { geometryLoaderReady=true;if(topic.value==='geometry')requestGeometryRuntime(); }, { once:true });
    window.addEventListener('geometry-visualizer-ready', () => { geometryLoadPending=false;if(topic.value==='geometry')renderSelected(); });
  }
  const studios = {
    linear: {
      title: 'Linear functions',
      desc: 'Drag the slope and intercept sliders to reshape y = mx + b. Watch the rise-over-run triangle, intercepts, and inclination update live.',
      params: [['slope','Slope m',1,-5,5,.0001],['intercept','Intercept b',0,-5,5,.001],['x','Inspect x',0,-5,5,.01]],
      // Match the 600:330 data viewport ratio so one x-unit and one y-unit
      // occupy the same number of SVG pixels (square coordinate cells).
      bounds: { xmin:-300/11, xmax:300/11, ymin:-15, ymax:15, equalScale:true },
      presets: [['Identity (y = x)',{slope:1,intercept:0}],['Negative slope',{slope:-1,intercept:2}],['Horizontal (y = 2)',{slope:0,intercept:2}]],
      sample: [-300/11, 300/11, .1],
      fn: (v) => v.slope * v.x + v.intercept,
      outputText: (v, y) => fmt.format(y),
      readText: (v, y) => `At x = ${fmt.format(v.x)}, y = ${fmt.format(y)}.`,
      ruleText: (v) => {
        // Match the standalone linear visualizer: omit a coefficient of
        // 1/−1 and a zero intercept (y = x, y = −x + 2, y = 2).
        if (v.slope === 0) return `y = ${fmt.format(v.intercept)}`;
        const mPart = v.slope === 1 ? '' : v.slope === -1 ? '−' : fmt.format(v.slope);
        const bPart = v.intercept === 0 ? '' : v.intercept > 0 ? ` + ${fmt.format(v.intercept)}` : ` − ${fmt.format(Math.abs(v.intercept))}`;
        return `y = ${mPart}x${bPart}`;
      },
      metrics: (v) => {
        const xIntercept = v.slope !== 0 ? -v.intercept / v.slope : NaN;
        const xInt = v.slope !== 0 ? `(${fmt.format(Object.is(xIntercept, -0) ? 0 : xIntercept)}, 0)` : (v.intercept === 0 ? 'Infinite' : 'None');
        // Match the standalone linear visualizer: signed arctan in degrees.
        const inclination = Math.atan(v.slope) * 180 / Math.PI;
        return [['Y-intercept', `(0, ${fmt.format(v.intercept)})`], ['X-intercept', xInt], ['Inclination', `${fmt.format(inclination)}°`]];
      },
      decorate: (v, y, scalers, rule) => {
        const { sx, sy } = scalers;
        markers.append(svgDot(sx(0), sy(v.intercept), 'viz-intercept'));
        const originText = `(0, ${fmt.format(v.intercept)})`;
        const annotations = [{ x:sx(0), y:sy(v.intercept), text:originText, className:'viz-marker-label viz-intercept-label' }];
        const fixedObstacles = [];
        if (v.slope !== 0) {
          // Keep the slope triangle clear of the origin and the x-axis tick labels.
          const sampleX = 3;
          const y2 = v.slope * sampleX + v.intercept;
          const x2 = sx(sampleX);
          const yStart = sy(v.intercept);
          const yEnd = sy(y2);
          markers.append(svgPath(`M ${sx(0)} ${yStart} L ${x2} ${yStart}`, 'viz-run'));
          markers.append(svgPath(`M ${x2} ${yStart} L ${x2} ${yEnd}`, 'viz-rise'));
          annotations.push({ x:x2, y:(yStart + yEnd) / 2, text:`Rise: ${fmt.format(y2 - v.intercept)}`, className:'viz-marker-label viz-rise-label' });
          annotations.push({ x:(sx(0) + x2) / 2, y:yStart, text:'Run: +3', className:'viz-marker-label viz-run-label' });
        } else {
          // Match the prototype for a horizontal line: still draw the run
          // dashed line along the line itself.
          const yStart = sy(v.intercept);
          const x2 = sx(3);
          markers.append(svgPath(`M ${sx(0)} ${yStart} L ${x2} ${yStart}`, 'viz-run'));
          annotations.push({ x:(sx(0) + x2) / 2, y:yStart, text:'Run: +3', className:'viz-marker-label viz-run-label' });
        }
        const sampleX = 3;
        const sampleY = v.slope * sampleX + v.intercept;
        if (Number.isFinite(sampleY)) {
          const samplePx = sx(sampleX);
          const samplePy = sy(sampleY);
          markers.append(svgDot(samplePx, samplePy, 'viz-sample'));
          const tagText = rule;
          const tagWidth = Math.max(54, tagText.length * 6.8 + 12);
          // Keep the rule in a consistent open corner instead of stacking it
          // on the intercept and rise/run labels around the sample point.
          const tagX = 648 - tagWidth;
          const tagY = 52;
          markers.append(svgRect(tagX, tagY, tagWidth, 22, 'viz-equation-tag-bg'));
          markers.append(svgLabel(tagX + tagWidth / 2, tagY + 15, tagText, 'viz-equation-tag'));
          fixedObstacles.push({ left:tagX, right:tagX + tagWidth, top:tagY, bottom:tagY + 22 });
        }
        placeGraphAnnotations(annotations, fixedObstacles);
      },
    },
    quadratic: {
      title: 'Quadratic functions',
      desc: 'Drag coefficients a, b, and c to reshape y = ax² + bx + c. Watch the discriminant, roots, vertex, and axis of symmetry update live.',
      formulaReference: 'Formula reference: x = (−b ± √(b² − 4ac)) / 2a',
      showInspectionPoint: false,
      params: [['a','Coefficient a',1,-5,5,.5],['b','Coefficient b',-2,-10,10,.5],['c','Constant c',-3,-10,10,.5],['x','Inspect x',1,-5,5,.5]],
      presets: [['Parabola x² − 2x − 3',{a:1,b:-2,c:-3}],['Shifted up',{a:1,b:0,c:2}],['Opens downward',{a:-1,b:0,c:3}]],
      // Keep the same fixed -10…10 graph window as the supplied quadratic
      // grapher so changing coefficients reshapes the curve instead of zooming.
      bounds: { xmin:-10, xmax:10, ymin:-10, ymax:10 },
      sample: [-10, 10, .05],
      fn: (v) => v.a * v.x * v.x + v.b * v.x + v.c,
      outputText: (v, y) => fmt.format(y),
      readText: (v, y) => {
        if (v.a === 0) return `At x = ${fmt.format(v.x)}, y = ${fmt.format(y)}. With a = 0 this is a line, not a parabola.`;
        const disc = v.b * v.b - 4 * v.a * v.c;
        const vx = -v.b / (2 * v.a);
        return `At x = ${fmt.format(v.x)}, y = ${fmt.format(y)}. Vertex (${fmt.format(vx)}, ${fmt.format(v.a * vx * vx + v.b * vx + v.c)}); Δ = ${fmt.format(disc)}.`;
      },
      ruleText: (v) => {
        if (v.a === 0) return `y = ${fmt.format(v.b)}x + ${fmt.format(v.c)} (linear)`;
        const lead = v.a === 1 ? 'x²' : v.a === -1 ? '−x²' : `${fmt.format(v.a)}x²`;
        const mid = v.b === 0 ? '' : v.b > 0 ? ` + ${v.b === 1 ? '' : fmt.format(v.b)}x` : ` − ${v.b === -1 ? '' : fmt.format(Math.abs(v.b))}x`;
        const last = v.c === 0 ? '' : v.c > 0 ? ` + ${fmt.format(v.c)}` : ` − ${fmt.format(Math.abs(v.c))}`;
        return `y = ${lead}${mid}${last}`;
      },
      metrics: (v) => {
        if (v.a === 0) return [['Form', 'Linear (a = 0)'], ['Slope', fmt.format(v.b)], ['Y-intercept', `(0, ${fmt.format(v.c)})`]];
        const disc = v.b * v.b - 4 * v.a * v.c;
        const vx = -v.b / (2 * v.a);
        const vy = v.a * vx * vx + v.b * vx + v.c;
        const nature = disc > 0 ? 'Two distinct real roots' : disc === 0 ? 'One repeated real root' : 'No real roots';
        // Match the standalone quadratic grapher's green/yellow/red coding.
        const natureTone = disc > 0 ? '#22c55e' : disc === 0 ? '#a16207' : '#dc2626';
        let roots = 'None';
        if (disc > 0) roots = `x₁ ${fmt.format((-v.b + Math.sqrt(disc)) / (2 * v.a))}, x₂ ${fmt.format((-v.b - Math.sqrt(disc)) / (2 * v.a))}`;
        else if (disc === 0) roots = `x = ${fmt.format(vx)}`;
        return [['Discriminant Δ', fmt.format(disc)], ['Nature of roots', nature, natureTone], ['Roots', roots], ['Vertex', `(${fmt.format(vx)}, ${fmt.format(vy)})`]];
      },
      decorate: (v, y, scalers) => {
        const { sx, sy } = scalers;
        const inView = (x) => x >= -10 && x <= 10;
        // Match the prototype in the a = 0 degenerate case: the curve is a
        // line, but the y-intercept dot is still drawn.
        if (v.a === 0) {
          markers.append(svgDot(sx(0), sy(v.c), 'viz-intercept'));
          placeGraphAnnotations([{ x:sx(0), y:sy(v.c), text:`(0, ${fmt.format(v.c)})`, className:'viz-marker-label viz-intercept-label' }]);
          return;
        }
        const vx = -v.b / (2 * v.a);
        const vy = v.a * vx * vx + v.b * vx + v.c;
        const annotations = [];
        if (inView(vx)) {
          markers.append(svgPath(`M ${sx(vx)} 20 L ${sx(vx)} 380`, 'viz-marker-line'));
          markers.append(svgDot(sx(vx), sy(vy), 'viz-vertex'));
          annotations.push({ x:sx(vx), y:sy(vy), text:`V(${fmt.format(vx)}, ${fmt.format(vy)})`, className:'viz-marker-label viz-intercept-label' });
        }
        const disc = v.b * v.b - 4 * v.a * v.c;
        if (disc > 0) {
          const roots = [(-v.b + Math.sqrt(disc)) / (2 * v.a), (-v.b - Math.sqrt(disc)) / (2 * v.a)].filter(inView).sort((left, right) => left - right);
          roots.forEach((r, index) => {
            markers.append(svgDot(sx(r), sy(0), 'viz-root'));
            annotations.push({ x:sx(r), y:sy(0), text:`x = ${fmt.format(r)}`, className:'viz-marker-label viz-root-label' });
          });
        } else if (disc === 0 && inView(vx)) {
          markers.append(svgDot(sx(vx), sy(0), 'viz-root'));
          annotations.push({ x:sx(vx), y:sy(0), text:`x = ${fmt.format(vx)}`, className:'viz-marker-label viz-root-label' });
        }
        markers.append(svgDot(sx(0), sy(v.c), 'viz-intercept'));
        annotations.unshift({ x:sx(0), y:sy(v.c), text:`(0, ${fmt.format(v.c)})`, className:'viz-marker-label viz-intercept-label' });
        placeGraphAnnotations(annotations);
      },
    },
    absolute: {
      title: 'Absolute value',
      desc: 'Drag a, h, and k to reshape y = a|x − h| + k. Watch the vertex move and the V open upward, downward, or flatten.',
      showRulePanel: true,
      params: [['a','Stretch a',3,-5,5,.5],['h','Horizontal shift h',0,-5,5,.5],['k','Vertical shift k',0,-5,5,.5],['x','Inspect x',0,-5,5,.5]],
      bounds: { xmin:-10, xmax:10, ymin:-10, ymax:10 },
      presets: [['Standard |x|',{a:1,h:0,k:0}],['Inverted & shifted',{a:-1,h:2,k:3}],['Stretched V',{a:2.5,h:-1,k:-2}]],
      sample: [-8, 8, .1],
      fn: (v) => v.a * Math.abs(v.x - v.h) + v.k,
      outputText: (v, y) => fmt.format(y),
      readText: (v, y) => `At x = ${fmt.format(v.x)}, y = ${fmt.format(y)}. Vertex (${fmt.format(v.h)}, ${fmt.format(v.k)}); opens ${v.a > 0 ? 'upward' : v.a < 0 ? 'downward' : 'flat'}.`,
      ruleText: (v) => {
        if (v.a === 0) return `f(x) = ${fmt.format(v.k)}`;
        const aPart = v.a === 1 ? '' : v.a === -1 ? '−' : fmt.format(v.a);
        const hPart = v.h === 0 ? 'x' : v.h > 0 ? `x − ${fmt.format(v.h)}` : `x + ${fmt.format(Math.abs(v.h))}`;
        const kPart = v.k === 0 ? '' : v.k > 0 ? ` + ${fmt.format(v.k)}` : ` − ${fmt.format(Math.abs(v.k))}`;
        return `f(x) = ${aPart}|${hPart}|${kPart}`;
      },
      metrics: (v) => {
        const dir = v.a > 0 ? 'Upward' : v.a < 0 ? 'Downward' : 'Flat line';
        return [['Vertex (h, k)', `(${fmt.format(v.h)}, ${fmt.format(v.k)})`], ['Direction', dir === 'Flat line' ? 'Flat Line' : dir], ['Slope |a|', Math.abs(v.a).toFixed(1)]];
      },
      decorate: (v, y, scalers) => {
        const { sx, sy } = scalers;
        markers.append(svgDot(sx(v.h), sy(v.k), 'viz-vertex'));
        placeGraphAnnotations([{ x:sx(v.h), y:sy(v.k), text:`V(${fmt.format(v.h)}, ${fmt.format(v.k)})` }]);
      },
    },
    root: {
      title: 'Square-root functions',
      desc: 'Drag a, b, h, and k to explore y = a√(b(x − h)) + k. Watch the endpoint, domain, and range respond to each shift and reflection.',
      params: [['a','Vertical scale a',1,-3,3,.5],['b','Horizontal scale b',1,-3,3,.5],['h','Horizontal shift h',0,-5,5,.5],['k','Vertical shift k',0,-5,5,.5],['x','Inspect x',2,0,5,.25]],
      presets: [['Standard √x',{a:1,b:1,h:0,k:0}],['Shifted right & up',{a:1,b:1,h:2,k:1}],['Reflected',{a:-1.5,b:-1,h:-1,k:2}]],
      sample: [-8, 8, .05],
      fn: (v) => { const inner = v.b * (v.x - v.h); return inner < 0 ? NaN : v.a * Math.sqrt(inner) + v.k; },
      outputText: (v, y) => Number.isFinite(y) ? fmt.format(y) : 'undefined for this x',
      readText: (v, y) => Number.isFinite(y) ? `At x = ${fmt.format(v.x)}, y = ${fmt.format(y)}. Endpoint (${fmt.format(v.h)}, ${fmt.format(v.k)}). Parent: y = √x.` : `x = ${fmt.format(v.x)} is outside the domain for these shifts. Parent: y = √x.`,
      ruleText: (v) => {
        const aPart = v.a === 1 ? '' : v.a === -1 ? '−' : fmt.format(v.a);
        const hPart = v.h === 0 ? 'x' : v.h > 0 ? `x − ${fmt.format(v.h)}` : `x + ${fmt.format(Math.abs(v.h))}`;
        const bPart = v.b === 1 ? '' : v.b === -1 ? '−' : `${fmt.format(v.b)}·`;
        const kPart = v.k === 0 ? '' : v.k > 0 ? ` + ${fmt.format(v.k)}` : ` − ${fmt.format(Math.abs(v.k))}`;
        return `y = ${aPart}√(${bPart}${hPart})${kPart}`;
      },
      metrics: (v) => {
        const domain = v.b > 0 ? `[${fmt.format(v.h)}, +∞)` : v.b < 0 ? `(−∞, ${fmt.format(v.h)}]` : 'all real x';
        const range = v.a > 0 ? `[${fmt.format(v.k)}, +∞)` : v.a < 0 ? `(−∞, ${fmt.format(v.k)}]` : `{${fmt.format(v.k)}}`;
        return [['Endpoint (h, k)', `(${fmt.format(v.h)}, ${fmt.format(v.k)})`], ['Domain', domain], ['Range', range]];
      },
      decorate: (v, y, scalers) => {
        const { sx, sy } = scalers;
        markers.append(svgDot(sx(v.h), sy(v.k), 'viz-vertex'));
        placeGraphAnnotations([{ x:sx(v.h), y:sy(v.k), text:`(${fmt.format(v.h)}, ${fmt.format(v.k)})` }]);
      },
    },
    'cube-root': {
      title: 'Cube-root functions',
      desc: 'Drag a, h, and k to explore y = a∛(x − h) + k. Unlike square root, every real x has a value — watch the S-curve shift and stretch.',
      params: [['a','Scale a',1,-3,3,.25],['h','Horizontal shift h',0,-5,5,.5],['k','Vertical shift k',0,-5,5,.5],['x','Inspect x',1,-5,5,.25]],
      presets: [['Standard ∛x',{a:1,h:0,k:0}],['Shifted',{a:1,h:2,k:1}],['Reflected & stretched',{a:-1.5,h:-1,k:2}]],
      sample: [-8, 8, .1],
      fn: (v) => v.a * Math.cbrt(v.x - v.h) + v.k,
      outputText: (v, y) => fmt.format(y),
      readText: (v, y) => `At x = ${fmt.format(v.x)}, y = ${fmt.format(y)}. Inflection point (${fmt.format(v.h)}, ${fmt.format(v.k)}).`,
      ruleText: (v) => {
        const aPart = v.a === 1 ? '' : v.a === -1 ? '−' : fmt.format(v.a);
        const hPart = v.h === 0 ? 'x' : v.h > 0 ? `x − ${fmt.format(v.h)}` : `x + ${fmt.format(Math.abs(v.h))}`;
        const kPart = v.k === 0 ? '' : v.k > 0 ? ` + ${fmt.format(v.k)}` : ` − ${fmt.format(Math.abs(v.k))}`;
        return `y = ${aPart}∛(${hPart})${kPart}`;
      },
      metrics: (v) => [['Inflection (h, k)', `(${fmt.format(v.h)}, ${fmt.format(v.k)})`], ['Domain', 'all real x'], ['Range', 'all real y']],
      decorate: (v, y, scalers) => {
        const { sx, sy } = scalers;
        markers.append(svgDot(sx(v.h), sy(v.k), 'viz-vertex'));
        placeGraphAnnotations([{ x:sx(v.h), y:sy(v.k), text:`(${fmt.format(v.h)}, ${fmt.format(v.k)})` }]);
      },
    },
  };
  const specs = {
  };
  const topics = {
    sequence: { title:'Sequences & series', description:'Compare arithmetic, geometric, and Fibonacci patterns. Expand the terms and compare them with their finite sum.', fields:[['kind','Pattern',['arithmetic','geometric','fibonacci']],['first','First term',3],['change','Difference / ratio',2],['count','Terms (1–30)',8]], calc:v=>{const t=M.sequence(v.kind,v.first,v.change,v.count);return {rule:`${v.kind} · ${t.slice(0,5).map(x=>fmt.format(x)).join(', ')}${t.length>5?' …':''}`,value:`${fmt.format(t.at(-1))} · sum ${fmt.format(t.reduce((a,b)=>a+b,0))}`,read:`${t.length} terms shown. Last term ${fmt.format(t.at(-1))}; sum ${fmt.format(t.reduce((a,b)=>a+b,0))}.`,table:{headers:['n','Term aₙ'],rows:t.map((x,i)=>[i+1,fmt.format(x)])}};}},
    sigma: { title:'Series & sigma notation', description:'Expand a finite sigma sum into its terms and add the terms.', fields:[['first','First term',2],['change','Common difference',3],['count','Number of terms',6]], calc:v=>{const t=M.sequence('arithmetic',v.first,v.change,v.count);return {rule:`Σₙ₌₁ⁿ=${v.count} (${v.first} + (n−1)·${v.change})`,value:`Sum = ${fmt.format(t.reduce((a,b)=>a+b,0))}`,read:`Expanded: ${t.map(x=>fmt.format(x)).join(' + ')} = ${fmt.format(t.reduce((a,b)=>a+b,0))}.`,table:{headers:['Index n','Term','Running sum'],rows:t.map((x,i)=>[i+1,fmt.format(x),fmt.format(t.slice(0,i+1).reduce((a,b)=>a+b,0))])}};}},
    statistics: { title:'Data and statistics', description:'Enter a data set to compare mean, median, range, variance, and standard deviation.', fields:[['data','Data (comma separated)','4, 6, 7, 8, 10, 11']], calc:v=>{const data=M.parseList(v.data),s=M.summarize(data);return {rule:`n = ${s.count} · mean ${fmt.format(s.mean)} · median ${fmt.format(s.median)}`,value:`SD ${fmt.format(s.standardDeviation)}`,read:`Range ${fmt.format(s.range)} · population variance ${fmt.format(s.variance)} · SD ${fmt.format(s.standardDeviation)}.`,table:{headers:['Observation','Value'],rows:data.map((x,i)=>[i+1,fmt.format(x)])}};}},
    regression: { title:'Correlation & regression', description:'Paste matching x and y observations to plot the paired data and least-squares line.', fields:[['xdata','x values','1, 2, 3, 4, 5'],['ydata','y values','2, 3, 5, 4, 7']], calc:v=>{const x=M.parseList(v.xdata),y=M.parseList(v.ydata),r=M.linearRegression(x,y),xmin=Math.min(...x),xmax=Math.max(...x);return {rule:`ŷ = ${fmt.format(r.intercept)} + ${fmt.format(r.slope)}x`,value:`r = ${fmt.format(r.correlation)}`,read:`${r.count} paired observations; Pearson r = ${fmt.format(r.correlation)}. Points are shown separately; the line is least-squares fit.`,points:[[xmin,r.intercept+r.slope*xmin],[xmax,r.intercept+r.slope*xmax]],scatter:x.map((value,i)=>[value,y[i]])};}},
    normal: { title:'Normal distribution', description:'Convert a value to a z-score and see the estimated area to its left on the standard normal curve.', fields:[['value','Observed value',70],['mean','Mean',60],['sd','Standard deviation',8]], calc:v=>{const z=M.zScore(v.value,v.mean,v.sd);return {rule:`z = (${fmt.format(v.value)} − ${fmt.format(v.mean)}) / ${fmt.format(v.sd)}`,value:`${fmt.format(M.normalCdf(z)*100)}%`,read:`z = ${fmt.format(z)}. Approximately ${fmt.format(M.normalCdf(z)*100)}% lies at or below this value; the shaded curve is the standard normal scale.`,areaThrough:z,points:Array.from({length:81},(_,i)=>[-4+i*.1,M.normalPdf(-4+i*.1)])};}},
    'random-variable': { title:'Discrete random variable', description:'Enter matching outcome and probability lists; probabilities must total 1.', fields:[['values','Values','0, 1, 2'],['probabilities','Probabilities','0.25, 0.5, 0.25']], calc:v=>{const values=M.parseList(v.values),probabilities=M.parseList(v.probabilities),d=M.discreteDistribution(values,probabilities);return {rule:`E(X) = ${fmt.format(d.expectedValue)}`,value:`SD ${fmt.format(d.standardDeviation)}`,read:`Variance ${fmt.format(d.variance)}; standard deviation ${fmt.format(d.standardDeviation)}.`,table:{headers:['x','P(X = x)'],rows:values.map((x,i)=>[fmt.format(x),fmt.format(probabilities[i])])}};}},
    finance: { title:'Compound interest', description:'Model repeated compounding with principal, nominal annual rate, compounding frequency, and time.', fields:[['principal','Principal',1000],['rate','Annual rate (%)',5],['years','Years',10],['frequency','Compounds per year',12]], calc:v=>{const d=M.compoundInterest(v.principal,v.rate,v.years,v.frequency);return {rule:`A = P(1 + r/n)ⁿᵗ · ${fmt.format(d.periods)} periods`,value:`${fmt.format(d.amount)}`,read:`Interest earned: ${fmt.format(d.interest)}. This assumes a fixed nominal annual rate and compounding ${v.frequency} times per year.`,points:Array.from({length:Math.floor(v.years)+1},(_,i)=>[i,v.principal*(1+v.rate/(100*v.frequency))**(v.frequency*i)])};}},
    annuity: { title:'Annuities', description:'Estimate the future value and present value of equal ordinary annuity payments made at period end.', fields:[['payment','Payment each period',200],['rate','Rate per period (%)',0.5],['periods','Number of payments',60]], calc:v=>({rule:`Ordinary annuity · ${v.periods} end-of-period payments`,value:`FV ${fmt.format(M.futureValueAnnuity(v.payment,v.rate,v.periods))}`,read:`Present value ${fmt.format(M.presentValueAnnuity(v.payment,v.rate,v.periods))}. Timing assumption: ordinary annuity payments at each period end.`,points:Array.from({length:Math.min(31,Math.floor(v.periods)+1)},(_,i)=>[i,M.futureValueAnnuity(v.payment,v.rate,Math.max(1,i))])})},
    loan: { title:'Loan amortization', description:'Find a level periodic payment using the stated interest rate per payment period.', fields:[['principal','Loan principal',10000],['rate','Rate per payment period (%)',1],['periods','Number of payments',24]], calc:v=>{const p=M.loanPayment(v.principal,v.rate,v.periods),periods=Math.floor(v.periods),r=v.rate/100;let balance=v.principal;const points=[[0,balance]];for(let period=1;period<=periods;period++){balance=balance*(1+r)-p;points.push([period,Math.max(0,balance)]);}return {rule:`Payment = ${fmt.format(p)} · ${periods} payments`,value:`Total ${fmt.format(p*periods)}`,read:`Total interest across all payments is ${fmt.format(p*periods-v.principal)}. Fixed-rate model; the chart applies interest, then payment each period.`,points};}},
    price: { title:'Markup, discount & VAT', description:'Apply a markup, then discount, then VAT to calculate the customer price.', fields:[['price','Starting price',1000],['markup','Markup (%)',20],['discount','Discount (%)',10],['vat','VAT (%)',12]], calc:v=>{const r=M.priceChange(v.price,v.markup,v.discount,v.vat);return {rule:`${fmt.format(v.price)} → markup → discount → VAT`,value:`${fmt.format(r.finalPrice)}`,read:`Marked price ${fmt.format(r.marked)}; after discount ${fmt.format(r.discounted)}; VAT ${fmt.format(r.vatAmount)}.`,points:[[0,v.price],[1,r.marked],[2,r.discounted],[3,r.finalPrice]]};}},
    pay: { title:'Wages & overtime', description:'Add regular wages, overtime, and additional pay components.', fields:[['hourlyRate','Hourly rate',150],['regularHours','Regular hours',40],['overtimeHours','Overtime hours',5],['allowance','Allowance',500],['commission','Commission',0]], calc:v=>{const r=M.wagePay(v);return {rule:`Regular ${fmt.format(r.regularPay)} + overtime ${fmt.format(r.overtimePay)}`,value:`Gross ${fmt.format(r.grossPay)}`,read:`Additional pay ${fmt.format(r.additionalPay)}. Overtime uses the toolkit default multiplier of 1.5; this is a general model, not a jurisdiction-specific payroll calculator.`,points:[[1,r.regularPay],[2,r.overtimePay],[3,r.additionalPay],[4,r.grossPay]]};}},
    piecewise: { title:'Piecewise fare model', description:'A base fare covers an included distance; additional distance adds a per-kilometre charge.', fields:[['distance','Distance (km)',8],['base','Base fare',30],['includedDistance','Included km',2],['perKm','Fare per extra km',12]], calc:v=>{const r=M.piecewiseFare(v.distance,v.base,v.includedDistance,v.perKm);return {rule:`F(d) = ${v.base} if d ≤ ${v.includedDistance}; otherwise add ${v.perKm}/km`,value:`Fare ${fmt.format(r)}`,read:`For ${fmt.format(v.distance)} km, fare is ${fmt.format(r)} under this piecewise pricing assumption.`,points:Array.from({length:11},(_,i)=>[i, M.piecewiseFare(i,v.base,v.includedDistance,v.perKm)])};}},
    geometry: { title:'Solid geometry', description:'Choose a solid, adjust its dimensions and appearance, and orbit the 3D model while its measurements update.' },
    triangle: { title:'Triangle explorer', description:'Solve a right triangle for any side (a, b, or c with the solved field locked), solve area / base / height from the other two, or solve SSS · SAS · ASA · AAS · SSA with live validation.' },
    trig: { title:'Right-triangle trigonometry', description:'Use SOH–CAH–TOA to calculate a missing side from an angle and one known side.', fields:[['angle','Angle (degrees)',35],['known','Known side length',10],['ratio','Known side',['hypotenuse','adjacent','opposite']]], calc:v=>{if(v.angle<=0||v.angle>=90)throw Error('Use an acute angle between 0° and 90°.');const theta=v.angle*Math.PI/180;let opposite,adjacent,hypotenuse;if(v.ratio==='hypotenuse'){hypotenuse=v.known;opposite=hypotenuse*Math.sin(theta);adjacent=hypotenuse*Math.cos(theta);}else if(v.ratio==='adjacent'){adjacent=v.known;opposite=adjacent*Math.tan(theta);hypotenuse=adjacent/Math.cos(theta);}else{opposite=v.known;adjacent=opposite/Math.tan(theta);hypotenuse=opposite/Math.sin(theta);}return {rule:`sin θ = opp/hyp · cos θ = adj/hyp · tan θ = opp/adj`,value:`opp ${fmt.format(opposite)} · adj ${fmt.format(adjacent)}`,read:`Hypotenuse ${fmt.format(hypotenuse)}. Angle ${fmt.format(v.angle)}°; known ${v.ratio} ${fmt.format(v.known)}.`,points:[[0,0],[adjacent,0],[adjacent,opposite],[0,0]]};}},
    logic: { title:'Propositional logic', description:'Build truth tables for common logical connectives.', fields:[['operator','Connective',['and','or','conditional','biconditional','xor']]], calc:v=>{const rows=M.truthTable(v.operator);return {rule:`Connective: ${v.operator}`,value:`${rows.filter(r=>r.result).length} true row(s)`,read:'Rows follow the standard order TT, TF, FT, FF.',table:{headers:['p','q',v.operator],rows:rows.map(r=>[r.p?'T':'F',r.q?'T':'F',r.result?'T':'F'])}};}},
    profit: { title:'Profit and loss', description:'Compare selling price with cost and express a gain or loss in amount and as a percentage of cost.', fields:[['cost','Cost',800],['selling','Selling price',1000]], calc:v=>{const amount=v.selling-v.cost;const percent=amount/v.cost*100;return {rule:`${amount>=0?'Profit':'Loss'} = selling price − cost`,value:`${fmt.format(Math.abs(amount))} · ${fmt.format(Math.abs(percent))}%`,read:`${amount>=0?'Profit':'Loss'} of ${fmt.format(Math.abs(amount))}; percentage is calculated relative to cost.`,points:[[0,v.cost],[1,v.selling]]};}},
    inflation: { title:'Inflation & purchasing power', description:'Estimate how a price grows under a constant annual inflation rate and what a fixed amount can buy later.', fields:[['price','Starting price',100],['rate','Annual inflation (%)',3],['years','Years',5]], calc:v=>{if(v.rate<0||v.rate>100||v.years<0)throw Error('Use a nonnegative rate and time.');const future=v.price*(1+v.rate/100)**v.years;return {rule:`Future cost = ${fmt.format(v.price)}(1 + ${fmt.format(v.rate)}%)^${fmt.format(v.years)}`,value:`${fmt.format(future)} future cost`,read:`At this constant rate, the item would cost ${fmt.format(future)}. A fixed ${fmt.format(v.price)} would buy about ${fmt.format(v.price/future*100)}% of one item then.`,points:Array.from({length:Math.floor(v.years)+1},(_,i)=>[i,v.price*(1+v.rate/100)**i])};}},
    measurement: { title:'Measurement & scale', description:'Convert temperatures or calculate real distance from a map scale.', fields:[['mode','Calculation',['temperature','map-scale']],['value','Value',25],['from','From unit',['C','F','K']],['to','To unit',['F','C','K']],['scale','Scale denominator',50000]], calc:v=>{if(v.mode==='temperature'){const result=M.convertTemperature(v.value,v.from,v.to);return {rule:`${fmt.format(v.value)}°${v.from} = ? °${v.to}`,value:`${fmt.format(result)}°${v.to}`,read:'Temperature conversion uses Celsius as the intermediate scale.',points:[[0,v.value],[1,result]]};}const result=M.scaleDistance(v.value,v.scale);return {rule:`${fmt.format(v.value)} map units × 1:${fmt.format(v.scale)}`,value:`${fmt.format(result)} real units`,read:'Map distance and real distance use the same linear unit before conversion.',points:[[0,v.value],[1,result]]};}},
  };
  let activeSpec;
  function buildControls(spec) {
    controls.replaceChildren();
    for (const [id,label,initial,low,high,step] of spec.fields || []) {
      const lab=document.createElement('label'); lab.className='op-control'; lab.htmlFor=`viz-${id}`;
      const title=document.createElement('span');title.textContent=label;
      let input;
      if(Array.isArray(initial)){input=document.createElement('select');initial.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);});input.value=initial[0]??'';}
      else {input=document.createElement('input');input.type=typeof initial==='string'?'text':'number';input.value=initial;if(input.type==='number'){input.step='any';if(low!==undefined){input.min=low;input.max=high;input.step=step;}}else{input.autocomplete='off';input.spellcheck=false;input.inputMode='decimal';}}
      input.id=`viz-${id}`;lab.append(title,input);controls.append(lab);
    }
  }
  function valuesFrom(spec) { const values={};for(const [id,label,initial] of spec.fields||[]){const input=document.querySelector(`#viz-${id}`);const raw=String(input.value??'').trim();if(!raw)throw new Error(`Enter a value for ${label.toLowerCase()}.`);if(Array.isArray(initial)||typeof initial==='string')values[id]=input.value;else{const number=Number(raw);if(!Number.isFinite(number))throw new Error(`${label} must be a finite number.`);values[id]=number;}}return values; }
  function setMetrics(items) {
    if (!metrics) return;
    metrics.replaceChildren();
    metrics.hidden = !(items && items.length);
    for (const [label, value, tone] of items || []) {
      const card = document.createElement('div'); card.className = 'viz-metric';
      const name = document.createElement('span'); name.textContent = label;
      const val = document.createElement('strong'); val.textContent = value;
      // Optional per-metric accent, e.g. the standalone quadratic grapher's
      // green/yellow/red nature-of-roots coding.
      if (tone) val.style.color = tone;
      card.append(name, val); metrics.append(card);
    }
  }
  function svgDot(x, y, cls) {
    const dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', '6');
    dot.setAttribute('class', `viz-marker ${cls}`);
    return dot;
  }
  function svgLabel(x, y, text, cls = 'viz-marker-label') {
    const label = document.createElementNS(SVGNS, 'text');
    label.setAttribute('x', x); label.setAttribute('y', y);
    label.setAttribute('class', cls); label.textContent = text;
    return label;
  }
  function svgRect(x, y, width, height, cls) {
    const rect = document.createElementNS(SVGNS, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y); rect.setAttribute('width', width); rect.setAttribute('height', height);
    rect.setAttribute('rx', '2'); rect.setAttribute('class', cls);
    return rect;
  }
  function appendMarkerBadge(x, y, text, anchor = 'start', labelClass = 'viz-marker-label viz-intercept-label') {
    const width = text.length * 6.6 + 12;
    const left = anchor === 'end' ? x + 6 - width : anchor === 'middle' ? x - width / 2 : x - 6;
    markers.append(svgRect(left, y - 13, width, 18, 'viz-marker-label-bg'));
    const label = svgLabel(x, y, text, labelClass);
    label.setAttribute('text-anchor', anchor);
    markers.append(label);
  }
  function placeGraphAnnotations(annotations, fixedObstacles = []) {
    const tickBoxes = [];
    const placedBoxes = [];
    const tickGroup = document.querySelector('.viz-ticks');
    Array.from(tickGroup?.children || []).forEach(tick => {
      const x = Number(tick.attributes.x), y = Number(tick.attributes.y);
      const width = (tick.textContent || '').length * 7.5;
      const anchor = tick.attributes['text-anchor'] || 'start';
      const left = anchor === 'end' ? x - width : anchor === 'middle' ? x - width / 2 : x;
      tickBoxes.push({ left:left - 3, right:left + width + 3, top:y - 11, bottom:y + 4 });
    });
    const pointBoxes = annotations.map(item => ({ left:item.x - 8, right:item.x + 8, top:item.y - 8, bottom:item.y + 8 }));
    const candidates = [
      [12,-18,'start'],[-12,-18,'end'],[12,30,'start'],[-12,30,'end'],
      [0,-28,'middle'],[0,42,'middle'],[20,-42,'start'],[-20,-42,'end'],
      [20,54,'start'],[-20,54,'end'],[0,-58,'middle'],[0,70,'middle'],
    ];
    annotations.forEach(item => {
      const width = item.text.length * 6.6 + 12;
      let best = null;
      candidates.forEach(([dx,dy,anchor], order) => {
        const x = item.x + dx, y = item.y + dy;
        const left = anchor === 'end' ? x + 6 - width : anchor === 'middle' ? x - width / 2 : x - 6;
        const box = { left, right:left + width, top:y - 13, bottom:y + 5 };
        if (box.left < 62 || box.right > 658 || box.top < 42 || box.bottom > 368) return;
        const overlaps = (other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top;
        const tickCollisions = tickBoxes.filter(overlaps).length;
        const obstacleCollisions = fixedObstacles.filter(overlaps).length;
        const placedCollisions = placedBoxes.filter(overlaps).length;
        const pointCollisions = pointBoxes.filter(point => !(point.left === item.x - 8 && point.top === item.y - 8) && overlaps(point)).length;
        const score = tickCollisions * 1e7 + obstacleCollisions * 1e6 + placedCollisions * 1e5 + pointCollisions * 100 + order;
        if (!best || score < best.score) best = { x,y,anchor,score };
      });
      if (!best) best = { x:item.x + 12, y:Math.min(356, Math.max(54, item.y - 18)), anchor:'start' };
      const left = best.anchor === 'end' ? best.x + 6 - width : best.anchor === 'middle' ? best.x - width / 2 : best.x - 6;
      const box = { left, right:left + width, top:best.y - 13, bottom:best.y + 5 };
      appendMarkerBadge(best.x, best.y, item.text, best.anchor, item.className);
      placedBoxes.push(box);
    });
  }
  function svgPath(d, cls) {
    const path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', d); path.setAttribute('class', cls);
    return path;
  }
  function sliderControl(field, onUpdate) {
    const [id, label, initial, low, high, step] = field;
    const group = document.createElement('div'); group.className = 'viz-slider-group';
    const row = document.createElement('div'); row.className = 'viz-slider-row';
    const title = document.createElement('span'); title.textContent = label;
    const number = document.createElement('input');
    number.type = 'number'; number.id = `viz-${id}`; number.value = initial;
    number.min = low; number.max = high; number.step = step;
    number.setAttribute('aria-label', label);
    const range = document.createElement('input');
    range.type = 'range'; range.id = `viz-${id}-slider`;
    range.min = low; range.max = high; range.step = step; range.value = initial;
    range.setAttribute('aria-label', label);
    number.addEventListener('input', () => { range.value = number.value; onUpdate(); });
    range.addEventListener('input', () => { number.value = range.value; onUpdate(); });
    row.append(title, number); group.append(row, range);
    return group;
  }
  function renderStudio(studio) {
    heading.textContent = studio.title;
    description.textContent = studio.desc;
    ruleLabel.textContent = 'Current rule';
    if (rulePanel) rulePanel.hidden = !(studio.formulaReference || studio.showRulePanel);
    if (formulaReference) {
      formulaReference.hidden = !studio.formulaReference;
    }
    controls.replaceChildren();
    for (const field of studio.params) controls.append(sliderControl(field, update));
    if (studio.presets && studio.presets.length) {
      const row = document.createElement('div'); row.className = 'viz-presets';
      for (const [label, values] of studio.presets) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'viz-preset-btn'; button.textContent = label;
        button.addEventListener('click', () => {
          for (const [id, val] of Object.entries(values)) {
            const number = document.querySelector(`#viz-${id}`);
            const range = document.querySelector(`#viz-${id}-slider`);
            if (number) number.value = val;
            if (range) range.value = val;
          }
          update();
        });
        row.append(button);
      }
      controls.append(row);
    }
    function update() {
      try {
        const v = valuesFrom({ fields: studio.params });
        const y = studio.fn(v);
        output.textContent = studio.outputText(v, y);
        readout.textContent = studio.readText(v, y);
        equation.textContent = studio.ruleText(v);
        const [lo, hi, step] = studio.sample;
        const pts = [];
        for (let x = lo; x < hi - step * 1e-8; x += step) pts.push([x, studio.fn({ ...v, x })]);
        pts.push([hi, studio.fn({ ...v, x: hi })]);
        const scalers = showGraph(pts, null, Number.isFinite(y) ? [v.x, y] : null, undefined, studio.bounds);
        if (studio.showInspectionPoint === false) point.style.display = 'none';
        if (scalers && studio.decorate) studio.decorate(v, y, scalers, studio.ruleText(v));
        setMetrics(studio.metrics(v, y));
      } catch (error) {
        equation.textContent = 'Check the entered values';
        output.textContent = '—';
        readout.textContent = error.message;
        line.setAttribute('d', ''); area.setAttribute('d', ''); markers.replaceChildren(); point.style.display = 'none';
        setMetrics([]);
      }
    }
    update();
  }
  function renderPlot(points, scatterPoints, focus, areaThrough, bounds) {
    markers.replaceChildren();
    area.setAttribute('d','');const valid=(points||[]).filter(p=>p.every(Number.isFinite));const scatter=(scatterPoints||[]).filter(p=>p.every(Number.isFinite));const all=[...valid,...scatter];if(valid.length<2&&scatter.length<1){line.setAttribute('d','');point.style.display='none';return null;}
    const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);if(xmin===xmax){xmin-=1;xmax+=1;}if(ymin===ymax){ymin-=1;ymax+=1;}const pad=(ymax-ymin)*.12;ymin-=pad;ymax+=pad;if(bounds){({xmin,xmax,ymin,ymax}=bounds);if(bounds.equalScale){const centerX=(xmin+xmax)/2,centerY=(ymin+ymax)/2,unitSpan=Math.max((xmax-xmin)/600,(ymax-ymin)/330);const halfX=unitSpan*600/2,halfY=unitSpan*330/2;xmin=centerX-halfX;xmax=centerX+halfX;ymin=centerY-halfY;ymax=centerY+halfY;}}
    const sx=x=>60+(x-xmin)/(xmax-xmin)*600,sy=y=>370-(y-ymin)/(ymax-ymin)*330;
    const zeroX=Math.max(60,Math.min(660,sx(0))),zeroY=Math.max(30,Math.min(370,sy(0)));
    document.querySelector('.viz-axis').setAttribute('d',`M 40 ${zeroY}H680M${zeroX} 20V380`);
    // Draw grid lines and tick labels from the same scales used by the data.
    const gridGroup = document.querySelector('#viz-grid-lines');
    const sharedTickStep = bounds?.equalScale ? chooseTickStep(Math.min(xmax - xmin, ymax - ymin)) : null;
    const xTickStep = sharedTickStep || chooseTickStep(xmax - xmin);
    const yTickStep = sharedTickStep || chooseTickStep(ymax - ymin);
    if (gridGroup) {
      gridGroup.replaceChildren();
      const xMinorStep = xTickStep / 2;
      const firstXGrid = Math.ceil(xmin / xMinorStep) * xMinorStep;
      for (let value = firstXGrid; value <= xmax + xMinorStep * 1e-8; value += xMinorStep) {
        if (Math.abs(value) < xMinorStep * 1e-8) continue;
        const isMajor = Math.abs(value / xTickStep - Math.round(value / xTickStep)) < 1e-7;
        gridGroup.append(svgPath(`M ${sx(value)} 40 V 370`, `viz-grid-line ${isMajor ? 'viz-grid-line-major' : 'viz-grid-line-minor'}`));
      }
      const yMinorStep = yTickStep / 2;
      const firstYGrid = Math.ceil(ymin / yMinorStep) * yMinorStep;
      for (let value = firstYGrid; value <= ymax + yMinorStep * 1e-8; value += yMinorStep) {
        if (Math.abs(value) < yMinorStep * 1e-8) continue;
        const isMajor = Math.abs(value / yTickStep - Math.round(value / yTickStep)) < 1e-7;
        gridGroup.append(svgPath(`M 60 ${sy(value)} H 660`, `viz-grid-line ${isMajor ? 'viz-grid-line-major' : 'viz-grid-line-minor'}`));
      }
    }
    // Axis labels are regenerated for every range so they stay attached to the
    // values they describe instead of drifting over a rescaled plot.
    const tickGroup = document.querySelector('.viz-ticks');
    if (tickGroup) {
      tickGroup.replaceChildren();
      const tickStart = Math.ceil(xmin / xTickStep) * xTickStep;
      const tickY = zeroY < 345 ? zeroY + 22 : zeroY - 10;
      for (let value = tickStart; value <= xmax + xTickStep * 1e-8; value += xTickStep) {
        if (Math.abs(value) < xTickStep * 1e-8) continue;
        const label = svgLabel(sx(value), tickY, fmt.format(value));
        label.setAttribute('class', 'viz-tick-label');
        label.setAttribute('text-anchor', 'middle');
        tickGroup.append(label);
      }
      const yLabelX = zeroX > 90 ? zeroX - 9 : zeroX + 9;
      const yAnchor = zeroX > 90 ? 'end' : 'start';
      const firstYTick = Math.ceil(ymin / yTickStep) * yTickStep;
      for (let value = firstYTick; value <= ymax + yTickStep * 1e-8; value += yTickStep) {
        if (Math.abs(value) < yTickStep * 1e-8) continue;
        const label = svgLabel(yLabelX, sy(value) + 4, fmt.format(value));
        label.setAttribute('class', 'viz-tick-label');
        label.setAttribute('text-anchor', yAnchor);
        tickGroup.append(label);
      }
    }
    line.setAttribute('d',valid.map((p,i)=>`${i?'L':'M'} ${sx(p[0])} ${sy(p[1])}`).join(' '));
    if(Number.isFinite(areaThrough)&&valid.length>1){const shaded=valid.filter(p=>p[0]<=areaThrough);if(areaThrough>valid[0][0]&&areaThrough<valid.at(-1)[0]){const endIndex=valid.findIndex(p=>p[0]>areaThrough),start=valid[endIndex-1],end=valid[endIndex],fraction=(areaThrough-start[0])/(end[0]-start[0]);shaded.push([areaThrough,start[1]+fraction*(end[1]-start[1])]);}if(shaded.length){area.setAttribute('d',`M ${sx(shaded[0][0])} ${sy(0)} L ${shaded.map(p=>`${sx(p[0])} ${sy(p[1])}`).join(' L ')} L ${sx(shaded.at(-1)[0])} ${sy(0)} Z`);}}
    if(scatter.length){scatter.forEach(([x,y])=>{const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',sx(x));dot.setAttribute('cy',sy(y));dot.setAttribute('r','5');dot.setAttribute('class','viz-scatter-point');markers.append(dot);});point.style.display='none';}
    else {const selected=focus===undefined?valid[Math.floor(valid.length/2)]:focus;if(selected&&selected.every(Number.isFinite)){point.setAttribute('cx',sx(selected[0]));point.setAttribute('cy',sy(selected[1]));point.style.display='';}else point.style.display='none';}
    return { sx, sy };
  }
  function chooseTickStep(span) {
    const rough = span / 10;
    const power = 10 ** Math.floor(Math.log10(rough || 1));
    const scaled = rough / power;
    return (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10) * power;
  }
  function showTable(table) { const target=document.querySelector('#viz-alt-visual');target.classList.remove('viz-geometry-study');target.replaceChildren();const t=document.createElement('table');const head=document.createElement('thead');const hr=document.createElement('tr');table.headers.forEach(label=>{const th=document.createElement('th');th.scope='col';th.textContent=label;hr.append(th);});head.append(hr);const body=document.createElement('tbody');table.rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});body.append(tr);});t.append(head,body);target.append(t);target.hidden=false;chart.hidden=true;document.querySelector('.viz-chart-caption').hidden=true;document.querySelector('.viz-chart-wrap').classList.add('viz-alt-view-active'); }
  function showGraph(points, scatterPoints, focus, areaThrough, bounds) { const alternate=document.querySelector('#viz-alt-visual');alternate.classList.remove('viz-geometry-study');alternate.hidden=true;chart.hidden=false;document.querySelector('.viz-chart-caption').hidden=false;document.querySelector('.viz-chart-wrap').classList.remove('viz-alt-view-active');return renderPlot(points,scatterPoints,focus,areaThrough,bounds); }
  function renderSelected() {
    const key=topic.value;activeSpec=specs[key];const generic=topics[key];const studio=studios[key];
    if (geometryVisualizer) { geometryVisualizer.dispose(); geometryVisualizer = null; }
    if (rulePanel) rulePanel.hidden = !studio?.formulaReference;
    if (!studio && formulaReference) formulaReference.hidden = true;
    controls.replaceChildren();chart.hidden=false;document.querySelector('#viz-alt-visual').hidden=true;document.querySelector('.viz-chart-caption').hidden=false;document.querySelector('.viz-chart-wrap').classList.remove('viz-alt-view-active');
    if(studio){renderStudio(studio);return;}
    if(activeSpec){const [title,desc,rule,fields,fn,ruleFn]=activeSpec;heading.textContent=title;description.textContent=desc;ruleLabel.textContent='Current rule';equation.textContent=rule;buildControls({fields});setMetrics([]);
      const update=()=>{try{const v=valuesFrom({fields});const y=fn(v);output.textContent=Number.isFinite(y)?fmt.format(y):'undefined for x < 0';readout.textContent=`At x = ${fmt.format(v.x)}, y = ${Number.isFinite(y)?fmt.format(y):'undefined'}.`;equation.textContent=ruleFn(v);const pts=Array.from({length:101},(_,i)=>{const x=-5+i*.1;return [x,fn({...v,x})];});showGraph(pts,null,Number.isFinite(y)?[v.x,y]:null);}catch(error){equation.textContent='Check the entered values';output.textContent='—';readout.textContent=error.message;line.setAttribute('d','');area.setAttribute('d','');markers.replaceChildren();point.style.display='none';}}
      controls.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',update));update();return;
    }
    if (key === 'triangle') { renderTriangleStudy(); return; }
    if (key === 'geometry') { renderGeometryStudy(); return; }
    heading.textContent=generic.title;description.textContent=generic.description;ruleLabel.textContent='Live result';buildControls(generic);setMetrics([]);const update=()=>{try{const result=generic.calc(valuesFrom(generic));equation.textContent=result.rule;output.textContent=result.value;readout.textContent=result.read;if(result.table)showTable(result.table);else showGraph(result.points||[],result.scatter,undefined,result.areaThrough);}catch(error){equation.textContent='Check the entered values';output.textContent='—';readout.textContent=error.message;line.setAttribute('d','');area.setAttribute('d','');markers.replaceChildren();point.style.display='none';document.querySelector('#viz-alt-visual').hidden=true;chart.hidden=false;}};controls.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',update));update();
  }
  function renderTriangleStudy() {
    heading.textContent = topics.triangle.title;
    description.textContent = topics.triangle.description;
    ruleLabel.textContent = 'Live result';
    controls.replaceChildren();
    chart.hidden = false;
    const triangleAlt = document.querySelector('#viz-alt-visual');
    if (triangleAlt) triangleAlt.hidden = true;
    const triangleCaption = document.querySelector('.viz-chart-caption');
    if (triangleCaption) triangleCaption.hidden = false;
    const triangleWrap = document.querySelector('.viz-chart-wrap');
    if (triangleWrap && triangleWrap.classList) triangleWrap.classList.remove('viz-alt-view-active');
    // One study hosts all three triangle prototypes: the Pythagorean
    // target-solver (visualizers/2d.html), the area/base/height explorer
    // (visualizers/triangle-area-explorer.html), and the SSS–SSA oblique
    // solvers (visualizers/oblique-solver.html,
    // visualizers/oblique-triangle-solver.html).
    const problemField = document.createElement('label');
    problemField.className = 'op-control';
    const problemTitle = document.createElement('span');
    problemTitle.textContent = 'Triangle problem';
    const problemSelect = document.createElement('select');
    problemSelect.id = 'viz-tri-mode';
    problemSelect.setAttribute('aria-label', 'Triangle problem');
    [['right-triangle', 'Right triangle (a² + b² = c²)'], ['base-height', 'Area / base / height'], ['SSS', 'SSS'], ['SAS', 'SAS'], ['ASA', 'ASA'], ['AAS', 'AAS'], ['SSA', 'SSA']].forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      problemSelect.append(option);
    });
    problemSelect.value = 'right-triangle';
    problemField.append(problemTitle, problemSelect);
    const sub = document.createElement('div');
    sub.className = 'viz-triangle-controls';
    controls.append(problemField, sub);
    const numberField = (id, label, value) => {
      const lab = document.createElement('label');
      lab.className = 'op-control';
      const title = document.createElement('span');
      title.textContent = label;
      const input = document.createElement('input');
      input.type = 'number';
      input.id = id;
      input.value = value;
      input.step = 'any';
      input.setAttribute('aria-label', label);
      lab.append(title, input);
      return lab;
    };
    const selectField = (id, label, options, value) => {
      const lab = document.createElement('label');
      lab.className = 'op-control';
      const title = document.createElement('span');
      title.textContent = label;
      const input = document.createElement('select');
      input.id = id;
      input.setAttribute('aria-label', label);
      options.forEach((entry) => {
        const val = Array.isArray(entry) ? entry[0] : entry;
        const text = Array.isArray(entry) ? entry[1] : entry;
        const option = document.createElement('option');
        option.value = val;
        option.textContent = text;
        input.append(option);
      });
      input.value = value;
      lab.append(title, input);
      return lab;
    };
    const readNumber = (id, label) => {
      const el = document.querySelector(`#${id}`);
      const raw = String(el.value ?? '').trim();
      if (!raw) throw new Error(`Enter a value for ${label.toLowerCase()}.`);
      const number = Number(raw);
      if (!Number.isFinite(number)) throw new Error(`${label} must be a finite number.`);
      return number;
    };
    const OBLIQUE_LABELS = { SSS: ['Side a', 'Side b', 'Side c'], SAS: ['Side a', 'Angle C (°)', 'Side b'], ASA: ['Angle A (°)', 'Side c', 'Angle B (°)'], AAS: ['Angle A (°)', 'Angle B (°)', 'Side a'], SSA: ['Side a', 'Side b', 'Angle A (°)'] };
    const OBLIQUE_DEFAULTS = { SSS: [6, 7, 8], SAS: [6, 75.5, 7], ASA: [46.6, 8, 57.9], AAS: [46.6, 57.9, 6], SSA: [6, 7, 46.6] };
    function buildSub() {
      sub.replaceChildren();
      const mode = problemSelect.value;
      if (mode === 'right-triangle') {
        sub.append(
          selectField('viz-tri-target', 'Solve for', [['c', 'Hypotenuse (c)'], ['a', 'Side a'], ['b', 'Side b']], 'c'),
          numberField('viz-tri-a', 'Side a (base)', 6.1),
          numberField('viz-tri-b', 'Side b (height)', 5.8),
          numberField('viz-tri-c', 'Hypotenuse (c)', 8.4),
        );
      } else if (mode === 'base-height') {
        sub.append(
          selectField('viz-tri-solvefor', 'Solve for', [['area', 'Area'], ['base', 'Base'], ['height', 'Height']], 'area'),
          numberField('viz-tri-base', 'Base', 10),
          numberField('viz-tri-height', 'Height', 6),
          numberField('viz-tri-area', 'Area', 30),
        );
      } else {
        const labels = OBLIQUE_LABELS[mode];
        const defaults = OBLIQUE_DEFAULTS[mode];
        sub.append(
          numberField('viz-tri-v0', labels[0], defaults[0]),
          numberField('viz-tri-v1', labels[1], defaults[1]),
          numberField('viz-tri-v2', labels[2], defaults[2]),
        );
      }
      sub.querySelectorAll('input,select').forEach((el) => {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      });
      update();
    }
    function update() {
      try {
        const mode = problemSelect.value;
        if (mode === 'right-triangle') {
          const target = document.querySelector('#viz-tri-target').value;
          const a = readNumber('viz-tri-a', 'Side a');
          const b = readNumber('viz-tri-b', 'Side b');
          const c = readNumber('viz-tri-c', 'Hypotenuse');
          const solved = M.solveRightTriangle(target, a, b, c);
          ['a', 'b', 'c'].forEach((key) => {
            const el = document.querySelector(`#viz-tri-${key}`);
            if (el) el.disabled = (key === target);
          });
          const solvedEl = document.querySelector(`#viz-tri-${target}`);
          if (solvedEl) solvedEl.value = String(Math.round(solved[target] * 1000) / 1000);
          const formula = target === 'a' ? 'a = √(c² − b²)' : target === 'b' ? 'b = √(c² − a²)' : 'c = √(a² + b²)';
          equation.textContent = `a² + b² = c² · ${formula}`;
          output.textContent = `${target} = ${fmt.format(solved[target])}`;
          const steps = target === 'c'
            ? `1. Formula: c = √(a² + b²) · 2. Substitute: c = √(${fmt.format(solved.a)}² + ${fmt.format(solved.b)}²) · 3. Square: c = √(${fmt.format(solved.squares.a2)} + ${fmt.format(solved.squares.b2)}) · 4. Add: c = √(${fmt.format(solved.squares.a2 + solved.squares.b2)}) · 5. Final: c ≈ ${fmt.format(solved.c)}`
            : target === 'a'
              ? `1. Formula: a = √(c² − b²) · 2. Substitute: a = √(${fmt.format(solved.c)}² − ${fmt.format(solved.b)}²) · 3. Square: a = √(${fmt.format(solved.squares.c2)} − ${fmt.format(solved.squares.b2)}) · 4. Subtract: a = √(${fmt.format(solved.squares.c2 - solved.squares.b2)}) · 5. Final: a ≈ ${fmt.format(solved.a)}`
              : `1. Formula: b = √(c² − a²) · 2. Substitute: b = √(${fmt.format(solved.c)}² − ${fmt.format(solved.a)}²) · 3. Square: b = √(${fmt.format(solved.squares.c2)} − ${fmt.format(solved.squares.a2)}) · 4. Subtract: b = √(${fmt.format(solved.squares.c2 - solved.squares.a2)}) · 5. Final: b ≈ ${fmt.format(solved.b)}`;
          readout.textContent = `${steps} · Squares: a² = ${fmt.format(solved.squares.a2)}, b² = ${fmt.format(solved.squares.b2)}, c² = ${fmt.format(solved.squares.c2)} · Area ${fmt.format(solved.area)}.`;
          setMetrics([['Side a', fmt.format(solved.a)], ['Side b', fmt.format(solved.b)], ['Hypotenuse c', fmt.format(solved.c)], ['Area', fmt.format(solved.area)]]);
          showGraph([[0, 0], [solved.a, 0], [0, solved.b], [0, 0]]);
          return;
        }
        if (mode === 'base-height') {
          const solveFor = document.querySelector('#viz-tri-solvefor').value;
          const base = readNumber('viz-tri-base', 'Base');
          const height = readNumber('viz-tri-height', 'Height');
          const areaValue = readNumber('viz-tri-area', 'Area');
          const r = solveFor === 'base' ? M.solveTriangleDimension('base', height, areaValue) : solveFor === 'height' ? M.solveTriangleDimension('height', base, areaValue) : M.solveTriangleDimension('area', base, height);
          const solvedId = solveFor === 'base' ? 'viz-tri-base' : solveFor === 'height' ? 'viz-tri-height' : 'viz-tri-area';
          ['viz-tri-base', 'viz-tri-height', 'viz-tri-area'].forEach((id) => {
            const el = document.querySelector(`#${id}`);
            if (el) el.disabled = (id === solvedId);
          });
          const solvedInput = document.querySelector(`#${solvedId}`);
          if (solvedInput) solvedInput.value = String(Math.round((solveFor === 'area' ? r.area : solveFor === 'base' ? r.base : r.height) * 1000) / 1000);
          if (solveFor === 'area') {
            equation.textContent = `A = (b × h) / 2 = (${fmt.format(r.base)} × ${fmt.format(r.height)}) / 2`;
            output.textContent = `Area ${fmt.format(r.area)}`;
            readout.textContent = `Base ${fmt.format(r.base)} and height ${fmt.format(r.height)} give A = bh/2 = ${fmt.format(r.area)}.`;
          } else if (solveFor === 'base') {
            equation.textContent = `b = 2A / h = 2 × ${fmt.format(r.area)} / ${fmt.format(r.height)}`;
            output.textContent = `Base ${fmt.format(r.base)}`;
            readout.textContent = `Height ${fmt.format(r.height)} and area ${fmt.format(r.area)} give b = 2A/h = ${fmt.format(r.base)}.`;
          } else {
            equation.textContent = `h = 2A / b = 2 × ${fmt.format(r.area)} / ${fmt.format(r.base)}`;
            output.textContent = `Height ${fmt.format(r.height)}`;
            readout.textContent = `Base ${fmt.format(r.base)} and area ${fmt.format(r.area)} give h = 2A/b = ${fmt.format(r.height)}.`;
          }
          setMetrics([['Base', fmt.format(r.base)], ['Height', fmt.format(r.height)], ['Area', fmt.format(r.area)]]);
          showGraph([[0, 0], [r.base, 0], [r.base * 0.4, r.height], [0, 0]]);
          return;
        }
        const labels = OBLIQUE_LABELS[mode];
        const v0 = readNumber('viz-tri-v0', labels[0]);
        const v1 = readNumber('viz-tri-v1', labels[1]);
        const v2 = readNumber('viz-tri-v2', labels[2]);
        const r = M.solveObliqueTriangle(mode, v0, v1, v2);
        const law = mode === 'SSS' ? 'Law of Cosines for each angle' : mode === 'SAS' ? 'c = √(a² + b² − 2ab·cos C), then Law of Cosines' : mode === 'SSA' ? 'sin B = (b·sin A) / a, then C = 180° − A − B' : 'C = 180° − A − B, then Law of Sines';
        let note = '';
        if (mode === 'SSA') {
          const altB = 180 - r.B;
          if (altB + v2 < 180 - 1e-9 && Math.abs(altB - r.B) > 1e-6) note = ` Alternate valid configuration exists (B₂ ≈ ${fmt.format(altB)}°); showing the primary acute path.`;
        }
        equation.textContent = `${mode}: ${labels[0]} ${fmt.format(v0)} · ${labels[1]} ${fmt.format(v1)} · ${labels[2]} ${fmt.format(v2)}`;
        output.textContent = `${r.classification} · area ${fmt.format(r.area)}`;
        readout.textContent = `${law}: a ${fmt.format(r.a)}, b ${fmt.format(r.b)}, c ${fmt.format(r.c)}; A ${fmt.format(r.A)}°, B ${fmt.format(r.B)}°, C ${fmt.format(r.C)}°. Perimeter ${fmt.format(r.perimeter)}.${note}`;
        setMetrics([['Classification', r.classification], ['Area', fmt.format(r.area)], ['Perimeter', fmt.format(r.perimeter)]]);
        const toRad = (d) => (d * Math.PI) / 180;
        showGraph([[0, 0], [r.c, 0], [r.b * Math.cos(toRad(r.A)), r.b * Math.sin(toRad(r.A))], [0, 0]]);
      } catch (error) {
        equation.textContent = 'Check the entered values';
        output.textContent = '—';
        readout.textContent = error.message;
        line.setAttribute('d', ''); area.setAttribute('d', ''); markers.replaceChildren(); point.style.display = 'none';
        setMetrics([]);
      }
    }
    problemSelect.addEventListener('input', buildSub);
    problemSelect.addEventListener('change', buildSub);
    buildSub();
  }
  function renderGeometryStudy() {
    heading.textContent = topics.geometry.title;
    description.textContent = topics.geometry.description;
    ruleLabel.textContent = 'Live measurements';
    const altVisual = document.querySelector('#viz-alt-visual');
    const caption = document.querySelector('.viz-chart-caption');
    document.querySelector('.viz-chart-wrap').classList.add('viz-alt-view-active');
    chart.hidden = true;
    caption.hidden = true;
    altVisual.hidden = false;
    altVisual.classList.add('viz-geometry-study');
    altVisual.replaceChildren();
    const viewport = document.createElement('div');
    viewport.className = 'viz-geometry-viewport';
    viewport.setAttribute('role', 'img');
    viewport.setAttribute('aria-label', 'Interactive 3D solid geometry model. Drag to orbit and scroll to zoom.');
    const help = document.createElement('p');
    help.className = 'viz-geometry-help';
    help.textContent = 'Drag to orbit · Scroll to zoom';
    altVisual.append(viewport, help);

    const shapeField = document.createElement('label');
    shapeField.className = 'viz-control';
    shapeField.htmlFor = 'viz-solid-shape';
    const shapeTitle = document.createElement('span');
    shapeTitle.textContent = 'Select 3D shape';
    const shapeSelect = document.createElement('select');
    shapeSelect.id = 'viz-solid-shape';
    shapeSelect.setAttribute('aria-label', 'Select 3D shape');
    const shapes = [['cube','Cube'],['rectangle','Rectangular prism'],['cylinder','Cylinder'],['cone','Cone'],['sphere','Sphere']];
    shapes.forEach(([value,label]) => { const option=document.createElement('option');option.value=value;option.textContent=label;shapeSelect.append(option); });
    shapeSelect.value = 'cube';
    shapeField.append(shapeTitle, shapeSelect);

    const styleField = document.createElement('label');
    styleField.className = 'viz-control';
    styleField.htmlFor = 'viz-solid-style';
    const styleTitle = document.createElement('span');
    styleTitle.textContent = 'Shading style';
    const styleSelect = document.createElement('select');
    styleSelect.id = 'viz-solid-style';
    styleSelect.setAttribute('aria-label', 'Shading style');
    [['filled','Filled with outlines'],['transparent','Transparent'],['wireframe','Wireframe only']].forEach(([value,label]) => { const option=document.createElement('option');option.value=value;option.textContent=label;styleSelect.append(option); });
    styleSelect.value = 'filled';
    styleField.append(styleTitle, styleSelect);

    const colorGroup = document.createElement('div');
    colorGroup.className = 'viz-geometry-colors';
    const colorControls = [];
    for (const [id,labelText,value] of [['viz-solid-color','Shape color','#3b82f6'],['viz-solid-outline','Outline color','#050b14']]) {
      const label=document.createElement('label');label.className='viz-geometry-color';label.htmlFor=id;
      const color=document.createElement('input');color.type='color';color.id=id;color.value=value;color.setAttribute('aria-label',labelText);
      const text=document.createElement('span');text.textContent=labelText;label.append(color,text);colorGroup.append(label);colorControls.push(color);
    }
    const dimensionHost = document.createElement('div');
    dimensionHost.className = 'viz-geometry-dimensions';
    const dimensions = [['a','Size / radius',1],['b','Height / width',1],['c','Depth',1]].map(([key,label,value]) => {
      const group=document.createElement('label');group.className='viz-geometry-dimension';group.htmlFor=`viz-solid-${key}`;
      const title=document.createElement('span');title.textContent=label;
      const range=document.createElement('input');range.type='range';range.id=`viz-solid-${key}`;range.min=.2;range.max=3;range.step=.1;range.value=value;range.setAttribute('aria-label',label);
      const amount=document.createElement('output');amount.htmlFor=range.id;amount.textContent=Number(value).toFixed(1);
      const header=document.createElement('div');header.className='viz-geometry-dimension-heading';header.append(title,amount);
      group.append(header,range);dimensionHost.append(group);
      return { key, group, range, amount, title };
    });
    controls.append(shapeField,styleField,colorGroup,dimensionHost);

    const nameByShape = { cube:'Cube', rectangle:'Rectangular prism', cylinder:'Cylinder', cone:'Cone', sphere:'Sphere' };
    const getDimensions = () => dimensions.map(item => Number(item.range.value));
    const update = () => {
      const shape=shapeSelect.value;
      const [a,b,c]=getDimensions();
      dimensions[1].group.hidden = !['rectangle','cylinder','cone'].includes(shape);
      dimensions[2].group.hidden = shape !== 'rectangle';
      dimensions[0].title.textContent = shape === 'cube' ? 'Edge length' : ['cylinder','cone','sphere'].includes(shape) ? (shape === 'sphere' ? 'Radius' : shape === 'cone' ? 'Base radius' : 'Radius') : 'Width (X)';
      dimensions[1].title.textContent = shape === 'rectangle' ? 'Height (Y)' : 'Height';
      dimensions[2].title.textContent = 'Depth (Z)';
      const mathShape = shape === 'cube' || shape === 'rectangle' ? 'rectangular-prism' : shape;
      const result = shape === 'cube' ? M.geometry(mathShape,a,a,a) : shape === 'rectangle' ? M.geometry(mathShape,a,b,c) : ['cylinder','cone'].includes(shape) ? M.geometry(shape,a,b) : M.geometry(shape,a);
      const activeName=nameByShape[shape];
      output.textContent=`V ${fmt.format(result.volume)} units³`;
      readout.textContent=`${activeName}: surface area ${fmt.format(result.surfaceArea)} units²; volume ${fmt.format(result.volume)} units³.`;
      equation.textContent=`${activeName} · dimensions in units`;
      dimensions.forEach(item=>item.amount.textContent=Number(item.range.value).toFixed(1));
      setMetrics([['Active shape',activeName],['Surface area',`${fmt.format(result.surfaceArea)} units²`],['Volume',`${fmt.format(result.volume)} units³`]]);
      if (geometryVisualizer) geometryVisualizer.update({ shape, a, b, c, style:styleSelect.value, color:colorControls[0].value, outline:colorControls[1].value });
      else if (typeof window.createGeometryVisualizer === 'function') {
        try { geometryVisualizer=window.createGeometryVisualizer(viewport);geometryVisualizer.update({ shape,a,b,c,style:styleSelect.value,color:colorControls[0].value,outline:colorControls[1].value }); }
        catch (error) { viewport.textContent=`The 3D model could not start: ${error.message}`; }
      } else {
        viewport.textContent=window.geometryVisualizerError ? `The 3D model could not load: ${window.geometryVisualizerError.message}` : 'Loading the interactive 3D model…';
        if (!window.geometryVisualizerError) geometryLoadPending = true;
        requestGeometryRuntime();
      }
    };
    [shapeSelect,styleSelect,...colorControls,...dimensions.map(item=>item.range)].forEach(control=>{control.addEventListener('input',update);control.addEventListener('change',update);});
    update();
  }
  topic.addEventListener('change',renderSelected);
  document.querySelector('#viz-reset').addEventListener('click',()=>{renderSelected();});
  renderSelected();

  const filterButtons=[...document.querySelectorAll('[data-viz-filter]')];const entries=[...document.querySelectorAll('[data-viz-category]')];
  filterButtons.forEach(button=>button.addEventListener('click',()=>{filterButtons.forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));});entries.forEach(entry=>entry.hidden=button.dataset.vizFilter!=='all'&&entry.dataset.vizCategory!==button.dataset.vizFilter);}));

  // Collection cards are shortcuts into the matching interactive study.
  // Keep the existing card styling and use the topic picker as the single source of state.
  const studyTopics = { functions:'quadratic', sequences:'sequence', data:'regression', finance:'finance' };
  entries.forEach(entry=>{
    const link=entry.querySelector('.study-action');
    const selectedTopic=studyTopics[entry.dataset.vizCategory];
    if(!link||!selectedTopic)return;
    link.href=`#visual-workspace`;
    link.addEventListener('click',event=>{
      event.preventDefault();
      topic.value=selectedTopic;
      topic.dispatchEvent(new Event('change', { bubbles:true }));
      document.querySelector('#visual-workspace').scrollIntoView?.({behavior:'smooth',block:'start'});
      topic.focus?.({preventScroll:true});
    });
  });

  // Arrow-key navigation across the lens filter pills.
  filterButtons.forEach((button,index)=>{
    button.addEventListener('keydown',event=>{
      const step=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
      if(!step)return;
      event.preventDefault();
      const next=filterButtons[(index+step+filterButtons.length)%filterButtons.length];
      next.focus();
      next.click();
    });
  });

  // Publish the current rule so other studios and the assistant can read it.
  const rulePanelEl = document.querySelector('#viz-rule-panel');
  const equationEl = document.querySelector('#viz-equation');
  function announceRule(){
    if(!equationEl||!equationEl.textContent)return;
    document.body.dataset.vizRule=equationEl.textContent;
    window.dispatchEvent(new CustomEvent('viz-rule-change',{detail:{rule:equationEl.textContent,topic:topic.value}}));
  }
  if(equationEl&&typeof MutationObserver==='function'){
    new MutationObserver(announceRule).observe(equationEl,{childList:true,characterData:true,subtree:true});
    announceRule();
  }

  // Click the rule panel to copy the equation (progressive enhancement).
  if(rulePanelEl&&equationEl&&typeof navigator!=='undefined'&&navigator.clipboard?.writeText){
    rulePanelEl.classList.add('is-copyable');
    rulePanelEl.title='Click to copy this rule';
    rulePanelEl.addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(equationEl.textContent);
        rulePanelEl.classList.add('is-copied');
        setTimeout(()=>rulePanelEl.classList.remove('is-copied'),1200);
      }catch(error){/* clipboard unavailable — leave the panel as-is */}
    });
  }
})();
