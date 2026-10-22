(() => {
  const categoryIds = {
    business: 'business-mathematics',
    sequences: 'sequences-and-series',
    measurement: 'measurement-and-conversion',
    functions: 'functions',
    statistics: 'statistics',
    trigonometry: 'trigonometry',
    logic: 'logic-and-mathematical-reasoning',
  };
  const SIZES = { quick: 5, topic: 10, free: 0 };
  const $ = (id) => document.querySelector(`#${id}`);
  const list = $('challenge-list');
  const filters = [...document.querySelectorAll('[data-challenge-filter]')];
  const answerInput = $('challenge-answer');
  const searchInput = $('challenge-search');
  const feedback = $('challenge-feedback');
  const nextBtn = $('challenge-next');
  const retryBtn = $('challenge-retry');
  const nextStepEl = $('challenge-next-step');
  const views = { setup: $('quiz-setup'), play: $('quiz-play'), results: $('quiz-results') };
  let allQuestions = [];
  let filteredQuestions = [];
  let category = 'all'; // browse drawer filter
  let difficulty = 'all'; // browse drawer filter
  let mode = 'quick';
  let setupTopic = 'all';
  let S = null; // current quiz session
  let katexReady;
  const P = () => window.Progress;
  const slugOf = (key) => categoryIds[key];
  const titleOf = (slug) => P()?.TOPICS.find((t) => t.id === slug)?.title || slug;
  const toolsEl = document.createElement('p');
  toolsEl.id = 'challenge-related';
  toolsEl.className = 'challenge-related';
  toolsEl.hidden = true;
  $('challenge-solution').append(toolsEl);
  const levelEl = document.createElement('p');
  levelEl.className = 'challenge-levelup';
  levelEl.setAttribute('role', 'status');
  feedback.after(levelEl);

  // Playful, never childish. Picked by question index so wording rotates.
  const OK = ['Correct.', 'Spot on.', 'That is it.', 'Clean work.', 'Exactly right.'];
  const RETRY = ['Not quite yet.', 'Close, but not there.', 'Almost. Check the method below.', 'A useful miss.'];
  const pick = (arr, i) => arr[i % arr.length];
  const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Quiet sparkle burst: 12 nodes, removed after 1.2s. Skipped under reduced motion (text carries the meaning).
  function burst(host) {
    if (!host || reduced()) return;
    const box = document.createElement('span');
    box.className = 'sparkle';
    box.setAttribute('aria-hidden', 'true');
    for (let k = 0; k < 12; k++) {
      const dot = document.createElement('i');
      dot.style.setProperty?.('--a', `${k * 30}deg`);
      dot.style.setProperty?.('--d', `${44 + (k % 3) * 14}px`);
      box.append(dot);
    }
    host.append(box);
    if (typeof setTimeout === 'function') setTimeout(() => box.remove(), 1200);
  }
  const setText = (id, value) => { $(id).textContent = value ?? ''; };
  function showView(name) { Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; }); }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function refreshProgress() {
    if (!P()) return;
    filters.forEach((button) => {
      const slug = slugOf(button.dataset.challengeFilter);
      if (!slug) return;
      let tag = button.querySelector('small.challenge-mastery');
      if (!tag) { tag = document.createElement('small'); tag.className = 'challenge-mastery'; button.append(tag); }
      const d = P().describe(slug);
      tag.textContent = d.n ? `${d.label} · ${d.n} of ${P().WINDOW}` : '';
    });
    const step = P().nextStep();
    nextStepEl.replaceChildren();
    if (step) {
      nextStepEl.append('Next best step: ');
      const a = document.createElement('a');
      a.href = step.href;
      a.textContent = step.label;
      nextStepEl.append(a);
    }
    const act = P().activity();
    if (act.today) nextStepEl.append(` · ${act.today} answered today${act.run > 1 ? `, ${act.run}-day streak` : ''}`);
  }
  function markLast(item) {
    if (!P() || !item) return;
    const slug = item.topicId;
    P().setLast(slug, 'challenges', `Practising ${titleOf(slug)}`, `challenges.html#topic=${slug}`);
  }

  // Order a pool for a quiz. Exam / catch-up goals interleave topics weakest-first.
  function pickSet(pool, size) {
    const shuffled = shuffle(pool);
    const goal = P()?.load().goal;
    let out = shuffled;
    if (P() && (goal === 'exam' || goal === 'catchup')) {
      const score = (t) => (goal === 'exam' ? P().mastery(t).n : P().mastery(t).pct);
      const groups = new Map();
      shuffled.forEach((q) => { if (!groups.has(q.topicId)) groups.set(q.topicId, []); groups.get(q.topicId).push(q); });
      const order = [...groups.keys()].sort((a, b) => score(a) - score(b));
      out = [];
      for (let r = 0; out.length < shuffled.length; r++) order.forEach((t) => { if (groups.get(t)[r]) out.push(groups.get(t)[r]); });
    }
    return size ? out.slice(0, size) : out;
  }
  const poolFor = (topicKey, diff) => allQuestions.filter((q) => (topicKey === 'all' || q.topicId === categoryIds[topicKey]) && (diff === 'all' || q.difficulty.toLowerCase() === diff));

  function loadKatex() {
    if (window.katex?.render) return Promise.resolve(window.katex);
    if (katexReady) return katexReady;

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('node_modules/katex/dist/katex.min.css', document.baseURI).href;
    stylesheet.onerror = () => {
      stylesheet.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css';
    };
    document.head.append(stylesheet);

    const loadScript = (source) => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.onload = () => window.katex?.render ? resolve(window.katex) : reject(new Error('KaTeX did not initialize.'));
      script.onerror = () => reject(new Error(`KaTeX failed to load from ${source}`));
      document.head.append(script);
    });

    katexReady = loadScript(new URL('node_modules/katex/dist/katex.min.js', document.baseURI).href)
      .catch(() => loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js'));
    return katexReady;
  }

  function hasMathNotation(text) {
    if (/(?:_[{A-Za-z0-9]|\^[{A-Za-z0-9]|\\(?:sqrt|frac|pi|theta|times|cdot)\b|[→↔∧∨¬∀∃])/.test(text)) return true;
    if (/\$/.test(text)) return false;

    const clauses = text.split(/\s*;\s*/);
    return clauses.some((clause) => {
      const relation = clause.match(/^[^=<>≤≥≠≈]*[=<>≤≥≠≈]\s*(.*)$/);
      if (relation) return !/[A-Za-z]{4,}/.test(relation[1]);
      return /[0-9]/.test(clause)
        && /[+*/×÷^]/.test(clause)
        && !/[A-Za-z]{4,}/.test(clause);
    });
  }

  function renderMathText(element, text, { force = false } = {}) {
    element.replaceChildren();
    const value = String(text ?? '');
    if (!value || (!force && !hasMathNotation(value))) {
      element.textContent = value;
      return;
    }

    // Turn multiword names on the left of an equation into regular text in math mode.
    const latex = value
      .split(/(\s*;\s*)/)
      .map((part) => {
        if (/^\s*;\s*$/.test(part) || !part.trim()) return part;
        return part.replace(/^([A-Za-z][A-Za-z ]{2,}?)\s*=/, (_, label) => `\\text{${label.trim()}} =`);
      })
      .join('');
    const math = document.createElement('span');
    math.className = 'challenge-math';
    element.append(math);
    loadKatex().then((katex) => {
      katex.render(latex, math, { throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' });
    }).catch((error) => {
      console.error('Challenge math could not be rendered.', error);
      element.textContent = value;
    });
  }

  const normalize = (text) => String(text ?? '')
    .toLowerCase()
    .replace(/[−–]/g, '-')
    .replace(/[²]/g, '^2')
    .replace(/[³]/g, '^3')
    .replace(/\\(?:text|mathrm)\s*\{([^}]+)\}/g, '$1')
    .replace(/[,$]/g, '')
    .replace(/\s+/g, '')
    .replace(/[.,;:!?]/g, '');

  function answerMatches(question, value) {
    if (window.ObservatoryMath?.answersEquivalent(value, question.finalAnswer)) return true;
    const normalizedInput = normalize(value);
    const expectedText = String(question.finalAnswer ?? '').trim();
    const normalizedExpected = normalize(expectedText);
    if (normalizedInput && normalizedInput === normalizedExpected) return true;

    const calculator = window.Grade11MathCalculator;
    if (calculator) {
      try {
        const verification = calculator.verifyAnswer(question.question, value);
        if (verification.needed && verification.passed) return true;
      } catch { /* Fall through to the provided curriculum answer. */ }
    }

    const numericPattern = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i;
    const scalar = (text) => {
      const cleaned = String(text).toLowerCase().replace(/[²³]/g, (digit) => digit === '²' ? '^2' : '^3')
        .replace(/\b(?:approximately|about|is|equals?|units?|cm\s*\^?\s*[23]?|mm\s*\^?\s*[23]?|km\s*\^?\s*[23]?|meters?|metres?|inches?|feet|ft|degrees?|dollars?|pesos?|percent|per|year|years|month|months|weeks?|hours?|minutes?|seconds?|square|cubic|fahrenheit|celsius|kelvin|sin|cos|tan|theta|x|y)\b/gi, '')
        .replace(/[\s$°,=<>≤≥≈(){}\[\]_*:+-]/g, '').replace(/,/g, '');
      if (numericPattern.test(cleaned)) return Number(cleaned);
      const fraction = cleaned.match(/^([-+]?(?:\d+(?:\.\d*)?|\.\d+))\/([-+]?(?:\d+(?:\.\d*)?|\.\d+))$/);
      return fraction && Number(fraction[2]) !== 0 ? Number(fraction[1]) / Number(fraction[2]) : null;
    };
    const expected = scalar(expectedText);
    const actual = scalar(value);
    if (expected === null || actual === null) return false;
    if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;
    const expectedNumberText = expectedText.replace(/[²³]/g, '').match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/i)?.[0] || '';
    const decimalPart = expectedNumberText.split(/[eE]/)[0].split('.')[1] || '';
    const approximate = /\b(?:approximately|about|≈)\b|≈/.test(expectedText.toLowerCase());
    const tolerance = approximate && decimalPart ? 0.5 * (10 ** -decimalPart.length) + 1e-9 : 1e-9 * Math.max(1, Math.abs(expected));
    return Math.abs(expected - actual) <= tolerance;
  }

  // ---- setup view -------------------------------------------------------
  function buildTopicSelect() {
    const sel = $('quiz-topic');
    sel.replaceChildren();
    [['all', 'All topics'], ...Object.entries(categoryIds).map(([k, slug]) => [k, titleOf(slug)])].forEach(([value, text]) => {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = text;
      sel.append(o);
    });
    sel.value = setupTopic;
  }
  function updateSetupNote() {
    const pool = poolFor(setupTopic, ($('quiz-difficulty').value || 'all'));
    const size = SIZES[mode];
    const note = $('quiz-setup-note');
    const start = $('quiz-start');
    start.disabled = !pool.length;
    note.textContent = !pool.length ? 'No questions match this topic and level. Try another combination.'
      : size && pool.length < size ? `Only ${pool.length} question${pool.length === 1 ? '' : 's'} match, so this quiz will be shorter.`
      : `${pool.length} questions available${size ? `, ${size} picked at random` : ''}.`;
  }
  function setMode(next) {
    mode = next;
    document.querySelectorAll('[data-mode]').forEach((b) => {
      const on = b.dataset.mode === next;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    updateSetupNote();
  }
  function toSetup() { showView('setup'); S = null; updateSetupNote(); $('quiz-setup-title').focus(); }

  // ---- quiz session -----------------------------------------------------
  function startSession(kind, qs, { focus = true } = {}) {
    if (!qs.length) return;
    const pre = {};
    qs.forEach((q) => { if (P() && !(q.topicId in pre)) pre[q.topicId] = P().LEVEL_NAMES.indexOf(P().mastery(q.topicId).level); });
    S = { kind, qs: qs.slice(), i: 0, res: [], pre, answered: false, streak: 0 };
    buildTicks();
    showView('play');
    showQuestion(focus);
  }
  function showQuestion(focus = true) {
    if (S.kind === 'free' && S.i >= S.qs.length) S.qs.push(...shuffle(S.qs));
    const item = S.qs[S.i];
    const n = S.kind === 'free' ? 0 : S.qs.length;
    S.answered = false;
    setText('challenge-count', n ? `Question ${S.i + 1} of ${n}` : `Question ${S.i + 1} · free practice`);
    setText('challenge-num', `Q${S.i + 1}`);
    setText('challenge-topic', item.topicName);
    setText('challenge-difficulty', item.difficulty);
    setProgress(S.i);
    setText('challenge-question', item.question);
    renderMathText($('challenge-given').querySelector('p'), item.given || 'Use the information stated in the problem.');
    const hint = $('challenge-hint');
    const hintToggle = $('challenge-hint-toggle');
    const formula = $('challenge-formula');
    hint.hidden = !item.formula;
    formula.hidden = true;
    hintToggle.setAttribute('aria-expanded', 'false');
    hintToggle.firstChild.textContent = 'Reveal hint ';
    hintToggle.querySelector('span').textContent = '+';
    formula.replaceChildren();
    if (item.formula) {
      const label = document.createElement('span');
      label.textContent = 'Hint: ';
      renderMathText(formula, item.formula);
      formula.prepend(label);
    }
    clearAnswerState();
    nextBtn.hidden = true;
    retryBtn.hidden = true;
    markLast(item);
    if (focus) { $('challenge-question').focus(); }
  }
  function buildTicks() {
    const track = $('quiz-track');
    track.querySelectorAll?.('.quiz-tick').forEach((t) => t.remove());
    const n = S.kind === 'free' ? 0 : S.qs.length;
    for (let k = 1; k < n; k++) {
      const t = document.createElement('i');
      t.className = 'quiz-tick';
      t.dataset.k = String(k);
      t.style.left = `${(k / n) * 100}%`;
      track.append(t);
    }
  }
  function setProgress(done) {
    const n = S.kind === 'free' ? 0 : S.qs.length;
    $('quiz-track').hidden = !n;
    if (!n) return;
    $('quiz-track').setAttribute('aria-valuemax', String(n));
    $('quiz-track').setAttribute('aria-valuenow', String(done));
    $('quiz-fill').style.width = `${(done / n) * 100}%`;
    $('quiz-track').querySelectorAll?.('.quiz-tick').forEach((t) => t.classList.toggle('is-hit', Number(t.dataset.k) <= done));
  }
  function clearAnswerState() {
    answerInput.value = '';
    answerInput.readOnly = false;
    feedback.textContent = '';
    feedback.className = 'challenge-feedback';
    levelEl.textContent = '';
    setText('quiz-keys-text', 'to check');
    $('challenge-solution').hidden = true;
    toolsEl.hidden = true;
  }

  function submitAnswer() {
    if (!S) return;
    if (S.answered) { goNext(); return; } // Enter again moves on
    const item = S.qs[S.i];
    const value = answerInput.value;
    const passed = answerMatches(item, value);
    if (!S.res[S.i]) S.res[S.i] = { q: item, answer: value, passed };
    S.answered = true;
    answerInput.readOnly = true;
    S.streak = passed ? S.streak + 1 : 0;
    feedback.textContent = passed
      ? `${pick(OK, S.i)}${S.streak >= 2 ? ` ${S.streak} in a row.` : ''} Review the worked steps below.`
      : `${pick(RETRY, S.i)} Read the method and the common mistake below, then try again or move on.`;
    if (passed && S.streak % 3 === 0) burst($('quiz-after'));
    setText('quiz-keys-text', 'to continue');
    feedback.className = `challenge-feedback ${passed ? 'is-correct' : 'is-retry'}`;
    setText('challenge-method', item.expectedMethod);
    setText('challenge-worked', item.workedSolution);
    setText('challenge-final', item.finalAnswer);
    setText('challenge-mistake', item.commonMistake ? `Watch for: ${item.commonMistake}` : '');
    $('challenge-solution').hidden = false;
    setProgress(S.i + 1);
    if (P()) {
      const before = P().LEVEL_NAMES.indexOf(P().mastery(item.topicId).level);
      P().recordAnswer(item.topicId, passed);
      const after = P().describe(item.topicId);
      const now = P().LEVEL_NAMES.indexOf(after.level);
      levelEl.textContent = now > before ? (before === 0 ? `Nice start on ${titleOf(item.topicId)}.` : `Level up: ${titleOf(item.topicId)} is now ${after.label}.`) : '';
      markLast(item);
      const slug = item.topicId;
      toolsEl.replaceChildren('Related tools: ');
      [['Visualize', 'visualize'], ['Laboratory', 'laboratory'], ['Learn', 'learn']].forEach(([label, page], i) => {
        const a = document.createElement('a');
        a.href = `${page}.html?topic=${slug}`;
        a.textContent = label;
        toolsEl.append(i ? ' · ' : '', a);
      });
      toolsEl.hidden = false;
    }
    const last = S.kind !== 'free' && S.i === S.qs.length - 1;
    nextBtn.firstChild.textContent = last ? 'See results ' : 'Next question ';
    nextBtn.hidden = false;
    retryBtn.hidden = passed;
    feedback.focus(); // next Tab stop is Try again / Next
  }
  function goNext() {
    if (!S || !S.answered) return;
    if (S.kind !== 'free' && S.i >= S.qs.length - 1) { showResults(); return; }
    S.i++;
    showQuestion();
  }
  function retryQuestion() {
    S.answered = false;
    clearAnswerState();
    nextBtn.hidden = true;
    retryBtn.hidden = true;
    answerInput.focus();
  }

  // ---- results view -----------------------------------------------------
  function showResults() {
    const res = S.res.filter(Boolean);
    if (!res.length) { toSetup(); return; }
    const right = res.filter((r) => r.passed).length;
    const missed = res.filter((r) => !r.passed);
    showView('results');
    S.final = res;
    setText('quiz-score', `${right} of ${res.length} correct`);
    const pct = right / res.length;
    const nStars = P() ? P().stars(right, res.length) : 0;
    const starEl = $('quiz-stars');
    starEl.textContent = '\u2605'.repeat(nStars) + '\u2606'.repeat(3 - nStars);
    starEl.setAttribute('aria-label', `${nStars} of 3 stars`);
    setText('quiz-score-note', pct === 1 ? 'A clean sweep. Every star earned.' : pct >= 0.7 ? 'Solid work. Look over the misses below.' : pct >= 0.4 ? 'Getting there. The review below shows where to look again.' : 'Every attempt maps the sky a little better. Start with the review below.');
    let bestNote = '';
    if (P() && (S.kind === 'quick' || S.kind === 'topic') && res.length === S.qs.length && !S.saved) {
      S.saved = true;
      const b = P().recordBest(S.kind, right, res.length);
      bestNote = !b.prev ? 'First score on the board. This is your best to beat.'
        : b.isNew ? `New best. Your previous best was ${b.prev.right} of ${b.prev.total}.`
        : `Your best ${S.kind} score is ${b.prev.right} of ${b.prev.total}.`;
    }
    setText('quiz-best', bestNote);
    if (nStars === 3) burst($('quiz-results'));
    const levels = $('quiz-levels');
    levels.replaceChildren();
    if (P()) {
      Object.keys(S.pre).forEach((slug) => {
        const d = P().describe(slug);
        const now = P().LEVEL_NAMES.indexOf(d.level);
        const li = document.createElement('li');
        if (now > S.pre[slug]) li.textContent = S.pre[slug] === 0 ? `Nice start on ${titleOf(slug)}.` : `Level up: ${titleOf(slug)} is now ${d.label}.`;
        else li.textContent = `${titleOf(slug)}: ${d.label}. ${d.next}.`;
        levels.append(li);
      });
    }
    const review = $('quiz-review');
    review.replaceChildren();
    res.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = r.passed ? 'is-right' : 'is-miss';
      const head = document.createElement('strong');
      head.textContent = `${i + 1}. ${r.passed ? 'Correct' : 'Missed'}`;
      const q = document.createElement('p');
      q.className = 'quiz-review-q';
      q.textContent = r.q.question;
      const mine = document.createElement('p');
      mine.textContent = `Your answer: ${r.answer || '(blank)'}`;
      const exp = document.createElement('p');
      exp.textContent = `Expected: ${r.q.finalAnswer}`;
      li.append(head, q, mine, exp);
      review.append(li);
    });
    const slugs = [...new Set(missed.map((r) => r.q.topicId))];
    const wrap = $('quiz-topics-wrap');
    wrap.hidden = !slugs.length;
    const topics = $('quiz-topics');
    topics.replaceChildren();
    slugs.forEach((slug, i) => {
      const a = document.createElement('a');
      a.href = `learn.html?topic=${slug}`;
      a.textContent = titleOf(slug);
      topics.append(i ? ' · ' : '', a);
    });
    const rm = $('quiz-retry-missed');
    rm.hidden = !missed.length;
    rm.firstChild.textContent = `Retry missed (${missed.length})`;
    $('quiz-score').focus();
  }
  function retryMissed() {
    const missed = (S.final || []).filter((r) => !r.passed).map((r) => r.q);
    if (missed.length) startSession('retry', shuffle(missed));
  }

  // ---- browse drawer ----------------------------------------------------
  function renderList() {
    const query = normalize(searchInput.value);
    filteredQuestions = allQuestions.filter((item) => {
      const categoryMatch = category === 'all' || item.topicId === categoryIds[category];
      const difficultyMatch = difficulty === 'all' || item.difficulty.toLowerCase() === difficulty;
      const searchMatch = !query || normalize(`${item.topicName} ${item.question} ${item.given} ${item.formula}`).includes(query);
      return categoryMatch && difficultyMatch && searchMatch;
    });
    list.replaceChildren();
    const fragment = document.createDocumentFragment();
    filteredQuestions.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'challenge-list-item';
      button.dataset.questionIndex = String(index);
      const number = document.createElement('span');
      number.textContent = String(index + 1).padStart(3, '0');
      const copy = document.createElement('span');
      const title = document.createElement('b');
      title.textContent = item.topicName;
      const description = document.createElement('small');
      description.textContent = `${item.difficulty} · ${item.question}`;
      copy.append(title, description);
      const arrow = document.createElement('i');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      button.append(number, copy, arrow);
      button.addEventListener('click', () => {
        startSession('free', [...filteredQuestions.slice(index), ...filteredQuestions.slice(0, index)]);
        $('challenge-browse').open = false;
        $('quiz-stage').scrollIntoView?.({ block: 'start' });
      });
      fragment.append(button);
    });
    list.append(fragment);
    setText('challenge-bank-count', `${filteredQuestions.length} matching question${filteredQuestions.length === 1 ? '' : 's'} · ${allQuestions.length} curriculum examples available`);
  }

  function setCategory(key) {
    category = key;
    const button = filters.find((b) => b.dataset.challengeFilter === key);
    filters.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (allQuestions.length) renderList();
  }
  function applyHash() {
    const slug = new URLSearchParams(location.hash.slice(1)).get('topic');
    const key = Object.keys(categoryIds).find((k) => categoryIds[k] === slug);
    if (!key) return false;
    setupTopic = key;
    $('quiz-topic').value = key;
    if (key !== category) setCategory(key);
    updateSetupNote();
    return true;
  }

  filters.forEach((button) => button.addEventListener('click', () => setCategory(button.dataset.challengeFilter)));
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  window.addEventListener('hashchange', applyHash);
  window.addEventListener('progress-change', refreshProgress);
  searchInput.addEventListener('input', renderList);
  $('challenge-difficulty-filter').addEventListener('change', (event) => { difficulty = event.target.value; renderList(); });
  $('quiz-topic').addEventListener('change', (event) => { setupTopic = event.target.value; updateSetupNote(); });
  $('quiz-difficulty').addEventListener('change', updateSetupNote);
  $('quiz-start').addEventListener('click', () => {
    const pool = poolFor(setupTopic, ($('quiz-difficulty').value || 'all'));
    startSession(mode, pickSet(pool, SIZES[mode]));
  });
  $('quiz-finish').addEventListener('click', showResults);
  $('quiz-new').addEventListener('click', toSetup);
  $('quiz-retry-missed').addEventListener('click', retryMissed);
  nextBtn.addEventListener('click', goNext);
  retryBtn.addEventListener('click', retryQuestion);
  feedback.addEventListener('keydown', (event) => { if (event.key === 'Enter') goNext(); });
  $('challenge-hint-toggle').addEventListener('click', () => {
    const formula = $('challenge-formula');
    const toggle = $('challenge-hint-toggle');
    const revealed = formula.hidden;
    formula.hidden = !revealed;
    toggle.setAttribute('aria-expanded', String(revealed));
    toggle.firstChild.textContent = revealed ? 'Hide hint ' : 'Reveal hint ';
    toggle.querySelector('span').textContent = revealed ? '−' : '+';
  });
  $('challenge-answer-form').addEventListener('submit', (event) => { event.preventDefault(); submitAnswer(); });
  document.querySelector('[data-load-feature]').addEventListener('click', () => {
    const pool = poolFor('sequences', 'all');
    const featured = pool.find((item) => /10th term.*arithmetic sequence.*first term 3/i.test(item.question));
    if (featured) startSession('free', [featured, ...shuffle(pool.filter((q) => q !== featured))]);
  });

  window.GRADE_11_MATH_DATA_READY?.then((data) => {
    allQuestions = data.modules.flatMap(({ id, topic, exampleBank }) => exampleBank.examples.map((item) => ({ ...item, topicId: id, topicName: topic.topicName })));
    if (!allQuestions.length) {
      setText('quiz-setup-note', 'The curriculum question bank could not be loaded. Please refresh the page or try Learn.');
      setText('challenge-bank-count', 'No questions loaded.');
      return;
    }
    setupTopic = Object.keys(categoryIds).find((k) => categoryIds[k] === P()?.nextStep()?.topic) || 'all';
    buildTopicSelect();
    applyHash();
    $('quiz-topic').value = setupTopic;
    renderList();
    refreshProgress();
    updateSetupNote();
  });
})();
