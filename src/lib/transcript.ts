// Turning the browser's speech results into one sentence.

/**
 * Chrome on Android sends each result with everything said so far ("I", "I am", "I am tired"),
 * so joining them gave "I I am I am tired". Keep a result only when it adds something new.
 */
export function joinResults(parts: string[]): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim();
  let out = "";
  for (const raw of parts) {
    const p = raw.trim();
    if (!p) continue;
    const a = norm(out), b = norm(p);
    if (!a || b.startsWith(a)) out = p; // the new one already contains everything before it
    else if (a.endsWith(b)) continue; // nothing new
    else out = `${out} ${p}`;
  }
  return out.trim();
}
