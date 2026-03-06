import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;
        let particles = [];
        const particleCount = 60; // Keep it low for subtle, premium feel and good performance

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles(); // Re-initialize on resize for even distribution
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };
        const handleMouseLeave = () => {
            mouseRef.current.x = -1000;
            mouseRef.current.y = -1000;
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);

        function initParticles() {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3, // Very slow movement
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 1.5 + 0.5,
                    baseAlpha: Math.random() * 0.4 + 0.1
                });
            }
        }

        function draw() {
            // Dark elegant clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connection lines
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particleCount; i++) {
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        // Primary brand color 00FF9D with distance-based alpha
                        ctx.strokeStyle = `rgba(0, 255, 157, ${0.1 * (1 - distance / 150)})`;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles and handle mouse interaction
            for (let i = 0; i < particleCount; i++) {
                let p = particles[i];

                p.x += p.vx;
                p.y += p.vy;

                // Bounce off walls smoothly
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Mouse interaction - gentle repulsion
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                let alpha = p.baseAlpha;
                if (distance < 200) {
                    // Brighten up when mouse is near
                    alpha = Math.min(p.baseAlpha + (200 - distance) / 200 * 0.5, 1);

                    // Subtle push away
                    const pushFactor = (200 - distance) / 200 * 0.02;
                    p.x -= dx * pushFactor;
                    p.y -= dy * pushFactor;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 157, ${alpha})`;
                ctx.fill();
            }

            // Draw elegant mouse glow
            if (mouseRef.current.x > -100) {
                const gradient = ctx.createRadialGradient(
                    mouseRef.current.x, mouseRef.current.y, 0,
                    mouseRef.current.x, mouseRef.current.y, 300
                );
                // Subtle blue/green mix for the mouse glow overlay
                gradient.addColorStop(0, 'rgba(0, 255, 157, 0.04)');
                gradient.addColorStop(0.4, 'rgba(59, 130, 246, 0.01)'); // touch of blue
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            animationFrameId = requestAnimationFrame(draw);
        }

        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-60"
            aria-hidden="true"
        />
    );
};

export default ParticleBackground;
