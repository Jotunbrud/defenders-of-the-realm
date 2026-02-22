// ═══════════════════════════════════════════════════════════════
// DEFENDERS OF THE REALM - Splash Screen
// Particle effects and splash screen dismissal
// ═══════════════════════════════════════════════════════════════

(function() {
    // ── Particle System ──
    const canvas = document.getElementById('splash-particles');
    const ctx = canvas.getContext('2d');
    let particles = [], splashAnimFrame;
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class P {
        constructor() { this.w = canvas.width; this.h = canvas.height; this.reset(); this.y = Math.random() * this.h; }
        reset() {
            this.x = Math.random() * this.w; this.y = this.h + 4;
            this.size = Math.random() * 2.2 + 0.4;
            this.sy = -(Math.random() * 0.6 + 0.15);
            this.sx = (Math.random() - 0.5) * 0.3;
            this.o = Math.random() * 0.5 + 0.1;
            this.f = Math.random() * 0.02 + 0.005;
            const c = ['212,160,23','245,212,66','180,140,40','255,200,80'];
            this.c = c[Math.floor(Math.random() * c.length)];
        }
        update() {
            this.y += this.sy; this.x += this.sx + Math.sin(this.y * 0.01) * 0.15;
            this.o += Math.sin(Date.now() * this.f) * 0.008;
            this.o = Math.max(0.05, Math.min(0.55, this.o));
            if (this.y < -10) this.reset();
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.c},${this.o})`; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.c},${this.o * 0.15})`; ctx.fill();
        }
    }
    for (let i = 0; i < 60; i++) particles.push(new P());
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        splashAnimFrame = requestAnimationFrame(animate);
    }
    animate();

    // ── Loading text sequence ──
    const texts = ['Summoning Heroes...','Forging Alliances...','Darkness Approaches...','Ready for Battle!'];
    let idx = 0;
    const textEl = document.getElementById('splash-loading-text');
    const timer = setInterval(() => { idx++; if (idx < texts.length) textEl.textContent = texts[idx]; }, 1000);

    setTimeout(() => {
        clearInterval(timer);
        document.getElementById('splash-loading-container').style.display = 'none';
        textEl.style.display = 'none';
        document.getElementById('splash-start-btn').style.display = 'flex';
    }, 4500);

    // ── Dismiss ──
    window.dismissSplash = function() {
        const splash = document.getElementById('splash-screen');
        if (!splash) return;
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.remove();
            if (splashAnimFrame) cancelAnimationFrame(splashAnimFrame);
        }, 1300);
    };

    document.getElementById('splash-start-btn').addEventListener('click', window.dismissSplash);
    document.addEventListener('keydown', function splashKey(e) {
        if ((e.code === 'Space' || e.code === 'Enter') &&
            document.getElementById('splash-start-btn')?.style.display === 'flex') {
            window.dismissSplash();
            document.removeEventListener('keydown', splashKey);
        }
    });
})();
