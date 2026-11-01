import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { resolvedTheme, usePrefs } from "../lib/prefs";

// Kishore's mind-weather illustration, now a living sky: the sun breathes, clouds drift,
// rain falls drop by drop, and at night the sun becomes a moon with stars.

type WeatherProps = {
  kind: "clear" | "clouds" | "rain" | "storm";
  title: string;
  message: string;
  label?: string;
};

const SKY = {
  light: {
    clear: ["#fde8c6", "#f9f1e4"],
    clouds: ["#e3e9ef", "#f6f1e8"],
    rain: ["#d5dde8", "#eef0f2"],
    storm: ["#c3c6d6", "#e6e4ea"],
  },
  dark: {
    clear: ["#1e2346", "#151826"],
    clouds: ["#1f2436", "#161925"],
    rain: ["#1a2030", "#141722"],
    storm: ["#181a26", "#101118"],
  },
};

export default function Weather({ kind, title, message, label = "Your mind weather" }: WeatherProps) {
  usePrefs();
  const night = resolvedTheme() === "dark";
  const reduced = useReducedMotion();
  const [top, bottom] = SKY[night ? "dark" : "light"][kind];
  const drops = kind === "storm" ? 14 : kind === "rain" ? 9 : 0;
  const cloudy = kind !== "clear";
  const loop = (d: number, delay = 0) => ({ duration: d, repeat: Infinity, ease: "easeInOut" as const, delay });

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-line/70 shadow-soft">
      <motion.div
        className="absolute inset-0"
        animate={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)` }}
        transition={{ duration: 1.2 }}
      />

      <svg viewBox="0 0 320 190" className="relative block h-auto w-full" role="img" aria-label={`${title} illustration`}>
        {/* stars at night */}
        {night &&
          [
            [40, 30], [80, 60], [250, 28], [290, 70], [200, 50], [140, 22], [30, 95], [300, 120],
          ].map(([x, y], i) => (
            <motion.circle key={i} cx={x} cy={y} r={i % 3 ? 1.2 : 1.8} fill="#fff"
              animate={reduced ? {} : { opacity: [0.2, 0.9, 0.2] }} transition={loop(2.5 + i * 0.4, i * 0.3)} />
          ))}

        {/* sun or moon */}
        <AnimatePresence>
          {(kind === "clear" || kind === "clouds") && (
            <motion.g key="sun" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              {!night && (
                <motion.g style={{ originX: "160px", originY: "82px" }} animate={reduced ? {} : { rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}>
                  {Array.from({ length: 12 }, (_, i) => {
                    const a = (i * Math.PI) / 6;
                    return <line key={i} x1={160 + Math.cos(a) * 48} y1={82 + Math.sin(a) * 48} x2={160 + Math.cos(a) * 58}
                      y2={82 + Math.sin(a) * 58} stroke="#f5c66b" strokeWidth="3" strokeLinecap="round" opacity="0.7" />;
                  })}
                </motion.g>
              )}
              <motion.circle cx="160" cy="82" r="36" fill={night ? "#f3ead2" : "#f5c66b"}
                animate={reduced ? {} : { scale: [1, 1.05, 1] }} style={{ originX: "160px", originY: "82px" }} transition={loop(5)} />
              {night && <circle cx="174" cy="72" r="30" fill={top} opacity="0.9" />}
            </motion.g>
          )}
        </AnimatePresence>

        {/* clouds */}
        <AnimatePresence>
          {cloudy && (
            <motion.g key="clouds" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 1 }}>
              <motion.path animate={reduced ? {} : { x: [-6, 8, -6] }} transition={loop(9)}
                d="M70 120c-16 0-22-20-6-28 2-24 36-30 50-10 18-12 44 0 42 20 18 6 12 26-4 26H70z"
                fill={kind === "storm" ? (night ? "#3a3e52" : "#7d8296") : night ? "#3b4158" : "#c9d3da"} />
              <motion.path animate={reduced ? {} : { x: [8, -8, 8] }} transition={loop(11)}
                d="M150 110c-10-18 8-34 24-28 8-24 46-20 52 4 22 2 26 30 4 34h-76c-6 0-6-6-4-10z"
                fill={kind === "storm" ? (night ? "#2e3142" : "#8f94a6") : night ? "#454c66" : "#dfe6ea"} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* rain, drop by drop */}
        {Array.from({ length: drops }, (_, i) => {
          const x = 80 + ((i * 37) % 170);
          return (
            <line key={`${kind}-${i}`} x1={x} x2={x - 5} y1={132} y2={148} strokeWidth="2.5" strokeLinecap="round"
              stroke={kind === "storm" ? "#7f8cff" : "#7fa9c9"} className={reduced ? "" : "mm-rain"}
              style={{ animationDelay: `${((i * 0.23) % 1.2).toFixed(2)}s` }} />
          );
        })}

        {/* storm flash */}
        {kind === "storm" && !reduced && (
          <motion.path d="M178 118l-12 22h10l-8 20 20-28h-10l8-14z" fill="#f5c66b"
            animate={{ opacity: [0, 0, 1, 0, 0.7, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.7, 0.72, 0.76, 0.78, 0.84] }} />
        )}

        {/* gentle hills */}
        <path d="M0 170c50-18 100-18 160-6s110 10 160-6v32H0z" fill="var(--sage)" opacity="0.35" />
        <path d="M0 180c60-12 120-8 180 0s100 6 140-4v14H0z" fill="var(--sage)" opacity="0.5" />
      </svg>

      <div className="relative px-6 pb-6 pt-1">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-faint">{label}</p>
        <AnimatePresence mode="wait">
          <motion.div key={title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ink">{title}</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-soft">{message}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
