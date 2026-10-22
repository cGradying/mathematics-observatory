// =========================================
// Why It Works - Interactive JavaScript
// =========================================

document.addEventListener('DOMContentLoaded', function() {
    initHeroAnimation();
    initIntuitionCards();
    initFormulaTabs();
    initDerivationDropdown();
    initVisualProofs();
    initChallengeReveals();
});

// =========================================
// Hero Canvas Animation
// =========================================

let heroAnimationFrameId = 0;
const proofAnimationButtons = new WeakSet();

function initHeroAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    if (heroAnimationFrameId) cancelAnimationFrame(heroAnimationFrameId);

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    let animationProgress = 0;
    let animationDirection = 1;

    function drawPythagoreanTheorem() {
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        ctx.clearRect(0, 0, w, h);

        // Calculate centered position
        const size = Math.min(w, h) * 0.6;
        const centerX = w / 2;
        const centerY = h / 2;
        const a = size * 0.4;
        const b = size * 0.3;
        const c = Math.sqrt(a * a + b * b);

        // Animated glow effect
        const glowIntensity = 0.5 + Math.sin(animationProgress) * 0.3;

        // Draw triangle
        ctx.save();
        ctx.translate(centerX - c / 2, centerY);

        // Triangle
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(a, 0);
        ctx.lineTo(a, -b);
        ctx.closePath();
        ctx.fillStyle = `rgba(99, 102, 241, ${0.15 + glowIntensity * 0.1})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.8 + glowIntensity * 0.2})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Square on side a (bottom)
        ctx.beginPath();
        ctx.rect(0, 0, a, a);
        ctx.fillStyle = `rgba(168, 85, 247, ${0.2 + glowIntensity * 0.15})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Square on side b (right)
        ctx.beginPath();
        ctx.rect(a, -b, b, b);
        ctx.fillStyle = `rgba(99, 102, 241, ${0.2 + glowIntensity * 0.15})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Square on side c (hypotenuse)
        ctx.save();
        ctx.translate(a / 2, -b / 2);
        ctx.rotate(Math.atan2(-b, a));
        ctx.translate(-c / 2, -c / 2);
        ctx.beginPath();
        ctx.rect(0, 0, c, c);
        ctx.fillStyle = `rgba(16, 185, 129, ${0.2 + glowIntensity * 0.15})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('a²', a / 2, a / 2);
        ctx.fillText('b²', a + b / 2, -b / 2);

        ctx.save();
        ctx.translate(a / 2, -b / 2);
        ctx.rotate(Math.atan2(-b, a));
        ctx.fillText('c²', 0, 0);
        ctx.restore();

        ctx.restore();

        // Equation at the bottom
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 24px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('a² + b² = c²', centerX, h - 40);
    }

    function animate() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            drawPythagoreanTheorem();
            return;
        }
        animationProgress += 0.02 * animationDirection;
        if (animationProgress > Math.PI * 2) {
            animationProgress = 0;
        }
        drawPythagoreanTheorem();
        heroAnimationFrameId = requestAnimationFrame(animate);
    }

    animate();
}

// =========================================
// Intuition Cards - Expand/Collapse
// =========================================

function initIntuitionCards() {
    const exploreButtons = document.querySelectorAll('.explore-btn');

    exploreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.intuition-card');
            const detail = card.querySelector('.concept-detail');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            if (isExpanded) {
                this.setAttribute('aria-expanded', 'false');
                detail.style.display = 'none';
            } else {
                this.setAttribute('aria-expanded', 'true');
                detail.style.display = 'block';
            }
        });
    });
}

// =========================================
// Formula Tabs
// =========================================

function initFormulaTabs() {
    const tabs = document.querySelectorAll('.formula-tab');
    const panels = document.querySelectorAll('.formula-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetId = this.getAttribute('data-formula');

            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });

            // Hide all panels
            panels.forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none';
            });

            // Activate clicked tab
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');

            // Show corresponding panel
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.style.display = 'block';
            }
        });
    });
}

// =========================================
// Derivation Dropdown & Step Expansion
// =========================================

