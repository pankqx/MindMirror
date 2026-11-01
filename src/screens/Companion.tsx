import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { db } from "../lib/db";
import { chat, startTalk } from "../lib/hub";
import { contextFor } from "../lib/signals";
import { isCrisis } from "../lib/support";
import { useInsights } from "../lib/useInsights";
import UrgentHelp from "./UrgentHelp";
import Chat from "../components/Chat";

interface Msg { from: "me" | "mindmirror"; text: string; via?: "necklace" | "web"; at: string }

export default function Companion() {
  const ins = useInsights();
  const voice = useLiveQuery(() => db.voice.orderBy("at").toArray(), []);
  const [typed, setTyped] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [error, setError] = useState("");
  const stopRef = useRef<null | (() => Promise<void>)>(null);

  const msgs: Msg[] = [
    ...(voice ?? []).flatMap((v): Msg[] => [
      { from: "me", text: v.heard, via: v.source, at: v.at },
      { from: "mindmirror", text: v.reply, via: v.source, at: v.at + "z" },
    ]),
    ...typed,
  ].sort((a, b) => a.at.localeCompare(b.at));

  async function send(raw: string) {
    const t = raw.trim();
    if (!t || busy) return;
    setError("");
    const now = new Date().toISOString();
    setTyped((m) => [...m, { from: "me", text: t, at: now }]);
    if (isCrisis(t)) setCrisis(true);
    setBusy(true);
    try {
      const r = await chat(t, ins ? contextFor(ins) : "");
      if (r.crisis) setCrisis(true);
      setTyped((m) => [...m, { from: "mindmirror", text: r.reply, at: new Date().toISOString() }]);
    } catch {
      setError("Can't reach the hub. Is it running on this laptop?");
    } finally {
      setBusy(false);
    }
  }

  async function holdStart() {
    setError("");
    try {
      stopRef.current = await startTalk();
    } catch {
      setError("Microphone not available.");
    }
  }

  async function holdEnd() {
    const stop = stopRef.current;
    stopRef.current = null;
    if (!stop) return;
    setBusy(true);
    try {
      await stop(); // the turn arrives through /events and is saved by App
    } catch {
      setError("Can't reach the hub. Is it running on this laptop?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {(crisis || ins?.crisis) && <UrgentHelp />}
      <Chat
        messages={msgs.map(({ from, text, via }) => ({ from, text, via }))}
        onSend={(t) => void send(t)}
        onHoldStart={() => void holdStart()}
        onHoldEnd={() => void holdEnd()}
      />
      {busy && <p className="text-sm opacity-60">{"\u{1F33F}"} thinking…</p>}
      {error && <p className="text-sm text-[#E8836B]">{error}</p>}
    </div>
  );
}
