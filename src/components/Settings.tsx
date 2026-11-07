import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { copy } from "../content/copy";
import { deleteAllData } from "../lib/db";
import { speakReply, unlockAudio } from "../lib/hub";
import { setPrefs, usePrefs, type ThemeChoice } from "../lib/prefs";
import { brainName } from "../lib/brain";
import { loadSample } from "../lib/sample";
import { CloseIcon, SpeakerIcon, TrashIcon } from "./Icons";
import { spring } from "./ui";

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div role="dialog" aria-label={title}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] max-w-[520px] overflow-y-auto rounded-t-[2rem] border border-line bg-bg p-6 pb-10 shadow-soft"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}>
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-card text-soft"><CloseIcon size={18} /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Segmented<T extends string>({ value, options, onChange, id }: { value: T; options: [T, string][]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="grid rounded-2xl bg-card-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className={`relative min-h-11 rounded-xl text-sm font-semibold ${value === v ? "text-ink" : "text-faint"}`}>
          {value === v && <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-xl bg-card shadow-soft" />}
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  );
}

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div>
        <p className="font-semibold">{title}</p>
        {hint && <p className="text-sm text-soft">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = usePrefs();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState("");

  const flash = (s: string) => {
    setDone(s);
    window.setTimeout(() => setDone(""), 2200);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="space-y-7">
        <Row title="Theme">
          <Segmented id="theme" value={p.theme} onChange={(theme: ThemeChoice) => setPrefs({ theme })}
            options={[["system", "Auto"], ["light", "Light"], ["dark", "Dark"]]} />
        </Row>

        <Row title="Your name" hint="Only used for the greeting. Stays on this device.">
          <input value={p.name} onChange={(e) => setPrefs({ name: e.target.value.slice(0, 30) })} placeholder="Your first name"
            className="min-h-12 w-full rounded-2xl border border-line bg-card px-4 outline-none focus:border-indigo" />
        </Row>

        <Row title="Necklace replies" hint="The laptop speaker says the reply out loud when you talk through the necklace.">
          <Segmented id="voice" value={p.voiceReplies ? "on" : "off"} onChange={(v) => setPrefs({ voiceReplies: v === "on" })}
            options={[["on", "Speak on laptop"], ["off", "Text only"]]} />
          <button onClick={() => { unlockAudio(); void speakReply("Hi, I'm MindMirror. I'll speak your necklace replies here."); }}
            className="flex items-center gap-2 text-sm font-semibold text-indigo">
            <SpeakerIcon size={18} /> Test the laptop voice
          </button>
        </Row>

        <Row title="AI brain" hint={`Without the laptop hub, replies come from: ${brainName()}. For faster, smarter replies paste a free Groq key (console.groq.com) or an OpenRouter key. It stays only in this browser. What you say is sent to that AI to write the reply.`}>
          <input value={p.aiKey} onChange={(e) => setPrefs({ aiKey: e.target.value.trim().slice(0, 200) })} type="password" autoComplete="off" spellCheck={false}
            placeholder="gsk_… or sk-or-… (optional)" className="min-h-12 w-full rounded-2xl border border-line bg-card px-4 font-mono text-sm outline-none focus:border-indigo" />
        </Row>

        <Row title="Campus counsellor" hint="Shown on the Support screen.">
          <input value={p.counsellor} onChange={(e) => setPrefs({ counsellor: e.target.value.slice(0, 40) })} inputMode="tel"
            placeholder="Phone number" className="min-h-12 w-full rounded-2xl border border-line bg-card px-4 outline-none focus:border-indigo" />
        </Row>

        <Row title="Your data" hint="Everything is saved only in this browser. Nothing is uploaded.">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={async () => { await loadSample(); flash("Loaded Asha's 3 weeks"); }}
              className="min-h-12 rounded-2xl border border-line bg-card px-3 text-sm font-semibold text-indigo">Load sample (Asha)</button>
            {!confirm ? (
              <button onClick={() => setConfirm(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-semibold text-coral-ink">
                <TrashIcon size={17} /> Delete all
              </button>
            ) : (
              <button onClick={async () => { await deleteAllData(); setConfirm(false); flash("All data deleted"); }}
                className="min-h-12 rounded-2xl bg-coral px-3 text-sm font-semibold text-white">Tap again to delete</button>
            )}
          </div>
          <AnimatePresence>
            {done && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-sage-ink">
                {done}
              </motion.p>
            )}
          </AnimatePresence>
        </Row>

        <button onClick={() => { setPrefs({ welcomed: false }); onClose(); }} className="text-sm font-semibold text-soft underline-offset-4 hover:underline">
          Show the welcome again
        </button>

        <p className="text-xs leading-relaxed text-faint">{copy.disclaimer} Built by K S Pankaj, Merel Riha D&apos;souza and Kishore Krishna (Team HTTP Dino).</p>
      </div>
    </Sheet>
  );
}
