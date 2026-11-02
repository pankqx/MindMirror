// The hero's mirror-work: rings of stitched mirrors around one large mirror, with words running
// between them like thread. Every mirror turns its glint towards your pointer; a click sends a flash
// through the cloth. As the page dives (dive: 0..1) the centre mirror opens until you are through it.

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { drawMirror } from "../shisha/draw";
import { THREAD } from "../shisha/palette";

const RING_THREADS = [THREAD.rani, THREAD.kesar, THREAD.haldi, THREAD.mehendi, THREAD.neela];

export function Mandala({ text, dive, className = "" }: { text: string; dive?: MotionValue<number>; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = [...text];
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, visible = true, dead = false;
    const p = { x: -9999, y: -9999, tx: 0, ty: 0, sx: 0, sy: 0 };
    const flashes: number[] = [];

    const resize = () => {
      const r = c.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    };

    const bigMirror = (x: number, y: number, R: number, ang: number, through: number) => {
      // stitched ring
      g.strokeStyle = THREAD.rani;
      g.lineCap = "round";
      g.lineWidth = Math.max(1.5, R * 0.035);
      const ticks = 64;
      for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * Math.PI * 2;
        g.beginPath();
        g.moveTo(x + Math.cos(a) * R * 1.01, y + Math.sin(a) * R * 1.01);
        g.lineTo(x + Math.cos(a) * R * 1.16, y + Math.sin(a) * R * 1.16);
        g.stroke();
      }
      g.beginPath(); g.arc(x, y, R * 1.02, 0, Math.PI * 2); g.stroke();
      // glass
      const grad = g.createLinearGradient(x - R, y - R, x + R, y + R);
      grad.addColorStop(0, "#fbfcfd"); grad.addColorStop(0.42, "#cdd3da"); grad.addColorStop(0.58, "#8e97a4"); grad.addColorStop(1, "#e3e7ec");
      g.fillStyle = grad;
      g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
      // through the mirror: its face turns to indigo night
      if (through > 0) {
        g.fillStyle = `rgba(23,27,56,${Math.min(1, through)})`;
        g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = `rgba(255,255,255,${0.9 * (1 - through)})`;
      g.lineWidth = Math.max(2, R * 0.08);
      g.beginPath(); g.arc(x, y, R * 0.64, ang - 0.55, ang + 0.35); g.stroke();
    };

    const draw = (t: number) => {
      const z = dive?.get() ?? 0;
      p.sx += (p.tx - p.sx) * 0.06; p.sy += (p.ty - p.sy) * 0.06;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const cx = W / 2 + p.sx * W * 0.04, cy = H / 2 + p.sy * H * 0.04;
      const base = Math.min(W, H);
      const zoom = 1 + z * z * 7;
      const R0 = base * 0.085 * zoom;
      const sec = reduce ? 0 : t / 1000;
      const far = Math.hypot(W, H);
      const size = Math.max(10, Math.min(13, W / 64));
      g.font = `400 ${size}px "Geist Mono Variable", ui-monospace, monospace`;
      g.textAlign = "center"; g.textBaseline = "middle";

      let r = R0 * 1.75;
      for (let k = 0; r < far; k++) {
        const dir = k % 2 ? 1 : -1;
        const spin = sec * (0.06 + 0.12 / (k + 1)) * dir;
        const fade = Math.min(1, Math.max(0, 1 - (r - far * 0.55) / (far * 0.45)));
        let glow = 0;
        for (const f of flashes) glow = Math.max(glow, Math.max(0, 1 - Math.abs((t - f) / 1000 * 900 - r) / 110));
        if (k % 2 === 0) {
          // a ring of mirrors
          const m = Math.max(3.5, r * 0.052);
          const n = Math.max(6, Math.floor((Math.PI * 2 * r) / (m * (k === 0 ? 3.4 : 4.6))));
          const th = RING_THREADS[(k / 2) % RING_THREADS.length];
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + spin;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            if (x < -m * 3 || x > W + m * 3 || y < -m * 3 || y > H + m * 3) continue;
            const ang = p.x < -999 ? -2.2 + Math.sin(sec * 0.4 + i) * 0.3 : Math.atan2(p.y - y, p.x - x);
            const near = Math.max(0, 1 - Math.hypot(p.x - x, p.y - y) / 160);
            drawMirror(g, th, x, y, m, ang, (0.45 + 0.4 * fade) * (1 - z * 0.3), Math.max(near * 0.5, glow));
          }
          r += m * 5;
        } else {
          // a ring of words, with a running stitch on either side
          g.setLineDash([7, 6]);
          g.strokeStyle = `rgba(239,231,214,${0.16 * fade})`;
          g.lineWidth = 1;
          g.beginPath(); g.arc(cx, cy, r - size, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.arc(cx, cy, r + size, 0, Math.PI * 2); g.stroke();
          g.setLineDash([]);
          const cw = size * 0.62;
          const step = cw / r;
          const n = Math.floor((Math.PI * 2) / step);
          g.fillStyle = glow > 0.05 ? `rgba(228,106,154,${0.9 * fade})` : `rgba(239,231,214,${(0.42 + 0.3 * (k === 1 ? 1 : 0)) * fade})`;
          const off = (k * 11) % chars.length;
          for (let i = 0; i < n; i++) {
            const ch = chars[(i + off) % chars.length];
            if (ch === " ") continue;
            const a = i * step + spin;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
            g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.fillText(ch, 0, 0); g.restore();
          }
          r += size * 4;
        }
        r *= 1.04;
      }
      const ang = p.x < -999 ? -2.2 : Math.atan2(p.y - cy, p.x - cx);
      bigMirror(cx, cy, R0, ang, Math.max(0, (z - 0.55) / 0.35));
      while (flashes.length && t - flashes[0] > 2500) flashes.shift();
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || t - last < 33) return;
      last = t;
      draw(t);
    };
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      p.x = e.clientX - r.left; p.y = e.clientY - r.top;
      p.tx = p.x / r.width - 0.5; p.ty = p.y / r.height - 0.5;
    };
    const onLeave = () => { p.x = -9999; p.y = -9999; p.tx = 0; p.ty = 0; };
    const onClick = () => flashes.push(performance.now());

    resize();
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(0); });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(c);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerleave", onLeave);
    c.addEventListener("click", onClick);
    void document.fonts?.load(`400 13px "Geist Mono Variable"`).finally(() => {
      if (dead) return;
      if (reduce) draw(0);
      else raf = requestAnimationFrame(loop);
    });
    const unsub = reduce ? dive?.on("change", () => draw(0)) : undefined;
    return () => {
      dead = true;
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); unsub?.();
      c.removeEventListener("pointermove", onMove); c.removeEventListener("pointerleave", onLeave); c.removeEventListener("click", onClick);
    };
  }, [text, dive]);

  return <canvas ref={ref} className={`block size-full cursor-pointer ${className}`} aria-hidden="true" />;
}
