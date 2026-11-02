// Ten line drawings, one per feature, drawn like plates in a field notebook.
// Each one is a small honest picture of what that part of the app does.

import { motion, useReducedMotion } from "framer-motion";

const S = "rgba(241,238,231,0.85)";
const F = "rgba(241,238,231,0.35)";
const G = "#a9b0ff";
const loop = { repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" className="block size-full" fill="none" stroke={S} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function CheckIns({ r }: { r: boolean }) {
  const rows = [["MOOD", 0.6], ["STRESS", 0.8], ["ENERGY", 0.4], ["SLEEP", 0.45], ["PEOPLE", 1]] as const;
  return (
    <Frame>
      {rows.map(([l, v], i) => {
        const y = 48 + i * 26;
        return (
          <g key={l}>
            <text x="30" y={y - 7} fontFamily="Geist Mono, monospace" fontSize="7" fill={F} stroke="none">{l}</text>
            <line x1="30" x2="170" y1={y} y2={y} stroke={F} />
            <motion.circle cy={y} r="4.5" fill="#232323" stroke={i === 1 ? G : S}
              initial={{ cx: 30 + v * 140 }} animate={r ? {} : { cx: [30 + v * 140, 30 + Math.max(0.1, v - 0.25) * 140] }}
              transition={{ ...loop, duration: 2.4 + i * 0.3, delay: i * 0.2 }} />
          </g>
        );
      })}
    </Frame>
  );
}

function Insights({ r }: { r: boolean }) {
  const pts = [0.62, 0.6, 0.66, 0.61, 0.63, 0.59, 0.64, 0.4, 0.34, 0.3];
  return (
    <Frame>
      <rect x="28" y="70" width="144" height="26" fill="rgba(169,176,255,0.08)" stroke="none" />
      <line x1="28" x2="172" y1="83" y2="83" stroke={F} strokeDasharray="2 3" />
      {pts.map((v, i) => {
        const x = 34 + i * 15;
        const y = 160 - v * 120;
        const off = v < 0.5;
        return (
          <motion.circle key={i} cx={x} cy={y} r={off ? 3.5 : 2.5} fill={off ? G : S} stroke="none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: r ? 0 : i * 0.12, duration: 0.4 }} />
        );
      })}
      <text x="28" y="62" fontFamily="Geist Mono, monospace" fontSize="7" fill={F} stroke="none">YOUR USUAL</text>
      <text x="124" y="150" fontFamily="Geist Mono, monospace" fontSize="7" fill={G} stroke="none">NEEDS CARE</text>
    </Frame>
  );
}

function Companion({ r }: { r: boolean }) {
  return (
    <Frame>
      <rect x="28" y="50" width="104" height="34" rx="3" />
      <line x1="38" x2="112" y1="62" y2="62" stroke={F} />
      <line x1="38" x2="96" y1="72" y2="72" stroke={F} />
      <rect x="72" y="98" width="100" height="44" rx="3" stroke={G} />
      <line x1="82" x2="160" y1="110" y2="110" stroke={F} />
      <line x1="82" x2="150" y1="120" y2="120" stroke={F} />
      <line x1="82" x2="128" y1="130" y2="130" stroke={F} />
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={40 + i * 9} cy="160" r="2.2" fill={S} stroke="none"
          animate={r ? {} : { opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />
      ))}
    </Frame>
  );
}

function Breathing({ r }: { r: boolean }) {
  return (
    <Frame>
      <circle cx="100" cy="100" r="70" stroke={F} strokeDasharray="1 4" />
      <motion.circle cx="100" cy="100" stroke={G} initial={{ r: 30 }}
        animate={r ? { r: 45 } : { r: [30, 62, 62, 30] }} transition={{ repeat: Infinity, duration: 10, times: [0, 0.4, 0.42, 1], ease: "easeInOut" }} />
      <motion.circle cx="100" cy="100" fill="rgba(169,176,255,0.12)" stroke="none" initial={{ r: 26 }}
        animate={r ? { r: 40 } : { r: [26, 56, 56, 26] }} transition={{ repeat: Infinity, duration: 10, times: [0, 0.4, 0.42, 1], ease: "easeInOut" }} />
      <text x="100" y="186" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="7" fill={F} stroke="none">IN 4 · OUT 6</text>
    </Frame>
  );
}

function Journal({ r }: { r: boolean }) {
  return (
    <Frame>
      <rect x="44" y="34" width="112" height="136" rx="2" />
      <line x1="58" x2="58" y1="34" y2="170" stroke={F} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1="66" x2="146" y1={58 + i * 15} y2={58 + i * 15} stroke="rgba(241,238,231,0.12)" />
      ))}
      {[[66, 140], [66, 128], [66, 110]].map(([a, b], i) => (
        <motion.line key={i} x1={a} y1={56 + i * 15} y2={56 + i * 15} stroke={i === 0 ? G : S}
          initial={{ x2: a }} animate={{ x2: b }} transition={r ? { duration: 0 } : { ...loop, duration: 2.6, delay: i * 0.6, repeatDelay: 1 }} />
      ))}
    </Frame>
  );
}

