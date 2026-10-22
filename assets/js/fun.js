/* Site-wide delight: Fun.pop(el), Fun.toast(text), Fun.reveal(root). Classic script; no deps.
   All motion is skipped under prefers-reduced-motion; nothing is hidden unless JS runs. */
(function (root) {
  var doc = root.document;
  var reduced = function () {
    return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  var live = null, toastTimer = 0;

  function ensureLive() {
    if (live && live.isConnected !== false) return live;
    live = doc.createElement('div');
    live.className = 'fun-toast';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    doc.body.appendChild(live);
    return live;
  }

  // Sparkle burst (max 12 nodes, removed after 700ms). No-op when reduced motion.
  function pop(el, n) {
    if (!el || !doc.body || reduced()) return null;
    var r = el.getBoundingClientRect();
    var box = doc.createElement('span');
    box.className = 'fun-pop';
    box.setAttribute('aria-hidden', 'true');
    box.style.left = r.left + r.width / 2 + 'px';
    box.style.top = r.top + r.height / 2 + 'px';
    var count = Math.min(12, Math.max(1, n || 8));
    for (var i = 0; i < count; i++) {
      var s = doc.createElement('i');
      var a = (i / count) * Math.PI * 2;
      s.style.setProperty('--dx', Math.round(Math.cos(a) * 26) + 'px');
      s.style.setProperty('--dy', Math.round(Math.sin(a) * 26) + 'px');
      box.appendChild(s);
    }
    doc.body.appendChild(box);
    setTimeout(function () { if (box.remove) box.remove(); }, 700);
    return box;
  }

  function toast(text) {
    var el = ensureLive();
    clearTimeout(toastTimer);
    el.classList.remove('is-on');
    el.textContent = String(text);
    // next frame so the transition restarts on repeat toasts
    (root.requestAnimationFrame || setTimeout)(function () { el.classList.add('is-on'); });
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2200);
    return el;
  }

  // Staggered reveal of existing .reveal elements that start below the fold.
  var io = null;
  function reveal(scope) {
    if (reduced() || !('IntersectionObserver' in root)) return;
    var vh = root.innerHeight || 800;
    var list = (scope || doc).querySelectorAll('.reveal:not([data-fun])');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      el.setAttribute('data-fun', '');
      if (el.getBoundingClientRect().top < vh) continue; // already visible: leave alone
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--fun-i', Math.min(idx, 5));
      el.classList.add('fun-pre');
      if (!io) {
        io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.remove('fun-pre');
            io.unobserve(e.target);
          });
        }, { rootMargin: '0px 0px -8% 0px' });
      }
      io.observe(el);
    }
  }

  var Fun = { pop: pop, toast: toast, reveal: reveal };
  root.Fun = Fun;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fun;

  function init() {
    if (!doc.body) return;
    ensureLive();
    reveal(doc);
    // React pages render after load: catch late .reveal nodes briefly, then stop.
    var host = doc.getElementById('learn-root');
    if (host && root.MutationObserver) {
      var mo = new MutationObserver(function () { reveal(doc); });
      mo.observe(host, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 3000);
    }
  }
  if (doc && doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else if (doc && doc.body) init();
})(typeof window !== 'undefined' ? window : globalThis);
