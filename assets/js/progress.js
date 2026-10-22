// Browser-only student progress. No accounts, nothing leaves the browser.
// Classic script: exposes window.Progress; also module.exports for node tests.
(function (root) {
  const KEY = 'observatory-progress-v1';
  const WINDOW = 10; // answers per topic that count toward mastery
  const GOALS = ['exam', 'catchup', 'explore'];
  // Curriculum order. ids match data/knowledge/topics/<id>.json.
  const TOPICS = [
    { id: 'business-mathematics', title: 'Business Mathematics' },
    { id: 'sequences-and-series', title: 'Sequences and Series' },
    { id: 'measurement-and-conversion', title: 'Measurement and Conversion' },
    { id: 'functions', title: 'Functions' },
    { id: 'statistics', title: 'Statistics' },
    { id: 'trigonometry', title: 'Trigonometry' },
    { id: 'logic-and-mathematical-reasoning', title: 'Logic and Mathematical Reasoning' },
  ];
  const BEST_MODES = ['quick', 'topic'];
  const ids = new Set(TOPICS.map(t => t.id));

  const empty = () => ({ v: 1, goal: null, answers: {}, read: {}, last: null, act: null, ok: 0, days: {}, best: {}, path: null });

  function store() {
    try { return root.localStorage || null; } catch { return null; }
  }
  let memory = null; // fallback when storage is blocked

  function sanitize(raw) {
    const s = empty();
    if (!raw || typeof raw !== 'object') return s;
    if (GOALS.includes(raw.goal)) s.goal = raw.goal;
    for (const id of ids) {
      const a = raw.answers && raw.answers[id];
      if (Array.isArray(a)) s.answers[id] = a.slice(-WINDOW).map(Boolean);
      const r = raw.read && raw.read[id];
      if (r && typeof r === 'object') {
        s.read[id] = Object.fromEntries(Object.keys(r).filter(k => r[k]).slice(0, 200).map(k => [String(k).slice(0, 120), true]));
      }
    }
    const a = raw.act; // optional: { day:'YYYY-MM-DD', n: answers that day, run: consecutive days }
    if (a && typeof a.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.day)) {
      s.act = { day: a.day, n: Math.min(Math.max(Math.floor(Number(a.n)) || 0, 0), 9999), run: Math.min(Math.max(Math.floor(Number(a.run)) || 1, 1), 9999) };
    }
    const cnt = (v, max) => Math.min(Math.max(Math.floor(Number(v)) || 0, 0), max);
    const DAY = /^\d{4}-\d{2}-\d{2}$/;
    // ok: lifetime correct answers (answers[] is only a 10-answer window). Legacy saves fall back to the window.
    s.ok = raw.ok == null ? Object.values(s.answers).reduce((t, a) => t + a.filter(Boolean).length, 0) : cnt(raw.ok, 99999);
    if (raw.days && typeof raw.days === 'object') { // answers per day, newest 14 days kept
      Object.keys(raw.days).filter(k => DAY.test(k)).sort().slice(-14).forEach(k => { s.days[k] = cnt(raw.days[k], 9999); });
    }
    if (raw.best && typeof raw.best === 'object') { // best quiz score per mode
      for (const m of BEST_MODES) {
        const b = raw.best[m];
        if (b && typeof b === 'object') { const total = cnt(b.total, 999), right = Math.min(cnt(b.right, 999), total); if (total) s.best[m] = { right, total }; }
      }
    }
    const pa = raw.path; // which of today's path steps are done
    if (pa && typeof pa.day === 'string' && DAY.test(pa.day)) s.path = { day: pa.day, read: !!pa.read, tool: !!pa.tool };
    const l = raw.last;
    if (l && ids.has(l.topic) && typeof l.href === 'string' && /^[\w./#?=&%-]+$/.test(l.href) && !/^(?:[a-z]+:)?\/\//i.test(l.href)) {
      s.last = { topic: l.topic, page: String(l.page || '').slice(0, 40), label: String(l.label || '').slice(0, 120), href: l.href, at: Number(l.at) || 0 };
    }
    return s;
  }

  function load() {
    const st = store();
    if (!st) return memory ? sanitize(memory) : empty();
    let raw;
    try { raw = st.getItem(KEY); } catch { return memory ? sanitize(memory) : empty(); } // blocked: memory only
    try { return sanitize(JSON.parse(raw)); } catch { return empty(); }
  }
  function save(state) {
    const st = store();
    memory = state;
    try { st && st.setItem(KEY, JSON.stringify(state)); } catch { /* quota/blocked: memory only */ }
    try { root.dispatchEvent && root.dispatchEvent(new CustomEvent('progress-change')); } catch { /* no DOM */ }
  }
  const mutate = fn => { const s = load(); fn(s); save(s); return s; };

  function mastery(topic, state = load()) {
    const a = state.answers[topic] || [];
    const n = a.length;
    const pct = n ? a.filter(Boolean).length / n : 0;
    let level = 'new';
    if (n) level = 'practising';
    if (n >= 5 && pct >= 0.7) level = 'confident';
    if (n >= 8 && pct >= 0.9) level = 'mastered';
    return { level, pct, n, correct: a.filter(Boolean).length };
  }

  const LEVEL_NAMES = ['new', 'practising', 'confident', 'mastered'];
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

  function touchPath(s, key) {
    const day = dayKey();
    if (!s.path || s.path.day !== day) s.path = { day, read: false, tool: false };
    s.path[key] = true;
  }

  // Observatory rank from lifetime correct answers.
  const RANKS = [[0, 'Stargazer'], [10, 'Navigator'], [30, 'Astronomer'], [70, 'Cartographer'], [150, 'Luminary']];
  function rank(correct) {
    const n = Math.max(0, Math.floor(Number(correct)) || 0);
    let i = 0;
    RANKS.forEach(([min], k) => { if (n >= min) i = k; });
    const next = RANKS[i + 1];
    return { name: RANKS[i][1], index: i, of: RANKS.length, correct: n, next: next ? next[1] : null, toNext: next ? next[0] - n : 0 };
  }
  // 0-3 stars for a quiz score.
  const stars = (right, total) => (!total ? 0 : right === total ? 3 : right / total >= 0.7 ? 2 : right / total >= 0.4 ? 1 : 0);
  // Last 7 days ending at `now`, oldest first.
  function week(state = load(), now = new Date()) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i));
      const day = dayKey(d), a = state.act;
      const n = state.days[day] || (a && a.day === day ? a.n : 0);
      return { day, n, label: d.toLocaleDateString('en', { weekday: 'short' }), today: i === 6 };
    });
  }
  const greeting = (hour = new Date().getHours()) => (hour < 5 ? 'Still up, stargazer?' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  // Today's path: lesson read, a quiz answer, a tool visited.
  function pathToday(state = load()) {
    const p = state.path && state.path.day === dayKey() ? state.path : {};
    return { read: !!p.read, quiz: activity(state).today >= 5, tool: !!p.tool };
  }

  // Gentle display wording; levels in the store stay new/practising/confident/mastered.
  function describe(topic, state = load()) {
    const m = mastery(topic, state);
    const label = { new: 'Ready to begin', practising: m.n < 3 ? 'Just started' : 'Building up', confident: 'Confident', mastered: 'Mastered' }[m.level];
    const progress = m.n ? `${m.n} of ${WINDOW} answered` : 'Not answered yet';
    const more = (need) => `${need - m.n} more answer${need - m.n === 1 ? '' : 's'}`;
    let next;
    if (m.level === 'new') next = 'Answer one question to begin';
    else if (m.level === 'practising') next = m.n < 5 ? `${more(5)} to reach Confident` : 'Get 7 in 10 right to reach Confident';
    else if (m.level === 'confident') next = m.n < 8 ? `${more(8)} to reach Mastered` : 'Get 9 in 10 right to reach Mastered';
    else next = 'Keep it fresh with a few more';
    return { ...m, label, progress, next };
  }

  // Streak: consecutive days with an answer, plus answers today.
  function activity(state = load()) {
    const a = state.act;
    if (!a) return { today: 0, run: 0 };
    if (a.day === dayKey()) return { today: a.n, run: a.run };
    return { today: 0, run: a.day === yesterdayKey() ? a.run : 0 };
  }

  function nextStep(state = load()) {
    const rows = TOPICS.map(t => ({ t, m: mastery(t.id, state) }));
    const practise = r => ({ topic: r.t.id, action: 'practise', href: `challenges.html#topic=${r.t.id}`,
      label: r.m.n ? `Keep going with ${r.t.title}: ${r.m.correct} of ${r.m.n} right so far` : `Start with ${r.t.title}` });
    const shaky = rows.filter(r => r.m.n && r.m.level === 'practising').sort((a, b) => a.m.pct - b.m.pct);
    const fresh = rows.filter(r => !r.m.n);
    const goal = state.goal || 'catchup';
    if (goal === 'explore' && fresh.length) {
      const r = fresh[0];
      return { topic: r.t.id, action: 'visualize', href: 'visualize.html', label: `Explore ${r.t.title} visually` };
    }
    if (goal === 'exam') {
      // spread coverage first: least-practised topic, ties by curriculum order
      const r = rows.slice().sort((a, b) => a.m.n - b.m.n)[0];
      if (r.m.n < WINDOW) return practise(r);
    }
    if (shaky.length) return practise(shaky[0]);
    if (fresh.length) return practise(fresh[0]);
    const weakest = rows.slice().sort((a, b) => a.m.pct - b.m.pct)[0];
    return practise(weakest);
  }

  const Progress = {
    TOPICS, GOALS, WINDOW, LEVEL_NAMES,
    load,
    hasHistory: (s = load()) => Object.values(s.answers).some(a => a.length) || !!s.last,
    setGoal: goal => mutate(s => { if (GOALS.includes(goal)) s.goal = goal; }),
    recordAnswer: (topic, correct) => ids.has(topic) && mutate(s => {
      s.answers[topic] = [...(s.answers[topic] || []), !!correct].slice(-WINDOW);
      const day = dayKey(), a = s.act;
      if (correct) s.ok += 1;
      s.days[day] = (s.days[day] || 0) + 1;
      Object.keys(s.days).sort().slice(0, -14).forEach(k => { delete s.days[k]; });
      s.act = a && a.day === day ? { day, n: a.n + 1, run: a.run }
        : { day, n: 1, run: a && a.day === yesterdayKey() ? a.run + 1 : 1 };
    }),
    markRead: (topic, lesson, read = true) => ids.has(topic) && mutate(s => {
      const r = s.read[topic] || (s.read[topic] = {});
      if (read) { r[String(lesson).slice(0, 120)] = true; touchPath(s, 'read'); } else delete r[lesson];
    }),
    isRead: (topic, lesson, s = load()) => !!(s.read[topic] && s.read[topic][lesson]),
    readCount: (topic, s = load()) => Object.keys(s.read[topic] || {}).length,
    setLast: (topic, page, label, href) => ids.has(topic) && mutate(s => {
      if (page !== 'challenges' && page !== 'learn') touchPath(s, 'tool');
      s.last = { topic, page, label, href: href || root.location?.pathname.split('/').pop() || 'index.html', at: Date.now() };
    }),
    mastery, describe, activity, nextStep, rank, stars, week, greeting, pathToday, DAILY_GOAL: 5,
    // Store the best score for a quiz mode; returns { isNew, prev }.
    recordBest(mode, right, total) {
      let out = { isNew: false, prev: null };
      if (!BEST_MODES.includes(mode) || !(total > 0)) return out;
      mutate(s => {
        const prev = s.best[mode] || null;
        out = { isNew: !!prev && right / total > prev.right / prev.total, prev };
        if (!prev || right / total > prev.right / prev.total) s.best[mode] = { right: Math.min(right, total), total };
      });
      return out;
    },
    exportJSON: () => JSON.stringify(load(), null, 2),
    importJSON(text) {
      let parsed;
      try { parsed = JSON.parse(text); } catch { return false; }
      if (!parsed || parsed.v !== 1) return false;
      save(sanitize(parsed));
      return true;
    },
    reset() { save(empty()); },
  };

  root.Progress = Progress;
  if (typeof module !== 'undefined' && module.exports) module.exports = Progress;
})(typeof window !== 'undefined' ? window : globalThis);
