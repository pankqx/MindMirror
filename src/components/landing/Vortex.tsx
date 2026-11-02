// The hero's mirror: words circling inward in rings, like looking down a well of your own thoughts.
// Plain 2D canvas, mono glyphs set along circles. It leans towards the pointer, pulses on click,
// and zooms in as the page "dives" (dive: 0..1). Static for reduced motion, paused when off screen.

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

export function Vortex({ text, dive, className = "" }: { text: string; dive?: MotionValue<number>; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = [...text];
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = 0, dead = false;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const pulses: number[] = []; // start times of click pulses

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const draw = (t: number) => {
      const z = dive?.get() ?? 0;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const size = Math.max(11, Math.min(14, w / 70));
      ctx.font = `400 ${size}px "Geist Mono Variable", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cw = size * 0.62; // mono advance
      const cx = w / 2 + pointer.x * w * 0.06;
      const cy = h / 2 + pointer.y * h * 0.06;
      const far = Math.hypot(w, h) * 0.62;
      const zoom = 1 + z * 2.2;
      const sec = t / 1000;

      // rings grow geometrically from the centre, so the middle feels far away
      let r = 18 * zoom;
      for (let i = 0; r < far; i++) {
        const depth = Math.min(1, r / (far * 0.7));
        const dir = i % 2 ? 1 : -1;
        const spin = reduce ? 0 : sec * (0.05 + 0.18 / (i + 1.5)) * dir;
        const step = cw / r; // radians per glyph
        const n = Math.floor((Math.PI * 2) / step);
        // a click sends a bright wave outward through the rings
        let glow = 0;
        for (const p of pulses) {
          const front = (t - p) / 1000 * 900;
          glow = Math.max(glow, Math.max(0, 1 - Math.abs(front - r) / 90));
        }
        const alpha = Math.min(1, 0.12 + depth * 0.75 + glow * 0.6) * (1 - Math.max(0, (r - far * 0.85) / (far * 0.15)));
        ctx.fillStyle = glow > 0.05 ? `rgba(169,176,255,${alpha})` : `rgba(241,238,231,${alpha})`;
        const offset = (i * 7) % chars.length;
        for (let k = 0; k < n; k++) {
          const a = k * step + spin;
          const ch = chars[(k + offset) % chars.length];
          if (ch === " ") continue;
          ctx.save();
          ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.rotate(a + Math.PI / 2);
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        }
        r *= 1.16 + depth * 0.06;
        r += size * 1.4;
      }
      while (pulses.length && t - pulses[0] > 2500) pulses.shift();
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || t - last < 33) return; // ~30 fps is plenty for slow rings
      last = t;
      draw(t);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width - 0.5;
      pointer.ty = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => { pointer.tx = 0; pointer.ty = 0; };
    const onClick = () => pulses.push(performance.now());

    resize();
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(0); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    // wait for the mono font so the first frame isn't in a fallback face
    void document.fonts?.load(`400 13px "Geist Mono Variable"`).finally(() => {
      if (dead) return;
      if (reduce) draw(0);
      else raf = requestAnimationFrame(loop);
    });
    const unsub = reduce ? dive?.on("change", () => draw(0)) : undefined;

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      unsub?.();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [text, dive]);

  return <canvas ref={ref} className={`block size-full cursor-pointer ${className}`} aria-hidden="true" />;
}
