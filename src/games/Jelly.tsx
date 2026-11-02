import { useEffect, useRef } from "react";
import { buzz, drop } from "./sound";

// A soft jelly friend. Poke it, squash it, fling it: it wobbles back, every time.
// A ring of points held by springs and inner pressure (a tiny soft-body simulation).

const N = 36;

export default function Jelly() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current!;
    const g = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let W = 0, H = 0, R = 90;
    const px = new Float32Array(N), py = new Float32Array(N), ox = new Float32Array(N), oy = new Float32Array(N);
    let rest = 0, area0 = 0;

    const reset = () => {
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.24;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        px[i] = ox[i] = W / 2 + Math.cos(a) * R;
        py[i] = oy[i] = H * 0.55 + Math.sin(a) * R;
      }
      rest = 2 * R * Math.sin(Math.PI / N);
      area0 = Math.PI * R * R;
    };
    reset();
    const ro = new ResizeObserver(reset);
    ro.observe(c);

    let grab = -1, mx = 0, my = 0, pmx = 0, pmy = 0, hue = 265, blink = 0, nextBlink = 2, squish = 0;
    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const onDown = (e: PointerEvent) => {
      c.setPointerCapture(e.pointerId);
      [mx, my] = pos(e); pmx = mx; pmy = my;
      let best = 1e9;
      for (let i = 0; i < N; i++) { const d = (px[i] - mx) ** 2 + (py[i] - my) ** 2; if (d < best) { best = d; grab = i; } }
      // tapping inside pokes it: push the nearest side in
      const cx = px.reduce((a, b) => a + b) / N, cy = py.reduce((a, b) => a + b) / N;
      if ((mx - cx) ** 2 + (my - cy) ** 2 < R * R) {
        for (let i = 0; i < N; i++) {
          const d = Math.hypot(px[i] - mx, py[i] - my);
          const f = Math.max(0, 1 - d / (R * 1.3)) * 22;
          px[i] += ((px[i] - mx) / (d || 1)) * -f * 0.4 + (cx - px[i]) * 0.02 * f;
          py[i] += ((py[i] - my) / (d || 1)) * -f * 0.4 + (cy - py[i]) * 0.02 * f;
        }
        squish = 1;
        drop(0.8 + Math.random() * 0.4);
        buzz(12);
        hue = (hue + 25) % 360;
      }
    };
    const onMove = (e: PointerEvent) => { pmx = mx; pmy = my; [mx, my] = pos(e); };
    const onUp = () => {
      if (grab >= 0) { drop(1.3); buzz(6); }
      grab = -1;
    };
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onUp);

    let raf = 0, t = 0;
    const step = () => {
      t += 1 / 60;
      // verlet
      for (let i = 0; i < N; i++) {
        const vx = (px[i] - ox[i]) * 0.985, vy = (py[i] - oy[i]) * 0.985;
        ox[i] = px[i]; oy[i] = py[i];
        px[i] += vx; py[i] += vy + 0.35;
      }
      if (grab >= 0) {
        px[grab] += (mx - px[grab]) * 0.5; py[grab] += (my - py[grab]) * 0.5;
      }
      for (let it = 0; it < 6; it++) {
        // springs between neighbours
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N;
          const dx = px[j] - px[i], dy = py[j] - py[i];
          const d = Math.hypot(dx, dy) || 1, k = ((d - rest) / d) * 0.5;
          px[i] += dx * k; py[i] += dy * k; px[j] -= dx * k; py[j] -= dy * k;
        }
        // pressure keeps the area
        let area = 0;
        for (let i = 0; i < N; i++) { const j = (i + 1) % N; area += px[i] * py[j] - px[j] * py[i]; }
        area = Math.abs(area) / 2;
        const p = ((area0 - area) / area0) * 0.9;
        for (let i = 0; i < N; i++) {
          const a = (i - 1 + N) % N, b = (i + 1) % N;
          const nx = py[b] - py[a], ny = -(px[b] - px[a]);
          px[i] += nx * p * 0.5; py[i] += ny * p * 0.5;
        }
        // walls and floor
        for (let i = 0; i < N; i++) {
          if (py[i] > H - 10) { py[i] = H - 10; ox[i] = px[i] - (px[i] - ox[i]) * 0.8; }
          if (px[i] < 10) px[i] = 10;
          if (px[i] > W - 10) px[i] = W - 10;
          if (py[i] < 10) py[i] = 10;
        }
      }

      g.clearRect(0, 0, W, H);
      const cx = px.reduce((a, b) => a + b) / N, cy = py.reduce((a, b) => a + b) / N;
      // shadow
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.beginPath(); g.ellipse(cx, H - 6, R * 0.9, 8, 0, 0, Math.PI * 2); g.fill();
      // body: smooth curve through the points
      const body = new Path2D();
      for (let i = 0; i <= N; i++) {
        const a = i % N, b = (i + 1) % N;
        const mxp = (px[a] + px[b]) / 2, myp = (py[a] + py[b]) / 2;
        if (i === 0) body.moveTo(mxp, myp); else body.quadraticCurveTo(px[a], py[a], mxp, myp);
      }
      const grad = g.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.1, cx, cy, R * 1.2);
      grad.addColorStop(0, `hsla(${hue + 40},100%,88%,1)`);
      grad.addColorStop(0.5, `hsla(${hue},85%,66%,0.95)`);
      grad.addColorStop(1, `hsla(${hue - 40},80%,45%,0.95)`);
      g.save();
      g.shadowColor = `hsla(${hue},100%,70%,0.55)`;
      g.shadowBlur = 50;
      g.fillStyle = grad;
      g.fill(body);
      g.restore();
      // gloss
      g.save();
      g.clip(body);
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.beginPath(); g.ellipse(cx - R * 0.35, cy - R * 0.5, R * 0.4, R * 0.18, -0.5, 0, Math.PI * 2); g.fill();
      g.restore();
      // a calm little face
      nextBlink -= 1 / 60;
      if (nextBlink < 0) { blink = 1; nextBlink = 2 + Math.random() * 3; }
      blink = Math.max(0, blink - 0.12);
      squish = Math.max(0, squish - 0.04);
      const lookX = Math.max(-1, Math.min(1, (mx - cx) / W)) * 6, lookY = Math.max(-1, Math.min(1, (my - cy) / H)) * 4;
      const eh = Math.max(0.08, 1 - Math.sin(blink * Math.PI)) * (1 - squish * 0.85);
      g.fillStyle = "rgba(20,10,40,0.85)";
      for (const s of [-1, 1]) {
        g.beginPath(); g.ellipse(cx + s * R * 0.28 + lookX, cy - R * 0.08 + lookY, R * 0.07, R * 0.1 * eh, 0, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = "rgba(20,10,40,0.7)";
      g.lineWidth = 3; g.lineCap = "round";
      g.beginPath();
      g.arc(cx + lookX, cy + R * 0.12 + lookY, R * (0.1 + squish * 0.05), 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
      g.fillStyle = `hsla(${hue + 330},100%,75%,0.4)`;
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * R * 0.45 + lookX, cy + R * 0.1 + lookY, R * 0.09, R * 0.05, 0, 0, Math.PI * 2); g.fill(); }
      void t; void pmx; void pmy;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className="relative">
      <canvas ref={canvas} className="block h-[62vh] min-h-[380px] w-full touch-none" aria-label="Jelly: poke it, squash it, fling it" />
      <p className="pointer-events-none absolute left-0 right-0 top-2 text-center text-[13px] text-soft">Poke it. Grab an edge and fling it. It always comes back.</p>
    </div>
  );
}
