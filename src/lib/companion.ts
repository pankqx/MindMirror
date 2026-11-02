// Which companion you chose (Reenu or Roman), shared by the landing, Talk and Face to face.
// Stored under the same key Face to face already uses, so the choice follows you everywhere.

import { useSyncExternalStore } from "react";
import type { CharacterId } from "../character/characters";

const KEY = "mm-character";
const subs = new Set<() => void>();

function read(): CharacterId | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "reenu" || v === "roman" ? v : null;
  } catch {
    return null;
  }
}

let current = read();

export function setCompanion(id: CharacterId) {
  current = id;
  try { localStorage.setItem(KEY, id); } catch { /* private mode: remember for this visit */ }
  subs.forEach((f) => f());
}

/** The chosen companion, or null before anyone has been chosen. */
export function useCompanion(): CharacterId | null {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => current);
}
