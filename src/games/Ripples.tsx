import { useEffect, useRef, useState } from "react";
import { resolvedTheme, usePrefs } from "../lib/prefs";
import { drop } from "./sound";

// Merel's ripples pond. Tap the water: rings spread and fade, lily pads bob as they
// pass, and two koi drift slowly underneath. "Gentle rain" lets the pond play itself.

type Ripple = { x: number; y: number; born: number; size: number };
type Pad = { x: number; y: number; r: number; rot: number; bob: number };

const LIFE = 2800;

export default function Ripples() {
  usePrefs();
  const night = resolvedTheme() === "dark";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);
  const [rain, setRain] = useState(false);
  const [taps, setTaps] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let W = 0, H = 0;
    let pads: Pad[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pads.length)
        pads = [
          { x: W * 0.2, y: H * 0.25, r: 26, rot: 0.4, bob: 0 },
          { x: W * 0.78, y: H * 0.35, r: 20, rot: 2.1, bob: 0 },
          { x: W * 0.62, y: H * 0.78, r: 30, rot: 4.2, bob: 0 },
          { x: W * 0.3, y: H * 0.68, r: 16, rot: 1.2, bob: 0 },
        ];
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = night
      ? { top: "#0f1a33", bottom: "#081022", ring: "200, 220, 255", pad: "#3f6b55", padEdge: "#2e5040", koi: ["#e8836b", "#f2ead8"] }
      : { top: "#bcd9e6", bottom: "#8fb9c9", ring: "255, 255, 255", pad: "#7fae84", padEdge: "#5f8f66", koi: ["#e8836b", "#fff7ea"] };

    const koi = (t: number, i: number) => {
      const s = t / 1000;
      const k = i ? 0.13 : 0.1;
      const x = W / 2 + Math.sin(s * k * 2 + i * 2) * W * 0.36;
      const y = H / 2 + Math.sin(s * k * 3 + i) * H * 0.3;
      const nx = W / 2 + Math.sin((s + 0.1) * k * 2 + i * 2) * W * 0.36;
      const ny = H / 2 + Math.sin((s + 0.1) * k * 3 + i) * H * 0.3;
      const a = Math.atan2(ny - y, nx - x);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.globalAlpha = night ? 0.55 : 0.7;
      const wag = Math.sin(s * 6 + i) * 0.35;
      // tail
      ctx.fillStyle = colors.koi[0];
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-26, -7 + wag * 6);
      ctx.lineTo(-26, 7 + wag * 6);
      ctx.closePath();
      ctx.fill();
      // body
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.koi[1];
      ctx.beginPath();
      ctx.ellipse(4, -1, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      const now = performance.now();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, colors.top);
      g.addColorStop(1, colors.bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      koi(now, 0);
      koi(now + 7000, 1);

      ripples.current = ripples.current.filter((r) => now - r.born < LIFE);

      for (const r of ripples.current) {
        const p = (now - r.born) / LIFE;
        const eased = 1 - Math.pow(1 - p, 3);
        const radius = eased * 140 * r.size;
        for (const [scale, alpha] of [[1, 0.55], [0.72, 0.4], [0.45, 0.28]] as const) {
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, radius * scale, radius * scale * 0.72, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${colors.ring}, ${(1 - p) * alpha})`;
          ctx.lineWidth = 2 * (1 - p) + 0.5;
          ctx.stroke();
        }
        // pads bob when a ring passes them
        for (const pad of pads) {
          const d = Math.hypot(pad.x - r.x, (pad.y - r.y) / 0.72);
          if (Math.abs(d - radius) < 6) pad.bob = Math.max(pad.bob, (1 - p) * 1);
        }
      }

      for (const pad of pads) {
        pad.bob *= 0.96;
        pad.rot += 0.0006;
        const wob = Math.sin(now / 180) * pad.bob * 2.5;
        ctx.save();
        ctx.translate(pad.x, pad.y + wob);
        ctx.rotate(pad.rot);
        ctx.fillStyle = colors.pad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, pad.r, 0.35, Math.PI * 2 - 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = colors.padEdge;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [night]);

  useEffect(() => {
    if (!rain) return;
    const interval = window.setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      ripples.current.push({
        x: Math.random() * canvas.clientWidth, y: Math.random() * canvas.clientHeight, born: performance.now(), size: 0.5 + Math.random() * 0.4,
      });
      if (Math.random() < 0.5) drop(0.8 + Math.random() * 0.6);
    }, 650);
    return () => window.clearInterval(interval);
  }, [rain]);

  const addRipple = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    ripples.current.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, born: performance.now(), size: 1 });
    drop(0.9 + Math.random() * 0.4);
    setTaps((t) => t + 1);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-line text-center">
      <p className="py-4 text-sm text-soft">{taps === 0 ? "Tap the water. Watch it settle." : "Slowly. Let each ring finish."}</p>
      <canvas ref={canvasRef} onPointerDown={addRipple} className="block h-[60vh] max-h-[560px] w-full touch-none"
        aria-label="Tap or touch the pond to create ripples" />
      <div className="py-4">
        <button onClick={() => setRain((v) => !v)}
          className={`rounded-full px-6 py-3 text-sm font-semibold transition-colors ${rain ? "bg-ink text-bg" : "border border-line text-ink"}`}>
          {rain ? "Stop gentle rain" : "Gentle rain"}
        </button>
      </div>
    </div>
  );
}
