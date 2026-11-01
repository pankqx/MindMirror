import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { db } from "../lib/db";
import { chat, startTalk } from "../lib/hub";
import { contextFor } from "../lib/signals";
import { isCrisis } from "../lib/support";
import { useInsights } from "../lib/useInsights";
import UrgentHelp from "./UrgentHelp";

interface Msg { from: "me" | "mindmirror"; text: string; via?: "necklace" | "web"; at: string }

// Temporary bubbles; swap for Kishore's Chat component when it lands.
export default function Companion() {
  const ins = useInsights();
  const voice = useLiveQuery(() => db.voice.orderBy("at").toArray(), []);
  const [typed, setTyped] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [error, setError] = useState("");
  const stopRef = useRef<null | (() => Promise<void>)>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const msgs: Msg[] = [
    ...(voice ?? []).flatMap((v): Msg[] => [
      { from: "me", text: v.heard, via: v.source, at: v.at },
      { from: "mindmirror", text: v.reply, via: v.source, at: v.at + "z" },
    ]),
    ...typed,
  ].sort((a, b) => a.at.localeCompare(b.at));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  async function send() {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
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
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      {(crisis || ins?.crisis) && <UrgentHelp />}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {msgs.length === 0 && <p className="text-center text-sm opacity-60">Say anything. I'm listening.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={m.from === "me" ? "text-right" : "text-left"}>
            {m.via === "necklace" && m.from === "me" && <p className="text-xs opacity-60">{"\u{1F399}"} from necklace</p>}
            <span className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 text-left ${
              m.from === "me" ? "bg-[#4F5BD5] text-white" : "bg-white shadow-sm"}`}>
              {m.from === "mindmirror" && "\u{1F33F} "}{m.text}
            </span>
          </div>
        ))}
        {busy && <p className="text-sm opacity-60">{"\u{1F33F}"} thinking…</p>}
        <div ref={endRef} />
      </div>
      {error && <p className="text-sm text-[#E8836B]">{error}</p>}
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type how you feel…" className="flex-1 rounded-full bg-white px-4 py-3 shadow-sm outline-none" />
        <button onClick={send} disabled={busy} className="rounded-full bg-[#4F5BD5] px-5 text-white min-h-11">Send</button>
      </div>
      <button
        onPointerDown={holdStart} onPointerUp={holdEnd} onPointerLeave={holdEnd}
        className="mx-auto h-20 w-20 rounded-full bg-[#8FB9A8] text-white shadow-md active:scale-110 select-none">
        {"\u{1F399}"}<br /><span className="text-xs">Hold to talk</span>
      </button>
    </div>
  );
}
