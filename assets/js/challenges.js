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
  const list = document.querySelector('#challenge-list');
  const filters = [...document.querySelectorAll('[data-challenge-filter]')];
  const answerInput = document.querySelector('#challenge-answer');
  const searchInput = document.querySelector('#challenge-search');
  let allQuestions = [];
  let filteredQuestions = [];
  let category = 'all';
  let difficulty = 'all';
  let currentIndex = 0;
  let katexReady;
  const P = () => window.Progress;
  const slugOf = (key) => categoryIds[key];
  const titleOf = (slug) => P()?.TOPICS.find((t) => t.id === slug)?.title || slug;
  const nextStepEl = document.createElement('p');
  nextStepEl.id = 'challenge-next-step';
  nextStepEl.className = 'challenge-next-step';
  list.before(nextStepEl);
  const toolsEl = document.createElement('p');
  toolsEl.id = 'challenge-related';
  toolsEl.className = 'challenge-related';
  toolsEl.hidden = true;
  document.querySelector('#challenge-solution').append(toolsEl);
  const levelEl = document.createElement('p');
  levelEl.className = 'challenge-levelup';
  levelEl.setAttribute('role', 'status');
  document.querySelector('#challenge-feedback').after(levelEl);

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
  function pickRandom() {
    const goal = P()?.load().goal;
    let pool = filteredQuestions.map((_, i) => i);
    if (P() && (goal === 'exam' || goal === 'catchup') && pool.length > 1) {
      const stat = (i) => P().mastery(filteredQuestions[i].topicId);
      const score = goal === 'exam' ? (i) => stat(i).n : (i) => stat(i).pct;
      const best = Math.min(...pool.map(score));
      pool = pool.filter((i) => score(i) === best);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

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

  function currentQuestion() { return filteredQuestions[currentIndex]; }
  function setText(id, value) { document.querySelector(`#${id}`).textContent = value ?? ''; }

  function selectQuestion(index, focus = false) {
    if (!filteredQuestions.length) return;
    currentIndex = (index + filteredQuestions.length) % filteredQuestions.length;
    const item = currentQuestion();
    setText('challenge-topic', item.topicName.toUpperCase());
    setText('challenge-difficulty', `${item.difficulty.toUpperCase()} · QUESTION ${currentIndex + 1}`);
    setText('challenge-question', item.question);
    renderMathText(document.querySelector('#challenge-given p'), item.given || 'Use the information stated in the problem.');
    const hint = document.querySelector('#challenge-hint');
    const hintToggle = document.querySelector('#challenge-hint-toggle');
    const formula = document.querySelector('#challenge-formula');
    hint.hidden = !item.formula;
    formula.hidden = true;
    hintToggle.setAttribute('aria-expanded', 'false');
    hintToggle.firstChild.textContent = 'Reveal hint ';
    hintToggle.querySelector('span').textContent = '+';
    formula.replaceChildren();
    if (item.formula) {
      const label = document.createElement('span');
      label.textContent = 'Hint: ';
      formula.append(label);
      renderMathText(formula, item.formula);
      formula.prepend(label);
    }
    setText('challenge-count', `Question ${currentIndex + 1} of ${filteredQuestions.length}`);
    answerInput.value = '';
    document.querySelector('#challenge-feedback').textContent = ''; levelEl.textContent = '';
    document.querySelector('#challenge-feedback').className = 'challenge-feedback';
    document.querySelector('#challenge-solution').hidden = true;
    [...list.querySelectorAll('[data-question-index]')].forEach((button) => button.classList.toggle('is-current', Number(button.dataset.questionIndex) === currentIndex));
    toolsEl.hidden = true;
    markLast(item);
    if (focus) answerInput.focus({ preventScroll: true });
  }

  function renderList() {
    const query = normalize(searchInput.value);
    filteredQuestions = allQuestions.filter((item) => {
      const categoryMatch = category === 'all' || item.topicId === categoryIds[category];
      const difficultyMatch = difficulty === 'all' || item.difficulty.toLowerCase() === difficulty;
      const searchMatch = !query || normalize(`${item.topicName} ${item.question} ${item.given} ${item.formula}`).includes(query);
      return categoryMatch && difficultyMatch && searchMatch;
    });
    currentIndex = Math.min(currentIndex, Math.max(filteredQuestions.length - 1, 0));
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
      button.addEventListener('click', () => selectQuestion(index, true));
      fragment.append(button);
    });
    list.append(fragment);
    setText('challenge-bank-count', `${filteredQuestions.length} matching question${filteredQuestions.length === 1 ? '' : 's'} · ${allQuestions.length} curriculum examples available`);
    if (filteredQuestions.length) selectQuestion(currentIndex);
    else {
      setText('challenge-topic', 'NO MATCHING QUESTIONS');
      setText('challenge-difficulty', 'CHANGE THE SEARCH OR FILTER');
      setText('challenge-question', 'Try a broader search or another topic and difficulty.');
      document.querySelector('#challenge-given p').textContent = '';
      setText('challenge-count', 'Question 0 of 0');
      document.querySelector('#challenge-hint').hidden = true;
      document.querySelector('#challenge-formula').hidden = true;
      document.querySelector('#challenge-solution').hidden = true;
      document.querySelector('#challenge-feedback').textContent = ''; levelEl.textContent = '';
    }
  }

  function setCategory(key) {
    category = key;
    currentIndex = 0;
    const button = filters.find((b) => b.dataset.challengeFilter === key);
    filters.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (allQuestions.length) renderList();
  }
  filters.forEach((button) => button.addEventListener('click', () => setCategory(button.dataset.challengeFilter)));
  function applyHash() {
    const slug = new URLSearchParams(location.hash.slice(1)).get('topic');
    const key = Object.keys(categoryIds).find((k) => categoryIds[k] === slug);
    if (key && key !== category) setCategory(key);
  }
  window.addEventListener('hashchange', applyHash);
  window.addEventListener('progress-change', refreshProgress);
  searchInput.addEventListener('input', () => { currentIndex = 0; renderList(); });
  document.querySelector('#challenge-difficulty-filter').addEventListener('change', (event) => { difficulty = event.target.value; currentIndex = 0; renderList(); });
  document.querySelector('#challenge-random').addEventListener('click', () => {
    if (!filteredQuestions.length) return;
    const next = filteredQuestions.length < 2 ? 0 : pickRandom();
    selectQuestion(next, true);
  });
  document.querySelector('#challenge-next').addEventListener('click', () => selectQuestion(currentIndex + 1, true));
  document.querySelector('#challenge-hint-toggle').addEventListener('click', () => {
    const formula = document.querySelector('#challenge-formula');
    const toggle = document.querySelector('#challenge-hint-toggle');
    const revealed = formula.hidden;
    formula.hidden = !revealed;
    toggle.setAttribute('aria-expanded', String(revealed));
    toggle.firstChild.textContent = revealed ? 'Hide hint ' : 'Reveal hint ';
    toggle.querySelector('span').textContent = revealed ? '−' : '+';
  });
  document.querySelector('#challenge-answer-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const item = currentQuestion();
    if (!item) return;
    const passed = answerMatches(item, answerInput.value);
    const feedback = document.querySelector('#challenge-feedback');
    feedback.textContent = passed ? 'Correct. Review the worked steps below.' : 'Not quite. Use the method and common-mistake note below, then retry.';
    feedback.className = `challenge-feedback ${passed ? 'is-correct' : 'is-retry'}`;
    setText('challenge-method', item.expectedMethod);
    setText('challenge-worked', item.workedSolution);
    setText('challenge-final', item.finalAnswer);
    setText('challenge-mistake', item.commonMistake ? `Watch for: ${item.commonMistake}` : '');
    document.querySelector('#challenge-solution').hidden = false;
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
  });
  document.querySelector('#challenge-retry').addEventListener('click', () => {
    answerInput.value = '';
    document.querySelector('#challenge-feedback').textContent = ''; levelEl.textContent = '';
    document.querySelector('#challenge-solution').hidden = true;
    answerInput.focus();
  });
  document.querySelector('[data-load-feature]').addEventListener('click', () => {
    filters.find((button) => button.dataset.challengeFilter === 'sequences')?.click();
    const featured = filteredQuestions.findIndex((item) => /10th term.*arithmetic sequence.*first term 3/i.test(item.question));
    if (featured >= 0) selectQuestion(featured, true);
  });

  window.GRADE_11_MATH_DATA_READY?.then((data) => {
    allQuestions = data.modules.flatMap(({ id, topic, exampleBank }) => exampleBank.examples.map((item) => ({ ...item, topicId: id, topicName: topic.topicName })));
    if (!allQuestions.length) {
      setText('challenge-question', 'The curriculum question bank could not be loaded. Please refresh the page or try Learn.');
      setText('challenge-bank-count', 'No questions loaded.');
      return;
    }
    applyHash();
    renderList();
    refreshProgress();
  });
})();
