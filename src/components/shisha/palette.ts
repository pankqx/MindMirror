// The thread box. Kutch mirror-work uses a handful of strong threads on dark cloth;
// MindMirror gives each one a single meaning and never uses colour for decoration alone.

export const THREAD = {
  rani: "#e46a9a", // the one accent: you, now
  kesar: "#e58a2e", // warmth, energy
  haldi: "#e2b23a", // watch
  mehendi: "#8fae5c", // steady
  sindoor: "#e0613f", // needs care
  neela: "#7f93e0", // calm, sleep
  khadi: "#efe7d6", // plain thread
} as const;

export type Thread = keyof typeof THREAD;

/** The signal levels from lib/signals, as threads. */
export const LEVEL_THREAD = {
  steady: THREAD.mehendi,
  watch: THREAD.haldi,
  "needs care": THREAD.sindoor,
  learning: THREAD.khadi,
} as const;

export const NEEL = "#171b38";
export const NEEL_DEEP = "#0d1026";
export const KHADI = "#f1ebdf";
