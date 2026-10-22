// ============================================
// NAVIGATION
// ============================================

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!isOpen));
        navLinks.classList.toggle('active', !isOpen);
        menuToggle.classList.toggle('active', !isOpen);
    });
}

// ============================================
// HERO CANVAS ANIMATION
// ============================================

const canvas = document.getElementById('hero-canvas');

if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() { this.reset(); }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(222, 181, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const count = Math.min(100, Math.floor((canvas.width * canvas.height) / 10000));
        for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(201, 149, 255, ${(1 - distance / 150) * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => { particle.update(); particle.draw(); });
        drawConnections();
        animationFrameId = requestAnimationFrame(animate);
    }

    initParticles();
    animate();
    window.addEventListener('beforeunload', () => cancelAnimationFrame(animationFrameId));
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (!navLinks || !menuToggle) return;
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
        navLinks?.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
    }
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

function observeElements() {
    if (
        !('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe section cards
    document.querySelectorAll('.section-card').forEach(card => {
        card.classList.add('reveal-pending');
        observer.observe(card);
    });

    // Observe homepage intro blocks (grid intro, about content)
    document.querySelectorAll('.home-page [data-reveal]').forEach(block => {
        block.classList.add('reveal-pending');
        observer.observe(block);
    });

    // Observe approach items
    document.querySelectorAll('.approach-item').forEach(item => {
        item.classList.add('reveal-pending');
        observer.observe(item);
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeElements);
} else {
    observeElements();
}

function scrollToSections() {
    const sectionsElement = document.getElementById('sections');
    if (!sectionsElement) return;

    sectionsElement.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
}

// Duplicate the topic ticker content so the marquee loops seamlessly.
function setupTicker() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const track = document.getElementById('ticker-track');
    if (!track || track.dataset.loopReady === 'true') return;
    track.innerHTML += track.innerHTML;
    track.dataset.loopReady = 'true';
}

// Animate hero stat numbers from zero the first time they scroll into view.
function setupCounters() {
    const counters = document.querySelectorAll('.home-page .hero-stats dt[data-count]');
    if (!counters.length) return;
    if (
        !('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
        return;
    }
    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const target = entry.target;
            counterObserver.unobserve(target);
            const finalValue = Number(target.dataset.count);
            if (!Number.isFinite(finalValue)) return;
            const duration = 900;
            const start = performance.now();
            const tick = now => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                target.textContent = String(Math.round(finalValue * eased));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.6 });
    counters.forEach(counter => counterObserver.observe(counter));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setupTicker(); setupCounters(); });
} else {
    setupTicker();
    setupCounters();
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

const nav = document.querySelector('.main-nav');
let scrollTicking = false;
let previousScrollY = window.scrollY;

function updateNavbar() {
    if (!nav) {
        scrollTicking = false;
        return;
    }

    const currentScroll = Math.max(0, window.scrollY);
    const menuIsOpen = menuToggle?.getAttribute('aria-expanded') === 'true';

    nav.classList.toggle('is-scrolled', currentScroll > 12);

    // Keep the navigation available at the top, while scrolling upward, or
    // whenever the mobile menu is open. Small scroll changes are ignored.
    if (
        currentScroll <= 72 ||
        currentScroll < previousScrollY - 6 ||
        menuIsOpen
    ) {
        nav.classList.remove('is-hidden');
    } else if (currentScroll > previousScrollY + 6) {
        nav.classList.add('is-hidden');
    }

    document.body.classList.toggle(
        'nav-hidden',
        nav.classList.contains('is-hidden')
    );

    previousScrollY = currentScroll;
    scrollTicking = false;
}

window.addEventListener(
    'scroll',
    () => {
        if (scrollTicking) return;

        scrollTicking = true;
        window.requestAnimationFrame(updateNavbar);
    },
    { passive: true }
);

// Update after the mobile menu closes and when this page is restored from cache.
menuToggle?.addEventListener('click', () => {
    if (menuToggle.getAttribute('aria-expanded') === 'true') {
        nav?.classList.remove('is-hidden');
    }
});

window.addEventListener('pageshow', updateNavbar);
updateNavbar();

// Keep the homepage's subtle floating math notation as part of the hero treatment.
function createMathSymbols() {
    const symbols = ['π', 'Σ', '∫', '∞', 'θ', 'α', 'β', 'γ', '√', '∆'];
    const hero = document.querySelector('.hero');
    if (!hero) return;

    symbols.forEach((symbol, index) => {
        const span = document.createElement('span');
        span.textContent = symbol;
        span.style.position = 'absolute';
        span.style.zIndex = '1';
        span.style.fontSize = `${Math.random() * 40 + 20}px`;
        span.style.color = 'rgba(222, 181, 255, 0.1)';
        span.style.left = `${Math.random() * 100}%`;
        span.style.top = `${Math.random() * 100}%`;
        span.style.pointerEvents = 'none';
        span.style.animation = `float ${10 + Math.random() * 10}s ease-in-out infinite`;
        span.style.animationDelay = `${index * 0.5}s`;
        hero.appendChild(span);
    });
}

const floatingSymbolStyles = document.createElement('style');
floatingSymbolStyles.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.05; }
        50% { transform: translateY(-30px) rotate(180deg); opacity: 0.15; }
    }
`;
document.head.appendChild(floatingSymbolStyles);
createMathSymbols();

document.getElementById('begin-exploration')?.addEventListener('click', scrollToSections);