function initDerivationDropdown() {
    const dropdown = document.getElementById('derivation-select');
    if (!dropdown) return;

    dropdown.addEventListener('change', function() {
        const selectedValue = this.value;
        const allContents = document.querySelectorAll('.derivation-content');

        allContents.forEach(content => {
            content.classList.remove('active');
        });

        const selectedContent = document.querySelector(`[data-derivation="${selectedValue}"]`);
        if (selectedContent) {
            selectedContent.classList.add('active');
            initStepToggles(selectedContent);
        }
    });

    // Initialize first derivation
    const firstContent = document.querySelector('.derivation-content');
    if (firstContent) {
        firstContent.classList.add('active');
        initStepToggles(firstContent);
    }
}

function initStepToggles(container) {
    const stepHeaders = container.querySelectorAll('.step-header');

    stepHeaders.forEach(header => {
        // Remove previous listeners by cloning
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        newHeader.addEventListener('click', function() {
            const stepDiv = this.closest('.derivation-step');
            const content = stepDiv.querySelector('.step-content');
            const toggle = this.querySelector('.step-toggle');
            const isHidden = content.classList.contains('hidden');

            if (isHidden) {
                content.classList.remove('hidden');
                toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
            } else {
                content.classList.add('hidden');
                toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
            }
        });
    });

    // Expand all button
    const expandAllBtn = container.querySelector('[id^="expand-all"]');
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', function() {
            const contents = container.querySelectorAll('.step-content');
            const toggles = container.querySelectorAll('.step-toggle');

            contents.forEach(content => content.classList.remove('hidden'));
            toggles.forEach(toggle => {
                toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
            });
        });
    }

    // Collapse all button
    const collapseAllBtn = container.querySelector('[id^="collapse-all"]');
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', function() {
            const contents = container.querySelectorAll('.step-content');
            const toggles = container.querySelectorAll('.step-toggle');

            contents.forEach(content => content.classList.add('hidden'));
            toggles.forEach(toggle => {
                toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
            });
        });
    }
}

// =========================================
// Visual Proofs Canvas Animations
// =========================================

function initVisualProofs() {
    initPythagoreanProof();
    initSumOfSquaresProof();
    initGaussSeriesProof();
    initDifferenceOfSquaresProof();
}

function initGaussSeriesProof() {
    const canvas = document.getElementById('gauss-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const sizeCanvas = () => {
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        if (canvas.width !== width * 2 || canvas.height !== height * 2) {
            canvas.width = width * 2;
            canvas.height = height * 2;
            ctx.setTransform(2, 0, 0, 2, 0, 0);
        }
        return { width, height };
    };
    const draw = progress => {
        const { width, height } = sizeCanvas();
        ctx.clearRect(0, 0, width, height);

        const rows = 8;
        const dot = Math.min(18, (width - 96) / (rows * 2));
        const left = (width - rows * dot * 2) / 2;
        const top = Math.max(24, (height - rows * dot) / 2);
        const count = Math.ceil(rows * progress);
        ctx.fillStyle = '#14707c';
        for (let row = 0; row < count; row++) {
            for (let col = 0; col <= row; col++) {
                ctx.beginPath();
                ctx.arc(left + col * dot, top + row * dot, Math.max(2, dot * 0.28), 0, Math.PI * 2);
                ctx.arc(left + (rows + col) * dot, top + (rows - row - 1) * dot, Math.max(2, dot * 0.28), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.fillStyle = '#0f4f57';
        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('1 + 2 + … + n = n(n + 1) / 2', width / 2, height - 16);
    };

    draw(1);
    const button = document.querySelector('[data-canvas="gauss-canvas"]');
    if (!button || proofAnimationButtons.has(button)) return;
    proofAnimationButtons.add(button);
    button.addEventListener('click', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            draw(1);
            return;
        }
        const started = performance.now();
        const animate = now => {
            const progress = Math.min(1, (now - started) / 900);
            draw(progress);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    });
}

function initDifferenceOfSquaresProof() {
    const canvas = document.getElementById('difference-squares-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const sizeCanvas = () => {
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        if (canvas.width !== width * 2 || canvas.height !== height * 2) {
            canvas.width = width * 2;
            canvas.height = height * 2;
            ctx.setTransform(2, 0, 0, 2, 0, 0);
        }
        return { width, height };
    };
    const draw = progress => {
        const { width, height } = sizeCanvas();
        ctx.clearRect(0, 0, width, height);

        const size = Math.min(190, height - 72, width - 80);
        const left = (width - size) / 2;
        const top = (height - size) / 2 - 8;
        const cut = size * 0.36;
        ctx.fillStyle = 'rgba(20, 112, 124, 0.24)';
        ctx.fillRect(left, top, size, size);
        ctx.fillStyle = '#b48254';
        ctx.globalAlpha = 0.85;
        ctx.fillRect(left + size - cut, top + size - cut, cut, cut);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#0f4f57';
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, size, size);
        ctx.strokeRect(left + size - cut, top + size - cut, cut, cut);
        ctx.fillStyle = '#0f2a2f';
        ctx.font = '600 15px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(progress < 0.5 ? 'a² − b²' : '(a + b)(a − b)', width / 2, height - 16);
    };

    draw(0);
    const button = document.querySelector('[data-canvas="difference-squares-canvas"]');
    if (!button || proofAnimationButtons.has(button)) return;
    proofAnimationButtons.add(button);
    button.addEventListener('click', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            draw(1);
            return;
        }
        const started = performance.now();
        const animate = now => {
            const progress = Math.min(1, (now - started) / 850);
            draw(progress);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    });
}

