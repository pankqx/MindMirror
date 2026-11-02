import { useEffect, useRef, useState } from "react";
import { buzz, chime, pop } from "./sound";

// Bubble wrap, made glossy: press a bubble and it squishes, let go (or drag across a row) and it bursts
// into droplets with a soft shock ring. Pop the whole sheet and a fresh one rolls in.

interface Bubble { x: number; y: number; r: number; press: number; popped: number; hue: number; wob: number }
interface Drop { x: number; y: number; vx: number; vy: number; life: number; hue: number; r: number }
interface Ring { x: number; y: number; r: number; life: number; hue: number }

export default function PopSheet() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const c = canvas.current!;
    const g = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let W = 0, H = 0;
    let bubbles: Bubble[] = [];
    const drops: Drop[] = [];
    const rings: Ring[] = [];
    let roll = 0; // a new sheet rolling in
    let combo = 0, comboT = 0, comboX = 0, comboY = 0;
    let popped = 0;

    const layout = () => {
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = Math.max(22, Math.min(38, W / 16));
      const dx = r * 2.15, dy = r * 1.86;
      bubbles = [];
      const cols = Math.floor((W - r) / dx), rows = Math.floor((H - r * 1.2) / dy);
      const ox = (W - (cols - 0.5) * dx) / 2 + r * 0.05, oy = (H - (rows - 1) * dy) / 2;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols - (j % 2 ? 1 : 0); i++)
          bubbles.push({ x: ox + i * dx + (j % 2 ? dx / 2 : 0), y: oy + j * dy, r, press: 0, popped: 0, hue: 200 + ((i + j) * 11) % 90, wob: Math.random() * 6 });
      roll = 1;
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(c);

    const burst = (b: Bubble) => {
      b.popped = 1;
      popped++;
      setCount((n) => n + 1);
      pop();
      buzz(8);
      rings.push({ x: b.x, y: b.y, r: b.r * 0.6, life: 1, hue: b.hue });
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2 + Math.random() * 0.4, s = 2 + Math.random() * 4;
        drops.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, life: 1, hue: b.hue + Math.random() * 40, r: 1.5 + Math.random() * 2.5 });
      }
      const now = performance.now();
      combo = now - comboT < 450 ? combo + 1 : 1;
      comboT = now; comboX = b.x; comboY = b.y - b.r;
      if (popped >= bubbles.length) {
        window.setTimeout(() => { chime(2); popped = 0; for (const x of bubbles) { x.popped = 0; x.press = 0; } roll = 1; }, 900);
      }
    };

    let down = false;
    let held: Bubble | null = null;
    const at = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      return bubbles.find((b) => !b.popped && (b.x - x) ** 2 + (b.y - y) ** 2 < b.r * b.r) ?? null;
    };
    const onDown = (e: PointerEvent) => { down = true; c.setPointerCapture(e.pointerId); held = at(e); };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const b = at(e);
      if (b && b !== held) { if (held) burst(held); held = b; }
    };
    const onUp = () => { down = false; if (held) burst(held); held = null; };
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onUp);

    let raf = 0, t = 0;
    const frame = () => {
      t += 1 / 60;
      g.clearRect(0, 0, W, H);
      roll = Math.max(0, roll - 0.025);
      for (const b of bubbles) {
        const target = b === held ? 1 : 0;
        b.press += (target - b.press) * 0.35;
        const enter = Math.max(0, Math.min(1, 1 - roll * 1.6 + (b.x / W) * 0.6 - 0.6 + 0.6));
        const s = (1 - b.press * 0.18) * (0.4 + 0.6 * easeOutBack(enter));
        const r = b.r * s * (1 + Math.sin(t * 2 + b.wob) * 0.015);
        if (b.popped) {
          // a flat, wrinkled ring where the bubble was
          g.strokeStyle = "rgba(255,255,255,0.10)";
          g.lineWidth = 1;
          g.beginPath();
          for (let k = 0; k <= 36; k++) {
            const a = (k / 36) * Math.PI * 2, w = r * (0.82 + Math.sin(k * 0.9 + b.wob) * 0.05);
            const px = b.x + Math.cos(a) * w, py = b.y + Math.sin(a) * w;
            if (k) g.lineTo(px, py); else g.moveTo(px, py);
          }
          g.stroke();
          continue;
        }
        // glossy iridescent bubble
        const grad = g.createRadialGradient(b.x - r * 0.35, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
        grad.addColorStop(0, `hsla(${b.hue + 40},100%,92%,0.55)`);
        grad.addColorStop(0.55, `hsla(${b.hue},80%,65%,0.18)`);
        grad.addColorStop(0.9, `hsla(${b.hue - 30},90%,70%,0.35)`);
        grad.addColorStop(1, `hsla(${b.hue + 60},100%,85%,0.65)`);
        g.fillStyle = grad;
        g.beginPath();
        g.ellipse(b.x, b.y + b.press * 2, r * (1 + b.press * 0.08), r * (1 - b.press * 0.1), 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "rgba(255,255,255,0.85)";
        g.beginPath();
        g.ellipse(b.x - r * 0.38, b.y - r * 0.42, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "rgba(255,255,255,0.35)";
        g.beginPath();
        g.arc(b.x + r * 0.35, b.y + r * 0.4, r * 0.07, 0, Math.PI * 2);
        g.fill();
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const k = rings[i];
        k.r += 2.4; k.life -= 0.04;
        if (k.life <= 0) { rings.splice(i, 1); continue; }
        g.strokeStyle = `hsla(${k.hue},100%,85%,${k.life * 0.7})`;
        g.lineWidth = 2 * k.life;
        g.beginPath(); g.arc(k.x, k.y, k.r, 0, Math.PI * 2); g.stroke();
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.x += d.vx; d.y += d.vy; d.vy += 0.18; d.vx *= 0.97; d.life -= 0.025;
        if (d.life <= 0) { drops.splice(i, 1); continue; }
        g.fillStyle = `hsla(${d.hue},100%,80%,${d.life})`;
        g.beginPath(); g.arc(d.x, d.y, d.r * d.life, 0, Math.PI * 2); g.fill();
      }
      const since = performance.now() - comboT;
      if (combo > 2 && since < 700) {
        const a = 1 - since / 700;
        g.font = `600 ${22 + combo}px Inter, system-ui, sans-serif`;
        g.textAlign = "center";
        g.fillStyle = `rgba(255,255,255,${a})`;
        g.fillText(`${combo} in a row`, comboX, comboY - (1 - a) * 30);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className="relative">
      <canvas ref={canvas} className="block h-[62vh] min-h-[380px] w-full touch-none" aria-label="Bubble wrap: press and drag to pop" />
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[13px] text-soft">
        {count === 0 ? "Press, hold, let go. Or drag across a row." : `${count} popped. Breathe out with each one.`}
      </p>
    </div>
  );
}

function easeOutBack(x: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
