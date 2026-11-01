import { useState } from "react";
import { motion } from "framer-motion";

export default function BubbleWrap() {
  const [popped, setPopped] = useState<boolean[]>(
    Array(48).fill(false)
  );

  const playPop = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) return;

      const audio = new AudioContextClass();
      const buffer = audio.createBuffer(
        1,
        audio.sampleRate * 0.04,
        audio.sampleRate
      );

      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const volume = audio.createGain();

      source.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.value = 1000;

      volume.gain.setValueAtTime(0.15, audio.currentTime);
      volume.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + 0.04
      );

      source.connect(filter);
      filter.connect(volume);
      volume.connect(audio.destination);

      source.start();
      source.stop(audio.currentTime + 0.04);
      source.onended = () => audio.close();
    } catch {
      // The game still works if sound is unavailable.
    }
  };

  const popBubble = (index: number) => {
    if (popped[index]) return;

    playPop();

    setPopped((previous) =>
      previous.map((value, i) => (i === index ? true : value))
    );
  };

  const resetGame = () => {
    setPopped(Array(48).fill(false));
  };

  const allPopped = popped.every(Boolean);

  return (
    <div className="w-full rounded-3xl bg-[#8FB9A8] p-5 text-center shadow-sm">
      <p className="mb-5 text-sm text-[#263D35]">
        Pop slowly. Breathe out with each one.
      </p>

      <div className="grid grid-cols-8 gap-2">
        {popped.map((isPopped, index) => (
          <motion.button
            key={index}
            type="button"
            aria-label={`Bubble ${index + 1}${isPopped ? " popped" : ""}`}
            onClick={() => popBubble(index)}
            disabled={isPopped}
            whileTap={!isPopped ? { scale: 0.75 } : {}}
            className={`aspect-square min-h-10 rounded-full border-2 border-white/70 shadow-inner transition-colors ${
              isPopped
                ? "bg-[#6F9D8B] shadow-none"
                : "bg-[#D9EEE4] hover:bg-white"
            }`}
          />
        ))}
      </div>

      {allPopped && (
        <p className="mt-5 font-semibold text-[#263D35]">
          All popped. Lighter?
        </p>
      )}

      <button
        type="button"
        onClick={resetGame}
        className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#385B4D] hover:bg-[#F5F5F5]"
      >
        {allPopped ? "Wrap a new sheet" : "Reset"}
      </button>
    </div>
  );
}