function initPythagoreanProof() {
    const canvas = document.getElementById('pythagorean-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 400 * 2;
    ctx.scale(2, 2);

    const animateBtn = document.querySelector('[data-canvas="pythagorean-canvas"]');
    let animationFrame = 0;
    let isAnimating = false;

    function drawStatic() {
        const w = canvas.offsetWidth;
        const h = 400;
        ctx.clearRect(0, 0, w, h);

        const size = 120;
        const startX = w / 2 - size - 40;
        const startY = h / 2 - size / 2;

        // Draw left square (a² + b²)
        ctx.fillStyle = 'rgba(20, 112, 124, 0.22)';
        ctx.fillRect(startX, startY, size, size);
        ctx.strokeStyle = '#14707c';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, size, size);

        // Draw subdivision
        const a = size * 0.6;
        const b = size * 0.4;
        ctx.strokeStyle = 'rgba(18, 43, 48, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX + a, startY);
        ctx.lineTo(startX + a, startY + size);
        ctx.moveTo(startX, startY + a);
        ctx.lineTo(startX + size, startY + a);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#0f2a2f';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('a²', startX + a / 2, startY + a / 2);
        ctx.fillText('b²', startX + size - b / 2, startY + a / 2);

        // Draw equals sign
        ctx.fillText('=', w / 2, h / 2);

        // Draw right square (c²)
        const rightX = w / 2 + 40;
        ctx.fillStyle = 'rgba(180, 130, 84, 0.28)';
        ctx.fillRect(rightX, startY, size, size);
        ctx.strokeStyle = '#b48254';
        ctx.lineWidth = 2;
        ctx.strokeRect(rightX, startY, size, size);
        ctx.fillStyle = '#0f2a2f';
        ctx.fillText('c²', rightX + size / 2, startY + size / 2);
    }

    function animate() {
        if (!isAnimating) return;

        const w = canvas.offsetWidth;
        const h = 400;
        ctx.clearRect(0, 0, w, h);

        const size = 120;
        const startX = w / 2 - size - 40;
        const startY = h / 2 - size / 2;
        const progress = (animationFrame % 120) / 120;

        // Animate transformation
        const offsetX = progress * 80;
        const rotation = progress * Math.PI / 4;

        ctx.save();
        ctx.translate(startX + offsetX, startY);
        ctx.rotate(rotation);
        ctx.fillStyle = `rgba(20, 112, 124, ${0.25 - progress * 0.08})`;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.strokeStyle = '#14707c';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.restore();

        // Target square
        const rightX = w / 2 + 40;
        ctx.fillStyle = `rgba(180, 130, 84, ${0.2 + progress * 0.15})`;
        ctx.fillRect(rightX, startY, size, size);
        ctx.strokeStyle = '#b48254';
        ctx.lineWidth = 2;
        ctx.strokeRect(rightX, startY, size, size);

        animationFrame++;
        if (animationFrame < 120) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            drawStatic();
        }
    }

    drawStatic();

    if (animateBtn && !proofAnimationButtons.has(animateBtn)) {
        proofAnimationButtons.add(animateBtn);
        animateBtn.addEventListener('click', function() {
            if (!isAnimating) {
                animationFrame = 0;
                isAnimating = true;
                animate();
            }
        });
    }
}

