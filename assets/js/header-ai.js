// Header AI button: proxies the assistant's floating launcher (hidden by CSS) so its open/close state stays the single source of truth.
(() => {
    const btn = document.querySelector('.header-ai');
    if (!btn) return;
    const launcher = document.querySelector('.assistant-launcher');
    if (!launcher) { btn.hidden = true; return; } // assistant failed to load
    launcher.tabIndex = -1;
    launcher.setAttribute('aria-hidden', 'true');
    const sync = () => btn.setAttribute('aria-pressed', launcher.getAttribute('aria-expanded') === 'true' ? 'true' : 'false');
    new MutationObserver(sync).observe(launcher, { attributes: true, attributeFilter: ['aria-expanded'] });
    btn.addEventListener('click', () => launcher.click());
    sync();
})();
