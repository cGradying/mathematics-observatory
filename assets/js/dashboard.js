// Home dashboard: goal picker, Continue, topic mastery, next step, data controls.
// Text is always set via textContent; stored data is never parsed as HTML.
(function () {
  const P = window.Progress;
  const $ = id => document.getElementById(id);
  const root = $('dashboard');
  if (!P || !root) return;

  const GOALS = { exam: 'Exam prep', catchup: 'Catch up', explore: 'Just exploring' };
    const status = msg => { $('dash-status').textContent = msg; };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  const storageOk = (() => { try { window.localStorage.getItem('observatory-progress-v1'); return true; } catch { return false; } })();
  let skipped = false;
  try { skipped = window.sessionStorage.getItem('path-skip') === '1'; } catch { /* ignore */ }
  const STEPS = [
    { key: 'read', text: 'Learn a lesson', href: 'learn.html' },
    { key: 'quiz', text: 'Quiz 5', href: 'challenges.html' },
    { key: 'tool', text: 'Explore a tool', href: 'visualize.html' },
  ];
  function renderPath(s) {
    const box = $('path');
    box.hidden = !storageOk || skipped;
    if (box.hidden) return;
    const done = P.pathToday(s);
    const n = P.activity(s).today;
    const list = $('path-list');
    list.replaceChildren();
    STEPS.forEach((st, i) => {
      const ok = done[st.key];
      const li = el('li', 'path-item' + (ok ? ' is-done' : ''));
      const a = el('a', 'path-step');
      a.href = st.href;
      const sub = st.key === 'quiz' && !ok && n ? `${n} of 5 answered` : ok ? 'Done' : 'To do';
      a.append(el('span', 'path-mark', ok ? '\u2713' : String(i + 1)), el('span', 'path-text', st.text), el('span', 'path-state', sub));
      li.append(a);
      list.append(li);
    });
    $('path-title').textContent = done.read && done.quiz && done.tool ? 'Path complete. Well charted.' : 'Your path today';
  }
  $('path-skip').addEventListener('click', () => {
    skipped = true;
    try { window.sessionStorage.setItem('path-skip', '1'); } catch { /* ignore */ }
    $('path').hidden = true;
  });

  function render() {
    const s = P.load();
    const show = !!s.goal || P.hasHistory(s);
    root.hidden = false;
    renderPath(s);
    $('dash-goal').hidden = show;
    $('dash-main').hidden = !show;
    document.body.classList.toggle('has-dashboard', show);
    if (!show) return;

    $('dash-goal-now').textContent = GOALS[s.goal] || 'Not set';
    if (s.goal) $('dash-goal-select').value = s.goal;

    $('dash-continue').hidden = !s.last;
    if (s.last) {
      $('dash-continue-label').textContent = s.last.label || s.last.page || 'Your last page';
      $('dash-continue-link').href = s.last.href;
    }
    const n = P.nextStep(s);
    $('dash-next-label').textContent = n.label;
    $('dash-next-link').href = n.href;

    const r = P.rank(s.ok);
    $('dash-rank').textContent = `${r.name} \u00b7 rank ${r.index + 1} of ${r.of}`;
    $('dash-rank-next').textContent = r.next ? `${r.toNext} more correct answer${r.toNext === 1 ? '' : 's'} to ${r.next}.` : 'Top rank reached. The whole sky is open.';
    $('dash-title').textContent = `${P.greeting()}. ${s.ok ? 'Welcome back to the sky.' : 'Ready to chart something new?'}`;
    const goalN = P.activity(s).today;
    $('dash-ring').style.setProperty?.('--p', Math.min(goalN / P.DAILY_GOAL, 1) * 100 + '%');
    $('dash-ring').textContent = Math.min(goalN, P.DAILY_GOAL) + '/' + P.DAILY_GOAL;
    $('dash-goal-text').textContent = goalN >= P.DAILY_GOAL ? `Goal reached: ${goalN} answers today` : `${goalN} of ${P.DAILY_GOAL} answers today`;
    const wk = $('dash-week');
    wk.replaceChildren();
    const peak = Math.max(1, ...P.week(s).map(d => d.n));
    for (const d of P.week(s)) {
      const li = el('li', 'dash-day' + (d.today ? ' is-today' : '') + (d.n ? ' has-n' : ''));
      const bar = el('span', 'dash-day-bar');
      bar.style.setProperty?.('--h', Math.round(d.n / peak * 100) + '%');
      bar.setAttribute('aria-hidden', 'true');
      li.append(bar, el('span', 'dash-day-n', String(d.n)), el('span', 'dash-day-label', d.today ? 'Today' : d.label));
      li.setAttribute('aria-label', `${d.today ? 'Today' : d.label}: ${d.n} answer${d.n === 1 ? '' : 's'}`);
      wk.append(li);
    }

    const list = $('dash-topics');
    list.replaceChildren();
    const act = P.activity(s);
    $('dash-activity').textContent = act.today
      ? `${act.today} answered today${act.run > 1 ? ` \u00b7 ${act.run}-day streak` : ''}. Nice work.`
      : 'Every answer counts, even one a day.';
    for (const t of P.TOPICS) {
      const d = P.describe(t.id, s);
      const li = el('li', 'dash-topic dash-' + d.level);
      const name = el('h3', 'dash-topic-name', t.title);
      name.id = 'dash-topic-' + t.id;
      const bar = el('span', 'dash-bar');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-labelledby', name.id);
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(P.WINDOW));
      bar.setAttribute('aria-valuenow', String(d.n));
      bar.setAttribute('aria-valuetext', `${d.progress}. ${d.label}`);
      const fill = el('span', 'dash-fill');
      fill.style.width = Math.round(d.n / P.WINDOW * 100) + '%';
      bar.append(fill);
      li.append(name, el('p', 'dash-level', d.label), bar, el('p', 'dash-meta', d.progress), el('p', 'dash-meta', d.next));
      const reads = P.readCount(t.id, s);
      if (reads) li.append(el('p', 'dash-meta', `${reads} lesson${reads === 1 ? '' : 's'} read`));
      const a = el('a', 'dash-topic-action', d.n ? 'Continue practising' : 'Start');
      a.href = 'challenges.html#topic=' + t.id;
      a.setAttribute('aria-label', `${a.textContent}: ${t.title}`);
      li.append(a);
      list.append(li);
    }
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-goal]');
    if (b) { P.setGoal(b.dataset.goal); status(''); }
  });
  $('dash-goal-select').addEventListener('change', e => { P.setGoal(e.target.value); status('Goal updated.'); });

  $('dash-export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([P.exportJSON()], { type: 'application/json' }));
    const a = el('a');
    a.href = url; a.download = 'observatory-progress.json';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('Progress exported.');
  });

  $('dash-import').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    let ok = false;
    try { ok = f.size < 1e6 && P.importJSON(await f.text()); } catch { /* unreadable */ }
    status(ok ? 'Progress imported.' : 'Import failed: that is not a valid progress file. Your current progress was not changed.');
  });

  $('dash-reset').addEventListener('click', () => {
    if (!confirm('Reset all your progress in this browser? This cannot be undone.')) return;
    P.reset();
    status('Progress reset.');
  });

  window.addEventListener('progress-change', render);
  render();
})();
