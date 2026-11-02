// A calm field of dots behind the dark rooms. The pointer bends it a little; a click drops a
// ripple into it, like a thought into still water. Static for reduced motion, paused off screen.

import { useEffect, useRef, useState } from "react";

export function DotField({ label, className = "" }: { label?: string; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const [fine] = useState(() => typeof window !== "undefined" && matchMedia("(pointer: fine)").matches);

  useEffect(() => {
    const canvas = ref.current, box = wrap.current;
    if (!canvas || !box) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = 0;
    const gap = 22;
    const p = { x: -9999, y: -9999 };
    const ripples: { x: number; y: number; t: number }[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const sec = t / 1000;
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          let dx = 0, dy = 0, lift = 0;
          // the pointer gently pushes dots away
          const px = x - p.x, py = y - p.y;
          const pd = Math.hypot(px, py);
          if (pd < 140) {
            const f = (1 - pd / 140) ** 2;
            dx += (px / (pd || 1)) * f * 10;
            dy += (py / (pd || 1)) * f * 10;
            lift += f * 0.5;
          }
          for (const r of ripples) {
            const age = (t - r.t) / 1000;
            const rx = x - r.x, ry = y - r.y;
            const d = Math.hypot(rx, ry);
            const band = 1 - Math.abs(d - age * 420) / 60;
            if (band > 0) {
              const fade = Math.max(0, 1 - age / 2.2);
              const f = band * fade;
              dx += (rx / (d || 1)) * f * 9;
              dy += (ry / (d || 1)) * f * 9;
              lift += f;
            }
          }
          // a slow breath across the whole field
          const breath = reduce ? 0 : (Math.sin(sec * 0.6 + x * 0.004 + y * 0.003) + 1) * 0.06;
          const a = Math.min(1, 0.14 + breath + lift * 0.7);
          ctx.fillStyle = lift > 0.25 ? `rgba(169,176,255,${a})` : `rgba(241,238,231,${a})`;
          const s = 1.4 + lift * 1.6;
          ctx.fillRect(x + dx - s / 2, y + dy - s / 2, s, s);
        }
      }
      while (ripples.length && t - ripples[0].t > 2400) ripples.shift();
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || t - last < 33) return;
      last = t;
      draw(t);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      p.x = e.clientX - r.left; p.y = e.clientY - r.top;
      if (tag.current) tag.current.style.transform = `translate(${e.clientX - box.getBoundingClientRect().left + 18}px, ${e.clientY - box.getBoundingClientRect().top + 18}px)`;
    };
    const onLeave = () => { p.x = -9999; p.y = -9999; };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      const r = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
    };

    resize();
    if (reduce) draw(0);
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(0); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    // listen on the whole room, so content above the canvas still lets ripples through
    const room = box.parentElement ?? box;
    if (!reduce) {
      room.addEventListener("pointermove", onMove);
      room.addEventListener("pointerleave", onLeave);
      room.addEventListener("pointerdown", onDown);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      room.removeEventListener("pointermove", onMove);
      room.removeEventListener("pointerleave", onLeave);
      room.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div ref={wrap} className={`pointer-events-none absolute inset-0 -z-10 ${className}`} aria-hidden="true">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <canvas ref={ref} className="block size-full" />
      </div>
      {label && fine && (
        <span ref={tag} className="t-caption-sm absolute left-0 top-0 hidden text-white/50 lg:block" style={{ transform: "translate(-200px,-200px)" }}>{label}</span>
      )}
    </div>
  );
}