function initSumOfSquaresProof() {
    const canvas = document.getElementById('odd-sum-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 400 * 2;
    ctx.scale(2, 2);

    const animateBtn = document.querySelector('[data-canvas="odd-sum-canvas"]');
    let animationFrame = 0;
    let isAnimating = false;

    function drawStatic() {
        const w = canvas.offsetWidth;
        const h = 400;
        ctx.clearRect(0, 0, w, h);

        const n = 5;
        const maxSize = 50;
        let xOffset = 50;
        const yBase = h / 2;

        // Draw squares 1² + 2² + 3² + 4² + 5²
        for (let i = 1; i <= n; i++) {
            const size = i * (maxSize / n);
            ctx.fillStyle = `hsla(${178 + i * 7}, 42%, 44%, 0.45)`;
            ctx.fillRect(xOffset, yBase - size, size, size);
            ctx.strokeStyle = `hsla(${178 + i * 7}, 60%, 28%, 0.95)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(xOffset, yBase - size, size, size);

            ctx.fillStyle = '#0f2a2f';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i}²`, xOffset + size / 2, yBase - size / 2);

            xOffset += size + 15;
        }

        // Draw formula
        ctx.fillStyle = '#0f2a2f';
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('1² + 2² + 3² + 4² + 5² = n(n+1)(2n+1)/6', w / 2, h - 30);
    }

    function animate() {
        if (!isAnimating) return;

        const w = canvas.offsetWidth;
        const h = 400;
        ctx.clearRect(0, 0, w, h);

        const n = 5;
        const maxSize = 50;
        const progress = (animationFrame % 100) / 100;
        let xOffset = 50;
        const yBase = h / 2;

        // Animate stacking
        for (let i = 1; i <= n; i++) {
            const size = i * (maxSize / n);
            const delay = (i - 1) * 0.15;
            const itemProgress = Math.max(0, Math.min(1, (progress - delay) / 0.2));
            const yPos = yBase - size + (1 - itemProgress) * 100;

            ctx.fillStyle = `hsla(${178 + i * 7}, 42%, 44%, ${0.45 * itemProgress})`;
            ctx.fillRect(xOffset, yPos, size, size);
            ctx.strokeStyle = `hsla(${178 + i * 7}, 60%, 28%, ${0.95 * itemProgress})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(xOffset, yPos, size, size);

            if (itemProgress > 0.5) {
                ctx.fillStyle = '#0f2a2f';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${i}²`, xOffset + size / 2, yPos + size / 2);
            }

            xOffset += size + 15;
        }

        animationFrame++;
        if (animationFrame < 100) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            drawStatic();
        }
    }

    drawStatic();

    if (animateBtn && !proofAnimationButtons.has(animateBtn)) {
        proofAnimationButtons.add(animateBtn);
        animateBtn.addEventListener('click', function() {
            if (!isAnimating) {
                animationFrame = 0;
                isAnimating = true;
                animate();
            }
        });
    }
}

// =========================================
// Challenge Reveals
// =========================================

function initChallengeReveals() {
    const revealButtons = document.querySelectorAll('.reveal-btn');

    revealButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.challenge-card');
            const answer = card.querySelector('.challenge-answer');
            const isRevealed = !answer.hidden;

            if (isRevealed) {
                answer.hidden = true;
                button.setAttribute('aria-expanded', 'false');
                this.textContent = 'Show Reasoning';
            } else {
                answer.hidden = false;
                button.setAttribute('aria-expanded', 'true');
                this.textContent = 'Hide Reasoning';
            }
        });
    });
}

// =========================================
// Utility: Responsive Canvas Resizing
// =========================================

window.addEventListener('resize', debounce(function() {
    initHeroAnimation();
    initVisualProofs();
}, 250));

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
