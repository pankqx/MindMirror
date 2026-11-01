import { useEffect, useRef, useState } from "react";

type Ripple = {
  x: number;
  y: number;
  born: number;
};

export default function Ripples() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);
  const [rain, setRain] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const now = performance.now();

      ripples.current = ripples.current.filter(
        (ripple) => now - ripple.born < 2500
      );

      ripples.current.forEach((ripple) => {
        const progress = (now - ripple.born) / 2500;
        const radius = progress * 120;
        const opacity = 1 - progress;

        [1, 0.65].forEach((scale) => {
          ctx.beginPath();
          ctx.arc(
            ripple.x,
            ripple.y,
            radius * scale,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = `rgba(210, 230, 255, ${opacity * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      });

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (!rain) return;

    const interval = window.setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      ripples.current.push({
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        born: performance.now(),
      });
    }, 700);

    return () => window.clearInterval(interval);
  }, [rain]);

  const addRipple = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    ripples.current.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      born: performance.now(),
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-[#101D38] text-center text-white shadow-sm">
      <p className="pt-5 text-sm text-blue-100">
        Tap the water. Watch it settle.
      </p>

      <canvas
        ref={canvasRef}
        onPointerDown={addRipple}
        className="h-[70vh] w-full touch-none"
        aria-label="Tap or touch the pond to create ripples"
      />

      <div className="pb-5">
        <button
          onClick={() => setRain((value) => !value)}
          className="rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/25"
        >
          {rain ? "Stop gentle rain" : "Gentle rain"}
        </button>
      </div>
    </div>
  );
}