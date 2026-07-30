/**
 * BrushQuest AI — Background Effects
 * Animated floating glass canvas particles + ambient radial blurs.
 */

import { useEffect, useRef } from 'react';

// ─── Floating Glass Tile Particle ─────────────────────────────────────────────
function GlassTile({ style, size = 60, delay = 0, duration = 8, rotate = 12 }) {
  return (
    <div
      className="absolute rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm"
      style={{
        width: size,
        height: size,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    />
  );
}

// ─── Animated Particle Canvas ────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    particles.current = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.4 + 0.1,
      hue: Math.random() > 0.5 ? 270 : 320, // purple or pink
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.opacity})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Ambient radial blurs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl animate-pulse-glow" />
      <div className="absolute -top-20 right-10 w-80 h-80 rounded-full bg-pink-600/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-20 left-1/4 w-72 h-72 rounded-full bg-indigo-600/8 blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />
      <div className="absolute -bottom-20 right-1/4 w-96 h-96 rounded-full bg-purple-600/8 blur-3xl animate-pulse-glow" style={{ animationDelay: '4.5s' }} />

      {/* Floating glass tiles */}
      <GlassTile style={{ top: '8%', left: '5%' }} size={55} duration={9} delay={0} rotate={15} />
      <GlassTile style={{ top: '15%', right: '8%' }} size={40} duration={7} delay={1} rotate={-20} />
      <GlassTile style={{ top: '45%', left: '3%' }} size={70} duration={11} delay={2} rotate={8} />
      <GlassTile style={{ top: '60%', right: '5%' }} size={45} duration={8} delay={0.5} rotate={25} />
      <GlassTile style={{ bottom: '15%', left: '15%' }} size={35} duration={6} delay={3} rotate={-10} />
      <GlassTile style={{ bottom: '25%', right: '15%' }} size={60} duration={10} delay={1.5} rotate={18} />
      <GlassTile style={{ top: '30%', left: '50%' }} size={30} duration={7.5} delay={2.5} rotate={-5} />
      <GlassTile style={{ top: '75%', left: '40%' }} size={50} duration={9.5} delay={4} rotate={30} />

      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