function Planner({ r }: { r: boolean }) {
  const filled = [2, 5, 9, 10, 16, 17, 18, 23];
  return (
    <Frame>
      {Array.from({ length: 28 }).map((_, i) => {
        const x = 30 + (i % 7) * 20.5, y = 52 + Math.floor(i / 7) * 26;
        const on = filled.includes(i);
        return (
          <motion.rect key={i} x={x} y={y} width="16" height="20" rx="1.5"
            stroke={on ? G : F} fill={on ? "rgba(169,176,255,0.15)" : "none"}
            initial={{ opacity: on ? 0 : 1 }} animate={{ opacity: 1 }} transition={{ delay: r ? 0 : 0.2 + filled.indexOf(i) * 0.15 }} />
        );
      })}
      <text x="30" y="40" fontFamily="Geist Mono, monospace" fontSize="7" fill={F} stroke="none">HOURS PLANNED ≥ HOURS NEEDED</text>
    </Frame>
  );
}

function Ladder({ r }: { r: boolean }) {
  const labels = ["LOOK AFTER YOURSELF", "A SMALL STEP TODAY", "REACH OUT", "TALK TO SOMEONE TRAINED"];
  return (
    <Frame>
      <line x1="50" x2="50" y1="30" y2="176" />
      <line x1="80" x2="80" y1="30" y2="176" />
      {labels.map((l, i) => {
        const y = 156 - i * 36;
        return (
          <g key={l}>
            <motion.line x1="50" x2="80" y1={y} y2={y} initial={{ stroke: S }}
              animate={r ? {} : { stroke: [S, G, S] }} transition={{ repeat: Infinity, duration: 4, delay: i, times: [0, 0.15, 0.3] }} />
            <text x="90" y={y + 2.5} fontFamily="Geist Mono, monospace" fontSize="6.5" fill={F} stroke="none">{`${i + 1} ${l}`}</text>
          </g>
        );
      })}
    </Frame>
  );
}

function Necklace({ r }: { r: boolean }) {
  return (
    <Frame>
      <path d="M40 30 C 44 100, 80 128, 100 132 C 120 128, 156 100, 160 30" strokeDasharray="1 3.5" />
      <circle cx="100" cy="146" r="14" />
      <circle cx="100" cy="146" r="4" fill={G} stroke="none" />
      {[0, 1, 2].map((i) => (
        <motion.path key={i} d={`M ${124 + i * 9} ${132 - i * 4} q 8 14 0 28`} stroke={G}
          animate={r ? {} : { opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.25 }} />
      ))}
      <text x="100" y="186" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="7" fill={F} stroke="none">HOLD · TALK · LET GO</text>
    </Frame>
  );
}

function Privacy({ r }: { r: boolean }) {
  return (
    <Frame>
      <rect x="36" y="48" width="128" height="88" rx="3" />
      <line x1="20" x2="180" y1="146" y2="146" />
      <ellipse cx="100" cy="76" rx="22" ry="6" stroke={G} />
      <path d="M78 76 v 30 a 22 6 0 0 0 44 0 v -30" stroke={G} />
      <motion.path d="M78 91 a 22 6 0 0 0 44 0" stroke={G} animate={r ? {} : { opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} />
      <text x="100" y="170" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="7" fill={F} stroke="none">INDEXEDDB · THIS DEVICE</text>
    </Frame>
  );
}

function Patterns({ r }: { r: boolean }) {
  const d = "M 24 100 C 40 92, 52 106, 66 98 S 92 94, 104 100 S 128 104, 138 98 S 150 118, 160 132 S 172 146, 178 150";
  return (
    <Frame>
      <rect x="24" y="86" width="154" height="26" fill="rgba(241,238,231,0.05)" stroke="none" />
      <line x1="24" x2="178" y1="99" y2="99" stroke={F} strokeDasharray="2 3" />
      <motion.path d={d} stroke={G} initial={{ pathLength: r ? 1 : 0 }} animate={{ pathLength: 1 }}
        transition={r ? { duration: 0 } : { duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }} />
      <line x1="24" x2="24" y1="40" y2="170" stroke={F} />
      <line x1="138" x2="138" y1="40" y2="170" stroke={F} strokeDasharray="1 3" />
      <text x="30" y="80" fontFamily="Geist Mono, monospace" fontSize="7" fill={F} stroke="none">YOUR NORMAL</text>
      <text x="142" y="50" fontFamily="Geist Mono, monospace" fontSize="7" fill={G} stroke="none">DRIFT</text>
    </Frame>
  );
}

const ALL = [CheckIns, Insights, Companion, Breathing, Journal, Planner, Ladder, Necklace, Privacy, Patterns];

export function Figure({ i }: { i: number }) {
  const r = !!useReducedMotion();
  const F2 = ALL[i] ?? ALL[0];
  return <F2 r={r} />;
}
