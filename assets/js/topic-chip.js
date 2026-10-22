// Shows "Topic: X · level" chip when a page is opened with ?topic=<slug>. Classic script.
(function (win) {
  function init(w) {
    const P = w.Progress, d = w.document;
    if (!P || !d) return null;
    const slug = new URLSearchParams(w.location.search).get('topic');
    const topic = P.TOPICS.find(t => t.id === slug); // whitelist: anything else is ignored
    if (!topic) return null;
    const file = (w.location.pathname.split('/').pop() || 'index.html');
    const page = file.replace(/\.html$/, '');
    const pageName = page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, ' ');
    const level = P.describe(topic.id).label;

    const chip = d.createElement('aside');
    chip.className = 'topic-chip';
    chip.setAttribute('aria-label', 'Current topic');
    const text = d.createElement('span');
    text.className = 'topic-chip-text';
    text.textContent = `Topic: ${topic.title} · ${level}`;
    chip.appendChild(text);
    [['Practise this topic', `challenges.html#topic=${topic.id}`], ['Back to Learn', `learn.html?topic=${topic.id}`]].forEach(([label, href]) => {
      const a = d.createElement('a');
      a.textContent = label;
      a.href = href;
      chip.appendChild(a);
    });
    const main = d.querySelector('main');
    if (main && main.parentNode) main.parentNode.insertBefore(chip, main); else d.body.prepend(chip);
    P.setLast(topic.id, page, `Using ${pageName} for ${topic.title}`, file + w.location.search);
    return chip;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = init; return; }
  init(win);
})(typeof window !== 'undefined' ? window : globalThis);
