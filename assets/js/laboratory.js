(() => {
  const M=window.ObservatoryMath;const picker=document.querySelector('#lab-experiment-select');const rail=document.querySelector('.lab-control-rail');
  const title=document.querySelector('#lab-title'),objective=document.querySelector('#lab-objective'),source=document.querySelector('#lab-source'),model=document.querySelector('#lab-model'),modelCopy=document.querySelector('#lab-model-copy');
  const balance=document.querySelector('#lab-balance'),line=document.querySelector('#lab-line'),area=document.querySelector('#lab-area'),dot=document.querySelector('#lab-dot');
  const currency=new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'});const fmt=new Intl.NumberFormat(undefined,{maximumFractionDigits:2});let current;
  // ── Polynomial explorer state (shared by the rail and the canvas view) ──
  // The coefficient sliders in the rail are rebuilt whenever the degree
  // changes, so the chosen coefficients live here rather than only in the DOM.
  const POLY_NAMES=['Constant','Slope','Quadratic term','Cubic term','Quartic term'];
  const POLY_SUB=['₀','₁','₂','₃','₄'];
  const POLY_SUP={2:'²',3:'³',4:'⁴'};
  const POLY_PRESETS={
    line:{degree:1,coef:[0,1,0,0,0]},
    parabola:{degree:2,coef:[0,0,1,0,0]},
    cubic:{degree:3,coef:[0,-3,0,1,0]},
    wave:{degree:4,coef:[1,0,-2,0,0.2]},
    flat:{degree:1,coef:[2,0,0,0,0]}
  };
  const polyState={degree:1,coef:[0.3,-1.4,0,0,0]};
  // Set by render() so the canvas view can ask the rail to rebuild itself.
  let polyRebuild=null;
  const experiments={
    'compare-interest':{title:'Simple vs compound interest',question:'How does repeated compounding compare with simple interest over the same term?',source:'Simple and compound interest · sequences',model:'Simple: P(1+rt) · Compound: P(1+r)ᵗ',copy:'Both models use the same principal, annual rate, and years.',chartMode:'compare',statBoxes:[{id:'simple',label:'Simple Interest Total',cls:'lab-compare-simple',get:(v,r)=>r.simpleFinal},{id:'compound',label:'Compound Interest Total',cls:'lab-compare-compound',get:(v,r)=>r.compoundFinal},{id:'diff',label:'The Compound Advantage',cls:'lab-compare-diff',get:(v,r)=>r.diff}],fields:[['principal','Principal',1000,100,100000,100],['rate','Annual rate (%)',5,0,20,.5],['years','Years',10,1,30,1]],calculate:v=>{const P=v.principal,r=v.rate/100,t=v.years;const rows=Array.from({length:t+1},(_,i)=>({year:i,simple:Math.round(P*(1+r*i)*100)/100,compound:Math.round(P*Math.pow(1+r,i)*100)/100}));const simpleFinal=rows[t].simple,compoundFinal=rows[t].compound,diff=compoundFinal-simpleFinal;return {value:`Simple ${currency.format(simpleFinal)} · compound ${currency.format(compoundFinal)} · diff ${currency.format(diff)}`,label:'FINAL BALANCE COMPARISON',points:rows.map(row=>[row.year,row.compound]),simpleFinal:currency.format(simpleFinal),compoundFinal:currency.format(compoundFinal),diff:currency.format(diff),note:`At ${v.rate}% for ${t} years, compound interest is ${currency.format(diff)} higher than simple interest. Simple interest is calculated on the original principal; compound interest is calculated on the growing balance.`,question:'When the rate and time are positive, which balance is larger, and why?',hint:'Compound interest earns interest on previously earned interest.'};}},
    'compound-chartjs':{title:'Compound interest',question:'How do the rate and time affect an investment that compounds once per year?',source:'Compound interest · geometric growth',model:'A = P(1 + r)ᵗ',copy:'Each year the balance is multiplied by the same growth factor.',chartMode:'single',fields:[['principal','Starting amount',10000,0,1300000,100],['rate','Annual rate (%)',7,0,30,.1],['years','Time (years)',10,1,50,1]],calculate:v=>{const P=v.principal,r=v.rate/100,t=v.years;const rows=Array.from({length:t+1},(_,i)=>[i,Math.round(P*Math.pow(1+r,i)*100)/100]);return {value:`Future Value: $${rows.at(-1)[1].toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`,label:'FINAL BALANCE',points:rows,note:`${currency.format(P)} grows to ${currency.format(rows.at(-1)[1])}, earning ${currency.format(rows.at(-1)[1]-P)} over ${t} years. Later interest is calculated on the growing balance.`,question:`Compare the increase from year 1 to 2 with the increase from year ${Math.max(1,t-1)} to ${t}. Are they equal?`,hint:'The growth factor is fixed, but each year it acts on a larger balance.'};}},
    sequence:{title:'Geometric sequences',question:'How does changing the common ratio affect the terms and total of a geometric pattern?',source:'Geometric sequences and finite series',model:'aₙ = a₁rⁿ⁻¹',copy:'Multiply each term by a constant ratio.',drawMode:'bar',customRender:'geometric',statBoxes:[{id:'formula',label:'Current Formula',cls:'',get:(v,r)=>r.meta.formula},{id:'last',label:'Last Term (aₙ)',cls:'',get:(v,r)=>r.meta.last},{id:'sum',label:'Sum (Sₙ)',cls:'',get:(v,r)=>r.meta.sum}],fields:[['first','Initial term (a)',5,-10,10,.5],['ratio','Common ratio (r)',.75,-2,2,.05],['count','Number of terms (n)',12,1,20,1]],calculate:v=>{const terms=M.sequence('geometric',v.first,v.ratio,v.count);const rows=terms.map((x,i)=>[i+1,x]);const sum=terms.reduce((s,x)=>s+x,0);return {value:`Last ${fmt.format(terms.at(-1))} · sum ${fmt.format(sum)}`,label:'LAST TERM & SUM',points:rows,meta:{formula:`aₙ = ${v.first} × (${v.ratio})ⁿ⁻¹`,last:fmt.format(terms.at(-1)),sum:fmt.format(sum)},note:`The common ratio ${fmt.format(v.ratio)} scales every term; the ${v.count} displayed terms sum to ${fmt.format(sum)}. Absolute terms ${Math.abs(v.ratio)>1?'grow':'shrink'} because the ratio is ${Math.abs(v.ratio)>1?'above':'below'} 1.`,question:'Does the sequence grow, shrink, or alternate in sign? What does the ratio tell you?',hint:'A ratio above 1 grows for positive terms; between 0 and 1 shrinks; a negative ratio alternates signs.'};}},
    fibonacci:{title:'Fibonacci sequence',question:'How does each new Fibonacci term depend on the two terms before it?',source:'Patterns · Fibonacci sequence',model:'Fₙ = Fₙ₋₁ + Fₙ₋₂',copy:'This activity uses the common starting terms 0 and 1.',chartMode:'fib',customRender:'fibonacci',statBoxes:[{id:'term',label:'Current Term',cls:'',get:(v,r)=>r.meta.term},{id:'sum',label:'Sequence Sum',cls:'',get:(v,r)=>r.meta.sum},{id:'ratio',label:'Ratio Fₙ/Fₙ₋₁',cls:'',get:(v,r)=>r.meta.ratio}],fields:[['count','Sequence terms',12,3,40,1]],calculate:v=>{const terms=M.sequence('fibonacci',0,0,v.count),points=terms.map((x,i)=>[i+1,x]);const sum=terms.reduce((s,x)=>s+x,0);const last=terms.at(-1),prev=terms.at(-2);return {value:`Term ${v.count} = ${last.toLocaleString()}`,label:'CURRENT TERM',points,fibValues:terms,fibLabels:terms.map((_,i)=>'F'+(i+1)),meta:{term:`F${v.count} = ${last.toLocaleString()}`,sum:sum.toLocaleString(),ratio:prev>0?(last/prev).toFixed(4):'–'},note:`Terms: ${terms.slice(0,10).join(', ')}${terms.length>10?' … '+terms.slice(-3).join(', '):''}. Each term after the first two is the sum of its two predecessors, and the ratio approaches φ ≈ 1.6180.`,question:'Check three consecutive terms: does the next equal the sum of the previous two?',hint:'For example, after 2 and 3 comes 5.'};}},
    function:{title:'Polynomial explorer',question:'How do the degree and the coefficients change the shape, intercept, and roots of a polynomial?',source:'Functions · polynomial models',model:'f(x) = a₀ + a₁x + a₂x² + a₃x³ + a₄x⁴',copy:'Only coefficients up to the chosen degree affect the curve.',chartMode:'poly',customRender:'polynomial',statBoxes:[{id:'deg',label:'Degree Order',cls:'',get:(v,r)=>r.poly.degree},{id:'yint',label:'Y-Intercept',cls:'',get:(v,r)=>r.poly.yIntercept},{id:'roots',label:'Est. X-Roots',cls:'',get:(v,r)=>r.poly.roots}],fields:[['degree','Polynomial degree',['1','2','3','4']],['a0','Constant term (a₀)',0,-5,5,.1],['a1','Slope (a₁)',1,-5,5,.1],['a2','Quadratic term (a₂)',0,-5,5,.1],['a3','Cubic term (a₃)',0,-5,5,.1],['a4','Quartic term (a₄)',0,-5,5,.1]],calculate:v=>{const d=Math.max(1,Math.min(4,Number(v.degree)||1));const c=[Number(v.a0)||0,Number(v.a1)||0,Number(v.a2)||0,Number(v.a3)||0,Number(v.a4)||0];const evalAt=x=>{let y=0;for(let i=d;i>=0;i--)y=y*x+c[i];return y;};const N=201,xMin=-5,xMax=5;const xs=[],ys=[];for(let i=0;i<=N;i++){const x=xMin+(i/N)*(xMax-xMin);xs.push(Math.round(x*1000)/1000);ys.push(Math.round(evalAt(x)*1e6)/1e6);}let ed=d;while(ed>0&&c[ed]===0)ed--;let roots=0;for(let i=1;i<=N;i++){if(ys[i-1]!==0&&ys[i-1]*ys[i]<0)roots++;}return {value:`Degree ${ed} · y-intercept ${fmt.format(c[0])}`,label:'POLYNOMIAL MODEL',points:xs.map((x,i)=>[x,ys[i]]),poly:{xs,ys,degree:ed,yIntercept:fmt.format(c[0]),roots},note:`A degree-${ed} polynomial with ${ed+1} coefficient${ed?'s':''}. The y-intercept is a₀ = ${fmt.format(c[0])}, and the curve crosses or touches the x-axis about ${roots} time${roots===1?'':'s'} across −5 ≤ x ≤ 5.`,question:'Change only the constant term a₀, then only the slope a₁. Which change shifts the whole curve up or down?',hint:'a₀ moves the curve vertically; higher-order coefficients bend it and change how many roots appear.'};}},
    distribution:{title:'Expected value',question:'How does changing an outcome probability affect the expected value of a two-outcome variable?',source:'Discrete random variables · expectation and variance',model:'E(X) = ΣxP(X=x)',copy:'Two outcomes are 0 and 1, with probabilities p and 1−p.',fields:[['probability','Probability of outcome 1',.5,0,1,.05]],calculate:v=>{const p=v.probability,d=M.discreteDistribution([0,1],[1-p,p]);return {value:`E(X) ${fmt.format(d.expectedValue)} · SD ${fmt.format(d.standardDeviation)}`,label:`P(X=1) = ${fmt.format(p)}`,points:[[0,1-p],[1,p]],note:`For outcomes 0 and 1, expected value is ${fmt.format(d.expectedValue)} and variance is ${fmt.format(d.variance)}.`,question:'At which probability is the uncertainty, measured by standard deviation, greatest?',hint:'For a two-outcome 0/1 variable, variance p(1−p) is largest at p=0.5.'};}},
    triangle:{title:"Heron's formula",question:'How does changing a triangle side affect its area when all three sides are known?',source:'Triangle area · Heron formula',model:'K = √[s(s−a)(s−b)(s−c)]',copy:'The three side lengths must satisfy the triangle inequality.',fields:[['a','Side a',7,.1,30,.5],['b','Side b',8,.1,30,.5],['c','Side c',9,.1,30,.5]],calculate:v=>{const area=M.triangleAreaHeron(v.a,v.b,v.c);return {value:`Area ${fmt.format(area)} square units`,label:`Semiperimeter s = ${fmt.format((v.a+v.b+v.c)/2)}`,points:[[0,v.a],[1,v.b],[2,v.c]],note:`Heron's formula gives area ${fmt.format(area)} for sides ${v.a}, ${v.b}, ${v.c}.`,question:'Can three positive lengths always form a triangle?',hint:'The sum of any two side lengths must be greater than the third.'};}},
    price:{title:'Price adjustments',question:'How does the order of markup, discount, and VAT affect the final price?',source:'Business mathematics · markup · discount · VAT',model:'Apply each stated percentage in sequence',copy:'This model applies markup, then discount, then VAT.',fields:[['price','Starting price',1000,1,100000,10],['markup','Markup (%)',20,0,100,1],['discount','Discount (%)',10,0,100,1],['vat','VAT (%)',12,0,100,1]],calculate:v=>{const r=M.priceChange(v.price,v.markup,v.discount,v.vat),points=[[0,v.price],[1,r.marked],[2,r.discounted],[3,r.finalPrice]];return {value:`Final ${currency.format(r.finalPrice)}`,label:'PRICE AFTER VAT',points,note:`Markup gives ${currency.format(r.marked)}; after discount ${currency.format(r.discounted)}; VAT adds ${currency.format(r.vatAmount)}.`,question:'Is a 20% markup followed by a 10% discount the same as a 10% increase?',hint:'Sequential percentage changes apply to changing bases, so calculate each step in order.'};}},
    regression:{title:'Association and best fit',question:'How strongly do the paired values follow a linear trend?',source:'Scatter plots · Pearson correlation · line of best fit',model:'ŷ = a + bx',copy:'Correlation describes linear association; it does not establish causation.',fields:[['xdata','x observations','1, 2, 3, 4, 5'],['ydata','y observations','2, 3, 5, 4, 7']],calculate:v=>{const x=M.parseList(v.xdata),y=M.parseList(v.ydata),r=M.linearRegression(x,y);return {value:`r = ${fmt.format(r.correlation)}`,label:`ŷ = ${fmt.format(r.intercept)} + ${fmt.format(r.slope)}x`,points:x.map((xx,i)=>[xx,y[i]]),note:`Least-squares line: ŷ = ${fmt.format(r.intercept)} + ${fmt.format(r.slope)}x. Pearson r = ${fmt.format(r.correlation)} for ${r.count} pairs.`,question:'Is the association positive or negative, and is it weak or strong?',hint:'Values of r near 1 indicate strong positive linear association; near −1 strong negative association; near 0 little linear association.'};}},
    loan:{title:'Loan repayment',question:'How do payment period rate and loan length affect a fixed periodic payment?',source:'Consumer loans · amortization',model:'PMT = PV·i / [1 − (1+i)⁻ⁿ]',copy:'Level end-of-period payments; fees are excluded.',fields:[['principal','Loan principal',10000,100,100000,100],['rate','Rate per payment (%)',1,0,5,.1],['periods','Number of payments',24,2,120,1]],calculate:v=>{const p=M.loanPayment(v.principal,v.rate,v.periods),i=v.rate/100;let bal=v.principal;const rows=[[0,bal]];for(let n=1;n<=v.periods;n++){bal=bal*(1+i)-p;rows.push([n,Math.max(0,bal)]);}return {value:currency.format(p),label:'PAYMENT EACH PERIOD',points:rows,note:`Total paid ${currency.format(p*v.periods)}; total interest ${currency.format(p*v.periods-v.principal)} under a fixed rate.`,question:'If the loan length increases while the rate stays fixed, what usually happens to each payment and total interest?',hint:'More payments can lower each payment but often increase the total interest paid.'};}},
    geometry:{title:'Solid geometry',question:'How does increasing a solid’s size affect its volume and surface area?',source:'Measurement · surface area and volume',model:'Compare V and surface area',copy:'Dimensions are lengths; area scales quadratically and volume cubically.',fields:[['side','Cube side length',4,.5,20,.5]],calculate:v=>{const side=v.side,vals=Array.from({length:10},(_,i)=>{const x=side*(.5+i*.2);return [x,x**3];}),g=M.geometry('rectangular-prism',side,side,side);return {value:`V ${fmt.format(g.volume)} · SA ${fmt.format(g.surfaceArea)}`,label:'CUBE MEASURES',points:vals,note:`At side ${side}, volume is ${fmt.format(g.volume)} units³ and surface area is ${fmt.format(g.surfaceArea)} units².`,question:'If the side length doubles, by what factor does volume change? By what factor does surface area change?',hint:'For a cube, volume depends on side³ and surface area depends on side².'};}},
    temperature:{title:'Temperature scales',question:'How does the same temperature read on Celsius, Fahrenheit, and Kelvin scales?',source:'Measurement · unit conversion',model:'F = ⁹⁄₅C + 32 · K = C + 273.15',copy:'Temperature scales have different zero points and unit sizes.',fields:[['value','Temperature value',25,-273.15,500,.5],['from','Input scale',['C','F','K']]],calculate:v=>{const f=M.convertTemperature(v.value,v.from,'F'),c=M.convertTemperature(v.value,v.from,'C'),k=M.convertTemperature(v.value,v.from,'K');return {value:`${fmt.format(c)}°C · ${fmt.format(f)}°F · ${fmt.format(k)} K`,label:'EQUIVALENT READINGS',points:[[1,c],[2,f],[3,k]],note:`One physical temperature has different numerical readings: ${fmt.format(c)}°C, ${fmt.format(f)}°F, and ${fmt.format(k)} K.`,question:'Why is the Celsius-to-Fahrenheit conversion not just multiplication by a constant?',hint:'The two scales have different zero points, so the conversion includes both a scale factor and an offset.'};}},
    sampling:{title:'Sampling variation',question:'How much can a sample mean vary when samples are drawn from the same population?',source:'Sampling · sample size · statistic and parameter',model:'Repeated random samples',copy:'A simulation illustrates sampling variability; it is not a guarantee about a real population.',fields:[['size','Sample size',5,2,50,1],['repetitions','Simulated samples',30,10,100,10],['seed','Starting seed',11,1,999,1]],calculate:v=>{let seed=Math.floor(v.seed),rand=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};const population=Array.from({length:101},(_,i)=>i),means=[];for(let j=0;j<v.repetitions;j++){let sum=0;for(let k=0;k<v.size;k++)sum+=population[Math.floor(rand()*population.length)];means.push([j+1,sum/v.size]);}const stats=M.summarize(means.map(x=>x[1]));return {value:`Mean of sample means ${fmt.format(stats.mean)}`,label:`SD ${fmt.format(stats.standardDeviation)} · n=${v.size}`,points:means,note:`Across ${v.repetitions} reproducible samples, the sample means average ${fmt.format(stats.mean)} with SD ${fmt.format(stats.standardDeviation)}.`,question:'How does increasing sample size affect the spread of the sample means?',hint:'Larger samples tend to produce less variable sample means, though random samples still differ.'};}}
  };
  function controlsFor(exp){
    rail.innerHTML='<p class="op-kicker">Change a condition</p><h2>Set the experiment</h2><div id="lab-generated-controls"></div><button type="button" class="op-button op-button-lab lab-reset" id="lab-reset">Reset conditions <span aria-hidden="true">↺</span></button>';
    const box=rail.querySelector('#lab-generated-controls');
    const unitFor={rate:'%',years:' yr',size:'',periods:'',count:'',repetitions:'',seed:''};
    // Keep a list of coefficient inputs for polynomial handling
    const coeffInputs=[];
    for(const [id,label,initial,min,max,step] of exp.fields){
      const lab=document.createElement('label');
      lab.className='lab-control';
      lab.htmlFor=`lab-${id}`;
      const cap=document.createElement('span');
      cap.textContent=label;
      let input;
      if(Array.isArray(initial)){
        input=document.createElement('select');
        initial.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);});
        input.id=`lab-${id}`;
        input.classList.add('lab-generated-input');
        lab.append(cap,input);
      }else if(typeof initial==='string'){
        input=document.createElement('input');
        input.type='text';
        input.value=initial;
        input.id=`lab-${id}`;
        input.classList.add('lab-generated-input');
        lab.append(cap,input);
      }else{
        // Numeric field → range slider with a live readout
        const row=document.createElement('span');
        row.className='lab-range-row';
        input=document.createElement('input');
        input.type='range';
        input.id=`lab-${id}`;
        input.min=min;input.max=max;input.step=step||'any';input.value=initial;
        input.classList.add('lab-generated-range');
        const out=document.createElement('output');
        out.htmlFor=`lab-${id}`;
        out.className='lab-generated-output';
        const render=value=>{out.textContent=`${value}${unitFor[id]||''}`;};
        render(initial);
        input.addEventListener('input',()=>render(input.value));
        row.append(input,out);
        lab.append(cap,row);
        // Store coefficient inputs for polynomial degree handling
        if(id.startsWith('a')) coeffInputs.push(input);
      }
      input.dataset.default=input.value;
      box.append(lab);
    }
    // If this is the Polynomial explorer, add preset dropdown to the sidebar
    if(exp.customRender==='polynomial'){
      const presetLabel=document.createElement('label');
      presetLabel.className='lab-control';
      presetLabel.htmlFor='lab-preset';
      const cap=document.createElement('span');
      cap.textContent='Preset';
      const select=document.createElement('select');
      select.id='lab-preset';
      const options=[['custom','Custom'],['line','Line: y = x'],['parabola','Parabola: x²'],['cubic','Cubic: x³ - 3x'],['wave','Quartic: 0.2x⁴ - 2x² + 1'],['flat','Flat: y = 2']];
      options.forEach(([v,txt])=>{const o=document.createElement('option');o.value=v;o.textContent=txt;select.append(o);});
      presetLabel.append(cap,select);
      box.append(presetLabel);
      // handle preset change
      select.addEventListener('change',()=>{
        const p=select.value;
        if(p==='custom') return; // leave current sliders untouched
        const presets={
          line:{degree:1,coef:[0,1,0,0,0]},
          parabola:{degree:2,coef:[0,0,1,0,0]},
          cubic:{degree:3,coef:[0,-3,0,1,0]},
          wave:{degree:4,coef:[1,0,-2,0,0.2]},
          flat:{degree:1,coef:[2,0,0,0,0]}
        }[p];
        if(presets){
          // set degree select
          const degSelect=document.getElementById('lab-degree');
          if(degSelect){degSelect.value=String(presets.degree);degSelect.dispatchEvent(new Event('change'));
          }
          // set coefficient sliders
          presets.coef.forEach((val,idx)=>{
            const inp=document.getElementById(`lab-a${idx}`);
            if(inp){inp.value=val;inp.dispatchEvent(new Event('input'));}
          });
        }
      });

      // Add degree selector to the sidebar for polynomial
      const degLabel=document.createElement('label');
      degLabel.className='lab-control';
      degLabel.htmlFor='lab-degree';
      const degSpan=document.createElement('span');
      degSpan.textContent='Degree';
      const degSelect=document.createElement('select');
      degSelect.id='lab-degree';
      ['1','2','3','4'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;degSelect.append(o);});
      degLabel.append(degSpan,degSelect);
      box.append(degLabel);
    }
  }

  function readValues(exp){const v={};for(const [id,,initial] of exp.fields){const value=document.querySelector(`#lab-${id}`).value;v[id]=Array.isArray(initial)?value:typeof initial==='string'?value:Number(value);}return v;}
  // Bars layer, created once and reused for bar-mode experiments
  const svg=document.querySelector('#lab-chart');
  // ── Chart.js lifecycle ────────────────────────────────────────────────
  // Every Chart.js view shares the single #lab-chart-canvas, so the existing
  // instance MUST be destroyed before a new one is constructed; otherwise
  // Chart.js throws "Canvas is already in use. Chart with ID '0' must be
  // destroyed before the canvas can be reused."
  let activeChart=null;
  let currentClean=[];
  let bars;
  function chartContext(){
    const canvas=document.getElementById('lab-chart-canvas');
    if(!canvas) return null;
    const wrap=canvas.parentElement;
    // The SVG sibling is hidden in Chart.js mode, so give the wrap a real height
    // or the absolutely-positioned canvas collapses to 0 px and nothing draws.
    if(wrap && wrap.offsetHeight < 100) wrap.style.minHeight='320px';
    canvas.style.display='block';
    canvas.style.height='320px';
    return canvas.getContext('2d');
  }
  function destroyChart(){
    if(activeChart){activeChart.destroy();activeChart=null;}
  }
  // mode 'single'  → one balance curve (Compound Interest, from lab/test.html)
  // mode 'compare' → simple vs compound pair (Simple vs Compound Interest and
  //                  the Compound Interest Calculator, from lab/compound-vs-simple.html)
  function renderInterestChart(v,mode){
    const ctx=chartContext();
    if(!ctx) return;
    destroyChart();
    const P=Math.max(Number(v.principal)||0,0);
    const r=Math.max(Number(v.rate)||0,0)/100;
    const t=Math.max(Math.floor(Number(v.years)||0),1);
    const labels=[]; const simpleData=[]; const compoundData=[];
    for(let i=0;i<=t;i++){
      labels.push(`Year ${i}`);
      simpleData.push(Math.round(P*(1+r*i)*100)/100);
      compoundData.push(Math.round(P*Math.pow(1+r,i)*100)/100);
    }
    const money=value=>'$'+Number(value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    const line=(label,color,fill,data)=>({label,data,borderColor:color,backgroundColor:fill,borderWidth:3,tension:0.1,fill:fill!=='transparent',pointRadius:4,pointBackgroundColor:color,pointBorderColor:'#fff',pointBorderWidth:2,pointHoverRadius:7});
    const datasets=mode==='single'
      ? [line('Balance Over Time','#3498db','rgba(52,152,219,0.12)',compoundData)]
      : [line('Simple Interest Growth','#e67e22','transparent',simpleData),line('Compound Interest Growth','#2ecc71','rgba(46,204,113,0.05)',compoundData)];
    activeChart=new Chart(ctx,{
      type:'line',
      data:{labels,datasets},
      options:{
        responsive:true,
        maintainAspectRatio:false,
        scales:{y:{beginAtZero:false,ticks:{color:'#666',callback:value=>'$'+Number(value).toLocaleString(undefined,{maximumFractionDigits:2})}}},
        plugins:{tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${money(ctx.parsed.y)}`}}}
      }
    });
  }
  // Growth curve over Fibonacci terms (from lab/fibonacci-sequence.html)
  function renderFibonacciChart(values,labels){
    const ctx=chartContext();
    if(!ctx) return;
    destroyChart();
    activeChart=new Chart(ctx,{
      type:'line',
      data:{labels,datasets:[{label:'Fₙ',data:values,borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.15)',borderWidth:3,pointRadius:4,pointHoverRadius:7,pointBackgroundColor:'#3b82f6',fill:true,tension:0.35,pointBorderColor:'#fff',pointBorderWidth:2}]},
      options:{
        responsive:true,
        maintainAspectRatio:false,
        animation:{duration:400,easing:'easeInOutCubic'},
        scales:{
          x:{ticks:{color:'#666'}},
          y:{ticks:{color:'#666',callback:value=>Math.abs(value)>=1e6?Number(value).toExponential(2):Number(value).toLocaleString()}}
        },
        plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'Value: '+Number(ctx.parsed.y).toLocaleString()}}}
      }
    });
  }
  // Polynomial curve over −5 ≤ x ≤ 5 (from lab/function-coefficient.html)
  function renderPolyChart(poly){
    const ctx=chartContext();
    if(!ctx) return;
    destroyChart();
    activeChart=new Chart(ctx,{
      type:'line',
      data:{
        labels:poly.xs,
        datasets:[{label:'f(x)',data:poly.ys,borderColor:'#ff7f0e',backgroundColor:'rgba(255,127,14,0.1)',borderWidth:3,pointRadius:0,fill:true,tension:0.1}]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        scales:{
          x:{type:'linear',ticks:{color:'#666',maxTicksLimit:11}},
          y:{ticks:{color:'#666',callback:value=>Math.abs(value)>=1e4?Number(value).toExponential(1):Number(value)}}
        },
        plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`f(x) = ${Number(ctx.parsed.y).toLocaleString()}`}}}
      }
    });
  }

  // ── Native HTML5 canvas engines ───────────────────────────────────────
  // These port the standalone visualizers' own rendering code instead of
  // pushing them through Chart.js. Each owns the #lab-custom-stage element.

  // Port of lab/geometric-sequence.html — Cartesian bars (red for negative
  // terms, blue for positive), a dashed trend line, and a radial spiral view.
  function createGeometricEngine(){
    const stage=document.getElementById('lab-custom-stage');
    if(!stage) return null;
    stage.innerHTML='';
    const head=document.createElement('div');head.className='lab-custom-head';
    const toggle=document.createElement('div');toggle.className='lab-toggle';
    ['bars','spiral'].forEach((m,i)=>{const b=document.createElement('button');b.type='button';b.dataset.view=m;b.textContent=m==='bars'?'Cartesian bars':'Radial spiral';if(i===0)b.classList.add('on');toggle.append(b);});
    head.append(toggle);stage.append(head);
    const wrap=document.createElement('div');wrap.className='lab-custom-canvas-wrap';
    const cv=document.createElement('canvas');cv.id='lab-geo-canvas';cv.setAttribute('aria-label','Geometric sequence');wrap.append(cv);stage.append(wrap);
    const ctx=cv.getContext('2d');
    let view='bars',data={a:5,r:.75,n:12};
    const fmt=(v,d=3)=>{if(!isFinite(v))return v>0?'∞':'-∞';if(Math.abs(v)>=1e6||(Math.abs(v)<1e-4&&v!==0))return v.toExponential(3);return parseFloat(v.toFixed(d)).toLocaleString();};
    const short=v=>parseFloat(v.toFixed(2)).toString();
    const getData=()=>{const terms=[];let sum=0;for(let i=1;i<=data.n;i++){const t=data.a*Math.pow(data.r,i-1);terms.push(t);sum+=t;}return {a:data.a,r:data.r,n:data.n,terms,sum};};
    function resize(){const dpr=window.devicePixelRatio||1;const w=cv.clientWidth,h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
    function drawGrid(w,h){ctx.strokeStyle='#34353b';ctx.lineWidth=1;for(let x=0;x<w;x+=72){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=72){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}}
    function drawBars(d,w,h){
      const padT=40,padB=50,padX=30;
      const maxV=Math.max(...d.terms,0),minV=Math.min(...d.terms,0);
      const range=(maxV-minV)||1,plotH=h-padT-padB;
      const y0=padT+(maxV/range)*plotH;
      const slot=(w-padX*2)/d.n;
      const bw=Math.min(34,slot*0.65);
      const yOf=v=>y0-(v/range)*plotH;
      ctx.strokeStyle='#4a4b52';ctx.beginPath();ctx.moveTo(padX,y0);ctx.lineTo(w-padX,y0);ctx.stroke();
      const pts=[];
      d.terms.forEach((t,i)=>{
        const cx=padX+slot*i+slot/2,y=yOf(t);
        pts.push([cx,y]);
        const top=Math.min(y,y0),bh=Math.max(Math.abs(y0-y),2),neg=t<0;
        ctx.fillStyle=neg?'rgba(235,64,52,0.28)':'rgba(59,111,232,0.25)';
        ctx.strokeStyle=neg?'#eb4034':'#3b6fe8';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.roundRect(cx-bw/2,top,bw,bh,4);ctx.fill();ctx.stroke();
        ctx.fillStyle=neg?'#ff5a4d':'#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
        ctx.fillText(short(t),cx,t>=0?y-8:y+16);
        if(d.n<=14||i%2===0){ctx.fillStyle='#9aa0a6';ctx.font='11px sans-serif';ctx.fillText('n='+(i+1),cx,h-18);}
      });
      ctx.setLineDash([5,4]);ctx.strokeStyle='#3b6fe8';ctx.lineWidth=1.5;
      ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);
    }
    function drawSpiral(d,w,h){
      const cx=w/2,cy=h/2,maxR=Math.min(w,h)/2-30;
      const maxAbs=Math.max(...d.terms.map(Math.abs),1e-9);
      ctx.strokeStyle='#3a3b41';
      [0.33,0.66,1].forEach(k=>{ctx.beginPath();ctx.arc(cx,cy,maxR*k,0,Math.PI*2);ctx.stroke();});
      const step=0.95;
      const pts=d.terms.map((t,i)=>{const rad=(Math.abs(t)/maxAbs)*maxR;const ang=i*step+(t<0?Math.PI:0);return [cx+rad*Math.cos(ang),cy+rad*Math.sin(ang),t];});
      ctx.strokeStyle='#3b6fe8';ctx.lineWidth=2;
      ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
      pts.forEach(([x,y,t],i)=>{
        ctx.fillStyle='#3b6fe8';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
        if(d.n<=12||i<6){ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(`a_${i+1} (${short(t)})`,x,y-10);}
      });
    }
    function draw(){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;const d=getData();ctx.clearRect(0,0,w,h);drawGrid(w,h);view==='bars'?drawBars(d,w,h):drawSpiral(d,w,h);}
    toggle.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;toggle.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));draw();}));
    const ro=new ResizeObserver(resize);ro.observe(wrap);resize();
    return {render(v){data={a:Number(v.first),r:Number(v.ratio),n:Math.max(1,Math.floor(Number(v.count)))};draw();},destroy(){ro.disconnect();stage.innerHTML='';}};
  }

  // Port of lab/fibonacci-sequence.html — golden-spiral square layout with a
  // pan/zoom camera, and a canvas-drawn growth curve (no Chart.js).
  function createFibonacciEngine(){
    const stage=document.getElementById('lab-custom-stage');
    if(!stage) return null;
    stage.innerHTML='';
    const head=document.createElement('div');head.className='lab-custom-head';
    const toggle=document.createElement('div');toggle.className='lab-toggle';
    ['spiral','chart'].forEach((m,i)=>{const b=document.createElement('button');b.type='button';b.dataset.mode=m;b.textContent=m==='spiral'?'Golden spiral':'Growth curve';if(i===0)b.classList.add('on');toggle.append(b);});
    const zoom=document.createElement('div');zoom.className='lab-zoom';
    [['out','−','Zoom out'],['in','+','Zoom in'],['fit','⤢','Fit to view']].forEach(([k,label,title])=>{const b=document.createElement('button');b.type='button';b.dataset.zoom=k;b.textContent=label;b.title=title;zoom.append(b);});
    head.append(toggle,zoom);stage.append(head);
    const wrap=document.createElement('div');wrap.className='lab-custom-canvas-wrap';
    const cv=document.createElement('canvas');cv.id='lab-fib-canvas';cv.setAttribute('aria-label','Fibonacci spiral and growth curve');wrap.append(cv);stage.append(wrap);
    const ctx=cv.getContext('2d');
    const MAX=40,fib=[0,1];
    for(let i=2;i<=MAX+1;i++)fib.push(fib[i-1]+fib[i-2]);
    const PALETTE=['#3b82f6','#22c55e','#a855f7','#f59e0b','#ec4899'];
    const squares=[],prefix=[];
    (function build(){
      let minX=0,minY=0,maxX=0,maxY=0;const PI=Math.PI;
      for(let i=0;i<MAX;i++){
        const s=fib[i+1];let x,y,cx,cy,a0,a1;
        if(i===0){x=0;y=0;cx=x+s;cy=y;a0=PI;a1=PI/2;}
        else{const d=(i-1)%4;
          if(d===0){x=maxX;y=minY;cx=x;cy=y;a0=PI/2;a1=0;}
          else if(d===1){x=minX;y=minY-s;cx=x;cy=y+s;a0=0;a1=-PI/2;}
          else if(d===2){x=minX-s;y=minY;cx=x+s;cy=y+s;a0=-PI/2;a1=-PI;}
          else{x=minX;y=maxY;cx=x+s;cy=y;a0=PI;a1=PI/2;}}
        squares.push({i,x,y,s,cx,cy,a0,a1,index:i+1});
        minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x+s);maxY=Math.max(maxY,y+s);
        prefix.push({minX,minY,maxX,maxY});
      }
    })();
    let W=0,H=0,dpr=1,t=12,progress=12,progT=12;
    const cam={cx:0,cy:0,ls:0},camT={cx:0,cy:0,ls:0};
    let mode='spiral',raf=null,lastTime=0;
    function fitFor(k){const b=prefix[Math.max(0,Math.min(MAX-1,k-1))],pad=34;const bw=b.maxX-b.minX,bh=b.maxY-b.minY;const s=Math.min((W-pad*2)/bw,(H-pad*2)/bh);return {cx:(b.minX+b.maxX)/2,cy:(b.minY+b.maxY)/2,ls:Math.log(s)};}
    function setCamTarget(c){camT.cx=c.cx;camT.cy=c.cy;camT.ls=c.ls;kick();}
    function snapCam(c){Object.assign(cam,c);Object.assign(camT,c);}
    function kick(){if(!raf){lastTime=performance.now();raf=requestAnimationFrame(tick);}}
    function tick(now){
      const dt=Math.min(0.05,(now-lastTime)/1000);lastTime=now;
      const a=1-Math.exp(-dt*6.5);
      progress+=(progT-progress)*a;cam.cx+=(camT.cx-cam.cx)*a;cam.cy+=(camT.cy-cam.cy)*a;cam.ls+=(camT.ls-cam.ls)*a;
      const settled=Math.abs(progT-progress)<0.002&&Math.abs(camT.ls-cam.ls)<0.0005&&Math.abs(camT.cx-cam.cx)<1e-4*Math.exp(-camT.ls)&&Math.abs(camT.cy-cam.cy)<1e-4*Math.exp(-camT.ls);
      if(settled){progress=progT;Object.assign(cam,camT);}
      draw();raf=settled?null:requestAnimationFrame(tick);
    }
    function resize(){const r=wrap.getBoundingClientRect();W=r.width;H=r.height;dpr=window.devicePixelRatio||1;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);const f=fitFor(t);setCamTarget(f);snapCam(f);draw();}
    function drawSpiral(){
      if(!W)return;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
      const s=Math.exp(cam.ls);
      const X=ux=>W/2+(ux-cam.cx)*s,Y=uy=>H/2+(uy-cam.cy)*s;
      const g=26,ox=((W/2-cam.cx*s)%g+g)%g,oy=((H/2-cam.cy*s)%g+g)%g;
      ctx.strokeStyle='rgba(120,150,220,.07)';ctx.lineWidth=1;ctx.beginPath();
      for(let x=ox;x<W;x+=g){ctx.moveTo(x,0);ctx.lineTo(x,H);}
      for(let y=oy;y<H;y+=g){ctx.moveTo(0,y);ctx.lineTo(W,y);}
      ctx.stroke();
      const n=Math.ceil(progress);
      for(let i=0;i<n;i++){
        const q=squares[i],a=Math.max(0,Math.min(1,progress-i));
        const px=X(q.x),py=Y(q.y),ps=q.s*s;
        if(ps<0.6||px>W||py>H||px+ps<0||py+ps<0)continue;
        const col=PALETTE[i%PALETTE.length];
        ctx.globalAlpha=a;ctx.fillStyle=col+'29';ctx.fillRect(px,py,ps,ps);
        ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.strokeRect(px,py,ps,ps);
        if(ps>24){
          ctx.fillStyle='#e6edf7';ctx.font=`600 ${Math.min(28,ps/3)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(fib[i+1].toLocaleString(),px+ps/2,py+ps/2);
          if(ps>80){ctx.font=`${Math.min(13,ps/9)}px sans-serif`;ctx.fillStyle='rgba(230,237,247,.55)';ctx.fillText('F'+q.index,px+ps/2,py+ps/2+Math.min(28,ps/3)*0.95);}
        }
        ctx.globalAlpha=1;
      }
      ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.shadowColor='rgba(255,255,255,.35)';ctx.shadowBlur=6;
      ctx.beginPath();let started=false;
      for(let i=0;i<n;i++){
        const q=squares[i],a=Math.max(0,Math.min(1,progress-i)),r=q.s*s;
        if(a<=0||r>1e6){started=false;continue;}
        const end=q.a0+(q.a1-q.a0)*a;
        if(!started){ctx.moveTo(X(q.cx)+r*Math.cos(q.a0),Y(q.cy)+r*Math.sin(q.a0));started=true;}
        ctx.arc(X(q.cx),Y(q.cy),r,q.a0,end,true);
      }
      ctx.stroke();ctx.shadowBlur=0;
    }
    function drawChart(){
      if(!W)return;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
      const list=fib.slice(1,t+1),padL=64,padR=26,padT=28,padB=46;
      const plotW=W-padL-padR,plotH=H-padT-padB;
      const maxV=Math.max(...list,1);
      const X=i=>padL+(list.length<=1?plotW/2:(i/(list.length-1))*plotW);
      const Y=v=>padT+plotH-(v/maxV)*plotH;
      ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;ctx.beginPath();
      for(let i=0;i<=4;i++){const y=padT+(plotH/4)*i;ctx.moveTo(padL,y);ctx.lineTo(padL+plotW,y);}
      ctx.stroke();
      ctx.strokeStyle='rgba(200,205,215,.5)';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(padL,padT);ctx.lineTo(padL,padT+plotH);ctx.lineTo(padL+plotW,padT+plotH);ctx.stroke();
      ctx.fillStyle='#9aa0a8';ctx.font='11px sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
      for(let i=0;i<=4;i++){const v=maxV*(1-i/4);ctx.fillText(v>=1e6?v.toExponential(1):Math.round(v).toLocaleString(),padL-8,padT+(plotH/4)*i);}
      ctx.textAlign='center';ctx.textBaseline='top';
      list.forEach((v,i)=>{if(list.length<=12||i%Math.ceil(list.length/12)===0)ctx.fillText('F'+(i+1),X(i),padT+plotH+8);});
      ctx.beginPath();
      list.forEach((v,i)=>i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v)));
      ctx.strokeStyle='#3b82f6';ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
      ctx.lineTo(X(list.length-1),padT+plotH);ctx.lineTo(X(0),padT+plotH);ctx.closePath();
      ctx.fillStyle='rgba(59,130,246,.15)';ctx.fill();
      list.forEach((v,i)=>{ctx.beginPath();ctx.arc(X(i),Y(v),4,0,Math.PI*2);ctx.fillStyle='#3b82f6';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();});
    }
    function draw(){mode==='spiral'?drawSpiral():drawChart();}
    function setMode(m){mode=m;toggle.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.mode===m));draw();}
    toggle.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
    function zoomBy(f){if(mode!=='spiral')return;camT.ls=Math.max(Math.log(1e-8),Math.min(Math.log(1e4),camT.ls+Math.log(f)));camT.cx=cam.cx;camT.cy=cam.cy;kick();}
    zoom.querySelector('[data-zoom="in"]').addEventListener('click',()=>zoomBy(1.8));
    zoom.querySelector('[data-zoom="out"]').addEventListener('click',()=>zoomBy(1/1.8));
    zoom.querySelector('[data-zoom="fit"]').addEventListener('click',()=>{const f=fitFor(t);setCamTarget(f);});
    let drag=null;
    cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);const r=cv.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top,cx:cam.cx,cy:cam.cy};Object.assign(camT,cam);});
    cv.addEventListener('pointermove',e=>{if(!drag||mode!=='spiral')return;const r=cv.getBoundingClientRect();const p={x:e.clientX-r.left,y:e.clientY-r.top};const s=Math.exp(cam.ls);cam.cx=drag.cx-(p.x-drag.x)/s;cam.cy=drag.cy-(p.y-drag.y)/s;Object.assign(camT,cam);draw();});
    cv.addEventListener('pointerup',()=>{drag=null;});
    cv.addEventListener('dblclick',()=>{const f=fitFor(t);setCamTarget(f);});
    const ro=new ResizeObserver(resize);ro.observe(wrap);resize();
    return {
      render(v){t=Math.max(3,Math.min(MAX,Math.floor(Number(v.count))));progT=t;progress=Math.min(progress,t);const f=fitFor(t);setCamTarget(f);kick();draw();},
      destroy(){ro.disconnect();if(raf){cancelAnimationFrame(raf);raf=null;}stage.innerHTML='';}
    };
  }

  // ── Native polynomial engine ──────────────────────────────────────────
  // A direct port of lab/function-coefficient.html: same Horner evaluation,
  // same coefficient indexing (coef[i] is the x^i coefficient), same [-5,5]
  // VIEW bounds, same equation builder, same 4000-step root estimate, same
  // degree buttons and preset table. Only the CSS colours were re-pointed at
  // the dashboard's light palette; the graphing mechanics are untouched.
  // ── Native polynomial engine (verbatim from lab/function-coefficient.html) ──
  // The HTML, CSS and JS below are the exact code from the standalone file,
  // only the card outer background is re-themed to the dashboard palette.
  function createPolynomialEngine(){
    const stage=document.getElementById('lab-custom-stage');
    if(!stage) return null;
    stage.innerHTML=`
      <style>
        /* ── Original CSS, palette vars redirected to dashboard ── */
        #lab-custom-stage{
          --card: var(--op-card);
          --border: var(--op-line);
          --text: var(--op-ink);
          --muted: var(--op-muted);
          --accent: var(--op-accent);
          display:flex; justify-content:center;
        }
        #lab-custom-stage *,
        #lab-custom-stage *::before,
        #lab-custom-stage *::after { box-sizing:border-box; }

        #lab-custom-stage .card {
          width:100%;
          max-width:760px;
          background:var(--card);
          border-radius:28px;
          overflow:hidden;
          box-shadow:0 8px 30px rgba(0,0,0,.35);
        }

        #lab-custom-stage .graph {
          position:relative;
          background:#020617;
          height:400px;
        }
        #lab-custom-stage #plot { width:100%; height:100%; display:block; }

        #lab-custom-stage .preset {
          position:absolute;
          top:14px; left:14px;
          display:flex; align-items:center; gap:6px;
          padding:8px 12px;
          background:rgba(20,27,45,.85);
          border:1px solid #2c3550;
          border-radius:10px;
          font-size:14px;
          color:var(--muted);
        }
        #lab-custom-stage .preset select {
          appearance:none; -webkit-appearance:none;
          background:transparent; border:none; outline:none;
          color:#e8eaed; font:inherit; font-weight:600; font-size:16px;
          padding-right:18px; cursor:pointer;
          background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23e8eaed' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat:no-repeat; background-position:right center;
        }
        #lab-custom-stage .preset select option { background:#25272b; color:#e8eaed; }

        #lab-custom-stage .equation {
          position:absolute;
          left:14px; bottom:14px;
          padding:9px 14px;
          background:rgba(20,27,45,.85);
          border:1px solid #2c3550;
          border-radius:10px;
          font-size:17px; font-weight:700; color:#e8eaed;
        }

        #lab-custom-stage .stats {
          display:grid;
          grid-template-columns:repeat(3,1fr);
          text-align:center;
          padding:18px 12px;
          border-bottom:1px solid var(--border);
        }
        #lab-custom-stage .stat .label { font-size:13px; color:var(--muted); margin-bottom:6px; }
        #lab-custom-stage .stat .value { font-size:16px; font-weight:700; color:var(--text); }

        #lab-custom-stage .controls { padding:22px 22px 28px; }
        #lab-custom-stage .section-title { font-size:16px; color:var(--muted); margin:0 0 12px; }

        #lab-custom-stage .segmented {
          display:flex; background:#f0eee9;
          border-radius:999px; padding:4px;
          margin-bottom:26px; gap:2px;
        }
        #lab-custom-stage .segmented button {
          flex:1; border:none; background:transparent;
          color:var(--muted); font:inherit; font-size:15px; font-weight:600;
          padding:11px 6px; border-radius:999px; cursor:pointer;
          transition:background .15s, color .15s; white-space:nowrap;
        }
        #lab-custom-stage .segmented button:hover { color:var(--text); }
        #lab-custom-stage .segmented button.active { background:var(--accent); color:#fff; }

        #lab-custom-stage .sliders {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:22px 32px;
        }
        #lab-custom-stage .slider-block .name { font-size:14px; color:var(--muted); margin-bottom:8px; }
        #lab-custom-stage .slider-row { display:flex; align-items:center; gap:16px; }
        #lab-custom-stage .slider-row .num {
          min-width:44px; text-align:right;
          font-weight:700; font-size:16px; color:var(--text);
        }
        #lab-custom-stage input[type="range"] {
          -webkit-appearance:none; appearance:none;
          flex:1; height:4px; border-radius:999px;
          outline:none; cursor:pointer; background:#d4ccc9;
        }
        #lab-custom-stage input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance:none; width:20px; height:20px; border-radius:50%;
          background:var(--accent); border:none;
          box-shadow:0 0 0 4px rgba(46,125,82,.18);
        }
        #lab-custom-stage input[type="range"]::-moz-range-thumb {
          width:20px; height:20px; border-radius:50%;
          background:var(--accent); border:none;
        }
        @media (max-width:560px){
          #lab-custom-stage .graph { height:320px; }
          #lab-custom-stage .sliders { grid-template-columns:1fr; }
          #lab-custom-stage .segmented button { font-size:12px; padding:10px 2px; }
        }
      #lab-custom-stage .preset,
#lab-custom-stage .segmented,
#lab-custom-stage .sliders,
#lab-custom-stage .controls {display:none !important;}
</style>

      <!-- ── Original stage HTML ──
           The .preset and .controls blocks stay in the DOM so the original
           script can bind to #preset, #sliders and #degreeButtons, but they
           are display:none — the live controls live in the left sidebar. -->
      <div class="card">
        <div class="graph">
          <canvas id="plot"></canvas>

          <div class="preset">
            Preset:
            <select id="preset">
              <option value="custom">Custom</option>
              <option value="line">Line: y = x</option>
              <option value="parabola">Parabola: x²</option>
              <option value="cubic">Cubic: x³ - 3x</option>
              <option value="wave">Quartic: 0.2x⁴ - 2x² + 1</option>
              <option value="flat">Flat: y = 2</option>
            </select>
          </div>

          <div class="equation" id="equation">f(x) = 0</div>
        </div>

        <div class="stats">
          <div class="stat"><div class="label">Degree Order</div><div class="value" id="statDegree">1</div></div>
          <div class="stat"><div class="label">Y-Intercept</div><div class="value" id="statY">(0, 0)</div></div>
          <div class="stat"><div class="label">Est. X-Roots</div><div class="value" id="statRoots">0</div></div>
        </div>

        <div class="controls">
          <h3 class="section-title">Polynomial Degree Order</h3>
          <div class="segmented" id="degreeButtons">
            <button data-deg="1">Linear (1st)</button>
            <button data-deg="2">Quadratic (2nd)</button>
            <button data-deg="3">Cubic (3rd)</button>
            <button data-deg="4">Quartic (4th)</button>
          </div>

          <h3 class="section-title">Adjust Function Coefficients</h3>
          <div class="sliders" id="sliders"></div>
        </div>
      </div>
    `;

    // ── Original JS logic, verbatim ──
    const $ = id => document.getElementById(id);
    let canvas = $("plot");
    let ctx = canvas.getContext('2d');
    const presetSelect = $('preset');
    const equationEl   = $('equation');
    const statDegree   = $('statDegree');
    const statY        = $('statY');
    const statRoots    = $('statRoots');
    const slidersEl    = $('sliders');
    const degreeButtons = document.querySelectorAll('#degreeButtons button');

    // ---------- State ----------
    const VIEW = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
    let degree = 1;
    let coef = [0.3, -1.4, 0, 0, 0]; // coef[i] is the coefficient of x^i

    const PRESETS = {
      line:     { degree: 1, coef: [0, 1, 0, 0, 0] },
      parabola: { degree: 2, coef: [0, 0, 1, 0, 0] },
      cubic:    { degree: 3, coef: [0, -3, 0, 1, 0] },
      wave:     { degree: 4, coef: [1, 0, -2, 0, 0.2] },
      flat:     { degree: 1, coef: [2, 0, 0, 0, 0] }
    };

    const NAMES = ['Constant', 'Slope', 'Quadratic term', 'Cubic term', 'Quartic term'];
    const SUB = ['₀', '₁', '₂', '₃', '₄'];
    const SUP = { 2: '²', 3: '³', 4: '⁴' };

    // ---------- Math ----------
    function evaluate(x) {
      let y = 0;
      for (let i = degree; i >= 0; i--) y = y * x + coef[i]; // Horner's method
      return y;
    }

    function estimateRoots() {
      const steps = 4000;
      const dx = (VIEW.xMax - VIEW.xMin) / steps;
      let count = 0;
      let prevY = evaluate(VIEW.xMin);
      let prevPrevY = prevY;
      for (let i = 1; i <= steps; i++) {
        const x = VIEW.xMin + i * dx;
        const y = evaluate(x);
        if (prevY === 0) {
          // exact zero already counted via the sign logic below
        } else if (prevY * y < 0) {
          count++;
        } else if (Math.abs(prevY) < 1e-3 &&
                   Math.abs(prevY) <= Math.abs(prevPrevY) &&
                   Math.abs(prevY) <= Math.abs(y) &&
                   prevY * prevPrevY >= 0 && prevY * y >= 0) {
          count++; // touches the axis without crossing (e.g. x²)
        }
        prevPrevY = prevY;
        prevY = y;
      }
      if (coef.slice(0, degree + 1).every(c => c === 0)) return 0;
      return count;
    }

    // ---------- Formatting ----------
    function fmt(n) {
      const r = Math.round(Math.abs(n) * 10) / 10;
      return (r % 1 === 0) ? String(r) : r.toFixed(1);
    }

    function buildEquation() {
      const terms = [];
      for (let i = degree; i >= 0; i--) {
        const c = Math.round(coef[i] * 10) / 10;
        if (c === 0) continue;
        const sign = c < 0 ? '-' : '+';
        const abs = Math.abs(c);
        let body;
        if (i === 0) body = fmt(abs);
        else {
          const num = abs === 1 ? '' : fmt(abs);
          body = num + 'x' + (SUP[i] || '');
        }
        terms.push({ sign, body });
      }
      if (!terms.length) return 'f(x) = 0';
      let out = (terms[0].sign === '-' ? '-' : '') + terms[0].body;
      for (let i = 1; i < terms.length; i++) out += ' ' + terms[i].sign + ' ' + terms[i].body;
      return 'f(x) = ' + out;
    }

    // ---------- Drawing ----------
    function resizeCanvas() {
  if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const toX = x => (x - VIEW.xMin) / (VIEW.xMax - VIEW.xMin) * w;
      const toY = y => h - (y - VIEW.yMin) / (VIEW.yMax - VIEW.yMin) * h;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      for (let x = VIEW.xMin; x <= VIEW.xMax; x++) {
        const px = Math.round(toX(x)) + 0.5;
        ctx.moveTo(px, 0); ctx.lineTo(px, h);
      }
      for (let y = VIEW.yMin; y <= VIEW.yMax; y++) {
        const py = Math.round(toY(y)) + 0.5;
        ctx.moveTo(0, py); ctx.lineTo(w, py);
      }
      ctx.stroke();

      // Axes
      const ox = Math.round(toX(0)) + 0.5;
      const oy = Math.round(toY(0)) + 0.5;
      ctx.strokeStyle = 'rgba(200,205,215,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
      ctx.moveTo(0, oy); ctx.lineTo(w, oy);
      ctx.stroke();

      // Tick labels
      ctx.fillStyle = 'rgba(180,186,198,0.75)';
      ctx.font = '12px "Segoe UI", Roboto, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let x = VIEW.xMin; x <= VIEW.xMax; x++) {
        if (x === 0) continue;
        ctx.fillText(String(x), toX(x), oy + 8);
      }
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let y = VIEW.yMin; y <= VIEW.yMax; y++) {
        if (y === 0) continue;
        ctx.fillText(String(y), ox - 8, toY(y));
      }
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('0', ox - 8, oy + 8);

      // Curve (clipped to the plot area)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();
      ctx.strokeStyle = '#3b6cf6';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      const samples = Math.max(300, Math.floor(w));
      for (let i = 0; i <= samples; i++) {
        const x = VIEW.xMin + (i / samples) * (VIEW.xMax - VIEW.xMin);
        const px = toX(x);
        const py = toY(evaluate(x));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      // Y-intercept marker
      const yi = evaluate(0);
      if (yi >= VIEW.yMin && yi <= VIEW.yMax) {
        ctx.beginPath();
        ctx.arc(toX(0), toY(yi), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ea4335';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
    }

    // ---------- UI ----------
    function buildSliders() {
      slidersEl.innerHTML = '';
      for (let i = degree; i >= 0; i--) {
        const block = document.createElement('div');
        block.className = 'slider-block';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = NAMES[i] + ' (a' + SUB[i] + ')';

        const row = document.createElement('div');
        row.className = 'slider-row';

        const input = document.createElement('input');
        input.type = 'range';
        input.min = -5;
        input.max = 5;
        input.step = 0.1;
        input.value = coef[i];

        const num = document.createElement('span');
        num.className = 'num';

        const paint = () => {
          const v = parseFloat(input.value);
          num.textContent = (Math.round(v * 10) / 10).toFixed(1);
          const pct = (v - input.min) / (input.max - input.min) * 100;
          input.style.background =
            'linear-gradient(to right, #3a3d44 ' + pct + '%, #3a3d44 ' + pct + '%)';
        };

        input.addEventListener('input', () => {
          coef[i] = parseFloat(input.value);
          presetSelect.value = 'custom';
          paint();
          update();
        });

        paint();
        row.appendChild(input);
        row.appendChild(num);
        block.appendChild(name);
        block.appendChild(row);
        slidersEl.appendChild(block);
      }
    }

    function update() {
      equationEl.textContent = buildEquation();
      statDegree.textContent = degree;
      const yi = Math.round(evaluate(0) * 10) / 10;
      statY.textContent = '(0, ' + fmt(yi).replace(/^/, yi < 0 ? '-' : '') + ')';
      statRoots.textContent = estimateRoots();
      degreeButtons.forEach(b => b.classList.toggle('active', Number(b.dataset.deg) === degree));
      draw();
    }

    degreeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        degree = Number(btn.dataset.deg);
        if (coef[degree] === 0) coef[degree] = 1;
        presetSelect.value = 'custom';
        buildSliders();
        update();
      });
    });

    presetSelect.addEventListener('change', () => {
      const p = PRESETS[presetSelect.value];
      if (!p) return;
      degree = p.degree;
      coef = p.coef.slice();
      buildSliders();
      update();
    });

    window.addEventListener('resize', resizeCanvas);

    // ---------- Init ----------
    buildSliders();
    update();
    resizeCanvas();

    return {
      // Mirror the rail's values into the native engine when the lab re-renders
      render(values) {
        const newDeg = Math.max(1, Math.min(4, Number(values.degree) || 1));
        const newCoef = [
          Number(values.a0) || 0,
          Number(values.a1) || 0,
          Number(values.a2) || 0,
          Number(values.a3) || 0,
          Number(values.a4) || 0
        ];
        degree = newDeg;
        coef = newCoef;
        buildSliders();
        update();
      },
      destroy() {
        window.removeEventListener('resize', resizeCanvas);
        stage.innerHTML = '';
      }
    };
  }

  let customEngine=null, customKind=null;
  function destroyCustom(){ if(customEngine){customEngine.destroy();customEngine=null;customKind=null;} }
  function renderCustom(exp,values){
    const stage=document.getElementById('lab-custom-stage');
    if(!stage) return;
    const want=exp.customRender;
    if(customKind!==want){
      destroyCustom();
      customEngine = want==='geometric'?createGeometricEngine()
        : want==='fibonacci'?createFibonacciEngine()
        : want==='polynomial'?createPolynomialEngine()
        : null;
      customKind=want;
      stage.hidden=false;
    }
    if(customEngine) customEngine.render(values);
  }


  if(!bars){bars=document.createElementNS('http://www.w3.org/2000/svg','g');bars.id='lab-bars';svg.append(bars);}
  function scaleFor(clean){
    let xmin=Math.min(...clean.map(p=>p[0])),xmax=Math.max(...clean.map(p=>p[0])),ymin=Math.min(...clean.map(p=>p[1])),ymax=Math.max(...clean.map(p=>p[1]));
    if(ymin>0)ymin=0; // anchor the baseline at zero for readable magnitudes
    if(xmin===xmax)xmax=xmin+1;
    if(ymin===ymax)ymax=ymin+1;
    return {sx:x=>54+(x-xmin)/(xmax-xmin)*604,sy:y=>234-(y-ymin)/(ymax-ymin)*190};
  }
  function draw(points,mode='line'){
    const clean=points.filter(p=>p.every(Number.isFinite));
    currentClean=clean;
    bars.innerHTML='';
    if(clean.length<2){line.setAttribute('d','');area.setAttribute('d','');dot.setAttribute('r','0');return;}
    const {sx,sy}=scaleFor(clean);
    if(mode==='bar'){
      line.setAttribute('d','');area.setAttribute('d','');dot.setAttribute('r','0');
      const width=Math.min(72,604/clean.length*.6);
      clean.forEach(([x,y])=>{
        const cx=sx(x),base=sy(0),top=sy(y);
        const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x',(cx-width/2).toFixed(1));
        rect.setAttribute('y',Math.min(base,top).toFixed(1));
        rect.setAttribute('width',width.toFixed(1));
        rect.setAttribute('height',Math.abs(base-top).toFixed(1));
        rect.setAttribute('rx','4');
        rect.setAttribute('class','lab-chart-bar');
        bars.append(rect);
      });
    }else{
      const pts=clean.map(([x,y])=>[sx(x),sy(y)]);
      line.setAttribute('d',pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '));
      area.setAttribute('d',`M${pts[0][0]} 234 L${pts.map(p=>`${p[0]} ${p[1]}`).join(' L')} L${pts.at(-1)[0]} 234 Z`);
      dot.setAttribute('r','5');
      dot.setAttribute('cx',pts.at(-1)[0]);
      dot.setAttribute('cy',pts.at(-1)[1]);
      // Tracker circles for hover tooltips
      ensureTooltip();
      labTrackers.innerHTML='';
      clean.forEach((point,i)=>{
        const c=document.createElementNS(svgNS,'circle');
        c.setAttribute('cx',pts[i][0]);
        c.setAttribute('cy',pts[i][1]);
        c.setAttribute('r','8');
        c.setAttribute('class','lab-tracker');
        c.setAttribute('visibility','visible');
        c.addEventListener('pointerenter',(evt)=>showTooltip(point,evt));
        c.addEventListener('pointermove',moveTooltip);
        c.addEventListener('pointerleave',hideTooltip);
        labTrackers.append(c);
      });
    }
    document.querySelector('#lab-year-label').textContent=`${clean.length} observations`;
  }
  // ── Hover tooltip: price, x-label, and percent change along the curve ──
  const svgNS='http://www.w3.org/2000/svg';
  let labTooltip, labTrackers;
  function ensureTooltip(){
    const svg=line.ownerSVGElement;
    if(!labTrackers){
      labTrackers=document.createElementNS(svgNS,'g');
      labTrackers.id='lab-trackers';
      svg.append(labTrackers);
    }
    if(!labTooltip){
      labTooltip=document.createElementNS(svgNS,'g');
      labTooltip.id='lab-tooltip';
      const bg=document.createElementNS(svgNS,'rect');
      bg.setAttribute('class','lab-tooltip-bg');
      bg.setAttribute('rx','4');
      const linesG=document.createElementNS(svgNS,'g');
      linesG.setAttribute('class','lab-tooltip-lines');
      labTooltip.append(bg,linesG);
      svg.append(labTooltip);
    }
  }
  function hideTooltip(){
    if(labTooltip) labTooltip.setAttribute('visibility','hidden');
  }
  function showTooltip(point, evt) {
    ensureTooltip();
    const bg = labTooltip.querySelector('.lab-tooltip-bg');
    const linesG = labTooltip.querySelector('.lab-tooltip-lines');

    // point is [xValue, yValue] e.g. [7, 16057.81]
    const yearVal = point[0];
    const moneyVal = point[1];

    // Format money explicitly with dollar sign and commas
    const moneyText = typeof moneyVal === 'number'
      ? '$' + moneyVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : moneyVal;

    // Format year label clearly
    const yearText = `Year ${yearVal}`;

    // Calculate percent growth from initial investment (point 0)
    let percentText = '';
    let percentClass = 'lab-tooltip-delta';
    if (typeof moneyVal === 'number' && currentClean.length > 0) {
      const initialVal = currentClean[0][1];
      if (initialVal > 0) {
        const growth = ((moneyVal - initialVal) / initialVal) * 100;
        percentText = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% growth`;
        percentClass = growth >= 0 ? 'lab-tooltip-delta up' : 'lab-tooltip-delta down';
      }
    }

    const lines = [
      { text: moneyText, cls: 'lab-tooltip-price' },
      { text: yearText, cls: 'lab-tooltip-x' },
      { text: percentText, cls: percentClass }
    ].filter(l => l.text);

    linesG.innerHTML = '';
    lines.forEach((l, i) => {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', '0');
      t.setAttribute('y', (i * 16).toString());
      t.setAttribute('class', l.cls);
      t.textContent = l.text;
      linesG.append(t);
    });

    // Measure the rendered text before positioning the box around it
    const textEls = Array.from(linesG.querySelectorAll('text'));
    const maxTextWidth = Math.max(...textEls.map(t => t.getBBox().width), 40);
    const padX = 12, padY = 12, lineH = 16;
    const w = maxTextWidth + padX * 2;
    const h = lines.length * lineH + padY;

    const svgEl = line.ownerSVGElement;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = rect.width / svgEl.viewBox.baseVal.width;
    const scaleY = rect.height / svgEl.viewBox.baseVal.height;
    const px = (evt.clientX - rect.left) / scaleX;
    const py = (evt.clientY - rect.top) / scaleY;

    let tx = px + 14, ty = py - h - 8;
    if (tx + w > 658) tx = px - w - 14;
    if (tx < 54) tx = 54;
    if (ty < 34) ty = py + 14;

    bg.setAttribute('x', tx); bg.setAttribute('y', ty);
    bg.setAttribute('width', w); bg.setAttribute('height', h);
    // text sits inside the box: padX from the left, padY minus one line of leading on top
    linesG.setAttribute('transform', `translate(${tx + padX},${ty + padY})`);
    labTooltip.setAttribute('visibility', 'visible');
  }
  function moveTooltip(evt){
    if(!labTooltip||labTooltip.getAttribute('visibility')==='hidden')return;
    const svgEl=line.ownerSVGElement;
    const rect=svgEl.getBoundingClientRect();
    const scaleX=rect.width/svgEl.viewBox.baseVal.width;
    const scaleY=rect.height/svgEl.viewBox.baseVal.height;
    const px=(evt.clientX-rect.left)/scaleX;
    const py=(evt.clientY-rect.top)/scaleY;
    const bg=labTooltip.querySelector('.lab-tooltip-bg');
    const w=bg.getAttribute('width'), h=bg.getAttribute('height');
    let tx=px+14, ty=py-h-8;
    if(tx+w>658) tx=px-w-14;
    if(tx<54) tx=54;
    if(ty<34) ty=py+14;
    bg.setAttribute('x',tx);bg.setAttribute('y',ty);
    labTooltip.querySelector('.lab-tooltip-lines').setAttribute('transform',`translate(${tx+12},${ty+16})`);
  }
  function render(){
  const exp=experiments[picker.value];
  current=exp;
  title.textContent=exp.title;
  objective.innerHTML=`<b>Question</b> ${exp.question}`;
  source.textContent=`Curriculum connection · ${exp.source}`;
  model.textContent=exp.model;
  modelCopy.textContent=exp.copy;
  // copy-to-clipboard button
  let copyBtn=document.getElementById('lab-copy-btn');
  if(!copyBtn){
    copyBtn=document.createElement('button');
    copyBtn.id='lab-copy-btn';
    copyBtn.type='button';
    copyBtn.className='op-text-button';
    copyBtn.textContent='Copy model';
    copyBtn.style.marginLeft='8px';
    modelCopy.parentNode.insertBefore(copyBtn, modelCopy.nextSibling);
    copyBtn.addEventListener('click',()=>{
      navigator.clipboard.writeText(exp.model).then(()=>{
        copyBtn.textContent='Copied!';
        setTimeout(()=>{copyBtn.textContent='Copy model';},1500);
      }).catch(()=>{copyBtn.textContent='Copy failed';});
    });
  }
  controlsFor(exp);
  // Rebuild the stats panel dynamically per experiment
  const panel=document.getElementById('lab-compare-panel');
  if(panel){
    panel.innerHTML='';
    if(exp.statBoxes&&exp.statBoxes.length){
      exp.statBoxes.forEach(sb=>{
        const box=document.createElement('div');
        box.className='lab-compare-box';
        const t=document.createElement('span');
        t.className='lab-compare-title';
        t.textContent=sb.label;
        const val=document.createElement('strong');
        val.className='lab-compare-value'+(sb.cls?' '+sb.cls:'');
        val.id='lab-stat-'+sb.id;
        box.append(t,val);
        panel.append(box);
      });
      panel.hidden=false;
    }else{
      panel.hidden=true;
    }
  }
  const update=()=>{
    try{
      const values=readValues(exp);
      const result=exp.calculate(values);
      balance.textContent=result.value;
      document.querySelector('.lab-result-head span:first-child').textContent=result.label;
      document.querySelector('.lab-result-tag').textContent='LIVE MODEL';
      // Populate stat boxes if present
      if(exp.statBoxes&&exp.statBoxes.length){
        exp.statBoxes.forEach(sb=>{
          const el=document.getElementById('lab-stat-'+sb.id);
          if(el) el.textContent=sb.get(values,result);
        });
      }
      // Route visualization cleanly by chartMode
      const canvas=document.getElementById('lab-chart-canvas');
      const svgEl=document.querySelector('#lab-chart');
      const stage=document.getElementById('lab-custom-stage');
      const mode=exp.chartMode;
      // Experiments with their own canvas engine keep that engine: hide the
      // shared SVG + Chart.js surfaces and hand the stage panel to it.
      if(exp.customRender&&stage){
        destroyChart();
        canvas.style.display='none';
        svgEl.style.display='none';
        stage.hidden=false;
        renderCustom(exp,values);
      }else{
        destroyCustom();
        if(stage) stage.hidden=true;
        if(mode==='single'||mode==='compare'){
          canvas.style.display='block';
          svgEl.style.display='none';
          renderInterestChart(values,mode);
        }else if(mode==='fib'){
          canvas.style.display='block';
          svgEl.style.display='none';
          renderFibonacciChart(result.fibValues,result.fibLabels);
        }else if(mode==='poly'){
          canvas.style.display='block';
          svgEl.style.display='none';
          renderPolyChart(result.poly);
        }else{
          destroyChart();
          canvas.style.display='none';
          canvas.parentElement.style.minHeight='';
          svgEl.style.display='block';
          draw(result.points,exp.drawMode||'line');
        }
      }
      document.querySelector('#lab-observation-text').textContent=result.note;
      document.querySelector('#lab-guided-question').textContent=result.question;
      document.querySelector('#lab-hint').textContent=result.hint;
    }catch(error){
      balance.textContent='Check values';
      document.querySelector('#lab-observation-text').textContent=error.message;
      line.setAttribute('d','');area.setAttribute('d','');if(dot)dot.setAttribute('r','0');
    }
  };
  rail.querySelectorAll('input, select').forEach(ctrl=>{
    ctrl.addEventListener('input',update);
    ctrl.addEventListener('change',update);
    if(!ctrl.dataset.default){
      ctrl.dataset.default=ctrl.value;
    }
  });
  const resetBtn=rail.querySelector('#lab-reset');
  resetBtn.addEventListener('click',()=>{
    rail.querySelectorAll('input[data-default], select[data-default]').forEach(inp=>{inp.value=inp.dataset.default;});
    const rateInput=document.getElementById('lab-rate');
    const rateOut=document.getElementById('lab-rate-value');
    if(rateInput && rateOut) rateOut.textContent=`${rateInput.value}%`;
    const yearsInput=document.getElementById('lab-years');
    const yearsOut=document.getElementById('lab-years-value');
    if(yearsInput && yearsOut) yearsOut.textContent=`${yearsInput.value} years`;
    update();
  });
  update();
}
  picker.addEventListener('change',()=>{
  render();
});
render();
// Scroll to the URL hash target on load (getElementById: an invalid selector like "#1a" must not throw).
document.addEventListener('DOMContentLoaded',()=>{
  const target=window.location.hash&&document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if(target) target.scrollIntoView({behavior:'smooth'});
});
  const reveal=document.querySelector('#lab-reveal');if(reveal)reveal.addEventListener('click',()=>{const expanded=reveal.getAttribute('aria-expanded')!=='true';reveal.setAttribute('aria-expanded',String(expanded));reveal.innerHTML=expanded?'Hide hint <span aria-hidden="true">−</span>':'Reveal a hint <span aria-hidden="true">＋</span>';document.querySelector('#lab-hint').hidden=!expanded;});
  document.querySelectorAll('[data-lab-experiment]').forEach(button=>button.addEventListener('click',()=>{const match={sequence:'sequence',measurement:'temperature'}[button.dataset.labExperiment];if(match){picker.value=match;render();document.querySelector('#experiment').scrollIntoView({behavior:'smooth'});}}));
})();
