// "Just heard": the signals the latest voice turn touched, for a couple of minutes
// after it lands. The toast, Home and Insights use it to show that what you said
// out loud went straight into your signals.

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db, type VoiceTurn } from "./db";
import { VOICE_TAG, type SignalKey } from "./signals";

const FRESH_MS = 2 * 60 * 1000;

/** Signal keys a voice turn touched, in the engine's order. */
export function keysOf(turn: Pick<VoiceTurn, "signals">): SignalKey[] {
  return (Object.keys(VOICE_TAG) as SignalKey[]).filter((k) => turn.signals.includes(VOICE_TAG[k].tag));
}

export interface Fresh {
  keys: Set<SignalKey>;
  turn: VoiceTurn | null;
}

const NONE: Fresh = { keys: new Set(), turn: null };

export function useFresh(): Fresh {
  const last = useLiveQuery(() => db.voice.toCollection().last(), []);
  const [now, setNow] = useState(() => Date.now());
  const age = last ? now - Date.parse(last.at) : Infinity;

  useEffect(() => {
    if (!(age < FRESH_MS)) return;
    const t = window.setTimeout(() => setNow(Date.now()), FRESH_MS - age + 50);
    return () => window.clearTimeout(t);
  }, [age]);

  // a new turn arriving resets the clock
  useEffect(() => setNow(Date.now()), [last?.id]);

  if (!last || !(age < FRESH_MS) || age < -5000) return NONE;
  return { keys: new Set(keysOf(last)), turn: last };
}
