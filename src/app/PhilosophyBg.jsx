'use client';
import { useEffect, useRef } from 'react';

export default function PhilosophyBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;

    const resize = () => {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 60;
    const palette = [
      'rgba(201,169,110,', // gold
      'rgba(19,50,33,',    // deep green
      'rgba(30,77,53,',    // accent green
      'rgba(139,153,145,', // muted
    ];
    const shapes = ['leaf', 'dot', 'diamond', 'line'];
    const rand = (a, b) => Math.random() * (b - a) + a;

    const particles = Array.from({ length: COUNT }, () => ({
      x: rand(0, 1), y: rand(0, 1),
      size: rand(2, 7),
      opacity: rand(0.05, 0.18),
      speed: rand(0.00015, 0.0004),
      drift: rand(-0.0001, 0.0001),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      color: palette[Math.floor(Math.random() * palette.length)],
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.005, 0.005),
    }));

    const drawLeaf = (x, y, size, rot) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size*0.6, -size*0.4, size*0.6, size*0.4, 0, size);
      ctx.bezierCurveTo(-size*0.6, size*0.4, -size*0.6, -size*0.4, 0, -size);
      ctx.fill(); ctx.restore();
    };
    const drawDiamond = (x, y, size) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size); ctx.lineTo(x + size*0.6, y);
      ctx.lineTo(x, y + size); ctx.lineTo(x - size*0.6, y);
      ctx.closePath(); ctx.fill();
    };
    const drawLine = (x, y, size, rot) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, -size*1.5); ctx.lineTo(0, size*1.5);
      ctx.lineWidth = 0.8; ctx.stroke(); ctx.restore();
    };

    let raf;
    const animate = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.y -= p.speed; p.x += p.drift; p.rotation += p.rotSpeed;
        if (p.y < -0.05) p.y = 1.05;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        const px = p.x * W, py = p.y * H;
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = ctx.strokeStyle = p.color + p.opacity + ')';
        if (p.shape === 'leaf') drawLeaf(px, py, p.size, p.rotation);
        else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(px, py, p.size*0.5, 0, Math.PI*2); ctx.fill(); }
        else if (p.shape === 'diamond') drawDiamond(px, py, p.size*0.8);
        else drawLine(px, py, p.size, p.rotation);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0
    }} />
  );
}