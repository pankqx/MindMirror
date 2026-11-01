// Hand-drawn line glyphs that replace emojis: one stroke weight, one grid, so every
// symbol in the app looks like it came from the same pen.

import type { SVGProps } from "react";
import type { SignalKey } from "../lib/signals";

type P = SVGProps<SVGSVGElement> & { size?: number };

function G({ size = 24, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

const SIGNAL: Record<SignalKey, (p: P) => React.ReactElement> = {
  // a crescent and a small star
  sleep: (p) => <G {...p}><path d="M17.5 15.5A7 7 0 0 1 9 6a7 7 0 1 0 8.5 9.5z" /><path d="M17 4.5v3M15.5 6h3" /></G>,
  // three stacked books, the top one tilting
  pressure: (p) => <G {...p}><rect x="4" y="15.5" width="16" height="4" rx="1" /><rect x="5.5" y="11" width="13" height="4.5" rx="1" /><path d="M7.5 11l1.2-5.6 9.4 2-.6 3.6" /></G>,
  // two people, overlapping
  connection: (p) => <G {...p}><circle cx="9" cy="8.5" r="3" /><circle cx="15.5" cy="8.5" r="3" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M12.5 14.4c.9-.3 1.9-.4 3-.4 2.7 0 4.9 1.8 5.5 5" /></G>,
  // a battery, partly full
  energy: (p) => <G {...p}><rect x="3.5" y="7.5" width="15" height="9" rx="2" /><path d="M20.5 10.5v3" /><path d="M6.5 10.5v3M9.5 10.5v3" /></G>,
  // a sprout
  drive: (p) => <G {...p}><path d="M12 20v-8" /><path d="M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5z" /><path d="M12 14.5c0-3-2-5-5.5-5 0 3.5 2 5 5.5 5z" /></G>,
};

export function SignalGlyph({ k, ...p }: P & { k: SignalKey }) {
  const Glyph = SIGNAL[k];
  return <Glyph {...p} />;
}

/** Five faces from heavy to bright: only the mouth and brows change. */
export function MoodFace({ value, ...p }: P & { value: number }) {
  const mouth = [
    "M8.5 16.5c1-1.4 2.2-2 3.5-2s2.5.6 3.5 2",
    "M8.8 16c.9-.7 2-1 3.2-1s2.3.3 3.2 1",
    "M9 15.5h6",
    "M8.8 14.8c.9.8 2 1.2 3.2 1.2s2.3-.4 3.2-1.2",
    "M8.3 14c1 1.6 2.3 2.4 3.7 2.4s2.7-.8 3.7-2.4",
  ][value - 1];
  return (
    <G {...p}>
      <circle cx="12" cy="12" r="8.5" />
      {value === 1 ? (
        <path d="M8.3 9.6l1.9.6M15.7 9.6l-1.9.6" />
      ) : (
        <>
          <circle cx="9.3" cy="10" r=".6" fill="currentColor" />
          <circle cx="14.7" cy="10" r=".6" fill="currentColor" />
        </>
      )}
      <path d={mouth} />
    </G>
  );
}

export function BubbleGlyph(p: P) {
  return <G {...p}><circle cx="9" cy="10" r="4.5" /><circle cx="16.5" cy="15.5" r="3" /><circle cx="16" cy="6.5" r="1.5" /><path d="M7 8.5a2 2 0 0 1 1.5-1" /></G>;
}
export function ShredGlyph(p: P) {
  return <G {...p}><path d="M6 3.5h12v6H6z" /><path d="M4 9.5h16" /><path d="M7.5 12.5v5M10.5 12.5v7M13.5 12.5v4M16.5 12.5v6" /></G>;
}
export function RippleGlyph(p: P) {
  return <G {...p}><ellipse cx="12" cy="14" rx="2" ry="1.2" /><ellipse cx="12" cy="14" rx="5.5" ry="3.2" /><ellipse cx="12" cy="14" rx="9" ry="5.2" /><path d="M12 4v4" /></G>;
}
export function MirrorGlyph(p: P) {
  return <G {...p}><circle cx="12" cy="10" r="6" /><path d="M12 16v5M9.5 21h5" /><path d="M9.5 9.5c.4-1.3 1.3-2.2 2.5-2.5" /></G>;
}
