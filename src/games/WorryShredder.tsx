import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WorryShredder() {
  const [note, setNote] = useState("");
  const [shredding, setShredding] = useState(false);
  const [done, setDone] = useState(false);

  const shred = () => {
    if (!note.trim()) return;
    setShredding(true);

    setTimeout(() => {
      setShredding(false);
      setDone(true);
    }, 1800);
  };

  const reset = () => {
    setNote("");
    setDone(false);
    setShredding(false);
  };

  return (
    <div className="w-full rounded-3xl bg-[#FBF7F0] p-6 text-center shadow-sm">
      <h2 className="mb-2 text-xl font-bold text-[#34365F]">
        Worry shredder
      </h2>

      {!done ? (
        <>
          <p className="mb-4 text-sm text-gray-600">
            What's weighing on you?
          </p>

          <AnimatePresence>
            {!shredding && (
              <motion.textarea
                initial={{ opacity: 1 }}
                exit={{ y: 120, opacity: 0, rotate: 8 }}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 140))}
                maxLength={140}
                placeholder="Write it down here..."
                className="mb-2 min-h-32 w-full rounded-2xl border border-[#D9D4C9] bg-white p-4 text-gray-700 outline-none focus:ring-2 focus:ring-[#8FB9A8]"
              />
            )}
          </AnimatePresence>

          <p className="mb-4 text-right text-xs text-gray-400">
            {note.length}/140
          </p>

          <div className="mb-5 rounded-t-xl bg-[#34365F] p-3 text-white">
            {shredding ? "Shredding..." : "SHREDDER"}
          </div>

          <button
            onClick={shred}
            disabled={!note.trim() || shredding}
            className="rounded-full bg-[#4F5BD5] px-7 py-3 font-semibold text-white disabled:opacity-40"
          >
            Shred it
          </button>
        </>
      ) : (
        <>
          <p className="my-8 text-[#385B4D]">
            It's still real, but it's lighter in your hands now.
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-[#4F5BD5] px-7 py-3 font-semibold text-white"
          >
            Write another
          </button>
        </>
      )}
    </div>
  );
}