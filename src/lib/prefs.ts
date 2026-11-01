// Small per-browser preferences: theme, name, voice replies, counsellor number.
// Kept in localStorage (wrapped in try/catch so a private window still works).

import { useSyncExternalStore } from "react";

export type ThemeChoice = "system" | "light" | "dark";

export interface Prefs {
  theme: ThemeChoice;
  name: string;
  /** Speak necklace replies through the laptop speaker. */
  voiceReplies: boolean;
  counsellor: string;
  welcomed: boolean;
}

const KEY = "mindmirror.prefs";
const DEFAULTS: Prefs = { theme: "system", name: "", voiceReplies: true, counsellor: "", welcomed: false };

function read(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

let current = read();
const subs = new Set<() => void>();

export function getPrefs() {
  return current;
}

export function setPrefs(patch: Partial<Prefs>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage blocked: keep it in memory */
  }
  applyTheme();
  subs.forEach((f) => f());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => current,
  );
}

const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

export function resolvedTheme(): "light" | "dark" {
  if (current.theme === "system") return media?.matches ? "dark" : "light";
  return current.theme;
}

export function applyTheme() {
  const t = resolvedTheme();
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#111112" : "#f5f2ec");
}

media?.addEventListener("change", () => {
  applyTheme();
  subs.forEach((f) => f());
});

/** Flip between light and dark (the one-tap toggle in the top bar). */
export function toggleTheme() {
  setPrefs({ theme: resolvedTheme() === "dark" ? "light" : "dark" });
}
