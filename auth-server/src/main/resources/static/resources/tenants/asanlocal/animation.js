(function() {
    'use strict';

    function initAnimation() {
        const animType = document.documentElement.getAttribute('data-animation') || 'orbit';
        const canvas = document.getElementById('tenant-anim-canvas');
        const orbitContainer = document.getElementById('viz-orbit-container');
        const stage = document.getElementById('auth-stage-container');

        if (!canvas || !stage) return;

        if (animType === 'matrix') {
            if (orbitContainer) orbitContainer.style.display = 'none';
            canvas.style.display = 'block';

            const ctx = canvas.getContext('2d');
            let width = stage.clientWidth || 320;
            let height = stage.clientHeight || 400;
            canvas.width = width;
            canvas.height = height;

            window.addEventListener('resize', () => {
                width = stage.clientWidth || 320;
                height = stage.clientHeight || 400;
                canvas.width = width;
                canvas.height = height;
            });

            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366F1';
            const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#EC4899';
            
            const chars = '01SMS.IR*#+~%><{}[]1010101';
            const fontSize = 13;
            const columns = Math.floor(width / fontSize);
            const drops = Array(columns).fill(1);

            const particles = Array.from({ length: 32 }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                radius: Math.random() * 2.5 + 1.5,
                color: Math.random() > 0.5 ? primaryColor : secondaryColor
            }));

            function drawMatrix() {
                ctx.fillStyle = 'rgba(17, 24, 39, 0.22)';
                ctx.fillRect(0, 0, width, height);

                ctx.font = fontSize + 'px monospace';
                for (let i = 0; i < drops.length; i++) {
                    const text = chars.charAt(Math.floor(Math.random() * chars.length));
                    ctx.fillStyle = (i % 3 === 0) ? secondaryColor : primaryColor;
                    ctx.globalAlpha = 0.6;
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                    if (drops[i] * fontSize > height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
                ctx.globalAlpha = 1.0;

                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.x < 0 || p.x > width) p.vx *= -1;
                    if (p.y < 0 || p.y > height) p.vy *= -1;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    for (let j = i + 1; j < particles.length; j++) {
                        const p2 = particles[j];
                        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                        if (dist < 75) {
                            ctx.strokeStyle = primaryColor;
                            ctx.globalAlpha = (1 - dist / 75) * 0.4;
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                }
                ctx.globalAlpha = 1.0;
                requestAnimationFrame(drawMatrix);
            }
            drawMatrix();
        } else if (animType === 'waves' || animType === 'particles') {
            // Interactive Mouse Follower Constellation / Particle Web
            if (orbitContainer) orbitContainer.style.display = 'none';
            canvas.style.display = 'block';

            const ctx = canvas.getContext('2d');
            const aside = document.querySelector('.auth-dark') || stage;

            function updateCanvasDimensions() {
                const rect = aside.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;
                canvas.width = (stage.clientWidth || rect.width || 360) * dpr;
                canvas.height = (stage.clientHeight || rect.height || 450) * dpr;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                ctx.scale(dpr, dpr);
            }

            let width = stage.clientWidth || 360;
            let height = stage.clientHeight || 450;
            updateCanvasDimensions();

            window.addEventListener('resize', () => {
                width = stage.clientWidth || 360;
                height = stage.clientHeight || 450;
                updateCanvasDimensions();
            });

            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--auth-c1').trim()
                || getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
                || '#0288D1';
            const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--auth-c2').trim()
                || getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()
                || '#00BCD4';

            const mouse = {
                x: width / 2,
                y: height / 2,
                targetX: width / 2,
                targetY: height / 2,
                isHovered: false,
                radius: 140
            };

            aside.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                mouse.targetX = e.clientX - rect.left;
                mouse.targetY = e.clientY - rect.top;
                mouse.isHovered = true;
            });

            aside.addEventListener('mouseleave', () => {
                mouse.isHovered = false;
            });

            aside.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    const rect = canvas.getBoundingClientRect();
                    mouse.targetX = e.touches[0].clientX - rect.left;
                    mouse.targetY = e.touches[0].clientY - rect.top;
                    mouse.isHovered = true;
                }
            }, { passive: true });

            const totalParticles = 90;
            const particles = Array.from({ length: totalParticles }, () => {
                const isSec = Math.random() > 0.45;
                return {
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    radius: Math.random() * 2.5 + 1.8,
                    color: isSec ? secondaryColor : primaryColor,
                    pulseOffset: Math.random() * Math.PI * 2
                };
            });

            let frame = 0;

            function animateConstellation() {
                frame++;
                mouse.x += (mouse.targetX - mouse.x) * 0.12;
                mouse.y += (mouse.targetY - mouse.y) * 0.12;

                ctx.clearRect(0, 0, width, height);

                // Subtle interactive mouse glow ripple
                if (mouse.isHovered) {
                    const grad = ctx.createRadialGradient(mouse.x, mouse.y, 4, mouse.x, mouse.y, mouse.radius);
                    grad.addColorStop(0, 'rgba(2, 136, 209, 0.28)');
                    grad.addColorStop(0.6, 'rgba(0, 188, 212, 0.08)');
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Mouse center beacon
                    ctx.beginPath();
                    const beaconR = 5 + Math.sin(frame * 0.08) * 1.8;
                    ctx.arc(mouse.x, mouse.y, beaconR, 0, Math.PI * 2);
                    ctx.fillStyle = secondaryColor;
                    ctx.shadowColor = secondaryColor;
                    ctx.shadowBlur = 14;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }

                for (let i = 0; i < particles.length; i++) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;

                    // Bounce off edges
                    if (p.x < 0 || p.x > width) p.vx *= -1;
                    if (p.y < 0 || p.y > height) p.vy *= -1;

                    // Repel and attract dynamic displacement with mouse
                    const dx = mouse.x - p.x;
                    const dy = mouse.y - p.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < mouse.radius && mouse.isHovered) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        const angle = Math.atan2(dy, dx);
                        // Push particles outward from mouse while adding swirl
                        p.x -= Math.cos(angle) * force * 4.2 - Math.sin(angle) * force * 1.6;
                        p.y -= Math.sin(angle) * force * 4.2 + Math.cos(angle) * force * 1.6;
                    }

                    const currentR = p.radius + Math.sin(frame * 0.04 + p.pulseOffset) * 0.6;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, Math.max(1, currentR), 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = dist < mouse.radius && mouse.isHovered ? 12 : 5;
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // Interactive connection beam to mouse
                    if (dist < mouse.radius && mouse.isHovered) {
                        ctx.strokeStyle = secondaryColor;
                        ctx.globalAlpha = (1 - dist / mouse.radius) * 0.85;
                        ctx.lineWidth = 1.3;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                        ctx.globalAlpha = 1.0;
                    }

                    // Connections between nearby particles
                    for (let j = i + 1; j < particles.length; j++) {
                        const p2 = particles[j];
                        const pDist = Math.hypot(p.x - p2.x, p.y - p2.y);
                        const maxLinkDist = 95;

                        if (pDist < maxLinkDist) {
                            ctx.strokeStyle = primaryColor;
                            ctx.globalAlpha = (1 - pDist / maxLinkDist) * 0.45;
                            ctx.lineWidth = 1.0;
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                            ctx.globalAlpha = 1.0;
                        }
                    }
                }

                requestAnimationFrame(animateConstellation);
            }

            animateConstellation();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimation);
    } else {
        initAnimation();
    }
})();
