// The companion's room: small mirrors stitched across indigo cloth, joined by running stitch.
// Every mirror turns its glint towards your pointer. While your companion thinks or speaks,
// light runs along the threads into their head; poke them and a flash ripples through the cloth.

import { forwardRef, useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import { drawMirror } from "../shisha/draw";
import { THREAD } from "../shisha/palette";

export interface MirrorFieldHandle { flash: (x: number, y: number) => void }

interface Props {
  /** the element whose head the light runs to (head is ~30% down its box) */
  head?: RefObject<HTMLElement | null>;
  /** 0 = resting, 1 = thinking or speaking */
  active?: boolean;
  accent?: string;
  className?: string;
}

const THREADS = [THREAD.rani, THREAD.kesar, THREAD.haldi, THREAD.mehendi, THREAD.neela, THREAD.khadi, THREAD.khadi];

export const MirrorField = forwardRef<MirrorFieldHandle, Props>(function MirrorField({ head, active = false, accent = THREAD.rani, className = "" }, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const live = useRef({ active, accent });
  useEffect(() => { live.current = { active, accent }; }, [active, accent]);
  const flashes = useRef<{ x: number; y: number; t: number }[]>([]);
  useImperativeHandle(ref, () => ({
    flash: (x, y) => {
      const r = cv.current?.getBoundingClientRect();
      if (r) flashes.current.push({ x: x - r.left, y: y - r.top, t: performance.now() });
    },
  }), []);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, last = 0, visible = true;
    type Node = { x: number; y: number; r: number; th: string; ph: number };
    let nodes: Node[] = [];
    let links: [number, number][] = [];
    const pulses: { from: number; t: number; speed: number }[] = [];
    const p = { x: -9999, y: -9999 };

    // a small seeded random, so the cloth looks the same on every visit
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    const build = () => {
      const r = c.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      c.width = Math.round(W * d); c.height = Math.round(H * d);
      g.setTransform(d, 0, 0, d, 0, 0);
      seed = 7;
      const n = Math.max(24, Math.round((W * H) / 24000));
      nodes = [];
      for (let i = 0; i < n; i++) {
        let x = rnd() * W, y = rnd() * H;
        // lean towards the edges, so the middle stays calm for the words and the companion
        if (rnd() < 0.6) {
          if (rnd() < 0.5) x = rnd() < 0.5 ? rnd() * W * 0.14 : W - rnd() * W * 0.14;
          else y = rnd() < 0.5 ? rnd() * H * 0.14 : H - rnd() * H * 0.14;
        }
        // keep the words readable: no mirrors behind the text column on wide screens
        if (W >= 1024 && x > W * 0.03 && x < W * 0.44 && y > H * 0.1 && y < H * 0.94) continue;
        nodes.push({ x, y, r: 4 + rnd() * 6, th: THREADS[Math.floor(rnd() * THREADS.length)], ph: rnd() * 6.28 });
      }
      links = [];
      nodes.forEach((a, i) => {
        nodes.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y)] as [number, number])
          .filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 2)
          .forEach(([j]) => { if (i < j) links.push([i, j]); });
      });
    };

    const headPt = (): [number, number] => {
      const h = head?.current, cr = c.getBoundingClientRect();
      if (!h) return [W * 0.7, H * 0.35];
      const r = h.getBoundingClientRect();
      return [r.left - cr.left + r.width / 2, r.top - cr.top + r.height * 0.3];
    };

    const draw = (now: number) => {
      g.clearRect(0, 0, W, H);
      const { active: on, accent: ac } = live.current;
      // threads
      g.setLineDash([6, 5]);
      g.lineWidth = 1;
      g.strokeStyle = "rgba(239,231,214,0.10)";
      g.beginPath();
      for (const [i, j] of links) { g.moveTo(nodes[i].x, nodes[i].y); g.lineTo(nodes[j].x, nodes[j].y); }
      g.stroke();
      g.setLineDash([]);

      // light running to the head
      const [hx, hy] = headPt();
      if (on && !reduce && Math.random() < 0.12 && pulses.length < 14) pulses.push({ from: Math.floor(Math.random() * nodes.length), t: now, speed: 0.5 + Math.random() * 0.5 });
      for (let k = pulses.length - 1; k >= 0; k--) {
        const pu = pulses[k];
        const a = nodes[pu.from];
        const q = Math.min(1, ((now - pu.t) / 1000) * pu.speed);
        if (q >= 1) { pulses.splice(k, 1); continue; }
        const x = a.x + (hx - a.x) * q, y = a.y + (hy - a.y) * q;
        const tx = a.x + (hx - a.x) * Math.max(0, q - 0.12), ty = a.y + (hy - a.y) * Math.max(0, q - 0.12);
        g.strokeStyle = ac;
        g.globalAlpha = 0.85 * (1 - q * 0.6);
        g.lineWidth = 1.6;
        g.setLineDash([6, 5]);
        g.beginPath(); g.moveTo(tx, ty); g.lineTo(x, y); g.stroke();
        g.setLineDash([]);
        g.globalAlpha = 1;
      }

      // mirrors
      const sec = now / 1000;
      for (const n of nodes) {
        const ang = Math.atan2(p.y - n.y, p.x - n.x);
        const near = Math.max(0, 1 - Math.hypot(p.x - n.x, p.y - n.y) / 180);
        let shine = near * 0.6;
        for (const f of flashes.current) {
          const front = ((now - f.t) / 1000) * 700;
          const d = Math.hypot(n.x - f.x, n.y - f.y);
          shine = Math.max(shine, Math.max(0, 1 - Math.abs(front - d) / 70) * Math.max(0, 1 - (now - f.t) / 1800));
        }
        const tw = reduce ? 0 : (Math.sin(sec * 0.8 + n.ph) + 1) * 0.08;
        drawMirror(g, n.th, n.x, n.y, n.r, p.x < -999 ? -2.2 + Math.sin(sec * 0.3 + n.ph) * 0.4 : ang, 0.5 + near * 0.4 + tw, shine);
      }
      flashes.current = flashes.current.filter((f) => now - f.t < 1800);
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
    };

    build();
    const ro = new ResizeObserver(() => { build(); if (reduce) draw(performance.now()); });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(c);
    window.addEventListener("pointermove", onMove, { passive: true });
    if (reduce) draw(performance.now());
    else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", onMove); };
  }, [head]);

  return <canvas ref={cv} className={`block size-full ${className}`} aria-hidden="true" />;
});
